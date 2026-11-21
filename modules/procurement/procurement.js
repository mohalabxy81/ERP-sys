/**
 * MimarERP Procurement Dashboard Interactive Engine
 * Handles PR Approvals, Workflow Stepper Filtering, PO Tracking,
 * Category Spending Chart Rendering, and Vendor Scoring.
 */

// Data Collections
let purchaseRequests = [
  {
    id: 'PR-2026-0104',
    date: '2026-03-18',
    dept: 'الخرسانات والأساسات',
    desc: 'توريد 450 طن حديد تسليح عالي المقاومة ومثبتات سابك',
    category: 'حديد وهياكل',
    val: 1459350,
    priority: 'طارئ',
    requester: 'م. فهد القحطاني (مدير الموقع)',
    status: 'pending'
  },
  {
    id: 'PR-2026-0105',
    date: '2026-03-19',
    dept: 'كهروميكانيك MEP',
    desc: 'توريد محولات توزيع كهربائية 1500kVA مع لوحات تحكم',
    category: 'كهروميكانيك MEP',
    val: 320000,
    priority: 'عاجل',
    requester: 'م. أحمد الشريف (مهندس كهروميكانيك)',
    status: 'pending'
  },
  {
    id: 'PR-2026-0106',
    date: '2026-03-19',
    dept: 'العزل والتشطيبات',
    desc: 'توريد 1800 م² لفائف عزل مائي وحراري للأسطح واللبشة',
    category: 'تشطيبات وعوازل',
    val: 185000,
    priority: 'عادي',
    requester: 'م. عبد العزيز الدوسري',
    status: 'pending'
  },
  {
    id: 'PR-2026-0107',
    date: '2026-03-20',
    dept: 'السلامة والصحة المهنية',
    desc: 'معدات وقاية شخصية PPE وأجهزة كشف غازات وسقالات ألومنيوم',
    category: 'مستلزمات سلامة',
    val: 45000,
    priority: 'عادي',
    requester: 'م. خالد المنصور (مسؤول السلامة)',
    status: 'pending'
  },
  {
    id: 'PR-2026-0108',
    date: '2026-03-20',
    dept: 'الهيكل الإنشائي',
    desc: 'تأجير رافعة برجية 50 متر وحفار هيدروليكي مدة شهرين',
    category: 'معدات',
    val: 120000,
    priority: 'عاجل',
    requester: 'م. طارق العتيبي (مدير المشاريع)',
    status: 'pending'
  }
];

let purchaseOrders = [
  {
    poNo: 'PO-2026-0081',
    vendor: 'شركة حديد سابك (HADEED)',
    prRef: 'PR-2026-0092',
    val: 2850000,
    issueDate: '2026-02-15',
    promisedDate: '2026-03-25',
    receivedPercent: 100,
    grnCount: 8,
    status: 'completed',
    statusText: 'تم التوريد بالكامل (100%)'
  },
  {
    poNo: 'PO-2026-0084',
    vendor: 'شركة الخرسانة الجاهزة السعودية',
    prRef: 'PR-2026-0095',
    val: 1420000,
    issueDate: '2026-03-01',
    promisedDate: '2026-03-30',
    receivedPercent: 75,
    grnCount: 16,
    status: 'in_transit',
    statusText: 'توريد جزئي بالموقع (75%)'
  },
  {
    poNo: 'PO-2026-0087',
    vendor: 'مؤسسة الرياض لتمديدات الأنابيب',
    prRef: 'PR-2026-0098',
    val: 480000,
    issueDate: '2026-03-05',
    promisedDate: '2026-03-22',
    receivedPercent: 40,
    grnCount: 3,
    status: 'in_transit',
    statusText: 'قيد الشحن والتوريد'
  },
  {
    poNo: 'PO-2026-0090',
    vendor: 'شركة أجهزة الإنذار ومكافحة الحريق',
    prRef: 'PR-2026-0101',
    val: 680000,
    issueDate: '2026-03-08',
    promisedDate: '2026-03-18',
    receivedPercent: 20,
    grnCount: 1,
    status: 'delayed',
    statusText: 'متأخر 3 أيام عن الموعد'
  },
  {
    poNo: 'PO-2026-0092',
    vendor: 'شركة دهانات الجزيرة',
    prRef: 'PR-2026-0102',
    val: 215000,
    issueDate: '2026-03-12',
    promisedDate: '2026-04-05',
    receivedPercent: 0,
    grnCount: 0,
    status: 'in_transit',
    statusText: 'قيد التجهيز بالمصنع'
  }
];

const categorySpendData = [
  { name: 'حديد تسليح وهياكل معدنية', amount: 6450000, percent: 35, color: '#2563EB' },
  { name: 'خرسانة جاهزة وإسمنت', amount: 4605000, percent: 25, color: '#059669' },
  { name: 'أعمال وتجهيزات كهروميكانيكية MEP', amount: 3315000, percent: 18, color: '#7C3AED' },
  { name: 'تشطيبات معمارية وعوازل', amount: 2210000, percent: 12, color: '#FF6500' },
  { name: 'معدات ثقيلة ورافعات برجية', amount: 1105000, percent: 6, color: '#0284C7' },
  { name: 'مستلزمات سلامة ومواد عامة', amount: 735000, percent: 4, color: '#E11D48' }
];

let selectedPRForAction = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderPRTable();
  renderPOTable();
  renderSpendingChart();
  renderChartLegend();
});

// Render Open PR Table
function renderPRTable(filterKeyword = '') {
  const tbody = document.getElementById('prTableBody');
  tbody.innerHTML = '';

  const activePRs = purchaseRequests.filter(pr => {
    if (filterKeyword) {
      const q = filterKeyword.toLowerCase();
      return pr.id.toLowerCase().includes(q) || pr.desc.toLowerCase().includes(q) || pr.dept.toLowerCase().includes(q);
    }
    return true;
  });

  document.getElementById('prCountBadge').innerText = `${activePRs.length} طلبات متاحة`;

  activePRs.forEach(pr => {
    const tr = document.createElement('tr');
    
    let prioBadge = 'badge-blue';
    if (pr.priority === 'عاجل') prioBadge = 'badge-amber';
    if (pr.priority === 'طارئ') prioBadge = 'badge-red';

    let statusBadge = '<span class="badge badge-amber"><i class="fas fa-clock"></i> بانتظار الاعتماد</span>';
    if (pr.status === 'approved') statusBadge = '<span class="badge badge-green"><i class="fas fa-check"></i> معتمد وموجّه للمنافسة</span>';
    if (pr.status === 'rejected') statusBadge = '<span class="badge badge-red"><i class="fas fa-times"></i> مرفوض</span>';

    tr.innerHTML = `
      <td><strong style="color: var(--teal); font-family: 'Tajawal'; font-size: 13px;">${pr.id}</strong></td>
      <td style="font-size: 11.5px; color: var(--muted);">${pr.date}</td>
      <td style="font-weight: 700; color: var(--navy2);">${pr.dept}</td>
      <td>
        <div style="font-weight: 700; color: var(--navy);">${pr.desc}</div>
      </td>
      <td><span class="badge badge-purple">${pr.category}</span></td>
      <td class="text-num"><strong style="font-size: 13.5px; color: var(--navy);">${pr.val.toLocaleString('en-US')}</strong> <span style="font-size: 10.5px; color: var(--muted);">SAR</span></td>
      <td><span class="badge ${prioBadge}">${pr.priority}</span></td>
      <td style="font-size: 11.5px; color: #475569;">${pr.requester}</td>
      <td>${statusBadge}</td>
      <td style="text-align: center;">
        ${pr.status === 'pending' ? `
          <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="openPRAction('${pr.id}')" title="مراجعة واعتماد">
            <i class="fas fa-tasks"></i> مراجعة
          </button>
        ` : `
          <span style="font-size: 11px; color: var(--muted);"><i class="fas fa-check-double"></i> مكتمل</span>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterPRTable(kw) {
  renderPRTable(kw);
}

// PR Action Modal (Approve / Reject)
function openPRAction(prId) {
  selectedPRForAction = purchaseRequests.find(p => p.id === prId);
  if (!selectedPRForAction) return;

  const detailBox = document.getElementById('prModalDetails');
  detailBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <strong>رقم الطلب: ${selectedPRForAction.id}</strong>
      <span class="badge badge-amber">الأولوية: ${selectedPRForAction.priority}</span>
    </div>
    <div style="margin-bottom: 4px;"><strong>البيان:</strong> ${selectedPRForAction.desc}</div>
    <div style="margin-bottom: 4px;"><strong>القسم الطالب:</strong> ${selectedPRForAction.dept} — ${selectedPRForAction.requester}</div>
    <div style="margin-bottom: 4px;"><strong>القيمة التقديرية:</strong> <span class="text-num" style="font-size: 14px; font-weight: 800; color: var(--teal);">${selectedPRForAction.val.toLocaleString('en-US')} SAR</span></div>
  `;

  document.getElementById('prApprovalNotes').value = '';
  document.getElementById('prActionModal').classList.add('open');
}

function closePRModal() {
  document.getElementById('prActionModal').classList.remove('open');
}

function submitPRDecision(decision) {
  if (!selectedPRForAction) return;
  const notes = document.getElementById('prApprovalNotes').value;

  if (decision === 'approved') {
    selectedPRForAction.status = 'approved';
    alert(`تم اعتماد طلب الشراء ${selectedPRForAction.id} بنجاح!\nسيتم توجيهه لقسم المشتريات لطرح منافسة استدراج عروض (RFQ).`);
  } else {
    selectedPRForAction.status = 'rejected';
    alert(`تم رفض طلب الشراء ${selectedPRForAction.id}.\nتم إشعار المهندس الطالب مع الملاحظات: ${notes || 'لا توجد ملاحظات'}`);
  }

  closePRModal();
  renderPRTable();
}

// New PR Modal
function openNewPRModal() {
  document.getElementById('newPRDate').value = '2026-04-10';
  document.getElementById('newPRModal').classList.add('open');
}
function closeNewPRModal() {
  document.getElementById('newPRModal').classList.remove('open');
}
function saveNewPR(e) {
  e.preventDefault();
  const newNum = 'PR-2026-01' + (purchaseRequests.length + 5);
  const newPR = {
    id: newNum,
    date: new Date().toISOString().split('T')[0],
    dept: document.getElementById('newPRDept').value,
    desc: document.getElementById('newPRDesc').value,
    category: document.getElementById('newPRCategory').value,
    val: parseFloat(document.getElementById('newPRValue').value),
    priority: document.getElementById('newPRPriority').value,
    requester: 'م. سامي الحربي (مهندس الموقع)',
    status: 'pending'
  };
  purchaseRequests.unshift(newPR);
  closeNewPRModal();
  renderPRTable();
  alert(`تم إنشاء طلب الشراء رقم ${newNum} بنجاح وتم إدراجه في قائمة الاعتمادات!`);
}

function openNewRFQModal() {
  alert('تم فتح نافذة إعداد منافسة واستدراج عروض أسعار (RFQ) جديدة.\nسيتم ربط الموردين وتوليد مستندات الشروط والمواصفات تلقائياً.');
}

// Render PO Table
function renderPOTable(filter = 'all') {
  const tbody = document.getElementById('poTableBody');
  tbody.innerHTML = '';

  const list = purchaseOrders.filter(po => {
    if (filter === 'in_transit') return po.status === 'in_transit';
    if (filter === 'delayed') return po.status === 'delayed';
    return true;
  });

  list.forEach(po => {
    const tr = document.createElement('tr');
    
    let statusClass = 'badge-blue';
    if (po.status === 'completed') statusClass = 'badge-green';
    if (po.status === 'delayed') statusClass = 'badge-red';

    const progColor = po.receivedPercent === 100 ? 'var(--green)' : (po.status === 'delayed' ? 'var(--red)' : 'var(--teal)');

    tr.innerHTML = `
      <td><strong style="color: var(--navy); font-family: 'Tajawal'; font-size: 13px;">${po.poNo}</strong></td>
      <td>
        <div style="font-weight: 800; color: var(--navy);">${po.vendor}</div>
      </td>
      <td><span class="badge badge-purple" style="font-family: 'Tajawal';">${po.prRef}</span></td>
      <td class="text-num"><strong style="font-size: 13px;">${po.val.toLocaleString('en-US')}</strong></td>
      <td style="font-size: 11.5px; color: var(--muted);">${po.issueDate}</td>
      <td style="font-size: 11.5px; font-weight: 700; color: ${po.status === 'delayed' ? 'var(--red)' : 'var(--navy)'};">${po.promisedDate}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="flex: 1; height: 7px; background: #E2E8F0; border-radius: 4px; overflow: hidden; min-width: 70px;">
            <div style="width: ${po.receivedPercent}%; height: 100%; background: ${progColor};"></div>
          </div>
          <span style="font-family: 'Tajawal'; font-size: 11.5px; font-weight: 800;">${po.receivedPercent}%</span>
          <span style="font-size: 10px; color: var(--muted);">(${po.grnCount} GRN)</span>
        </div>
      </td>
      <td><span class="badge ${statusClass}">${po.statusText}</span></td>
      <td style="text-align: center;">
        <button class="btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="viewPODetails('${po.poNo}')" title="عرض تفاصيل أمر الشراء وسند الاستلام">
          <i class="fas fa-eye"></i> تفاصيل
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterPOs(f) {
  renderPOTable(f);
}

function viewPODetails(poNo) {
  alert(`عرض تفاصيل أمر الشراء ${poNo}:\n- شهادة الاستلام المخزني (GRN)\n- الفحص الفني لجودة العينات\n- المطابقة مع الفاتورة الضريبية ZATCA`);
}

// Award Contract function
function awardContract(vendorName) {
  if (confirm(`هل أنت متأكد من اعتماد الترسية على (${vendorName}) وإصدار أمر الشراء الرسمي (PO)؟`)) {
    alert(`تهانينا! تم اعتماد الترسية على (${vendorName}) بنجاح.\nتم توليد أمر الشراء الإلكتروني وإشعار الإدارة المالية والمستودعات.`);
  }
}

// Workflow Pipeline Stepper Filter
function filterByPipelineStage(stage, stepEl) {
  document.querySelectorAll('.pipe-step').forEach(s => s.classList.remove('active'));
  stepEl.classList.add('active');

  if (stage === 'pr_open') {
    document.getElementById('openPRSection').scrollIntoView({ behavior: 'smooth' });
    renderPRTable();
  } else if (stage === 'matrix') {
    document.getElementById('vendorMatrixSection').scrollIntoView({ behavior: 'smooth' });
  } else if (stage === 'po_active' || stage === 'delivery') {
    document.getElementById('poTrackerSection').scrollIntoView({ behavior: 'smooth' });
  }
}

// Spending Chart Rendering (Donut Chart)
function renderSpendingChart() {
  const canvas = document.getElementById('spendChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 220 * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const centerX = 110;
  const centerY = 110;
  const radius = 90;
  const innerRadius = 55;

  let currentAngle = -0.5 * Math.PI;

  categorySpendData.forEach(cat => {
    const sliceAngle = (cat.percent / 100) * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle, false);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center Text inside Donut
  ctx.fillStyle = '#0B192C';
  ctx.font = 'bold 15px Tajawal, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('18.42M', centerX, centerY - 8);

  ctx.fillStyle = '#64748B';
  ctx.font = '10px Cairo, sans-serif';
  ctx.fillText('SAR إجمالي', centerX, centerY + 12);
}

function renderChartLegend() {
  const legendBox = document.getElementById('chartLegendList');
  legendBox.innerHTML = '';

  categorySpendData.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'legend-row';
    row.innerHTML = `
      <div class="legend-title">
        <div class="color-swatch" style="background: ${cat.color};"></div>
        <span>${cat.name}</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="text-num" style="font-weight: 800; font-size: 12px; color: var(--navy);">${cat.amount.toLocaleString('en-US')} SAR</span>
        <span class="badge" style="background: #E2E8F0; color: #334155; font-size: 10.5px; font-weight: 800; padding: 2px 6px;">${cat.percent}%</span>
      </div>
    `;
    legendBox.appendChild(row);
  });
}
