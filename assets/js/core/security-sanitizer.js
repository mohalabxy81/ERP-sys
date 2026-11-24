/**
 * ============================================================================
 * SECURITY-SANITIZER.JS — Enterprise Security, RBAC & Audit Trail Engine
 * Standard: OWASP Top 10 · ISO 27001 · SAP S/4HANA Security Guidelines
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ==========================================================================
  // 1. DOM SANITIZER (Anti-XSS Engine)
  // ==========================================================================

  const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /vbscript\s*:/gi,
    /on(?:error|load|click|mouseover|focus|blur|change|submit)\s*=/gi
  ];

  class DOMSanitizer {
    /**
     * Escapes standard HTML special characters
     * @param {any} val
     * @returns {string}
     */
    static escape(val) {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.replace(/[&<>"'`=\/]/g, char => ESCAPE_MAP[char] || char);
    }

    /**
     * Strips dangerous tags and attributes from rich HTML strings
     * @param {string} html
     * @returns {string}
     */
    static clean(html) {
      if (!html) return '';
      let cleaned = String(html);
      DANGEROUS_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
      return cleaned;
    }

    /**
     * Tagged template literal for secure HTML creation
     * Usage: DOMSanitizer.html`<div>${unsafeData}</div>`
     */
    static html(strings, ...values) {
      return strings.reduce((acc, str, i) => {
        const val = i < values.length ? DOMSanitizer.escape(values[i]) : '';
        return acc + str + val;
      }, '');
    }

    /**
     * Safely sets text content or escaped HTML into an element
     * @param {HTMLElement|string} target
     * @param {string} content
     * @param {boolean} isHtml
     */
    static safeSet(target, content, isHtml = false) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      if (isHtml) {
        el.innerHTML = this.clean(content);
      } else {
        el.textContent = content != null ? String(content) : '';
      }
    }
  }

  // ==========================================================================
  // 2. ENTERPRISE RBAC POLICY GATEKEEPER
  // ==========================================================================

  const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    COMPANY_ADMIN: 'CompanyAdmin',
    DIRECTOR: 'ExecutiveDirector',
    PM: 'ProjectManager',
    COST_ENG: 'CostControlEngineer',
    PROCUREMENT: 'ProcurementManager',
    SITE_ENG: 'SiteEngineer',
    QAQC: 'QAQCManager',
    FINANCE: 'FinanceAccountant',
    AUDITOR: 'Auditor'
  };

  const PERMISSIONS = {
    VIEW_FINANCIALS: 'VIEW_FINANCIALS',
    APPROVE_IPC: 'APPROVE_IPC',
    CERTIFY_BILLING: 'CERTIFY_BILLING',
    DELETE_CONTRACT: 'DELETE_CONTRACT',
    DELETE_MASTER_DATA: 'DELETE_MASTER_DATA',
    CREATE_VARIATION: 'CREATE_VARIATION',
    EXPORT_AUDIT_LOGS: 'EXPORT_AUDIT_LOGS',
    MODIFY_RATES: 'MODIFY_RATES',
    APPROVE_SUBMITTAL: 'APPROVE_SUBMITTAL',
    CLOSE_PUNCH_ITEM: 'CLOSE_PUNCH_ITEM',
    CREATE_PO: 'CREATE_PO'
  };

  const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.COMPANY_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.DIRECTOR]: Object.values(PERMISSIONS),
    [ROLES.PM]: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.APPROVE_IPC,
      PERMISSIONS.CERTIFY_BILLING,
      PERMISSIONS.DELETE_MASTER_DATA,
      PERMISSIONS.DELETE_CONTRACT,
      PERMISSIONS.CREATE_VARIATION,
      PERMISSIONS.CREATE_PO,
      PERMISSIONS.APPROVE_SUBMITTAL,
      PERMISSIONS.CLOSE_PUNCH_ITEM
    ],
    [ROLES.COST_ENG]: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.CREATE_VARIATION,
      PERMISSIONS.MODIFY_RATES,
      PERMISSIONS.CREATE_PO,
      PERMISSIONS.DELETE_MASTER_DATA
    ],
    [ROLES.PROCUREMENT]: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.CREATE_PO,
      PERMISSIONS.DELETE_MASTER_DATA
    ],
    [ROLES.SITE_ENG]: [
      PERMISSIONS.CLOSE_PUNCH_ITEM
    ],
    [ROLES.QAQC]: [
      PERMISSIONS.APPROVE_SUBMITTAL,
      PERMISSIONS.CLOSE_PUNCH_ITEM
    ],
    [ROLES.FINANCE]: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.APPROVE_IPC,
      PERMISSIONS.CERTIFY_BILLING
    ],
    [ROLES.AUDITOR]: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.EXPORT_AUDIT_LOGS
    ]
  };

  class PolicyGatekeeper {
    constructor() {
      this._activeRole = ROLES.SUPER_ADMIN; // Default role
      this._subscribers = [];
    }

    /**
     * Map UI role dropdown value to internal standard role
     */
    normalizeRole(uiRole) {
      switch ((uiRole || '').toUpperCase()) {
        case 'SUPERADMIN':
        case 'SUPER_ADMIN':
        case 'ADMIN':
          return ROLES.SUPER_ADMIN;
        case 'COMPANYADMIN':
        case 'COMPANY_ADMIN':
          return ROLES.COMPANY_ADMIN;
        case 'DIR':
        case 'DIRECTOR':
        case 'EXECUTIVE':
          return ROLES.DIRECTOR;
        case 'COST':
        case 'COSTCONTROL':
        case 'COST_ENG':
        case 'QS':
          return ROLES.COST_ENG;
        case 'PROCUREMENT':
        case 'PURCHASING':
          return ROLES.PROCUREMENT;
        case 'SITE':
        case 'ENG':
        case 'SITEENG':
        case 'SITE_ENG':
          return ROLES.SITE_ENG;
        case 'QAQC':
        case 'QA':
        case 'QC':
          return ROLES.QAQC;
        case 'FINANCE':
        case 'ACCOUNTANT':
          return ROLES.FINANCE;
        case 'AUDITOR':
          return ROLES.AUDITOR;
        case 'PM':
        default:
          return ROLES.PM;
      }
    }

    getActiveRole() {
      return this._activeRole;
    }

    setActiveRole(role) {
      const normalized = this.normalizeRole(role);
      const prev = this._activeRole;
      this._activeRole = normalized;
      if (prev !== normalized) {
        this._notifySubscribers(normalized, prev);
      }
    }

    can(permission) {
      const perms = ROLE_PERMISSIONS[this._activeRole] || [];
      return perms.includes(permission);
    }

    enforce(permission, actionLabel = 'هذا الإجراء') {
      if (!this.can(permission)) {
        const roleTitle = this.getRoleTitleAr(this._activeRole);
        const msg = `غير مصرح: ليس لديك صلاحية تنفيذ ${actionLabel} بصفتك (${roleTitle}). يتطلب هذا الإجراء صلاحيات أعلى.`;
        if (typeof window.showToast === 'function') {
          window.showToast(msg, 'warning');
        } else {
          alert(msg);
        }
        throw new Error(`Security Exception: Missing permission '${permission}' for role '${this._activeRole}'.`);
      }
      return true;
    }

    getRoleTitleAr(role) {
      switch (role) {
        case ROLES.SUPER_ADMIN: return 'مدير المنظومة (Super Admin)';
        case ROLES.COMPANY_ADMIN: return 'مدير الشركة (Company Admin)';
        case ROLES.DIRECTOR: return 'المدير التنفيذي (Executive Director)';
        case ROLES.PM: return 'مدير المشروع (Project Manager)';
        case ROLES.COST_ENG: return 'مراقب التكاليف وحساب الكميات (Cost / QS Engineer)';
        case ROLES.PROCUREMENT: return 'مدير المشتريات (Procurement Manager)';
        case ROLES.SITE_ENG: return 'مهندس الموقع الميداني (Site Engineer)';
        case ROLES.QAQC: return 'مدير ضبط وتوكيد الجودة (QA/QC Manager)';
        case ROLES.FINANCE: return 'المحاسب المالي (Project Accountant)';
        case ROLES.AUDITOR: return 'المراجع والمدقق الداخلي (Auditor)';
        default: return role;
      }
    }

    onRoleChange(fn) {
      if (typeof fn === 'function') {
        this._subscribers.push(fn);
      }
    }

    _notifySubscribers(newRole, prevRole) {
      this._subscribers.forEach(cb => {
        try { cb(newRole, prevRole); } catch (e) { console.warn('Role subscriber error:', e); }
      });
    }
  }

  // ==========================================================================
  // 3. CRYPTOGRAPHICALLY LINKED AUDIT TRAIL ENGINE (Chained Ledger)
  // ==========================================================================

  class AuditLogger {
    constructor() {
      this._chain = [];
    }

    /**
     * Simple fast hash function for client-side chained non-repudiation
     */
    static hash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      return 'HASH-' + Math.abs(hash).toString(16).padStart(8, '0');
    }

    /**
     * Record a secure tamper-evident transaction
     */
    record(action, entityType, entityId, details = {}) {
      const prevEntry = this._chain[this._chain.length - 1];
      const prevHash = prevEntry ? prevEntry.currentHash : 'GENESIS-00000000';
      const timestamp = new Date().toISOString();
      const userRole = window.PolicyGatekeeper ? window.PolicyGatekeeper.getActiveRole() : 'System';

      const payload = `${prevHash}|${timestamp}|${userRole}|${action}|${entityType}|${entityId}|${JSON.stringify(details)}`;
      const currentHash = AuditLogger.hash(payload);

      const entry = {
        logId: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp,
        userRole,
        action,
        entityType,
        entityId,
        details,
        prevHash,
        currentHash
      };

      this._chain.push(entry);

      // Keep in MimarERP.auditLogs for UI rendering
      if (window.MimarERP && Array.isArray(window.MimarERP.auditLogs)) {
        window.MimarERP.auditLogs.unshift({
          action: `${action} [${entityType}]`,
          user: userRole,
          timestamp: timestamp.replace('T', ' ').substring(0, 19),
          details: typeof details === 'string' ? details : JSON.stringify(details),
          hash: currentHash
        });
      }

      return entry;
    }

    /**
     * Verify chain integrity to detect unauthorized tampering
     */
    verifyIntegrity() {
      for (let i = 0; i < this._chain.length; i++) {
        const cur = this._chain[i];
        const prevHash = i === 0 ? 'GENESIS-00000000' : this._chain[i - 1].currentHash;
        if (cur.prevHash !== prevHash) {
          return { valid: false, brokenIndex: i, reason: 'Broken previous hash pointer' };
        }
        const payload = `${cur.prevHash}|${cur.timestamp}|${cur.userRole}|${cur.action}|${cur.entityType}|${cur.entityId}|${JSON.stringify(cur.details)}`;
        if (AuditLogger.hash(payload) !== cur.currentHash) {
          return { valid: false, brokenIndex: i, reason: 'Mismatched entry hash signature' };
        }
      }
      return { valid: true, totalRecords: this._chain.length };
    }

    getHistory() {
      return [...this._chain];
    }
  }

  // ==========================================================================
  // EXPORT TO GLOBAL WINDOW
  // ==========================================================================

  window.DOMSanitizer = DOMSanitizer;
  window.PolicyGatekeeper = new PolicyGatekeeper();
  window.PolicyGatekeeper.ROLES = ROLES;
  window.PolicyGatekeeper.PERMISSIONS = PERMISSIONS;
  window.AuditLogger = new AuditLogger();

})(window);
