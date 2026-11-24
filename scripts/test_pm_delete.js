// Test with PM role
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
  console: { log: () => {}, warn: () => {}, error: () => {} },
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
    body: { appendChild: () => {}, removeChild: () => {} },
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

// Test with default PM role
mockWindow.PolicyGatekeeper.setActiveRole('PM');

console.log('Testing deleteCompany with PM role:');
const initialCompanies = mockWindow.MimarERP.companies.length;
const testCompId = mockWindow.MimarERP.companies[0].company_id;
mockWindow.deleteCompany(testCompId);
if (confirmCallback) { confirmCallback(); confirmCallback = null; }
const afterCompanies = mockWindow.MimarERP.companies.length;
console.log(`PM Company delete: ${initialCompanies} -> ${afterCompanies} (Passed: ${afterCompanies === initialCompanies - 1})`);
