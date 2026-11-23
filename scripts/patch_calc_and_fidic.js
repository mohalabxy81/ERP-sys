const fs = require('fs');

console.log('=== Patching EVM Calculations, 3-Way Match, and FIDIC Clauses ===\n');

// 1. Update evm-calculator.js
let evmCode = fs.readFileSync('assets/js/evm-calculator.js', 'utf8');

// Replace hardcoded Date('2026-03-20') with dynamic date
evmCode = evmCode.replace(
  "const today = new Date('2026-03-20');",
  "const today = (prj && prj.status_date) ? new Date(prj.status_date) : new Date();"
);

// Replace fallback BAC * 0.5 with actual progress or 0
evmCode = evmCode.replace(
  "return planned > 0 ? planned : BAC * 0.5;",
  "return planned > 0 ? planned : (BAC * ((prj.planned_progress_pct || 0) / 100));"
);

// Replace portfolio synthetic fallback ac: bac * 0.45
evmCode = evmCode.replace(
  "totalAC += (ac > 0 ? ac : bac * 0.45);",
  "totalAC += ac;"
);

// Replace calculateEVM AC fabrication
evmCode = evmCode.replace(
  "if (AC <= 0) {\n    AC = BAC * ((prj.physical_progress_pct || 50) / 100) * 0.95;\n  }",
  "if (AC <= 0 && prj.actual_cost_direct) {\n    AC = Number(prj.actual_cost_direct);\n  }"
);

// Update SPI alert thresholds
const oldSpiAlert = `  if (cardSpi) {
    if (SPI >= 1.0) {
      cardSpi.className = "kpi-card green";
      setEl("kpi-spi-desc", "المشروع متقدم عن الجدول الزمني");
    } else {
      cardSpi.className = "kpi-card amber";
      setEl("kpi-spi-desc", "المشروع يعاني من تأخير طفيف");
    }
  }`;

const newSpiAlert = `  if (cardSpi) {
    if (SPI >= 1.0) {
      cardSpi.className = "kpi-card green";
      setEl("kpi-spi-desc", "المشروع متقدم أو متطابق مع الجدول الزمني");
    } else if (SPI >= 0.85) {
      cardSpi.className = "kpi-card amber";
      setEl("kpi-spi-desc", "تحذير: تأخير معتدل عن الجدول الزمني (" + ((1 - SPI) * 100).toFixed(1) + "% انحراف)");
    } else {
      cardSpi.className = "kpi-card red";
      setEl("kpi-spi-desc", "إنذار حرج: تأخير جسيم يستوجب خطة استدراك (Recovery Schedule)");
    }
  }`;

if (evmCode.includes(oldSpiAlert)) {
  evmCode = evmCode.replace(oldSpiAlert, newSpiAlert);
  console.log('✅ evm-calculator.js: SPI threshold alerts upgraded (CALC-2 fixed)');
}

fs.writeFileSync('assets/js/evm-calculator.js', evmCode, 'utf8');
console.log('✅ assets/js/evm-calculator.js: dynamic status date and true EVM metrics updated');

// 2. Update render3WayMatchTable in app.js
let appCode = fs.readFileSync('assets/js/app.js', 'utf8');

const new3WayMatch = `function render3WayMatchTable() {
  const tbody = document.querySelector("#tbl-proc-3way-match tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const data = MimarERP.purchaseOrders || [];
  data.forEach(po => {
    const tr = document.createElement("tr");
    const poAmt = Number(po.total_amount) || 0;
    const grnAmt = Number(po.grn_received_amount);
    const invAmt = Number(po.invoice_amount);
    const hasGRN = !isNaN(grnAmt);
    const hasInv = !isNaN(invAmt);

    let variancePct = 0;
    let isMatched = false;
    let matchStatus = "بانتظار الفاتورة أو الاستلام";
    let statusBadge = "badge-amber";

    if (hasGRN && hasInv) {
      const diff = Math.abs(invAmt - poAmt);
      variancePct = poAmt > 0 ? (diff / poAmt) * 100 : 0;
      if (variancePct <= 0.05 && Math.abs(grnAmt - poAmt) <= 0.05) {
        isMatched = true;
        matchStatus = "مصرح بالصرف المالي (3-Way Matched)";
        statusBadge = "badge-green";
      } else {
        isMatched = false;
        matchStatus = \`موقوف — تباين مالي (\${variancePct.toFixed(1)}%)\`;
        statusBadge = "badge-red";
      }
    } else if (po.match_status) {
      matchStatus = po.match_status;
      statusBadge = po.status_badge || (matchStatus.includes("مصرح") ? "badge-green" : "badge-amber");
    }

    const varText = isMatched ? "0% (مطابق تماماً)" : (variancePct > 0 ? \`تباين \${variancePct.toFixed(1)}%\` : "قيد التدقيق");
    const varBadge = isMatched ? "badge-green" : (variancePct > 0 ? "badge-red" : "badge-amber");

    const fmt = n => Number(n || 0).toLocaleString("ar-SA", {minimumFractionDigits:2, maximumFractionDigits:2});
    const safeEsc = s => window.escapeHTML ? window.escapeHTML(s) : (s || '');

    tr.innerHTML = \`
      <td class="text-num"><strong style="color:var(--teal)">\${safeEsc(po.po_id)}</strong></td>
      <td>\${safeEsc(po.grn_id || '—')} (\${safeEsc(po.supplier_name || '')})</td>
      <td class="text-num font-mono">\${safeEsc(po.invoice_ref || '—')}</td>
      <td class="text-num font-mono">\${fmt(poAmt)}</td>
      <td class="text-num font-mono">\${hasGRN ? fmt(grnAmt) : '—'}</td>
      <td class="text-num font-mono" style="font-weight:700;">\${hasInv ? fmt(invAmt) : '—'}</td>
      <td class="text-center"><span class="badge \${varBadge}">\${varText}</span></td>
      <td><span class="badge \${statusBadge}">\${safeEsc(matchStatus)}</span></td>
    \`;
    tbody.appendChild(tr);
  });
}`;

const old3WayMatchRegex = /function render3WayMatchTable\(\)\s*\{[\s\S]*?tbody\.appendChild\(tr\);\s*\}\);\s*\}/;
if (old3WayMatchRegex.test(appCode)) {
  appCode = appCode.replace(old3WayMatchRegex, new3WayMatch);
  console.log('✅ assets/js/app.js: render3WayMatchTable real variance and blocking logic updated (CALC-3 fixed)');
}

// Update FIDIC 20.1 citations to FIDIC 2017 Sub-Clause 20.2.1 in app.js
appCode = appCode.replaceAll('FIDIC 20.1', 'FIDIC 20.2.1');
appCode = appCode.replaceAll('مادة FIDIC 20.1', 'مادة FIDIC 20.2.1');
appCode = appCode.replaceAll('المادة 20.1', 'المادة 20.2.1');

fs.writeFileSync('assets/js/app.js', appCode, 'utf8');

// 3. Update FIDIC clauses in enterprise-features.js and knowhow.html
let entCode = fs.readFileSync('assets/js/enterprise-features.js', 'utf8');
entCode = entCode.replaceAll('FIDIC 20.1', 'FIDIC 20.2.1');
entCode = entCode.replaceAll('Sub-Clause 20.1', 'Sub-Clause 20.2.1 (Notice of Claim)');
entCode = entCode.replaceAll('Sub-Clause 8.4', 'Sub-Clause 8.5 (Extension of Time)');
fs.writeFileSync('assets/js/enterprise-features.js', entCode, 'utf8');

let khCode = fs.readFileSync('knowhow.html', 'utf8');
khCode = khCode.replaceAll('المادة 20.1', 'المادة 20.2.1 (إشعار المطالبة)');
khCode = khCode.replaceAll('FIDIC 20.1', 'FIDIC 20.2.1');
fs.writeFileSync('knowhow.html', khCode, 'utf8');
console.log('✅ knowhow.html & enterprise-features.js: FIDIC 2017 Sub-Clause 20.2.1 citations updated (CALC-6 fixed)');

// 4. Update claimsMaster in config.js with accurate FIDIC 2017 clauses and 28-day notice details
let cfgCode = fs.readFileSync('assets/js/config.js', 'utf8');
cfgCode = cfgCode.replace(
  '"fidic_clause": "FIDIC 2017 Sub-Clause 1.9 & 8.4"',
  '"fidic_clause": "FIDIC 2017 Sub-Clause 1.9 & 8.5 (Extension of Time)",\n      "event_date": "2026-01-05",\n      "notice_compliance": "ضمن المهلة النظامية 28 يوماً (15 يوماً)"'
);
cfgCode = cfgCode.replace(
  '"fidic_clause": "FIDIC 2017 Sub-Clause 4.12 (Unforeseeable Physical Conditions)"',
  '"fidic_clause": "FIDIC 2017 Sub-Clause 4.12 & 8.5 (Unforeseeable Physical Conditions)",\n      "event_date": "2026-01-18",\n      "notice_compliance": "ضمن المهلة النظامية 28 يوماً (17 يوماً)"'
);
cfgCode = cfgCode.replace(
  '"fidic_clause": "FIDIC 2017 Sub-Clause 8.4 (EOT)"',
  '"fidic_clause": "FIDIC 2017 Sub-Clause 8.5 & 8.6 (Delays Caused by Authorities)",\n      "event_date": "2026-02-01",\n      "notice_compliance": "ضمن المهلة النظامية 28 يوماً (19 يوماً)"'
);
fs.writeFileSync('assets/js/config.js', cfgCode, 'utf8');
console.log('✅ assets/js/config.js: claimsMaster FIDIC 2017 clauses & notice dates updated (CALC-6 fixed)');

console.log('\nCalculations, EVM, 3-Way Match & FIDIC patches completed.');
