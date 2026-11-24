const fs = require('fs');
const crudJs = fs.readFileSync('assets/js/crud-engine.js', 'utf8');

// Print lines 460-520
const lines = crudJs.split('\n');
console.log('--- renderActionButtons (around line 469) ---');
console.log(lines.slice(460, 500).join('\n'));

// Print lines 390-440 (confirmDelete)
console.log('--- confirmDelete (around line 390) ---');
console.log(lines.slice(385, 436).join('\n'));
