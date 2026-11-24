const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const crudJs = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
const appJs = fs.readFileSync('assets/js/app.js', 'utf8');

console.log('--- Checking occurrences of deleteCompany and deleteBranch ---');
console.log('indexHtml has deleteCompany:', indexHtml.includes('deleteCompany'));
console.log('indexHtml has deleteBranch:', indexHtml.includes('deleteBranch'));
console.log('crudJs has deleteCompany:', crudJs.includes('deleteCompany'));
console.log('appJs has deleteCompany:', appJs.includes('deleteCompany'));

// Find lines in crudJs and appJs where delete buttons are rendered
const allDeleteCallsInCrud = crudJs.match(/delete[A-Z]\w+/g) || [];
const uniqueDeleteCalls = [...new Set(allDeleteCallsInCrud)];
console.log('Unique delete calls in crud-engine.js:', uniqueDeleteCalls);

// Look for renderActionButtons in crudJs
const lines = crudJs.split('\n');
const renderActionLines = [];
lines.forEach((l, i) => {
  if (l.includes('renderActionButtons') || l.includes('deleteCompany') || l.includes('deleteBranch')) {
    renderActionLines.push(`${i+1}: ${l.trim()}`);
  }
});
console.log('Lines in crud-engine.js:', renderActionLines.slice(0, 30));
