// Simulate browser environment and run deleteCompany('CMP-1001')
const fs = require('fs');
const vm = require('vm');

const configJs = fs.readFileSync('assets/js/config.js', 'utf8');
const secJs = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');
const crudJs = fs.readFileSync('assets/js/crud-engine.js', 'utf8');

const logs = [];
const customWindow = {
  console: {
    log: (...args) => logs.push(['LOG', ...args]),
    warn: (...args) => logs.push(['WARN', ...args]),
    error: (...args) => logs.push(['ERR', ...args])
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  document: {
    querySelector: () => null,
    getElementById: () => null,
    createElement: (tag) => ({
      tagName: tag,
      style: {},
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      querySelector: () => ({ onclick: null }),
      innerHTML: '',
      textContent: ''
    }),
    body: {
      appendChild: () => {}
    },
    addEventListener: () => {}
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {}
};
customWindow.window = customWindow;

const ctx = vm.createContext(customWindow);
vm.runInContext(configJs, ctx);
vm.runInContext(secJs, ctx);
vm.runInContext(crudJs, ctx);

console.log('MimarERP companies count:', customWindow.MimarERP.companies.length);
console.log('Testing deleteCompany with default role:');
try {
  customWindow.deleteCompany('CMP-1001');
} catch (e) {
  console.log('Caught error calling deleteCompany:', e.message);
}
console.log('Logs emitted:', logs);
console.log('Companies count after deleteCompany:', customWindow.MimarERP.companies.length);
