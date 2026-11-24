// Test all delete functions with SuperAdmin / Director / PM
const fs = require('fs');
const sec = fs.readFileSync('assets/js/core/security-sanitizer.js', 'utf8');

console.log('Testing roles and permissions');
// We need to see what permissions each role should have
