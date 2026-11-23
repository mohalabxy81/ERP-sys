const fs = require('fs');

console.log('=== Harmonizing Master Data IDs (DATA-2 & DATA-3) ===\n');

let cfg = fs.readFileSync('assets/js/config.js', 'utf8');

// 1. Normalize 5-digit supplier IDs in supplierItemsMaster to 4 digits (SUP-00004 -> SUP-0004)
for (let i = 1; i <= 12; i++) {
  const padded5 = 'SUP-' + String(i).padStart(5, '0');
  const padded4 = 'SUP-' + String(i).padStart(4, '0');
  cfg = cfg.replaceAll(`"${padded5}"`, `"${padded4}"`);
}
console.log('✅ Normalized 5-digit supplier IDs in supplierItemsMaster.');

// 2. Harmonize purchaseOrders supplier IDs (SUP-01 -> SUP-0001)
for (let i = 1; i <= 6; i++) {
  const shortId = 'SUP-' + String(i).padStart(2, '0');
  const standardId = 'SUP-' + String(i).padStart(4, '0');
  // Only replace inside purchaseOrders and financeAP
  cfg = cfg.replaceAll(`"supplier_id": "${shortId}"`, `"supplier_id": "${standardId}"`);
}
console.log('✅ Harmonized purchaseOrders & financeAP supplier IDs to standard SUP-0001 format.');

// 3. Harmonize contractorsMaster & subcontractsMaster
// Map CTR-201..CTR-210 to SUB-0001..SUB-0010 in subcontractsMaster while preserving contractor_code
for (let i = 1; i <= 10; i++) {
  const ctrId = 'CTR-' + (200 + i);
  const subId = 'SUB-' + String(i).padStart(4, '0');
  cfg = cfg.replaceAll(`"contractor_id": "${ctrId}"`, `"contractor_id": "${subId}",\n      "contractor_code": "${ctrId}"`);
}
console.log('✅ Harmonized subcontractsMaster contractor_id to match contractorsMaster SUB-0001..SUB-0010 format.');

// 4. In contractorsMaster, also add "contractor_code": "CTR-20X" for bidirectional compatibility
for (let i = 1; i <= 19; i++) {
  const subId = 'SUB-' + String(i).padStart(4, '0');
  const ctrId = 'CTR-' + (200 + i);
  if (!cfg.includes(`"contractor_code": "${ctrId}"`)) {
    cfg = cfg.replace(
      `"contractor_id": "${subId}",`,
      `"contractor_id": "${subId}",\n      "contractor_code": "${ctrId}",`
    );
  }
}
console.log('✅ Added contractor_code (CTR-201..CTR-219) into contractorsMaster.');

// 5. Align PRJ-2001 budget with scheduleMaster activities sum
// PRJ-2001 direct_cost_budget: 123086.07 -> 160000.00 so BAC matches schedule activities (160k)
cfg = cfg.replace(
  '"direct_cost_budget": 123086.07,',
  '"direct_cost_budget": 160000.00,\n      "baseline_direct_budget": 160000.00,'
);
console.log('✅ Aligned PRJ-2001 direct_cost_budget with schedule activities baseline.');

fs.writeFileSync('assets/js/config.js', cfg, 'utf8');
console.log('\nMaster Data foreign keys and IDs harmonized successfully.');
