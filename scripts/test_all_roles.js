// Test what happens for each role in ctx-role dropdown
const fs = require('fs');
const secContent = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

const vm = require('vm');
const sandbox = { window: {}, console: console, localStorage: { getItem: () => null, setItem: () => {} } };
vm.createContext(sandbox);
vm.runInContext(secContent, sandbox);

const pg = sandbox.window.PolicyGatekeeper;
const uiRoles = [
  'SuperAdmin',
  'CompanyAdmin',
  'PM',
  'CostControl',
  'Procurement',
  'QS',
  'SiteEng',
  'QAQC',
  'Finance'
];

uiRoles.forEach(r => {
  pg.setActiveRole(r);
  console.log(`UI Role "${r}" -> Standard Role: "${pg.getActiveRole()}" -> can DELETE_MASTER_DATA: ${pg.can('DELETE_MASTER_DATA')}`);
});
