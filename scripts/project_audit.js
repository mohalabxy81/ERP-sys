const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   ERP-SYS V8 Comprehensive Project & Security Audit');
console.log('====================================================\n');

let issuesFound = 0;
let warningsFound = 0;

// ── 1. Asset File References Check ──
console.log('🔍 1. Checking Asset & Script Paths in HTML Files...');
const htmlFiles = [
  'index.html',
  'knowhow.html',
  'modules/cost-control/index.html',
  'modules/document-control/index.html',
  'modules/executive-dashboard/index.html',
  'modules/hse/index.html',
  'modules/planning/index.html',
  'modules/procurement/index.html'
];

htmlFiles.forEach(hf => {
  if (!fs.existsSync(hf)) {
    console.error(`❌ HTML file missing: ${hf}`);
    issuesFound++;
    return;
  }
  const content = fs.readFileSync(hf, 'utf8');
  const baseDir = path.dirname(hf);

  // Check <link href="...">
  const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = linkRegex.exec(content)) !== null) {
    const href = m[1];
    if (href.startsWith('http') || href.startsWith('data:') || href.startsWith('#')) continue;
    const resolved = path.resolve(baseDir, href);
    if (!fs.existsSync(resolved)) {
      console.error(`❌ Broken link in ${hf}: ${href} (Resolved: ${resolved})`);
      issuesFound++;
    }
  }

  // Check <script src="...">
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  while ((m = scriptRegex.exec(content)) !== null) {
    const src = m[1];
    if (src.startsWith('http') || src.startsWith('data:')) continue;
    const resolved = path.resolve(baseDir, src);
    if (!fs.existsSync(resolved)) {
      console.error(`❌ Broken script in ${hf}: ${src} (Resolved: ${resolved})`);
      issuesFound++;
    }
  }
});
console.log(`  Asset path checks completed.\n`);

// ── 2. Check onclick handlers in HTML vs JS ──
console.log('🔍 2. Checking onclick and event handlers in index.html...');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const jsFiles = [
  'assets/js/config.js',
  'assets/js/crud-engine.js',
  'assets/js/crud-extension.js',
  'assets/js/enterprise-features.js',
  'assets/js/evm-calculator.js',
  'assets/js/app.js'
];
let combinedJs = '';
jsFiles.forEach(f => {
  if (fs.existsSync(f)) combinedJs += '\n' + fs.readFileSync(f, 'utf8');
});

const onclickRegex = /onclick=["']([a-zA-Z0-9_$]+)\(/gi;
const handlers = new Set();
while ((m = onclickRegex.exec(indexHtml)) !== null) {
  handlers.add(m[1]);
}

console.log(`  Found ${handlers.size} unique onclick functions in index.html`);
handlers.forEach(fn => {
  // Check if defined in JS (function fn, fn = function, window.fn =, const fn =, let fn =)
  const fnRegex = new RegExp(`(function\\s+${fn}\\b|window\\.${fn}\\s*=|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|var\\s+${fn}\\s*=|${fn}:\\s*function|${fn}\\s*\\()`);
  if (!fnRegex.test(combinedJs)) {
    console.warn(`  ⚠️ Potential missing handler in index.html: ${fn}()`);
    warningsFound++;
  }
});
console.log(`  Event handlers check completed.\n`);

// ── 3. DOM ID references in app.js vs index.html ──
console.log('🔍 3. Checking DOM IDs referenced in JS files...');
const appJs = fs.readFileSync('assets/js/app.js', 'utf8');
const getElRegex = /getElementById\(['"]([^'"]+)['"]\)/g;
const missingIds = [];
while ((m = getElRegex.exec(appJs)) !== null) {
  const id = m[1];
  if (!indexHtml.includes(`id="${id}"`) && !indexHtml.includes(`id='${id}'`)) {
    missingIds.push(id);
  }
}

console.log(`  Missing DOM IDs count: ${missingIds.length}`);
if (missingIds.length > 0) {
  console.log(`  Sample missing IDs:`, missingIds.slice(0, 15));
}
console.log(`  DOM ID check completed.\n`);

// ── 4. Security Check (XSS, innerHTML, Sanitization) ──
console.log('🔍 4. Security Audit: Sanitization & Safe DOM Insertion...');
const innerHTMLMatches = combinedJs.match(/\.innerHTML\s*=/g) || [];
console.log(`  Total innerHTML assignments: ${innerHTMLMatches.length}`);

// Check if security-sanitizer.js exists and exports escapeHTML / sanitize
const secSanitizer = 'assets/js/core/security-sanitizer.js';
if (fs.existsSync(secSanitizer)) {
  console.log(`  ✅ Security Sanitizer module exists: ${secSanitizer}`);
} else {
  console.warn(`  ⚠️ security-sanitizer.js not found`);
  warningsFound++;
}

// ── 5. Check JS Syntax across all scripts ──
console.log('🔍 5. Checking Syntax of all JS files...');
const allJsFiles = [];
function findJs(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const f = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.git') findJs(f);
    else if (e.name.endsWith('.js')) allJsFiles.push(f);
  });
}
findJs('.');

let syntaxErrors = 0;
const { execSync } = require('child_process');
allJsFiles.forEach(f => {
  try {
    execSync(`node -c "${f}"`);
  } catch (err) {
    console.error(`❌ Syntax error in ${f}: ${err.message}`);
    syntaxErrors++;
    issuesFound++;
  }
});
console.log(`  Checked ${allJsFiles.length} JS files. Syntax errors: ${syntaxErrors}\n`);

// ── Summary ──
console.log('====================================================');
console.log(`AUDIT SUMMARY: ${issuesFound} Issues, ${warningsFound} Warnings`);
console.log('====================================================\n');
