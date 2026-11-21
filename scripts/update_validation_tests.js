const fs = require('fs');

let content = fs.readFileSync('scripts/v8_validation.js', 'utf8');

const targetStr = `// --- Summary ---`;
const newTests = `console.log('\\n🛡️  9. Audit & Data Integrity Hardening');
test('Zero Math.random in app.js and evm-calculator.js', () => {
  const appCode = fs.readFileSync('assets/js/app.js', 'utf8');
  const evmCode = fs.readFileSync('assets/js/evm-calculator.js', 'utf8');
  assert(!appCode.includes('Math.random()'), 'app.js still contains Math.random()');
  assert(!evmCode.includes('Math.random()'), 'evm-calculator.js still contains Math.random()');
});
test('CVR schema unification in renderCVRLedger', () => {
  const appCode = fs.readFileSync('assets/js/app.js', 'utf8');
  assert(appCode.includes('r.project_id || r.projectId'), 'CVR project_id mapping missing');
  assert(appCode.includes('r.internal_earned_value'), 'CVR internal_earned_value mapping missing');
  assert(appCode.includes('r.actual_cost_to_date'), 'CVR actual_cost_to_date mapping missing');
});
test('CDE schema unification in renderCDEContainers and advanceCDEState', () => {
  const appCode = fs.readFileSync('assets/js/app.js', 'utf8');
  assert(appCode.includes('d.doc_number || d.docNumber'), 'CDE doc_number mapping missing');
  assert(appCode.includes('getNormalizedState'), 'CDE getNormalizedState missing');
});
test('CSV Formula Injection protection in exportTableToExcel', () => {
  const appCode = fs.readFileSync('assets/js/app.js', 'utf8');
  assert(appCode.includes('^[=\\\\+\\\\-@]') || appCode.includes('/^[=+\\-@]/') || appCode.includes('/^[=\\+\\-@]/'), 'CSV formula injection neutralization missing');
});
test('ERP_PERSIST_KEYS contains complete entity keys', () => {
  const appCode = fs.readFileSync('assets/js/app.js', 'utf8');
  assert(appCode.includes('scheduleMaster') && appCode.includes('qaqcInspections') && appCode.includes('claimsMaster'), 'ERP_PERSIST_KEYS incomplete');
});

// --- Summary ---`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newTests);
  fs.writeFileSync('scripts/v8_validation.js', content, 'utf8');
  console.log('v8_validation.js updated with Audit & Integrity Hardening tests.');
} else {
  console.error('Target string not found in v8_validation.js');
}
