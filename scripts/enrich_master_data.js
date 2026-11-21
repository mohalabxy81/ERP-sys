const fs = require('fs');

const configPath = 'assets/js/config.js';
let content = fs.readFileSync(configPath, 'utf8');

// We evaluate or parse the JS to get MimarERP object safely
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(content, sandbox);
const MimarERP = sandbox.window.MimarERP;

// Enrich financeBillings with project_id and company_id
MimarERP.financeBillings.forEach(item => {
  if (item.project && item.project.includes('برج الصحافة')) {
    item.project_id = 'PRJ-2002';
    item.company_id = 'CMP-1001';
  } else if (item.project && item.project.includes('الغروب')) {
    item.project_id = 'PRJ-2001';
    item.company_id = 'CMP-1001';
  } else if (item.project && item.project.includes('جدة')) {
    item.project_id = 'PRJ-2003';
    item.company_id = 'CMP-1002';
  } else {
    item.project_id = 'PRJ-2004';
    item.company_id = 'CMP-1001';
  }
  item.gross_amount = item.amount;
  item.retention_amount = Math.round(item.amount * 0.10);
  item.advance_recovery = Math.round(item.amount * 0.05);
  item.vat_amount = Math.round(item.amount * 0.15);
  item.net_amount = item.amount - item.retention_amount - item.advance_recovery + item.vat_amount;
});

// Enrich financeAP with project_id, company_id, cost_code, supplier_id
const apMeta = [
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', cost_code: 'CC-03-01', supplier_id: 'SUP-01' },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', cost_code: 'CC-09-03', supplier_id: 'SUP-02' },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', cost_code: 'CC-09-05', supplier_id: 'SUP-03' },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', cost_code: 'CC-07-01', supplier_id: 'SUP-04' },
  { project_id: 'PRJ-2002', company_id: 'CMP-1001', cost_code: 'CC-03-02', supplier_id: 'SUP-05' },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', cost_code: 'CC-07-02', supplier_id: 'CTR-201' },
  { project_id: 'PRJ-2002', company_id: 'CMP-1001', cost_code: 'CC-05-01', supplier_id: 'SUP-06' }
];

MimarERP.financeAP.forEach((item, idx) => {
  const meta = apMeta[idx] || apMeta[0];
  item.project_id = meta.project_id;
  item.company_id = meta.company_id;
  item.cost_code = meta.cost_code;
  item.supplier_id = meta.supplier_id;
  item.subtotal = Math.round(item.amount / 1.15);
  item.vat_amount = item.amount - item.subtotal;
  item.zatca_uuid = `ZATCA-AP-${1000 + idx}`;
});

// Enrich subcontractsMaster
const subMeta = [
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', contractor_id: 'CTR-201', cost_code: 'CC-07-02', wbs_code: 'WBS-07.1', rating: 92 },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', contractor_id: 'CTR-202', cost_code: 'CC-08-01', wbs_code: 'WBS-08.1', rating: 88 },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', contractor_id: 'CTR-203', cost_code: 'CC-09-04', wbs_code: 'WBS-09.2', rating: 90 },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', contractor_id: 'CTR-204', cost_code: 'CC-09-03', wbs_code: 'WBS-09.3', rating: 85 },
  { project_id: 'PRJ-2001', company_id: 'CMP-1001', contractor_id: 'CTR-205', cost_code: 'CC-09-05', wbs_code: 'WBS-09.4', rating: 94 },
  { project_id: 'PRJ-2002', company_id: 'CMP-1001', contractor_id: 'CTR-206', cost_code: 'CC-03-01', wbs_code: 'WBS-01.1', rating: 91 },
  { project_id: 'PRJ-2002', company_id: 'CMP-1001', contractor_id: 'CTR-207', cost_code: 'CC-05-01', wbs_code: 'WBS-01.2', rating: 87 },
  { project_id: 'PRJ-2002', company_id: 'CMP-1001', contractor_id: 'CTR-208', cost_code: 'CC-14-01', wbs_code: 'WBS-02.1', rating: 95 },
  { project_id: 'PRJ-2003', company_id: 'CMP-1002', contractor_id: 'CTR-209', cost_code: 'CC-15-01', wbs_code: 'WBS-03.1', rating: 89 },
  { project_id: 'PRJ-2003', company_id: 'CMP-1002', contractor_id: 'CTR-210', cost_code: 'CC-16-01', wbs_code: 'WBS-03.2', rating: 86 }
];

MimarERP.subcontractsMaster.forEach((item, idx) => {
  const meta = subMeta[idx] || subMeta[0];
  item.project_id = meta.project_id;
  item.company_id = meta.company_id;
  item.contractor_id = meta.contractor_id;
  item.cost_code = meta.cost_code;
  item.wbs_code = meta.wbs_code;
  item.performance_rating = meta.rating;
});

// Enrich costControlRegister with project_id
MimarERP.costControlRegister.forEach((item, idx) => {
  item.project_id = idx < 4 ? 'PRJ-2002' : 'PRJ-2001';
  item.company_id = 'CMP-1001';
  item.cost_code = `CC-${item.wbs_code.replace('WBS-', '')}`;
});

// Add scheduleMaster (comprehensive CPM activities)
MimarERP.scheduleMaster = [
  {
    activity_id: 'ACT-101',
    project_id: 'PRJ-2001',
    wbs_code: 'WBS-09.1',
    activity_name: 'أعمال لياسة الحوائط الداخلية',
    duration_days: 30,
    planned_start: '2026-02-01',
    planned_finish: '2026-03-02',
    predecessors: [],
    relation_type: 'FS',
    weight_pct: 20.5,
    actual_progress_pct: 100,
    budget: 35000,
    status: 'مكتمل'
  },
  {
    activity_id: 'ACT-102',
    project_id: 'PRJ-2001',
    wbs_code: 'WBS-09.2',
    activity_name: 'أعمال تركيب السيراميك والبورسلان',
    duration_days: 25,
    planned_start: '2026-03-03',
    planned_finish: '2026-03-28',
    predecessors: ['ACT-101'],
    relation_type: 'FS',
    weight_pct: 24.2,
    actual_progress_pct: 75,
    budget: 42000,
    status: 'جاري العمل'
  },
  {
    activity_id: 'ACT-103',
    project_id: 'PRJ-2001',
    wbs_code: 'WBS-09.3',
    activity_name: 'أعمال دهانات الجدران والأسقف الداخلية',
    duration_days: 20,
    planned_start: '2026-03-29',
    planned_finish: '2026-04-18',
    predecessors: ['ACT-102'],
    relation_type: 'FS',
    weight_pct: 18.0,
    actual_progress_pct: 40,
    budget: 25000,
    status: 'جاري العمل'
  },
  {
    activity_id: 'ACT-104',
    project_id: 'PRJ-2001',
    wbs_code: 'WBS-08.1',
    activity_name: 'تركيب قطاعات الألمنيوم والواجهات الزجاجية',
    duration_days: 22,
    planned_start: '2026-03-10',
    planned_finish: '2026-04-01',
    predecessors: ['ACT-101'],
    relation_type: 'SS',
    weight_pct: 15.3,
    actual_progress_pct: 50,
    budget: 28000,
    status: 'جاري العمل'
  },
  {
    activity_id: 'ACT-105',
    project_id: 'PRJ-2001',
    wbs_code: 'WBS-07.1',
    activity_name: 'أعمال العزل المائي والحراري للأسطح',
    duration_days: 15,
    planned_start: '2026-04-02',
    planned_finish: '2026-04-17',
    predecessors: ['ACT-104'],
    relation_type: 'FS',
    weight_pct: 12.0,
    actual_progress_pct: 20,
    budget: 18000,
    status: 'مخطط'
  },
  {
    activity_id: 'ACT-106',
    project_id: 'PRJ-2001',
    wbs_code: 'WBS-09.4',
    activity_name: 'التسليم الابتدائي وإعداد قائمة الملاحظات (Punch List)',
    duration_days: 10,
    planned_start: '2026-04-19',
    planned_finish: '2026-04-29',
    predecessors: ['ACT-103', 'ACT-105'],
    relation_type: 'FS',
    weight_pct: 10.0,
    actual_progress_pct: 0,
    budget: 12000,
    status: 'مخطط'
  },
  // PRJ-2002 Activities
  {
    activity_id: 'ACT-201',
    project_id: 'PRJ-2002',
    wbs_code: 'WBS-01.1',
    activity_name: 'أعمال صب الأعمدة والأسقف الخرسانية للأدوار المتكررة',
    duration_days: 90,
    planned_start: '2026-01-01',
    planned_finish: '2026-03-31',
    predecessors: [],
    relation_type: 'FS',
    weight_pct: 35.0,
    actual_progress_pct: 85,
    budget: 12000000,
    status: 'جاري العمل'
  },
  {
    activity_id: 'ACT-202',
    project_id: 'PRJ-2002',
    wbs_code: 'WBS-01.2',
    activity_name: 'توريد وتركيب هياكل الكرتن وول والواجهات الزجاجية',
    duration_days: 60,
    planned_start: '2026-04-01',
    planned_finish: '2026-05-30',
    predecessors: ['ACT-201'],
    relation_type: 'FS',
    weight_pct: 25.0,
    actual_progress_pct: 30,
    budget: 9500000,
    status: 'جاري العمل'
  },
  {
    activity_id: 'ACT-203',
    project_id: 'PRJ-2002',
    wbs_code: 'WBS-02.1',
    activity_name: 'أعمال التكييف المركزي ومجاري الهواء HVAC',
    duration_days: 75,
    planned_start: '2026-03-15',
    planned_finish: '2026-05-28',
    predecessors: ['ACT-201'],
    relation_type: 'SS',
    weight_pct: 20.0,
    actual_progress_pct: 45,
    budget: 7000000,
    status: 'جاري العمل'
  },
  {
    activity_id: 'ACT-204',
    project_id: 'PRJ-2002',
    wbs_code: 'WBS-02.2',
    activity_name: 'شبكات مكافحة الحريق والرش الآلي',
    duration_days: 45,
    planned_start: '2026-05-29',
    planned_finish: '2026-07-12',
    predecessors: ['ACT-203'],
    relation_type: 'FS',
    weight_pct: 20.0,
    actual_progress_pct: 10,
    budget: 6000000,
    status: 'مخطط'
  }
];

// Write back updated config.js
const header = `/* ==========================================================================
   CONFIG.JS - Master Multi-Tenant State & Domain Datasets
   ERP-SYS V8 Enterprise Construction Operating System (ECOS)
   Normalized Relational Keys: Company, Branch, Project, CostCode, Partner
   ========================================================================== */
window.MimarERP = ${JSON.stringify(MimarERP, null, 2)};
`;

fs.writeFileSync(configPath, header, 'utf8');
console.log('Successfully enriched config.js with relational keys and scheduleMaster!');
