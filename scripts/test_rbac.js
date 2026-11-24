// Test script to inspect RBAC behavior
const fs = require('fs');
const secContent = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

// Evaluate security-sanitizer module in a sandboxed context
const vm = require('vm');
const sandbox = { window: {}, console: console, localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(sandbox);
vm.runInContext(secContent, sandbox);

const pg = sandbox.window.PolicyGatekeeper;
console.log('Default active role:', pg.getActiveRole());
console.log('Can PM delete master data?', pg.can('DELETE_MASTER_DATA'));

// Check what happens if user is SuperAdmin or CompanyAdmin
console.log('Normalize SuperAdmin:', pg.normalizeRole('SuperAdmin'));
console.log('Normalize CompanyAdmin:', pg.normalizeRole('CompanyAdmin'));
console.log('Normalize PM:', pg.normalizeRole('PM'));
console.log('Normalize CostControl:', pg.normalizeRole('CostControl'));
console.log('Normalize QS:', pg.normalizeRole('QS'));
