const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

const lines = sec.split('\n');
console.log(lines.slice(180, 240).join('\n'));
