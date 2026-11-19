/* ==========================================================================
   EVM.JS - Earned Value Management Mathematical Engine & S-Curve
   ========================================================================== */
function calculateEVM(prj) {
  const BAC = prj.direct_cost_budget;
  const progressPct = prj.physical_progress_pct / 100;
  const EV = BAC * progressPct;
  const PV = BAC * Math.min(progressPct + 0.15, 1.0);
  const AC = EV * 0.945;
  
  // OpenConstructionERP Full EVM Multi-Variant Kernel
  const evm = (window.FullEvmEngine && window.FullEvmEngine.computeFullEVMKernel)
    ? window.FullEvmEngine.computeFullEVMKernel(BAC, PV, EV, AC)
    : {
        CV: EV - AC,
        SV: EV - PV,
        CPI: AC > 0 ? (EV / AC) : 1.0,
        SPI: PV > 0 ? (EV / PV) : 1.0,
        EAC_CPI: AC > 0 && EV > 0 ? (BAC / (EV / AC)) : BAC,
        EAC_Remaining: AC + (BAC - EV),
        EAC_Combined: AC + (BAC - EV),
        VAC: 0,
        TCPI_BAC: 1.0,
        TCPI_EAC: 1.0
      };

  const CV = evm.CV;
  const SV = evm.SV;
  const CPI = evm.CPI;
  const SPI = evm.SPI;
  const EAC = evm.EAC_CPI;
  const VAC = evm.VAC;

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl("kpi-contract-value", fmt(prj.contract_value));
  setEl("kpi-budget-cost", fmt(BAC));
  setEl("kpi-ev-value", fmt(EV));
  setEl("kpi-ac-value", fmt(AC));
  setEl("kpi-progress-pct", (progressPct * 100).toFixed(1) + "%");
  
  setEl("kpi-cpi-val", CPI.toFixed(3));
  setEl("kpi-spi-val", SPI.toFixed(3));
  setEl("kpi-eac-val", fmt(EAC));
  setEl("kpi-vac-val", fmt(VAC));
  setEl("kpi-tcpi-val", evm.TCPI_BAC.toFixed(3));
  setEl("kpi-eac-combined-val", fmt(evm.EAC_Combined));

  const cardCpi = document.getElementById("card-cpi");
  const cardSpi = document.getElementById("card-spi");
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
      setEl("kpi-spi-desc", "المشروع متقدم عن الجدول الزمني");
    } else {
      cardSpi.className = "kpi-card amber";
      setEl("kpi-spi-desc", "المشروع يعاني من تأخير طفيف");
    }
  }
}

function drawSCurve() {
  const canvas = document.getElementById("scurveCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.parentElement.clientWidth;
  const h = canvas.height = 240;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (h / 5) * i;
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 20, y); ctx.stroke();
  }

  const months = 6;
  const stepX = (w - 70) / (months - 1);
  const pvPoints = [0.05, 0.18, 0.40, 0.65, 0.85, 1.00];
  const evPoints = [0.04, 0.15, 0.32, 0.52, 0.65, 0.65];
  const acPoints = [0.04, 0.14, 0.30, 0.49, 0.61, 0.61];

  function drawLine(points, color, count) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let i = 0; i < count; i++) {
      const x = 50 + i * stepX;
      const y = h - 30 - points[i] * (h - 60);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawLine(pvPoints, "#2563EB", 6);
  drawLine(evPoints, "#7C3AED", 5);
  drawLine(acPoints, "#FF6500", 5);
}
