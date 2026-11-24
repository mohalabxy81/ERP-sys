// Trace confirmDelete catch block
const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');
const crud = fs.readFileSync('assets/js/crud-engine.js', 'utf8');

const cdMatch = crud.match(/function confirmDelete\([^)]*\)\s*\{[\s\S]*?\n\}/);
console.log(cdMatch[0]);
