/**
 * MimarERP Planning & Scheduling Interactive Engine
 * Provides pure HTML/CSS/JS Gantt visualization, S-Curve rendering,
 * critical path highlighting, baseline overlay, and lookahead filtering.
 */

// Schedule Data Store (Baseline Start Jan 1, 2026; Data Date: March 20, 2026)
const DATA_DATE = new Date('2026-03-20');
const PROJECT_START = new Date('2026-01-01');
const PROJECT_FINISH = new Date('2026-06-30');

let showBaseline = false;
let showCriticalOnly = false;
let currentLookaheadFilter = 'all';

let activities = [
  {
    id: 1,
    code: 'ACT-1000',
    desc: 'تهيئة الموقع وأعمال الحفر والإحلال حتى منسوب التأسيس',
    duration: 18,
    start: '2026-01-02',
    finish: '2026-01-20',
    baseStart: '2026-01-01',
    baseFinish: '2026-01-19',
    progress: 100,
    pred: '-',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'شركة رواد الحفريات',
    critical: true
  },
  {
    id: 2,
    code: 'ACT-1010',
    desc: 'أعمال الإحلال والدمك على طبقات واختبارات التربة ومقاييس الكثافة',
    duration: 12,
    start: '2026-01-21',
    finish: '2026-02-02',
    baseStart: '2026-01-20',
    baseFinish: '2026-02-01',
    progress: 100,
    pred: 'ACT-1000',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'مختبر فحص التربة المعتمد',
    critical: true
  },
  {
    id: 3,
    code: 'ACT-1020',
    desc: 'صب خرسانة النظافة والعزل المائي للقواعد واللبشة المسلحة',
    duration: 10,
    start: '2026-02-03',
    finish: '2026-02-13',
    baseStart: '2026-02-02',
    baseFinish: '2026-02-12',
    progress: 100,
    pred: 'ACT-1010',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'فريق العزل المتخصص',
    critical: true
  },
  {
    id: 4,
    code: 'ACT-1030',
    desc: 'حدادة ونجارة وصب خرسانة القواعد المسلحة والسملات الإنشائية',
    duration: 20,
    start: '2026-02-14',
    finish: '2026-03-05',
    baseStart: '2026-02-13',
    baseFinish: '2026-03-04',
    progress: 100,
    pred: 'ACT-1020',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'مقاول الخرسانات - شركة الفنار',
    critical: true
  },
  {
    id: 5,
    code: 'ACT-1040',
    desc: 'أعمال العزل البيتوميني الإيجابي للقواعد واختبارات الغمر والردم',
    duration: 8,
    start: '2026-03-06',
    finish: '2026-03-14',
    baseStart: '2026-03-05',
    baseFinish: '2026-03-13',
    progress: 100,
    pred: 'ACT-1030',
    totalFloat: 4,
    freeFloat: 4,
    resource: 'فريق العزل والردم',
    critical: false
  },
  {
    id: 6,
    code: 'ACT-1050',
    desc: 'حدادة وصب رقاب الأعمدة والميد الأرضية الخرسانية (Ground Beams)',
    duration: 14,
    start: '2026-03-06',
    finish: '2026-03-20',
    baseStart: '2026-03-05',
    baseFinish: '2026-03-19',
    progress: 100,
    pred: 'ACT-1030',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'مقاول الخرسانات - الفنار',
    critical: true
  },
  {
    id: 7,
    code: 'ACT-1060',
    desc: 'أعمال شبكة التسليح وصب أرضية البدروم الخرسانية (Slab on Grade)',
    duration: 12,
    start: '2026-03-15',
    finish: '2026-03-27',
    baseStart: '2026-03-12',
    baseFinish: '2026-03-24',
    progress: 75,
    pred: 'ACT-1040, ACT-1050',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'فريق الخرسانة الجاهزة',
    critical: true
  },
  {
    id: 8,
    code: 'ACT-1070',
    desc: 'أعمدة وحوائط قص الدور الأرضي الخرسانية (Ground Shear Walls)',
    duration: 16,
    start: '2026-03-21',
    finish: '2026-04-06',
    baseStart: '2026-03-18',
    baseFinish: '2026-04-03',
    progress: 25,
    pred: 'ACT-1050',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'طاقم النجارة المسلحة',
    critical: true
  },
  {
    id: 9,
    code: 'ACT-1080',
    desc: 'أعمال الشدات الخشبية والحدادة لسقف الدور الأرضي الميزانين',
    duration: 18,
    start: '2026-04-07',
    finish: '2026-04-25',
    baseStart: '2026-04-04',
    baseFinish: '2026-04-22',
    progress: 0,
    pred: 'ACT-1070',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'مقاول الهيكل الإنشائي',
    critical: true
  },
  {
    id: 10,
    code: 'ACT-1090',
    desc: 'صب خرسانة سقف الدور الأول ومعالجة الخرسانة بالبخار',
    duration: 15,
    start: '2026-04-26',
    finish: '2026-05-11',
    baseStart: '2026-04-23',
    baseFinish: '2026-05-08',
    progress: 0,
    pred: 'ACT-1080',
    totalFloat: 0,
    freeFloat: 0,
    resource: 'مصنع الخرسانة الجاهزة',
    critical: true
  },
  {
    id: 11,
    code: 'ACT-1100',
    desc: 'أعمال البلوك الإسمنتي المعزول والواجهات للبدروم والأرضي',
    duration: 25,
    start: '2026-03-28',
    finish: '2026-04-22',
    baseStart: '2026-03-25',
    baseFinish: '2026-04-19',
    progress: 10,
    pred: 'ACT-1060',
    totalFloat: 14,
    freeFloat: 6,
    resource: 'طاقم أعمال المباني',
    critical: false
  },
  {
    id: 12,
    code: 'ACT-1110',
    desc: 'التمديدات الكهربائية الأولية وحوامل الكابلات (MEP First Fix)',
    duration: 22,
    start: '2026-04-01',
    finish: '2026-04-23',
    baseStart: '2026-03-28',
    baseFinish: '2026-04-20',
    progress: 0,
    pred: 'ACT-1070',
    totalFloat: 8,
    freeFloat: 8,
    resource: 'مقاول الأعمال الكهروميكانيكية',
    critical: false
  },
  {
    id: 13,
    code: 'ACT-1120',
    desc: 'تمديدات مواسير الصرف والتغذية المعلقة ومكافحة الحريق',
    duration: 20,
    start: '2026-04-05',
    finish: '2026-04-25',
    baseStart: '2026-04-01',
    baseFinish: '2026-04-21',
    progress: 0,
    pred: 'ACT-1070',
    totalFloat: 10,
    freeFloat: 5,
    resource: 'طاقم السباكة والحرائق',
    critical: false
  },
  {
    id: 14,
    code: 'ACT-1130',
    desc: 'تصنيع وتركيب مجاري الهواء للتكييف المركزي (HVAC Ducts)',
    duration: 24,
    start: '2026-04-20',
    finish: '2026-05-14',
    baseStart: '2026-04-15',
    baseFinish: '2026-05-09',
    progress: 0,
    pred: 'ACT-1100, ACT-1110',
    totalFloat: 12,
    freeFloat: 12,
    resource: 'شركة حلول التكييف',
    critical: false
  },
  {
    id: 15,
    code: 'ACT-1140',
    desc: 'أعمال اللياسة الداخلية الأسمنتية والبؤج والأوتار للبدروم',
    duration: 22,
    start: '2026-05-02',
    finish: '2026-05-24',
    baseStart: '2026-04-28',
    baseFinish: '2026-05-20',
    progress: 0,
    pred: 'ACT-1100, ACT-1120',
    totalFloat: 16,
    freeFloat: 16,
    resource: 'طاقم التشطيبات المعمارية',
    critical: false
  }
];

// Helper calculations
function daysBetween(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((d2 - d1) / oneDay);
}

const TOTAL_PROJECT_DAYS = daysBetween(PROJECT_START, PROJECT_FINISH);
const DAY_COL_WIDTH = 28; // px per day in standard scale

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  renderTimelineHeaders();
  renderActivities();
  renderSCurve();
  updateDataDateMarker();
});

// Render Timeline Header
function renderTimelineHeaders() {
  const monthsContainer = document.getElementById('timelineMonths');
  const daysContainer = document.getElementById('timelineDays');
  monthsContainer.innerHTML = '';
  daysContainer.innerHTML = '';

  const monthsMap = [
    { name: 'يناير 2026 (Jan)', days: 31 },
    { name: 'فبراير 2026 (Feb)', days: 28 },
    { name: 'مارس 2026 (Mar)', days: 31 },
    { name: 'أبريل 2026 (Apr)', days: 30 },
    { name: 'مايو 2026 (May)', days: 31 },
    { name: 'يونيو 2026 (Jun)', days: 30 }
  ];

  let curDay = new Date(PROJECT_START);

  monthsMap.forEach(m => {
    const mCell = document.createElement('div');
    mCell.className = 'timeline-month-cell';
    mCell.style.width = (m.days * DAY_COL_WIDTH) + 'px';
    mCell.innerText = m.name;
    monthsContainer.appendChild(mCell);

    for (let i = 1; i <= m.days; i++) {
      const dCell = document.createElement('div');
      dCell.className = 'timeline-day-cell';
      dCell.style.width = DAY_COL_WIDTH + 'px';
      dCell.style.minWidth = DAY_COL_WIDTH + 'px';
      dCell.innerText = i;

      // Highlight weekend (Friday = 5, Saturday = 6)
      const dow = curDay.getDay();
      if (dow === 5 || dow === 6) {
        dCell.classList.add('weekend');
      }
      // Check if matches DATA_DATE
      if (curDay.toDateString() === DATA_DATE.toDateString()) {
        dCell.classList.add('today');
      }

      daysContainer.appendChild(dCell);
      curDay.setDate(curDay.getDate() + 1);
    }
  });

  const totalWidth = daysBetween(PROJECT_START, PROJECT_FINISH) * DAY_COL_WIDTH;
  document.getElementById('ganttInner').style.width = totalWidth + 'px';
}

// Update Today / Data Date vertical line
function updateDataDateMarker() {
  const line = document.getElementById('dataDateLine');
  const daysPassed = daysBetween(PROJECT_START, DATA_DATE);
  line.style.right = (daysPassed * DAY_COL_WIDTH) + 'px';
}

// Filter Logic
function matchesFilter(act) {
  const actStart = new Date(act.start);
  const actFinish = new Date(act.finish);

  if (currentLookaheadFilter === 'critical') {
    return act.critical;
  }
  if (currentLookaheadFilter === 'delayed') {
    // Activity should have started or finished by today, but is lagging
    return (actStart < DATA_DATE && act.progress < 100);
  }
  if (currentLookaheadFilter === '2w') {
    const end2w = new Date(DATA_DATE.getTime() + (14 * 86400000));
    return (actStart <= end2w && actFinish >= DATA_DATE);
  }
  if (currentLookaheadFilter === '4w') {
    const end4w = new Date(DATA_DATE.getTime() + (28 * 86400000));
    return (actStart <= end4w && actFinish >= DATA_DATE);
  }
  if (currentLookaheadFilter === '6w') {
    const end6w = new Date(DATA_DATE.getTime() + (42 * 86400000));
    return (actStart <= end6w && actFinish >= DATA_DATE);
  }
  return true;
}

// Render Activity Table and Gantt Rows
function renderActivities() {
  const tableBody = document.getElementById('activityTableBody');
  const ganttContainer = document.getElementById('ganttRowsContainer');
  tableBody.innerHTML = '';
  ganttContainer.innerHTML = '';

  activities.forEach(act => {
    if (!matchesFilter(act)) return;

    // 1. Render Table Row
    const tr = document.createElement('tr');
    if (act.critical) tr.classList.add('is-critical');

    const floatHtml = act.critical 
      ? `<span class="float-badge zero">0 يوم</span>` 
      : `<span class="float-badge">${act.totalFloat} يوم</span>`;

    const progressColor = act.progress === 100 ? 'var(--green)' : (act.critical ? 'var(--red)' : 'var(--teal)');

    tr.innerHTML = `
      <td><span class="code-tag">${act.code}</span></td>
      <td>
        <div style="font-weight: 700; color: var(--navy);">${act.desc}</div>
        <div style="font-size: 11px; color: var(--muted); display: flex; gap: 6px; align-items: center; margin-top: 2px;">
          ${act.critical ? '<span class="crit-badge"><i class="fas fa-fire"></i> مسار حرج</span>' : '<span style="color: #64748B;">مسار مرن</span>'}
          <span>• الركود الحر: ${act.freeFloat} يوم</span>
        </div>
      </td>
      <td class="text-num">${act.duration}</td>
      <td class="text-num" style="font-size: 11px;">${formatShortDate(act.start)}</td>
      <td class="text-num" style="font-size: 11px;">${formatShortDate(act.finish)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="flex: 1; height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
            <div style="width: ${act.progress}%; height: 100%; background: ${progressColor};"></div>
          </div>
          <span style="font-family: 'Tajawal'; font-weight: 800; font-size: 11px;">${act.progress}%</span>
        </div>
      </td>
      <td class="text-num" style="font-size: 11px;">${act.pred}</td>
      <td class="text-center">${floatHtml}</td>
      <td style="font-size: 11.5px; color: #475569;" title="${act.resource}">${act.resource.split(' - ')[0]}</td>
      <td>
        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="openEditModal(${act.id})" title="تعديل النشاط">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(tr);

    // 2. Render Gantt Row
    const gRow = document.createElement('div');
    gRow.className = 'gantt-row';
    if (act.critical) gRow.classList.add('is-critical');

    // Position calculations
    const startOffsetDays = daysBetween(PROJECT_START, new Date(act.start));
    const durationDays = daysBetween(new Date(act.start), new Date(act.finish)) + 1;
    const barRight = startOffsetDays * DAY_COL_WIDTH;
    const barWidth = Math.max(durationDays * DAY_COL_WIDTH, 14);

    // Baseline calculations
    const baseStartOffset = daysBetween(PROJECT_START, new Date(act.baseStart));
    const baseDuration = daysBetween(new Date(act.baseStart), new Date(act.baseFinish)) + 1;
    const baseRight = baseStartOffset * DAY_COL_WIDTH;
    const baseWidth = Math.max(baseDuration * DAY_COL_WIDTH, 14);

    const barWrapper = document.createElement('div');
    barWrapper.className = `bar-wrapper ${act.critical ? 'critical' : ''}`;
    barWrapper.style.right = barRight + 'px';
    barWrapper.style.width = barWidth + 'px';

    barWrapper.innerHTML = `
      <div class="bar-baseline" style="right: ${baseRight - barRight}px; width: ${baseWidth}px; display: ${showBaseline ? 'block' : 'none'};"></div>
      <div class="bar-planned">
        <div class="bar-progress" style="width: ${act.progress}%;"></div>
      </div>
      <span class="bar-label">${act.code}</span>
      <span class="bar-percent">${act.progress}%</span>
    `;

    // Tooltip event listeners
    barWrapper.addEventListener('mouseenter', (e) => showTooltip(e, act));
    barWrapper.addEventListener('mousemove', (e) => moveTooltip(e));
    barWrapper.addEventListener('mouseleave', hideTooltip);
    barWrapper.addEventListener('click', () => openEditModal(act.id));

    gRow.appendChild(barWrapper);
    ganttContainer.appendChild(gRow);
  });
}

function formatShortDate(str) {
  if (!str) return '-';
  const parts = str.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// Tooltip Handling
const tooltip = document.getElementById('ganttTooltip');
function showTooltip(e, act) {
  tooltip.style.display = 'block';
  tooltip.innerHTML = `
    <strong><i class="fas fa-layer-group"></i> ${act.code}: ${act.desc}</strong>
    <div><i class="fas fa-clock"></i> المدة: ${act.duration} يوم (${act.start} إلى ${act.finish})</div>
    <div><i class="fas fa-tasks"></i> نسبة الإنجاز: <strong>${act.progress}%</strong></div>
    <div><i class="fas fa-hourglass-half"></i> الركود الكلي: <strong>${act.totalFloat} يوم</strong> | الركود الحر: <strong>${act.freeFloat} يوم</strong></div>
    <div><i class="fas fa-history"></i> خط الأساس الأولي: ${act.baseStart} إلى ${act.baseFinish}</div>
    <div><i class="fas fa-user-tag"></i> المورد المسند: ${act.resource}</div>
    ${act.critical ? '<div style="color: #F87171; font-weight: 800;"><i class="fas fa-fire"></i> نشاط يقع على المسار الحرج (Critical Path)</div>' : ''}
  `;
  moveTooltip(e);
}
function moveTooltip(e) {
  tooltip.style.top = (e.clientY + 15) + 'px';
  tooltip.style.left = (e.clientX - 200) + 'px';
}
function hideTooltip() {
  tooltip.style.display = 'none';
}

// Interactive Toggles
function toggleBaseline() {
  showBaseline = !showBaseline;
  const btn = document.getElementById('baselineToggleBtn');
  btn.classList.toggle('active', showBaseline);
  document.querySelectorAll('.bar-baseline').forEach(el => {
    el.style.display = showBaseline ? 'block' : 'none';
  });
}

function toggleCriticalPath() {
  showCriticalOnly = !showCriticalOnly;
  const btn = document.getElementById('criticalToggleBtn');
  btn.classList.toggle('active', showCriticalOnly);
  if (showCriticalOnly) {
    currentLookaheadFilter = 'critical';
  } else {
    currentLookaheadFilter = 'all';
  }
  updateFilterChipsUI();
  renderActivities();
}

function toggleSCurve() {
  const container = document.getElementById('scurveContainer');
  const btn = document.getElementById('scurveToggleBtn');
  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.classList.remove('active');
  } else {
    container.style.display = 'none';
    btn.classList.add('active');
  }
}

function setLookaheadFilter(filterType, element) {
  currentLookaheadFilter = filterType;
  updateFilterChipsUI(element);
  renderActivities();
}

function updateFilterChipsUI(activeEl) {
  document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
  if (activeEl) {
    activeEl.classList.add('active');
  }
}

function searchActivities(keyword) {
  keyword = keyword.trim().toLowerCase();
  const rows = document.querySelectorAll('#activityTableBody tr');
  const gRows = document.querySelectorAll('#ganttRowsContainer .gantt-row');

  rows.forEach((row, idx) => {
    const text = row.innerText.toLowerCase();
    const match = text.includes(keyword);
    row.style.display = match ? '' : 'none';
    if (gRows[idx]) gRows[idx].style.display = match ? '' : 'none';
  });
}

function setGanttZoom(type) {
  // Zoom functionality adjusts column width
  const pane = document.getElementById('ganttPane');
  if (type === 'week') {
    document.documentElement.style.setProperty('--gantt-col-w', '38px');
  } else {
    document.documentElement.style.setProperty('--gantt-col-w', '28px');
  }
  renderTimelineHeaders();
  renderActivities();
  updateDataDateMarker();
}

// S-Curve Canvas Drawing Engine
function renderSCurve() {
  const canvas = document.getElementById('scurveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // High DPI scaling
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 230 * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 230;
  const padL = 60;
  const padR = 40;
  const padT = 25;
  const padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  ctx.clearRect(0, 0, w, h);

  // Grid Lines & Labels
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.font = '11px Tajawal, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'right';

  for (let p = 0; p <= 100; p += 20) {
    const y = padT + chartH - (p / 100 * chartH);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(p + '%', padL - 8, y + 4);
  }

  // Monthly Time Axis
  const months = ['يناير', 'فبراير', 'مارس (Data Date)', 'أبريل', 'مايو', 'يونيو'];
  const stepX = chartW / (months.length - 1);
  ctx.textAlign = 'center';

  months.forEach((m, idx) => {
    const x = padL + (idx * stepX);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + chartH);
    ctx.strokeStyle = '#F1F5F9';
    ctx.stroke();
    ctx.fillText(m, x, h - 12);
  });

  // Data Date vertical line on chart (Month 3 = March 20)
  const todayX = padL + (2.65 * stepX);
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#FF6500';
  ctx.lineWidth = 1.5;
  ctx.moveTo(todayX, padT);
  ctx.lineTo(todayX, padT + chartH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Data Points
  const plannedPoints = [0, 8, 24, 46.5, 72, 94, 100];
  const actualPoints  = [0, 9.5, 26, 42.8]; // ends at today
  const baselinePoints = [0, 10, 28, 50, 75, 96, 100];
  const forecastPoints = [42.8, 68, 91, 100];

  function getPointCoord(arrIdx, val, totalSteps) {
    const x = padL + (arrIdx / totalSteps * chartW);
    const y = padT + chartH - (val / 100 * chartH);
    return { x, y };
  }

  // Draw Baseline Curve (gray dashed)
  ctx.beginPath();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  baselinePoints.forEach((val, idx) => {
    const pt = getPointCoord(idx, val, 6);
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Planned PV Curve (Solid Blue)
  ctx.beginPath();
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 3;
  plannedPoints.forEach((val, idx) => {
    const pt = getPointCoord(idx, val, 6);
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Draw Forecast Curve (Orange Dashed from actual)
  ctx.beginPath();
  ctx.strokeStyle = '#FF6500';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 3]);
  const startForecastIdx = 2.65;
  ctx.moveTo(todayX, padT + chartH - (42.8 / 100 * chartH));
  const fc3 = getPointCoord(4, 68, 6);
  const fc4 = getPointCoord(5, 91, 6);
  const fc5 = getPointCoord(6, 100, 6);
  ctx.lineTo(fc3.x, fc3.y);
  ctx.lineTo(fc4.x, fc4.y);
  ctx.lineTo(fc5.x, fc5.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Actual EV Curve (Solid Green with glowing dots)
  ctx.beginPath();
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3.5;
  actualPoints.forEach((val, idx) => {
    const pt = getPointCoord(idx, val, 6);
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else if (idx === 3) ctx.lineTo(todayX, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Draw Actual Points Dots
  actualPoints.forEach((val, idx) => {
    const pt = idx === 3 ? { x: todayX, y: padT + chartH - (val / 100 * chartH) } : getPointCoord(idx, val, 6);
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// Modal Operations
function openAddModal() {
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة نشاط إنشائي جديد';
  document.getElementById('actId').value = '';
  document.getElementById('actCode').value = 'ACT-' + (1000 + (activities.length * 10));
  document.getElementById('actDesc').value = '';
  document.getElementById('actDuration').value = 14;
  document.getElementById('actProgress').value = 0;
  document.getElementById('actStart').value = '2026-04-01';
  document.getElementById('actFinish').value = '2026-04-15';
  document.getElementById('actPred').value = 'ACT-1080';
  document.getElementById('actIsCritical').value = 'false';
  document.getElementById('actFloat').value = 5;
  document.getElementById('actResource').value = 'مقاول الباطن';
  document.getElementById('activityModal').classList.add('open');
}

function openEditModal(id) {
  const act = activities.find(a => a.id === id);
  if (!act) return;
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل بيانات النشاط: ' + act.code;
  document.getElementById('actId').value = act.id;
  document.getElementById('actCode').value = act.code;
  document.getElementById('actDesc').value = act.desc;
  document.getElementById('actDuration').value = act.duration;
  document.getElementById('actProgress').value = act.progress;
  document.getElementById('actStart').value = act.start;
  document.getElementById('actFinish').value = act.finish;
  document.getElementById('actPred').value = act.pred;
  document.getElementById('actIsCritical').value = act.critical ? 'true' : 'false';
  document.getElementById('actFloat').value = act.totalFloat;
  document.getElementById('actResource').value = act.resource;
  document.getElementById('activityModal').classList.add('open');
}

function closeModal() {
  document.getElementById('activityModal').classList.remove('open');
}

function saveActivity(e) {
  e.preventDefault();
  const idVal = document.getElementById('actId').value;
  const isCritical = document.getElementById('actIsCritical').value === 'true';

  if (idVal) {
    // Edit existing
    const act = activities.find(a => a.id === parseInt(idVal));
    if (act) {
      act.code = document.getElementById('actCode').value;
      act.desc = document.getElementById('actDesc').value;
      act.duration = parseInt(document.getElementById('actDuration').value);
      act.progress = parseInt(document.getElementById('actProgress').value);
      act.start = document.getElementById('actStart').value;
      act.finish = document.getElementById('actFinish').value;
      act.pred = document.getElementById('actPred').value;
      act.critical = isCritical;
      act.totalFloat = isCritical ? 0 : parseInt(document.getElementById('actFloat').value);
      act.resource = document.getElementById('actResource').value;
    }
  } else {
    // Add new
    const newId = Math.max(...activities.map(a => a.id)) + 1;
    activities.push({
      id: newId,
      code: document.getElementById('actCode').value,
      desc: document.getElementById('actDesc').value,
      duration: parseInt(document.getElementById('actDuration').value),
      start: document.getElementById('actStart').value,
      finish: document.getElementById('actFinish').value,
      baseStart: document.getElementById('actStart').value,
      baseFinish: document.getElementById('actFinish').value,
      progress: parseInt(document.getElementById('actProgress').value),
      pred: document.getElementById('actPred').value,
      totalFloat: isCritical ? 0 : parseInt(document.getElementById('actFloat').value),
      freeFloat: isCritical ? 0 : 2,
      resource: document.getElementById('actResource').value,
      critical: isCritical
    });
  }

  closeModal();
  renderActivities();
  alert('تم حفظ النشاط بنجاح وتحديث مسار الجدولة الزمنية!');
}

function exportToPDF() {
  window.print();
}

// Window resize listener for responsive S-Curve
window.addEventListener('resize', () => {
  renderSCurve();
});
