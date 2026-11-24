const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

// Print lines 75 to 205
const lines = sec.split('\n');
console.log(lines.slice(75, 205).join('\n'));
