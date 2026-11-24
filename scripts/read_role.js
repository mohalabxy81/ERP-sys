const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('assets/js/app.js', 'utf8');

const ctxRoleMatch = html.match(/id=["']ctx-role["'][^>]*>[\s\S]*?<\/select>/);
console.log('ctx-role dropdown in index.html:');
console.log(ctxRoleMatch ? ctxRoleMatch[0] : 'NOT FOUND');

console.log('app.js lines 65-110:');
console.log(app.split('\n').slice(65, 110).join('\n'));
