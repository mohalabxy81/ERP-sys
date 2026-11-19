/* ==========================================================================
   DYNAMIC VIEWS & CRUD UPGRADE FOR MIMAR ERP
   Transforms all hardcoded views into dynamic data-bound views and adds 
   comprehensive CRUD + Audit Trail + State Persistence.
   ========================================================================== */

// 1. Ensure master data structures exist
(function initMasterData() {
  if (!MimarERP.scheduleTasks) {
    MimarERP.scheduleTasks = [
      { id: "ACT-101", wbs: "WBS-09.1", name: "أعمال لياسة الحوائط الداخلية", duration: 30, start_date: "2026-02-01", end_date: "2026-03-02", predecessor: "-", weight_pct: 20.5, progress_pct: 100, status: "مكتمل" },
      { id: "ACT-102", wbs: "WBS-09.2", name: "أعمال تركيب السيراميك والبورسلان", duration: 25, start_date: "2026-03-05", end_date: "2026-03-30", predecessor: "ACT-101 (FS)", weight_pct: 24.2, progress_pct: 75, status: "جاري العمل" },
      { id: "ACT-103", wbs: "WBS-07.1", name: "أعمال عزل الأسطح بولي يوريثان", duration: 15, start_date: "2026-04-01", end_date: "2026-04-15", predecessor: "ACT-101 (FS)", weight_pct: 15.0, progress_pct: 100, status: "مكتمل" },
      { id: "ACT-104", wbs: "WBS-08.1", name: "توريد وتركيب قطاعات الألمنيوم", duration: 20, start_date: "2026-04-16", end_date: "2026-05-05", predecessor: "ACT-102 (SS+5)", weight_pct: 18.3, progress_pct: 40, status: "جاري العمل" },
      { id: "ACT-105", wbs: "WBS-09.3", name: "أعمال الدهانات الداخلية والخارجية", duration: 35, start_date: "2026-05-01", end_date: "2026-06-05", predecessor: "ACT-102, ACT-104", weight_pct: 22.0, progress_pct: 20, status: "جاري العمل" }
    ];
  }

  if (!MimarERP.purchaseOrders) {
    MimarERP.purchaseOrders = [
      { id: "PO-2026-001", supplier: "شركة أسمنت ينبع والمدينة", item: "أسمنت بورتلاندي عادي 50 كجم", qty: 1000, unit: "كيس", rate: 16.50, total: 16500.00, order_date: "2026-03-01", delivery_date: "2026-03-05", status: "مستلم بالكامل (GRN-01)" },
      { id: "PO-2026-002", supplier: "شركة هضاب الخليج للسيراميك", item: "سيراميك وبورسلان وبلاط أحواش", qty: 650, unit: "م²", rate: 38.12, total: 24780.00, order_date: "2026-03-10", delivery_date: "2026-03-15", status: "مستلم بالكامل (GRN-02)" },
      { id: "PO-2026-003", supplier: "شركة دهانات الجزيرة", item: "غراء لاصق Santex C2TE", qty: 180, unit: "كيس", rate: 49.71, total: 8947.80, order_date: "2026-03-18", delivery_date: "2026-03-22", status: "قيد التوريد والتسليم" },
      { id: "PO-2026-004", supplier: "رواد العزل الحديث للمقاولات", item: "مواد عزل PU فوم ورش بولي يوريثان", qty: 350, unit: "م²", rate: 65.00, total: 22750.00, order_date: "2026-03-25", delivery_date: "2026-04-02", status: "معتمد ومجدول" }
    ];
  }

  if (!MimarERP.auditLogs) {
    MimarERP.auditLogs = [
      { id: "LOG-01", timestamp: "2026-11-18 10:30:15", user: "Admin", action: "CREATE", entity: "Project", details: "إضافة مشروع فيلا الملقا الرياض PRJ-2004", ip: "127.0.0.1" },
      { id: "LOG-02", timestamp: "2026-11-18 11:15:22", user: "Project Manager", action: "UPDATE", entity: "BOQ", details: "تحديث نسبة إنجاز بند اللياسة الداخلية إلى 66%", ip: "127.0.0.1" },
      { id: "LOG-03", timestamp: "2026-11-19 02:45:10", user: "Cost Controller", action: "APPROVE", entity: "Variation", details: "اعتماد أمر التغيير VO-2026-001 بقيمة 45,000 ر.س", ip: "127.0.0.1" }
    ];
  }
})();

// 2. Logging function for audit trail
function logAudit(action, entity, details) {
  const logItem = {
    id: "LOG-" + String(Date.now()).slice(-6),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    user: MimarERP.currentRole || "System User",
    action: action,
    entity: entity,
    details: details,
    ip: "127.0.0.1"
  };
  if (!MimarERP.auditLogs) MimarERP.auditLogs = [];
  MimarERP.auditLogs.unshift(logItem);
  renderAuditLogTable();
}

if (typeof window !== 'undefined') {
  window.logAudit = logAudit;
  window.renderAuditLogTable = renderAuditLogTable;
}

// 3. Render Audit Log Dynamically
function renderAuditLogTable() {
  const tbody = document.querySelector("#tbl-audit-log tbody");
  if (!tbody) return;
  const logs = MimarERP.auditLogs || [];
  tbody.innerHTML = logs.map(l => {
    const badgeColor = l.action === "DELETE" ? "badge-red" : (l.action === "CREATE" ? "badge-green" : (l.action === "APPROVE" ? "badge-teal" : "badge-blue"));
    return `<tr>
      <td class="text-num"><strong>${l.id}</strong></td>
      <td class="text-num" style="font-size:11px;">${l.timestamp}</td>
      <td><strong>${l.user}</strong></td>
      <td><span class="badge ${badgeColor}">${l.action}</span></td>
      <td>${l.entity}</td>
      <td style="font-size:12px;">${l.details}</td>
      <td class="text-num" style="font-size:11px;">${l.ip}</td>
    </tr>`;
  }).join('');
}

// 4. Overwrite hardcoded renderProcurementTable with fully dynamic data-bound table
window.renderProcurementTable = function() {
  const tbody = document.querySelector("#tbl-po-list tbody");
  if (!tbody) return;
  const list = MimarERP.purchaseOrders || [];
  
  // Ensure header has actions
  const thead = document.querySelector("#tbl-po-list thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  const fmt = n => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tbody.innerHTML = list.map((po, idx) => {
    const badgeCls = po.status.includes("مستلم") ? "badge-green" : (po.status.includes("قيد") ? "badge-blue" : "badge-amber");
    return `<tr>
      <td class="text-num"><strong>${po.id}</strong></td>
      <td>${po.supplier}</td>
      <td>${po.item}</td>
      <td class="text-num">${po.qty} ${po.unit}</td>
      <td class="text-num">${fmt(po.rate)}</td>
      <td class="text-num"><strong>${fmt(po.total)}</strong></td>
      <td class="text-num">${po.order_date || '—'}</td>
      <td class="text-num">${po.delivery_date || '—'}</td>
      <td><span class="badge ${badgeCls}">${po.status}</span></td>
      <td class="action-btns">
        <button class="btn btn-sm" title="تعديل" onclick="openEditPOModal(${idx})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" title="حذف" onclick="deletePOItem(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 5. Overwrite hardcoded renderScheduleTable with dynamic tasks
window.renderScheduleTable = function() {
  const tbody = document.querySelector("#tbl-schedule tbody");
  if (!tbody) return;
  const tasks = MimarERP.scheduleTasks || [];

  const thead = document.querySelector("#tbl-schedule thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  tbody.innerHTML = tasks.map((t, idx) => {
    const badgeCls = t.status === "مكتمل" ? "badge-green" : (t.status === "جاري العمل" ? "badge-blue" : "badge-amber");
    const progColor = t.progress_pct === 100 ? "var(--green)" : (t.progress_pct > 0 ? "var(--blue)" : "var(--muted)");
    return `<tr>
      <td class="text-num"><strong>${t.id}</strong></td>
      <td>${t.wbs}</td>
      <td>${t.name}</td>
      <td class="text-center">${t.duration}</td>
      <td class="text-num">${t.start_date}</td>
      <td class="text-num">${t.end_date}</td>
      <td class="text-center">${t.predecessor}</td>
      <td class="text-center">${t.weight_pct}%</td>
      <td class="text-center"><strong style="color:${progColor}">${t.progress_pct}%</strong></td>
      <td><span class="badge ${badgeCls}">${t.status}</span></td>
      <td class="action-btns">
        <button class="btn btn-sm" title="تعديل" onclick="openEditScheduleModal(${idx})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" title="حذف" onclick="deleteScheduleTask(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 6. Overwrite hardcoded renderBillingTable with dynamic MimarERP.billing
window.renderBillingTable = function() {
  const tbody = document.querySelector("#tbl-billing-ipcs tbody");
  if (!tbody) return;
  const billings = MimarERP.billing || [];

  const thead = document.querySelector("#tbl-billing-ipcs thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  const fmt = n => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tbody.innerHTML = billings.map((b, idx) => {
    const badgeCls = b.status.includes("معتمد") ? "badge-green" : (b.status.includes("مراجعة") ? "badge-amber" : "badge-blue");
    return `<tr>
      <td class="text-num"><strong>${b.id}</strong></td>
      <td>${b.type}</td>
      <td>${b.party}</td>
      <td class="text-num">${b.period}</td>
      <td class="text-num">${fmt(b.current_amount)}</td>
      <td class="text-num">${fmt(b.previous_amount)}</td>
      <td class="text-num">${fmt(b.total_certified)}</td>
      <td class="text-num">${fmt(b.retention_val)}</td>
      <td class="text-num">${fmt(b.net_payable)}</td>
      <td class="text-num">${fmt(b.vat_15_pct)}</td>
      <td class="text-num" style="font-weight:800; color:var(--green);">${fmt(b.total_payable_incl_vat)}</td>
      <td><span class="badge ${badgeCls}">${b.status}</span></td>
      <td class="action-btns">
        <button class="btn btn-sm" title="تعديل" onclick="openEditBillingIPCModal(${idx})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" title="حذف" onclick="deleteBillingIPC(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 7. Overwrite hardcoded renderInspectionsTable with dynamic quality inspections
window.renderInspectionsTable = function() {
  const tbody = document.querySelector("#tbl-inspections tbody");
  if (!tbody) return;
  const list = (MimarERP.techOffice && MimarERP.techOffice.quality_inspections) || [];

  const thead = document.querySelector("#tbl-inspections thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  tbody.innerHTML = list.map((item, idx) => {
    const typeBadge = item.type.includes("WIR") ? "badge-blue" : "badge-purple";
    const statusBadge = item.status === "معتمد" ? "badge-green" : "badge-amber";
    return `<tr>
      <td class="text-num"><strong>${item.id}</strong></td>
      <td><span class="badge ${typeBadge}">${item.type}</span></td>
      <td>${item.activity}</td>
      <td class="text-num">${item.boq_ref || '—'}</td>
      <td>${item.location || '—'}</td>
      <td class="text-num">${item.insp_date || item.req_date || '—'}</td>
      <td><span class="badge badge-green">${item.result || 'مطابق'}</span></td>
      <td><span class="badge ${statusBadge}">${item.status}</span></td>
      <td class="action-btns">
        <button class="btn btn-sm" title="تعديل" onclick="openEditInspectionModal(${idx})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" title="حذف" onclick="deleteInspectionItem(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 8. Overwrite hardcoded renderDrawingsTable with dynamic techOffice.drawings
window.renderDrawingsTable = function() {
  const tbody = document.querySelector("#tbl-drawings tbody");
  if (!tbody) return;
  const list = (MimarERP.techOffice && MimarERP.techOffice.drawings) || [];

  const thead = document.querySelector("#tbl-drawings thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  tbody.innerHTML = list.map((dwg, idx) => {
    const badgeColor = dwg.status.includes("IFC") ? "badge-green" : "badge-blue";
    return `<tr>
      <td class="text-num"><strong>${dwg.sheet_no || dwg.id}</strong></td>
      <td>${dwg.title}</td>
      <td>${dwg.discipline}</td>
      <td class="text-center">${dwg.rev}</td>
      <td class="text-num">${dwg.date}</td>
      <td><span class="badge ${badgeColor}">${dwg.status}</span></td>
      <td class="action-btns">
        <button class="btn btn-sm" title="تعديل" onclick="openEditDrawingModal(${idx})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm" style="color:var(--red)" title="حذف" onclick="deleteDrawingItem(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// =============================================================================
// MODAL FORMS & CRUD CONTROLLERS FOR ALL MODULES
// =============================================================================

// PO Operations
function openEditPOModal(idx) {
  const po = MimarERP.purchaseOrders[idx];
  showCrudModal({
    title: "تعديل أمر الشراء",
    icon: "fa-cart-shopping",
    record: po,
    fields: [
      { key: "id", label: "رقم أمر الشراء", required: true },
      { key: "supplier", label: "المورد", required: true },
      { key: "item", label: "المادة / البند", required: true },
      { key: "qty", label: "الكمية", type: "number", required: true },
      { key: "unit", label: "الوحدة", type: "select", options: ["طن", "م³", "م²", "كيس", "قطعة", "لتر"] },
      { key: "rate", label: "سعر الوحدة (ر.س)", type: "number", required: true },
      { key: "status", label: "الحالة", type: "select", options: ["مسودة", "قيد التوريد والتسليم", "مستلم بالكامل (GRN-01)", "مستلم جزئياً", "ملغى"] }
    ],
    onSave(data) {
      data.total = Number(data.qty) * Number(data.rate);
      Object.assign(po, data);
      logAudit("UPDATE", "Purchase Order", `تعديل أمر الشراء ${po.id}`);
      saveToLocalStorage();
      renderProcurementTable();
      showToast("تم تحديث أمر الشراء بنجاح ✓");
    }
  });
}

function deletePOItem(idx) {
  const po = MimarERP.purchaseOrders[idx];
  confirmDelete(`هل تريد بالتأكيد حذف أمر الشراء <strong>${po.id}</strong>؟`, () => {
    MimarERP.purchaseOrders.splice(idx, 1);
    logAudit("DELETE", "Purchase Order", `حذف أمر الشراء ${po.id}`);
    saveToLocalStorage();
    renderProcurementTable();
    showToast("تم حذف أمر الشراء ✓");
  });
}

function openAddPOModal() {
  const supplierOpts = (MimarERP.suppliersMaster || []).map(s => s.name || s.supplier_name);
  showCrudModal({
    title: "إصدار أمر شراء جديد (Purchase Order)",
    icon: "fa-plus-circle",
    fields: [
      { key: "id", label: "رقم أمر الشراء", required: true, default: "PO-2026-00" + ((MimarERP.purchaseOrders?.length || 0) + 1) },
      { key: "supplier", label: "المورد المعتمد", type: "select", options: supplierOpts.length ? supplierOpts : ["شركة أسمنت ينبع والمدينة", "شركة هضاب الخليج للسيراميك", "شركة دهانات الجزيرة"] },
      { key: "item", label: "المادة / المواصفة", required: true, placeholder: "اسم المادة بدقة" },
      { key: "qty", label: "الكمية", type: "number", required: true },
      { key: "unit", label: "الوحدة", type: "select", options: ["طن", "م³", "م²", "كيس", "قطعة", "لتر"] },
      { key: "rate", label: "سعر الوحدة (ر.س)", type: "number", required: true },
      { key: "delivery_date", label: "تاريخ التوريد المتوقع", type: "date", required: true }
    ],
    onSave(data) {
      data.total = Number(data.qty) * Number(data.rate);
      data.order_date = new Date().toISOString().slice(0, 10);
      data.status = "قيد التوريد والتسليم";
      if (!MimarERP.purchaseOrders) MimarERP.purchaseOrders = [];
      MimarERP.purchaseOrders.unshift(data);
      logAudit("CREATE", "Purchase Order", `إصدار أمر شراء جديد ${data.id}`);
      saveToLocalStorage();
      renderProcurementTable();
      showToast("تم إصدار أمر الشراء بنجاح ✓");
    }
  });
}

// Schedule Task Operations
function openEditScheduleModal(idx) {
  const task = MimarERP.scheduleTasks[idx];
  showCrudModal({
    title: "تعديل نشاط الجدول الزمني",
    icon: "fa-calendar-check",
    record: task,
    fields: [
      { key: "name", label: "اسم النشاط", required: true },
      { key: "duration", label: "المدة (أيام)", type: "number", required: true },
      { key: "start_date", label: "تاريخ البدء", type: "date", required: true },
      { key: "end_date", label: "تاريخ الانتهاء", type: "date", required: true },
      { key: "progress_pct", label: "نسبة الإنجاز %", type: "number", min: 0, max: 100, required: true },
      { key: "status", label: "حالة النشاط", type: "select", options: ["مجدول", "جاري العمل", "مكتمل", "متأخر"] }
    ],
    onSave(data) {
      Object.assign(task, data);
      logAudit("UPDATE", "Schedule", `تعديل النشاط ${task.id} - ${task.name}`);
      saveToLocalStorage();
      renderScheduleTable();
      showToast("تم تحديث النشاط بنجاح ✓");
    }
  });
}

function deleteScheduleTask(idx) {
  const t = MimarERP.scheduleTasks[idx];
  confirmDelete(`هل أنت متأكد من حذف النشاط <strong>${t.name}</strong>؟`, () => {
    MimarERP.scheduleTasks.splice(idx, 1);
    logAudit("DELETE", "Schedule", `حذف النشاط ${t.id}`);
    saveToLocalStorage();
    renderScheduleTable();
    showToast("تم حذف النشاط من الجدول ✓");
  });
}

function openAddScheduleModal() {
  showCrudModal({
    title: "إضافة نشاط للجدول الزمني",
    icon: "fa-calendar-plus",
    fields: [
      { key: "id", label: "كود النشاط", required: true, default: "ACT-" + (100 + (MimarERP.scheduleTasks?.length || 0) + 1) },
      { key: "wbs", label: "حزمة العمل (WBS)", required: true, default: "WBS-09" },
      { key: "name", label: "اسم النشاط", required: true },
      { key: "duration", label: "المدة بالأيام", type: "number", required: true, default: 15 },
      { key: "start_date", label: "تاريخ البدء", type: "date", required: true },
      { key: "end_date", label: "تاريخ الانتهاء", type: "date", required: true },
      { key: "weight_pct", label: "الوزن النسبي %", type: "number", default: 10 }
    ],
    onSave(data) {
      data.progress_pct = 0;
      data.status = "مجدول";
      data.predecessor = "-";
      if (!MimarERP.scheduleTasks) MimarERP.scheduleTasks = [];
      MimarERP.scheduleTasks.push(data);
      logAudit("CREATE", "Schedule", `إضافة نشاط جديد ${data.id}`);
      saveToLocalStorage();
      renderScheduleTable();
      showToast("تم إضافة النشاط بنجاح ✓");
    }
  });
}

// Billing IPC Operations
function openEditBillingIPCModal(idx) {
  const b = MimarERP.billing[idx];
  showCrudModal({
    title: "تعديل بيانات المستخلص",
    icon: "fa-file-invoice-dollar",
    record: b,
    fields: [
      { key: "party", label: "الطرف / المالك", required: true },
      { key: "period", label: "فترة المستخلص", required: true },
      { key: "current_amount", label: "المبلغ المنجز خلال الفترة (ر.س)", type: "number", required: true },
      { key: "retention_pct", label: "نسبة الحجز الضامن %", type: "number", default: 5 },
      { key: "status", label: "حالة الاعتماد والصرف", type: "select", options: ["قيد الإعداد والتدقيق", "مقدم للاستشاري", "معتمد ومصروف", "مرفوض"] }
    ],
    onSave(data) {
      const cur = Number(data.current_amount);
      const prev = Number(b.previous_amount || 0);
      data.total_certified = prev + cur;
      data.retention_val = (cur * Number(data.retention_pct)) / 100;
      data.net_payable = cur - data.retention_val;
      data.vat_15_pct = data.net_payable * 0.15;
      data.total_payable_incl_vat = data.net_payable + data.vat_15_pct;
      Object.assign(b, data);
      logAudit("UPDATE", "Billing", `تعديل مستخلص ${b.id}`);
      saveToLocalStorage();
      renderBillingTable();
      showToast("تم تحديث المستخلص بنجاح ✓");
    }
  });
}

function deleteBillingIPC(idx) {
  const b = MimarERP.billing[idx];
  confirmDelete(`هل تريد حذف المستخلص <strong>${b.id}</strong>؟`, () => {
    MimarERP.billing.splice(idx, 1);
    logAudit("DELETE", "Billing", `حذف المستخلص ${b.id}`);
    saveToLocalStorage();
    renderBillingTable();
    showToast("تم حذف المستخلص ✓");
  });
}

function openAddBillingIPCModal() {
  const prevCount = MimarERP.billing?.length || 0;
  showCrudModal({
    title: "إصدار مستخلص شهري جديد (Payment Certificate)",
    icon: "fa-file-invoice",
    fields: [
      { key: "id", label: "رقم المستخلص", required: true, default: "IPC-0" + (prevCount + 1) },
      { key: "type", label: "نوع المستخلص", type: "select", options: ["مستخلص عميل (مالك)", "مستخلص مقاول باطن"] },
      { key: "party", label: "الجهة / المالك", required: true, default: "شركة إينوفست / قمم التشييد" },
      { key: "period", label: "فترة الأعمال", required: true, placeholder: "من 2026-06-01 إلى 2026-06-30" },
      { key: "current_amount", label: "قيمة الأعمال المنجزة (ر.س)", type: "number", required: true },
      { key: "retention_pct", label: "نسبة الضمان %", type: "number", default: 5 }
    ],
    onSave(data) {
      const cur = Number(data.current_amount);
      const lastIPC = MimarERP.billing && MimarERP.billing[MimarERP.billing.length - 1];
      const prev = lastIPC ? Number(lastIPC.total_certified || 0) : 0;
      data.previous_amount = prev;
      data.total_certified = prev + cur;
      data.retention_val = (cur * Number(data.retention_pct)) / 100;
      data.net_payable = cur - data.retention_val;
      data.vat_15_pct = data.net_payable * 0.15;
      data.total_payable_incl_vat = data.net_payable + data.vat_15_pct;
      data.status = "مقدم للاستشاري";
      if (!MimarERP.billing) MimarERP.billing = [];
      MimarERP.billing.push(data);
      logAudit("CREATE", "Billing", `إصدار مستخلص جديد ${data.id}`);
      saveToLocalStorage();
      renderBillingTable();
      showToast("تم إنشاء المستخلص بنجاح ✓");
    }
  });
}

// Drawings Operations
function openEditDrawingModal(idx) {
  const dwg = MimarERP.techOffice.drawings[idx];
  showCrudModal({
    title: "تعديل المخطط الهندسي",
    icon: "fa-compass-drafting",
    record: dwg,
    fields: [
      { key: "sheet_no", label: "رقم اللوحة", required: true },
      { key: "title", label: "عنوان المخطط", required: true },
      { key: "discipline", label: "التخصص", type: "select", options: ["Architectural", "Structural", "MEP", "Civil"] },
      { key: "rev", label: "رقم المراجعة (Rev)", required: true },
      { key: "status", label: "حالة الاعتماد", type: "select", options: ["صالح للتنفيذ IFC", "مرجع تصميمي معتمد", "قيد الاعتماد", "ملغى ومستبدل"] }
    ],
    onSave(data) {
      Object.assign(dwg, data);
      logAudit("UPDATE", "Drawing", `تعديل المخطط ${dwg.sheet_no}`);
      saveToLocalStorage();
      renderDrawingsTable();
      showToast("تم تحديث المخطط بنجاح ✓");
    }
  });
}

function deleteDrawingItem(idx) {
  const dwg = MimarERP.techOffice.drawings[idx];
  confirmDelete(`حذف المخطط <strong>${dwg.sheet_no}</strong>؟`, () => {
    MimarERP.techOffice.drawings.splice(idx, 1);
    logAudit("DELETE", "Drawing", `حذف المخطط ${dwg.sheet_no}`);
    saveToLocalStorage();
    renderDrawingsTable();
    showToast("تم حذف المخطط ✓");
  });
}

function openAddDrawingModal() {
  showCrudModal({
    title: "إدراج مخطط هندسي جديد",
    icon: "fa-file-circle-plus",
    fields: [
      { key: "sheet_no", label: "رقم المخطط", required: true, placeholder: "A501" },
      { key: "title", label: "عنوان وتفاصيل اللوحة", required: true },
      { key: "discipline", label: "التخصص", type: "select", options: ["Architectural", "Structural", "MEP", "Civil"] },
      { key: "rev", label: "المراجعة", required: true, default: "Rev 01" },
      { key: "status", label: "الحالة", type: "select", options: ["صالح للتنفيذ IFC", "قيد الاعتماد", "مرجع تصميمي"] }
    ],
    onSave(data) {
      data.id = "DWG-0" + ((MimarERP.techOffice?.drawings?.length || 0) + 1);
      data.date = new Date().toISOString().slice(0, 10);
      if (!MimarERP.techOffice) MimarERP.techOffice = {};
      if (!MimarERP.techOffice.drawings) MimarERP.techOffice.drawings = [];
      MimarERP.techOffice.drawings.push(data);
      logAudit("CREATE", "Drawing", `إدراج مخطط ${data.sheet_no}`);
      saveToLocalStorage();
      renderDrawingsTable();
      showToast("تمت إضافة المخطط بنجاح ✓");
    }
  });
}

// Quality Inspection Operations
function openEditInspectionModal(idx) {
  const item = MimarERP.techOffice.quality_inspections[idx];
  showCrudModal({
    title: "تعديل طلب فحص الجودة (WIR / MIR)",
    icon: "fa-certificate",
    record: item,
    fields: [
      { key: "activity", label: "النشاط / المادة المفحوصة", required: true },
      { key: "location", label: "الموقع في المشروع", required: true },
      { key: "result", label: "نتيجة الفحص الفني", required: true },
      { key: "status", label: "الحالة", type: "select", options: ["معتمد", "مرفوض", "معتمد بملاحظات", "قيد الفحص"] }
    ],
    onSave(data) {
      Object.assign(item, data);
      logAudit("UPDATE", "QA/QC", `تعديل طلب الفحص ${item.id}`);
      saveToLocalStorage();
      renderInspectionsTable();
      showToast("تم تحديث طلب الفحص بنجاح ✓");
    }
  });
}

function deleteInspectionItem(idx) {
  const item = MimarERP.techOffice.quality_inspections[idx];
  confirmDelete(`حذف طلب الفحص <strong>${item.id}</strong>؟`, () => {
    MimarERP.techOffice.quality_inspections.splice(idx, 1);
    logAudit("DELETE", "QA/QC", `حذف طلب الفحص ${item.id}`);
    saveToLocalStorage();
    renderInspectionsTable();
    showToast("تم حذف طلب الفحص ✓");
  });
}

function openAddInspectionModal() {
  const count = MimarERP.techOffice?.quality_inspections?.length || 0;
  showCrudModal({
    title: "إصدار طلب فحص جودة جديد (Work Inspection Request)",
    icon: "fa-list-check",
    fields: [
      { key: "id", label: "رقم طلب الفحص", required: true, default: "WIR-0" + (count + 1) },
      { key: "type", label: "نوع الفحص", type: "select", options: ["WIR فحص أعمال", "MIR فحص مواد"] },
      { key: "activity", label: "بيان الأعمال المطلوب فحصها", required: true },
      { key: "location", label: "الموقع الدقيق", required: true },
      { key: "boq_ref", label: "رمز بند BOQ", default: "BOQ-01" },
      { key: "result", label: "النتيجة الأولية", default: "مطابق للشروط والمواصفات" }
    ],
    onSave(data) {
      data.req_date = new Date().toISOString().slice(0, 10);
      data.status = "معتمد";
      if (!MimarERP.techOffice) MimarERP.techOffice = {};
      if (!MimarERP.techOffice.quality_inspections) MimarERP.techOffice.quality_inspections = [];
      MimarERP.techOffice.quality_inspections.unshift(data);
      logAudit("CREATE", "QA/QC", `إصدار طلب فحص ${data.id}`);
      saveToLocalStorage();
      renderInspectionsTable();
      showToast("تم إصدار طلب الفحص بنجاح ✓");
    }
  });
}

// 9. Attach Add buttons to QA/QC, Drawings, Schedule, Billing & Procurement headers
function attachHeaderAddButtons() {
  const mappings = [
    { viewId: "view-scheduling", label: "نشاط جديد", fn: "openAddScheduleModal()", icon: "fa-plus" },
    { viewId: "view-billing", label: "مستخلص جديد", fn: "openAddBillingIPCModal()", icon: "fa-plus" },
    { viewId: "view-qa-qc", label: "طلب فحص جديد (WIR/MIR)", fn: "openAddInspectionModal()", icon: "fa-plus" },
    { viewId: "view-doc-control", label: "إدراج مخطط (DWG)", fn: "openAddDrawingModal()", icon: "fa-plus" },
    { viewId: "view-procurement", label: "أمر شراء جديد (PO)", fn: "openAddPOModal()", icon: "fa-cart-plus" }
  ];

  mappings.forEach(m => {
    const sec = document.getElementById(m.viewId);
    if (!sec) return;
    if (sec.querySelector(`button[data-btn-added="${m.viewId}"]`)) return;

    const hdr = sec.querySelector(".card-header") || sec.querySelector("div[style*='justify-content:space-between']");
    if (hdr) {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary btn-sm";
      btn.setAttribute("data-btn-added", m.viewId);
      btn.innerHTML = `<i class="fas ${m.icon}"></i> ${m.label}`;
      btn.onclick = new Function(m.fn);
      hdr.appendChild(btn);
    }
  });
}

// 10. Update renderAllViews to include all newly dynamic views
const _prevRenderAll = window.renderAllViews;
window.renderAllViews = function() {
  if (typeof _prevRenderAll === "function") _prevRenderAll();
  renderProcurementTable();
  renderScheduleTable();
  renderBillingTable();
  renderInspectionsTable();
  renderDrawingsTable();
  renderAuditLogTable();
  attachHeaderAddButtons();
};

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      attachHeaderAddButtons();
      renderAuditLogTable();
    }, 400);
  });
}
