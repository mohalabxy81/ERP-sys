// Project Dataset Configuration
    const projectDatabase = {
      'PRJ-2024-001': {
        bac: 450000000,
        pv: 324000000,
        ev: 335250000,
        ac: 321000000
      },
      'PRJ-2024-003': {
        bac: 280000000,
        pv: 176400000,
        ev: 162960000,
        ac: 159764705
      },
      'PRJ-2024-007': {
        bac: 395000000,
        pv: 201450000,
        ev: 161950000,
        ac: 177967032
      },
      'PRJ-2024-012': {
        bac: 165000000,
        pv: 141900000,
        ev: 146850000,
        ac: 139857142
      },
      'PRJ-2024-015': {
        bac: 310000000,
        pv: 189100000,
        ev: 194680000,
        ac: 175387387
      }
    };

    // Calculate & Refresh all EVM formulas dynamically
    function recalculateAllEVM() {
      const prjKey = document.getElementById('filterProject').value;
      const data = projectDatabase[prjKey] || projectDatabase['PRJ-2024-001'];

      const bac = data.bac;
      const pv = data.pv;
      const ev = data.ev;
      const ac = data.ac;

      const cv = ev - ac;
      const sv = ev - pv;
      const cpi = (ev / ac);
      const spi = (ev / pv);
      const eac = (bac / cpi);
      const etc = eac - ac;
      const vac = bac - eac;
      const tcpi = (bac - ev) / (bac - ac);

      // Format Numbers
      document.getElementById('valBAC').innerText = formatSAR(bac);
      document.getElementById('valPV').innerText = formatSAR(pv);
      document.getElementById('valEV').innerText = formatSAR(ev);
      document.getElementById('valAC').innerText = formatSAR(ac);
      
      const cvElem = document.getElementById('valCV');
      cvElem.innerText = (cv >= 0 ? '+' : '') + formatSAR(cv);
      cvElem.style.color = (cv >= 0 ? '#10b981' : '#ef4444');

      const svElem = document.getElementById('valSV');
      svElem.innerText = (sv >= 0 ? '+' : '') + formatSAR(sv);
      svElem.style.color = (sv >= 0 ? '#10b981' : '#ef4444');

      const cpiElem = document.getElementById('valCPI');
      cpiElem.innerText = cpi.toFixed(3);
      cpiElem.style.color = (cpi >= 1.0 ? '#10b981' : '#ef4444');

      const spiElem = document.getElementById('valSPI');
      spiElem.innerText = spi.toFixed(3);
      spiElem.style.color = (spi >= 1.0 ? '#10b981' : '#ef4444');

      document.getElementById('valEAC').innerText = formatSAR(Math.round(eac));
      document.getElementById('valETC').innerText = formatSAR(Math.round(etc));

      const vacElem = document.getElementById('valVAC');
      vacElem.innerText = (vac >= 0 ? '+' : '') + formatSAR(Math.round(vac));
      vacElem.style.color = (vac >= 0 ? '#10b981' : '#ef4444');

      document.getElementById('valTCPI').innerText = tcpi.toFixed(3);

      alert('تمت إعادة حساب مؤشرات القيمة المكتسبة بالكامل وفق أحدث مستخلصات الموقع وفواتير المشتريات.');
    }

    function formatSAR(val) {
      return Number(val).toLocaleString('en-US');
    }

    function applyFilters() {
      const prjKey = document.getElementById('filterProject').value;
      const period = document.getElementById('filterPeriod').value;
      const center = document.getElementById('filterCostCenter').value;
      
      // Update UI metrics for selected project
      const data = projectDatabase[prjKey];
      if (data) {
        document.getElementById('valBAC').innerText = formatSAR(data.bac);
        document.getElementById('valPV').innerText = formatSAR(data.pv);
        document.getElementById('valEV').innerText = formatSAR(data.ev);
        document.getElementById('valAC').innerText = formatSAR(data.ac);
        
        const cv = data.ev - data.ac;
        const sv = data.ev - data.pv;
        const cpi = (data.ev / data.ac);
        const spi = (data.ev / data.pv);
        const eac = (data.bac / cpi);
        const etc = eac - data.ac;
        const vac = data.bac - eac;
        const tcpi = (data.bac - data.ev) / (data.bac - data.ac);

        const cvElem = document.getElementById('valCV');
        cvElem.innerText = (cv >= 0 ? '+' : '') + formatSAR(cv);
        cvElem.style.color = (cv >= 0 ? '#10b981' : '#ef4444');

        const svElem = document.getElementById('valSV');
        svElem.innerText = (sv >= 0 ? '+' : '') + formatSAR(sv);
        svElem.style.color = (sv >= 0 ? '#10b981' : '#ef4444');

        const cpiElem = document.getElementById('valCPI');
        cpiElem.innerText = cpi.toFixed(3);
        cpiElem.style.color = (cpi >= 1.0 ? '#10b981' : '#ef4444');

        const spiElem = document.getElementById('valSPI');
        spiElem.innerText = spi.toFixed(3);
        spiElem.style.color = (spi >= 1.0 ? '#10b981' : '#ef4444');

        document.getElementById('valEAC').innerText = formatSAR(Math.round(eac));
        document.getElementById('valETC').innerText = formatSAR(Math.round(etc));
        
        const vacElem = document.getElementById('valVAC');
        vacElem.innerText = (vac >= 0 ? '+' : '') + formatSAR(Math.round(vac));
        vacElem.style.color = (vac >= 0 ? '#10b981' : '#ef4444');

        document.getElementById('valTCPI').innerText = tcpi.toFixed(3);
      }
    }

    // Drilldown Table Expand / Collapse Management
    function toggleRowGroup(groupId) {
      const rows = document.querySelectorAll('.group-' + groupId);
      const icon = document.getElementById('icon-' + groupId);
      
      let willShow = true;
      if (icon.classList.contains('open')) {
        icon.classList.remove('open');
        willShow = false;
      } else {
        icon.classList.add('open');
        willShow = true;
      }

      rows.forEach(row => {
        row.style.display = willShow ? '' : 'none';
      });
    }

    function toggleSubGroup(subId) {
      const rows = document.querySelectorAll('.group-' + subId);
      const icon = document.getElementById('icon-' + subId);
      
      let willShow = true;
      if (icon.classList.contains('open')) {
        icon.classList.remove('open');
        willShow = false;
      } else {
        icon.classList.add('open');
        willShow = true;
      }

      rows.forEach(row => {
        row.style.display = willShow ? '' : 'none';
      });
    }

    function expandAllRows(show) {
      const toggles = document.querySelectorAll('.expand-toggle');
      toggles.forEach(toggle => {
        if (show) toggle.classList.add('open');
        else toggle.classList.remove('open');
      });

      const childRows = document.querySelectorAll('.row-level-2, .row-level-3');
      childRows.forEach(row => {
        row.style.display = show ? '' : 'none';
      });
    }

    function filterDrilldownTable() {
      const input = document.getElementById('searchCostCode').value.toLowerCase();
      const rows = document.querySelectorAll('#costCodeTable tbody tr');

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(input)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    // S-Curve Forecast Toggle
    let forecastVisible = true;
    function toggleForecastCurve() {
      const path = document.getElementById('forecastPath');
      if (path) {
        forecastVisible = !forecastVisible;
        path.style.display = forecastVisible ? 'block' : 'none';
      }
    }

    // Modal Simulation Logic
    function openSimulationModal() {
      const modal = document.getElementById('simModal');
      if (modal) modal.classList.add('active');
    }

    function closeSimulationModal() {
      const modal = document.getElementById('simModal');
      if (modal) modal.classList.remove('active');
    }

    function runEvmSimulation() {
      const factor = parseFloat(document.getElementById('cpiSlider').value);
      document.getElementById('cpiSliderVal').innerText = factor.toFixed(2);

      const bac = 450000000;
      const ac = 321000000;
      const ev = 335250000;

      // Simulated EAC = AC + (BAC - EV) / factor
      const simulatedEac = ac + ((bac - ev) / factor);
      const simulatedVac = bac - simulatedEac;

      document.getElementById('simResultEAC').innerText = formatSAR(Math.round(simulatedEac)) + ' ر.س';
      
      const vacElem = document.getElementById('simResultVAC');
      vacElem.innerText = (simulatedVac >= 0 ? '+' : '') + formatSAR(Math.round(simulatedVac)) + ' ر.س ' + (simulatedVac >= 0 ? '(وفر)' : '(عجز)');
      vacElem.style.color = simulatedVac >= 0 ? '#10b981' : '#ef4444';
    }

    function applySimulationToView() {
      const simulatedEac = document.getElementById('simResultEAC').innerText;
      document.getElementById('valEAC').innerText = simulatedEac.replace(' ر.س', '');
      closeSimulationModal();
      alert('تم تحديث التقدير عند الاكتمال EAC على اللوحة الرئيسية وفق سيناريو المحاكاة المعتمد.');
    }

    // Export Handlers
    function exportToExcel() {
      let csv = "كود التكلفة,وصف الحزمة,الميزانية الأصلية (BAC),القيمة المخططة (PV),القيمة المكتسبة (EV),التكلفة الفعلية (AC),الالتزامات,انحراف التكلفة (CV),CPI\n";
      const rows = document.querySelectorAll('#costCodeTable tbody tr');
      rows.forEach(r => {
        const cols = r.querySelectorAll('td');
        if (cols.length >= 9) {
          const code = cols[0].innerText.replace(/[\n\r]+/g, ' ').trim();
          const desc = cols[1].innerText.replace(/[\n\r]+/g, ' ').trim();
          const bac = cols[2].innerText.replace(/,/g, '').trim();
          const pv = cols[3].innerText.replace(/,/g, '').trim();
          const ev = cols[4].innerText.replace(/,/g, '').trim();
          const ac = cols[5].innerText.replace(/,/g, '').trim();
          const comm = cols[6].innerText.replace(/,/g, '').trim();
          const cv = cols[7].innerText.replace(/,/g, '').trim();
          const cpi = cols[8].innerText.trim();

          csv += `"${code}","${desc}","${bac}","${pv}","${ev}","${ac}","${comm}","${cv}","${cpi}"\n`;
        }
      });

      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "MimarERP_Cost_Control_Report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function exportToPDF() {
      window.print();
    }
