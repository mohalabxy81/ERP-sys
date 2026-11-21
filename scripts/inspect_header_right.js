const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const hIdx = html.indexOf('<header class="topbar">');
console.log(html.substring(hIdx + 800, hIdx + 1800));
