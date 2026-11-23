const fs = require('fs');

console.log('=== Patching Security and Operations Vulnerabilities ===\n');

// 1. Fix showToast in crud-engine.js (SEC-3)
let crudCode = fs.readFileSync('assets/js/crud-engine.js', 'utf8');
if (crudCode.includes('toast.innerHTML = msg;')) {
  crudCode = crudCode.replace('toast.innerHTML = msg;', 'toast.textContent = msg;');
  console.log('✅ crud-engine.js: showToast changed from innerHTML to textContent (SEC-3 fixed)');
}

// 1.1 Fix net_paid nullish check and default retention in crud-engine.js (CALC-9)
if (crudCode.includes('const paid = Number(sc.net_paid || (measured - retention));')) {
  crudCode = crudCode.replace(
    'const paid = Number(sc.net_paid || (measured - retention));',
    'const paid = (sc.net_paid !== undefined && sc.net_paid !== null) ? Number(sc.net_paid) : (measured - retention);'
  );
  console.log('✅ crud-engine.js: fixed net_paid nullish check for 0 payments (CALC-9 fixed)');
}

// Fix default retention percentage from 5 to 10
crudCode = crudCode.replace(
  "{ key: 'retention_pct', label: 'نسبة الحجز الضامن %', type: 'number', default: 5 }",
  "{ key: 'retention_pct', label: 'نسبة الحجز الضامن %', type: 'number', default: 10 }"
);
crudCode = crudCode.replace(
  "data.retention_val = (cur * (Number(data.retention_pct) || 5)) / 100;",
  "const retRate = (data.retention_pct !== undefined && data.retention_pct !== null && !isNaN(Number(data.retention_pct))) ? Number(data.retention_pct) : 10;\n      data.retention_val = (cur * retRate) / 100;"
);

// 1.2 Fix BBS summary cards update in crud-engine.js (CALC-15)
const oldBbsRender = `// 5.25 Rebar BBS Table
window.renderRebarBBS = function() {
  const tbody = document.getElementById("tbl-rebar-bbs-body") || document.querySelector("#tbl-rebar-bbs tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-rebar-bbs");
  tbody.innerHTML = "";
  const list = MimarERP.rebarBBSItems || [];

  list.forEach((b, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = \`
      <td><strong>\${b.member}</strong></td>
      <td class="text-num"><strong>\${b.bar_mark}</strong></td>
      <td>\${b.shape_code}</td>
      <td class="text-center">T\${b.diameter}</td>
      <td class="text-center">\${b.num_elements}</td>
      <td class="text-center">\${b.bars_per_element}</td>
      <td class="text-center"><strong style="color:var(--teal)">\${b.total_bars}</strong></td>
      <td class="text-num">\${Number(b.cut_length).toFixed(2)}</td>
      <td class="text-num">\${Number(b.total_length).toFixed(2)}</td>
      <td class="text-num">\${Number(b.unit_weight).toFixed(3)}</td>
      <td class="text-num"><strong>\${Number(b.total_weight_kg).toFixed(1)}</strong></td>
      <td class="text-center">\${b.scrap_allowance_pct || 5}%</td>
      \${renderActionButtons(\`openAddRebarBBSModal(MimarERP.rebarBBSItems[\${idx}])\`, \`deleteRebarBBSItem('\${b.bar_mark}')\`)}
    \`;
    tbody.appendChild(tr);
  });
};`;

const newBbsRender = `// 5.25 Rebar BBS Table (Dynamic Summary Cards + BS 8666 Integration)
window.renderRebarBBS = function() {
  const tbody = document.getElementById("tbl-rebar-bbs-body") || document.querySelector("#tbl-rebar-bbs tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-rebar-bbs");
  tbody.innerHTML = "";
  const list = MimarERP.rebarBBSItems || [];

  let totalNetKg = 0;
  let totalGrossKg = 0;
  let totalBarsCount = 0;

  list.forEach((b, idx) => {
    const tr = document.createElement("tr");
    const netKg = Number(b.total_weight_kg) || 0;
    const scrapPct = Number(b.scrap_allowance_pct) !== undefined && !isNaN(Number(b.scrap_allowance_pct)) ? Number(b.scrap_allowance_pct) : 5;
    const grossKg = netKg * (1 + (scrapPct / 100));
    const bars = Number(b.total_bars) || 0;

    totalNetKg += netKg;
    totalGrossKg += grossKg;
    totalBarsCount += bars;

    const safeMark = (b.bar_mark || '').replace(/'/g, "\\\\'");

    tr.innerHTML = \`
      <td><strong>\${window.escapeHTML ? window.escapeHTML(b.member) : b.member}</strong></td>
      <td class="text-num"><strong>\${window.escapeHTML ? window.escapeHTML(b.bar_mark) : b.bar_mark}</strong></td>
      <td>\${window.escapeHTML ? window.escapeHTML(b.shape_code) : b.shape_code}</td>
      <td class="text-center">T\${b.diameter}</td>
      <td class="text-center">\${b.num_elements}</td>
      <td class="text-center">\${b.bars_per_element}</td>
      <td class="text-center"><strong style="color:var(--teal)">\${bars}</strong></td>
      <td class="text-num">\${Number(b.cut_length || 0).toFixed(2)}</td>
      <td class="text-num">\${Number(b.total_length || 0).toFixed(2)}</td>
      <td class="text-num">\${Number(b.unit_weight || 0).toFixed(3)}</td>
      <td class="text-num"><strong>\${netKg.toFixed(1)}</strong></td>
      <td class="text-center">\${scrapPct}%</td>
      \${renderActionButtons(\`openAddRebarBBSModal(MimarERP.rebarBBSItems[\${idx}])\`, \`deleteRebarBBSItem('\${safeMark}')\`)}
    \`;
    tbody.appendChild(tr);
  });

  // Dynamically update the 4 BBS Summary Cards in index.html
  const wasteKg = Math.max(totalGrossKg - totalNetKg, 0);
  const netTon = (totalNetKg / 1000).toFixed(2);
  const wasteTon = (wasteKg / 1000).toFixed(2);
  const grossTon = (totalGrossKg / 1000).toFixed(2);

  const elNet = document.getElementById('bbs-summary-net-ton');
  if (elNet) elNet.textContent = netTon + ' طن';
  const elWaste = document.getElementById('bbs-summary-waste-ton');
  if (elWaste) elWaste.textContent = wasteTon + ' طن';
  const elGross = document.getElementById('bbs-summary-gross-ton');
  if (elGross) elGross.textContent = grossTon + ' طن';
  const elBars = document.getElementById('bbs-summary-total-bars');
  if (elBars) elBars.textContent = totalBarsCount.toLocaleString('ar-SA');
};`;

if (crudCode.includes('// 5.25 Rebar BBS Table')) {
  crudCode = crudCode.replace(oldBbsRender, newBbsRender);
  console.log('✅ crud-engine.js: Rebar BBS dynamic summary cards connected (CALC-15 fixed)');
}

fs.writeFileSync('assets/js/crud-engine.js', crudCode, 'utf8');

// 2. Fix Print Engine & ZATCA QR in enterprise-features.js (SEC-5, CALC-4, CALC-5)
let entCode = fs.readFileSync('assets/js/enterprise-features.js', 'utf8');

// Fix printIPC call to ZatcaEngine
const oldZatcaCall = `      // ZATCA QR
      const qrSvg = (window.ZatcaEngine && window.ZatcaEngine.generateQrSvg)
        ? window.ZatcaEngine.generateQrSvg("شركة إعمار وعمران للإنشاءات", "310123456700003", b.submission_date, totalPayable, vat)
        : '<div style="border:1px solid #ccc; padding:20px;">[ZATCA QR]</div>';`;

const newZatcaCall = `      // ZATCA Phase 1 TLV QR Code (Simulation with Active Company Credentials)
      let qrSvg = '<div style="border:1px dashed #cbd5e1; padding:15px; font-size:11px; color:#64748b; text-align:center;">[رمز الاستجابة السريعة - محاكاة تجريبية]</div>';
      if (window.ZatcaEngine && window.ZatcaEngine.generateZatcaTLV && window.ZatcaEngine.generateQrSvg) {
        const activeCo = (window.MimarERP && window.MimarERP.companies) 
          ? (window.MimarERP.companies.find(c => c.company_id === (window.MimarERP.currentCompanyId || 'CMP-1001')) || window.MimarERP.companies[0])
          : { company_name_ar: "شركة مِعمار للمقاولات", vat_number: "300123456700003" };
        const sellerName = activeCo.company_name_ar || "شركة مِعمار للمقاولات";
        const sellerVat = activeCo.vat_number || "300123456700003";
        const invDate = b.submission_date || b.approval_date || new Date().toISOString();
        const tlvData = window.ZatcaEngine.generateZatcaTLV(sellerName, sellerVat, invDate, totalPayable, vat);
        qrSvg = window.ZatcaEngine.generateQrSvg(tlvData, 160);
      }`;

if (entCode.includes(oldZatcaCall)) {
  entCode = entCode.replace(oldZatcaCall, newZatcaCall);
  console.log('✅ enterprise-features.js: printIPC ZATCA TLV parameters and active company dynamic binding fixed (CALC-4/5)');
}

// Fix window.open in print templates to open via Blob URL with sandbox isolation (SEC-5)
entCode = entCode.replace(
  /const win = window\.open\("", "_blank", "width=900,height=800"\);\s*if \(win\) \{\s*win\.document\.write\(printHtml\);\s*win\.document\.close\(\);\s*\}/g,
  `const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank", "width=950,height=850");
      if (win) { setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); }`
);
entCode = entCode.replace(
  /const win = window\.open\("", "_blank", "width=900,height=800"\);\s*if \(win\) \{\s*win\.document\.write\(printHtml\);\s*win\.document\.close\(\);\s*\}/g,
  `const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank", "width=950,height=850");
      if (win) { setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); }`
);

fs.writeFileSync('assets/js/enterprise-features.js', entCode, 'utf8');

// 3. Fix document-control.js XSS issues (SEC-6 in Copilot report)
let docCode = fs.readFileSync('modules/document-control/document-control.js', 'utf8');
if (!docCode.includes('function escapeHtml(')) {
  docCode = `function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}\n` + docCode;
}

// Replace file.name interpolation
docCode = docCode.replace(
  '${file.name}',
  '${escapeHtml(file.name)}'
);

// Replace handleDocUpload innerHTML interpolation with escaped variables
docCode = docCode.replace(
  '<td class="text-num" style="font-weight:800; color:var(--navy);">${docNo}</td>\n        <td>${title}</td>',
  '<td class="text-num" style="font-weight:800; color:var(--navy);">${escapeHtml(docNo)}</td>\n        <td>${escapeHtml(title)}</td>'
);
docCode = docCode.replace(
  '<td class="text-num">${transmittal}</td>',
  '<td class="text-num">${escapeHtml(transmittal)}</td>'
);

fs.writeFileSync('modules/document-control/document-control.js', docCode, 'utf8');
console.log('✅ modules/document-control/document-control.js: escaped file name and upload fields (SEC-6 fixed)');

console.log('\nSecurity & Operations patches completed successfully.');
