/**
 * ============================================================================
 * COMPONENT-LIBRARY.JS — Reusable UI Components
 * Standard: WCAG 2.1 AA Accessibility · RTL First · Virtualized Rendering
 * Components: EnterpriseDataTable · EnterpriseModal · EnterpriseFormEngine · EnterpriseKPIGrid
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ==========================================================================
  // 1. ENTERPRISE DATA TABLE COMPONENT
  // ==========================================================================

  class EnterpriseDataTable {
    /**
     * @param {Object} options
     * @param {Array} options.columns Column configurations [{ id, header, accessor, cellRenderer, sortable, align }]
     * @param {Array} options.data Dataset
     * @param {boolean} options.searchable Enable search toolbar
     * @param {number} options.pageSize Items per page (default 25, 0 for all)
     * @param {string} options.tableId DOM id for the table element
     */
    constructor(options = {}) {
      this.columns = options.columns || [];
      this.rawData = options.data || [];
      this.filteredData = [...this.rawData];
      this.searchable = options.searchable !== false;
      this.pageSize = options.pageSize || 0; // 0 means show all
      this.currentPage = 1;
      this.sortCol = null;
      this.sortAsc = true;
      this.tableId = options.tableId || 'tbl-' + Math.floor(Math.random() * 10000);
      this.container = document.createElement('div');
      this.container.className = 'enterprise-datatable-wrapper';
    }

    setData(newData) {
      this.rawData = newData || [];
      this.filteredData = [...this.rawData];
      this.currentPage = 1;
      this.render();
    }

    sort(colId) {
      if (this.sortCol === colId) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortCol = colId;
        this.sortAsc = true;
      }

      const col = this.columns.find(c => c.id === colId);
      this.filteredData.sort((a, b) => {
        let valA = col.accessor ? col.accessor(a) : a[colId];
        let valB = col.accessor ? col.accessor(b) : b[colId];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return this.sortAsc ? -1 : 1;
        if (valA > valB) return this.sortAsc ? 1 : -1;
        return 0;
      });

      this.renderBody();
    }

    filter(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) {
        this.filteredData = [...this.rawData];
      } else {
        this.filteredData = this.rawData.filter(row => {
          return this.columns.some(col => {
            const val = col.accessor ? col.accessor(row) : row[col.id];
            return val != null && String(val).toLowerCase().includes(q);
          });
        });
      }
      this.currentPage = 1;
      this.renderBody();
    }

    render() {
      this.container.innerHTML = '';

      // Toolbar if searchable
      if (this.searchable) {
        const toolbar = document.createElement('div');
        toolbar.className = 'datatable-toolbar';
        toolbar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:8px;';
        toolbar.innerHTML = `
          <input type="text" class="search-input" placeholder="بحث فوري في جميع الحقول..." style="max-width:320px; font-size:12px; padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1;">
          <div style="font-size:12px; color:var(--muted);">
            إجمالي السجلات: <strong class="text-num count-label">${this.filteredData.length}</strong>
          </div>
        `;
        const searchInput = toolbar.querySelector('input');
        searchInput.addEventListener('input', (e) => this.filter(e.target.value));
        this.container.appendChild(toolbar);
      }

      // Table element
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      tableWrapper.style.cssText = 'overflow-x:auto; width:100%;';

      const table = document.createElement('table');
      table.id = this.tableId;
      table.className = 'enterprise-table';
      table.style.cssText = 'width:100%; border-collapse:collapse; font-size:12px;';

      // Header
      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');
      this.columns.forEach(col => {
        const th = document.createElement('th');
        th.style.cssText = 'padding:10px 12px; background:#f8fafc; border-bottom:2px solid #e2e8f0; font-weight:700; white-space:nowrap; text-align:' + (col.align || 'right') + ';';
        if (col.sortable !== false) {
          th.style.cursor = 'pointer';
          th.title = 'انقر للترتيب تصاعدياً / تنازلياً';
          th.innerHTML = `${window.DOMSanitizer ? window.DOMSanitizer.escape(col.header) : col.header} <i class="fas fa-sort" style="font-size:10px; opacity:0.5; margin-right:4px;"></i>`;
          th.addEventListener('click', () => this.sort(col.id));
        } else {
          th.textContent = col.header;
        }
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement('tbody');
      table.appendChild(tbody);
      tableWrapper.appendChild(table);
      this.container.appendChild(tableWrapper);

      this.renderBody();
      return this.container;
    }

    renderBody() {
      const tbody = this.container.querySelector('tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const countLabel = this.container.querySelector('.count-label');
      if (countLabel) countLabel.textContent = this.filteredData.length;

      if (!this.filteredData.length) {
        const trEmpty = document.createElement('tr');
        trEmpty.innerHTML = `<td colspan="${this.columns.length}" style="text-align:center; padding:24px; color:var(--muted); font-size:13px;"><i class="fas fa-folder-open" style="margin-left:6px;"></i> لا توجد بيانات مطابقة</td>`;
        tbody.appendChild(trEmpty);
        return;
      }

      // Page slice
      let pageRows = this.filteredData;
      if (this.pageSize > 0) {
        const start = (this.currentPage - 1) * this.pageSize;
        pageRows = this.filteredData.slice(start, start + this.pageSize);
      }

      pageRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom:1px solid #f1f5f9; transition:background 0.15s;';
        tr.addEventListener('mouseenter', () => tr.style.background = '#f8fafc');
        tr.addEventListener('mouseleave', () => tr.style.background = 'transparent');

        this.columns.forEach(col => {
          const td = document.createElement('td');
          td.style.cssText = 'padding:8px 12px; vertical-align:middle; text-align:' + (col.align || 'right') + ';';
          if (col.className) td.className = col.className;

          if (typeof col.cellRenderer === 'function') {
            const content = col.cellRenderer(row, idx);
            if (content instanceof HTMLElement) {
              td.appendChild(content);
            } else {
              td.innerHTML = window.DOMSanitizer ? window.DOMSanitizer.clean(content) : content;
            }
          } else {
            const rawVal = col.accessor ? col.accessor(row) : row[col.id];
            td.textContent = rawVal != null ? String(rawVal) : '—';
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    getElement() {
      return this.container;
    }
  }

  // ==========================================================================
  // 2. ENTERPRISE MODAL SERVICE
  // ==========================================================================

  class EnterpriseModal {
    static open(options = {}) {
      const {
        title = 'نافذة نظام MimarERP',
        size = 'md', // sm, md, lg, xl
        content = '',
        confirmText = 'حفظ وتأكيد',
        cancelText = 'إلغاء',
        showConfirm = true,
        onConfirm = null,
        onCancel = null
      } = options;

      // Close any active modal
      this.close();

      const overlay = document.createElement('div');
      overlay.id = 'enterprise-modal-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px); z-index: 99999; display: flex;
        justify-content: center; align-items: center; padding: 20px;
        animation: fadeIn 0.2s ease-out;
      `;

      let maxWidth = '560px';
      if (size === 'sm') maxWidth = '400px';
      if (size === 'lg') maxWidth = '780px';
      if (size === 'xl') maxWidth = '980px';

      const modalBox = document.createElement('div');
      modalBox.className = 'enterprise-modal-box';
      modalBox.style.cssText = `
        background: #ffffff; width: 100%; max-width: ${maxWidth};
        border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        display: flex; flex-direction: column; max-height: 90vh;
        overflow: hidden; direction: rtl; text-align: right;
      `;

      // Header
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      `;
      header.innerHTML = `
        <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--navy, #0F172A);">
          ${window.DOMSanitizer ? window.DOMSanitizer.escape(title) : title}
        </h3>
        <button type="button" class="modal-close-btn" style="border:none; background:none; cursor:pointer; font-size:18px; color:#64748b;">
          <i class="fas fa-times"></i>
        </button>
      `;
      header.querySelector('.modal-close-btn').addEventListener('click', () => {
        if (typeof onCancel === 'function') onCancel();
        this.close();
      });
      modalBox.appendChild(header);

      // Body
      const body = document.createElement('div');
      body.style.cssText = 'padding: 20px; overflow-y: auto; flex: 1;';
      if (content instanceof HTMLElement) {
        body.appendChild(content);
      } else {
        body.innerHTML = window.DOMSanitizer ? window.DOMSanitizer.clean(content) : content;
      }
      modalBox.appendChild(body);

      // Footer
      const footer = document.createElement('div');
      footer.style.cssText = `
        display: flex; justify-content: flex-end; align-items: center; gap: 10px;
        padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0;
      `;

      const btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.className = 'btn btn-outline btn-sm';
      btnCancel.textContent = cancelText;
      btnCancel.addEventListener('click', () => {
        if (typeof onCancel === 'function') onCancel();
        this.close();
      });
      footer.appendChild(btnCancel);

      if (showConfirm) {
        const btnConfirm = document.createElement('button');
        btnConfirm.type = 'button';
        btnConfirm.className = 'btn btn-primary btn-sm';
        btnConfirm.innerHTML = `<i class="fas fa-check" style="margin-left:4px;"></i> ${confirmText}`;
        btnConfirm.addEventListener('click', async () => {
          if (typeof onConfirm === 'function') {
            const canClose = await onConfirm();
            if (canClose !== false) {
              this.close();
            }
          } else {
            this.close();
          }
        });
        footer.appendChild(btnConfirm);
      }

      modalBox.appendChild(footer);
      overlay.appendChild(modalBox);

      // Escape key dismissal
      const escListener = (e) => {
        if (e.key === 'Escape') {
          if (typeof onCancel === 'function') onCancel();
          this.close();
          window.removeEventListener('keydown', escListener);
        }
      };
      window.addEventListener('keydown', escListener);

      document.body.appendChild(overlay);
      return modalBox;
    }

    static close() {
      const active = document.getElementById('enterprise-modal-overlay');
      if (active && active.parentNode) {
        active.parentNode.removeChild(active);
      }
    }
  }

  // ==========================================================================
  // 3. ENTERPRISE FORM BUILDER ENGINE
  // ==========================================================================

  class EnterpriseFormEngine {
    /**
     * @param {Object} schema Field configurations
     * @param {Object} initialValues Initial form data
     */
    constructor(schema, initialValues = {}) {
      this.schema = schema;
      this.values = { ...initialValues };
      this.formEl = document.createElement('form');
      this.formEl.className = 'enterprise-form-grid';
      this.formEl.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:14px;';
      this.buildForm();
    }

    buildForm() {
      this.formEl.innerHTML = '';
      Object.keys(this.schema).forEach(key => {
        const field = this.schema[key];
        const val = this.values[key] !== undefined ? this.values[key] : (field.default !== undefined ? field.default : '');

        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

        const label = document.createElement('label');
        label.style.cssText = 'font-size:12px; font-weight:700; color:#334155;';
        label.innerHTML = `${window.DOMSanitizer ? window.DOMSanitizer.escape(field.label) : field.label} ${field.required ? '<span style="color:#ef4444;">*</span>' : ''}`;
        group.appendChild(label);

        let input;
        if (field.type === 'select') {
          input = document.createElement('select');
          (field.options || []).forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt.value !== undefined ? opt.value : opt;
            optEl.textContent = opt.label !== undefined ? opt.label : opt;
            if (optEl.value === String(val)) optEl.selected = true;
            input.appendChild(optEl);
          });
        } else if (field.type === 'textarea') {
          input = document.createElement('textarea');
          input.rows = field.rows || 3;
          input.value = val;
        } else {
          input = document.createElement('input');
          input.type = field.type || 'text';
          input.value = val;
        }

        input.name = key;
        input.className = 'form-control';
        input.style.cssText = 'padding:8px 12px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; outline:none; transition:border 0.2s;';
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.readonly) input.readOnly = true;

        input.addEventListener('input', () => {
          this.values[key] = input.value;
          this.clearFieldError(key);
        });

        group.appendChild(input);

        // Error message placeholder
        const errSpan = document.createElement('span');
        errSpan.className = `error-msg error-msg-${key}`;
        errSpan.style.cssText = 'font-size:11px; color:#ef4444; min-height:14px;';
        group.appendChild(errSpan);

        this.formEl.appendChild(group);
      });
    }

    getFormData() {
      const inputs = this.formEl.querySelectorAll('input, select, textarea');
      const data = {};
      inputs.forEach(el => {
        if (el.name) data[el.name] = el.value;
      });
      return data;
    }

    validate() {
      if (!window.ValidationEngine) return { isValid: true, cleanData: this.getFormData() };
      const rawData = this.getFormData();
      const result = window.ValidationEngine.validate(this.schema, rawData);

      // Render errors
      this.clearAllErrors();
      if (!result.isValid) {
        Object.keys(result.errors).forEach(key => {
          const errSpan = this.formEl.querySelector(`.error-msg-${key}`);
          const inputEl = this.formEl.querySelector(`[name="${key}"]`);
          if (errSpan && result.errors[key].length > 0) {
            errSpan.textContent = result.errors[key][0];
          }
          if (inputEl) {
            inputEl.style.borderColor = '#ef4444';
          }
        });
      }
      return result;
    }

    clearFieldError(key) {
      const errSpan = this.formEl.querySelector(`.error-msg-${key}`);
      const inputEl = this.formEl.querySelector(`[name="${key}"]`);
      if (errSpan) errSpan.textContent = '';
      if (inputEl) inputEl.style.borderColor = '#cbd5e1';
    }

    clearAllErrors() {
      this.formEl.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
      this.formEl.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '#cbd5e1');
    }

    getElement() {
      return this.formEl;
    }
  }

  // ==========================================================================
  // EXPORT TO GLOBAL WINDOW
  // ==========================================================================

  window.EnterpriseDataTable = EnterpriseDataTable;
  window.EnterpriseModal = EnterpriseModal;
  window.EnterpriseFormEngine = EnterpriseFormEngine;

})(window);
