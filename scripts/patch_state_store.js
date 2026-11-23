const fs = require('fs');

console.log('=== Patching state-store.js and Storage Unification ===\n');

let storeCode = fs.readFileSync('assets/js/core/state-store.js', 'utf8');

// 1. Add rehydrateFromMimarERP to EnterpriseStore class
const rehydrateMethod = `
    rehydrateFromMimarERP() {
      if (!window.MimarERP) return;
      const m = window.MimarERP;
      const s = this._state;
      if (!s) return;
      if (m.subcontractsMaster) s.commercial.subcontracts = m.subcontractsMaster;
      if (m.tenderPackagesMaster) s.commercial.tenderPackages = m.tenderPackagesMaster;
      if (m.contractorsMaster) s.commercial.contractors = m.contractorsMaster;
      if (m.contractorRatesMaster) s.commercial.contractorRates = m.contractorRatesMaster;
      if (m.suppliersMaster) s.supplyChain.suppliers = m.suppliersMaster;
      if (m.supplierItemsMaster) s.supplyChain.supplierItems = m.supplierItemsMaster;
      if (m.partnerCatalog) s.supplyChain.partnerCatalog = m.partnerCatalog;
      if (m.priceComparisonMaster) s.supplyChain.priceComparisons = m.priceComparisonMaster;
      if (m.purchaseOrders) s.supplyChain.purchaseOrders = m.purchaseOrders;
      if (m.inventoryLedger) s.supplyChain.inventory = m.inventoryLedger;
      if (m.projects) s.engineering.projects = m.projects;
      if (m.wbs) s.engineering.wbs = m.wbs;
      if (m.boq) s.engineering.boq = m.boq;
      if (m.takeoff) s.engineering.takeoff = m.takeoff;
      if (m.rateAnalysis) s.engineering.rateAnalysis = m.rateAnalysis;
      if (m.bimElements) s.engineering.bimElements = m.bimElements;
      if (m.bimClashesMaster) s.engineering.clashes = m.bimClashesMaster;
      if (m.rebarBBSItems) s.engineering.rebarBBS = m.rebarBBSItems;
      if (m.billing) s.finance.billing = m.billing;
      if (m.financeBillings) s.finance.financeBillings = m.financeBillings;
      if (m.financeAP) s.finance.financeAP = m.financeAP;
      if (m.financeBudget) s.finance.financeBudget = m.financeBudget;
      if (m.cvrLedgerMaster) s.finance.cvrLedger = m.cvrLedgerMaster;
      if (m.costControlRegister) s.finance.costControl = m.costControlRegister;
      if (m.siteDiaryLogs) s.fieldOps.siteDiary = m.siteDiaryLogs;
      if (m.punchListItems) s.fieldOps.punchList = m.punchListItems;
      if (m.rfiList) s.fieldOps.rfis = m.rfiList;
      if (m.submittalsList) s.fieldOps.submittals = m.submittalsList;
      if (m.safetyIncidents) s.fieldOps.safetyIncidents = m.safetyIncidents;
      if (m.scheduleMaster) s.fieldOps.scheduleMaster = m.scheduleMaster;
      if (m.currentCompanyId) s.context.currentCompanyId = m.currentCompanyId;
      if (m.currentProjectId) s.context.currentProjectId = m.currentProjectId;
      if (m.currentRole) s.context.currentRole = m.currentRole;
    }
`;

storeCode = storeCode.replace('getState() {', rehydrateMethod + '\n    getState() {');

// 2. Fix CATALOG_ITEM_ADD and CATALOG_ADD_ITEM
storeCode = storeCode.replace(
  "case 'CATALOG_ITEM_ADD':",
  "case 'CATALOG_ITEM_ADD':\n        case 'CATALOG_ADD_ITEM':"
);

// 3. Update storage key to MimarERPData_v8
storeCode = storeCode.replace("this._storageKey = 'MimarERPData_v6';", "this._storageKey = 'MimarERPData_v8';");

fs.writeFileSync('assets/js/core/state-store.js', storeCode, 'utf8');
console.log('✅ assets/js/core/state-store.js: rehydrateFromMimarERP and action types added (CODE-1 fixed)');

// 4. Update loadFromLocalStorage in app.js and crud-engine.js to rehydrate state-store and use unified key
let appCode = fs.readFileSync('assets/js/app.js', 'utf8');
const oldAppLoad = `function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("MimarERPData_v5") || localStorage.getItem("MimarERP_SavedState");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(MimarERP, parsed);
      console.log("MimarERP: Successfully restored saved state from localStorage.");
    }
  } catch (err) {
    console.warn("Could not load from localStorage:", err);
  }
}`;

const newAppLoad = `function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("MimarERPData_v8") || localStorage.getItem("MimarERPData_v6") || localStorage.getItem("MimarERPData_v5") || localStorage.getItem("MimarERP_SavedState");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(MimarERP, parsed);
      if (window.EnterpriseStore && typeof window.EnterpriseStore.rehydrateFromMimarERP === 'function') {
        window.EnterpriseStore.rehydrateFromMimarERP();
      }
      console.log("MimarERP: Successfully restored saved state from unified storage.");
    }
  } catch (err) {
    console.warn("Could not load from localStorage:", err);
  }
}`;

if (appCode.includes(oldAppLoad)) {
  appCode = appCode.replace(oldAppLoad, newAppLoad);
} else {
  appCode = appCode.replace(
    /function loadFromLocalStorage\(\)\s*\{[\s\S]*?console\.log\("MimarERP: Successfully restored saved state from localStorage\."\);\s*\}\s*\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}\s*\}/,
    newAppLoad
  );
}

// Also update saveToLocalStorage in app.js to use MimarERPData_v8
appCode = appCode.replace('localStorage.setItem("MimarERPData_v5", JSON.stringify(snap));', 'localStorage.setItem("MimarERPData_v8", JSON.stringify(snap));');

fs.writeFileSync('assets/js/app.js', appCode, 'utf8');
console.log('✅ assets/js/app.js: loadFromLocalStorage rehydrates EnterpriseStore (CODE-1/3 fixed)');

// 5. Update crud-engine.js to also rehydrate and use unified key
let crudCode = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
crudCode = crudCode.replace(
  "localStorage.setItem('MimarERPData_v6', JSON.stringify(snap));",
  "localStorage.setItem('MimarERPData_v8', JSON.stringify(snap));"
);
crudCode = crudCode.replace(
  "localStorage.getItem('MimarERPData_v6')",
  "localStorage.getItem('MimarERPData_v8') || localStorage.getItem('MimarERPData_v6')"
);

fs.writeFileSync('assets/js/crud-engine.js', crudCode, 'utf8');
console.log('✅ assets/js/crud-engine.js: persistence key unified to MimarERPData_v8');

console.log('\nState Store rehydration and persistence unification completed.');
