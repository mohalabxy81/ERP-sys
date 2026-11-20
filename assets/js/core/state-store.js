/**
 * ============================================================================
 * STATE-STORE.JS — Centralized Unidirectional State Store & IndexedDB Engine
 * Standard: Redux / Flux Architecture · Immutable Snapshots · IndexedDB Delta
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ==========================================================================
  // 1. INDEXED-DB PERSISTENCE DRIVER
  // ==========================================================================

  class IndexedDBDriver {
    constructor(dbName = 'MimarERP_Database', version = 1) {
      this.dbName = dbName;
      this.version = version;
      this.db = null;
      this._isReady = this._init();
    }

    async _init() {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to LocalStorage');
        return false;
      }
      return new Promise((resolve) => {
        const req = window.indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('domain_slices')) {
            db.createObjectStore('domain_slices', { keyPath: 'slice_name' });
          }
          if (!db.objectStoreNames.contains('audit_ledger')) {
            db.createObjectStore('audit_ledger', { keyPath: 'logId' });
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(true);
        };
        req.onerror = () => {
          console.warn('IndexedDB opening failed, falling back to LocalStorage');
          resolve(false);
        };
      });
    }

    async saveSlice(sliceName, data) {
      const ready = await this._isReady;
      if (!ready || !this.db) return false;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(['domain_slices'], 'readwrite');
          const store = tx.objectStore('domain_slices');
          store.put({ slice_name: sliceName, payload: data, updatedAt: new Date().toISOString() });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    }

    async getSlice(sliceName) {
      const ready = await this._isReady;
      if (!ready || !this.db) return null;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(['domain_slices'], 'readonly');
          const store = tx.objectStore('domain_slices');
          const req = store.get(sliceName);
          req.onsuccess = () => resolve(req.result ? req.result.payload : null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }
  }

  // ==========================================================================
  // 2. ENTERPRISE REDUX-PATTERN CENTRAL STATE STORE
  // ==========================================================================

  class EnterpriseStore {
    constructor() {
      this._state = {};
      this._listeners = new Set();
      this._middlewares = [];
      this._idb = new IndexedDBDriver();
      this._debounceTimers = {};
      this._storageKey = 'MimarERPData_v6';

      // Initialize with window.MimarERP defaults
      this._bootstrap();
    }

    _bootstrap() {
      const defaultState = window.MimarERP || {};
      this._state = {
        context: {
          currentCompanyId: defaultState.currentCompanyId || 'CMP-1001',
          currentProjectId: defaultState.currentProjectId || 'PRJ-2001',
          currentRole: defaultState.currentRole || 'PM',
          activeView: 'dashboard'
        },
        commercial: {
          subcontracts: defaultState.subcontractsMaster || [],
          tenderPackages: defaultState.tenderPackagesMaster || [],
          tenders: defaultState.tendersMaster || [],
          contractors: defaultState.contractorsMaster || [],
          contractorRates: defaultState.contractorRatesMaster || []
        },
        supplyChain: {
          suppliers: defaultState.suppliersMaster || [],
          supplierItems: defaultState.supplierItemsMaster || [],
          partnerCatalog: defaultState.partnerCatalog || [],
          priceComparisons: defaultState.priceComparisonMaster || [],
          purchaseOrders: defaultState.purchaseOrders || [],
          inventory: defaultState.inventoryLedger || []
        },
        engineering: {
          projects: defaultState.projects || [],
          wbs: defaultState.wbs || [],
          boq: defaultState.boq || [],
          takeoff: defaultState.takeoff || [],
          rateAnalysis: defaultState.rateAnalysis || [],
          bimElements: defaultState.bimElements || [],
          clashes: defaultState.bimClashesMaster || [],
          rebarBBS: defaultState.rebarBBSItems || [],
          drawings: defaultState.techOffice?.drawings || []
        },
        finance: {
          billing: defaultState.billing || [],
          financeBillings: defaultState.financeBillings || [],
          financeAP: defaultState.financeAP || [],
          financeBudget: defaultState.financeBudget || [],
          cvrLedger: defaultState.cvrLedgerMaster || [],
          costControl: defaultState.costControlRegister || []
        },
        fieldOps: {
          siteDiary: defaultState.siteDiaryLogs || [],
          punchList: defaultState.punchListItems || [],
          rfis: defaultState.rfiList || [],
          submittals: defaultState.submittalsList || [],
          safetyIncidents: defaultState.safetyIncidents || [],
          safetyTrainings: defaultState.safetyTrainings || [],
          scheduleTasks: defaultState.scheduleTasks || []
        },
        governance: {
          companies: defaultState.companies || [],
          branches: defaultState.branches || [],
          partners: defaultState.partners || [],
          hrEmployees: defaultState.hrEmployees || [],
          payroll: defaultState.payrollRecords || [],
          equipment: defaultState.equipmentMaster || [],
          auditLogs: defaultState.auditLogs || []
        }
      };

      // Bidirectional sync with window.MimarERP for legacy views
      this._syncLegacyMimarERP();
    }

    _syncLegacyMimarERP() {
      if (!window.MimarERP) window.MimarERP = {};
      const s = this._state;
      window.MimarERP.subcontractsMaster = s.commercial.subcontracts;
      window.MimarERP.tenderPackagesMaster = s.commercial.tenderPackages;
      window.MimarERP.contractorsMaster = s.commercial.contractors;
      window.MimarERP.contractorRatesMaster = s.commercial.contractorRates;
      window.MimarERP.suppliersMaster = s.supplyChain.suppliers;
      window.MimarERP.partnerCatalog = s.supplyChain.partnerCatalog;
      window.MimarERP.supplierItemsMaster = s.supplyChain.supplierItems;
      window.MimarERP.priceComparisonMaster = s.supplyChain.priceComparisons;
      window.MimarERP.purchaseOrders = s.supplyChain.purchaseOrders;
      window.MimarERP.boq = s.engineering.boq;
      window.MimarERP.wbs = s.engineering.wbs;
      window.MimarERP.takeoff = s.engineering.takeoff;
      window.MimarERP.bimElements = s.engineering.bimElements;
      window.MimarERP.bimClashesMaster = s.engineering.clashes;
      window.MimarERP.rebarBBSItems = s.engineering.rebarBBS;
      window.MimarERP.billing = s.finance.billing;
      window.MimarERP.siteDiaryLogs = s.fieldOps.siteDiary;
      window.MimarERP.punchListItems = s.fieldOps.punchList;
      window.MimarERP.rfiList = s.fieldOps.rfis;
      window.MimarERP.submittalsList = s.fieldOps.submittals;
    }

    getState() {
      return this._state;
    }

    getSlice(sliceName) {
      return this._state[sliceName] || {};
    }

    subscribe(listener) {
      if (typeof listener === 'function') {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
      }
      return () => {};
    }

    useMiddleware(mw) {
      if (typeof mw === 'function') {
        this._middlewares.push(mw);
      }
    }

    dispatch(action) {
      if (!action || typeof action.type !== 'string') {
        console.error('Invalid action dispatched:', action);
        return;
      }

      // Execute middleware chain
      let proceed = true;
      for (const mw of this._middlewares) {
        if (mw(action, this._state) === false) {
          proceed = false;
          break;
        }
      }
      if (!proceed) return;

      // Reduce state
      this._state = this._rootReducer(this._state, action);

      // Legacy mirror
      this._syncLegacyMimarERP();

      // Trigger Subscribers
      this._notifySubscribers(action);

      // Async debounced persistence
      this._schedulePersistence(action.slice || 'all');
    }

    _rootReducer(state, action) {
      const { type, payload } = action;

      switch (type) {
        // --- COMMERCIAL ---
        case 'SUBCONTRACT_ADD':
          return {
            ...state,
            commercial: {
              ...state.commercial,
              subcontracts: [payload, ...state.commercial.subcontracts]
            }
          };
        case 'SUBCONTRACT_UPDATE':
          return {
            ...state,
            commercial: {
              ...state.commercial,
              subcontracts: state.commercial.subcontracts.map(s => s.sub_id === payload.sub_id ? { ...s, ...payload } : s)
            }
          };
        case 'SUBCONTRACT_DELETE':
          return {
            ...state,
            commercial: {
              ...state.commercial,
              subcontracts: state.commercial.subcontracts.filter(s => s.sub_id !== payload)
            }
          };

        // --- CONTRACTORS ---
        case 'CONTRACTOR_ADD':
          return {
            ...state,
            commercial: {
              ...state.commercial,
              contractors: [...state.commercial.contractors, payload]
            }
          };
        case 'CONTRACTOR_DELETE':
          return {
            ...state,
            commercial: {
              ...state.commercial,
              contractors: state.commercial.contractors.filter(c => c.contractor_id !== payload)
            }
          };

        // --- SUPPLIERS & CATALOG ---
        case 'CATALOG_ITEM_ADD':
          return {
            ...state,
            supplyChain: {
              ...state.supplyChain,
              partnerCatalog: [payload, ...state.supplyChain.partnerCatalog]
            }
          };
        case 'CATALOG_ITEM_DELETE':
          return {
            ...state,
            supplyChain: {
              ...state.supplyChain,
              partnerCatalog: state.supplyChain.partnerCatalog.filter(c => c.item_code !== payload)
            }
          };

        // --- CONTEXT ---
        case 'CONTEXT_SET_ROLE':
          return {
            ...state,
            context: { ...state.context, currentRole: payload }
          };
        case 'CONTEXT_SET_PROJECT':
          return {
            ...state,
            context: { ...state.context, currentProjectId: payload }
          };
        case 'CONTEXT_SET_COMPANY':
          return {
            ...state,
            context: { ...state.context, currentCompanyId: payload }
          };

        default:
          return state;
      }
    }

    _notifySubscribers(action) {
      this._listeners.forEach(fn => {
        try { fn(this._state, action); } catch (e) { console.warn('Store subscriber error:', e); }
      });
    }

    _schedulePersistence(sliceName) {
      if (this._debounceTimers[sliceName]) {
        clearTimeout(this._debounceTimers[sliceName]);
      }
      this._debounceTimers[sliceName] = setTimeout(() => {
        this._persistSlice(sliceName);
      }, 250);
    }

    async _persistSlice(sliceName) {
      try {
        if (window.MimarERP) {
          // Backup snapshot to localStorage
          localStorage.setItem(this._storageKey, JSON.stringify(window.MimarERP));
        }
        // Async delta save to IndexedDB
        if (sliceName !== 'all' && this._state[sliceName]) {
          await this._idb.saveSlice(sliceName, this._state[sliceName]);
        }
      } catch (e) {
        console.warn('Persistence sync notice:', e);
      }
    }
  }

  // ==========================================================================
  // EXPORT TO GLOBAL WINDOW
  // ==========================================================================

  window.EnterpriseStore = new EnterpriseStore();

})(window);
