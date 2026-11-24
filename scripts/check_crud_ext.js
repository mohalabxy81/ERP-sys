const fs = require('fs');
const ext = fs.readFileSync('assets/js/crud-extension.js', 'utf8');

const funcs = ext.match(/function\s+delete\w+\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g) || [];
console.log('Found', funcs.length, 'delete functions in crud-extension.js');
funcs.forEach(f => {
  const name = f.match(/function\s+(delete\w+)/)[1];
  console.log('--- ' + name + ' ---');
  console.log(f.slice(0, 300));
});
