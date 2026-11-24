// Check all tables and their delete buttons in crud-engine.js and crud-extension.js
const fs = require('fs');
const crud = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
const ext = fs.readFileSync('assets/js/crud-extension.js', 'utf8');

const tableRenderers = crud.match(/window\.render\w+\s*=\s*function/g) || [];
console.log('Window render functions in crud-engine.js:', tableRenderers);

const extRenderers = ext.match(/window\.render\w+\s*=\s*function/g) || [];
console.log('Window render functions in crud-extension.js:', extRenderers);

// Check which entities have delete buttons and which delete function they call
const actionBtnCalls = crud.match(/renderActionButtons\([^,]+,\s*`([^`]+)`\)/g) || [];
console.log('Total renderActionButtons in crud-engine.js:', actionBtnCalls.length);
actionBtnCalls.forEach(call => console.log('  ', call));
