const fs = require('fs');

let code = fs.readFileSync('assets/js/enterprise-features.js', 'utf8');

// Replace ZATCA call in printIPC
const oldZRegex = /const qrSvg = \(window\.ZatcaEngine[\s\S]*?\[ZATCA QR\]<\/div>\';/;
const newZ = `const activeCo = (window.MimarERP && window.MimarERP.companies) ? (window.MimarERP.companies.find(c => c.company_id === (window.MimarERP.currentCompanyId || 'CMP-1001')) || window.MimarERP.companies[0]) : { company_name_ar: 'شركة مِعمار للمقاولات', vat_number: '300123456700003' };
      const tlvB64 = (window.ZatcaEngine && window.ZatcaEngine.generateZatcaTLV) ? window.ZatcaEngine.generateZatcaTLV(activeCo.company_name_ar, activeCo.vat_number, b.submission_date, totalPayable, vat) : '';
      const qrSvg = (window.ZatcaEngine && window.ZatcaEngine.generateQrSvg && tlvB64) ? window.ZatcaEngine.generateQrSvg(tlvB64, 160) : '<div style="border:1px dashed #cbd5e1; padding:15px; font-size:11px; color:#64748b; text-align:center;">[ZATCA QR Simulation]</div>';`;

if (oldZRegex.test(code)) {
  code = code.replace(oldZRegex, newZ);
  console.log('✅ Zatca call in printIPC replaced with dynamic company credentials.');
}

// Replace window.open with Blob URL in printIPC, printPO, printClaim
const oldOpenRegex = /const win = window\.open\("", "_blank", "width=900,height=800"\);\s*if \(win\) \{\s*(?:win\.document\.write\(printHtml\);\s*win\.document\.close\(\);)?/g;
const newOpen = `const printBlob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const printUrl = URL.createObjectURL(printBlob);
      const win = window.open(printUrl, '_blank', 'width=950,height=850');
      if (win) { setTimeout(() => URL.revokeObjectURL(printUrl), 60000); }`;

code = code.replace(
  /const win = window\.open\("", "_blank", "width=900,height=800"\);\s*if \(win\) \{\s*win\.document\.write\(printHtml\);\s*win\.document\.close\(\);\s*\}/g,
  newOpen
);

// Also escape dynamic fields in printHtml
code = code.replace('${po.supplier_name}', '${window.escapeHTML ? window.escapeHTML(po.supplier_name) : po.supplier_name}');
code = code.replace('${po.material_desc}', '${window.escapeHTML ? window.escapeHTML(po.material_desc) : po.material_desc}');
code = code.replace('${c.subject}', '${window.escapeHTML ? window.escapeHTML(c.subject) : c.subject}');

fs.writeFileSync('assets/js/enterprise-features.js', code, 'utf8');
console.log('✅ assets/js/enterprise-features.js updated.');
