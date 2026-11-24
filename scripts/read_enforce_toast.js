const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

const enfIdx = sec.indexOf('enforce(permission');
console.log(sec.slice(enfIdx, enfIdx + 450));
