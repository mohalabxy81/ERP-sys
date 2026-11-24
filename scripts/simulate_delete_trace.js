// Trace confirmDelete
const fs = require('fs');
const vm = require('vm');

const configJs = fs.readFileSync('assets/js/config.js', 'utf8');
const secJs = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');
const crudJs = fs.readFileSync('assets/js/crud-engine.js', 'utf8');

let createdElement = null;
let toastMsg = null;

const customWindow = {
  console: console,
  localStorage: { getItem: () => null, setItem: () => {} },
  document: {
    querySelector: () => null,
    getElementById: (id) => id === 'toast-msg' ? { textContent: '', classList: { add: () => {}, remove: () => {} } } : null,
    createElement: (tag) => {
      const el = {
        tagName: tag,
        style: {},
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {},
        querySelector: (sel) => {
          return { onclick: null };
        },
        innerHTML: '',
        textContent: ''
      };
      createdElement = el;
      return el;
    },
    body: { appendChild: (el) => { createdElement = el; } },
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

console.log('PolicyGatekeeper activeRole:', customWindow.window.PolicyGatekeeper.getActiveRole());
console.log('PolicyGatekeeper can DELETE_MASTER_DATA:', customWindow.window.PolicyGatekeeper.can('DELETE_MASTER_DATA'));

customWindow.deleteCompany('CMP-1001');
console.log('Was delete modal created?', createdElement ? createdElement.className : 'NO MODAL CREATED');
