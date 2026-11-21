const fs = require('fs');
const c = fs.readFileSync('assets/js/config.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('"financeAP"') || l.includes('"financeBillings"') || l.includes('"subcontractsMaster"') || l.includes('"costControlRegister"')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
