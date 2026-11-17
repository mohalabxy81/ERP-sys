/* ==========================================================================
   EVM.JS - Earned Value Management Mathematical Engine & S-Curve
   ========================================================================== */
function calculateEVM(prj) {
  const BAC = prj.direct_cost_budget;
  const progressPct = prj.physical_progress_pct / 100;
  const EV = BAC * progressPct;
  const PV = BAC * Math.min(progressPct + 0.15, 1.0);
  const AC = EV * 0.945;
  
  const CV = EV - AC;
  const SV = EV - PV;
  const CPI = AC > 0 ? (EV / AC) : 1.0;
  const SPI = PV > 0 ? (EV / PV) : 1.0;
  const EAC = CPI > 0 ? (BAC / CPI) : BAC;
  const VAC = BAC - EAC;

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  document.getElementById("kpi-contract-value").textContent = fmt(prj.contract_value);
  document.getElementById("kpi-budget-cost").textContent = fmt(BAC);
  document.getElementById("kpi-ev-value").textContent = fmt(EV);
  document.getElementById("kpi-ac-value").textContent = fmt(AC);
  document.getElementById("kpi-progress-pct").textContent = (progressPct * 100).toFixed(1) + "%";
  
  document.getElementById("kpi-cpi-val").textContent = CPI.toFixed(3);
  document.getElementById("kpi-spi-val").textContent = SPI.toFixed(3);
  document.getElementById("kpi-eac-val").textContent = fmt(EAC);
  document.getElementById("kpi-vac-val").textContent = fmt(VAC);

  const cardCpi = document.getElementById("card-cpi");
  const cardSpi = document.getElementById("card-spi");
  if (CPI >= 1.0) {
    cardCpi.className = "kpi-card green";
    document.getElementById("kpi-cpi-desc").textContent = "أداء التكلفة ممتاز (وفر بالميزانية)";
  } else {
    cardCpi.className = "kpi-card red";
    document.getElementById("kpi-cpi-desc").textContent = "تحذير: تجاوز في التكاليف الفعلية";
  }

  if (SPI >= 1.0) {
    cardSpi.className = "kpi-card green";
    document.getElementById("kpi-spi-desc").textContent = "المشروع متقدم عن الجدول الزمني";
  } else {
    cardSpi.className = "kpi-card amber";
    document.getElementById("kpi-spi-desc").textContent = "المشروع يعاني من تأخير طفيف";
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
