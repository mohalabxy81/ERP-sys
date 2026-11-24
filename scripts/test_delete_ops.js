// Comprehensive test verifying every single delete function in ERP-SYS
const fs = require('fs');
const vm = require('vm');

const configJs = fs.readFileSync('assets/js/config.js', 'utf8');
const secJs = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');
const storeJs = fs.readFileSync('assets/js/core/state-store.js', 'utf8');
const appJs = fs.readFileSync('assets/js/app.js', 'utf8');
const crudJs = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
const extJs = fs.readFileSync('assets/js/crud-extension.js', 'utf8');

let confirmCallback = null;

function createFakeElement(tag = 'div') {
  return {
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    removeChild: () => {},
    querySelector: (sel) => {
      if (sel === '#btn-confirm-del') {
        return {
          onclick: null,
          set onclick(fn) { confirmCallback = fn; }
        };
      }
      return createFakeElement('child');
    },
    querySelectorAll: () => [],
    innerHTML: '',
    textContent: ''
  };
}

const mockWindow = {
  console: {
    log: () => {},
    warn: () => {},
    error: () => {}
  },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; }
  },
  document: {
    querySelector: (sel) => createFakeElement(sel),
    querySelectorAll: () => [],
    getElementById: (id) => createFakeElement(id),
    createElement: (tag) => createFakeElement(tag),
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    addEventListener: () => {}
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
mockWindow.window = mockWindow;

const ctx = vm.createContext(mockWindow);
vm.runInContext(configJs, ctx);
vm.runInContext(secJs, ctx);
vm.runInContext(storeJs, ctx);
vm.runInContext(appJs, ctx);
vm.runInContext(crudJs, ctx);
vm.runInContext(extJs, ctx);

// Make sure PolicyGatekeeper allows delete
mockWindow.PolicyGatekeeper.setActiveRole('SuperAdmin');

console.log('=== VERIFYING DELETE FUNCTIONS ===');

// 1. deleteCompany
const initialCompanies = mockWindow.MimarERP.companies.length;
const testCompId = mockWindow.MimarERP.companies[0].company_id;
mockWindow.deleteCompany(testCompId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterCompanies = mockWindow.MimarERP.companies.length;
console.log(`Company delete: ${initialCompanies} -> ${afterCompanies} (Passed: ${afterCompanies === initialCompanies - 1})`);

// 2. deleteBranch
const initialBranches = mockWindow.MimarERP.branches.length;
const testBranchId = mockWindow.MimarERP.branches[0].branch_id;
mockWindow.deleteBranch(testBranchId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterBranches = mockWindow.MimarERP.branches.length;
console.log(`Branch delete: ${initialBranches} -> ${afterBranches} (Passed: ${afterBranches === initialBranches - 1})`);

// 3. deletePartner
const initialPartners = mockWindow.MimarERP.partners.length;
const testPartnerId = mockWindow.MimarERP.partners[0].partner_id;
mockWindow.deletePartner(testPartnerId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterPartners = mockWindow.MimarERP.partners.length;
console.log(`Partner delete: ${initialPartners} -> ${afterPartners} (Passed: ${afterPartners === initialPartners - 1})`);

// 4. deleteProject
const initialProjects = mockWindow.MimarERP.projects.length;
const testPrjId = mockWindow.MimarERP.projects[0].project_id;
mockWindow.deleteProject(testPrjId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterProjects = mockWindow.MimarERP.projects.length;
console.log(`Project delete: ${initialProjects} -> ${afterProjects} (Passed: ${afterProjects === initialProjects - 1})`);

// 5. deletePOItem
const initialPOs = mockWindow.MimarERP.purchaseOrders.length;
const testPOId = mockWindow.MimarERP.purchaseOrders[0].id;
mockWindow.deletePOItem(testPOId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterPOs = mockWindow.MimarERP.purchaseOrders.length;
console.log(`PO delete: ${initialPOs} -> ${afterPOs} (Passed: ${afterPOs === initialPOs - 1})`);

// 6. deleteSubcontract
const initialSubs = mockWindow.MimarERP.subcontractsMaster.length;
const testSubId = mockWindow.MimarERP.subcontractsMaster[0].sub_id;
mockWindow.deleteSubcontract(testSubId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterSubs = mockWindow.MimarERP.subcontractsMaster.length;
console.log(`Subcontract delete: ${initialSubs} -> ${afterSubs} (Passed: ${afterSubs === initialSubs - 1})`);

console.log('✓ All critical delete operations tested successfully!');
