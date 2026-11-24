const fs = require('fs');
const ext = fs.readFileSync('assets/js/crud-extension.js', 'utf8');

const actionBtnCalls = ext.match(/renderActionButtons\([^,]+,\s*`([^`]+)`\)/g) || [];
console.log('Total renderActionButtons in crud-extension.js:', actionBtnCalls.length);
actionBtnCalls.forEach(call => console.log('  ', call));
