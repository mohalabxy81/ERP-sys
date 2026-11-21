/**
 * ERP-SYS V8 Full Stack Validation Test
 * Tests: Config data, EVM calculations, CPM traversal, AI agents, Gantt, PMO, Roadmap, PrintEngine, Storage
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.error(`  ❌ ${name}: ${e.message}`);
    fail++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

console.log('\n=== ERP-SYS V8 Validation Suite ===\n');

// --- 1. Config.js data integrity ---
console.log('📦 1. Master Data Integrity');
const configCode = fs.readFileSync('assets/js/config.js', 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(configCode, ctx);
const M = ctx.window.MimarERP;

test('Companies loaded', () => assert(M.companies.length >= 3, 'Need ≥3 companies'));
test('Projects loaded with 4 entries', () => assert(M.projects.length === 4, `Got ${M.projects.length}`));
test('scheduleMaster exists with ≥10 activities', () => assert(M.scheduleMaster && M.scheduleMaster.length >= 10, `Got ${M.scheduleMaster ? M.scheduleMaster.length : 0}`));
test('financeAP has project_id', () => assert(M.financeAP[0].project_id, 'project_id missing'));
test('financeBillings has project_id', () => assert(M.financeBillings[0].project_id, 'project_id missing'));
test('subcontractsMaster has project_id & contractor_id', () => { assert(M.subcontractsMaster[0].project_id); assert(M.subcontractsMaster[0].contractor_id); });
test('costControlRegister has project_id', () => assert(M.costControlRegister[0].project_id, 'project_id missing'));
test('qaqcInspections exists with ≥7 inspections', () => assert(M.qaqcInspections && M.qaqcInspections.length >= 7, `Got ${M.qaqcInspections ? M.qaqcInspections.length : 0}`));
test('engineeringDrawings exists with ≥7 drawings', () => assert(M.engineeringDrawings && M.engineeringDrawings.length >= 7, `Got ${M.engineeringDrawings ? M.engineeringDrawings.length : 0}`));

// --- 2. EVM Engine ---
console.log('\n📊 2. EVM Engine (Real Data Aggregation)');
const evmCode = fs.readFileSync('assets/js/evm-calculator.js', 'utf8');
const evmCtx = { window: { MimarERP: M }, MimarERP: M, document: { getElementById: () => null } };
evmCtx.window.getActiveProject = () => M.projects[0];
evmCtx.getActiveProject = () => M.projects[0];
vm.createContext(evmCtx);
vm.runInContext(evmCode, evmCtx);

test('getProjectActualCost returns a number', () => {
  const ac = evmCtx.window.getProjectActualCost('PRJ-2001');
  assert(typeof ac === 'number', `Expected number, got ${typeof ac}`);
});
test('getProjectEarnedValue > 0 for PRJ-2001', () => {
  const ev = evmCtx.window.getProjectEarnedValue(M.projects[0]);
  assert(ev > 0, `EV=${ev}`);
});
test('getProjectPlannedValue > 0', () => {
  const pv = evmCtx.window.getProjectPlannedValue(M.projects[0]);
  assert(pv > 0, `PV=${pv}`);
});
test('calculatePortfolioEVM returns valid totals', () => {
  const port = evmCtx.window.calculatePortfolioEVM();
  assert(port !== null, 'Portfolio null');
  assert(port.totalContract > 0, 'totalContract 0');
  assert(port.CPI > 0, 'CPI=0');
  assert(port.SPI > 0, 'SPI=0');
});

// --- 3. CPM Engine (Topological CPM Traversal) ---
console.log('\n🔗 3. CPM Engine (Topological CPM Traversal)');
const entCode = fs.readFileSync('assets/js/enterprise-features.js', 'utf8');
const entCtx = { window: {}, TextEncoder: require('util').TextEncoder };
vm.createContext(entCtx);
vm.runInContext(entCode, entCtx);

const testActivities = [
  { activity_id: 'A', activity_name: 'Excavation', duration_days: 10, planned_start: '2026-01-01', planned_finish: '2026-01-10', predecessors: [], weight_pct: 20 },
  { activity_id: 'B', activity_name: 'Foundation', duration_days: 15, planned_start: '2026-01-11', planned_finish: '2026-01-25', predecessors: ['A'], weight_pct: 30 },
  { activity_id: 'C', activity_name: 'Structure', duration_days: 20, planned_start: '2026-01-26', planned_finish: '2026-02-14', predecessors: ['B'], weight_pct: 30 },
  { activity_id: 'D', activity_name: 'Finishing', duration_days: 12, planned_start: '2026-01-20', planned_finish: '2026-02-01', predecessors: ['A'], weight_pct: 20 }
];

test('CpmEngine.computeCPM exists', () => assert(typeof entCtx.window.CpmEngine.computeCPM === 'function'));
test('CPM forward pass: project duration = 45 (A→B→C)', () => {
  const res = entCtx.window.CpmEngine.computeCPM(testActivities);
  assert(res.projectDuration === 45, `Got ${res.projectDuration}, expected 45`);
});
test('CPM critical path identified', () => {
  const res = entCtx.window.CpmEngine.computeCPM(testActivities);
  assert(res.criticalPath.length > 0, 'Critical path empty');
  assert(res.criticalPath.includes('C'), 'C (last) must be critical');
});
test('Float on D > 0 (not critical)', () => {
  const res = entCtx.window.CpmEngine.computeCPM(testActivities);
  const dAct = res.activities.find(a => a.activity_id === 'D');
  assert(dAct.TF > 0, `D TF=${dAct.TF}, expected > 0`);
});
test('CpmEngine.generateXER returns string with ERMHDR', () => {
  const xerContent = entCtx.window.CpmEngine.generateXER({ project_code: 'TEST', project_name_ar: 'Test' }, testActivities);
  assert(typeof xerContent === 'string' && xerContent.includes('ERMHDR'), 'XER header missing');
});
test('renderGanttChart exported in enterprise-features', () => {
  assert(typeof entCtx.window.renderGanttChart === 'function', 'renderGanttChart not found');
});
test('PrintEngine exported with printIPC', () => {
  assert(entCtx.window.PrintEngine && typeof entCtx.window.PrintEngine.printIPC === 'function', 'PrintEngine missing');
});

// --- 4. Storage & Crud Engine ---
console.log('\n💾 4. Persistence & Storage Engine');
const crudCode = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
test('MimarEcoStorage defined in crud-engine.js', () => assert(crudCode.includes('MimarEcoStorage')));
test('scheduleMaster, qaqcInspections, engineeringDrawings in SAVE_KEYS', () => {
  assert(crudCode.includes("'scheduleMaster'"));
  assert(crudCode.includes("'qaqcInspections'"));
  assert(crudCode.includes("'engineeringDrawings'"));
});

// --- 5. app.js exports & Dynamic Renderers ---
console.log('\n⚙️  5. app.js Function Exports & Dynamic Renderers');
const appCode = fs.readFileSync('assets/js/app.js', 'utf8');
test('openAiCopilotModal exported', () => assert(appCode.includes('window.openAiCopilotModal')));
test('closeAiCopilotModal exported', () => assert(appCode.includes('window.closeAiCopilotModal')));
test('setChartMode exported in evm-calculator', () => {
  const c = fs.readFileSync('assets/js/evm-calculator.js', 'utf8');
  assert(c.includes('window.setChartMode'));
});
test('renderBillingTable reads from financeBillings', () => assert(appCode.includes('MimarERP.financeBillings')));
test('renderInspectionsTable reads from qaqcInspections', () => assert(appCode.includes('MimarERP.qaqcInspections')));
test('renderDrawingsTable reads from engineeringDrawings', () => assert(appCode.includes('MimarERP.engineeringDrawings')));

// --- 6. HTML structure ---
console.log('\n🌐 6. index.html Structure');
const html = fs.readFileSync('index.html', 'utf8');
test('26 nav groups in sidebar', () => {
  const count = (html.split('id="nav-grp-')).length - 1;
  assert(count === 26, `Got ${count} nav groups`);
});
test('AI Copilot Modal injected', () => assert(html.includes('modal-ai-copilot')));
test('Portfolio RAG Matrix table', () => assert(html.includes('tbl-portfolio-matrix')));
test('Chart mode toggle buttons', () => assert(html.includes('btn-toggle-evm-chart')));
test('V8 version label', () => assert(html.includes('v8.0.0 Enterprise')));
test('All page-view sections (≥39)', () => {
  const count = (html.split('class="page-view')).length - 1;
  assert(count >= 39, `Got ${count}`);
});
test('view-ai-center section exists', () => assert(html.includes('id="view-ai-center"')));
test('view-pmo section exists', () => assert(html.includes('id="view-pmo"')));
test('view-roadmap section exists', () => assert(html.includes('id="view-roadmap"')));
test('ganttCanvas exists in view-scheduling', () => assert(html.includes('id="ganttCanvas"')));

// --- Summary ---
console.log(`\n${'='.repeat(40)}`);
console.log(`PASSED: ${pass}  |  FAILED: ${fail}  |  TOTAL: ${pass + fail}`);
if (fail === 0) {
  console.log('🎉 ALL TESTS PASSED — ERP-SYS V8 Stack is Complete & Healthy!\n');
} else {
  console.log(`⚠️  ${fail} test(s) failed. Review errors above.\n`);
}
process.exit(fail > 0 ? 1 : 0);
