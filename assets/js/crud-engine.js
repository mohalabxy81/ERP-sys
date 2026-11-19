/* ==========================================================================
   CRUD ENGINE — Complete Dynamic CRUD Engine for Mimar ERP
   Unified Modal Framework, Data Mapping, Audit Trail & State Persistence
   ========================================================================== */

// =============================================================================
// 1. AUDIT LOGGING & DATA PERSISTENCE
// =============================================================================
function logAudit(action, entity, details) {
  if (!window.MimarERP) window.MimarERP = {};
  if (!MimarERP.auditLogs) MimarERP.auditLogs = [];
  const logItem = {
    id: "LOG-" + String(Date.now()).slice(-6),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    user: MimarERP.currentRole || "مدير النظام",
    action: action,
    entity: entity,
    details: details,
    ip: "127.0.0.1"
  };
  MimarERP.auditLogs.unshift(logItem);
  if (typeof renderAuditLogTable === 'function') renderAuditLogTable();
}

const SAVE_KEYS = [
  'companies','branches','partners','partnerCatalog','projects','wbs','boq',
  'takeoff','rateAnalysis','billing','suppliersMaster','supplierItemsMaster',
  'priceComparisonMaster','contractorsMaster','contractorRatesMaster',
  'tenderPackagesMaster','costControlRegister','crmOpportunities','tendersMaster','hrEmployees',
  'payrollRecords','financeBillings','financeAP','financeBudget','equipmentMaster',
  'inventoryLedger','subcontractsMaster','bimElements','siteDiaryLogs',
  'punchListItems','rfiList','submittalsList','rebarBBSItems',
  'variationsMaster','cvrLedgerMaster','bimClashesMaster','cdeContainersMaster',
  'safetyIncidents','safetyTrainings','purchaseOrders','scheduleTasks','auditLogs',
  'currentCompanyId','currentProjectId','currentRole'
];

function saveToLocalStorage() {
  try {
    if (!window.MimarERP) return;
    const snap = {};
    SAVE_KEYS.forEach(k => {
      if (MimarERP[k] !== undefined) snap[k] = MimarERP[k];
    });
    localStorage.setItem('MimarERPData_v6', JSON.stringify(snap));
    saveUIState();
  } catch(e) {
    console.warn('saveToLocalStorage failed:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('MimarERPData_v6');
    if (!raw) return;
    const snap = JSON.parse(raw);
    if (!window.MimarERP) window.MimarERP = {};
    Object.assign(MimarERP, snap);
  } catch(e) {
    console.warn('loadFromLocalStorage failed:', e);
  }
}

const STATE_KEY = 'MimarERPState_v6';
function saveUIState() {
  if (typeof document === 'undefined') return;
  const activeView = document.querySelector('.page-view.active')?.id?.replace('view-','') || 'dashboard';
  const state = {
    view: activeView,
    companyId: window.MimarERP?.currentCompanyId,
    projectId: window.MimarERP?.currentProjectId,
    role: window.MimarERP?.currentRole
  };
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e){}
}

function restoreUIState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.companyId && MimarERP.companies?.some(c => c.company_id === state.companyId)) {
      MimarERP.currentCompanyId = state.companyId;
      const compSel = document.getElementById('ctx-company');
      if (compSel) compSel.value = state.companyId;
      if (typeof populateProjectDropdown === 'function') populateProjectDropdown();
    }
    if (state.projectId && MimarERP.projects?.some(p => p.project_id === state.projectId)) {
      MimarERP.currentProjectId = state.projectId;
      const prjSel = document.getElementById('ctx-project');
      if (prjSel) prjSel.value = state.projectId;
    }
    if (state.role) {
      MimarERP.currentRole = state.role;
      const roleSel = document.getElementById('ctx-role');
      if (roleSel) roleSel.value = state.role;
    }
    if (typeof applyActiveContext === 'function') applyActiveContext();
    if (state.view && state.view !== 'dashboard' && typeof switchView === 'function') {
      switchView(state.view);
    }
  } catch(e) {
    console.warn("restoreUIState error:", e);
  }
}

// Auto-load on init
(function() {
  loadFromLocalStorage();
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(restoreUIState, 200);
    });
  }
})();

// =============================================================================
// 2. UNIFIED DYNAMIC MODAL ENGINE (FOR BOTH ADD & EDIT)
// =============================================================================
let _crudModal = null;

function showCrudModal({ title, icon = 'fa-pen-to-square', fields = [], onSave, record = null, saveLabel = null }) {
  closeCrudModal();
  const isEdit = Boolean(record);
  const actionTitle = title || (isEdit ? 'تعديل البيانات' : 'إضافة سجل جديد');
  const btnLabel = saveLabel || (isEdit ? 'حفظ التعديلات' : 'إضافة وحفظ');
  const badgeHtml = isEdit 
    ? `<span class="badge badge-amber" style="margin-right:10px; font-size:11px; padding:3px 8px;">تعديل سجل قائم</span>`
    : `<span class="badge badge-green" style="margin-right:10px; font-size:11px; padding:3px 8px;">سجل جديد</span>`;

  const overlay = document.createElement('div');
  overlay.id = 'crud-modal-dynamic';
  overlay.className = 'modal-overlay show';
  overlay.style.cssText = 'display:flex; position:fixed; inset:0; background:rgba(11,25,44,0.65); z-index:99999; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:20px;';
  
  overlay.onclick = (e) => {
    if (e.target === overlay) closeCrudModal();
  };

  const fieldsHTML = fields.map(f => {
    let val = '';
    if (record && record[f.key] !== undefined && record[f.key] !== null) {
      val = record[f.key];
    } else if (f.default !== undefined) {
      val = f.default;
    }
    const reqAttr = f.required ? 'data-required="true"' : '';
    const readAttr = f.readonly ? 'readonly style="background:var(--bg-alt); cursor:not-allowed;"' : '';
    let inputHTML = '';

    if (f.type === 'select') {
      const opts = (f.options || []).map(opt => {
        const v = typeof opt === 'object' ? opt.value : opt;
        const l = typeof opt === 'object' ? opt.label : opt;
        const selected = String(val) === String(v) ? 'selected' : '';
        return `<option value="${v}" ${selected}>${l}</option>`;
      }).join('');
      inputHTML = `<select id="crud-fld-${f.key}" class="filter-dropdown" style="width:100%;" ${reqAttr} ${readAttr}>${opts}</select>`;
    } else if (f.type === 'textarea') {
      inputHTML = `<textarea id="crud-fld-${f.key}" class="search-input" rows="${f.rows || 3}" style="width:100%; height:auto; padding:8px 12px;" placeholder="${f.placeholder || ''}" ${reqAttr} ${readAttr}>${val}</textarea>`;
    } else if (f.type === 'number') {
      inputHTML = `<input type="number" id="crud-fld-${f.key}" class="search-input" style="width:100%;" value="${val}" step="${f.step || 'any'}" min="${f.min ?? ''}" max="${f.max ?? ''}" placeholder="${f.placeholder || ''}" ${reqAttr} ${readAttr}>`;
    } else if (f.type === 'date') {
      inputHTML = `<input type="date" id="crud-fld-${f.key}" class="search-input" style="width:100%;" value="${val}" ${reqAttr} ${readAttr}>`;
    } else {
      inputHTML = `<input type="text" id="crud-fld-${f.key}" class="search-input" style="width:100%;" value="${val}" placeholder="${f.placeholder || ''}" ${reqAttr} ${readAttr}>`;
    }

    const star = f.required ? `<span style="color:var(--red); font-weight:900;"> *</span>` : '';
    const spanStyle = f.span2 ? 'grid-column: span 2;' : '';
    return `
      <div style="margin-bottom:14px; ${spanStyle}">
        <label style="display:block; font-size:12px; font-weight:700; color:var(--navy); margin-bottom:5px;">
          ${f.label}${star}
        </label>
        ${inputHTML}
        ${f.hint ? `<span style="font-size:11px; color:var(--muted); display:block; margin-top:2px;">${f.hint}</span>` : ''}
      </div>
    `;
  }).join('');

  const gridCols = fields.length > 3 ? 'grid-template-columns: 1fr 1fr;' : 'grid-template-columns: 1fr;';

  overlay.innerHTML = `
    <div style="background:#fff; border-radius:12px; width:94%; max-width:720px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.35); overflow:hidden; border:1px solid var(--line);" onclick="event.stopPropagation()">
      <div style="background:linear-gradient(135deg, var(--navy) 0%, #1E3E62 100%); color:#fff; padding:16px 22px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
        <div style="display:flex; align-items:center;">
          <i class="fas ${icon}" style="color:var(--teal); font-size:18px; margin-left:10px;"></i>
          <h3 style="margin:0; font-size:16px; font-weight:800;">${actionTitle}</h3>
          ${badgeHtml}
        </div>
        <button onclick="closeCrudModal()" style="background:none; border:none; color:#CBD5E1; font-size:20px; cursor:pointer; line-height:1; padding:4px;" title="إغلاق">&times;</button>
      </div>

      <div id="crud-modal-error" style="display:none; background:#FEE2E2; border-bottom:1px solid #FCA5A5; color:#991B1B; padding:10px 22px; font-size:12px; font-weight:700;"></div>

      <div style="padding:22px; overflow-y:auto; flex:1;">
        <form id="crud-modal-form" onsubmit="event.preventDefault(); executeCrudSave();">
          <div style="display:grid; ${gridCols} gap:0 16px;">
            ${fieldsHTML}
          </div>
        </form>
      </div>

      <div style="padding:14px 22px; background:#F8FAFC; border-top:1px solid var(--line); display:flex; justify-content:flex-end; gap:10px; flex-shrink:0;">
        <button type="button" class="btn btn-outline" onclick="closeCrudModal()">إلغاء</button>
        <button type="button" class="btn btn-primary" id="crud-btn-submit" onclick="executeCrudSave()">
          <i class="fas fa-check"></i> ${btnLabel}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Esc key close
  const onKey = (e) => {
    if (e.key === 'Escape') {
      closeCrudModal();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);

  _crudModal = { overlay, fields, onSave, record, onKey };

  // Focus first input
  setTimeout(() => {
    const firstInput = overlay.querySelector('input:not([readonly]), select:not([readonly]), textarea:not([readonly])');
    if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
  }, 100);
}

function closeCrudModal() {
  if (_crudModal) {
    if (_crudModal.onKey) window.removeEventListener('keydown', _crudModal.onKey);
    if (_crudModal.overlay && _crudModal.overlay.parentNode) {
      _crudModal.overlay.parentNode.removeChild(_crudModal.overlay);
    }
    _crudModal = null;
  }
  const old = document.getElementById('crud-modal-dynamic');
  if (old) old.remove();
}

function executeCrudSave() {
  if (!_crudModal) return;
  const { fields, onSave, record } = _crudModal;
  const errEl = document.getElementById('crud-modal-error');
  const data = {};
  let firstErr = null;

  for (const f of fields) {
    const el = document.getElementById('crud-fld-' + f.key);
    if (!el) continue;
    let val = (el.value != null ? String(el.value) : '').trim();
    if (f.required && !val) {
      if (!firstErr) firstErr = `الحقل "${f.label}" مطلوب ويجب ملؤه`;
      el.style.borderColor = 'var(--red)';
    } else {
      el.style.borderColor = '';
    }
    if (f.type === 'number') {
      data[f.key] = val === '' ? (f.default ?? 0) : (parseFloat(val) || 0);
    } else {
      data[f.key] = val;
    }
  }

  if (firstErr) {
    if (errEl) {
      errEl.textContent = '⚠ ' + firstErr;
      errEl.style.display = 'block';
    }
    return;
  }

  if (errEl) errEl.style.display = 'none';
  try {
    onSave(data, record);
    closeCrudModal();
  } catch(e) {
    console.error('Error saving CRUD data:', e);
    if (errEl) {
      errEl.textContent = 'حدث خطأ أثناء الحفظ: ' + e.message;
      errEl.style.display = 'block';
    }
  }
}

// =============================================================================
// 3. UNIFIED CONFIRM DELETE DIALOG
// =============================================================================
function confirmDelete(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.cssText = 'display:flex; position:fixed; inset:0; background:rgba(11,25,44,0.65); z-index:100000; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
  
  overlay.innerHTML = `
    <div style="background:#fff; border-radius:12px; padding:28px 24px; max-width:440px; width:92%; text-align:center; box-shadow:0 25px 60px rgba(0,0,0,0.35); border:1px solid var(--line);" onclick="event.stopPropagation()">
      <div style="width:58px; height:58px; border-radius:50%; background:#FEE2E2; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:#DC2626; font-size:26px;">
        <i class="fas fa-trash-can"></i>
      </div>
      <h3 style="font-size:17px; font-weight:800; color:var(--navy); margin-bottom:8px;">تأكيد عملية الحذف</h3>
      <p style="color:var(--muted); font-size:13px; line-height:1.6; margin-bottom:24px;">${message}</p>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button class="btn btn-outline" id="btn-cancel-del">إلغاء</button>
        <button class="btn btn-danger" id="btn-confirm-del" style="background:#DC2626; color:#fff;">
          <i class="fas fa-trash-can"></i> حذف نهائي
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cleanup = () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  overlay.onclick = cleanup;
  overlay.querySelector('#btn-cancel-del').onclick = cleanup;
  overlay.querySelector('#btn-confirm-del').onclick = () => {
    cleanup();
    onConfirm();
  };
}

// Toast Notification
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Helper: Ensure thead has col-actions
function ensureActionCol(tableSelector, colTitle = 'الإجراءات') {
  const table = typeof tableSelector === 'string' ? document.querySelector(tableSelector) : tableSelector;
  if (!table) return;
  const theadTr = table.querySelector('thead tr');
  if (theadTr && !theadTr.querySelector('.col-actions')) {
    const th = document.createElement('th');
    th.className = 'col-actions text-center';
    th.style.width = '95px';
    th.textContent = colTitle;
    theadTr.appendChild(th);
  }
}

// Helper: Render action buttons HTML
function renderActionButtons(editFn, delFn) {
  return `
    <td class="action-btns text-center" style="white-space:nowrap;">
      <button class="btn btn-outline btn-sm" style="padding:4px 8px; margin-left:4px;" title="تعديل" onclick="${editFn}">
        <i class="fas fa-pen" style="color:var(--teal)"></i>
      </button>
      <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--red);" title="حذف" onclick="${delFn}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
}

// =============================================================================
// 4. ENTITY CONTROLLERS & COMPLETE CRUD DEFINITIONS
// =============================================================================

// --- 4.1 COMPANIES ---
function openAddCompanyModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات المنشأة' : 'إضافة شركة / كيان مؤسسي جديد',
    icon: 'fa-building-user',
    record,
    fields: [
      { key: 'company_code', label: 'كود الشركة', required: true, default: 'CMP-100' + ((MimarERP.companies?.length || 0) + 1) },
      { key: 'company_name_ar', label: 'اسم الشركة (عربي)', required: true, placeholder: 'مثال: شركة التطوير الإنشائي المتقدم' },
      { key: 'company_name_en', label: 'اسم الشركة (إنجليزي)', placeholder: 'e.g. Advanced Construction Development Co.' },
      { key: 'commercial_registration', label: 'رقم السجل التجاري (CR)', required: true, placeholder: '1010XXXXXX' },
      { key: 'tax_identification_number', label: 'الرقم الضريبي (TIN/VAT)', required: true, placeholder: '3000XXXXXXXX00003' },
      { key: 'country', label: 'الدولة', type: 'select', options: ['المملكة العربية السعودية','الإمارات العربية المتحدة','دولة قطر','جمهورية مصر العربية','دولة الكويت','مملكة البحرين','سلطنة عمان'], default: 'المملكة العربية السعودية' },
      { key: 'base_currency', label: 'العملة الأساسية', type: 'select', options: ['SAR','AED','QAR','EGP','USD','EUR'], default: 'SAR' },
      { key: 'phone', label: 'الهاتف المعتمد', required: true, placeholder: '+966 11 XXX XXXX' },
      { key: 'email', label: 'البريد الإلكتروني', placeholder: 'info@company.com' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['نشط','معلق','تحت التأسيس'], default: 'نشط' },
      { key: 'address', label: 'المقر والعنوان الرئيسي', type: 'textarea', span2: true, placeholder: 'المدينة، الحي، المبنى...' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Company', `تعديل بيانات الشركة ${rec.company_name_ar} (${rec.company_code})`);
        showToast('تم حفظ تعديلات الشركة بنجاح ✓');
      } else {
        data.company_id = 'CMP-' + (1000 + (MimarERP.companies?.length || 0) + 1);
        data.currency_symbol = data.base_currency === 'SAR' ? 'ر.س' : data.base_currency;
        if (!MimarERP.companies) MimarERP.companies = [];
        MimarERP.companies.push(data);
        logAudit('CREATE', 'Company', `إضافة شركة جديدة ${data.company_name_ar} (${data.company_code})`);
        showToast('تمت إضافة الشركة بنجاح ✓');
      }
      saveToLocalStorage();
      renderCompaniesTable();
      if (typeof populateCompanyDropdown === 'function') populateCompanyDropdown();
    }
  });
}

function deleteCompany(companyId) {
  const c = MimarERP.companies?.find(x => x.company_id === companyId);
  if (!c) return;
  confirmDelete(`هل أنت متأكد من حذف الشركة "<strong>${c.company_name_ar}</strong>"؟ سيؤثر الحذف على كافة العمليات المرتبطة.`, () => {
    MimarERP.companies = MimarERP.companies.filter(x => x.company_id !== companyId);
    logAudit('DELETE', 'Company', `حذف الشركة ${c.company_name_ar} (${c.company_code})`);
    saveToLocalStorage();
    renderCompaniesTable();
    showToast('تم حذف الشركة بنجاح ✓');
  });
}

// --- 4.2 BRANCHES ---
function openAddBranchModal(record = null) {
  const compOpts = (MimarERP.companies || []).map(c => ({ value: c.company_id, label: c.company_name_ar }));
  showCrudModal({
    title: record ? 'تعديل بيانات الفرع' : 'إضافة فرع إقليمي جديد',
    icon: 'fa-code-branch',
    record,
    fields: [
      { key: 'company_id', label: 'الشركة التابع لها', type: 'select', options: compOpts, required: true },
      { key: 'branch_code', label: 'كود الفرع', required: true, default: 'BR-0' + ((MimarERP.branches?.length || 0) + 1) },
      { key: 'branch_name_ar', label: 'اسم الفرع (عربي)', required: true, placeholder: 'فرع المنطقة الغربية - جدة' },
      { key: 'branch_name_en', label: 'اسم الفرع (إنجليزي)', placeholder: 'Western Region Branch' },
      { key: 'location', label: 'الموقع والمدينة', required: true, placeholder: 'الرياض / جدة / الدمام' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Branch', `تعديل فرع ${rec.branch_name_ar}`);
        showToast('تم تعديل بيانات الفرع بنجاح ✓');
      } else {
        data.branch_id = 'BR-' + (MimarERP.branches?.length || 0 + 101);
        if (!MimarERP.branches) MimarERP.branches = [];
        MimarERP.branches.push(data);
        logAudit('CREATE', 'Branch', `إضافة فرع جديد ${data.branch_name_ar}`);
        showToast('تمت إضافة الفرع بنجاح ✓');
      }
      saveToLocalStorage();
      renderBranchesTable();
    }
  });
}

function deleteBranch(branchId) {
  const b = MimarERP.branches?.find(x => x.branch_id === branchId);
  if (!b) return;
  confirmDelete(`هل أنت متأكد من حذف الفرع "<strong>${b.branch_name_ar}</strong>"؟`, () => {
    MimarERP.branches = MimarERP.branches.filter(x => x.branch_id !== branchId);
    logAudit('DELETE', 'Branch', `حذف فرع ${b.branch_name_ar}`);
    saveToLocalStorage();
    renderBranchesTable();
    showToast('تم حذف الفرع ✓');
  });
}

// --- 4.3 PARTNERS (Clients, Suppliers, Subcontractors, Consultants) ---
function openAddPartnerModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات الشريك التجاري' : 'إضافة شريك تجاري جديد',
    icon: 'fa-handshake',
    record,
    fields: [
      { key: 'partner_code', label: 'كود الشريك', required: true, default: 'PTR-2026-0' + ((MimarERP.partners?.length || 0) + 1) },
      { key: 'partner_name', label: 'اسم الشريك التجاري', required: true, placeholder: 'الاسم الرسمي المسجل بالسجل' },
      { key: 'partner_type', label: 'صفة الشريك', type: 'select', options: [
        { value: 'Supplier', label: 'مورد مواد (Supplier)' },
        { value: 'Subcontractor', label: 'مقاول باطن (Subcontractor)' },
        { value: 'Client', label: 'عميل ومطور (Client)' },
        { value: 'Consultant', label: 'استشاري هندسي (Consultant)' }
      ], required: true },
      { key: 'category', label: 'التصنيف والتخصص', required: true, placeholder: 'مثال: خرسانة جاهزة / تشطيبات معمارية' },
      { key: 'cr_number', label: 'رقم السجل التجاري', placeholder: '1010XXXXXX' },
      { key: 'tax_number', label: 'الرقم الضريبي', placeholder: '300XXXXXXXXXXX' },
      { key: 'location', label: 'المدينة والمقر', placeholder: 'الرياض / مكة المكرمة' },
      { key: 'owner', label: 'المالك / المدير العام', placeholder: 'اسم المالك أو المفوض' },
      { key: 'contact', label: 'مسؤول الاتصال ورقم الهاتف', required: true, placeholder: 'الاسم - 050XXXXXXX' },
      { key: 'rating', label: 'التقييم الفني (من 5)', type: 'number', step: '0.1', min: 1, max: 5, default: 4.5 },
      { key: 'status', label: 'حالة الشريك', type: 'select', options: ['معتمد','قيد التأهيل','محظور'], default: 'معتمد' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Partner', `تعديل شريك ${rec.partner_name}`);
        showToast('تم تحديث بيانات الشريك بنجاح ✓');
      } else {
        data.partner_id = 'PRT-' + String(Date.now()).slice(-4);
        if (!MimarERP.partners) MimarERP.partners = [];
        MimarERP.partners.unshift(data);
        logAudit('CREATE', 'Partner', `إضافة شريك جديد ${data.partner_name}`);
        showToast('تمت إضافة الشريك التجاري بنجاح ✓');
      }
      saveToLocalStorage();
      renderPartnersTable();
    }
  });
}

function deletePartner(partnerId) {
  const p = MimarERP.partners?.find(x => x.partner_id === partnerId);
  if (!p) return;
  confirmDelete(`هل أنت متأكد من حذف الشريك "<strong>${p.partner_name}</strong>"؟`, () => {
    MimarERP.partners = MimarERP.partners.filter(x => x.partner_id !== partnerId);
    logAudit('DELETE', 'Partner', `حذف شريك ${p.partner_name}`);
    saveToLocalStorage();
    renderPartnersTable();
    showToast('تم حذف الشريك بنجاح ✓');
  });
}

// --- 4.4 PARTNER CATALOG ITEMS ---
function openAddCatalogModal(record = null) {
  const partnerOpts = (MimarERP.partners || []).map(p => ({ value: p.partner_id, label: `${p.partner_name} (${p.partner_type})` }));
  showCrudModal({
    title: record ? 'تعديل بند في كتالوج الشريك' : 'إضافة خامة / بند جديد لكتالوج المورد أو المقاول',
    icon: 'fa-box-open',
    record,
    fields: [
      { key: 'partner_id', label: 'الشريك التجاري (المورد أو المقاول)', type: 'select', options: partnerOpts, required: true },
      { key: 'item_code', label: 'كود الخامة / البند', required: true, default: 'MAT-2026-0' + ((MimarERP.partnerCatalog?.length || 0) + 1) },
      { key: 'desc', label: 'اسم وتوصيف الخامة أو البند', required: true, span2: true, placeholder: 'مثال: أسمنت بورتلاندي عادي 50 كجم شيكارة' },
      { key: 'category', label: 'التخصص أو التصنيف', placeholder: 'مواد أساسية / تشطيبات' },
      { key: 'unit', label: 'الوحدة القياسية', type: 'select', options: ['م³','م²','طن','كيس','برميل','جالون','م.ط','عدد','طقم','كرتون','مقطوعية'], required: true },
      { key: 'qty', label: 'الكمية المعتمدة', type: 'number', required: true, default: 100 },
      { key: 'price_before_vat', label: 'السعر قبل الضريبة (SAR)', type: 'number', step: '0.01', required: true, default: 50 },
      { key: 'vat_pct', label: 'نسبة الضريبة %', type: 'number', default: 15, readonly: true },
      { key: 'location', label: 'موقع التسليم المعتمد', placeholder: 'الرياض / المستودع الرئيسي' },
      { key: 'owner', label: 'المسؤول المعتمد', placeholder: 'مدير المشتريات' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['ساري ومعتمد','قيد التوريد','ملغى'], default: 'ساري ومعتمد' }
    ],
    onSave(data, rec) {
      const p = MimarERP.partners?.find(x => x.partner_id === data.partner_id);
      if (p) {
        data.partner_name = p.partner_name;
        data.partner_type = p.partner_type;
        data.partner_code = p.partner_code;
      }
      const qty = Number(data.qty) || 0;
      const rate = Number(data.price_before_vat) || 0;
      data.unit_vat = rate * 0.15;
      data.price_after_vat = rate * 1.15;
      data.total_before_vat = qty * rate;
      data.total_vat = data.total_before_vat * 0.15;
      data.total_after_vat = data.total_before_vat * 1.15;

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Catalog', `تعديل بند الكتالوج ${rec.item_code} - ${rec.desc}`);
        showToast('تم تعديل بند الكتالوج بنجاح ✓');
      } else {
        if (!MimarERP.partnerCatalog) MimarERP.partnerCatalog = [];
        MimarERP.partnerCatalog.unshift(data);
        logAudit('CREATE', 'Catalog', `إضافة بند للكتالوج ${data.item_code} - ${data.desc}`);
        showToast('تمت إضافة البند للكتالوج بنجاح ✓');
      }
      saveToLocalStorage();
      renderPartnerCatalogTable();
    }
  });
}

function deleteCatalogItem(itemCode) {
  const item = MimarERP.partnerCatalog?.find(x => x.item_code === itemCode);
  if (!item) return;
  confirmDelete(`حذف البند "<strong>${item.desc}</strong>" من الكتالوج؟`, () => {
    MimarERP.partnerCatalog = MimarERP.partnerCatalog.filter(x => x.item_code !== itemCode);
    logAudit('DELETE', 'Catalog', `حذف بند الكتالوج ${itemCode}`);
    saveToLocalStorage();
    renderPartnerCatalogTable();
    showToast('تم حذف البند من الكتالوج ✓');
  });
}

// --- 4.5 PROJECTS ---
function openAddProjectModal(record = null) {
  const compOpts = (MimarERP.companies || []).map(c => ({ value: c.company_id, label: c.company_name_ar }));
  const clientOpts = (MimarERP.partners || []).filter(p => p.partner_type === 'Client').map(p => ({ value: p.partner_id, label: p.partner_name }));
  if (!clientOpts.length) clientOpts.push({ value: 'CLI-01', label: 'شركة إينوفست العقارية' });
  const consultantOpts = (MimarERP.partners || []).filter(p => p.partner_type === 'Consultant').map(p => ({ value: p.partner_id, label: p.partner_name }));
  if (!consultantOpts.length) consultantOpts.push({ value: 'CON-01', label: 'دار الهندسة للاستشارات' });

  showCrudModal({
    title: record ? 'تعديل بيانات المشروع' : 'تسجيل مشروع وعقد إنشائي جديد',
    icon: 'fa-diagram-project',
    record,
    fields: [
      { key: 'project_code', label: 'كود المشروع', required: true, default: 'PRJ-200' + ((MimarERP.projects?.length || 0) + 1) },
      { key: 'project_name_ar', label: 'اسم المشروع (عربي)', required: true, placeholder: 'مثال: برج الأعمال الفندقي بالرياض' },
      { key: 'project_name_en', label: 'اسم المشروع (إنجليزي)', placeholder: 'Business Hotel Tower' },
      { key: 'company_id', label: 'الشركة المنفذة', type: 'select', options: compOpts, required: true },
      { key: 'client_id', label: 'المالك / العميل', type: 'select', options: clientOpts, required: true },
      { key: 'consultant_id', label: 'المكتب الاستشاري', type: 'select', options: consultantOpts },
      { key: 'location', label: 'موقع المشروع والمدينة', required: true, placeholder: 'الرياض - حي العليا' },
      { key: 'contract_type', label: 'صيغة ونوع العقد', type: 'select', options: ['Lump Sum (مقطوعية)','Unit Rate (تسعير وحدات)','FIDIC Red Book 2017','EPC Turnkey (تسليم مفتاح)','Cost Plus (تكلفة زائد نسبة)'], default: 'Lump Sum (مقطوعية)' },
      { key: 'contract_value', label: 'قيمة العقد الأصلية (SAR)', type: 'number', required: true, default: 5000000 },
      { key: 'contract_duration_days', label: 'مدة العقد بالأيام', type: 'number', required: true, default: 365 },
      { key: 'contract_start_date', label: 'تاريخ بدء المشروع', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'contract_end_date', label: 'تاريخ الانتهاء التعاقدي', type: 'date', required: true },
      { key: 'physical_progress_pct', label: 'نسبة الإنجاز الفعلي %', type: 'number', min: 0, max: 100, default: 0 },
      { key: 'status', label: 'حالة المشروع', type: 'select', options: ['نشط','قيد التنفيذ','متوقف','مكتمل'], default: 'نشط' }
    ],
    onSave(data, rec) {
      data.direct_cost_budget = (Number(data.contract_value) || 0) * 0.78;
      data.currency = 'SAR';
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Project', `تعديل مشروع ${rec.project_name_ar} (${rec.project_code})`);
        showToast('تم تحديث بيانات المشروع بنجاح ✓');
      } else {
        data.project_id = 'PRJ-' + (2000 + (MimarERP.projects?.length || 0) + 1);
        if (!MimarERP.projects) MimarERP.projects = [];
        MimarERP.projects.push(data);
        logAudit('CREATE', 'Project', `تسجيل مشروع جديد ${data.project_name_ar} (${data.project_code})`);
        showToast('تم تسجيل المشروع بنجاح ✓');
      }
      saveToLocalStorage();
      renderProjectsTable();
      if (typeof populateProjectDropdown === 'function') populateProjectDropdown();
    }
  });
}

function deleteProject(projectId) {
  const p = MimarERP.projects?.find(x => x.project_id === projectId);
  if (!p) return;
  confirmDelete(`هل تريد حذف مشروع "<strong>${p.project_name_ar}</strong>"؟ سيؤثر الحذف على كافة البنود والوثائق التابعة.`, () => {
    MimarERP.projects = MimarERP.projects.filter(x => x.project_id !== projectId);
    logAudit('DELETE', 'Project', `حذف مشروع ${p.project_name_ar} (${p.project_code})`);
    saveToLocalStorage();
    renderProjectsTable();
    showToast('تم حذف المشروع بنجاح ✓');
  });
}

// --- 4.6 BOQ ITEMS ---
function openAddBOQModal(record = null) {
  const wbsOpts = (MimarERP.wbs || []).map(w => ({ value: w.code || w.wbs_id, label: `${w.code} - ${w.title_ar || w.title_en}` }));
  if (!wbsOpts.length) wbsOpts.push({ value: 'WBS-09', label: 'WBS-09 - أعمال التشطيبات' });

  showCrudModal({
    title: record ? 'تعديل بند جدول الكميات' : 'إضافة بند جديد في جدول الكميات (BOQ Item)',
    icon: 'fa-sitemap',
    record,
    fields: [
      { key: 'code', label: 'كود البند (CSI MasterFormat)', required: true, default: '03 30 00.0' + ((MimarERP.boq?.length || 0) + 1) },
      { key: 'wbs', label: 'حزمة العمل WBS', type: 'select', options: wbsOpts, required: true },
      { key: 'division', label: 'القسم والتخصص', type: 'select', options: ['الأعمال الترابية','الخرسانات','المباني','العوازل','التشطيبات','الكهروميكانيك','الموقع العام'], default: 'التشطيبات' },
      { key: 'item', label: 'اسم وتوصيف البند', required: true, span2: true, placeholder: 'مثال: صب خرسانة مسلحة للأعمدة عيار 350 كجم' },
      { key: 'unit', label: 'الوحدة الهندسية', type: 'select', options: ['م³','م²','م.ط','طن','كجم','عدد','طقم','مقطوعية'], required: true, default: 'م³' },
      { key: 'qty_rfq', label: 'الكمية التعاقدية المعتمدة', type: 'number', required: true, default: 100 },
      { key: 'rate_selling', label: 'سعر البيع التعاقدي للوحدة (SAR)', type: 'number', step: '0.01', required: true, default: 250 },
      { key: 'status', label: 'حالة البند', type: 'select', options: ['معتمد','قيد المراجعة','مؤجل'], default: 'معتمد' },
      { key: 'description', label: 'المواصفة الفنية التفصيلية', type: 'textarea', span2: true, placeholder: 'وفق المخططات والكود السعودي SBC 304...' }
    ],
    onSave(data, rec) {
      const qty = Number(data.qty_rfq) || 0;
      const rate = Number(data.rate_selling) || 0;
      data.qty_approved = qty;
      data.total_selling_amount = qty * rate;
      data.rate_direct_total = rate * 0.75;
      data.total_cost_direct = qty * data.rate_direct_total;

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'BOQ', `تعديل بند BOQ ${rec.code} - ${rec.item}`);
        showToast('تم تحديث بند جدول الكميات بنجاح ✓');
      } else {
        data.id = 'BOQ-' + (MimarERP.boq?.length || 0 + 1);
        if (!MimarERP.boq) MimarERP.boq = [];
        MimarERP.boq.push(data);
        logAudit('CREATE', 'BOQ', `إضافة بند BOQ جديد ${data.code} - ${data.item}`);
        showToast('تمت إضافة البند لجدول الكميات بنجاح ✓');
      }
      saveToLocalStorage();
      renderWBSBOQTree();
    }
  });
}

function deleteBOQItem(itemCodeOrId) {
  const item = MimarERP.boq?.find(x => x.id === itemCodeOrId || x.code === itemCodeOrId);
  if (!item) return;
  confirmDelete(`حذف البند "<strong>${item.item}</strong>" (${item.code}) من جدول الكميات؟`, () => {
    MimarERP.boq = MimarERP.boq.filter(x => x.id !== item.id && x.code !== item.code);
    logAudit('DELETE', 'BOQ', `حذف بند BOQ ${item.code}`);
    saveToLocalStorage();
    renderWBSBOQTree();
    showToast('تم حذف البند من جدول الكميات ✓');
  });
}

// --- 4.7 TAKEOFF / QTO ---
function openAddTakeoffModal(record = null) {
  const boqOpts = (MimarERP.boq || []).map(b => ({ value: b.id || b.code, label: `${b.code} - ${b.item}` }));
  showCrudModal({
    title: record ? 'تعديل سطر الحصر الهندسي' : 'إضافة قياس حصر هندسي جديد (Quantity Takeoff)',
    icon: 'fa-ruler-combined',
    record,
    fields: [
      { key: 'boq_id', label: 'بند جدول الكميات المرتبط', type: 'select', options: boqOpts, required: true },
      { key: 'location', label: 'الموقع في المشروع', required: true, placeholder: 'الدور الأرضي - القواعد - السقف' },
      { key: 'axis', label: 'المحاور الإنشائية', placeholder: 'المحاور A-D / 1-4' },
      { key: 'desc', label: 'البيان وتوصيف القياس', required: true, span2: true, placeholder: 'حصر خرسانة مسلحة للأعمدة C1-C6' },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['م³','م²','م.ط','عدد','طن'], required: true, default: 'م³' },
      { key: 'no', label: 'العدد / التكرار', type: 'number', required: true, default: 1 },
      { key: 'length', label: 'الطول (م)', type: 'number', step: '0.01', required: true, default: 1 },
      { key: 'width', label: 'العرض (م)', type: 'number', step: '0.01', required: true, default: 1 },
      { key: 'height', label: 'الارتفاع / السمك (م)', type: 'number', step: '0.01', required: true, default: 1 },
      { key: 'deduction', label: 'خصم الفتحات (م)', type: 'number', step: '0.01', default: 0 },
      { key: 'status', label: 'حالة الحصر', type: 'select', options: ['معتمد بالحصر','مسودة قيد التدقيق'], default: 'معتمد بالحصر' }
    ],
    onSave(data, rec) {
      const gross = (Number(data.no) || 1) * (Number(data.length) || 1) * (Number(data.width) || 1) * (Number(data.height) || 1);
      const ded = Number(data.deduction) || 0;
      data.gross_qty = gross;
      data.net_qty = gross - ded;

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Takeoff', `تعديل سطر حصر ${rec.id} - ${rec.desc}`);
        showToast('تم تعديل سطر الحصر بنجاح ✓');
      } else {
        data.id = 'TKF-' + String((MimarERP.takeoff?.length || 0) + 1).padStart(3, '0');
        if (!MimarERP.takeoff) MimarERP.takeoff = [];
        MimarERP.takeoff.push(data);
        logAudit('CREATE', 'Takeoff', `إضافة سطر حصر جديد ${data.id} - ${data.desc}`);
        showToast('تمت إضافة سطر الحصر بنجاح ✓');
      }
      saveToLocalStorage();
      renderTakeoffTable();
    }
  });
}

function deleteTakeoffItem(takeoffId) {
  const item = MimarERP.takeoff?.find(x => x.id === takeoffId);
  if (!item) return;
  confirmDelete(`حذف سطر الحصر "<strong>${item.desc}</strong>" (${item.id})؟`, () => {
    MimarERP.takeoff = MimarERP.takeoff.filter(x => x.id !== takeoffId);
    logAudit('DELETE', 'Takeoff', `حذف سطر حصر ${takeoffId}`);
    saveToLocalStorage();
    renderTakeoffTable();
    showToast('تم حذف سطر الحصر ✓');
  });
}

// --- 4.8 PURCHASE ORDERS (Procurement) ---
function openAddPOModal(record = null) {
  const supOpts = (MimarERP.partners || []).filter(p => p.partner_type === 'Supplier').map(p => p.partner_name);
  if (!supOpts.length) supOpts.push('شركة أسمنت ينبع والمدينة','شركة هضاب الخليج للسيراميك','شركة دهانات الجزيرة');

  showCrudModal({
    title: record ? 'تعديل أمر الشراء والتوريد' : 'إصدار أمر شراء جديد (Purchase Order)',
    icon: 'fa-cart-shopping',
    record,
    fields: [
      { key: 'id', label: 'رقم أمر الشراء', required: true, default: 'PO-2026-00' + ((MimarERP.purchaseOrders?.length || 0) + 1) },
      { key: 'supplier', label: 'المورد المعتمد', type: 'select', options: supOpts, required: true },
      { key: 'item', label: 'المادة والمواصفة', required: true, span2: true, placeholder: 'مثال: أسمنت بورتلاندي عادي 50 كجم شيكارة' },
      { key: 'qty', label: 'الكمية المطلوبة', type: 'number', required: true, default: 500 },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['طن','م³','م²','كيس','قطعة','لتر','برميل'], required: true, default: 'كيس' },
      { key: 'rate', label: 'سعر الوحدة (SAR)', type: 'number', step: '0.01', required: true, default: 16.5 },
      { key: 'order_date', label: 'تاريخ الإصدار', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'delivery_date', label: 'تاريخ التوريد المتوقع', type: 'date', required: true },
      { key: 'status', label: 'حالة أمر الشراء', type: 'select', options: ['قيد التوريد والتسليم','مستلم بالكامل (GRN-01)','مستلم جزئياً','مسودة','ملغى'], default: 'قيد التوريد والتسليم' }
    ],
    onSave(data, rec) {
      data.total = (Number(data.qty) || 0) * (Number(data.rate) || 0);
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Procurement', `تعديل أمر الشراء ${rec.id}`);
        showToast('تم تحديث أمر الشراء بنجاح ✓');
      } else {
        if (!MimarERP.purchaseOrders) MimarERP.purchaseOrders = [];
        MimarERP.purchaseOrders.unshift(data);
        logAudit('CREATE', 'Procurement', `إصدار أمر شراء جديد ${data.id}`);
        showToast('تم إصدار أمر الشراء بنجاح ✓');
      }
      saveToLocalStorage();
      renderProcurementTable();
    }
  });
}

function deletePOItem(poIdOrIdx) {
  const po = typeof poIdOrIdx === 'number' 
    ? MimarERP.purchaseOrders?.[poIdOrIdx] 
    : MimarERP.purchaseOrders?.find(x => x.id === poIdOrIdx);
  if (!po) return;
  confirmDelete(`هل تريد بالتأكيد حذف أمر الشراء <strong>${po.id}</strong>؟`, () => {
    MimarERP.purchaseOrders = MimarERP.purchaseOrders.filter(x => x.id !== po.id);
    logAudit('DELETE', 'Procurement', `حذف أمر الشراء ${po.id}`);
    saveToLocalStorage();
    renderProcurementTable();
    showToast('تم حذف أمر الشراء بنجاح ✓');
  });
}

// --- 4.9 INVENTORY MOVEMENTS ---
function openAddInventoryModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل حركة المخزون' : 'تسجيل إذن حركة مستودعية جديدة (Inventory Transaction)',
    icon: 'fa-boxes-stacked',
    record,
    fields: [
      { key: 'tx_id', label: 'رقم القيد المستودعي', required: true, default: 'TXN-2026-0' + ((MimarERP.inventoryLedger?.length || 0) + 1) },
      { key: 'tx_type', label: 'نوع الحركة', type: 'select', options: ['إذن استلام بضاعة (GRN)','إذن صرف للموقع (GIN)','إرجاع مواد للمورد','تسوية جردية'], required: true },
      { key: 'warehouse', label: 'المستودع', type: 'select', options: ['المستودع المركزي - الرياض','مستودع الموقع الرئيسي','مستودع المواد الكيميائية والعوازل'], required: true },
      { key: 'item_name', label: 'اسم المادة والخامة', required: true, placeholder: 'أسمنت / حديد / دهانات' },
      { key: 'batch_no', label: 'رقم التشغيلة / الشحنة', placeholder: 'BATCH-2026-X' },
      { key: 'qty_in', label: 'الكمية الواردة (+)', type: 'number', default: 0 },
      { key: 'qty_out', label: 'الكمية المنصرفة (-)', type: 'number', default: 0 },
      { key: 'unit_cost', label: 'تكلفة الوحدة (SAR)', type: 'number', step: '0.01', required: true, default: 20 },
      { key: 'wbs_ref', label: 'حزمة العمل WBS المرتبطة', placeholder: 'WBS-09' },
      { key: 'tx_date', label: 'تاريخ الحركة', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Inventory', `تعديل حركة المخزون ${rec.tx_id}`);
        showToast('تم تعديل قيد المخزون بنجاح ✓');
      } else {
        if (!MimarERP.inventoryLedger) MimarERP.inventoryLedger = [];
        MimarERP.inventoryLedger.unshift(data);
        logAudit('CREATE', 'Inventory', `تسجيل حركة مخزون جديدة ${data.tx_id}`);
        showToast('تم تسجيل حركة المخزون بنجاح ✓');
      }
      saveToLocalStorage();
      renderInventoryTable();
    }
  });
}

function deleteInventory(txId) {
  const item = MimarERP.inventoryLedger?.find(x => x.tx_id === txId);
  if (!item) return;
  confirmDelete(`حذف حركة المخزون <strong>${txId}</strong>؟`, () => {
    MimarERP.inventoryLedger = MimarERP.inventoryLedger.filter(x => x.tx_id !== txId);
    logAudit('DELETE', 'Inventory', `حذف حركة المخزون ${txId}`);
    saveToLocalStorage();
    renderInventoryTable();
    showToast('تم حذف قيد المخزون ✓');
  });
}

// --- 4.10 SUBCONTRACTS ---
function openAddSubcontractModal(record = null) {
  const scOpts = (MimarERP.partners || []).filter(p => p.partner_type === 'Subcontractor').map(p => p.partner_name);
  if (!scOpts.length) scOpts.push('شركة البنيان المتخصصة','رواد العزل الحديث للمقاولات','مؤسسة الصفوة للأعمال الكهروميكانيكية');

  showCrudModal({
    title: record ? 'تعديل عقد مقاول الباطن' : 'إبرام وتسجيل عقد مقاولة باطن جديد (Subcontract Agreement)',
    icon: 'fa-file-signature',
    record,
    fields: [
      { key: 'sub_id', label: 'رقم العقد', required: true, default: 'SUB-2026-0' + ((MimarERP.subcontractsMaster?.length || 0) + 1) },
      { key: 'contractor_name', label: 'اسم مقاول الباطن', type: 'select', options: scOpts, required: true },
      { key: 'scope', label: 'نطاق ومجال الأعمال المسندة', required: true, span2: true, placeholder: 'مثال: أعمال اللياسة والدهانات المعمارية' },
      { key: 'original_value', label: 'قيمة العقد الأصلية (SAR)', type: 'number', required: true, default: 350000 },
      { key: 'approved_vos', label: 'أوامر التغيير المعتمدة (SAR)', type: 'number', default: 0 },
      { key: 'executed_measured', label: 'الأعمال المنفذة بالحصر (SAR)', type: 'number', default: 0 },
      { key: 'retention_pct', label: 'نسبة الحجز الضامن %', type: 'number', default: 5 },
      { key: 'status', label: 'حالة العقد', type: 'select', options: ['نشط وقيد التنفيذ','مكتمل ومسلم','قيد التسوية النهائية'], default: 'نشط وقيد التنفيذ' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Subcontract', `تعديل عقد مقاول الباطن ${rec.sub_id} - ${rec.contractor_name}`);
        showToast('تم تعديل عقد مقاول الباطن بنجاح ✓');
      } else {
        if (!MimarERP.subcontractsMaster) MimarERP.subcontractsMaster = [];
        MimarERP.subcontractsMaster.unshift(data);
        logAudit('CREATE', 'Subcontract', `إبرام عقد مقاول باطن جديد ${data.sub_id}`);
        showToast('تم إبرام العقد بنجاح ✓');
      }
      saveToLocalStorage();
      renderSubcontractsTable();
    }
  });
}

function deleteSubcontract(subId) {
  const item = MimarERP.subcontractsMaster?.find(x => x.sub_id === subId);
  if (!item) return;
  confirmDelete(`حذف عقد المقاول "<strong>${item.contractor_name}</strong>" (${subId})؟`, () => {
    MimarERP.subcontractsMaster = MimarERP.subcontractsMaster.filter(x => x.sub_id !== subId);
    logAudit('DELETE', 'Subcontract', `حذف عقد مقاول ${subId}`);
    saveToLocalStorage();
    renderSubcontractsTable();
    showToast('تم حذف عقد مقاول الباطن ✓');
  });
}

// --- 4.11 SITE DIARY (Daily Logs) ---
function openAddDiaryModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل التقرير اليومي للموقع' : 'تسجيل تقرير يومي جديد للموقع (Daily Site Diary)',
    icon: 'fa-calendar-day',
    record,
    fields: [
      { key: 'date', label: 'تاريخ التقرير اليومي', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'weather', label: 'حالة الطقس ودرجة الحرارة', required: true, default: 'مشمس 30°C' },
      { key: 'shift', label: 'الوردية', type: 'select', options: ['وردية صباحية (8 ساعات)','وردية مسائية','وردية ليلية'], default: 'وردية صباحية (8 ساعات)' },
      { key: 'total_hours', label: 'ساعات العمل الفعلية', type: 'number', default: 8 },
      { key: 'total_workforce', label: 'إجمالي عدد العمالة بالموقع', type: 'number', required: true, default: 45 },
      { key: 'trades', label: 'بيان المهن والتخصصات المتواجدة', required: true, span2: true, placeholder: '15 نجار مسلح، 12 حداد، 10 عمال، 4 فنيين كهرباء، 4 سباكة' },
      { key: 'equipment_active', label: 'المعدات العاملة بالموقع', span2: true, placeholder: 'مضخة خرسانة 42م، رافعة برجية 12 طن، 2 بوبكات' },
      { key: 'progress_summary', label: 'ملخص إنجاز الأعمال اليومية المنفذة', type: 'textarea', span2: true, required: true, placeholder: 'تم الانتهاء من صب 140 م³ خرسانة مسلحة لسقف الدور الأرضي...' },
      { key: 'hse_status', label: 'موقف السلامة والصحة المهنية (HSE)', required: true, default: 'لا حوادث - صفر إصابات ✓' },
      { key: 'qa_status', label: 'موقف الجودة والاستلامات الفنية', required: true, default: 'تم استلام حدادة سقف الدور الأرضي بنجاح' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'SiteDiary', `تعديل تقرير اليومية لتاريخ ${rec.date}`);
        showToast('تم تحديث التقرير اليومي بنجاح ✓');
      } else {
        if (!MimarERP.siteDiaryLogs) MimarERP.siteDiaryLogs = [];
        MimarERP.siteDiaryLogs.unshift(data);
        logAudit('CREATE', 'SiteDiary', `تسجيل تقرير يومي جديد لتاريخ ${data.date}`);
        showToast('تم تسجيل التقرير اليومي بنجاح ✓');
      }
      saveToLocalStorage();
      renderSiteDiary();
    }
  });
}

function deleteDiaryEntry(date) {
  const item = MimarERP.siteDiaryLogs?.find(x => x.date === date);
  if (!item) return;
  confirmDelete(`حذف التقرير اليومي ليوم "<strong>${date}</strong>"؟`, () => {
    MimarERP.siteDiaryLogs = MimarERP.siteDiaryLogs.filter(x => x.date !== date);
    logAudit('DELETE', 'SiteDiary', `حذف تقرير اليومية لتاريخ ${date}`);
    saveToLocalStorage();
    renderSiteDiary();
    showToast('تم حذف تقرير اليومية ✓');
  });
}

// --- 4.12 PUNCH LIST (Snags) ---
function openAddPunchModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل ملاحظة التسليم والجودة' : 'تسجيل ملاحظة واستلام جديد (New Punch Item)',
    icon: 'fa-clipboard-check',
    record,
    fields: [
      { key: 'snag_id', label: 'كود الملاحظة', required: true, default: 'PL-0' + ((MimarERP.punchListItems?.length || 0) + 1) },
      { key: 'location', label: 'الموقع الدقيق والفراغ', required: true, placeholder: 'الدور الأول - غرفة 104' },
      { key: 'discipline', label: 'التخصص الهندسي', type: 'select', options: ['معماري','إنشائي','كهروميكانيك MEP','تشطيبات','عوازل'], default: 'تشطيبات', required: true },
      { key: 'desc', label: 'وصف الملاحظة الهندسية بدقة', type: 'textarea', span2: true, required: true, placeholder: 'عدم استواء دهان الحائط الشمالي وتسييل بوية' },
      { key: 'severity', label: 'درجة الأهمية والخطورة', type: 'select', options: ['حرج (Critical)','رئيسي (Major)','بسيط (Minor)'], default: 'بسيط (Minor)', required: true },
      { key: 'contractor', label: 'المقاول المسؤول عن الإصلاح', required: true, placeholder: 'شركة الدهانات الحديثة' },
      { key: 'date_opened', label: 'تاريخ التسجيل', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'due_date', label: 'الموعد النهائي للإصلاح', type: 'date', required: true },
      { key: 'status', label: 'حالة المعالجة', type: 'select', options: ['جاري المعالجة','مغلق ومعتمد','مفتوح'], default: 'جاري المعالجة', required: true }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'PunchList', `تعديل ملاحظة ${rec.snag_id} - ${rec.location}`);
        showToast('تم تحديث الملاحظة بنجاح ✓');
      } else {
        if (!MimarERP.punchListItems) MimarERP.punchListItems = [];
        MimarERP.punchListItems.unshift(data);
        logAudit('CREATE', 'PunchList', `تسجيل ملاحظة استلام جديدة ${data.snag_id}`);
        showToast('تم تسجيل الملاحظة بنجاح ✓');
      }
      saveToLocalStorage();
      renderPunchList();
    }
  });
}

function deletePunchItem(snagId) {
  const item = MimarERP.punchListItems?.find(x => x.snag_id === snagId);
  if (!item) return;
  confirmDelete(`حذف الملاحظة "<strong>${item.snag_id}</strong> - ${item.desc}"؟`, () => {
    MimarERP.punchListItems = MimarERP.punchListItems.filter(x => x.snag_id !== snagId);
    logAudit('DELETE', 'PunchList', `حذف ملاحظة ${snagId}`);
    saveToLocalStorage();
    renderPunchList();
    showToast('تم حذف الملاحظة بنجاح ✓');
  });
}

// --- 4.13 RFI (Request For Information) ---
function openAddRFIModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل الاستفسار الهندسي' : 'تقديم طلب استفسار هندسي جديد (New RFI)',
    icon: 'fa-circle-question',
    record,
    fields: [
      { key: 'id', label: 'رقم RFI', required: true, default: 'RFI-2026-00' + ((MimarERP.rfiList?.length || 0) + 1) },
      { key: 'subject', label: 'موضوع الاستفسار الهندسي', required: true, span2: true, placeholder: 'مثال: تعارض مسار التكييف مع جسور السقف الإنشائية' },
      { key: 'discipline', label: 'التخصص', type: 'select', options: ['إنشائي','معماري','كهروميكانيك MEP','بنية تحتية'], default: 'إنشائي', required: true },
      { key: 'priority', label: 'الأولوية', type: 'select', options: ['عاجل (Urgent)','عالي (High)','متوسط (Medium)'], default: 'متوسط (Medium)', required: true },
      { key: 'drawing_ref', label: 'المخطط المرجعي', placeholder: 'STR-S-104' },
      { key: 'spec_ref', label: 'المواصفة المرجعية', placeholder: 'Section 15800' },
      { key: 'question', label: 'نص السؤال الفني والتوجيه المطلوب', type: 'textarea', span2: true, required: true, placeholder: 'اكتب تفاصيل الاستفسار الفني وتأثيره على الموقع...' },
      { key: 'cost_impact', label: 'الأثر المالي المتوقع', default: 'لا يوجد' },
      { key: 'schedule_impact', label: 'الأثر الزمني المتوقع', default: '0 يوم' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['تحت المراجعة','تم الرد والاعتماد','مغلق'], default: 'تحت المراجعة' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'RFI', `تعديل الاستفسار الهندسي ${rec.id} - ${rec.subject}`);
        showToast('تم تحديث الاستفسار الهندسي بنجاح ✓');
      } else {
        data.submitted_date = new Date().toISOString().slice(0, 10);
        data.response = data.response || 'قيد دراسة ومراجعة الاستشاري المشرف';
        if (!MimarERP.rfiList) MimarERP.rfiList = [];
        MimarERP.rfiList.unshift(data);
        logAudit('CREATE', 'RFI', `تقديم استفسار هندسي جديد ${data.id}`);
        showToast('تم تقديم الاستفسار الهندسي بنجاح ✓');
      }
      saveToLocalStorage();
      renderRFIList();
    }
  });
}

function deleteRFIItem(rfiId) {
  const item = MimarERP.rfiList?.find(x => x.id === rfiId);
  if (!item) return;
  confirmDelete(`حذف الاستفسار الهندسي <strong>${rfiId}</strong>؟`, () => {
    MimarERP.rfiList = MimarERP.rfiList.filter(x => x.id !== rfiId);
    logAudit('DELETE', 'RFI', `حذف استفسار هندسي ${rfiId}`);
    saveToLocalStorage();
    renderRFIList();
    showToast('تم حذف الاستفسار الهندسي ✓');
  });
}

// --- 4.14 SCHEDULE TASKS ---
function openAddScheduleModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل نشاط الجدول الزمني' : 'إضافة نشاط للجدول الزمني (Gantt Activity)',
    icon: 'fa-calendar-plus',
    record,
    fields: [
      { key: 'id', label: 'كود النشاط', required: true, default: 'ACT-' + (100 + (MimarERP.scheduleTasks?.length || 0) + 1) },
      { key: 'wbs', label: 'حزمة العمل WBS', required: true, default: 'WBS-09' },
      { key: 'name', label: 'اسم النشاط الهندسي', required: true, span2: true, placeholder: 'أعمال تركيب قطاعات الألمنيوم والواجهات' },
      { key: 'duration', label: 'المدة (أيام)', type: 'number', required: true, default: 15 },
      { key: 'start_date', label: 'تاريخ البدء', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'end_date', label: 'تاريخ الانتهاء', type: 'date', required: true },
      { key: 'predecessor', label: 'العلاقة السابقة', default: '-' },
      { key: 'weight_pct', label: 'الوزن النسبي %', type: 'number', default: 10 },
      { key: 'progress_pct', label: 'نسبة الإنجاز %', type: 'number', min: 0, max: 100, default: 0 },
      { key: 'status', label: 'حالة النشاط', type: 'select', options: ['مجدول','جاري العمل','مكتمل','متأخر'], default: 'مجدول' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Schedule', `تعديل نشاط الجدول ${rec.id} - ${rec.name}`);
        showToast('تم تحديث النشاط بنجاح ✓');
      } else {
        if (!MimarERP.scheduleTasks) MimarERP.scheduleTasks = [];
        MimarERP.scheduleTasks.push(data);
        logAudit('CREATE', 'Schedule', `إضافة نشاط جديد ${data.id} - ${data.name}`);
        showToast('تمت إضافة النشاط للجدول الزمني بنجاح ✓');
      }
      saveToLocalStorage();
      renderScheduleTable();
    }
  });
}

function deleteScheduleTask(taskIdOrIdx) {
  const t = typeof taskIdOrIdx === 'number'
    ? MimarERP.scheduleTasks?.[taskIdOrIdx]
    : MimarERP.scheduleTasks?.find(x => x.id === taskIdOrIdx);
  if (!t) return;
  confirmDelete(`حذف النشاط "<strong>${t.name}</strong>" (${t.id}) من الجدول الزمني؟`, () => {
    MimarERP.scheduleTasks = MimarERP.scheduleTasks.filter(x => x.id !== t.id);
    logAudit('DELETE', 'Schedule', `حذف نشاط ${t.id}`);
    saveToLocalStorage();
    renderScheduleTable();
    showToast('تم حذف النشاط من الجدول ✓');
  });
}

// --- 4.15 BILLING / IPCs ---
function openAddBillingIPCModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات المستخلص' : 'إصدار شهادة دفع ومستخلص شهري (Payment Certificate)',
    icon: 'fa-file-invoice-dollar',
    record,
    fields: [
      { key: 'id', label: 'رقم المستخلص', required: true, default: 'IPC-0' + ((MimarERP.billing?.length || 0) + 1) },
      { key: 'type', label: 'نوع المستخلص', type: 'select', options: ['مستخلص عميل (مالك)','مستخلص مقاول باطن'], required: true },
      { key: 'party', label: 'الطرف / المالك / المقاول', required: true, default: 'شركة إينوفست / قمم التشييد' },
      { key: 'period', label: 'فترة الأعمال', required: true, placeholder: 'من 2026-06-01 إلى 2026-06-30' },
      { key: 'current_amount', label: 'قيمة الأعمال المنجزة خلال الفترة (SAR)', type: 'number', required: true, default: 250000 },
      { key: 'retention_pct', label: 'نسبة الحجز الضامن %', type: 'number', default: 5 },
      { key: 'status', label: 'حالة الاعتماد والصرف', type: 'select', options: ['معتمد ومصروف','مقدم للاستشاري','قيد الإعداد والتدقيق','مرفوض'], default: 'مقدم للاستشاري' }
    ],
    onSave(data, rec) {
      const cur = Number(data.current_amount) || 0;
      const prev = rec ? (Number(rec.previous_amount) || 0) : ((MimarERP.billing?.[MimarERP.billing.length - 1]?.total_certified) || 0);
      data.previous_amount = prev;
      data.total_certified = prev + cur;
      data.retention_val = (cur * (Number(data.retention_pct) || 5)) / 100;
      data.net_payable = cur - data.retention_val;
      data.vat_15_pct = data.net_payable * 0.15;
      data.total_payable_incl_vat = data.net_payable + data.vat_15_pct;

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Billing', `تعديل مستخلص ${rec.id}`);
        showToast('تم تحديث المستخلص بنجاح ✓');
      } else {
        if (!MimarERP.billing) MimarERP.billing = [];
        MimarERP.billing.push(data);
        logAudit('CREATE', 'Billing', `إصدار مستخلص شهري جديد ${data.id}`);
        showToast('تم إصدار المستخلص بنجاح ✓');
      }
      saveToLocalStorage();
      renderBillingTable();
    }
  });
}

function deleteBillingIPC(ipcIdOrIdx) {
  const b = typeof ipcIdOrIdx === 'number'
    ? MimarERP.billing?.[ipcIdOrIdx]
    : MimarERP.billing?.find(x => x.id === ipcIdOrIdx);
  if (!b) return;
  confirmDelete(`هل تريد حذف المستخلص <strong>${b.id}</strong>؟`, () => {
    MimarERP.billing = MimarERP.billing.filter(x => x.id !== b.id);
    logAudit('DELETE', 'Billing', `حذف مستخلص ${b.id}`);
    saveToLocalStorage();
    renderBillingTable();
    showToast('تم حذف المستخلص ✓');
  });
}

// --- 4.16 QA/QC INSPECTIONS (WIR / MIR) ---
function openAddInspectionModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل طلب فحص الجودة' : 'إصدار طلب فحص جودة جديد (Work / Material Inspection)',
    icon: 'fa-certificate',
    record,
    fields: [
      { key: 'id', label: 'رقم طلب الفحص', required: true, default: 'WIR-0' + (((MimarERP.techOffice?.quality_inspections?.length) || 0) + 1) },
      { key: 'type', label: 'نوع الفحص', type: 'select', options: ['WIR فحص أعمال','MIR فحص مواد'], required: true },
      { key: 'activity', label: 'بيان الأعمال والمواد المطلوب فحصها', required: true, span2: true, placeholder: 'فحص واستلام حدادة سقف ملحق السطح' },
      { key: 'location', label: 'الموقع الدقيق في المشروع', required: true, placeholder: 'ملحق السطح - زون 2' },
      { key: 'boq_ref', label: 'رمز بند جدول الكميات المرتبط', default: 'BOQ-01' },
      { key: 'req_date', label: 'تاريخ طلب الفحص', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'result', label: 'النتيجة الفنية', default: 'مطابق للشروط والمواصفات' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['معتمد','مرفوض','معتمد بملاحظات','قيد الفحص'], default: 'معتمد' }
    ],
    onSave(data, rec) {
      if (!MimarERP.techOffice) MimarERP.techOffice = {};
      if (!MimarERP.techOffice.quality_inspections) MimarERP.techOffice.quality_inspections = [];

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'QA/QC', `تعديل طلب الفحص ${rec.id}`);
        showToast('تم تحديث طلب الفحص بنجاح ✓');
      } else {
        MimarERP.techOffice.quality_inspections.unshift(data);
        logAudit('CREATE', 'QA/QC', `إصدار طلب فحص جديد ${data.id}`);
        showToast('تم إصدار طلب الفحص بنجاح ✓');
      }
      saveToLocalStorage();
      renderInspectionsTable();
    }
  });
}

function deleteInspectionItem(inspIdOrIdx) {
  if (!MimarERP.techOffice?.quality_inspections) return;
  const list = MimarERP.techOffice.quality_inspections;
  const item = typeof inspIdOrIdx === 'number' ? list[inspIdOrIdx] : list.find(x => x.id === inspIdOrIdx);
  if (!item) return;
  confirmDelete(`حذف طلب الفحص <strong>${item.id}</strong>؟`, () => {
    MimarERP.techOffice.quality_inspections = list.filter(x => x.id !== item.id);
    logAudit('DELETE', 'QA/QC', `حذف طلب فحص ${item.id}`);
    saveToLocalStorage();
    renderInspectionsTable();
    showToast('تم حذف طلب الفحص ✓');
  });
}

// --- 4.17 DRAWINGS (Document Control) ---
function openAddDrawingModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل المخطط الهندسي' : 'إدراج لوحة ومخطط هندسي جديد (Engineering Drawing)',
    icon: 'fa-compass-drafting',
    record,
    fields: [
      { key: 'sheet_no', label: 'رقم اللوحة / المخطط', required: true, placeholder: 'A-501' },
      { key: 'title', label: 'عنوان وتفاصيل اللوحة', required: true, span2: true, placeholder: 'مخطط الواجهات المعمارية والتكسيات الخارجية' },
      { key: 'discipline', label: 'التخصص الهندسي', type: 'select', options: ['Architectural','Structural','MEP','Civil'], required: true, default: 'Architectural' },
      { key: 'rev', label: 'رقم المراجعة (Rev)', required: true, default: 'Rev 01' },
      { key: 'date', label: 'تاريخ الإصدار', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'status', label: 'حالة الاعتماد', type: 'select', options: ['صالح للتنفيذ IFC','مرجع تصميمي معتمد','قيد الاعتماد','ملغى ومستبدل'], default: 'صالح للتنفيذ IFC' }
    ],
    onSave(data, rec) {
      if (!MimarERP.techOffice) MimarERP.techOffice = {};
      if (!MimarERP.techOffice.drawings) MimarERP.techOffice.drawings = [];

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Drawing', `تعديل مخطط ${rec.sheet_no}`);
        showToast('تم تحديث المخطط بنجاح ✓');
      } else {
        data.id = data.sheet_no;
        MimarERP.techOffice.drawings.push(data);
        logAudit('CREATE', 'Drawing', `إدراج مخطط هندسي جديد ${data.sheet_no}`);
        showToast('تم إدراج المخطط بنجاح ✓');
      }
      saveToLocalStorage();
      renderDrawingsTable();
    }
  });
}

function deleteDrawingItem(sheetNoOrIdx) {
  if (!MimarERP.techOffice?.drawings) return;
  const list = MimarERP.techOffice.drawings;
  const dwg = typeof sheetNoOrIdx === 'number' ? list[sheetNoOrIdx] : list.find(x => (x.sheet_no === sheetNoOrIdx || x.id === sheetNoOrIdx));
  if (!dwg) return;
  confirmDelete(`حذف المخطط "<strong>${dwg.sheet_no || dwg.title}</strong>"؟`, () => {
    MimarERP.techOffice.drawings = list.filter(x => x !== dwg);
    logAudit('DELETE', 'Drawing', `حذف مخطط ${dwg.sheet_no}`);
    saveToLocalStorage();
    renderDrawingsTable();
    showToast('تم حذف المخطط ✓');
  });
}

// --- 4.18 SUBMITTALS ---
function openAddSubmittalModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل التقديم والاعتماد الهندسي' : 'تقديم اعتماد هندسي جديد (New Submittal)',
    icon: 'fa-file-circle-check',
    record,
    fields: [
      { key: 'id', label: 'رقم الاعتماد', required: true, default: 'SUB-2026-00' + ((MimarERP.submittalsList?.length || 0) + 1) },
      { key: 'title', label: 'عنوان وموضوع الاعتماد', required: true, span2: true, placeholder: 'مخططات ورشة حديد أعمدة ملحق السطح' },
      { key: 'type', label: 'نوع التقديم', type: 'select', options: ['Shop Drawings (مخططات تنفيذية)','Material Sample (عينة مواد)','Product Data (بيانات فنية)','Method Statement (طريقة تنفيذ)'], default: 'Shop Drawings (مخططات تنفيذية)' },
      { key: 'discipline', label: 'التخصص', type: 'select', options: ['إنشائي','معماري','ميكانيك','كهرباء','عوازل'], default: 'إنشائي' },
      { key: 'subcontractor', label: 'المقاول أو المورد المقدم', required: true, placeholder: 'شركة المقاولات الحديثة' },
      { key: 'consultant', label: 'المكتب الاستشاري', default: 'دار الهندسة للاستشارات' },
      { key: 'revision', label: 'المراجعة', default: 'Rev 0' },
      { key: 'status', label: 'حالة الاعتماد', type: 'select', options: ['معتمد (Code A)','معتمد بملاحظات (Code B)','مرفوض (Code C)','قيد المراجعة'], default: 'قيد المراجعة' },
      { key: 'notes', label: 'ملاحظات ومواصفات تفصيلية', type: 'textarea', span2: true, placeholder: 'أي تفاصيل مطابقة للكود والمواصفات...' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Submittal', `تعديل اعتماد ${rec.id} - ${rec.title}`);
        showToast('تم تحديث الاعتماد بنجاح ✓');
      } else {
        data.submitted_date = new Date().toISOString().slice(0, 10);
        data.action_code = data.status.includes('Code A') ? 'A' : (data.status.includes('Code B') ? 'B' : 'Under Review');
        if (!MimarERP.submittalsList) MimarERP.submittalsList = [];
        MimarERP.submittalsList.unshift(data);
        logAudit('CREATE', 'Submittal', `تسجيل اعتماد جديد ${data.id}`);
        showToast('تم تسجيل الاعتماد وإرساله للاستشاري بنجاح ✓');
      }
      saveToLocalStorage();
      renderSubmittals();
    }
  });
}

function deleteSubmittalItem(subId) {
  const item = MimarERP.submittalsList?.find(x => x.id === subId);
  if (!item) return;
  confirmDelete(`حذف الاعتماد الهندسي <strong>${subId}</strong>؟`, () => {
    MimarERP.submittalsList = MimarERP.submittalsList.filter(x => x.id !== subId);
    logAudit('DELETE', 'Submittal', `حذف اعتماد ${subId}`);
    saveToLocalStorage();
    renderSubmittals();
    showToast('تم حذف الاعتماد بنجاح ✓');
  });
}

// --- 4.19 VARIATIONS (Change Orders) ---
function openAddVariationModal(record = null) {
  const projOpts = (MimarERP.projects || []).map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل أمر التغيير والمطالبة' : 'إصدار طلب أمر تغيير جديد (Variation Request)',
    icon: 'fa-file-circle-exclamation',
    record,
    fields: [
      { key: 'co_id', label: 'رقم أمر التغيير', required: true, default: 'VO-2026-00' + ((MimarERP.variationsMaster?.length || 0) + 1) },
      { key: 'project_id', label: 'المشروع المرتبط', type: 'select', options: projOpts, required: true },
      { key: 'title', label: 'عنوان وموضوع التغيير', required: true, span2: true, placeholder: 'تعديل مواصفات العزل المائي أو إضافة غرفة كهرباء' },
      { key: 'scope_type', label: 'نوع التغيير (Scope Type)', type: 'select', options: ['إضافة نطاق أعمال (Scope Addition)','تعديل مواصفة (Spec Modification)','استبعاد بنود (Scope Deletion)'], default: 'إضافة نطاق أعمال (Scope Addition)' },
      { key: 'initiated_by', label: 'الجهة المبادرة بالطلب', type: 'select', options: ['المالك (Employer)','المقاول الرئيسي (Contractor)','الاستشاري المشرف (Engineer)'], default: 'المالك (Employer)' },
      { key: 'amount', label: 'الأثر المالي الصافي (SAR)', type: 'number', step: '1000', required: true, default: 50000 },
      { key: 'time_eot_days', label: 'تمديد الوقت المطلوب (أيام EOT)', type: 'number', required: true, default: 10 },
      { key: 'reason', label: 'السبب الهندسي والمسوغ التعاقدي (FIDIC)', type: 'textarea', span2: true, required: true, placeholder: 'بيان الأسباب والمخططات والمراسلات الداعمة...' },
      { key: 'status', label: 'حالة أمر التغيير', type: 'select', options: ['معتمد نهائياً','قيد المراجعة والتدقيق','مسودة','مرفوض'], default: 'قيد المراجعة والتدقيق' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Variation', `تعديل أمر التغيير ${rec.co_id}`);
        showToast('تم تحديث أمر التغيير بنجاح ✓');
      } else {
        data.date_issued = new Date().toISOString().slice(0, 10);
        data.consultant_approval = data.status.includes('معتمد') ? 'معتمد رسمياً' : 'قيد التدقيق';
        if (!MimarERP.variationsMaster) MimarERP.variationsMaster = [];
        MimarERP.variationsMaster.unshift(data);
        logAudit('CREATE', 'Variation', `إصدار طلب أمر تغيير جديد ${data.co_id}`);
        showToast('تم تسجيل أمر التغيير بنجاح ✓');
      }
      saveToLocalStorage();
      renderVariationsList();
    }
  });
}

function deleteVariationItem(voId) {
  const item = MimarERP.variationsMaster?.find(x => x.co_id === voId);
  if (!item) return;
  confirmDelete(`حذف أمر التغيير <strong>${voId}</strong>؟`, () => {
    MimarERP.variationsMaster = MimarERP.variationsMaster.filter(x => x.co_id !== voId);
    logAudit('DELETE', 'Variation', `حذف أمر تغيير ${voId}`);
    saveToLocalStorage();
    renderVariationsList();
    showToast('تم حذف أمر التغيير بنجاح ✓');
  });
}

// --- 4.20 CRM OPPORTUNITIES ---
function openAddCRMModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات الفرصة البيعية' : 'إضافة فرصة بيعية جديدة (CRM Opportunity)',
    icon: 'fa-funnel-dollar',
    record,
    fields: [
      { key: 'opp_id', label: 'كود الفرصة', required: true, default: 'OPP-0' + ((MimarERP.crmOpportunities?.length || 0) + 1) },
      { key: 'client_name', label: 'اسم العميل / الجهة', required: true, placeholder: 'مجموعة الفنادق العالمية' },
      { key: 'project_name', label: 'اسم المشروع والفرصة', required: true, span2: true, placeholder: 'أعمال تأهيل وتشطيب منتجع شاطئي' },
      { key: 'estimated_value', label: 'القيمة التقديرية (SAR)', type: 'number', required: true, default: 2500000 },
      { key: 'stage', label: 'المرحلة البيعية', type: 'select', options: ['عميل محتمل','تأهيل','عرض','تفاوض','إغلاق','خسارة'], default: 'عرض' },
      { key: 'win_probability', label: 'احتمالية الفوز %', type: 'number', min: 0, max: 100, default: 60 },
      { key: 'owner', label: 'مسؤول المبيعات', required: true, placeholder: 'م. خالد السعدي' },
      { key: 'expected_close', label: 'تاريخ الإغلاق المتوقع', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'status', label: 'الحالة', type: 'select', options: ['نشط','مؤجل','مغلق'], default: 'نشط' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'CRM', `تعديل فرصة CRM ${rec.opp_id} - ${rec.project_name}`);
        showToast('تم تحديث الفرصة بنجاح ✓');
      } else {
        if (!MimarERP.crmOpportunities) MimarERP.crmOpportunities = [];
        MimarERP.crmOpportunities.unshift(data);
        logAudit('CREATE', 'CRM', `إضافة فرصة CRM جديدة ${data.opp_id}`);
        showToast('تمت إضافة الفرصة بنجاح ✓');
      }
      saveToLocalStorage();
      renderCRMTable();
    }
  });
}

function deleteCRMOpp(oppId) {
  const item = MimarERP.crmOpportunities?.find(x => x.opp_id === oppId);
  if (!item) return;
  confirmDelete(`حذف الفرصة البيعية "<strong>${item.project_name}</strong>" (${oppId})؟`, () => {
    MimarERP.crmOpportunities = MimarERP.crmOpportunities.filter(x => x.opp_id !== oppId);
    logAudit('DELETE', 'CRM', `حذف فرصة ${oppId}`);
    saveToLocalStorage();
    renderCRMTable();
    showToast('تم حذف الفرصة بنجاح ✓');
  });
}

// --- 4.21 TENDERS ---
function openAddTenderModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات المناقصة' : 'تسجيل مناقصة وعطاء جديد (Tenders & Bidding)',
    icon: 'fa-gavel',
    record,
    fields: [
      { key: 'tender_id', label: 'رقم المناقصة', required: true, default: 'TND-2026-0' + ((MimarERP.tendersMaster?.length || 0) + 1) },
      { key: 'project_name', label: 'اسم المشروع والمناقصة', required: true, span2: true, placeholder: 'مشروع مجمع المكاتب الإدارية' },
      { key: 'owner', label: 'الجهة المالكة / الطارحة', required: true, placeholder: 'صندوق الاستثمارات / هيئة تطوير الرياض' },
      { key: 'contract_type', label: 'نوع العقد', type: 'select', options: ['مقطوعية Lump Sum','تسعير وحدات Unit Rate','تصميم وبناء Design & Build','EPC تسليم مفتاح'], default: 'مقطوعية Lump Sum' },
      { key: 'bid_value', label: 'قيمة العطاء المقدم (SAR)', type: 'number', required: true, default: 12500000 },
      { key: 'deadline', label: 'الموعد النهائي لتقديم العطاء', type: 'date', required: true },
      { key: 'status', label: 'حالة المناقصة', type: 'select', options: ['قيد التجهيز والتسعير','تم تقديم العطاء','قيد التقييم الفني','مسودة'], default: 'تم تقديم العطاء' },
      { key: 'award_result', label: 'نتيجة الترسية', type: 'select', options: ['قيد الانتظار','فوز بالترسية','استبعاد','لم يتم الترسية'], default: 'قيد الانتظار' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Tender', `تعديل مناقصة ${rec.tender_id}`);
        showToast('تم تحديث المناقصة بنجاح ✓');
      } else {
        if (!MimarERP.tendersMaster) MimarERP.tendersMaster = [];
        MimarERP.tendersMaster.unshift(data);
        logAudit('CREATE', 'Tender', `تسجيل مناقصة جديدة ${data.tender_id}`);
        showToast('تم تسجيل المناقصة بنجاح ✓');
      }
      saveToLocalStorage();
      renderTendersTable();
    }
  });
}

function deleteTender(tenderId) {
  const item = MimarERP.tendersMaster?.find(x => x.tender_id === tenderId);
  if (!item) return;
  confirmDelete(`حذف المناقصة "<strong>${item.project_name}</strong>" (${tenderId})؟`, () => {
    MimarERP.tendersMaster = MimarERP.tendersMaster.filter(x => x.tender_id !== tenderId);
    logAudit('DELETE', 'Tender', `حذف مناقصة ${tenderId}`);
    saveToLocalStorage();
    renderTendersTable();
    showToast('تم حذف المناقصة ✓');
  });
}

// --- 4.22 HR EMPLOYEES ---
function openAddEmployeeModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات الموظف' : 'تسجيل موظف جديد (HR Employee)',
    icon: 'fa-user-tie',
    record,
    fields: [
      { key: 'emp_id', label: 'الرقم الوظيفي', required: true, default: 'EMP-10' + ((MimarERP.hrEmployees?.length || 0) + 1) },
      { key: 'name', label: 'اسم الموظف بالكامل', required: true, placeholder: 'م. أحمد خالد عبد الله' },
      { key: 'title', label: 'المسمى الوظيفي', required: true, placeholder: 'مهندس موقع أول / مدير مشروع' },
      { key: 'department', label: 'القسم', type: 'select', options: ['الإدارة الهندسية','إدارة المشاريع','الشؤون المالية','المشتريات والمستودعات','السلامة والجودة','الموارد البشرية'], default: 'الإدارة الهندسية' },
      { key: 'project', label: 'المشروع المعين به', required: true, placeholder: 'برج الأعمال الفندقي' },
      { key: 'contract_type', label: 'نوع العقد', type: 'select', options: ['دوام كامل','عقد محدد المدة','استشاري'], default: 'دوام كامل' },
      { key: 'hire_date', label: 'تاريخ التعيين', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'contract_end', label: 'تاريخ انتهاء العقد', type: 'date' },
      { key: 'basic_salary', label: 'الراتب الأساسي (SAR)', type: 'number', required: true, default: 12000 },
      { key: 'status', label: 'الحالة', type: 'select', options: ['على رأس العمل','في إجازة','منتهي خدماته'], default: 'على رأس العمل' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'HR', `تعديل بيانات الموظف ${rec.name} (${rec.emp_id})`);
        showToast('تم تعديل بيانات الموظف بنجاح ✓');
      } else {
        if (!MimarERP.hrEmployees) MimarERP.hrEmployees = [];
        MimarERP.hrEmployees.push(data);
        logAudit('CREATE', 'HR', `إضافة موظف جديد ${data.name} (${data.emp_id})`);
        showToast('تمت إضافة الموظف بنجاح ✓');
      }
      saveToLocalStorage();
      renderHRTable();
    }
  });
}

function deleteEmployee(empId) {
  const e = MimarERP.hrEmployees?.find(x => x.emp_id === empId);
  if (!e) return;
  confirmDelete(`حذف سجل الموظف "<strong>${e.name}</strong>" (${empId})؟`, () => {
    MimarERP.hrEmployees = MimarERP.hrEmployees.filter(x => x.emp_id !== empId);
    logAudit('DELETE', 'HR', `حذف سجل الموظف ${e.name} (${empId})`);
    saveToLocalStorage();
    renderHRTable();
    showToast('تم حذف سجل الموظف ✓');
  });
}

// --- 4.23 PAYROLL ---
function openAddPayrollModal(record = null) {
  const empOpts = (MimarERP.hrEmployees || []).map(e => e.name);
  showCrudModal({
    title: record ? 'تعديل مسير الراتب' : 'صرف راتب جديد لموظف (Payroll)',
    icon: 'fa-money-bill-wave',
    record,
    fields: [
      { key: 'name', label: 'اسم الموظف', type: 'select', options: empOpts.length ? empOpts : ['م. أحمد خالد عبد الله'], required: true },
      { key: 'department', label: 'القسم', required: true, default: 'الإدارة الهندسية' },
      { key: 'basic_salary', label: 'الراتب الأساسي (SAR)', type: 'number', required: true, default: 12000 },
      { key: 'housing', label: 'بدل السكن (SAR)', type: 'number', default: 3000 },
      { key: 'transport', label: 'بدل المواصلات (SAR)', type: 'number', default: 1200 },
      { key: 'performance', label: 'بدل الأداء والحوافز (SAR)', type: 'number', default: 1000 },
      { key: 'deductions', label: 'الاستقطاعات والتأمينات (SAR)', type: 'number', default: 1170 },
      { key: 'payroll_status', label: 'حالة الصرف', type: 'select', options: ['معتمد ومحول للبنك','قيد التدقيق والمراجعة','معلق'], default: 'معتمد ومحول للبنك' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Payroll', `تعديل مسير راتب ${rec.name}`);
        showToast('تم تعديل سجل الراتب بنجاح ✓');
      } else {
        if (!MimarERP.payrollRecords) MimarERP.payrollRecords = [];
        MimarERP.payrollRecords.push(data);
        logAudit('CREATE', 'Payroll', `صرف راتب جديد لموظف ${data.name}`);
        showToast('تم اعتماد مسير الراتب بنجاح ✓');
      }
      saveToLocalStorage();
      renderPayrollTable();
    }
  });
}

function deletePayroll(empName) {
  const item = MimarERP.payrollRecords?.find(x => x.name === empName);
  if (!item) return;
  confirmDelete(`حذف مسير راتب الموظف "<strong>${empName}</strong>"؟`, () => {
    MimarERP.payrollRecords = MimarERP.payrollRecords.filter(x => x.name !== empName);
    logAudit('DELETE', 'Payroll', `حذف مسير راتب ${empName}`);
    saveToLocalStorage();
    renderPayrollTable();
    showToast('تم حذف قيد الراتب ✓');
  });
}

// --- 4.24 EQUIPMENT (Fleet) ---
function openAddEquipmentModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل سجل المعدة' : 'إضافة معدة للأسطول الميكانيكي (Fleet Register)',
    icon: 'fa-truck',
    record,
    fields: [
      { key: 'equip_id', label: 'كود المعدة', required: true, default: 'EQP-0' + ((MimarERP.equipmentMaster?.length || 0) + 1) },
      { key: 'name', label: 'اسم وتوصيف المعدة', required: true, placeholder: 'رافعة برجية Liebherr 12 طن' },
      { key: 'type', label: 'نوع المعدة', type: 'select', options: ['ثقيلة','شاحنات ونقل','خرسانة وخلط','رفع وتحميل','حفر وتسويه'], default: 'رفع وتحميل', required: true },
      { key: 'model', label: 'الموديل وسنة الصنع', required: true, placeholder: '2023 - 280 EC-H' },
      { key: 'project', label: 'المشروع المخصصة له', required: true, placeholder: 'برج الأعمال الفندقي' },
      { key: 'operating_hours', label: 'ساعات التشغيل', type: 'number', default: 1200 },
      { key: 'maintenance_hours', label: 'ساعات الصيانة', type: 'number', default: 80 },
      { key: 'daily_cost', label: 'التكلفة اليومية التشغيلية (SAR)', type: 'number', required: true, default: 850 },
      { key: 'status', label: 'الحالة التشغيلية', type: 'select', options: ['تعمل بالموقع','في الصيانة','متوقفة وجاهزة','مؤجرة'], default: 'تعمل بالموقع' },
      { key: 'next_maintenance', label: 'موعد الصيانة القادمة', type: 'date' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Equipment', `تعديل سجل المعدة ${rec.name} (${rec.equip_id})`);
        showToast('تم تعديل سجل المعدة بنجاح ✓');
      } else {
        if (!MimarERP.equipmentMaster) MimarERP.equipmentMaster = [];
        MimarERP.equipmentMaster.push(data);
        logAudit('CREATE', 'Equipment', `إضافة معدة جديدة ${data.name} (${data.equip_id})`);
        showToast('تمت إضافة المعدة للأسطول بنجاح ✓');
      }
      saveToLocalStorage();
      renderEquipmentTable();
    }
  });
}

function deleteEquipment(equipId) {
  const eq = MimarERP.equipmentMaster?.find(x => x.equip_id === equipId);
  if (!eq) return;
  confirmDelete(`حذف سجل المعدة "<strong>${eq.name}</strong>" (${equipId})؟`, () => {
    MimarERP.equipmentMaster = MimarERP.equipmentMaster.filter(x => x.equip_id !== equipId);
    logAudit('DELETE', 'Equipment', `حذف معدة ${eq.name} (${equipId})`);
    saveToLocalStorage();
    renderEquipmentTable();
    showToast('تم حذف سجل المعدة ✓');
  });
}

// --- 4.25 COST CONTROL ---
function openAddCostControlModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل قيد مراقبة التكلفة' : 'إضافة قيد مراقبة تكلفة وتحليل انحراف (Cost Control Line)',
    icon: 'fa-chart-pie',
    record,
    fields: [
      { key: 'wbs_code', label: 'كود حزمة العمل WBS', required: true, default: 'WBS-09' },
      { key: 'description', label: 'وصف حزمة الأعمال', required: true, span2: true, placeholder: 'أعمال تكسيات الواجهات الخارجية' },
      { key: 'bac', label: 'الميزانية عند الاكتمال BAC (SAR)', type: 'number', required: true, default: 850000 },
      { key: 'pv', label: 'القيمة المخططة PV (SAR)', type: 'number', required: true, default: 600000 },
      { key: 'ev', label: 'القيمة المكتسبة EV (SAR)', type: 'number', required: true, default: 580000 },
      { key: 'ac', label: 'التكلفة الفعلية المنصرفة AC (SAR)', type: 'number', required: true, default: 590000 }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'CostControl', `تعديل قيد تكلفة ${rec.wbs_code}`);
        showToast('تم تعديل قيد التكلفة بنجاح ✓');
      } else {
        if (!MimarERP.costControlRegister) MimarERP.costControlRegister = [];
        MimarERP.costControlRegister.push(data);
        logAudit('CREATE', 'CostControl', `إضافة قيد تكلفة جديد ${data.wbs_code}`);
        showToast('تمت إضافة قيد التكلفة بنجاح ✓');
      }
      saveToLocalStorage();
      renderCostControlTable();
    }
  });
}

function deleteCostControl(wbsCode) {
  const item = MimarERP.costControlRegister?.find(x => x.wbs_code === wbsCode);
  if (!item) return;
  confirmDelete(`حذف قيد التكلفة للحزمة "<strong>${wbsCode}</strong> - ${item.description}"؟`, () => {
    MimarERP.costControlRegister = MimarERP.costControlRegister.filter(x => x.wbs_code !== wbsCode);
    logAudit('DELETE', 'CostControl', `حذف قيد تكلفة ${wbsCode}`);
    saveToLocalStorage();
    renderCostControlTable();
    showToast('تم حذف قيد التكلفة ✓');
  });
}

// --- 4.26 FINANCE BILLINGS & AP ---
function openAddFinanceBillingModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل المستخلص المالي' : 'تسجيل مستخلص مالي وارد جديد (Finance Billing)',
    icon: 'fa-file-invoice',
    record,
    fields: [
      { key: 'billing_id', label: 'رقم المستخلص المالي', required: true, default: 'FIN-IPC-0' + ((MimarERP.financeBillings?.length || 0) + 1) },
      { key: 'project', label: 'المشروع', required: true, default: 'برج الأعمال الفندقي' },
      { key: 'owner', label: 'الجهة المالكة', required: true, default: 'شركة إينوفست العقارية' },
      { key: 'amount', label: 'قيمة المستخلص (SAR)', type: 'number', required: true, default: 450000 },
      { key: 'submission_date', label: 'تاريخ التقديم', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'approval_date', label: 'تاريخ الاعتماد', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['معتمد','قيد التدقيق','مسودة'], default: 'معتمد' },
      { key: 'collected', label: 'المبلغ المحصل فعلياً (SAR)', type: 'number', default: 450000 }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Finance', `تعديل مستخلص مالي ${rec.billing_id}`);
        showToast('تم تحديث المستخلص المالي بنجاح ✓');
      } else {
        if (!MimarERP.financeBillings) MimarERP.financeBillings = [];
        MimarERP.financeBillings.unshift(data);
        logAudit('CREATE', 'Finance', `تسجيل مستخلص مالي جديد ${data.billing_id}`);
        showToast('تم تسجيل المستخلص المالي بنجاح ✓');
      }
      saveToLocalStorage();
      renderFinanceTabs();
    }
  });
}

function deleteFinanceBilling(billingId) {
  const item = MimarERP.financeBillings?.find(x => x.billing_id === billingId);
  if (!item) return;
  confirmDelete(`حذف المستخلص المالي <strong>${billingId}</strong>؟`, () => {
    MimarERP.financeBillings = MimarERP.financeBillings.filter(x => x.billing_id !== billingId);
    logAudit('DELETE', 'Finance', `حذف مستخلص مالي ${billingId}`);
    saveToLocalStorage();
    renderFinanceTabs();
    showToast('تم حذف المستخلص المالي ✓');
  });
}

function openAddFinanceAPModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل فاتورة المورد (ذمة دائنة)' : 'تسجيل فاتورة مورد / مقاول باطن جديدة (Accounts Payable)',
    icon: 'fa-receipt',
    record,
    fields: [
      { key: 'invoice_id', label: 'رقم الفاتورة', required: true, default: 'INV-2026-0' + ((MimarERP.financeAP?.length || 0) + 1) },
      { key: 'supplier', label: 'اسم المورد أو مقاول الباطن', required: true, placeholder: 'شركة أسمنت ينبع والمدينة' },
      { key: 'amount', label: 'المبلغ المستحق (SAR)', type: 'number', required: true, default: 85000 },
      { key: 'due_date', label: 'تاريخ الاستحقاق', type: 'date', required: true },
      { key: 'status', label: 'حالة السداد', type: 'select', options: ['مستحق السداد','مسدد بالكامل','معلق للمطابقة'], default: 'مستحق السداد' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Finance', `تعديل فاتورة AP ${rec.invoice_id}`);
        showToast('تم تحديث الفاتورة بنجاح ✓');
      } else {
        if (!MimarERP.financeAP) MimarERP.financeAP = [];
        MimarERP.financeAP.unshift(data);
        logAudit('CREATE', 'Finance', `تسجيل فاتورة AP جديدة ${data.invoice_id}`);
        showToast('تم تسجيل الفاتورة بنجاح ✓');
      }
      saveToLocalStorage();
      renderFinanceTabs();
    }
  });
}

function deleteFinanceAP(invoiceId) {
  const item = MimarERP.financeAP?.find(x => x.invoice_id === invoiceId);
  if (!item) return;
  confirmDelete(`حذف الفاتورة <strong>${invoiceId}</strong>؟`, () => {
    MimarERP.financeAP = MimarERP.financeAP.filter(x => x.invoice_id !== invoiceId);
    logAudit('DELETE', 'Finance', `حذف فاتورة ${invoiceId}`);
    saveToLocalStorage();
    renderFinanceTabs();
    showToast('تم حذف الفاتورة ✓');
  });
}

// --- 4.27 CDE DOCUMENTS ---
function openAddCDEModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات وثيقة CDE' : 'رفع وتسجيل وثيقة جديدة في بيئة البيانات المشتركة (ISO 19650 CDE)',
    icon: 'fa-cloud-arrow-up',
    record,
    fields: [
      { key: 'doc_number', label: 'رقم الوثيقة القياسي', required: true, default: 'PRJ-CDE-00' + ((MimarERP.cdeContainersMaster?.length || 0) + 1) },
      { key: 'title', label: 'عنوان وتوصيف الوثيقة', required: true, span2: true, placeholder: 'مخطط التنسيق المكاني والمسارات الإنشائية' },
      { key: 'discipline', label: 'التخصص', type: 'select', options: ['General','Architectural','Structural','MEP','Civil','Project Management'], default: 'Structural', required: true },
      { key: 'revision', label: 'المراجعة (Revision)', required: true, default: 'P01' },
      { key: 'iso_status', label: 'حالة ISO 19650', type: 'select', options: ['WIP (قيد العمل)','SHARED (مشتركة)','PUBLISHED (منشورة ومعتمدة)','ARCHIVED (مؤرشفة)'], default: 'WIP (قيد العمل)' },
      { key: 'suitability', label: 'كود الملاءمة', type: 'select', options: ['S0 - للتدقيق والتنسيق','S1 - للتسعير','S2 - للمعلومات','S3 - للمراجعة والتعليق','S4 - للاعتماد','D4 - للعمليات والصيانة'], default: 'S0 - للتدقيق والتنسيق' },
      { key: 'author', label: 'المؤلف / المسؤول', required: true, placeholder: 'م. أحمد العتيبي' },
      { key: 'date', label: 'تاريخ الوثيقة', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'CDE', `تعديل وثيقة CDE ${rec.doc_number}`);
        showToast('تم تحديث بيانات الوثيقة بنجاح ✓');
      } else {
        data.classification = data.classification || 'Pr_20_85';
        if (!MimarERP.cdeContainersMaster) MimarERP.cdeContainersMaster = [];
        MimarERP.cdeContainersMaster.unshift(data);
        logAudit('CREATE', 'CDE', `رفع وثيقة CDE جديدة ${data.doc_number}`);
        showToast('تم رفع وتسجيل الوثيقة بنجاح ✓');
      }
      saveToLocalStorage();
      renderCDEContainers();
    }
  });
}

function deleteCDEDocument(docNumber) {
  const item = MimarERP.cdeContainersMaster?.find(x => x.doc_number === docNumber || x.docNumber === docNumber);
  if (!item) return;
  const no = item.doc_number || item.docNumber;
  confirmDelete(`حذف الوثيقة <strong>${no}</strong> من بيئة البيانات المشتركة؟`, () => {
    MimarERP.cdeContainersMaster = MimarERP.cdeContainersMaster.filter(x => x !== item);
    logAudit('DELETE', 'CDE', `حذف وثيقة CDE ${no}`);
    saveToLocalStorage();
    renderCDEContainers();
    showToast('تم حذف الوثيقة بنجاح ✓');
  });
}

// --- 4.28 SAFETY INCIDENTS ---
function openAddSafetyModal(record = null) {
  const projOpts = (MimarERP.projects || []).map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل سجل السلامة والصحة المهنية' : 'تسجيل حادثة / ملاحظة سلامة مهنية جديدة (HSE Incident)',
    icon: 'fa-shield-halved',
    record,
    fields: [
      { key: 'id', label: 'رقم الحادثة / الملاحظة', required: true, default: 'INC-2026-00' + ((MimarERP.safetyIncidents?.length || 0) + 1) },
      { key: 'date', label: 'تاريخ الواقعة', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { key: 'projectId', label: 'المشروع', type: 'select', options: projOpts, required: true },
      { key: 'type', label: 'نوع الواقعة', type: 'select', options: ['Near Miss (حادثة وشيكة)','First Aid (إسعافات أولية)','LTI (إصابة مهدرة للوقت)','Environmental (بيئية)','Observation (ملاحظة سلامة)'], default: 'Observation (ملاحظة سلامة)', required: true },
      { key: 'description', label: 'وصف الحادثة أو الملاحظة بالتفصيل', type: 'textarea', span2: true, required: true, placeholder: 'وصف دقيق للموقف وموقعه في المشروع...' },
      { key: 'lti', label: 'أيام الغياب المهدرة (LTI Days)', type: 'number', min: 0, default: 0 },
      { key: 'action', label: 'الإجراء التصحيحي الفوري المتخذ', type: 'textarea', span2: true, required: true, placeholder: 'الإجراء المتخذ لمنع تكرار الواقعة...' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['Open (مفتوح)','Closed (مغلق ومعالج)','Under Investigation (قيد التحقيق)'], default: 'Closed (مغلق ومعالج)' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'HSE', `تعديل سجل السلامة ${rec.id}`);
        showToast('تم تحديث سجل السلامة بنجاح ✓');
      } else {
        if (!MimarERP.safetyIncidents) MimarERP.safetyIncidents = [];
        MimarERP.safetyIncidents.unshift(data);
        logAudit('CREATE', 'HSE', `تسجيل واقعة سلامة جديدة ${data.id}`);
        showToast('تم تسجيل واقعة السلامة بنجاح ✓');
      }
      saveToLocalStorage();
      renderSafetyDashboard();
    }
  });
}

function deleteSafetyIncident(incId) {
  const item = MimarERP.safetyIncidents?.find(x => x.id === incId);
  if (!item) return;
  confirmDelete(`حذف سجل الحادثة <strong>${incId}</strong>؟`, () => {
    MimarERP.safetyIncidents = MimarERP.safetyIncidents.filter(x => x.id !== incId);
    logAudit('DELETE', 'HSE', `حذف سجل سلامة ${incId}`);
    saveToLocalStorage();
    renderSafetyDashboard();
    showToast('تم حذف سجل السلامة ✓');
  });
}

// --- 4.29 CONTRACTORS MATRIX & UNIT RATES ---
function openAddContractorMasterModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات المقاول' : 'إضافة مقاول باطن جديد لدليل المقاولين (Contractor Master)',
    icon: 'fa-user-gear',
    record,
    fields: [
      { key: 'contractor_id', label: 'كود المقاول', required: true, default: 'CON-0' + ((MimarERP.contractorsMaster?.length || 0) + 1) },
      { key: 'contractor_name', label: 'اسم المقاول التجاري', required: true, placeholder: 'شركة الإنجاز للهياكل الإنشائية' },
      { key: 'specialty', label: 'التخصص الدقيق', required: true, placeholder: 'خرسانات وهياكل إنشائية / لياسة ومحارة' },
      { key: 'total_crew', label: 'إجمالي الطاقم والعمالة', type: 'number', required: true, default: 35 },
      { key: 'city', label: 'المدينة', required: true, placeholder: 'الرياض' },
      { key: 'contact_person', label: 'مسؤول الاتصال', required: true, placeholder: 'م. خالد - 055XXXXXXX' },
      { key: 'rating', label: 'التقييم الفني (من 5)', type: 'number', step: '0.1', default: 4.8 },
      { key: 'speed_rating', label: 'معدل سرعة التنفيذ', default: 'سريع جداً / متقدم' },
      { key: 'prev_projects', label: 'سابقة المشاريع المنجزة', placeholder: 'برج النخيل، مجمع الروابي' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['معتمد نشط','قيد التدقيق','غير متاح'], default: 'معتمد نشط' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Contractors', `تعديل مقاول ${rec.contractor_name}`);
        showToast('تم تعديل بيانات المقاول بنجاح ✓');
      } else {
        if (!MimarERP.contractorsMaster) MimarERP.contractorsMaster = [];
        MimarERP.contractorsMaster.push(data);
        logAudit('CREATE', 'Contractors', `إضافة مقاول جديد ${data.contractor_name}`);
        showToast('تمت إضافة المقاول بنجاح ✓');
      }
      saveToLocalStorage();
      renderContractorsMatrixTable();
    }
  });
}

function deleteContractorMaster(conId) {
  const item = MimarERP.contractorsMaster?.find(x => x.contractor_id === conId);
  if (!item) return;
  confirmDelete(`حذف المقاول "<strong>${item.contractor_name}</strong>" (${conId})؟`, () => {
    MimarERP.contractorsMaster = MimarERP.contractorsMaster.filter(x => x.contractor_id !== conId);
    logAudit('DELETE', 'Contractors', `حذف مقاول ${conId}`);
    saveToLocalStorage();
    renderContractorsMatrixTable();
    showToast('تم حذف المقاول ✓');
  });
}

function openAddContractorRateModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل سعر المصنعية' : 'إضافة سعر مصنعية ومعدل إنتاج جديد (Subcontract Activity Rate)',
    icon: 'fa-calculator',
    record,
    fields: [
      { key: 'rate_id', label: 'كود التسعير', required: true, default: 'CR-0' + ((MimarERP.contractorRatesMaster?.length || 0) + 1) },
      { key: 'contractor_name', label: 'المقاول المنفذ', required: true, placeholder: 'شركة الإنجاز للمصنعيات' },
      { key: 'specialty', label: 'التخصص', required: true, placeholder: 'لياسة / مباني / دهانات' },
      { key: 'activity_desc', label: 'توصيف النشاط والمصنعية', required: true, span2: true, placeholder: 'لياسة حوائط داخلية بؤج وأوتار سمك 2 سم' },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['م²','م³','م.ط','طن','عدد','مقطوعية'], default: 'م²', required: true },
      { key: 'unit_rate', label: 'سعر المتر / البند (SAR)', type: 'number', step: '0.01', required: true, default: 22 },
      { key: 'daily_production', label: 'معدل الإنتاج اليومي المتوقع', required: true, default: '80 م² / طاقم' },
      { key: 'waste_resp', label: 'مسؤولية الهالك', default: 'على المقاول' },
      { key: 'safety_comp', label: 'الالتزام بالسلامة', default: 'مطابق 100%' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['ساري ومعتمد','قيد التفاوض','ملغى'], default: 'ساري ومعتمد' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'ContractorRates', `تعديل سعر مصنعية ${rec.rate_id}`);
        showToast('تم تحديث سعر المصنعية بنجاح ✓');
      } else {
        if (!MimarERP.contractorRatesMaster) MimarERP.contractorRatesMaster = [];
        MimarERP.contractorRatesMaster.push(data);
        logAudit('CREATE', 'ContractorRates', `إضافة سعر مصنعية جديد ${data.rate_id}`);
        showToast('تمت إضافة سعر المصنعية بنجاح ✓');
      }
      saveToLocalStorage();
      renderContractorsMatrixTable();
    }
  });
}

function deleteContractorRate(rateId) {
  const item = MimarERP.contractorRatesMaster?.find(x => x.rate_id === rateId);
  if (!item) return;
  confirmDelete(`حذف سعر المصنعية "<strong>${item.activity_desc}</strong>" (${rateId})؟`, () => {
    MimarERP.contractorRatesMaster = MimarERP.contractorRatesMaster.filter(x => x.rate_id !== rateId);
    logAudit('DELETE', 'ContractorRates', `حذف سعر مصنعية ${rateId}`);
    saveToLocalStorage();
    renderContractorsMatrixTable();
    showToast('تم حذف سعر المصنعية ✓');
  });
}

// --- 4.30 REBAR BBS ---
function openAddRebarBBSModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بند تفريد حديد التسليح' : 'إضافة سيخ تفريد حديد تسليح جديد (Bar Bending Schedule)',
    icon: 'fa-bars',
    record,
    fields: [
      { key: 'member', label: 'العنصر الإنشائي', required: true, placeholder: 'أعمدة الدور الأرضي C1' },
      { key: 'bar_mark', label: 'كود السيخ (Bar Mark)', required: true, default: 'B-0' + ((MimarERP.rebarBBSItems?.length || 0) + 1) },
      { key: 'shape_code', label: 'كود الشكل (BS 8666)', required: true, default: '00 (مستقيم)' },
      { key: 'diameter', label: 'القطر (مم)', type: 'select', options: ['8','10','12','14','16','18','20','22','25','28','32'], default: '16', required: true },
      { key: 'num_elements', label: 'عدد العناصر الإنشائية', type: 'number', required: true, default: 12 },
      { key: 'bars_per_element', label: 'عدد الأسياخ في كل عنصر', type: 'number', required: true, default: 8 },
      { key: 'cut_length', label: 'طول القطعية (م)', type: 'number', step: '0.01', required: true, default: 4.2 },
      { key: 'unit_weight', label: 'وزن المتر الطولي (كجم/م)', type: 'number', step: '0.001', required: true, default: 1.578 }
    ],
    onSave(data, rec) {
      // OpenConstructionERP BS 8666 exact formula: w = d^2 / 162
      if (window.RebarEngine && window.RebarEngine.calculateRebarUnitWeight) {
        data.unit_weight = window.RebarEngine.calculateRebarUnitWeight(data.diameter);
      }
      data.total_bars = (Number(data.num_elements) || 1) * (Number(data.bars_per_element) || 1);
      data.total_length = data.total_bars * (Number(data.cut_length) || 1);
      data.total_weight_kg = Number((data.total_length * (Number(data.unit_weight) || 1)).toFixed(2));

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'Rebar', `تعديل سيخ تفريد ${rec.bar_mark}`);
        showToast('تم تحديث بند التفريد بنجاح ✓');
      } else {
        if (!MimarERP.rebarBBSItems) MimarERP.rebarBBSItems = [];
        MimarERP.rebarBBSItems.push(data);
        logAudit('CREATE', 'Rebar', `إضافة سيخ تفريد جديد ${data.bar_mark}`);
        showToast('تمت إضافة بند التفريد بنجاح ✓');
      }
      saveToLocalStorage();
      renderRebarBBS();
    }
  });
}

function deleteRebarBBSItem(barMark) {
  const item = MimarERP.rebarBBSItems?.find(x => x.bar_mark === barMark);
  if (!item) return;
  confirmDelete(`حذف بند التفريد "<strong>${barMark}</strong>"؟`, () => {
    MimarERP.rebarBBSItems = MimarERP.rebarBBSItems.filter(x => x.bar_mark !== barMark);
    logAudit('DELETE', 'Rebar', `حذف سيخ تفريد ${barMark}`);
    saveToLocalStorage();
    renderRebarBBS();
    showToast('تم حذف بند التفريد ✓');
  });
}

// --- 4.31 BIM CLASHES ---
function openAddClashModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات التعارض' : 'تسجيل تعارض هندسي جديد (BIM Clash Detection)',
    icon: 'fa-radar',
    record,
    fields: [
      { key: 'clash_id', label: 'كود التعارض', required: true, default: 'CLS-00' + ((MimarERP.bimClashesMaster?.length || 0) + 1) },
      { key: 'item_a', label: 'العنصر الأول', required: true, placeholder: 'مجرى تكييف رئيسي HVAC 600x400' },
      { key: 'discipline_a', label: 'تخصص العنصر الأول', type: 'select', options: ['MEP','Structural','Architectural','Civil'], default: 'MEP' },
      { key: 'item_b', label: 'العنصر الثاني', required: true, placeholder: 'جسر خرساني ساقط B24' },
      { key: 'discipline_b', label: 'تخصص العنصر الثاني', type: 'select', options: ['Structural','MEP','Architectural','Civil'], default: 'Structural' },
      { key: 'clash_type', label: 'نوع التعارض', type: 'select', options: ['Hard Clash (تداخل مادي صلب)','Clearance (حرم فراغي)','Soft Clash'], default: 'Hard Clash (تداخل مادي صلب)' },
      { key: 'overlap_distance', label: 'مسافة التداخل (سم)', placeholder: '15 سم' },
      { key: 'location', label: 'الموقع في المشروع', required: true, placeholder: 'سقف الدور الأول - زون 2' },
      { key: 'severity', label: 'درجة الخطورة', type: 'select', options: ['Critical (حرج)','Major (رئيسي)','Minor (بسيط)'], default: 'Critical (حرج)' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['Active','Resolved','Reviewed'], default: 'Active' },
      { key: 'resolution', label: 'مقترح الحل الهندسي', type: 'textarea', span2: true, placeholder: 'تخفيض مجرى التكييف بمقدار 20 سم أو فتح sleeve بالجسر...' }
    ],
    onSave(data, rec) {
      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'BIM', `تعديل تعارض ${rec.clash_id}`);
        showToast('تم تحديث التعارض بنجاح ✓');
      } else {
        if (!MimarERP.bimClashesMaster) MimarERP.bimClashesMaster = [];
        MimarERP.bimClashesMaster.unshift(data);
        logAudit('CREATE', 'BIM', `تسجيل تعارض BIM جديد ${data.clash_id}`);
        showToast('تم تسجيل التعارض بنجاح ✓');
      }
      saveToLocalStorage();
      renderClashList();
    }
  });
}

function deleteClashItem(clashId) {
  const item = MimarERP.bimClashesMaster?.find(x => x.clash_id === clashId);
  if (!item) return;
  confirmDelete(`حذف التعارض <strong>${clashId}</strong>؟`, () => {
    MimarERP.bimClashesMaster = MimarERP.bimClashesMaster.filter(x => x.clash_id !== clashId);
    logAudit('DELETE', 'BIM', `حذف تعارض ${clashId}`);
    saveToLocalStorage();
    renderClashList();
    showToast('تم حذف التعارض ✓');
  });
}

// --- 4.32 RATE ANALYSIS ---
function openAddRateAnalysisModal(record = null) {
  const boqOpts = (MimarERP.boq || []).map(b => ({ value: b.id || b.code, label: `${b.code} - ${b.item}` }));
  showCrudModal({
    title: record ? 'تعديل تحليل سعر البند' : 'إضافة تحليل سعري جديد (Rate Analysis Sheet)',
    icon: 'fa-calculator',
    record,
    fields: [
      { key: 'boq_id', label: 'بند جدول الكميات المرتبط', type: 'select', options: boqOpts, required: true },
      { key: 'item_name', label: 'توصيف البند', required: true, span2: true, placeholder: 'صب خرسانة مسلحة للأعمدة عيار 350 كجم' },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['م³','م²','م.ط','طن','كجم','عدد','مقطوعية'], default: 'م³', required: true },
      { key: 'total_material', label: 'تكلفة المواد المباشرة (SAR)', type: 'number', step: '0.01', required: true, default: 185 },
      { key: 'total_labor', label: 'تكلفة المصنعيات والعمالة (SAR)', type: 'number', step: '0.01', required: true, default: 35 },
      { key: 'total_equipment', label: 'تكلفة المعدات والآليات (SAR)', type: 'number', step: '0.01', required: true, default: 25 },
      { key: 'total_subcontract', label: 'تكلفة مقاولي الباطن (SAR)', type: 'number', step: '0.01', default: 0 },
      { key: 'site_overhead_pct', label: 'نسبة مصاريف الموقع %', type: 'number', default: 8 },
      { key: 'ho_overhead_pct', label: 'نسبة الإدارة العامة %', type: 'number', default: 5 },
      { key: 'target_profit_pct', label: 'نسبة هامش الربح المستهدف %', type: 'number', default: 12 }
    ],
    onSave(data, rec) {
      const mat = Number(data.total_material) || 0;
      const lab = Number(data.total_labor) || 0;
      const eqp = Number(data.total_equipment) || 0;
      const sub = Number(data.total_subcontract) || 0;
      const direct = mat + lab + eqp + sub;
      data.direct_cost = direct;
      const indPct = (Number(data.site_overhead_pct) || 0) + (Number(data.ho_overhead_pct) || 0);
      const indVal = (direct * indPct) / 100;
      data.total_indirect_cost = indVal;
      data.subtotal_cost = direct + indVal;
      const profVal = (data.subtotal_cost * (Number(data.target_profit_pct) || 12)) / 100;
      data.profit_val = profVal;
      data.selling_price_excl_vat = data.subtotal_cost + profVal;
      data.vat_15_pct = data.selling_price_excl_vat * 0.15;
      data.selling_price_incl_vat = data.selling_price_excl_vat * 1.15;

      if (rec) {
        Object.assign(rec, data);
        logAudit('UPDATE', 'RateAnalysis', `تعديل تحليل سعر ${rec.boq_id}`);
        showToast('تم تحديث تحليل السعر بنجاح ✓');
      } else {
        if (!MimarERP.rateAnalysis) MimarERP.rateAnalysis = [];
        MimarERP.rateAnalysis.push(data);
        logAudit('CREATE', 'RateAnalysis', `إضافة تحليل سعر جديد ${data.boq_id}`);
        showToast('تمت إضافة تحليل السعر بنجاح ✓');
      }
      saveToLocalStorage();
      renderRateAnalysisCards();
    }
  });
}

function deleteRateAnalysis(boqId) {
  const item = MimarERP.rateAnalysis?.find(x => x.boq_id === boqId);
  if (!item) return;
  confirmDelete(`حذف تحليل السعر للبند "<strong>${item.item_name}</strong>" (${boqId})؟`, () => {
    MimarERP.rateAnalysis = MimarERP.rateAnalysis.filter(x => x.boq_id !== boqId);
    logAudit('DELETE', 'RateAnalysis', `حذف تحليل سعر ${boqId}`);
    saveToLocalStorage();
    renderRateAnalysisCards();
    showToast('تم حذف تحليل السعر ✓');
  });
}

// =============================================================================
// 5. UNIFIED TABLE RENDERING WITH GUARANTEED ACTION BUTTONS
// =============================================================================

// 5.1 Companies Table
window.renderCompaniesTable = function() {
  const tbody = document.querySelector("#tbl-companies tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-companies");
  tbody.innerHTML = "";
  const list = MimarERP.companies || [];

  list.forEach((c, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${c.company_code}</strong></td>
      <td><strong>${c.company_name_ar}</strong></td>
      <td>${c.company_name_en || '—'}</td>
      <td class="text-num">${c.commercial_registration || '—'}</td>
      <td class="text-num">${c.tax_identification_number || '—'}</td>
      <td class="text-center"><span class="badge badge-blue">${c.base_currency}</span></td>
      <td class="text-num">${c.phone || '—'}</td>
      <td><span class="badge badge-green">${c.status}</span></td>
      ${renderActionButtons(`openAddCompanyModal(MimarERP.companies[${idx}])`, `deleteCompany('${c.company_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.2 Branches Table
window.renderBranchesTable = function() {
  const tbody = document.querySelector("#tbl-branches tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-branches");
  tbody.innerHTML = "";
  const list = MimarERP.branches || [];

  list.forEach((b, idx) => {
    const comp = MimarERP.companies?.find(c => c.company_id === b.company_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num">${b.branch_id}</td>
      <td><strong>${comp ? comp.company_name_ar : b.company_id}</strong></td>
      <td class="text-num">${b.branch_code}</td>
      <td>${b.branch_name_ar}</td>
      <td>${b.location}</td>
      ${renderActionButtons(`openAddBranchModal(MimarERP.branches[${idx}])`, `deleteBranch('${b.branch_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.3 Partners Table
window.renderPartnersTable = function() {
  const tbody = document.querySelector("#tbl-partners tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-partners");
  tbody.innerHTML = "";
  const partners = MimarERP.partners || [];

  const countBadge = document.getElementById("count-partners");
  if (countBadge) countBadge.textContent = `${partners.length} شريك معتمد`;

  const typeBadges = {
    Client: "badge-teal",
    Supplier: "badge-blue",
    Subcontractor: "badge-purple",
    Consultant: "badge-amber"
  };

  partners.forEach((p, idx) => {
    const catCount = (MimarERP.partnerCatalog || []).filter(c => c.partner_id === p.partner_id).length;
    const catBtn = `<button class="btn btn-outline btn-xs" onclick="openAddCatalogModal()" title="إضافة خامات لهذا الشريك"><i class="fas fa-plus"></i> (${catCount})</button>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${p.partner_code}</strong></td>
      <td><strong>${p.partner_name}</strong></td>
      <td><span class="badge ${typeBadges[p.partner_type] || "badge-blue"}">${p.partner_type}</span></td>
      <td>${p.category || '—'}</td>
      <td class="text-num">${p.tax_number || '—'}</td>
      <td class="text-num">${p.cr_number || '—'}</td>
      <td>${p.location || '—'}</td>
      <td>${p.owner || '—'}</td>
      <td class="text-num">${p.contact || '—'}</td>
      <td><span class="badge badge-green">★ ${p.rating || '4.5'}</span></td>
      <td><span class="badge ${p.status === 'معتمد' ? 'badge-green' : 'badge-amber'}">${p.status}</span></td>
      <td>${catBtn}</td>
      ${renderActionButtons(`openAddPartnerModal(MimarERP.partners[${idx}])`, `deletePartner('${p.partner_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.4 Partner Catalog Table
window.renderPartnerCatalogTable = function() {
  const tbody = document.querySelector("#tbl-partner-catalog tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-partner-catalog");
  tbody.innerHTML = "";
  const list = MimarERP.partnerCatalog || [];

  list.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${item.item_code}</strong></td>
      <td><strong>${item.partner_name}</strong></td>
      <td>${item.desc}</td>
      <td>${item.category || '—'}</td>
      <td class="text-center">${item.unit}</td>
      <td class="text-num">${Number(item.qty || 0).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(item.price_before_vat || 0).toFixed(2)}</td>
      <td class="text-num">15%</td>
      <td class="text-num"><strong>${Number(item.price_after_vat || 0).toFixed(2)}</strong></td>
      <td class="text-num">${Number(item.total_after_vat || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2 })}</td>
      <td>${item.location || '—'}</td>
      <td><span class="badge badge-green">${item.status || 'معتمد'}</span></td>
      ${renderActionButtons(`openAddCatalogModal(MimarERP.partnerCatalog[${idx}])`, `deleteCatalogItem('${item.item_code}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.5 Projects Table
window.renderProjectsTable = function() {
  const tbody = document.querySelector("#tbl-projects-list tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-projects-list");
  tbody.innerHTML = "";
  const list = MimarERP.projects || [];

  let totalVal = 0, totalDirect = 0, totalProg = 0;

  list.forEach((p, idx) => {
    totalVal += Number(p.contract_value) || 0;
    totalDirect += Number(p.direct_cost_budget) || 0;
    totalProg += Number(p.physical_progress_pct) || 0;
    const comp = MimarERP.companies?.find(c => c.company_id === p.company_id);
    const client = MimarERP.partners?.find(pt => pt.partner_id === p.client_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${p.project_code}</strong></td>
      <td><strong>${p.project_name_ar}</strong></td>
      <td>${comp ? comp.company_name_ar : p.company_id}</td>
      <td>${client ? client.partner_name : (p.client_id || '—')}</td>
      <td class="text-num"><strong>${Number(p.contract_value || 0).toLocaleString("ar-SA")}</strong></td>
      <td class="text-num">${Number(p.direct_cost_budget || 0).toLocaleString("ar-SA")}</td>
      <td class="text-center">${p.contract_duration_days || 365} يوم</td>
      <td class="text-center"><strong style="color:var(--teal)">${p.physical_progress_pct || 0}%</strong></td>
      <td><span class="badge ${p.status === 'نشط' ? 'badge-green' : 'badge-blue'}">${p.status}</span></td>
      ${renderActionButtons(`openAddProjectModal(MimarERP.projects[${idx}])`, `deleteProject('${p.project_id}')`)}
    `;
    tbody.appendChild(tr);
  });

  const kpiVal = document.getElementById("prj-kpi-total-val");
  if (kpiVal) kpiVal.textContent = totalVal.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
  const kpiCount = document.getElementById("prj-kpi-count");
  if (kpiCount) kpiCount.textContent = String(list.length);
  const kpiDirect = document.getElementById("prj-kpi-direct-cost");
  if (kpiDirect) kpiDirect.textContent = totalDirect.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
  const kpiAvg = document.getElementById("prj-kpi-avg-progress");
  if (kpiAvg) kpiAvg.textContent = (list.length ? (totalProg / list.length).toFixed(1) : 0) + '%';
};

// 5.6 WBS / BOQ Table
window.renderWBSBOQTree = function() {
  const tbody = document.querySelector("#tbl-wbs-boq tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-wbs-boq");
  tbody.innerHTML = "";
  const items = MimarERP.boq || [];

  let sumDirect = 0, sumSelling = 0;

  items.forEach((b, idx) => {
    sumDirect += Number(b.total_cost_direct || 0);
    sumSelling += Number(b.total_selling_amount || 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${b.item}</strong></td>
      <td class="text-num" style="color:var(--teal); font-weight:700;">${b.code}</td>
      <td class="text-center">${b.unit}</td>
      <td class="text-num">${Number(b.qty_rfq || 0).toLocaleString("ar-SA")}</td>
      <td class="text-num">${Number(b.rate_direct_total || 0).toFixed(2)}</td>
      <td class="text-num" style="font-weight:700;">${Number(b.rate_selling || 0).toFixed(2)}</td>
      <td class="text-num">${Number(b.total_cost_direct || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2 })}</td>
      <td class="text-num" style="font-weight:800; color:var(--green);">${Number(b.total_selling_amount || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2 })}</td>
      <td class="text-center">—</td>
      ${renderActionButtons(`openAddBOQModal(MimarERP.boq[${idx}])`, `deleteBOQItem('${b.id || b.code}')`)}
    `;
    tbody.appendChild(tr);
  });

  const footDirect = document.getElementById("boq-foot-direct");
  if (footDirect) footDirect.textContent = sumDirect.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
  const footSelling = document.getElementById("boq-foot-selling");
  if (footSelling) footSelling.textContent = sumSelling.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
};

// 5.7 Quantity Takeoff Table
window.renderTakeoffTable = function() {
  const tbody = document.querySelector("#tbl-takeoff tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-takeoff");
  tbody.innerHTML = "";
  const list = MimarERP.takeoff || [];

  const badge = document.getElementById("takeoff-count-badge");
  if (badge) badge.textContent = `${list.length} سطر حصر`;

  list.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num">${t.id}</td>
      <td class="text-num">${t.boq_id}</td>
      <td><strong>${t.location}</strong></td>
      <td>${t.desc}</td>
      <td class="text-center">${t.unit}</td>
      <td class="text-center">${t.no}</td>
      <td class="text-num">${Number(t.length).toFixed(2)}</td>
      <td class="text-num">${Number(t.width).toFixed(2)}</td>
      <td class="text-num">${Number(t.height).toFixed(2)}</td>
      <td class="text-num">${Number(t.gross_qty).toFixed(2)}</td>
      <td class="text-num" style="color:var(--red);">${Number(t.deduction || 0).toFixed(2)}</td>
      <td class="text-num"><strong style="color:var(--purple);">${Number(t.net_qty).toFixed(2)}</strong></td>
      ${renderActionButtons(`openAddTakeoffModal(MimarERP.takeoff[${idx}])`, `deleteTakeoffItem('${t.id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.8 Rate Analysis Table & Cards
window.renderRateAnalysisCards = function() {
  const tbody = document.querySelector("#tbl-rate-analysis-main tbody");
  if (tbody) {
    ensureActionCol("#tbl-rate-analysis-main");
    tbody.innerHTML = "";
    (MimarERP.rateAnalysis || []).forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${r.boq_id}</strong></td>
        <td><strong>${r.item_name}</strong></td>
        <td class="text-center">${r.unit}</td>
        <td class="text-num">${Number(r.total_material || 0).toFixed(2)}</td>
        <td class="text-num">${Number(r.total_labor || 0).toFixed(2)}</td>
        <td class="text-num">${Number(r.total_equipment || 0).toFixed(2)}</td>
        <td class="text-num">${Number(r.direct_cost || 0).toFixed(2)}</td>
        <td class="text-num" style="font-weight:800; color:var(--teal);">${Number(r.selling_price_excl_vat || 0).toFixed(2)}</td>
        <td class="text-num" style="font-weight:800; color:var(--green);">${Number(r.selling_price_incl_vat || 0).toFixed(2)}</td>
        ${renderActionButtons(`openAddRateAnalysisModal(MimarERP.rateAnalysis[${idx}])`, `deleteRateAnalysis('${r.boq_id}')`)}
      `;
      tbody.appendChild(tr);
    });
  }
};

// 5.9 CRM Table
window.renderCRMTable = function() {
  const tbody = document.getElementById("tbl-crm-body") || document.querySelector("#tbl-crm-opportunities tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-crm-opportunities");
  tbody.innerHTML = "";
  const data = MimarERP.crmOpportunities || [];

  data.forEach((r, idx) => {
    const probColor = r.win_probability >= 70 ? "var(--green)" : (r.win_probability >= 40 ? "var(--amber)" : "var(--red)");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${r.opp_id}</strong></td>
      <td><strong>${r.client_name}</strong></td>
      <td>${r.project_name}</td>
      <td class="text-num">${Number(r.estimated_value).toLocaleString("ar-SA")}</td>
      <td><span class="badge badge-blue">${r.stage}</span></td>
      <td class="text-num" style="font-weight:800;color:${probColor}">${r.win_probability}%</td>
      <td>${r.owner}</td>
      <td>${r.expected_close}</td>
      <td><span class="badge ${r.status === "نشط" ? "badge-green" : "badge-red"}">${r.status}</span></td>
      ${renderActionButtons(`openAddCRMModal(MimarERP.crmOpportunities[${idx}])`, `deleteCRMOpp('${r.opp_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.10 Tenders Table
window.renderTendersTable = function() {
  const tbody = document.getElementById("tbl-tenders-body") || document.querySelector("#tbl-tenders tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-tenders");
  tbody.innerHTML = "";
  const list = MimarERP.tendersMaster || [];

  list.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${t.tender_id}</strong></td>
      <td><strong>${t.project_name}</strong></td>
      <td>${t.owner}</td>
      <td>${t.contract_type}</td>
      <td class="text-num"><strong>${Number(t.bid_value).toLocaleString("ar-SA")}</strong></td>
      <td class="text-num">${t.deadline}</td>
      <td><span class="badge badge-blue">${t.status}</span></td>
      <td><span class="badge badge-teal">${t.award_result}</span></td>
      ${renderActionButtons(`openAddTenderModal(MimarERP.tendersMaster[${idx}])`, `deleteTender('${t.tender_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.11 Inventory Table
window.renderInventoryTable = function() {
  const tbody = document.querySelector("#tbl-inventory tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-inventory");
  tbody.innerHTML = "";
  const list = MimarERP.inventoryLedger || [];

  list.forEach((item, idx) => {
    const isReceipt = (item.qty_in > 0) || item.tx_type?.includes('استلام');
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${item.tx_id}</strong></td>
      <td><span class="badge ${isReceipt ? 'badge-green' : 'badge-amber'}">${item.tx_type}</span></td>
      <td>${item.warehouse}</td>
      <td><strong>${item.item_name}</strong></td>
      <td class="text-num">${item.batch_no || '—'}</td>
      <td class="text-num" style="color:var(--green); font-weight:700;">${item.qty_in || 0}</td>
      <td class="text-num" style="color:var(--red); font-weight:700;">${item.qty_out || 0}</td>
      <td class="text-num">${Number(item.unit_cost || 0).toFixed(2)}</td>
      <td class="text-num">${item.wbs_ref || '—'}</td>
      <td class="text-num">${item.tx_date || '—'}</td>
      ${renderActionButtons(`openAddInventoryModal(MimarERP.inventoryLedger[${idx}])`, `deleteInventory('${item.tx_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.12 Subcontracts Table
window.renderSubcontractsTable = function() {
  const tbody = document.querySelector("#tbl-subcontracts tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-subcontracts");
  tbody.innerHTML = "";
  const list = MimarERP.subcontractsMaster || [];

  let totalCommitment = 0;
  let totalMeasured = 0;
  let totalRetention = 0;
  let totalNetPaid = 0;

  list.forEach((sc, idx) => {
    const orig = Number(sc.original_value || 0);
    const vos = Number(sc.approved_vos || 0);
    const measured = Number(sc.executed_measured || 0);
    const billings = Number(sc.approved_billings || sc.executed_measured || 0);
    const retention = Number(sc.retention_val || (measured * 0.10));
    const paid = Number(sc.net_paid || (measured - retention));

    totalCommitment += (orig + vos);
    totalMeasured += measured;
    totalRetention += retention;
    totalNetPaid += paid;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${sc.sub_id}</strong></td>
      <td><strong>${sc.contractor_name}</strong></td>
      <td>${sc.scope}</td>
      <td class="text-num"><strong>${orig.toLocaleString(undefined, {minimumFractionDigits:2})}</strong></td>
      <td class="text-num" style="color:var(--blue);">${vos.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="color:var(--teal); font-weight:bold;">${measured.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num">${billings.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="color:var(--amber); font-weight:bold;">${retention.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td class="text-num" style="color:var(--green); font-weight:bold;">${paid.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      <td><span class="badge ${sc.status?.includes('مكتمل') ? 'badge-green' : 'badge-blue'}">${sc.status}</span></td>
      ${renderActionButtons(`openAddSubcontractModal(MimarERP.subcontractsMaster[${idx}])`, `deleteSubcontract('${sc.sub_id}')`)}
    `;
    tbody.appendChild(tr);
  });

  // Update Subcontracts KPIs
  const elTotal = document.getElementById("sub-kpi-total-val");
  if (elTotal) elTotal.textContent = totalCommitment.toLocaleString(undefined, {minimumFractionDigits:2});
  const elMeasured = document.getElementById("sub-kpi-measured-val");
  if (elMeasured) elMeasured.textContent = totalMeasured.toLocaleString(undefined, {minimumFractionDigits:2});
  const elRetention = document.getElementById("sub-kpi-retention-val");
  if (elRetention) elRetention.textContent = totalRetention.toLocaleString(undefined, {minimumFractionDigits:2});
  const elPaid = document.getElementById("sub-kpi-paid-val");
  if (elPaid) elPaid.textContent = totalNetPaid.toLocaleString(undefined, {minimumFractionDigits:2});
};

// 5.13 HR Table
window.renderHRTable = function() {
  const tbody = document.getElementById("tbl-hr-body") || document.querySelector("#tbl-hr tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-hr");
  tbody.innerHTML = "";
  const list = MimarERP.hrEmployees || [];

  list.forEach((e, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${e.emp_id}</strong></td>
      <td><strong>${e.name}</strong></td>
      <td>${e.title}</td>
      <td>${e.department}</td>
      <td>${e.project}</td>
      <td>${e.contract_type}</td>
      <td class="text-num">${e.hire_date}</td>
      <td class="text-num"><strong>${Number(e.basic_salary).toLocaleString("ar-SA")}</strong></td>
      <td><span class="badge ${e.status === 'على رأس العمل' ? 'badge-green' : 'badge-amber'}">${e.status}</span></td>
      ${renderActionButtons(`openAddEmployeeModal(MimarERP.hrEmployees[${idx}])`, `deleteEmployee('${e.emp_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.14 Payroll Table
window.renderPayrollTable = function() {
  const tbody = document.getElementById("tbl-payroll-body") || document.querySelector("#tbl-payroll tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-payroll");
  tbody.innerHTML = "";
  const list = MimarERP.payrollRecords || [];

  let sumBasic = 0, sumNet = 0;

  list.forEach((p, idx) => {
    const basic = Number(p.basic_salary) || 0;
    const housing = Number(p.housing) || 0;
    const trans = Number(p.transport) || 0;
    const perf = Number(p.performance) || 0;
    const ded = Number(p.deductions) || 0;
    const net = basic + housing + trans + perf - ded;
    sumBasic += basic;
    sumNet += net;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td>${p.department}</td>
      <td class="text-num">${basic.toLocaleString("ar-SA")}</td>
      <td class="text-num">${housing.toLocaleString("ar-SA")}</td>
      <td class="text-num">${trans.toLocaleString("ar-SA")}</td>
      <td class="text-num">${perf.toLocaleString("ar-SA")}</td>
      <td class="text-num" style="color:var(--red);">${ded.toLocaleString("ar-SA")}</td>
      <td class="text-num" style="font-weight:800; color:var(--green);">${net.toLocaleString("ar-SA")}</td>
      <td><span class="badge badge-green">${p.payroll_status}</span></td>
      ${renderActionButtons(`openAddPayrollModal(MimarERP.payrollRecords[${idx}])`, `deletePayroll('${p.name}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.15 Equipment Table
window.renderEquipmentTable = function() {
  const tbody = document.getElementById("tbl-equipment-body") || document.querySelector("#tbl-equipment tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-equipment");
  tbody.innerHTML = "";
  const list = MimarERP.equipmentMaster || [];

  list.forEach((eq, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${eq.equip_id}</strong></td>
      <td><strong>${eq.name}</strong></td>
      <td>${eq.type}</td>
      <td>${eq.model}</td>
      <td>${eq.project}</td>
      <td class="text-num">${eq.operating_hours || 0}</td>
      <td class="text-num">${eq.maintenance_hours || 0}</td>
      <td class="text-num">${Number(eq.daily_cost || 0).toLocaleString("ar-SA")}</td>
      <td><span class="badge badge-green">${eq.status}</span></td>
      <td class="text-num">${eq.next_maintenance || '—'}</td>
      ${renderActionButtons(`openAddEquipmentModal(MimarERP.equipmentMaster[${idx}])`, `deleteEquipment('${eq.equip_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.16 Cost Control Table
window.renderCostControlTable = function() {
  const tbody = document.getElementById("tbl-cost-control-body") || document.querySelector("#tbl-cost-control tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-cost-control");
  tbody.innerHTML = "";
  const list = MimarERP.costControlRegister || [];

  list.forEach((cc, idx) => {
    const bac = Number(cc.bac) || 0;
    const pv = Number(cc.pv) || 0;
    const ev = Number(cc.ev) || 0;
    const ac = Number(cc.ac) || 0;
    const cpi = ac > 0 ? (ev / ac).toFixed(2) : '1.00';
    const spi = pv > 0 ? (ev / pv).toFixed(2) : '1.00';
    const eac = Number(cpi) > 0 ? Math.round(bac / Number(cpi)) : bac;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${cc.wbs_code}</strong></td>
      <td>${cc.description}</td>
      <td class="text-num">${bac.toLocaleString("ar-SA")}</td>
      <td class="text-num">${pv.toLocaleString("ar-SA")}</td>
      <td class="text-num">${ev.toLocaleString("ar-SA")}</td>
      <td class="text-num">${ac.toLocaleString("ar-SA")}</td>
      <td class="text-num" style="font-weight:800; color:${Number(cpi)>=1?'var(--green)':'var(--red)'}">${cpi}</td>
      <td class="text-num" style="font-weight:800; color:${Number(spi)>=1?'var(--green)':'var(--amber)'}">${spi}</td>
      <td class="text-num">${eac.toLocaleString("ar-SA")}</td>
      ${renderActionButtons(`openAddCostControlModal(MimarERP.costControlRegister[${idx}])`, `deleteCostControl('${cc.wbs_code}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.17 Site Diary Table
window.renderSiteDiary = function() {
  const tbody = document.getElementById("tbl-diary-manpower-body") || document.querySelector("#tbl-diary-manpower tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-diary-manpower");
  tbody.innerHTML = "";
  const list = MimarERP.siteDiaryLogs || [];

  list.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${d.date}</strong></td>
      <td class="text-center">${d.total_workforce || 0} عامل</td>
      <td class="text-center">${d.total_hours || 8} ساعة</td>
      <td class="text-num">${(d.total_workforce || 0) * (d.total_hours || 8)} ساعة</td>
      ${renderActionButtons(`openAddDiaryModal(MimarERP.siteDiaryLogs[${idx}])`, `deleteDiaryEntry('${d.date}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.18 Punch List Table
window.renderPunchList = function(filterStatus = "All") {
  const tbody = document.getElementById("tbl-punch-list-body") || document.querySelector("#tbl-punch-list tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-punch-list");
  tbody.innerHTML = "";
  const list = MimarERP.punchListItems || [];

  list.forEach((s, idx) => {
    if (filterStatus !== "All" && !s.status?.includes(filterStatus)) return;
    const sevBadge = s.severity?.includes("حرج") ? "badge-red" : (s.severity?.includes("رئيسي") ? "badge-amber" : "badge-blue");
    const statusBadge = s.status?.includes("مغلق") ? "badge-green" : (s.status?.includes("جاري") ? "badge-amber" : "badge-blue");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:var(--teal)">${s.snag_id}</strong></td>
      <td><strong>${s.location}</strong></td>
      <td>${s.discipline}</td>
      <td>${s.desc}</td>
      <td><span class="badge ${sevBadge}">${s.severity}</span></td>
      <td>${s.contractor}</td>
      <td>${s.date_opened}</td>
      <td class="text-num">${s.due_date}</td>
      <td><span class="badge ${statusBadge}">${s.status}</span></td>
      ${renderActionButtons(`openAddPunchModal(MimarERP.punchListItems[${idx}])`, `deletePunchItem('${s.snag_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.19 RFI List Table
window.renderRFIList = function() {
  const tbody = document.getElementById("tbl-rfi-list-body") || document.querySelector("#tbl-rfi-list tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-rfi-list");
  tbody.innerHTML = "";
  const list = MimarERP.rfiList || [];

  list.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${r.id}</strong></td>
      <td><strong>${r.subject}</strong></td>
      <td>${r.discipline}</td>
      <td>${r.drawing_ref || '—'}</td>
      <td>${r.question}</td>
      <td>${r.response || 'قيد دراسة الاستشاري'}</td>
      <td class="text-num">${r.cost_impact || 'لا يوجد'}</td>
      <td class="text-num">${r.schedule_impact || '0 يوم'}</td>
      <td><span class="badge ${r.priority?.includes('عاجل') ? 'badge-red' : 'badge-blue'}">${r.priority}</span></td>
      <td><span class="badge ${r.status?.includes('تم') ? 'badge-green' : 'badge-amber'}">${r.status}</span></td>
      ${renderActionButtons(`openAddRFIModal(MimarERP.rfiList[${idx}])`, `deleteRFIItem('${r.id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.20 Submittals Table
window.renderSubmittals = function() {
  const tbody = document.getElementById("tbl-submittals-body") || document.querySelector("#tbl-submittals tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-submittals");
  tbody.innerHTML = "";
  const list = MimarERP.submittalsList || [];

  list.forEach((sub, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${sub.id}</strong></td>
      <td><strong>${sub.title}</strong></td>
      <td>${sub.type}</td>
      <td>${sub.discipline}</td>
      <td>${sub.subcontractor}</td>
      <td>${sub.revision || 'Rev 0'}</td>
      <td><span class="badge badge-teal">${sub.status || 'قيد المراجعة'}</span></td>
      <td>${sub.consultant || 'دار الهندسة'}</td>
      ${renderActionButtons(`openAddSubmittalModal(MimarERP.submittalsList[${idx}])`, `deleteSubmittalItem('${sub.id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.21 Variations Table
window.renderVariationsList = function() {
  const tbody = document.getElementById("tbl-variations-list-body") || document.querySelector("#tbl-variations-list tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-variations-list");
  tbody.innerHTML = "";
  const list = MimarERP.variationsMaster || [];

  list.forEach((v, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${v.co_id}</strong></td>
      <td>${v.project_id}</td>
      <td><strong>${v.title}</strong></td>
      <td>${v.scope_type}</td>
      <td class="text-num"><strong>${Number(v.amount).toLocaleString("ar-SA")}</strong></td>
      <td class="text-center">${v.time_eot_days} يوم</td>
      <td><span class="badge ${v.status?.includes('معتمد') ? 'badge-green' : 'badge-amber'}">${v.status}</span></td>
      <td>${v.initiated_by}</td>
      <td>${v.consultant_approval || 'معتمد'}</td>
      <td class="text-num">${v.date_issued || '—'}</td>
      ${renderActionButtons(`openAddVariationModal(MimarERP.variationsMaster[${idx}])`, `deleteVariationItem('${v.co_id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.22 CDE Documents Table
window.renderCDEContainers = function() {
  const tbody = document.getElementById("tbl-cde-body") || document.querySelector("#tbl-cde tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-cde");
  tbody.innerHTML = "";
  const list = MimarERP.cdeContainersMaster || [];

  list.forEach((doc, idx) => {
    const docNo = doc.doc_number || doc.docNumber;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${docNo}</strong></td>
      <td><strong>${doc.title}</strong></td>
      <td>${doc.discipline}</td>
      <td>${doc.revision}</td>
      <td><span class="badge badge-teal">${doc.iso_status || doc.isoState || 'WIP'}</span></td>
      <td>${doc.suitability || doc.suitabilityCode || 'S0'}</td>
      <td>${doc.classification || doc.uniclassCode || '—'}</td>
      <td>${doc.author}</td>
      <td class="text-num">${doc.date || '—'}</td>
      ${renderActionButtons(`openAddCDEModal(MimarERP.cdeContainersMaster[${idx}])`, `deleteCDEDocument('${docNo}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.23 Safety Dashboard Table
window.renderSafetyDashboard = function() {
  const tbody = document.getElementById("tbl-safety-body") || document.querySelector("#tbl-safety tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-safety");
  tbody.innerHTML = "";
  const list = MimarERP.safetyIncidents || [];

  list.forEach((inc, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${inc.id}</strong></td>
      <td class="text-num">${inc.date}</td>
      <td>${inc.projectId || 'PRJ-2001'}</td>
      <td><span class="badge badge-amber">${inc.type}</span></td>
      <td><strong>${inc.description}</strong></td>
      <td class="text-center">${inc.lti || 0} يوم</td>
      <td>${inc.action || '—'}</td>
      <td><span class="badge ${inc.status?.includes('Closed') ? 'badge-green' : 'badge-red'}">${inc.status}</span></td>
      ${renderActionButtons(`openAddSafetyModal(MimarERP.safetyIncidents[${idx}])`, `deleteSafetyIncident('${inc.id}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.24 Contractors Matrix & Rates Tables
window.renderContractorsMatrixTable = function() {
  // Contractors
  const tbodyC = document.querySelector("#tbl-contractors-matrix tbody");
  if (tbodyC) {
    ensureActionCol("#tbl-contractors-matrix");
    tbodyC.innerHTML = "";
    (MimarERP.contractorsMaster || []).forEach((c, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${c.contractor_id}</strong></td>
        <td><strong>${c.contractor_name}</strong></td>
        <td>${c.specialty}</td>
        <td class="text-center">${c.labor_count || Math.round(c.total_crew * 0.7)}</td>
        <td class="text-center">${c.tech_count || Math.round(c.total_crew * 0.2)}</td>
        <td class="text-center">${c.supervisor_count || Math.round(c.total_crew * 0.1)}</td>
        <td class="text-center"><strong style="color:var(--teal)">${c.total_crew}</strong></td>
        <td>${c.city}</td>
        <td class="text-num">${c.contact_person || c.phone || '—'}</td>
        <td><span class="badge badge-green">★ ${c.rating || '4.5'}</span></td>
        <td>${c.speed_rating || 'ممتاز'}</td>
        <td>${c.prev_projects || '—'}</td>
        <td><span class="badge badge-green">${c.status}</span></td>
        ${renderActionButtons(`openAddContractorMasterModal(MimarERP.contractorsMaster[${idx}])`, `deleteContractorMaster('${c.contractor_id}')`)}
      `;
      tbodyC.appendChild(tr);
    });
  }

  // Rates
  const tbodyR = document.querySelector("#tbl-contractor-rates tbody");
  if (tbodyR) {
    ensureActionCol("#tbl-contractor-rates");
    tbodyR.innerHTML = "";
    (MimarERP.contractorRatesMaster || []).forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${r.rate_id}</strong></td>
        <td><strong>${r.contractor_name}</strong></td>
        <td>${r.specialty}</td>
        <td>${r.activity_desc}</td>
        <td class="text-center">${r.unit}</td>
        <td class="text-num"><strong>${Number(r.unit_rate).toFixed(2)}</strong></td>
        <td>${r.daily_production}</td>
        <td>${r.waste_resp || 'على المقاول'}</td>
        <td>${r.safety_comp || 'مطابق 100%'}</td>
        <td><span class="badge badge-green">${r.status}</span></td>
        ${renderActionButtons(`openAddContractorRateModal(MimarERP.contractorRatesMaster[${idx}])`, `deleteContractorRate('${r.rate_id}')`)}
      `;
      tbodyR.appendChild(tr);
    });
  }

  // Dynamic KPIs for Contractors Matrix
  const kpiCount = document.getElementById("kpi-con-count");
  if (kpiCount) kpiCount.textContent = (MimarERP.contractorsMaster || []).length;
  const kpiCrew = document.getElementById("kpi-con-crew");
  if (kpiCrew) {
    const totalCrew = (MimarERP.contractorsMaster || []).reduce((s, c) => s + (Number(c.total_crew) || 0), 0);
    kpiCrew.textContent = totalCrew + " فرد";
  }

  // Render Subcontract Tender Packages if container present
  if (window.SubcontractTenderEngine && typeof window.SubcontractTenderEngine.renderTenderPackagesTable === 'function') {
    window.SubcontractTenderEngine.renderTenderPackagesTable('tender-packages-container');
  }
};

// 5.25 Rebar BBS Table
window.renderRebarBBS = function() {
  const tbody = document.getElementById("tbl-rebar-bbs-body") || document.querySelector("#tbl-rebar-bbs tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-rebar-bbs");
  tbody.innerHTML = "";
  const list = MimarERP.rebarBBSItems || [];

  list.forEach((b, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${b.member}</strong></td>
      <td class="text-num"><strong>${b.bar_mark}</strong></td>
      <td>${b.shape_code}</td>
      <td class="text-center">T${b.diameter}</td>
      <td class="text-center">${b.num_elements}</td>
      <td class="text-center">${b.bars_per_element}</td>
      <td class="text-center"><strong style="color:var(--teal)">${b.total_bars}</strong></td>
      <td class="text-num">${Number(b.cut_length).toFixed(2)}</td>
      <td class="text-num">${Number(b.total_length).toFixed(2)}</td>
      <td class="text-num">${Number(b.unit_weight).toFixed(3)}</td>
      <td class="text-num"><strong>${Number(b.total_weight_kg).toFixed(1)}</strong></td>
      <td class="text-center">${b.scrap_allowance_pct || 5}%</td>
      ${renderActionButtons(`openAddRebarBBSModal(MimarERP.rebarBBSItems[${idx}])`, `deleteRebarBBSItem('${b.bar_mark}')`)}
    `;
    tbody.appendChild(tr);
  });
};

// 5.26 Clash Detection Table
window.renderClashList = function() {
  const tbody = document.getElementById("tbl-clash-list-body") || document.querySelector("#tbl-clash-list tbody");
  if (!tbody) return;
  ensureActionCol("#tbl-clash-list");
  tbody.innerHTML = "";
  const list = MimarERP.bimClashesMaster || [];

  let totalCostImpact = 0;

  list.forEach((c, idx) => {
    // OpenConstructionERP Cost Impact Algorithm
    const impact = (window.ClashCostEngine && window.ClashCostEngine.calculateClashCostImpact) 
      ? window.ClashCostEngine.calculateClashCostImpact(c)
      : { totalCostImpact: c.severity === 'Critical' ? 6200 : 2800 };
    
    if (c.status !== 'Resolved') {
      totalCostImpact += impact.totalCostImpact;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-num"><strong>${c.clash_id}</strong></td>
      <td><strong>${c.item_a}</strong> (${c.discipline_a})</td>
      <td><strong>${c.item_b}</strong> (${c.discipline_b})</td>
      <td><span class="badge badge-amber">${c.clash_type}</span></td>
      <td>${c.overlap_distance || '—'}</td>
      <td>${c.location}</td>
      <td><span class="badge ${c.severity === 'Critical' ? 'badge-red' : 'badge-blue'}">${c.severity}</span></td>
      <td><span class="badge ${c.status === 'Resolved' ? 'badge-green' : 'badge-red'}">${c.status}</span></td>
      <td class="text-num"><strong style="color:var(--purple);">${impact.totalCostImpact.toLocaleString('ar-SA')}</strong> ر.س</td>
      <td>${c.resolution || '—'}</td>
      <td class="text-num"><span class="badge badge-purple">${c.rfi_ref || 'RFI-0' + (idx+1)}</span></td>
      ${renderActionButtons(`openAddClashModal(MimarERP.bimClashesMaster[${idx}])`, `deleteClashItem('${c.clash_id}')`)}
    `;
    tbody.appendChild(tr);
  });

  const kpiCost = document.getElementById("clash-kpi-cost");
  if (kpiCost) kpiCost.textContent = totalCostImpact.toLocaleString('ar-SA');
};

// 5.27 Finance Tabs Tables
window.renderFinanceTabs = function() {
  // Billings
  const tbodyB = document.getElementById("tbl-finance-billings-body") || document.querySelector("#tbl-finance-billings tbody");
  if (tbodyB) {
    ensureActionCol("#tbl-finance-billings");
    tbodyB.innerHTML = "";
    (MimarERP.financeBillings || []).forEach((b, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${b.billing_id}</strong></td>
        <td>${b.project}</td>
        <td>${b.owner}</td>
        <td class="text-num"><strong>${Number(b.amount).toLocaleString("ar-SA")}</strong></td>
        <td class="text-num">${b.submission_date}</td>
        <td class="text-num">${b.approval_date || '—'}</td>
        <td><span class="badge badge-green">${b.status}</span></td>
        <td class="text-num">${Number(b.collected || 0).toLocaleString("ar-SA")}</td>
        ${renderActionButtons(`openAddFinanceBillingModal(MimarERP.financeBillings[${idx}])`, `deleteFinanceBilling('${b.billing_id}')`)}
      `;
      tbodyB.appendChild(tr);
    });
  }

  // AP
  const tbodyAP = document.getElementById("tbl-finance-ap-body") || document.querySelector("#tbl-finance-ap tbody");
  if (tbodyAP) {
    ensureActionCol("#tbl-finance-ap");
    tbodyAP.innerHTML = "";
    (MimarERP.financeAP || []).forEach((ap, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-num"><strong>${ap.invoice_id}</strong></td>
        <td><strong>${ap.supplier}</strong></td>
        <td class="text-num"><strong>${Number(ap.amount).toLocaleString("ar-SA")}</strong></td>
        <td class="text-num">${ap.due_date}</td>
        <td><span class="badge ${ap.status?.includes('مسدد') ? 'badge-green' : 'badge-amber'}">${ap.status}</span></td>
        ${renderActionButtons(`openAddFinanceAPModal(MimarERP.financeAP[${idx}])`, `deleteFinanceAP('${ap.invoice_id}')`)}
      `;
      tbodyAP.appendChild(tr);
    });
  }
};

// =============================================================================
// 6. CSS INJECTION FOR ACTION BUTTONS & MODALS
// =============================================================================
(function injectCRUDStyles() {
  if (typeof document === 'undefined' || !document.head) return;
  const style = document.createElement('style');
  style.id = 'crud-engine-styles';
  style.textContent = `
    .action-btns { white-space:nowrap; text-align:center; min-width:85px; }
    .action-btns .btn { padding:4px 9px; font-size:12px; margin:0 2px; }
    .action-btns .btn:hover { transform:scale(1.05); }
    .col-actions { min-width:90px; text-align:center; }
    .btn-danger { background:#DC2626 !important; color:#fff !important; }
    .btn-danger:hover { background:#B91C1C !important; }
    #crud-modal-dynamic input:focus, #crud-modal-dynamic select:focus, #crud-modal-dynamic textarea:focus {
      border-color: var(--teal) !important;
      box-shadow: 0 0 0 2px rgba(13,148,136,0.18) !important;
    }
  `;
  document.head.appendChild(style);
})();

// Master re-render hook to refresh all tables
const _prevRenderAllViews = window.renderAllViews;
window.renderAllViews = function() {
  if (typeof _prevRenderAllViews === 'function') _prevRenderAllViews();
  if (typeof renderCompaniesTable === 'function') renderCompaniesTable();
  if (typeof renderBranchesTable === 'function') renderBranchesTable();
  if (typeof renderPartnersTable === 'function') renderPartnersTable();
  if (typeof renderPartnerCatalogTable === 'function') renderPartnerCatalogTable();
  if (typeof renderProjectsTable === 'function') renderProjectsTable();
  if (typeof renderWBSBOQTree === 'function') renderWBSBOQTree();
  if (typeof renderTakeoffTable === 'function') renderTakeoffTable();
  if (typeof renderRateAnalysisCards === 'function') renderRateAnalysisCards();
  if (typeof renderCRMTable === 'function') renderCRMTable();
  if (typeof renderTendersTable === 'function') renderTendersTable();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderSubcontractsTable === 'function') renderSubcontractsTable();
  if (typeof renderHRTable === 'function') renderHRTable();
  if (typeof renderPayrollTable === 'function') renderPayrollTable();
  if (typeof renderEquipmentTable === 'function') renderEquipmentTable();
  if (typeof renderCostControlTable === 'function') renderCostControlTable();
  if (typeof renderSiteDiary === 'function') renderSiteDiary();
  if (typeof renderPunchList === 'function') renderPunchList();
  if (typeof renderRFIList === 'function') renderRFIList();
  if (typeof renderSubmittals === 'function') renderSubmittals();
  if (typeof renderVariationsList === 'function') renderVariationsList();
  if (typeof renderCDEContainers === 'function') renderCDEContainers();
  if (typeof renderSafetyDashboard === 'function') renderSafetyDashboard();
  if (typeof renderContractorsMatrixTable === 'function') renderContractorsMatrixTable();
  if (typeof renderRebarBBS === 'function') renderRebarBBS();
  if (typeof renderClashList === 'function') renderClashList();
  if (typeof renderFinanceTabs === 'function') renderFinanceTabs();
};

// Explicit window bindings and aliases for HTML onclick compatibility
window.openAddContractorModal = openAddContractorMasterModal;
window.openAddContractorMasterModal = openAddContractorMasterModal;
window.openNewDiaryModal = openAddDiaryModal;
window.openAddDiaryModal = openAddDiaryModal;
window.openAddCompanyModal = openAddCompanyModal;
window.openAddBranchModal = openAddBranchModal;
window.openAddPartnerModal = openAddPartnerModal;
window.openAddCatalogModal = openAddCatalogModal;
window.openAddProjectModal = openAddProjectModal;
window.openAddBOQModal = openAddBOQModal;
window.openAddTakeoffModal = openAddTakeoffModal;
window.openAddPOModal = openAddPOModal;
window.openAddInventoryModal = openAddInventoryModal;
window.openAddSubcontractModal = openAddSubcontractModal;
window.openAddPunchModal = openAddPunchModal;
window.openAddRFIModal = openAddRFIModal;
window.openAddScheduleModal = openAddScheduleModal;
window.openAddBillingIPCModal = openAddBillingIPCModal;
window.openAddInspectionModal = openAddInspectionModal;
window.openAddDrawingModal = openAddDrawingModal;
window.openAddSubmittalModal = openAddSubmittalModal;
window.openAddVariationModal = openAddVariationModal;
window.openAddCRMModal = openAddCRMModal;
window.openAddTenderModal = openAddTenderModal;
window.openAddEmployeeModal = openAddEmployeeModal;
window.openAddPayrollModal = openAddPayrollModal;
window.openAddEquipmentModal = openAddEquipmentModal;
window.openAddCostControlModal = openAddCostControlModal;
window.openAddFinanceBillingModal = openAddFinanceBillingModal;
window.openAddFinanceAPModal = openAddFinanceAPModal;
window.openAddCDEModal = openAddCDEModal;
window.openAddSafetyModal = openAddSafetyModal;
window.openAddContractorRateModal = openAddContractorRateModal;
window.openAddRebarBBSModal = openAddRebarBBSModal;
window.openAddClashModal = openAddClashModal;
window.openAddRateAnalysisModal = openAddRateAnalysisModal;

window.deleteCompany = deleteCompany;
window.deleteBranch = deleteBranch;
window.deletePartner = deletePartner;
window.deleteCatalogItem = deleteCatalogItem;
window.deleteProject = deleteProject;
window.deleteBOQItem = deleteBOQItem;
window.deleteTakeoffItem = deleteTakeoffItem;
window.deletePOItem = deletePOItem;
window.deleteInventory = deleteInventory;
window.deleteSubcontract = deleteSubcontract;
window.deleteDiaryEntry = deleteDiaryEntry;
window.deletePunchItem = deletePunchItem;
window.deleteRFIItem = deleteRFIItem;
window.deleteScheduleTask = deleteScheduleTask;
window.deleteBillingIPC = deleteBillingIPC;
window.deleteInspectionItem = deleteInspectionItem;
window.deleteDrawingItem = deleteDrawingItem;
window.deleteSubmittalItem = deleteSubmittalItem;
window.deleteVariationItem = deleteVariationItem;
window.deleteCRMOpp = deleteCRMOpp;
window.deleteTender = deleteTender;
window.deleteEmployee = deleteEmployee;
window.deletePayroll = deletePayroll;
window.deleteEquipment = deleteEquipment;
window.deleteCostControl = deleteCostControl;
window.deleteFinanceBilling = deleteFinanceBilling;
window.deleteFinanceAP = deleteFinanceAP;
window.deleteCDEDocument = deleteCDEDocument;
window.deleteSafetyIncident = deleteSafetyIncident;
window.deleteContractorMaster = deleteContractorMaster;
window.deleteContractorRate = deleteContractorRate;
window.deleteRebarBBSItem = deleteRebarBBSItem;
window.deleteClashItem = deleteClashItem;
window.deleteRateAnalysis = deleteRateAnalysis;

