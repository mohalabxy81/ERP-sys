const fs = require('fs');
const path = require('path');

const tasks = [
  {
    htmlPath: 'knowhow.html',
    cssPath: 'assets/css/knowhow.css',
    cssRel: 'assets/css/knowhow.css',
    jsPath: 'assets/js/knowhow.js',
    jsRel: 'assets/js/knowhow.js'
  },
  {
    htmlPath: 'modules/cost-control/index.html',
    cssPath: 'modules/cost-control/cost-control.css',
    cssRel: 'cost-control.css',
    jsPath: 'modules/cost-control/cost-control.js',
    jsRel: 'cost-control.js'
  },
  {
    htmlPath: 'modules/document-control/index.html',
    cssPath: 'modules/document-control/document-control.css',
    cssRel: 'document-control.css',
    jsPath: 'modules/document-control/document-control.js',
    jsRel: 'document-control.js'
  },
  {
    htmlPath: 'modules/executive-dashboard/index.html',
    cssPath: 'modules/executive-dashboard/executive-dashboard.css',
    cssRel: 'executive-dashboard.css',
    jsPath: 'modules/executive-dashboard/executive-dashboard.js',
    jsRel: 'executive-dashboard.js'
  },
  {
    htmlPath: 'modules/hse/index.html',
    cssPath: 'modules/hse/hse.css',
    cssRel: 'hse.css',
    jsPath: 'modules/hse/hse.js',
    jsRel: 'hse.js'
  },
  {
    htmlPath: 'modules/planning/index.html',
    cssPath: 'modules/planning/planning.css',
    cssRel: 'planning.css',
    jsPath: 'modules/planning/planning.js',
    jsRel: 'planning.js'
  },
  {
    htmlPath: 'modules/procurement/index.html',
    cssPath: 'modules/procurement/procurement.css',
    cssRel: 'procurement.css',
    jsPath: 'modules/procurement/procurement.js',
    jsRel: 'procurement.js'
  }
];

tasks.forEach(t => {
  if (!fs.existsSync(t.htmlPath)) {
    console.error('File not found: ' + t.htmlPath);
    return;
  }
  let content = fs.readFileSync(t.htmlPath, 'utf8');

  // Extract <style>...</style>
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const cssContent = styleMatch[1].trim() + '\n';
    fs.writeFileSync(t.cssPath, cssContent, 'utf8');
    content = content.replace(styleMatch[0], `<link rel="stylesheet" href="${t.cssRel}">`);
    console.log(`Extracted CSS for ${t.htmlPath} -> ${t.cssPath} (${cssContent.length} chars)`);
  }

  // Extract inline <script>...</script> (the ones without src attribute)
  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i;
  const scriptMatch = content.match(scriptRegex);
  if (scriptMatch) {
    const jsContent = scriptMatch[1].trim() + '\n';
    fs.writeFileSync(t.jsPath, jsContent, 'utf8');
    content = content.replace(scriptMatch[0], `<script src="${t.jsRel}"></script>`);
    console.log(`Extracted JS for ${t.htmlPath} -> ${t.jsPath} (${jsContent.length} chars)`);
  }

  fs.writeFileSync(t.htmlPath, content, 'utf8');
});

console.log('\nAll extractions completed successfully.');
