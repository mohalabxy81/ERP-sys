const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const hIdx = html.indexOf('<header');
console.log('Header in index.html:');
console.log(html.substring(hIdx, hIdx + 1200));
