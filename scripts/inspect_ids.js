const fs = require('fs');
let code = fs.readFileSync('assets/js/config.js', 'utf8');
const window = {};
eval(code);

console.log('Suppliers in suppliersMaster:', window.MimarERP.suppliersMaster.map(s => s.supplier_id));
console.log('Suppliers in supplierItemsMaster:', [...new Set(window.MimarERP.supplierItemsMaster.map(s => s.supplier_id))]);
console.log('Suppliers in purchaseOrders:', [...new Set(window.MimarERP.purchaseOrders.map(s => s.supplier_id))]);
console.log('Suppliers in financeAP:', [...new Set(window.MimarERP.financeAP.map(s => s.supplier_id))]);

console.log('Contractors in contractorsMaster:', window.MimarERP.contractorsMaster.map(c => c.contractor_id));
console.log('Contractors in subcontractsMaster:', [...new Set(window.MimarERP.subcontractsMaster.map(s => s.contractor_id))]);
