const fs = require('fs');
const crud = fs.readFileSync('assets/js/crud-engine.js', 'utf8');

const funcs = crud.match(/function\s+delete\w+\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g) || [];
console.log('Found', funcs.length, 'delete functions in crud-engine.js');

funcs.forEach((fn, idx) => {
  const nameMatch = fn.match(/function\s+(delete\w+)/);
  const name = nameMatch ? nameMatch[1] : `unknown_${idx}`;
  const usesConfirm = fn.includes('confirmDelete');
  const usesSave = fn.includes('saveToLocalStorage');
  const usesToast = fn.includes('showToast');
  console.log(`${idx+1}. ${name.padEnd(25)}: confirmDelete=${usesConfirm}, saveToLocal=${usesSave}, showToast=${usesToast}`);
});
