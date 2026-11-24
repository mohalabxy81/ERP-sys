const fs = require('fs');
const ext = fs.readFileSync('assets/js/crud-extension.js', 'utf8');

const lines = ext.split('\n');
console.log('--- crud-extension.js inspection ---');
lines.forEach((l, i) => {
  if (l.includes('renderProcurementTable') || l.includes('deletePOItem') || l.includes('<button') || l.includes('btn-sm')) {
    console.log(i + 1, l.trim());
  }
});
