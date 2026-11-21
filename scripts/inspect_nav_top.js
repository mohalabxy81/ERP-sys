const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const dIdx = html.indexOf('id="nav-grp-dashboard"');
console.log('Sidebar top:');
console.log(html.substring(dIdx, dIdx + 500));
