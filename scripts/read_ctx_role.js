const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const m = html.match(/<select id="ctx-role"[^>]*>([\s\S]*?)<\/select>/);
console.log('ctx-role options:');
console.log(m ? m[1] : 'NOT FOUND');
