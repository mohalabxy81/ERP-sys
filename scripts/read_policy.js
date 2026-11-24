const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

// print PolicyGatekeeper normalizeRole and ROLES
const lines = sec.split('\n');
const start = lines.findIndex(l => l.includes('const ROLES ='));
console.log(lines.slice(start, start + 80).join('\n'));
