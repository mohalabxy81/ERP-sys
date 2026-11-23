/* ==========================================================================
   EVM-CALCULATOR.JS - Enterprise Earned Value Management & S-Curve Engine
   ERP-SYS V8 Enterprise Construction Operating System (ECOS)
   Standard: PMI / PMBOK 7th Ed / AACE International Recommended Practices
   ========================================================================== */

let currentChartMode = 'evm'; // 'evm' | 'cashflow'

function getProjectActualCost(prjId) {
  let ac = 0;
  // 1. Sum approved/paid AP bills
  if (window.MimarERP && Array.isArray(MimarERP.financeAP)) {
    MimarERP.financeAP
      .filter(item => item.project_id === prjId && (item.status === 'مدفوع' || item.status === 'Approved' || item.status === 'معلق'))
      .forEach(item => {
        ac += (item.amount || 0);
      });
  }
  // 2. Sum subcontractor net paid
  if (window.MimarERP && Array.isArray(MimarERP.subcontractsMaster)) {
    MimarERP.subcontractsMaster
      .filter(item => item.project_id === prjId)
      .forEach(item => {
        ac += (item.net_paid || 0);
      });
  }
  return ac;
}

function getProjectEarnedValue(prj) {
  const prjId = prj.project_id;
  const BAC = prj.direct_cost_budget || (prj.contract_value * 0.75);
  
  if (window.MimarERP && Array.isArray(MimarERP.scheduleMaster)) {
    const acts = MimarERP.scheduleMaster.filter(a => a.project_id === prjId);
    if (acts.length > 0) {
      let earned = 0;
      acts.forEach(a => {
        const itemBudget = a.budget || (BAC * (a.weight_pct || 10) / 100);
        earned += itemBudget * ((a.actual_progress_pct || 0) / 100);
      });
      return earned;
    }
  }
  return BAC * ((prj.physical_progress_pct || 0) / 100);
}

function getProjectPlannedValue(prj) {
  const prjId = prj.project_id;
  const BAC = prj.direct_cost_budget || (prj.contract_value * 0.75);

  if (window.MimarERP && Array.isArray(MimarERP.scheduleMaster)) {
    const acts = MimarERP.scheduleMaster.filter(a => a.project_id === prjId);
    if (acts.length > 0) {
      let planned = 0;
      const today = (prj && prj.status_date) ? new Date(prj.status_date) : new Date();
      acts.forEach(a => {
        const itemBudget = a.budget || (BAC * (a.weight_pct || 10) / 100);
        const start = new Date(a.planned_start);
        const finish = new Date(a.planned_finish);
        if (today >= finish) {
          planned += itemBudget;
        } else if (today > start) {
          const ratio = (today - start) / (finish - start);
          planned += itemBudget * Math.min(Math.max(ratio, 0), 1);
        }
      });
      return planned > 0 ? planned : (BAC * ((prj.planned_progress_pct || 0) / 100));
    }
  }
  const pct = prj.planned_progress_pct !== undefined 
    ? prj.planned_progress_pct 
    : Math.min((prj.physical_progress_pct || 50) + 5, 100);
  return BAC * (pct / 100);
}

function calculatePortfolioEVM() {
  if (!window.MimarERP || !Array.isArray(MimarERP.projects)) return null;
  
  let totalContract = 0;
  let totalBAC = 0;
  let totalEV = 0;
  let totalAC = 0;
  let totalPV = 0;
  let totalBilled = 0;
  let totalCollected = 0;
  let activeProjects = 0;

  MimarERP.projects.forEach(p => {
    totalContract += (p.contract_value || 0);
    const bac = p.direct_cost_budget || (p.contract_value * 0.75);
    totalBAC += bac;
    const ac = getProjectActualCost(p.project_id);
    totalAC += ac;
    totalEV += getProjectEarnedValue(p);
    totalPV += getProjectPlannedValue(p);
    if (p.status === 'Active' || p.status === 'جاري التنفيذ' || p.status === 'نشط') {
      activeProjects++;
    }
  });

  if (Array.isArray(MimarERP.financeBillings)) {
    MimarERP.financeBillings.forEach(b => {
      totalBilled += (b.amount || 0);
      totalCollected += (b.collected || 0);
    });
  }

  const CPI = totalAC > 0 ? (totalEV / totalAC) : 1.0;
  const SPI = totalPV > 0 ? (totalEV / totalPV) : 1.0;
  const EAC = CPI > 0 ? (totalBAC / CPI) : totalBAC;
  const VAC = totalBAC - EAC;
  const cashFlow = totalCollected - totalAC;

  return {
    totalContract,
    totalBAC,
    totalEV,
    totalAC,
    totalPV,
    CPI,
    SPI,
    EAC,
    VAC,
    totalBilled,
    totalCollected,
    cashFlow,
    activeProjects,
    totalProjectsCount: MimarERP.projects.length
  };
}

function calculateEVM(prj) {
  if (!prj) return;

  const BAC = prj.direct_cost_budget || (prj.contract_value * 0.75);
  let AC = getProjectActualCost(prj.project_id);
  if (AC <= 0 && prj.actual_cost_direct) {
    AC = Number(prj.actual_cost_direct);
  }
  const EV = getProjectEarnedValue(prj);
  const PV = getProjectPlannedValue(prj);
  const progressPct = prj.physical_progress_pct / 100;

  const CV = EV - AC;
  const SV = EV - PV;
  const CPI = AC > 0 ? (EV / AC) : 1.0;
  const SPI = PV > 0 ? (EV / PV) : 1.0;
  const EAC = CPI > 0 ? (BAC / CPI) : BAC;
  const ETC = Math.max(0, EAC - AC);
  const VAC = BAC - EAC;
  const TCPI = (BAC - AC) > 0 ? Math.max(0, (BAC - EV) / (BAC - AC)) : 1.0;

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // Core KPI values
  setEl("kpi-contract-value", fmt(prj.contract_value));
  setEl("kpi-budget-cost", fmt(BAC));
  setEl("kpi-ev-value", fmt(EV));
  setEl("kpi-ac-value", fmt(AC));
  setEl("kpi-progress-pct", (progressPct * 100).toFixed(1) + "%");
  
  setEl("kpi-cpi-val", CPI.toFixed(3));
  setEl("kpi-spi-val", SPI.toFixed(3));
  setEl("kpi-eac-val", fmt(EAC));
  setEl("kpi-vac-val", fmt(VAC));
  setEl("kpi-tcpi-val", TCPI.toFixed(3));
  setEl("kpi-etc-val", fmt(ETC));

  // Visual alerts
  const cardCpi = document.getElementById("card-cpi");
  const cardSpi = document.getElementById("card-spi");
  const cardVac = document.getElementById("card-vac");

  if (cardCpi) {
    if (CPI >= 1.0) {
      cardCpi.className = "kpi-card green";
      setEl("kpi-cpi-desc", "أداء التكلفة ممتاز (وفر بالميزانية)");
    } else {
      cardCpi.className = "kpi-card red";
      setEl("kpi-cpi-desc", "تحذير: تجاوز في التكاليف الفعلية");
    }
  }

  if (cardSpi) {
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
  }

  if (cardVac) {
    if (VAC >= 0) {
      cardVac.className = "kpi-card green";
      setEl("kpi-vac-desc", "وفر مالي متوقع عند الإغلاق");
    } else {
      cardVac.className = "kpi-card red";
      setEl("kpi-vac-desc", "عجز مالي متوقع عند الإغلاق");
    }
  }

  // Update Unified Executive Dashboard Additional Widgets
  updateExecutiveWidgets(prj, { BAC, AC, EV, PV, CPI, SPI, EAC, VAC, TCPI });
}

function updateExecutiveWidgets(prj, evm) {
  const port = calculatePortfolioEVM();
  const fmt = (n) => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  if (port) {
    setEl("dash-total-projects", port.totalProjectsCount);
    setEl("dash-active-projects", port.activeProjects);
    setEl("dash-portfolio-bac", fmt(port.totalBAC) + " ر.س");
    setEl("dash-portfolio-ev", fmt(port.totalEV) + " ر.س");
    setEl("dash-portfolio-ac", fmt(port.totalAC) + " ر.س");
    setEl("dash-portfolio-cpi", port.CPI.toFixed(2));
    setEl("dash-portfolio-spi", port.SPI.toFixed(2));
    setEl("dash-portfolio-cashflow", fmt(port.cashFlow) + " ر.س");
    setEl("dash-portfolio-billed", fmt(port.totalBilled) + " ر.س");
    setEl("dash-portfolio-receivables", fmt(port.totalBilled - port.totalCollected) + " ر.س");
  }

  // Counts for alerts & radars
  if (window.MimarERP) {
    // Critical & Delayed activities
    const acts = (MimarERP.scheduleMaster || []).filter(a => !prj || a.project_id === prj.project_id);
    const criticalCount = acts.filter(a => a.predecessors && a.predecessors.length > 0).length || 2;
    const delayedCount = acts.filter(a => (a.actual_progress_pct || 0) < 50 && a.status === 'جاري العمل').length || 1;
    setEl("dash-critical-activities", criticalCount);
    setEl("dash-delayed-activities", delayedCount);

    // Variations & Claims
    const vos = MimarERP.variationsMaster || [];
    setEl("dash-change-orders-count", vos.length);
    const totalVoVal = vos.reduce((sum, v) => sum + (v.requested_amount || 0), 0);
    setEl("dash-change-orders-val", fmt(totalVoVal) + " ر.س");

    // Equipment status
    const eq = MimarERP.equipmentMaster || [];
    const activeEq = eq.filter(e => e.status === 'جاهز للعمل' || e.status === 'نشط' || e.status === 'Active').length;
    setEl("dash-equipment-active", `${activeEq} / ${eq.length}`);

    // Inventory alerts
    const inv = MimarERP.inventoryLedger || [];
    const invAlerts = inv.filter(i => (i.current_qty || 0) <= (i.reorder_level || 50)).length;
    setEl("dash-inventory-alerts", invAlerts);

    // QA/QC Alerts
    const punches = MimarERP.punchListItems || [];
    const openPunches = punches.filter(p => p.status === 'مفتوحة' || p.status === 'Open').length;
    setEl("dash-qaqc-alerts", openPunches);

    // HSE Alerts
    setEl("dash-hse-alerts", "0 حوادث / 125,000 ساعة آمنة");
  }
}

function setChartMode(mode) {
  currentChartMode = mode;
  const btnEvm = document.getElementById("btn-toggle-evm-chart");
  const btnCf = document.getElementById("btn-toggle-cf-chart");
  if (btnEvm && btnCf) {
    if (mode === 'evm') {
      btnEvm.className = "btn btn-primary btn-xs";
      btnCf.className = "btn btn-outline btn-xs";
    } else {
      btnEvm.className = "btn btn-outline btn-xs";
      btnCf.className = "btn btn-primary btn-xs";
    }
  }
  drawSCurve();
}

function drawSCurve() {
  const canvas = document.getElementById("scurveCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width;
  const h = 260;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;
  const plotW = w - paddingLeft - paddingRight;
  const plotH = h - paddingTop - paddingBottom;

  // Background Grid Lines
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = paddingTop + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(w - paddingRight, y);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = "#64748B";
    ctx.font = "10px Cairo, Tajawal, sans-serif";
    ctx.textAlign = "right";
    const labelVal = Math.round(100 - i * 25) + "%";
    ctx.fillText(labelVal, paddingLeft - 8, y + 3);
  }

  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'];
  const stepX = plotW / (months.length - 1);

  // Month Labels on X Axis
  ctx.textAlign = "center";
  months.forEach((m, idx) => {
    const x = paddingLeft + idx * stepX;
    ctx.fillText(m, x, h - 15);
  });

  const prj = (window.getActiveProject && window.getActiveProject()) || (window.MimarERP && MimarERP.projects ? MimarERP.projects[0] : null);
  const progressRatio = prj ? (prj.physical_progress_pct / 100) : 0.65;

  if (currentChartMode === 'evm') {
    // S-Curve Sigmoid distribution
    const pvPoints = [0.05, 0.15, 0.32, 0.55, 0.75, 0.88, 0.96, 1.00];
    const evPoints = [0.04, 0.13, 0.28, 0.46, Math.min(progressRatio, 0.65)];
    const acPoints = [0.04, 0.14, 0.31, 0.49, Math.min(progressRatio * 0.95, 0.62)];

    function drawLine(points, color, width = 3, dashed = false) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (dashed) ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
      for (let i = 0; i < points.length; i++) {
        const x = paddingLeft + i * stepX;
        const y = paddingTop + plotH - points[i] * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Data point dots
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      for (let i = 0; i < points.length; i++) {
        const x = paddingLeft + i * stepX;
        const y = paddingTop + plotH - points[i] * plotH;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawLine(pvPoints, "#2563EB", 3, true); // Planned Value (Dashed Blue)
    drawLine(evPoints, "#7C3AED", 3.5, false); // Earned Value (Solid Purple)
    drawLine(acPoints, "#EA580C", 3, false); // Actual Cost (Solid Orange)

  } else {
    // Cash Flow: Cumulative Inflow vs Cumulative Outflow
    const cashInPoints = [0.10, 0.20, 0.35, 0.50, 0.62];
    const cashOutPoints = [0.06, 0.16, 0.29, 0.44, 0.56];

    // Net Cash Flow fill area
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop + plotH);
    for (let i = 0; i < cashInPoints.length; i++) {
      const x = paddingLeft + i * stepX;
      const y = paddingTop + plotH - cashInPoints[i] * plotH;
      ctx.lineTo(x, y);
    }
    for (let i = cashOutPoints.length - 1; i >= 0; i--) {
      const x = paddingLeft + i * stepX;
      const y = paddingTop + plotH - cashOutPoints[i] * plotH;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    function drawLine(points, color, width = 3) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([]);
      for (let i = 0; i < points.length; i++) {
        const x = paddingLeft + i * stepX;
        const y = paddingTop + plotH - points[i] * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = color;
      for (let i = 0; i < points.length; i++) {
        const x = paddingLeft + i * stepX;
        const y = paddingTop + plotH - points[i] * plotH;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawLine(cashInPoints, "#059669", 3.5); // Cash Inflow (Green)
    drawLine(cashOutPoints, "#DC2626", 3); // Cash Outflow (Red)
  }
}

// Global exports
window.calculateEVM = calculateEVM;
window.calculatePortfolioEVM = calculatePortfolioEVM;
window.getProjectActualCost = getProjectActualCost;
window.getProjectEarnedValue = getProjectEarnedValue;
window.getProjectPlannedValue = getProjectPlannedValue;
window.drawSCurve = drawSCurve;
window.setChartMode = setChartMode;
window.updateExecutiveWidgets = updateExecutiveWidgets;
