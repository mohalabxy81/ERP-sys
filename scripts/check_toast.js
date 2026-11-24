const fs = require('fs');

const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');
const crud = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
const app = fs.readFileSync('assets/js/app.js', 'utf8');

console.log('sec has showToast:', sec.includes('function showToast'));
console.log('crud has showToast:', crud.includes('function showToast'));
console.log('app has showToast:', app.includes('function showToast'));

// In what file is showToast defined and when is it loaded?
// In index.html:
// 1. security-sanitizer.js
// 2. state-store.js
// ...
// 7. app.js (defines showToast at line ...)
// 8. crud-engine.js (defines showToast at line 438)
