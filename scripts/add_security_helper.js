const fs = require('fs');

let content = fs.readFileSync('assets/js/app.js', 'utf8');
if (!content.includes('function escapeHTML(')) {
  const insertCode = `function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return String(str);
  if (window.DOMSanitizer && typeof window.DOMSanitizer.escape === 'function') {
    return window.DOMSanitizer.escape(str);
  }
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}
window.escapeHTML = escapeHTML;

`;
  content = content.replace('document.addEventListener("DOMContentLoaded"', insertCode + 'document.addEventListener("DOMContentLoaded"');
  fs.writeFileSync('assets/js/app.js', content, 'utf8');
  console.log('escapeHTML inserted successfully.');
} else {
  console.log('escapeHTML already present.');
}
