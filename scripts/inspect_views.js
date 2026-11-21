const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const views = [];
lines.forEach((line, idx) => {
  if (line.includes('class="page-view') || line.includes("class='page-view'")) {
    const idMatch = line.match(/id=["']([^"']+)["']/);
    views.push({ line: idx + 1, id: idMatch ? idMatch[1] : 'unknown', text: line.trim() });
  }
});
console.log('Total views found:', views.length);
console.log(JSON.stringify(views, null, 2));
