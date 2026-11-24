const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

// Check lines around PolicyGatekeeper enforce
const lines = sec.split('\n');
const idx = lines.findIndex(l => l.includes('class PolicyGatekeeper'));
console.log(lines.slice(idx, idx + 100).join('\n'));
