const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ctx-role')) {
    console.log(lines.slice(Math.max(0, i - 5), i + 15).join('\n'));
  }
});
