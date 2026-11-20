/* ==========================================================================
   DYNAMIC VIEWS & CRUD UPGRADE FOR MIMAR ERP
   Transforms all hardcoded views into dynamic data-bound views and adds 
   comprehensive CRUD + Audit Trail + State Persistence.
   ========================================================================== */

// 1. Ensure master data structures exist
(function initMasterData() {
  if (!window.MimarERP) window.MimarERP = {};
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
if (typeof window.logAudit !== 'function') {
  window.logAudit = function(action, entity, details) {
    const logItem = {
      id: "LOG-" + String(Date.now()).slice(-6),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: (window.MimarERP && MimarERP.currentRole) || "System User",
      action: action,
      entity: entity,
      details: details,
      ip: "127.0.0.1"
    };
    if (!MimarERP.auditLogs) MimarERP.auditLogs = [];
    MimarERP.auditLogs.unshift(logItem);
    renderAuditLogTable();
  };
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
window.renderAuditLogTable = renderAuditLogTable;

// 4. Overwrite renderProcurementTable with action buttons
window.renderProcurementTable = function() {
  const tbody = document.querySelector("#tbl-po-list tbody");
  if (!tbody) return;
  const list = MimarERP.purchaseOrders || [];
  
  const thead = document.querySelector("#tbl-po-list thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions text-center"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  const fmt = n => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tbody.innerHTML = list.map((po, idx) => {
    const badgeCls = po.status?.includes("مستلم") ? "badge-green" : (po.status?.includes("قيد") ? "badge-blue" : "badge-amber");
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
      <td class="action-btns text-center">
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px;" title="تعديل" onclick="openEditPOModal(${idx})"><i class="fas fa-pen" style="color:var(--teal)"></i></button>
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--red);" title="حذف" onclick="deletePOItem(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 5. Overwrite renderScheduleTable with action buttons
window.renderScheduleTable = function() {
  const tbody = document.querySelector("#tbl-schedule tbody");
  if (!tbody) return;
  const tasks = MimarERP.scheduleTasks || [];

  const thead = document.querySelector("#tbl-schedule thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions text-center"; th.textContent = "الإجراءات";
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
      <td class="action-btns text-center">
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px;" title="تعديل" onclick="openEditScheduleModal(${idx})"><i class="fas fa-pen" style="color:var(--teal)"></i></button>
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--red);" title="حذف" onclick="deleteScheduleTask(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 6. Overwrite renderBillingTable with action buttons
window.renderBillingTable = function() {
  const tbody = document.querySelector("#tbl-billing-ipcs tbody");
  if (!tbody) return;
  const billings = MimarERP.billing || [];

  const thead = document.querySelector("#tbl-billing-ipcs thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions text-center"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  const fmt = n => Number(n).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tbody.innerHTML = billings.map((b, idx) => {
    const badgeCls = b.status?.includes("معتمد") ? "badge-green" : (b.status?.includes("مراجعة") ? "badge-amber" : "badge-blue");
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
      <td class="action-btns text-center">
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px; color:#059669; border-color:#059669;" title="عرض رمز الفوترة الإلكترونية ZATCA Phase 2" onclick="showZatcaModal({ ipc_no: '${b.id}', amount: ${b.total_payable_incl_vat || 0}, vat_amount: ${b.vat_15_pct || 0} })"><i class="fas fa-qrcode"></i> ZATCA</button>
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px;" title="تعديل" onclick="openEditBillingIPCModal(${idx})"><i class="fas fa-pen" style="color:var(--teal)"></i></button>
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--red);" title="حذف" onclick="deleteBillingIPC(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 7. Overwrite renderInspectionsTable with action buttons
window.renderInspectionsTable = function() {
  const tbody = document.querySelector("#tbl-inspections tbody");
  if (!tbody) return;
  const list = (MimarERP.techOffice && MimarERP.techOffice.quality_inspections) || [];

  const thead = document.querySelector("#tbl-inspections thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions text-center"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  tbody.innerHTML = list.map((item, idx) => {
    const typeBadge = item.type?.includes("WIR") ? "badge-blue" : "badge-purple";
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
      <td class="action-btns text-center">
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px;" title="تعديل" onclick="openEditInspectionModal(${idx})"><i class="fas fa-pen" style="color:var(--teal)"></i></button>
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--red);" title="حذف" onclick="deleteInspectionItem(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// 8. Overwrite renderDrawingsTable with action buttons
window.renderDrawingsTable = function() {
  const tbody = document.querySelector("#tbl-drawings tbody");
  if (!tbody) return;
  const list = (MimarERP.techOffice && MimarERP.techOffice.drawings) || [];

  const thead = document.querySelector("#tbl-drawings thead tr");
  if (thead && !thead.querySelector(".col-actions")) {
    const th = document.createElement("th");
    th.className = "col-actions text-center"; th.textContent = "الإجراءات";
    thead.appendChild(th);
  }

  tbody.innerHTML = list.map((dwg, idx) => {
    const badgeColor = dwg.status?.includes("IFC") ? "badge-green" : "badge-blue";
    return `<tr>
      <td class="text-num"><strong>${dwg.sheet_no || dwg.id}</strong></td>
      <td>${dwg.title}</td>
      <td>${dwg.discipline}</td>
      <td class="text-center">${dwg.rev}</td>
      <td class="text-num">${dwg.date}</td>
      <td><span class="badge ${badgeColor}">${dwg.status}</span></td>
      <td class="action-btns text-center">
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px;" title="تعديل" onclick="openEditDrawingModal(${idx})"><i class="fas fa-pen" style="color:var(--teal)"></i></button>
        <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--red);" title="حذف" onclick="deleteDrawingItem(${idx})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
};

// =============================================================================
// MODAL CONTROLLERS WITH FULL RESILIENCE (BOTH INDEX AND OBJECT COMPATIBLE)
// =============================================================================

function openEditPOModal(idxOrRec) {
  const po = typeof idxOrRec === 'object' && idxOrRec !== null ? idxOrRec : MimarERP.purchaseOrders?.[idxOrRec];
  if (!po) return openAddPOModal();
  showCrudModal({
    title: "تعديل أمر الشراء والتوريد",
    icon: "fa-cart-shopping",
    record: po,
    fields: [
      { key: "id", label: "رقم أمر الشراء", required: true },
      { key: "supplier", label: "المورد", required: true },
      { key: "item", label: "المادة / البند", required: true, span2: true },
      { key: "qty", label: "الكمية", type: "number", required: true },
      { key: "unit", label: "الوحدة", type: "select", options: ["طن", "م³", "م²", "كيس", "قطعة", "لتر", "برميل"] },
      { key: "rate", label: "سعر الوحدة (ر.س)", type: "number", required: true },
      { key: "delivery_date", label: "تاريخ التوريد المتوقع", type: "date" },
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

function deletePOItem(idxOrId) {
  const po = typeof idxOrId === 'number' ? MimarERP.purchaseOrders?.[idxOrId] : MimarERP.purchaseOrders?.find(x => x.id === idxOrId);
  if (!po) return;
  confirmDelete(`هل تريد بالتأكيد حذف أمر الشراء <strong>${po.id}</strong>؟`, () => {
    MimarERP.purchaseOrders = MimarERP.purchaseOrders.filter(x => x !== po);
    logAudit("DELETE", "Purchase Order", `حذف أمر الشراء ${po.id}`);
    saveToLocalStorage();
    renderProcurementTable();
    showToast("تم حذف أمر الشراء ✓");
  });
}

function openAddPOModal(record = null) {
  if (record) return openEditPOModal(record);
  const supplierOpts = (MimarERP.suppliersMaster || []).map(s => s.name || s.supplier_name);
  showCrudModal({
    title: "إصدار أمر شراء جديد (Purchase Order)",
    icon: "fa-plus-circle",
    fields: [
      { key: "id", label: "رقم أمر الشراء", required: true, default: "PO-2026-00" + ((MimarERP.purchaseOrders?.length || 0) + 1) },
      { key: "supplier", label: "المورد المعتمد", type: "select", options: supplierOpts.length ? supplierOpts : ["شركة أسمنت ينبع والمدينة", "شركة هضاب الخليج للسيراميك", "شركة دهانات الجزيرة"] },
      { key: "item", label: "المادة / المواصفة", required: true, span2: true, placeholder: "اسم المادة بدقة" },
      { key: "qty", label: "الكمية", type: "number", required: true, default: 500 },
      { key: "unit", label: "الوحدة", type: "select", options: ["طن", "م³", "م²", "كيس", "قطعة", "لتر", "برميل"], default: "كيس" },
      { key: "rate", label: "سعر الوحدة (ر.س)", type: "number", required: true, default: 16.5 },
      { key: "delivery_date", label: "تاريخ التوريد المتوقع", type: "date", required: true, default: new Date().toISOString().slice(0, 10) }
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
function openEditScheduleModal(idxOrRec) {
  const task = typeof idxOrRec === 'object' && idxOrRec !== null ? idxOrRec : MimarERP.scheduleTasks?.[idxOrRec];
  if (!task) return openAddScheduleModal();
  showCrudModal({
    title: "تعديل نشاط الجدول الزمني",
    icon: "fa-calendar-check",
    record: task,
    fields: [
      { key: "name", label: "اسم النشاط", required: true, span2: true },
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

function deleteScheduleTask(idxOrId) {
  const t = typeof idxOrId === 'number' ? MimarERP.scheduleTasks?.[idxOrId] : MimarERP.scheduleTasks?.find(x => x.id === idxOrId);
  if (!t) return;
  confirmDelete(`هل أنت متأكد من حذف النشاط <strong>${t.name}</strong>؟`, () => {
    MimarERP.scheduleTasks = MimarERP.scheduleTasks.filter(x => x !== t);
    logAudit("DELETE", "Schedule", `حذف النشاط ${t.id}`);
    saveToLocalStorage();
    renderScheduleTable();
    showToast("تم حذف النشاط من الجدول ✓");
  });
}

function openAddScheduleModal(record = null) {
  if (record) return openEditScheduleModal(record);
  showCrudModal({
    title: "إضافة نشاط للجدول الزمني",
    icon: "fa-calendar-plus",
    fields: [
      { key: "id", label: "كود النشاط", required: true, default: "ACT-" + (100 + (MimarERP.scheduleTasks?.length || 0) + 1) },
      { key: "wbs", label: "حزمة العمل (WBS)", required: true, default: "WBS-09" },
      { key: "name", label: "اسم النشاط", required: true, span2: true, placeholder: "اسم النشاط بدقة" },
      { key: "duration", label: "المدة بالأيام", type: "number", required: true, default: 15 },
      { key: "start_date", label: "تاريخ البدء", type: "date", required: true, default: new Date().toISOString().slice(0, 10) },
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
function openEditBillingIPCModal(idxOrRec) {
  const b = typeof idxOrRec === 'object' && idxOrRec !== null ? idxOrRec : MimarERP.billing?.[idxOrRec];
  if (!b) return openAddBillingIPCModal();
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

function deleteBillingIPC(idxOrId) {
  const b = typeof idxOrId === 'number' ? MimarERP.billing?.[idxOrId] : MimarERP.billing?.find(x => x.id === idxOrId);
  if (!b) return;
  confirmDelete(`هل تريد حذف المستخلص <strong>${b.id}</strong>؟`, () => {
    MimarERP.billing = MimarERP.billing.filter(x => x !== b);
    logAudit("DELETE", "Billing", `حذف المستخلص ${b.id}`);
    saveToLocalStorage();
    renderBillingTable();
    showToast("تم حذف المستخلص ✓");
  });
}

function openAddBillingIPCModal(record = null) {
  if (record) return openEditBillingIPCModal(record);
  const prevCount = MimarERP.billing?.length || 0;
  showCrudModal({
    title: "إصدار مستخلص شهري جديد (Payment Certificate)",
    icon: "fa-file-invoice",
    fields: [
      { key: "id", label: "رقم المستخلص", required: true, default: "IPC-0" + (prevCount + 1) },
      { key: "type", label: "نوع المستخلص", type: "select", options: ["مستخلص عميل (مالك)", "مستخلص مقاول باطن"] },
      { key: "party", label: "الجهة / المالك", required: true, default: "شركة إينوفست / قمم التشييد" },
      { key: "period", label: "فترة الأعمال", required: true, placeholder: "من 2026-06-01 إلى 2026-06-30" },
      { key: "current_amount", label: "قيمة الأعمال المنجزة (ر.س)", type: "number", required: true, default: 250000 },
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
function openEditDrawingModal(idxOrRec) {
  const dwg = typeof idxOrRec === 'object' && idxOrRec !== null ? idxOrRec : MimarERP.techOffice?.drawings?.[idxOrRec];
  if (!dwg) return openAddDrawingModal();
  showCrudModal({
    title: "تعديل المخطط الهندسي",
    icon: "fa-compass-drafting",
    record: dwg,
    fields: [
      { key: "sheet_no", label: "رقم اللوحة", required: true },
      { key: "title", label: "عنوان المخطط", required: true, span2: true },
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

function deleteDrawingItem(idxOrSheet) {
  if (!MimarERP.techOffice?.drawings) return;
  const list = MimarERP.techOffice.drawings;
  const dwg = typeof idxOrSheet === 'number' ? list[idxOrSheet] : list.find(x => x.sheet_no === idxOrSheet || x.id === idxOrSheet);
  if (!dwg) return;
  confirmDelete(`حذف المخطط <strong>${dwg.sheet_no}</strong>؟`, () => {
    MimarERP.techOffice.drawings = list.filter(x => x !== dwg);
    logAudit("DELETE", "Drawing", `حذف المخطط ${dwg.sheet_no}`);
    saveToLocalStorage();
    renderDrawingsTable();
    showToast("تم حذف المخطط ✓");
  });
}

function openAddDrawingModal(record = null) {
  if (record) return openEditDrawingModal(record);
  showCrudModal({
    title: "إدراج مخطط هندسي جديد",
    icon: "fa-file-circle-plus",
    fields: [
      { key: "sheet_no", label: "رقم المخطط", required: true, placeholder: "A501" },
      { key: "title", label: "عنوان وتفاصيل اللوحة", required: true, span2: true },
      { key: "discipline", label: "التخصص", type: "select", options: ["Architectural", "Structural", "MEP", "Civil"], default: "Architectural" },
      { key: "rev", label: "المراجعة", required: true, default: "Rev 01" },
      { key: "status", label: "الحالة", type: "select", options: ["صالح للتنفيذ IFC", "قيد الاعتماد", "مرجع تصميمي"], default: "صالح للتنفيذ IFC" }
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
function openEditInspectionModal(idxOrRec) {
  const item = typeof idxOrRec === 'object' && idxOrRec !== null ? idxOrRec : MimarERP.techOffice?.quality_inspections?.[idxOrRec];
  if (!item) return openAddInspectionModal();
  showCrudModal({
    title: "تعديل طلب فحص الجودة (WIR / MIR)",
    icon: "fa-certificate",
    record: item,
    fields: [
      { key: "activity", label: "النشاط / المادة المفحوصة", required: true, span2: true },
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

function deleteInspectionItem(idxOrId) {
  if (!MimarERP.techOffice?.quality_inspections) return;
  const list = MimarERP.techOffice.quality_inspections;
  const item = typeof idxOrId === 'number' ? list[idxOrId] : list.find(x => x.id === idxOrId);
  if (!item) return;
  confirmDelete(`حذف طلب الفحص <strong>${item.id}</strong>؟`, () => {
    MimarERP.techOffice.quality_inspections = list.filter(x => x !== item);
    logAudit("DELETE", "QA/QC", `حذف طلب الفحص ${item.id}`);
    saveToLocalStorage();
    renderInspectionsTable();
    showToast("تم حذف طلب الفحص ✓");
  });
}

function openAddInspectionModal(record = null) {
  if (record) return openEditInspectionModal(record);
  const count = MimarERP.techOffice?.quality_inspections?.length || 0;
  showCrudModal({
    title: "إصدار طلب فحص جودة جديد (Work Inspection Request)",
    icon: "fa-list-check",
    fields: [
      { key: "id", label: "رقم طلب الفحص", required: true, default: "WIR-0" + (count + 1) },
      { key: "type", label: "نوع الفحص", type: "select", options: ["WIR فحص أعمال", "MIR فحص مواد"] },
      { key: "activity", label: "بيان الأعمال المطلوب فحصها", required: true, span2: true },
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

// 9. Update renderAllViews to include all dynamic views
const _prevRenderAllExt = window.renderAllViews;
window.renderAllViews = function() {
  if (typeof _prevRenderAllExt === "function") _prevRenderAllExt();
  if (typeof renderProcurementTable === 'function') renderProcurementTable();
  if (typeof renderScheduleTable === 'function') renderScheduleTable();
  if (typeof renderBillingTable === 'function') renderBillingTable();
  if (typeof renderInspectionsTable === 'function') renderInspectionsTable();
  if (typeof renderDrawingsTable === 'function') renderDrawingsTable();
  if (typeof renderAuditLogTable === 'function') renderAuditLogTable();
};

if (typeof document !== 'undefined') {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      if (typeof renderAllViews === 'function') renderAllViews();
    }, 150);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
 * XLSXWorkerManager — Enterprise Excel Import/Export Engine v6
 * Objective 24: Off-thread Excel operations via Web Worker
 * ═══════════════════════════════════════════════════════════════════════════
 * @description
 *   Singleton manager that owns the xlsx-worker.js Web Worker instance.
 *   Provides a simple Promise-based API for export/import operations
 *   without blocking the main UI thread.
 *
 * @example
 *   // Export subcontracts to CSV
 *   XLSXWorkerManager.exportCSV('subcontracts', MimarERP.subcontractsMaster, 'عقود-مقاولي-الباطن.csv');
 *
 *   // Export BOQ to Excel
 *   XLSXWorkerManager.exportExcel('boq', wbsData, 'جدول-الكميات-2026.xlsx');
 *
 *   // Import CSV
 *   XLSXWorkerManager.importCSV('catalog', csvTextString).then(result => console.log(result.rows));
 */
window.XLSXWorkerManager = (() => {
  'use strict';

  let _worker = null;
  let _ready  = false;
  const _pending = new Map(); // requestId → { resolve, reject }
  let _reqCounter = 0;

  /** Initialize or return existing Worker */
  function _getWorker() {
    if (_worker) return _worker;

    try {
      _worker = new Worker('assets/js/workers/xlsx-worker.js');

      _worker.onmessage = (e) => {
        const { type, requestId, payload, error } = e.data || {};

        if (type === 'WORKER_READY') {
          _ready = true;
          console.info('[XLSXWorker] Ready — entities:', payload?.entities?.join(', '));
          return;
        }

        if (type === 'PONG') {
          console.debug('[XLSXWorker] Ping OK:', payload?.timestamp);
          return;
        }

        const promise = _pending.get(requestId);
        if (!promise) return;
        _pending.delete(requestId);

        if (type === 'ERROR') {
          promise.reject(new Error(error || 'Unknown worker error'));
        } else {
          promise.resolve({ type, payload });
        }
      };

      _worker.onerror = (err) => {
        console.error('[XLSXWorker] Worker error:', err.message);
        // Reject all pending promises
        _pending.forEach(p => p.reject(err));
        _pending.clear();
        _worker = null;
        _ready  = false;
      };

    } catch (err) {
      console.warn('[XLSXWorker] Web Workers not supported or worker failed to load:', err.message);
      _worker = null;
    }

    return _worker;
  }

  /** Send a message to the worker and return a Promise */
  function _send(type, payload) {
    return new Promise((resolve, reject) => {
      const worker = _getWorker();
      if (!worker) {
        // Fallback: handle synchronously on main thread for environments without Workers
        return _fallback(type, payload, resolve, reject);
      }

      const requestId = 'req-' + (++_reqCounter);
      _pending.set(requestId, { resolve, reject });

      // Auto-timeout after 30s for large files
      setTimeout(() => {
        if (_pending.has(requestId)) {
          _pending.delete(requestId);
          reject(new Error('[XLSXWorker] Request timed out after 30s'));
        }
      }, 30000);

      worker.postMessage({ type, payload, requestId });
    });
  }

  /** Fallback: main-thread CSV generation when Web Workers unavailable */
  function _fallback(type, payload, resolve, reject) {
    try {
      if (type === 'EXPORT_CSV') {
        // Simple synchronous CSV fallback
        const { data, filename, entity } = payload;
        const rows = data || [];
        if (!rows.length) { resolve({ payload: { csvString: '', filename } }); return; }
        const headers = Object.keys(rows[0]);
        const BOM = '\uFEFF';
        const csv = BOM + [
          headers.join(','),
          ...rows.map(r => headers.map(h => {
            const v = String(r[h] ?? '');
            return v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v;
          }).join(','))
        ].join('\r\n');
        resolve({ payload: { csvString: csv, filename: filename || `${entity}.csv` } });
        return;
      }
      reject(new Error('Fallback not implemented for type: ' + type));
    } catch(e) { reject(e); }
  }

  /** Save a string/blob to disk via download link */
  function _downloadText(text, filename, mimeType) {
    const blob = new Blob([text], { type: mimeType || 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href      = url;
    link.download  = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(link); }, 2000);
  }

  /** Assemble XLSX using JSZip (main thread) from worker-prepared data */
  function _assembleXLSX(xlsxData, filename) {
    // xlsxData: { sheetName, headers: string[], rows: (string|number)[][] }
    if (typeof JSZip === 'undefined') {
      showToast('⚠ JSZip غير محمّل — جاري تصدير CSV بدلاً من Excel', 'warning');
      return null;
    }

    const zip = new JSZip();

    // Minimal OOXML sheet
    const cols = xlsxData.headers.map((_, i) => `<col min="${i+1}" max="${i+1}" width="20" customWidth="1"/>`).join('');

    const headerRow = xlsxData.headers.map((h, i) =>
      `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${escXML(h)}</t></is></c>`
    ).join('');

    const dataRows = xlsxData.rows.map((row, ri) =>
      `<row r="${ri+2}">${
        row.map((val, ci) => {
          const ref = `${colLetter(ci)}${ri+2}`;
          if (typeof val === 'number') return `<c r="${ref}"><v>${val}</v></c>`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escXML(String(val))}</t></is></c>`;
        }).join('')
      }</row>`
    ).join('');

    const sheetXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>
<row r="1" s="1" customFormat="1">${headerRow}</row>
${dataRows}
</sheetData>
</worksheet>`;

    zip.file('xl/worksheets/sheet1.xml', sheetXML);
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escXML(xlsxData.sheetName || 'Sheet1')}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);

    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      .then(blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href      = url;
        link.download  = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(link); }, 2000);
        return blob;
      });
  }

  function colLetter(i) {
    let result = '';
    i = i + 1;
    while (i > 0) {
      const rem = (i - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      i = Math.floor((i - 1) / 26);
    }
    return result;
  }

  function escXML(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }

  // Initialize worker on load
  if (typeof Worker !== 'undefined') {
    setTimeout(_getWorker, 500);
  }

  /* ── Public API ── */
  return {

    /**
     * Export entity data to CSV and trigger download
     * @param {string} entity - Entity type key (e.g. 'subcontracts', 'catalog')
     * @param {object[]} data - Array of data objects
     * @param {string} [filename] - Optional filename override
     * @returns {Promise<void>}
     */
    async exportCSV(entity, data, filename) {
      showToast('⏳ جاري تجهيز ملف CSV...', 'info');
      try {
        const result = await _send('EXPORT_CSV', { entity, data, filename });
        const { csvString, filename: fname, rowCount } = result.payload;
        _downloadText(csvString, fname, 'text/csv;charset=utf-8;');
        showToast(`✅ تم تصدير ${rowCount} سطر إلى CSV بنجاح`);
      } catch (err) {
        console.error('[XLSXWorkerManager] CSV export error:', err);
        showToast('❌ خطأ في تصدير CSV: ' + err.message, 'error');
      }
    },

    /**
     * Export entity data to Excel (.xlsx) and trigger download
     * @param {string} entity - Entity type key
     * @param {object[]} data - Array of data objects
     * @param {string} [filename] - Optional filename override
     * @returns {Promise<void>}
     */
    async exportExcel(entity, data, filename) {
      showToast('⏳ جاري تجهيز ملف Excel...', 'info');
      try {
        const result = await _send('EXPORT_EXCEL', { entity, data, filename });
        const { xlsxData, filename: fname, rowCount } = result.payload;
        await _assembleXLSX(xlsxData, fname);
        showToast(`✅ تم تصدير ${rowCount} سطر إلى Excel بنجاح`);
      } catch (err) {
        console.error('[XLSXWorkerManager] Excel export error:', err);
        // Fallback to CSV on XLSX failure
        showToast('⚠ تعذّر إنشاء Excel — جاري التصدير كـ CSV...', 'warning');
        await this.exportCSV(entity, data, (filename || entity).replace('.xlsx', '.csv'));
      }
    },

    /**
     * Export invoices as ZATCA Phase 2 compliant CSV
     * @param {object[]} invoices
     * @param {string} [filename]
     * @returns {Promise<void>}
     */
    async exportZATCA(invoices, filename) {
      showToast('⏳ جاري تجهيز ملف فواتير ZATCA...', 'info');
      try {
        const result = await _send('EXPORT_ZATCA_CSV', { data: invoices, filename });
        const { csvString, filename: fname, rowCount } = result.payload;
        _downloadText(csvString, fname, 'text/csv;charset=utf-8;');
        showToast(`✅ تم تصدير ${rowCount} فاتورة بتنسيق ZATCA Phase 2`);
      } catch (err) {
        console.error('[XLSXWorkerManager] ZATCA export error:', err);
        showToast('❌ خطأ في تصدير ZATCA: ' + err.message, 'error');
      }
    },

    /**
     * Import CSV text and return parsed rows mapped to entity schema
     * @param {string} entity - Entity type key
     * @param {string} csvText - Raw CSV string
     * @returns {Promise<{rows: object[], validCount: number, skippedCount: number}>}
     */
    async importCSV(entity, csvText) {
      showToast('⏳ جاري تحليل ملف CSV...', 'info');
      try {
        const result = await _send('IMPORT_CSV', { entity, csvText });
        const { rows, validCount, skippedCount } = result.payload;
        showToast(`✅ تم استيراد ${validCount} سجل (${skippedCount} سطر تم تجاهله)`);
        return result.payload;
      } catch (err) {
        console.error('[XLSXWorkerManager] CSV import error:', err);
        showToast('❌ خطأ في استيراد CSV: ' + err.message, 'error');
        throw err;
      }
    },

    /**
     * Handle CSV file input from <input type="file"> element
     * @param {File} file - File object from input element
     * @param {string} entity - Target entity type
     * @param {function} onSuccess - Callback(rows) called on successful import
     */
    handleFileImport(file, entity, onSuccess) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await this.importCSV(entity, e.target.result);
          if (typeof onSuccess === 'function') onSuccess(result.rows);
        } catch (err) {
          showToast('❌ فشل في معالجة الملف المستورد', 'error');
        }
      };
      reader.readAsText(file, 'UTF-8');
    },

    /** Check worker health */
    ping() { _send('PING', {}); },

    /** Whether the worker is ready */
    get isReady() { return _ready; },

    /** Get list of supported entity types */
    get supportedEntities() {
      return ['boq','procurement','subcontracts','contractors','catalog','rate_analysis','evm_data'];
    }
  };
})();

// Expose shorthand exports for use in toolbar buttons
window.exportToCSV   = (entity, data, filename) => window.XLSXWorkerManager.exportCSV(entity, data, filename);
window.exportToExcel = (entity, data, filename) => window.XLSXWorkerManager.exportExcel(entity, data, filename);
window.exportZATCA   = (invoices, filename)      => window.XLSXWorkerManager.exportZATCA(invoices, filename);

