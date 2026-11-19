/* ==========================================================================
   CRUD ENGINE — Full Dynamic CRUD for All 39 Views
   مؤلف: Mimar ERP v5.0 | معيار: Pure JS ES6+ | LocalStorage Persistence
   ========================================================================== */

// =============================================================================
// 1. STATE PERSISTENCE — حفظ واستعادة حالة الواجهة بالكامل
// =============================================================================
const STATE_KEY = 'MimarERPState_v5';

function saveUIState() {
  const activeView = document.querySelector('.page-view.active')?.id?.replace('view-','') || 'dashboard';
  const activeTabs = [];
  document.querySelectorAll('.tab-link.active').forEach(tab => {
    if (tab.getAttribute('onclick')) {
      activeTabs.push(tab.getAttribute('onclick'));
    }
  });

  const state = {
    view: activeView,
    companyId: MimarERP.currentCompanyId,
    projectId: MimarERP.currentProjectId,
    role: MimarERP.currentRole,
    reportType: document.getElementById('sel-report-type')?.value || 'rep-cvr',
    activeTabs: activeTabs,
    filters: {},
    searches: {}
  };

  document.querySelectorAll('input[type="text"], input[type="search"], select.filter-dropdown, select.context-select').forEach(el => {
    if (el.id && el.value) {
      if (el.id.includes('search') || el.classList.contains('search-input')) {
        state.searches[el.id] = el.value;
      } else if (el.id.includes('filter') || el.classList.contains('filter-dropdown')) {
        state.filters[el.id] = el.value;
      }
    }
  });

  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e){}
}

function restoreUIState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);

    // 1. Restore Company & Project context
    if (state.companyId && MimarERP.companies.some(c => c.company_id === state.companyId)) {
      MimarERP.currentCompanyId = state.companyId;
      const compSel = document.getElementById('ctx-company');
      if (compSel) compSel.value = state.companyId;
      populateProjectDropdown();
    }
    if (state.projectId && MimarERP.projects.some(p => p.project_id === state.projectId)) {
      MimarERP.currentProjectId = state.projectId;
      const prjSel = document.getElementById('ctx-project');
      if (prjSel) prjSel.value = state.projectId;
    }
    if (state.role) {
      MimarERP.currentRole = state.role;
      const roleSel = document.getElementById('ctx-role');
      if (roleSel) roleSel.value = state.role;
    }
    applyActiveContext();

    // 2. Restore View
    if (state.view && state.view !== 'dashboard') {
      switchView(state.view);
    }

    // 3. Restore Report type if in reports view
    if (state.reportType && document.getElementById('sel-report-type')) {
      document.getElementById('sel-report-type').value = state.reportType;
      if (typeof renderSelectedReport === 'function') {
        renderSelectedReport(state.reportType);
      }
    }

    // 4. Restore filters and searches
    setTimeout(() => {
      Object.entries(state.filters || {}).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('change'));
        }
      });
      Object.entries(state.searches || {}).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.dispatchEvent(new Event('input'));
        }
      });
    }, 250);

  } catch(e) {
    console.warn("restoreUIState error:", e);
  }
}

// Hook switchView for automatic persistence
const _origSwitchView = window.switchView;
window.switchView = function(viewId) {
  if (typeof _origSwitchView === 'function') _origSwitchView(viewId);
  saveUIState();
};

// Global event listeners for auto-save state
let _saveDebounce = null;
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('change', (e) => {
    if (e.target && typeof e.target.matches === 'function' && e.target.matches('select, input')) {
      clearTimeout(_saveDebounce);
      _saveDebounce = setTimeout(saveUIState, 300);
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target && typeof e.target.matches === 'function' && e.target.matches('input[type="text"], input[type="search"]')) {
      clearTimeout(_saveDebounce);
      _saveDebounce = setTimeout(saveUIState, 500);
    }
  });
}

// =============================================================================
// 2. UNIFIED MODAL ENGINE — نظام Modal موحد قابل للتكوين
// =============================================================================
let _crudModal = null;

function showCrudModal({ title, icon = 'fa-pen-to-square', fields = [], onSave, record = null, saveLabel = 'حفظ' }) {
  closeCrudModal();
  const id = 'crud-modal-dynamic';
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;';
  overlay.onclick = e => { if (e.target === overlay) closeCrudModal(); };

  const fieldsHTML = fields.map(f => {
    const val = record ? (record[f.key] ?? '') : (f.default ?? '');
    const req = f.required ? 'required' : '';
    let input = '';
    if (f.type === 'select') {
      const opts = f.options.map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const lbl = typeof o === 'object' ? o.label : o;
        return `<option value="${v}" ${val == v ? 'selected':''}>${lbl}</option>`;
      }).join('');
      input = `<select id="crud-field-${f.key}" class="filter-dropdown" style="width:100%;" ${req}>${opts}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea id="crud-field-${f.key}" class="form-control" rows="2" ${req} placeholder="${f.placeholder||''}">${val}</textarea>`;
    } else if (f.type === 'number') {
      input = `<input type="number" id="crud-field-${f.key}" class="form-control" value="${val}" step="${f.step||'any'}" min="${f.min||''}" ${req} placeholder="${f.placeholder||''}">`;
    } else if (f.type === 'date') {
      input = `<input type="date" id="crud-field-${f.key}" class="form-control" value="${val}" ${req}>`;
    } else {
      input = `<input type="text" id="crud-field-${f.key}" class="form-control" value="${val}" ${req} placeholder="${f.placeholder||''}">`;
    }
    const span = f.required ? ' <span style="color:var(--red)">*</span>' : '';
    return `<div class="form-group" style="margin-bottom:12px;${f.span2?'grid-column:span 2;':''}">
      <label style="font-size:12px;font-weight:700;color:var(--navy);display:block;margin-bottom:4px;">${f.label}${span}</label>
      ${input}
    </div>`;
  }).join('');

  const cols = fields.length > 4 ? '1fr 1fr' : '1fr';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:90%;max-width:600px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;max-height:90vh;display:flex;flex-direction:column;" onclick="event.stopPropagation()">
      <div class="modal-header" style="background:linear-gradient(135deg,var(--navy),var(--teal));color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
        <h3 style="margin:0;font-size:15px;font-weight:800;"><i class="fas ${icon}" style="margin-left:8px;"></i>${title}</h3>
        <button onclick="closeCrudModal()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div id="crud-modal-error" style="display:none;background:var(--red-bg);color:var(--red);padding:10px 20px;font-size:13px;font-weight:700;"></div>
      <div class="modal-body" style="padding:20px;overflow-y:auto;flex:1;">
        <div style="display:grid;grid-template-columns:${cols};gap:0 16px;">${fieldsHTML}</div>
      </div>
      <div class="modal-footer" style="padding:16px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;">
        <button class="btn btn-secondary" onclick="closeCrudModal()">إلغاء</button>
        <button class="btn btn-primary" id="crud-save-btn" onclick="executeCrudSave()">
          <i class="fas fa-check"></i> ${saveLabel}
        </button>
      </div>
    </div>`;
  _crudModal = { overlay, fields, onSave, record };
  document.body.appendChild(overlay);
}

function closeCrudModal() {
  if (_crudModal) { _crudModal.overlay.remove(); _crudModal = null; }
}

function executeCrudSave() {
  if (!_crudModal) return;
  const { fields, onSave } = _crudModal;
  const errEl = document.getElementById('crud-modal-error');
  const data = {};
  let err = null;
  fields.forEach(f => {
    const el = document.getElementById('crud-field-' + f.key);
    if (!el) return;
    const val = el.value.trim();
    if (f.required && !val) { err = `الحقل "${f.label}" إلزامي`; }
    data[f.key] = f.type === 'number' ? (parseFloat(val) || 0) : val;
  });
  if (err) {
    errEl.textContent = '⚠ ' + err;
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  onSave(data);
  closeCrudModal();
}

// =============================================================================
// 3. CONFIRM DELETE DIALOG — نافذة تأكيد الحذف
// =============================================================================
function confirmDelete(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:28px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--red-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <i class="fas fa-trash-can" style="font-size:24px;color:var(--red);"></i>
      </div>
      <h3 style="font-size:16px;font-weight:800;color:var(--navy);margin-bottom:8px;">تأكيد الحذف</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:20px;">${message}</p>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn btn-secondary" onclick="this.closest('div[style]').remove()">إلغاء</button>
        <button class="btn" style="background:var(--red);color:#fff;" id="confirm-del-btn">
          <i class="fas fa-trash-can"></i> تأكيد الحذف
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-del-btn').onclick = () => {
    overlay.remove();
    onConfirm();
  };
}

// =============================================================================
// 4. COMPANIES — CRUD كامل
// =============================================================================
function openAddCompanyModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات الشركة' : 'إضافة شركة جديدة',
    icon: 'fa-building',
    record,
    fields: [
      { key: 'company_name_ar', label: 'اسم الشركة (عربي)', required: true, placeholder: 'مثال: شركة معمار للمقاولات' },
      { key: 'company_name_en', label: 'Company Name (English)', placeholder: 'Mimar Contracting Co.' },
      { key: 'company_code', label: 'كود الشركة', required: true, placeholder: 'MC-01' },
      { key: 'cr_number', label: 'رقم السجل التجاري', placeholder: '1010XXXXXXX' },
      { key: 'vat_number', label: 'الرقم الضريبي (VAT)', placeholder: '30XXXXXXXXXX' },
      { key: 'city', label: 'المدينة', placeholder: 'الرياض' },
      { key: 'phone', label: 'رقم الهاتف', placeholder: '+966-11-XXXXXXX' },
      { key: 'email', label: 'البريد الإلكتروني', placeholder: 'info@company.com' },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل بيانات الشركة بنجاح ✓');
      } else {
        data.company_id = 'CO-' + Date.now();
        MimarERP.companies.push(data);
        showToast('تمت إضافة الشركة بنجاح ✓');
      }
      saveToLocalStorage(); renderCompaniesTable(); populateCompanyDropdown();
    }
  });
}

function deleteCompany(companyId) {
  const co = MimarERP.companies.find(c => c.company_id === companyId);
  if (!co) return;
  confirmDelete(`هل أنت متأكد من حذف الشركة "<strong>${co.company_name_ar}</strong>"؟`, () => {
    MimarERP.companies = MimarERP.companies.filter(c => c.company_id !== companyId);
    saveToLocalStorage(); renderCompaniesTable(); populateCompanyDropdown();
    showToast('تم حذف الشركة بنجاح');
  });
}

// =============================================================================
// 5. PROJECTS — CRUD كامل
// =============================================================================
function openAddProjectModal(record = null) {
  const companyOpts = MimarERP.companies.map(c => ({ value: c.company_id, label: c.company_name_ar }));
  const clientOpts = MimarERP.partners.map(p => ({ value: p.partner_id, label: p.partner_name }));
  showCrudModal({
    title: record ? 'تعديل بيانات المشروع' : 'مشروع جديد',
    icon: 'fa-diagram-project',
    record,
    fields: [
      { key: 'project_code', label: 'كود المشروع', required: true, placeholder: 'PRJ-2026' },
      { key: 'project_name_ar', label: 'اسم المشروع (عربي)', required: true, placeholder: 'مشروع فيلا ...' },
      { key: 'company_id', label: 'الشركة المنفذة', type: 'select', required: true, options: companyOpts },
      { key: 'client_id', label: 'العميل', type: 'select', options: clientOpts },
      { key: 'contract_type', label: 'نوع العقد', type: 'select', options: ['Lump Sum','Unit Price','Cost Plus','Design & Build','FIDIC Red','FIDIC Yellow'] },
      { key: 'contract_value', label: 'قيمة العقد (ر.س)', type: 'number', required: true, min: 0 },
      { key: 'start_date', label: 'تاريخ البدء', type: 'date' },
      { key: 'end_date', label: 'تاريخ الانتهاء', type: 'date' },
      { key: 'location', label: 'الموقع / المنطقة', placeholder: 'الرياض — حي الملقا' },
      { key: 'status', label: 'حالة المشروع', type: 'select', options: ['جاري التنفيذ','قيد التخطيط','منجز','متوقف','ضمان'] },
      { key: 'retention_pct', label: 'نسبة الضمان %', type: 'number', min: 0, max: 15, default: 5 },
      { key: 'advance_payment_pct', label: 'نسبة الدفعة المقدمة %', type: 'number', min: 0, max: 30, default: 10, span2: true },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل بيانات المشروع بنجاح ✓');
      } else {
        data.project_id = 'PRJ-' + Date.now();
        MimarERP.projects.push(data);
        showToast('تمت إضافة المشروع بنجاح ✓');
      }
      saveToLocalStorage(); renderProjectsTable(); populateProjectDropdown();
    }
  });
}

function deleteProject(projectId) {
  const p = MimarERP.projects.find(x => x.project_id === projectId);
  if (!p) return;
  confirmDelete(`حذف مشروع "<strong>${p.project_name_ar}</strong>" سيؤثر على جميع البيانات المرتبطة. المتابعة؟`, () => {
    MimarERP.projects = MimarERP.projects.filter(x => x.project_id !== projectId);
    saveToLocalStorage(); renderProjectsTable(); populateProjectDropdown();
    showToast('تم حذف المشروع');
  });
}

// =============================================================================
// 6. PARTNERS / CLIENTS — CRUD كامل
// =============================================================================
function openAddPartnerModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات الشريك / العميل' : 'إضافة شريك / عميل جديد',
    icon: 'fa-handshake',
    record,
    fields: [
      { key: 'partner_name', label: 'الاسم التجاري', required: true, placeholder: 'شركة ...' },
      { key: 'partner_type', label: 'نوع الشريك', type: 'select', required: true, options: ['مالك (Client)','استشاري (Consultant)','مقاول باطن','مورد','جهة حكومية'] },
      { key: 'cr_number', label: 'رقم السجل التجاري', placeholder: '1010XXXXXXX' },
      { key: 'vat_number', label: 'الرقم الضريبي', placeholder: '30XXXXXXXXXX' },
      { key: 'contact_person', label: 'مسؤول التواصل', placeholder: 'م. أحمد ...' },
      { key: 'phone', label: 'الهاتف', placeholder: '+966-5XXXXXXXX' },
      { key: 'email', label: 'البريد الإلكتروني', placeholder: 'contact@...' },
      { key: 'city', label: 'المدينة', placeholder: 'الرياض' },
      { key: 'payment_terms', label: 'شروط الدفع (أيام)', type: 'number', default: 30 },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل بيانات الشريك ✓');
      } else {
        data.partner_id = 'PTR-' + Date.now();
        MimarERP.partners.push(data);
        showToast('تمت إضافة الشريك بنجاح ✓');
      }
      saveToLocalStorage(); renderPartnersTable();
    }
  });
}

function deletePartner(partnerId) {
  const p = MimarERP.partners.find(x => x.partner_id === partnerId);
  if (!p) return;
  confirmDelete(`حذف الشريك "<strong>${p.partner_name}</strong>"؟`, () => {
    MimarERP.partners = MimarERP.partners.filter(x => x.partner_id !== partnerId);
    saveToLocalStorage(); renderPartnersTable();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 7. HR EMPLOYEES — CRUD كامل
// =============================================================================
function openAddEmployeeModal(record = null) {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل بيانات الموظف' : 'تسجيل موظف جديد',
    icon: 'fa-user-tie',
    record,
    fields: [
      { key: 'emp_id', label: 'الرقم الوظيفي', required: true, placeholder: 'EMP-001' },
      { key: 'name_ar', label: 'الاسم الكامل', required: true, placeholder: 'م. أحمد عبدالله ...' },
      { key: 'job_title', label: 'المسمى الوظيفي', required: true, placeholder: 'مهندس موقع' },
      { key: 'department', label: 'القسم', type: 'select', options: ['الهندسة','المشتريات','المالية','الإدارة','الموارد البشرية','تقنية المعلومات','مواقع'] },
      { key: 'project_id', label: 'المشروع المعين', type: 'select', options: [{ value: '', label: 'المقر الرئيسي' }, ...projOpts] },
      { key: 'nationality', label: 'الجنسية', placeholder: 'سعودي' },
      { key: 'iqama_id', label: 'رقم الإقامة / الهوية', placeholder: '10XXXXXXXXX' },
      { key: 'contract_type', label: 'نوع العقد', type: 'select', options: ['دائم','مؤقت','مشروع','تدريب'] },
      { key: 'hire_date', label: 'تاريخ التعيين', type: 'date' },
      { key: 'contract_end', label: 'انتهاء العقد', type: 'date' },
      { key: 'basic_salary', label: 'الراتب الأساسي (ر.س)', type: 'number', required: true, min: 0 },
      { key: 'housing_allowance', label: 'بدل السكن (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'status', label: 'الحالة', type: 'select', options: ['نشط','في إجازة','منتهي الخدمة','موقوف'] },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل بيانات الموظف ✓');
      } else {
        MimarERP.hrEmployees = MimarERP.hrEmployees || [];
        MimarERP.hrEmployees.push(data);
        showToast('تمت إضافة الموظف بنجاح ✓');
      }
      saveToLocalStorage(); renderHRTable();
    }
  });
}

function deleteEmployee(empId) {
  const e = (MimarERP.hrEmployees || []).find(x => x.emp_id === empId);
  if (!e) return;
  confirmDelete(`حذف سجل الموظف "<strong>${e.name_ar}</strong>"؟`, () => {
    MimarERP.hrEmployees = MimarERP.hrEmployees.filter(x => x.emp_id !== empId);
    saveToLocalStorage(); renderHRTable();
    showToast('تم حذف سجل الموظف');
  });
}

// =============================================================================
// 8. EQUIPMENT — CRUD كامل
// =============================================================================
function openAddEquipmentModal(record = null) {
  const projOpts = [{ value: '', label: 'بدون تخصيص' }, ...MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }))];
  showCrudModal({
    title: record ? 'تعديل سجل المعدة' : 'تسجيل معدة جديدة',
    icon: 'fa-truck-monster',
    record,
    fields: [
      { key: 'equipment_id', label: 'كود المعدة', required: true, placeholder: 'EQ-001' },
      { key: 'name', label: 'اسم المعدة', required: true, placeholder: 'جرافة كاتربيلار' },
      { key: 'type', label: 'النوع / الفئة', type: 'select', options: ['حفر وجرف','رفع ونقل','خلط وصب','ضخ ومعالجة','كهرباء وجيلات','نقل وشحن','أخرى'] },
      { key: 'brand', label: 'الماركة', placeholder: 'Caterpillar / Komatsu / XCMG' },
      { key: 'model', label: 'الموديل', placeholder: 'CAT 320D' },
      { key: 'plate_number', label: 'رقم اللوحة', placeholder: 'ABC 1234' },
      { key: 'assigned_project', label: 'المشروع المعين', type: 'select', options: projOpts },
      { key: 'daily_rate', label: 'الإيجار اليومي (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'status', label: 'الحالة التشغيلية', type: 'select', options: ['تشغيل','صيانة','متوقف','مؤجر للخارج','مباع'] },
      { key: 'next_maintenance', label: 'موعد الصيانة القادمة', type: 'date' },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل سجل المعدة ✓');
      } else {
        MimarERP.equipmentMaster = MimarERP.equipmentMaster || [];
        MimarERP.equipmentMaster.push(data);
        showToast('تمت إضافة المعدة ✓');
      }
      saveToLocalStorage(); renderEquipmentTable();
    }
  });
}

function deleteEquipment(eqId) {
  const eq = (MimarERP.equipmentMaster || []).find(x => x.equipment_id === eqId);
  if (!eq) return;
  confirmDelete(`حذف سجل المعدة "<strong>${eq.name}</strong>"؟`, () => {
    MimarERP.equipmentMaster = MimarERP.equipmentMaster.filter(x => x.equipment_id !== eqId);
    saveToLocalStorage(); renderEquipmentTable();
    showToast('تم حذف سجل المعدة');
  });
}

// =============================================================================
// 9. PROCUREMENT ORDERS — CRUD كامل
// =============================================================================
function openAddProcurementModal(record = null) {
  const supplierOpts = (MimarERP.suppliersMaster || []).map(s => ({ value: s.supplier_id || s.name, label: s.name || s.supplier_name }));
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل أمر الشراء' : 'أمر شراء جديد',
    icon: 'fa-cart-plus',
    record,
    fields: [
      { key: 'po_number', label: 'رقم أمر الشراء', required: true, placeholder: 'PO-2026-001' },
      { key: 'project_id', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'supplier', label: 'المورد', type: 'select', required: true, options: supplierOpts.length ? supplierOpts : ['مورد 1','مورد 2'] },
      { key: 'item_description', label: 'وصف المواد / الخدمات', required: true, placeholder: 'خردة حديد تسليح ⌀16' },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['طن','متر مكعب','متر مربع','متر طولي','قطعة','لتر','كيلو'] },
      { key: 'quantity', label: 'الكمية', type: 'number', required: true, min: 0.01 },
      { key: 'unit_price', label: 'سعر الوحدة (ر.س)', type: 'number', required: true, min: 0 },
      { key: 'delivery_date', label: 'تاريخ التسليم المطلوب', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['مسودة','معتمد','قيد التوريد','مستلم جزئياً','مكتمل','ملغى'] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', span2: true },
    ],
    onSave(data) {
      data.total = (data.quantity || 0) * (data.unit_price || 0);
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل أمر الشراء ✓');
      } else {
        MimarERP.priceComparisonMaster = MimarERP.priceComparisonMaster || [];
        MimarERP.priceComparisonMaster.push(data);
        showToast('تمت إضافة أمر الشراء ✓');
      }
      saveToLocalStorage(); renderProcurementTable();
    }
  });
}

function deleteProcurement(poNum) {
  const list = MimarERP.priceComparisonMaster || [];
  const item = list.find(x => x.po_number === poNum);
  if (!item) return;
  confirmDelete(`حذف أمر الشراء "<strong>${poNum}</strong>"؟`, () => {
    MimarERP.priceComparisonMaster = list.filter(x => x.po_number !== poNum);
    saveToLocalStorage(); renderProcurementTable();
    showToast('تم حذف أمر الشراء');
  });
}

// =============================================================================
// 10. INVENTORY LEDGER — CRUD كامل
// =============================================================================
function openAddInventoryModal(record = null) {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل حركة المخزون' : 'قيد مخزون جديد',
    icon: 'fa-boxes-stacked',
    record,
    fields: [
      { key: 'txn_id', label: 'رقم الحركة', required: true, placeholder: 'INV-2026-001' },
      { key: 'project_id', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'material', label: 'اسم المادة', required: true, placeholder: 'أسمنت / حديد / بلاط ...' },
      { key: 'category', label: 'الفئة', type: 'select', options: ['مواد إنشائية','تشطيبات','كهرباء','سباكة','عزل','معدات وأدوات','أخرى'] },
      { key: 'txn_type', label: 'نوع الحركة', type: 'select', required: true, options: ['استلام من مورد','صرف للموقع','مرتجع من الموقع','تحويل بين مواقع','هالك / فاقد'] },
      { key: 'quantity', label: 'الكمية', type: 'number', required: true, min: 0.001 },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['طن','متر مكعب','متر مربع','قطعة','لتر','كيس','رول'] },
      { key: 'unit_cost', label: 'تكلفة الوحدة (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'txn_date', label: 'تاريخ الحركة', type: 'date' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', span2: true },
    ],
    onSave(data) {
      data.total_cost = (data.quantity || 0) * (data.unit_cost || 0);
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل قيد المخزون ✓');
      } else {
        MimarERP.inventoryLedger = MimarERP.inventoryLedger || [];
        MimarERP.inventoryLedger.push(data);
        showToast('تمت إضافة حركة المخزون ✓');
      }
      saveToLocalStorage(); renderInventoryTable();
    }
  });
}

function deleteInventory(txnId) {
  const item = (MimarERP.inventoryLedger || []).find(x => x.txn_id === txnId);
  if (!item) return;
  confirmDelete(`حذف حركة المخزون "<strong>${txnId}</strong>"؟`, () => {
    MimarERP.inventoryLedger = MimarERP.inventoryLedger.filter(x => x.txn_id !== txnId);
    saveToLocalStorage(); renderInventoryTable();
    showToast('تم حذف القيد');
  });
}

// =============================================================================
// 11. SUBCONTRACTS — CRUD كامل
// =============================================================================
function openAddSubcontractModal(record = null) {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  const ctOpts = (MimarERP.contractorsMaster || []).map(c => ({ value: c.contractor_id || c.name, label: c.name }));
  showCrudModal({
    title: record ? 'تعديل عقد المقاول الباطن' : 'عقد مقاول باطن جديد',
    icon: 'fa-file-contract',
    record,
    fields: [
      { key: 'subcontract_id', label: 'رقم العقد', required: true, placeholder: 'SC-2026-001' },
      { key: 'project_id', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'contractor', label: 'المقاول الباطن', type: 'select', required: true, options: ctOpts.length ? ctOpts : ['مقاول 1','مقاول 2'] },
      { key: 'scope', label: 'نطاق الأعمال', required: true, placeholder: 'أعمال الحفر والردم' },
      { key: 'contract_type', label: 'نوع العقد', type: 'select', options: ['مقايضة (Lump Sum)','سعر وحدة (Unit Price)','تكلفة + ربح'] },
      { key: 'contract_value', label: 'قيمة العقد (ر.س)', type: 'number', required: true, min: 0 },
      { key: 'retention_pct', label: 'نسبة الضمان %', type: 'number', min: 0, max: 15, default: 10 },
      { key: 'start_date', label: 'تاريخ البدء', type: 'date' },
      { key: 'end_date', label: 'تاريخ الانتهاء', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['نشط','منجز','موقوف','ملغى'] },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل عقد المقاول ✓');
      } else {
        MimarERP.subcontractsMaster = MimarERP.subcontractsMaster || [];
        MimarERP.subcontractsMaster.push(data);
        showToast('تمت إضافة عقد المقاول ✓');
      }
      saveToLocalStorage(); renderSubcontractsTable();
    }
  });
}

function deleteSubcontract(scId) {
  const item = (MimarERP.subcontractsMaster || []).find(x => x.subcontract_id === scId);
  if (!item) return;
  confirmDelete(`حذف عقد المقاول الباطن "<strong>${scId}</strong>"؟`, () => {
    MimarERP.subcontractsMaster = MimarERP.subcontractsMaster.filter(x => x.subcontract_id !== scId);
    saveToLocalStorage(); renderSubcontractsTable();
    showToast('تم حذف العقد');
  });
}

// =============================================================================
// 12. CRM OPPORTUNITIES — CRUD كامل
// =============================================================================
function openAddCRMModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل الفرصة التجارية' : 'فرصة تجارية جديدة',
    icon: 'fa-handshake-angle',
    record,
    fields: [
      { key: 'opp_id', label: 'رقم الفرصة', required: true, placeholder: 'OPP-2026-001' },
      { key: 'opp_name', label: 'اسم الفرصة / المشروع', required: true, placeholder: 'مشروع فيلا ...' },
      { key: 'client_name', label: 'اسم العميل', required: true, placeholder: 'شركة / شخص ...' },
      { key: 'sector', label: 'القطاع', type: 'select', options: ['سكني','تجاري','صناعي','بنية تحتية','صحة وتعليم','ترفيه','حكومي'] },
      { key: 'estimated_value', label: 'القيمة التقديرية (ر.س)', type: 'number', min: 0 },
      { key: 'probability_pct', label: 'احتمالية الفوز %', type: 'number', min: 0, max: 100, default: 50 },
      { key: 'stage', label: 'مرحلة المبيعات', type: 'select', options: ['جديدة','استفسار مبدئي','تقديم عرض','مفاوضات','فاز','خسر'] },
      { key: 'owner', label: 'مسؤول الفرصة', placeholder: 'م. ...' },
      { key: 'expected_close', label: 'تاريخ إغلاق متوقع', type: 'date' },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', span2: true },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل الفرصة ✓');
      } else {
        MimarERP.crmOpportunities = MimarERP.crmOpportunities || [];
        MimarERP.crmOpportunities.push(data);
        showToast('تمت إضافة الفرصة ✓');
      }
      saveToLocalStorage(); renderCRMTable();
    }
  });
}

function deleteCRMOpp(oppId) {
  const item = (MimarERP.crmOpportunities || []).find(x => x.opp_id === oppId);
  if (!item) return;
  confirmDelete(`حذف الفرصة "<strong>${item.opp_name}</strong>"؟`, () => {
    MimarERP.crmOpportunities = MimarERP.crmOpportunities.filter(x => x.opp_id !== oppId);
    saveToLocalStorage(); renderCRMTable();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 13. TENDERS — CRUD كامل
// =============================================================================
function openAddTenderModal(record = null) {
  showCrudModal({
    title: record ? 'تعديل بيانات المناقصة' : 'مناقصة جديدة',
    icon: 'fa-gavel',
    record,
    fields: [
      { key: 'tender_id', label: 'رقم المناقصة', required: true, placeholder: 'TND-2026-001' },
      { key: 'tender_name', label: 'عنوان المناقصة', required: true, placeholder: 'مشروع ...' },
      { key: 'owner', label: 'جهة الطرح', required: true, placeholder: 'وزارة / شركة ...' },
      { key: 'tender_type', label: 'نوع المناقصة', type: 'select', options: ['عامة','محدودة','مباشرة','بالمقايضة'] },
      { key: 'estimated_value', label: 'القيمة التقديرية (ر.س)', type: 'number', min: 0 },
      { key: 'submission_deadline', label: 'الموعد النهائي للتقديم', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوحة','قيد الدراسة','تم التقديم','فاز','خسر','ملغاة'] },
      { key: 'owner_budget', label: 'ميزانية المالك (ر.س)', type: 'number', min: 0 },
      { key: 'notes', label: 'ملاحظات / استراتيجية', type: 'textarea', span2: true },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل بيانات المناقصة ✓');
      } else {
        MimarERP.tendersMaster = MimarERP.tendersMaster || [];
        MimarERP.tendersMaster.push(data);
        showToast('تمت إضافة المناقصة ✓');
      }
      saveToLocalStorage(); renderTendersTable();
    }
  });
}

function deleteTender(tenderId) {
  const item = (MimarERP.tendersMaster || []).find(x => x.tender_id === tenderId);
  if (!item) return;
  confirmDelete(`حذف المناقصة "<strong>${item.tender_name}</strong>"؟`, () => {
    MimarERP.tendersMaster = MimarERP.tendersMaster.filter(x => x.tender_id !== tenderId);
    saveToLocalStorage(); renderTendersTable();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 14. PAYROLL — CRUD كامل
// =============================================================================
function openAddPayrollModal(record = null) {
  const empOpts = (MimarERP.hrEmployees || []).map(e => ({ value: e.emp_id, label: e.name_ar + ' — ' + e.emp_id }));
  showCrudModal({
    title: record ? 'تعديل سجل الراتب' : 'صرف راتب جديد',
    icon: 'fa-money-bill-wave',
    record,
    fields: [
      { key: 'payroll_id', label: 'رقم السجل', required: true, placeholder: 'PAY-2026-001' },
      { key: 'emp_id', label: 'الموظف', type: 'select', required: true, options: empOpts.length ? empOpts : [{ value: '', label: 'لا يوجد موظفون' }] },
      { key: 'period', label: 'الفترة (شهر/سنة)', required: true, placeholder: 'نوفمبر 2026' },
      { key: 'basic_salary', label: 'الراتب الأساسي (ر.س)', type: 'number', required: true, min: 0 },
      { key: 'housing_allowance', label: 'بدل السكن (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'transport_allowance', label: 'بدل المواصلات (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'overtime', label: 'العمل الإضافي (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'deductions', label: 'الخصومات (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'gosi_emp', label: 'التأمينات (موظف 10%)', type: 'number', min: 0, default: 0 },
      { key: 'payment_date', label: 'تاريخ الصرف', type: 'date' },
      { key: 'payment_method', label: 'طريقة الدفع', type: 'select', options: ['تحويل بنكي (IBAN)','نقداً','شيك'] },
      { key: 'status', label: 'الحالة', type: 'select', options: ['مسودة','معتمد','مصروف'] },
    ],
    onSave(data) {
      data.net_salary = (data.basic_salary || 0) + (data.housing_allowance || 0) + (data.transport_allowance || 0) + (data.overtime || 0) - (data.deductions || 0) - (data.gosi_emp || 0);
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل سجل الراتب ✓');
      } else {
        MimarERP.payrollRecords = MimarERP.payrollRecords || [];
        MimarERP.payrollRecords.push(data);
        showToast('تمت إضافة سجل الراتب ✓');
      }
      saveToLocalStorage(); renderPayrollTable();
    }
  });
}

function deletePayroll(payId) {
  const item = (MimarERP.payrollRecords || []).find(x => x.payroll_id === payId);
  if (!item) return;
  confirmDelete(`حذف سجل راتب "<strong>${payId}</strong>"؟`, () => {
    MimarERP.payrollRecords = MimarERP.payrollRecords.filter(x => x.payroll_id !== payId);
    saveToLocalStorage(); renderPayrollTable();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 15. COST CONTROL — CRUD كامل
// =============================================================================
function openAddCostControlModal(record = null) {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل قيد مراقبة التكلفة' : 'قيد مراقبة تكلفة جديد',
    icon: 'fa-chart-pie',
    record,
    fields: [
      { key: 'cost_id', label: 'رقم القيد', required: true, placeholder: 'CC-2026-001' },
      { key: 'project_id', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'wbs_code', label: 'كود WBS', placeholder: 'WBS-01' },
      { key: 'description', label: 'وصف بند التكلفة', required: true, placeholder: 'مواد الخرسانة ...' },
      { key: 'cost_type', label: 'نوع التكلفة', type: 'select', options: ['مواد مباشرة','عمالة مباشرة','معدات','مقاولو باطن','تكاليف عامة','أخرى'] },
      { key: 'budgeted_cost', label: 'التكلفة المدرجة في الميزانية', type: 'number', min: 0 },
      { key: 'committed_cost', label: 'التكلفة الملتزم بها', type: 'number', min: 0, default: 0 },
      { key: 'actual_cost', label: 'التكلفة الفعلية (AC)', type: 'number', min: 0, default: 0 },
      { key: 'forecast_cost', label: 'التكلفة المتوقعة (EAC)', type: 'number', min: 0, default: 0 },
      { key: 'period', label: 'الفترة', placeholder: 'نوفمبر 2026' },
    ],
    onSave(data) {
      data.variance = (data.budgeted_cost || 0) - (data.actual_cost || 0);
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل قيد مراقبة التكلفة ✓');
      } else {
        MimarERP.costControlRegister = MimarERP.costControlRegister || [];
        MimarERP.costControlRegister.push(data);
        showToast('تمت الإضافة ✓');
      }
      saveToLocalStorage(); renderCostControlTable();
    }
  });
}

function deleteCostControl(costId) {
  const item = (MimarERP.costControlRegister || []).find(x => x.cost_id === costId);
  if (!item) return;
  confirmDelete(`حذف قيد مراقبة التكلفة "<strong>${costId}</strong>"؟`, () => {
    MimarERP.costControlRegister = MimarERP.costControlRegister.filter(x => x.cost_id !== costId);
    saveToLocalStorage(); renderCostControlTable();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 16. BOQ ITEMS — CRUD كامل
// =============================================================================
function openAddBOQModal(record = null) {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  const wbsOpts = (MimarERP.wbs || []).map(w => ({ value: w.code || w.id, label: (w.code || w.id) + ' — ' + (w.description || w.name) }));
  showCrudModal({
    title: record ? 'تعديل بند جدول الكميات' : 'إضافة بند BOQ جديد',
    icon: 'fa-table-list',
    record,
    fields: [
      { key: 'item_code', label: 'كود البند', required: true, placeholder: 'BOQ-01-001' },
      { key: 'project_id', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'wbs', label: 'حزمة العمل (WBS)', type: 'select', options: wbsOpts.length ? wbsOpts : ['WBS-01'] },
      { key: 'description', label: 'وصف البند', required: true, placeholder: 'خرسانة عادية C25 ...' },
      { key: 'unit', label: 'الوحدة', type: 'select', options: ['م3','م2','طن','م.ط','قطعة','نفيرة','LS'] },
      { key: 'quantity', label: 'الكمية التعاقدية', type: 'number', required: true, min: 0 },
      { key: 'rate', label: 'السعر (ر.س/وحدة)', type: 'number', required: true, min: 0 },
      { key: 'progress_pct', label: 'نسبة الإنجاز %', type: 'number', min: 0, max: 100, default: 0 },
    ],
    onSave(data) {
      data.total = (data.quantity || 0) * (data.rate || 0);
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل بند BOQ ✓');
      } else {
        MimarERP.boq = MimarERP.boq || [];
        MimarERP.boq.push(data);
        showToast('تمت إضافة البند ✓');
      }
      saveToLocalStorage(); renderWBSBOQTree();
    }
  });
}

function deleteBOQItem(itemCode) {
  const item = (MimarERP.boq || []).find(x => x.item_code === itemCode);
  if (!item) return;
  confirmDelete(`حذف بند BOQ "<strong>${itemCode}</strong>"؟`, () => {
    MimarERP.boq = MimarERP.boq.filter(x => x.item_code !== itemCode);
    saveToLocalStorage(); renderWBSBOQTree();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 17. FINANCE — Billings & AP CRUD
// =============================================================================
function openAddBillingModal(record = null) {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: record ? 'تعديل المستخلص' : 'إصدار مستخلص جديد',
    icon: 'fa-file-invoice-dollar',
    record,
    fields: [
      { key: 'billing_id', label: 'رقم المستخلص', required: true, placeholder: 'IPC-001' },
      { key: 'project_id', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'period', label: 'الفترة', placeholder: 'نوفمبر 2026' },
      { key: 'amount', label: 'المبلغ المطالب (ر.س)', type: 'number', required: true, min: 0 },
      { key: 'certified_amount', label: 'المبلغ المعتمد (ر.س)', type: 'number', min: 0, default: 0 },
      { key: 'submission_date', label: 'تاريخ التقديم', type: 'date' },
      { key: 'approval_date', label: 'تاريخ الموافقة', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['مسودة','مقدم','قيد المراجعة','معتمد','مدفوع جزئياً','مدفوع بالكامل','مرفوض'] },
    ],
    onSave(data) {
      if (record) {
        Object.assign(record, data);
        showToast('تم تعديل المستخلص ✓');
      } else {
        MimarERP.financeBillings = MimarERP.financeBillings || [];
        MimarERP.financeBillings.push(data);
        showToast('تمت إضافة المستخلص ✓');
      }
      saveToLocalStorage(); renderFinanceTabs();
    }
  });
}

function deleteBilling(billingId) {
  const item = (MimarERP.financeBillings || []).find(x => x.billing_id === billingId);
  if (!item) return;
  confirmDelete(`حذف المستخلص "<strong>${billingId}</strong>"؟`, () => {
    MimarERP.financeBillings = MimarERP.financeBillings.filter(x => x.billing_id !== billingId);
    saveToLocalStorage(); renderFinanceTabs();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 18. SITE DIARY — CRUD (Edit + Delete)
// =============================================================================
function editSiteDiaryEntry(entryId) {
  const entry = (MimarERP.siteDiaryLogs || []).find(x => x.id === entryId || x.date === entryId);
  if (!entry) return;
  showCrudModal({
    title: 'تعديل سجل اليومية',
    icon: 'fa-calendar-pen',
    record: entry,
    fields: [
      { key: 'date', label: 'التاريخ', type: 'date', required: true },
      { key: 'weather', label: 'حالة الطقس', type: 'select', options: ['صافٍ','غائم جزئياً','غائم','مطر خفيف','رياح قوية','حار جداً','غبار','ضباب'] },
      { key: 'temp_max', label: 'درجة الحرارة القصوى', type: 'number' },
      { key: 'manpower_count', label: 'عدد العمالة الحضور', type: 'number', min: 0 },
      { key: 'activities', label: 'الأنشطة المنفذة', type: 'textarea', required: true, span2: true },
      { key: 'problems', label: 'المشكلات والعقبات', type: 'textarea', span2: true },
      { key: 'instructions', label: 'التعليمات الصادرة', type: 'textarea', span2: true },
    ],
    onSave(data) {
      Object.assign(entry, data);
      saveToLocalStorage(); renderSiteDiary();
      showToast('تم تعديل سجل اليومية ✓');
    }
  });
}

function deleteSiteDiaryEntry(entryId) {
  const idx = (MimarERP.siteDiaryLogs || []).findIndex(x => x.id === entryId || x.date === entryId);
  if (idx === -1) return;
  const entry = MimarERP.siteDiaryLogs[idx];
  confirmDelete(`حذف سجل يومية "<strong>${entry.date}</strong>"؟`, () => {
    MimarERP.siteDiaryLogs.splice(idx, 1);
    saveToLocalStorage(); renderSiteDiary();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 19. PUNCH LIST — Edit + Delete
// =============================================================================
function editPunchItem(itemId) {
  const item = (MimarERP.punchListItems || []).find(x => x.id === itemId || x.punch_id === itemId);
  if (!item) return;
  showCrudModal({
    title: 'تعديل بند Punch List',
    icon: 'fa-clipboard-check',
    record: item,
    fields: [
      { key: 'description', label: 'وصف البند', required: true, type: 'textarea', span2: true },
      { key: 'location', label: 'الموقع / المنطقة', placeholder: 'الطابق الثالث — غرفة 301' },
      { key: 'assigned_to', label: 'المسؤول', placeholder: 'م. أحمد / مقاول التشطيبات' },
      { key: 'priority', label: 'الأولوية', type: 'select', options: ['حرج','مرتفع','متوسط','منخفض'] },
      { key: 'due_date', label: 'تاريخ التسليم', type: 'date' },
      { key: 'status', label: 'الحالة', type: 'select', options: ['مفتوح','قيد المعالجة','مكتمل','مرفوع للمراجعة'] },
      { key: 'notes', label: 'ملاحظات', type: 'textarea', span2: true },
    ],
    onSave(data) {
      Object.assign(item, data);
      saveToLocalStorage(); renderPunchList();
      showToast('تم تعديل البند ✓');
    }
  });
}

function deletePunchItem(itemId) {
  const idx = (MimarERP.punchListItems || []).findIndex(x => x.id === itemId || x.punch_id === itemId);
  if (idx === -1) return;
  confirmDelete('حذف هذا البند من Punch List؟', () => {
    MimarERP.punchListItems.splice(idx, 1);
    saveToLocalStorage(); renderPunchList();
    showToast('تم الحذف');
  });
}

// =============================================================================
// 20. SAFETY INCIDENTS — Edit + Delete
// =============================================================================
function editSafetyIncident(incId) {
  const item = (MimarERP.safetyIncidents || []).find(x => x.id === incId);
  if (!item) return;
  showCrudModal({
    title: 'تعديل سجل الحادثة',
    icon: 'fa-triangle-exclamation',
    record: item,
    fields: [
      { key: 'date', label: 'تاريخ الحادثة', type: 'date', required: true },
      { key: 'type', label: 'نوع الحادثة', type: 'select', options: ['Near Miss','First Aid','LTI','Observation','Fatality'] },
      { key: 'description', label: 'وصف الحادثة', type: 'textarea', required: true, span2: true },
      { key: 'lti', label: 'أيام الغياب (LTI)', type: 'number', min: 0, default: 0 },
      { key: 'action', label: 'الإجراء المتخذ', type: 'textarea', span2: true },
      { key: 'status', label: 'الحالة', type: 'select', options: ['Open','Closed','Under Investigation'] },
    ],
    onSave(data) {
      Object.assign(item, data);
      saveToLocalStorage(); renderSafetyDashboard();
      showToast('تم تعديل سجل الحادثة ✓');
    }
  });
}

function deleteSafetyIncident(incId) {
  const idx = (MimarERP.safetyIncidents || []).findIndex(x => x.id === incId);
  if (idx === -1) return;
  confirmDelete('حذف هذا السجل من سجل الحوادث؟', () => {
    MimarERP.safetyIncidents.splice(idx, 1);
    saveToLocalStorage(); renderSafetyDashboard();
    showToast('تم الحذف');
  });
}

function saveNewSafetyIncident() {
  const projOpts = MimarERP.projects.map(p => ({ value: p.project_id, label: p.project_name_ar }));
  showCrudModal({
    title: 'تسجيل حادثة / ملاحظة HSE',
    icon: 'fa-hard-hat',
    fields: [
      { key: 'id', label: 'رقم الحادثة', required: true, placeholder: 'HSE-2026-005' },
      { key: 'date', label: 'تاريخ الحادثة', type: 'date', required: true },
      { key: 'projectId', label: 'المشروع', type: 'select', required: true, options: projOpts },
      { key: 'type', label: 'نوع الحادثة', type: 'select', options: ['Near Miss','First Aid','LTI','Observation','Fatality'] },
      { key: 'description', label: 'وصف الحادثة', type: 'textarea', required: true, span2: true },
      { key: 'lti', label: 'أيام الغياب (LTI)', type: 'number', min: 0, default: 0 },
      { key: 'action', label: 'الإجراء المتخذ', type: 'textarea', span2: true },
      { key: 'status', label: 'الحالة', type: 'select', options: ['Open','Closed','Under Investigation'], default: 'Open' },
    ],
    onSave(data) {
      MimarERP.safetyIncidents = MimarERP.safetyIncidents || [];
      MimarERP.safetyIncidents.unshift(data);
      saveToLocalStorage(); renderSafetyDashboard();
      showToast('تم تسجيل الحادثة بنجاح ✓');
    }
  });
}

// =============================================================================
// 21. ENHANCED localStorage — Full Data Persistence
// =============================================================================
function saveToLocalStorage() {
  try {
    const saveKeys = [
      'companies','branches','partners','partnerCatalog','projects','wbs','boq',
      'takeoff','rateAnalysis','billing','suppliersMaster','supplierItemsMaster',
      'priceComparisonMaster','contractorsMaster','contractorRatesMaster',
      'costControlRegister','crmOpportunities','tendersMaster','hrEmployees',
      'payrollRecords','financeBillings','financeAP','financeBudget','equipmentMaster',
      'inventoryLedger','subcontractsMaster','bimElements','siteDiaryLogs',
      'punchListItems','rfiList','submittalsList','rebarBBSItems',
      'variationsMaster','cvrLedgerMaster','bimClashesMaster','cdeContainersMaster',
      'safetyIncidents','safetyTrainings','purchaseOrders','scheduleTasks','auditLogs',
      'currentCompanyId','currentProjectId','currentRole'
    ];
    const snap = {};
    saveKeys.forEach(k => { if (MimarERP[k] !== undefined) snap[k] = MimarERP[k]; });
    localStorage.setItem('MimarERPData_v5', JSON.stringify(snap));
    saveUIState();
  } catch(e) {
    console.warn('saveToLocalStorage failed:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('MimarERPData_v5');
    if (!raw) return;
    const snap = JSON.parse(raw);
    Object.assign(MimarERP, snap);
  } catch(e) {
    console.warn('loadFromLocalStorage failed:', e);
  }
}

if (typeof window !== 'undefined') {
  window.saveToLocalStorage = saveToLocalStorage;
  window.loadFromLocalStorage = loadFromLocalStorage;
}

// Auto-load on page ready
(function() {
  loadFromLocalStorage();
  // restore UI state after views render
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(restoreUIState, 300);
    });
  }
})();

// =============================================================================
// 22. ENHANCED TABLE RENDER HELPERS — Add Edit/Delete buttons to all tables
// =============================================================================

// Patch renderCompaniesTable to add Edit/Delete
const _origRenderCompanies = window.renderCompaniesTable;
window.renderCompaniesTable = function() {
  if (typeof _origRenderCompanies === 'function') _origRenderCompanies();
  const tbody = document.getElementById('tbl-companies-body');
  if (!tbody) return;
  // Add action column to header if not present
  const thead = document.querySelector('#tbl-companies thead tr');
  if (thead && !thead.querySelector('.col-actions')) {
    const th = document.createElement('th');
    th.className = 'col-actions'; th.textContent = 'الإجراءات';
    thead.appendChild(th);
  }
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const co = MimarERP.companies[idx];
    if (!co) return;
    const td = document.createElement('td');
    td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" title="تعديل" onclick="openAddCompanyModal(MimarERP.companies[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" title="حذف" onclick="deleteCompany('${co.company_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderProjectsTable
const _origRenderProjects = window.renderProjectsTable;
window.renderProjectsTable = function() {
  if (typeof _origRenderProjects === 'function') _origRenderProjects();
  const tbody = document.getElementById('tbl-projects-body');
  if (!tbody) return;
  const thead = document.querySelector('#tbl-projects thead tr');
  if (thead && !thead.querySelector('.col-actions')) {
    const th = document.createElement('th'); th.className = 'col-actions'; th.textContent = 'الإجراءات'; thead.appendChild(th);
  }
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const p = MimarERP.projects[idx];
    if (!p) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddProjectModal(MimarERP.projects[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteProject('${p.project_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderPartnersTable
const _origRenderPartners = window.renderPartnersTable;
window.renderPartnersTable = function() {
  if (typeof _origRenderPartners === 'function') _origRenderPartners();
  const tbody = document.getElementById('tbl-partners-body');
  if (!tbody) return;
  const thead = document.querySelector('#tbl-partners thead tr');
  if (thead && !thead.querySelector('.col-actions')) {
    const th = document.createElement('th'); th.className = 'col-actions'; th.textContent = 'الإجراءات'; thead.appendChild(th);
  }
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const p = MimarERP.partners[idx];
    if (!p) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddPartnerModal(MimarERP.partners[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deletePartner('${p.partner_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderHRTable
const _origRenderHR = window.renderHRTable;
window.renderHRTable = function() {
  if (typeof _origRenderHR === 'function') _origRenderHR();
  const tbody = document.getElementById('tbl-hr-body');
  if (!tbody) return;
  const thead = document.querySelector('#tbl-hr thead tr');
  if (thead && !thead.querySelector('.col-actions')) {
    const th = document.createElement('th'); th.className = 'col-actions'; th.textContent = 'الإجراءات'; thead.appendChild(th);
  }
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const e = (MimarERP.hrEmployees || [])[idx];
    if (!e) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddEmployeeModal((MimarERP.hrEmployees||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteEmployee('${e.emp_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderEquipmentTable
const _origRenderEq = window.renderEquipmentTable;
window.renderEquipmentTable = function() {
  if (typeof _origRenderEq === 'function') _origRenderEq();
  const tbody = document.getElementById('tbl-equipment-body');
  if (!tbody) return;
  const thead = document.querySelector('#tbl-equipment thead tr');
  if (thead && !thead.querySelector('.col-actions')) {
    const th = document.createElement('th'); th.className = 'col-actions'; th.textContent = 'الإجراءات'; thead.appendChild(th);
  }
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const e = (MimarERP.equipmentMaster || [])[idx];
    if (!e) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddEquipmentModal((MimarERP.equipmentMaster||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteEquipment('${e.equipment_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderCRMTable
const _origRenderCRM = window.renderCRMTable;
window.renderCRMTable = function() {
  if (typeof _origRenderCRM === 'function') _origRenderCRM();
  const tbody = document.getElementById('tbl-crm-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.crmOpportunities || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddCRMModal((MimarERP.crmOpportunities||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteCRMOpp('${item.opp_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderTendersTable
const _origRenderTenders = window.renderTendersTable;
window.renderTendersTable = function() {
  if (typeof _origRenderTenders === 'function') _origRenderTenders();
  const tbody = document.getElementById('tbl-tenders-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.tendersMaster || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddTenderModal((MimarERP.tendersMaster||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteTender('${item.tender_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderPayrollTable
const _origRenderPayroll = window.renderPayrollTable;
window.renderPayrollTable = function() {
  if (typeof _origRenderPayroll === 'function') _origRenderPayroll();
  const tbody = document.getElementById('tbl-payroll-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.payrollRecords || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddPayrollModal((MimarERP.payrollRecords||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deletePayroll('${item.payroll_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderInventoryTable
const _origRenderInv = window.renderInventoryTable;
window.renderInventoryTable = function() {
  if (typeof _origRenderInv === 'function') _origRenderInv();
  const tbody = document.getElementById('tbl-inventory-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.inventoryLedger || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddInventoryModal((MimarERP.inventoryLedger||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteInventory('${item.txn_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderSubcontractsTable
const _origRenderSC = window.renderSubcontractsTable;
window.renderSubcontractsTable = function() {
  if (typeof _origRenderSC === 'function') _origRenderSC();
  const tbody = document.getElementById('tbl-subcontracts-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.subcontractsMaster || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddSubcontractModal((MimarERP.subcontractsMaster||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteSubcontract('${item.subcontract_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderCostControlTable
const _origRenderCC = window.renderCostControlTable;
window.renderCostControlTable = function() {
  if (typeof _origRenderCC === 'function') _origRenderCC();
  const tbody = document.getElementById('tbl-cost-control-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.costControlRegister || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddCostControlModal((MimarERP.costControlRegister||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteCostControl('${item.cost_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderSiteDiary to add Edit/Delete per row
const _origRenderDiary = window.renderSiteDiary;
window.renderSiteDiary = function() {
  if (typeof _origRenderDiary === 'function') _origRenderDiary();
  const tbody = document.getElementById('tbl-diary-body') || document.getElementById('tbl-site-diary-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.siteDiaryLogs || [])[idx];
    if (!item) return;
    const entryId = item.id || item.date;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="editSiteDiaryEntry('${entryId}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteSiteDiaryEntry('${entryId}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderPunchList
const _origRenderPunch = window.renderPunchList;
window.renderPunchList = function() {
  if (typeof _origRenderPunch === 'function') _origRenderPunch();
  const tbody = document.getElementById('tbl-punch-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.punchListItems || [])[idx];
    if (!item) return;
    const itemId = item.id || item.punch_id || idx;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="editPunchItem('${itemId}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deletePunchItem('${itemId}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderSafetyDashboard
const _origRenderSafety = window.renderSafetyDashboard;
window.renderSafetyDashboard = function() {
  if (typeof _origRenderSafety === 'function') _origRenderSafety();
  const tbody = document.getElementById('tbl-safety-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.safetyIncidents || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="editSafetyIncident('${item.id}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteSafetyIncident('${item.id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// Patch renderFinanceTabs — add buttons to billings
const _origRenderFin = window.renderFinanceTabs;
window.renderFinanceTabs = function() {
  if (typeof _origRenderFin === 'function') _origRenderFin();
  const tbody = document.getElementById('tbl-finance-billings-body');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    if (tr.querySelector('.action-btns')) return;
    const item = (MimarERP.financeBillings || [])[idx];
    if (!item) return;
    const td = document.createElement('td'); td.className = 'action-btns';
    td.innerHTML = `<button class="btn btn-sm" onclick="openAddBillingModal((MimarERP.financeBillings||[])[${idx}])"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm" style="color:var(--red)" onclick="deleteBilling('${item.billing_id}')"><i class="fas fa-trash"></i></button>`;
    tr.appendChild(td);
  });
};

// =============================================================================
// 23. ADD BUTTONS to views that lack them
// =============================================================================
function injectAddButtons() {
  const addBtnDefs = [
    { viewId: 'view-cost-control', btnText: 'قيد تكلفة جديد', icon: 'fa-plus', onclick: 'openAddCostControlModal()' },
    { viewId: 'view-crm', btnText: 'فرصة جديدة', icon: 'fa-plus', onclick: 'openAddCRMModal()' },
    { viewId: 'view-hr', btnText: 'موظف جديد', icon: 'fa-user-plus', onclick: 'openAddEmployeeModal()' },
    { viewId: 'view-payroll', btnText: 'صرف راتب', icon: 'fa-plus', onclick: 'openAddPayrollModal()' },
    { viewId: 'view-finance', btnText: 'مستخلص جديد', icon: 'fa-plus', onclick: 'openAddBillingModal()' },
    { viewId: 'view-safety', btnText: 'تسجيل حادثة', icon: 'fa-plus', onclick: 'saveNewSafetyIncident()' },
    { viewId: 'view-procurement', btnText: 'أمر شراء جديد', icon: 'fa-cart-plus', onclick: 'openAddProcurementModal()' },
    { viewId: 'view-subcontracts', btnText: 'عقد مقاول جديد', icon: 'fa-plus', onclick: 'openAddSubcontractModal()' },
  ];

  addBtnDefs.forEach(def => {
    const view = document.getElementById(def.viewId);
    if (!view) return;
    // Find existing add button container or create one
    const header = view.querySelector('div:first-child');
    if (!header) return;
    // Check if button already exists
    if (view.querySelector('[data-crud-add]')) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-sm';
    btn.setAttribute('data-crud-add', '1');
    btn.onclick = new Function(def.onclick);
    btn.innerHTML = `<i class="fas ${def.icon}"></i> ${def.btnText}`;
    // Try to append to header's flex div
    const flexDiv = header.querySelector('div:last-child') || header;
    flexDiv.appendChild(btn);
  });
}

// =============================================================================
// 24. CSS for action buttons
// =============================================================================
(function injectCRUDStyles() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.head) return;
  const style = document.createElement('style');
  style.textContent = `
    .action-btns { white-space:nowrap; }
    .action-btns .btn { padding:3px 8px; font-size:12px; margin-left:4px; }
    .col-actions { width:80px; text-align:center; }
    .form-control { width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:var(--radius); font-size:13px; font-family:inherit; }
    .form-control:focus { outline:none; border-color:var(--teal); box-shadow:0 0 0 2px rgba(13,148,136,.15); }
    #crud-modal-dynamic .modal-overlay { display:flex; }
  `;
  document.head.appendChild(style);
})();

// =============================================================================
// 25. INIT — Run after DOM ready
// =============================================================================
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectAddButtons, 500);
  });
}
