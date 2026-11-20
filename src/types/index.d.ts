/**
 * @file index.d.ts
 * @module MimarERP / TypeScript Declarations
 * @version 6.0.0
 * @description
 * TypeScript-compatible type declarations for MimarERP v6 Enterprise Architecture.
 * Covers all core modules, domain models, API contracts, and state management.
 *
 * Usage: Reference in jsconfig.json or tsconfig.json for IDE intellisense:
 *   { "typeRoots": ["./src/types"] }
 *
 * @author MimarERP Enterprise Architecture Team
 */

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL WINDOW AUGMENTATION
   ═══════════════════════════════════════════════════════════════════════════ */

export {};

declare global {

  /* ──────────────────────────────────────────────────────
     DOMAIN: Shared / Common
  ────────────────────────────────────────────────────── */

  /** Saudi Riyal monetary amount (always pre or post VAT — label context) */
  type SAR = number;

  /** ISO 8601 date string: "2026-01-15" */
  type DateISO = string;

  /** UNSPSC commodity code e.g. "30000000" */
  type UNSPSCCode = string;

  /** MasterFormat CSI code e.g. "03 30 00" */
  type MasterFormatCode = string;

  /** KSA VAT registration number: 15-digit starting with 3 */
  type VATNumber = string;

  /** KSA Commercial Registration number: 10 digits */
  type CRNumber = string;

  /** Entity status literals */
  type EntityStatus = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

  /** Audit action types */
  type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'ROLE_SWITCH' | 'LOGIN' | 'EXPORT' | 'IMPORT';

  /* ──────────────────────────────────────────────────────
     DOMAIN: Company & Organization
  ────────────────────────────────────────────────────── */

  interface Company {
    company_id:      string;
    company_name_ar: string;
    company_name_en: string;
    cr_number:       CRNumber;
    vat_number:      VATNumber;
    license_number?: string;
    address_ar?:     string;
    city?:           string;
    country?:        string;
    phone?:          string;
    email?:          string;
    logo_url?:       string;
  }

  interface Branch {
    branch_id:      string;
    company_id:     string;
    branch_name_ar: string;
    branch_name_en: string;
    city:           string;
    address:        string;
    manager_name?:  string;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Partners (Suppliers, Subcontractors, Clients)
  ────────────────────────────────────────────────────── */

  type PartnerType = 'Supplier' | 'Subcontractor' | 'Client' | 'Consultant' | 'JV Partner';

  interface Partner {
    partner_id:    string;
    partner_code:  string;
    partner_name:  string;
    partner_type:  PartnerType;
    cr_number?:    CRNumber;
    vat_number?:   VATNumber;
    city?:         string;
    contact_name?: string;
    phone?:        string;
    email?:        string;
    rating?:       number;
    status?:       EntityStatus;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Projects
  ────────────────────────────────────────────────────── */

  type ContractType = 'Lump Sum' | 'Unit Rate' | 'FIDIC Red Book 2017' | 'EPC Turnkey' | 'Cost Plus';
  type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'tendering' | 'cancelled';

  interface Project {
    project_code:          string;
    project_name_ar:       string;
    project_name_en:       string;
    company_id:            string;
    client_id:             string;
    consultant_id?:        string;
    location:              string;
    contract_type:         ContractType;
    contract_value:        SAR;
    contract_duration_days: number;
    start_date:            DateISO;
    planned_end_date:      DateISO;
    actual_end_date?:      DateISO;
    status:                ProjectStatus;
    description?:          string;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: WBS / BOQ
  ────────────────────────────────────────────────────── */

  interface WBSItem {
    wbs_code:        string;
    description:     string;
    unit:            string;
    quantity:        number;
    unit_rate:       SAR;
    total:           SAR;
    actual_qty?:     number;
    actual_cost?:    SAR;
    variance?:       SAR;
    completion_pct?: number;
    parent_code?:    string;
    level?:          number;
    unspsc_code?:    UNSPSCCode;
    masterformat?:   MasterFormatCode;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Procurement / Supply Chain
  ────────────────────────────────────────────────────── */

  type POStatus = 'draft' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled';

  interface PurchaseOrder {
    po_number:       string;
    issue_date:      DateISO;
    supplier_id:     string;
    supplier_name:   string;
    project_code:    string;
    item_desc:       string;
    unit:            string;
    qty_ordered:     number;
    unit_price:      SAR;
    total_before_vat: SAR;
    vat_amount:      SAR;
    total_after_vat: SAR;
    delivery_date:   DateISO;
    status:          POStatus;
  }

  interface CatalogItem {
    item_code:       string;
    desc:            string;
    partner_id:      string;
    partner_name?:   string;
    partner_type?:   PartnerType;
    partner_code?:   string;
    category:        string;
    unit:            string;
    qty:             number;
    price_before_vat: SAR;
    unit_vat:        SAR;
    price_after_vat: SAR;
    total_before_vat: SAR;
    total_vat:       SAR;
    total_after_vat: SAR;
    location?:       string;
    owner?:          string;
    status?:         string;
    unspsc_code?:    UNSPSCCode;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Subcontracts & Contractors
  ────────────────────────────────────────────────────── */

  type SubcontractStatus = 'نشط وقيد التنفيذ' | 'مكتمل ومسلم' | 'قيد التسوية النهائية';

  interface Subcontract {
    sub_id:              string;
    contractor_name:     string;
    scope:               string;
    original_value:      SAR;
    approved_vos:        SAR;
    executed_measured:   SAR;
    retention_pct:       number;
    retention_amount?:   SAR;
    net_payable?:        SAR;
    revised_contract?:   SAR;
    status:              SubcontractStatus;
  }

  interface ContractorMaster {
    contractor_id:    string;
    contractor_name:  string;
    specialty:        string;
    total_crew:       number;
    city:             string;
    contact_person:   string;
    rating:           number;
    speed_rating?:    string;
    prev_projects?:   string;
    status:           string;
  }

  interface ContractorRate {
    rate_id:           string;
    contractor_name:   string;
    specialty:         string;
    activity_desc:     string;
    unit:              string;
    unit_rate:         SAR;
    daily_production:  string;
    waste_resp?:       string;
    safety_comp?:      string;
    status:            string;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Tender Packages
  ────────────────────────────────────────────────────── */

  interface TenderPackage {
    tender_id:          string;
    scope:              string;
    budget:             SAR;
    deadline:           DateISO;
    status:             string;
    evaluation_method?: string;
    bidders?:           string[];
    awarded_to?:        string;
    awarded_value?:     SAR;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Earned Value Management (EVM)
  ────────────────────────────────────────────────────── */

  interface EVMMetrics {
    bac: SAR;   /** Budget At Completion */
    pv:  SAR;   /** Planned Value */
    ev:  SAR;   /** Earned Value */
    ac:  SAR;   /** Actual Cost */
    cv:  SAR;   /** Cost Variance = EV - AC */
    sv:  SAR;   /** Schedule Variance = EV - PV */
    cpi: number;/** Cost Performance Index = EV / AC */
    spi: number;/** Schedule Performance Index = EV / PV */
    eac: SAR;   /** Estimate At Completion = BAC / CPI */
    etc: SAR;   /** Estimate To Complete = EAC - AC */
    vac: SAR;   /** Variance At Completion = BAC - EAC */
    tcpi: number;/** To-Complete Performance Index */
    percentComplete: number;
    percentSpent: number;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Finance / ZATCA
  ────────────────────────────────────────────────────── */

  interface ZATCAInvoice {
    invoice_number:    string;
    invoice_date:      DateISO;
    invoice_type:      string;
    seller_cr:         CRNumber;
    seller_vat:        VATNumber;
    seller_name:       string;
    buyer_name:        string;
    buyer_vat?:        VATNumber;
    item_desc:         string;
    qty:               number;
    unit:              string;
    price_before_vat:  SAR;
    vat_pct:           number;
    vat_amount?:       SAR;
    total_after_vat?:  SAR;
    zatca_qr?:         string;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: HSE / Safety
  ────────────────────────────────────────────────────── */

  interface SafetyIncident {
    id:              string;
    date:            DateISO;
    type:            string;
    severity:        'صفر إصابات' | 'إصابة طفيفة' | 'إصابة خطيرة' | 'وفاة';
    location:        string;
    description:     string;
    root_cause?:     string;
    corrective_action?: string;
    reported_by:     string;
    status:          string;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: Quality / Inspections
  ────────────────────────────────────────────────────── */

  type InspectionResult = 'مقبول' | 'مرفوض' | 'تحت الفحص' | 'بانتظار المراجعة';

  interface QualityInspection {
    id:            string;
    date:          DateISO;
    type:          string;
    location:      string;
    inspector:     string;
    result:        InspectionResult;
    notes?:        string;
    ncr_ref?:      string;
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN: BIM / Technical Office
  ────────────────────────────────────────────────────── */

  interface BIMClash {
    clash_id:        string;
    discipline_a:    string;
    discipline_b:    string;
    description:     string;
    severity:        'Critical' | 'Major' | 'Minor';
    status:          'Open' | 'In Review' | 'Resolved';
    cost_impact?:    SAR;
    time_impact_days?: number;
    resolution?:     string;
    resolved_date?:  DateISO;
  }

  interface RebarBBS {
    bar_mark:    string;
    shape_code:  string;
    diameter_mm: number;
    length_mm:   number;
    nos:         number;
    weight_kg:   number;
    zone:        string;
    element:     string;
    grade:       string;
    notes?:      string;
  }

  /* ──────────────────────────────────────────────────────
     RBAC / SECURITY
  ────────────────────────────────────────────────────── */

  type ERP_Role =
    | 'ExecutiveDirector'
    | 'ProjectManager'
    | 'CostControlEngineer'
    | 'SiteEngineer'
    | 'Auditor';

  type Permission =
    | 'VIEW_DASHBOARD'
    | 'MANAGE_USERS'
    | 'APPROVE_IPC'
    | 'APPROVE_VARIATION'
    | 'DELETE_MASTER_DATA'
    | 'VIEW_AUDIT_LOG'
    | 'EXPORT_FINANCIAL'
    | 'CREATE_PO'
    | 'APPROVE_PO'
    | 'VIEW_COST_CONTROL'
    | 'MANAGE_SUBCONTRACTS';

  /* ──────────────────────────────────────────────────────
     CORE MODULE INTERFACES
  ────────────────────────────────────────────────────── */

  /**
   * DOMSanitizer — XSS prevention utility
   */
  interface IDOMSanitizer {
    escape(str: string): string;
    clean(html: string): string;
    safeSet(element: HTMLElement, content: string): void;
    html(strings: TemplateStringsArray, ...values: any[]): string;
  }

  /**
   * PolicyGatekeeper — RBAC permission system
   */
  interface IPolicyGatekeeper {
    setActiveRole(role: ERP_Role): void;
    getActiveRole(): ERP_Role;
    getRoleTitleAr(role: ERP_Role): string;
    can(permission: Permission): boolean;
    enforce(permission: Permission, context?: string): void;
    onRoleChange(callback: (role: ERP_Role) => void): void;
  }

  /**
   * AuditLogger — cryptographic audit trail
   */
  interface IAuditLogger {
    record(action: AuditAction, entity: string, entityId: string, metadata?: object): void;
    getHistory(limit?: number): AuditEntry[];
    verifyIntegrity(): boolean;
    exportAsCSV(): string;
  }

  interface AuditEntry {
    id:        string;
    timestamp: string;
    action:    AuditAction;
    entity:    string;
    entityId:  string;
    actor:     string;
    metadata?: object;
    hash?:     string;
  }

  /**
   * EnterpriseStore — Redux-pattern state management
   */
  interface IEnterpriseStore {
    dispatch(action: { type: string; payload?: any; slice?: string }): void;
    subscribe(callback: (state: ERPState) => void): () => void;
    getState(): ERPState;
    useMiddleware(fn: (action: any, state: ERPState) => any): void;
  }

  interface ERPState {
    commercial:  CommercialSlice;
    supplyChain: SupplyChainSlice;
    engineering: EngineeringSlice;
    finance:     FinanceSlice;
    fieldOps:    FieldOpsSlice;
    governance:  GovernanceSlice;
    context:     ContextSlice;
  }

  interface CommercialSlice {
    subcontracts:    Subcontract[];
    contractors:     ContractorMaster[];
    tenderPackages:  TenderPackage[];
    variationOrders: any[];
    ipcs:            any[];
  }

  interface SupplyChainSlice {
    catalog:         CatalogItem[];
    purchaseOrders:  PurchaseOrder[];
    inventory:       any[];
    supplierScores:  any[];
  }

  interface EngineeringSlice {
    wbs:             WBSItem[];
    drawings:        any[];
    submittals:      any[];
    rfis:            any[];
    clashes:         BIMClash[];
    rebarBBS:        RebarBBS[];
  }

  interface FinanceSlice {
    billing:         any[];
    invoices:        ZATCAInvoice[];
    evm:             Partial<EVMMetrics>;
    cashflow:        any[];
  }

  interface FieldOpsSlice {
    siteDiary:       any[];
    safetyIncidents: SafetyIncident[];
    inspections:     QualityInspection[];
    schedule:        any[];
  }

  interface GovernanceSlice {
    auditLog:        AuditEntry[];
    users:           any[];
    permissions:     Record<string, Permission[]>;
  }

  interface ContextSlice {
    activeProjectCode: string;
    activeRole:        ERP_Role;
    activeCompanyId:   string;
    language:          'ar' | 'en';
    theme:             'light' | 'dark';
    lastSyncAt:        string;
  }

  /**
   * ValidationEngine — domain validation framework
   */
  interface IValidationEngine {
    validate(schema: ValidationSchema, data: Record<string, any>): ValidationResult;
    validateSubcontract(data: Partial<Subcontract>): ValidationResult;
    validateContractor(data: Partial<ContractorMaster>): ValidationResult;
    validateMaterial(data: Partial<CatalogItem>): ValidationResult;
  }

  type ValidationSchema = Record<string, ValidationRule[]>;
  type ValidationRule = (value: any, label: string) => string | null;

  interface ValidationResult {
    valid:  boolean;
    errors: Record<string, string>;
  }

  /**
   * APIGateway — virtual REST client
   */
  interface IAPIGateway {
    get<T = any>(url: string, params?: Record<string, any>): Promise<APIResponse<T>>;
    post<T = any>(url: string, body: any): Promise<APIResponse<T>>;
    put<T = any>(url: string, body: any): Promise<APIResponse<T>>;
    delete<T = any>(url: string): Promise<APIResponse<T>>;
    addRequestInterceptor(fn: (req: any) => any): void;
    addResponseInterceptor(fn: (res: any) => any): void;
  }

  interface APIResponse<T = any> {
    data:    T;
    status:  number;
    message: string;
    meta?:   { total: number; page: number; perPage: number };
  }

  /**
   * XLSXWorkerManager — off-thread Excel import/export
   */
  interface IXLSXWorkerManager {
    exportCSV(entity: string, data: object[], filename?: string): Promise<void>;
    exportExcel(entity: string, data: object[], filename?: string): Promise<void>;
    exportZATCA(invoices: ZATCAInvoice[], filename?: string): Promise<void>;
    importCSV(entity: string, csvText: string): Promise<{ rows: object[]; validCount: number; skippedCount: number }>;
    handleFileImport(file: File, entity: string, onSuccess: (rows: object[]) => void): void;
    ping(): void;
    isReady: boolean;
    supportedEntities: string[];
  }

  /* ──────────────────────────────────────────────────────
     DOMAIN SERVICES
  ────────────────────────────────────────────────────── */

  interface ICommercialDomainService {
    calculateSubcontractFinancials(sc: Subcontract): Subcontract & {
      revised_contract: SAR;
      net_to_date: SAR;
      retention_amount: SAR;
      net_payable: SAR;
    };
    evaluateTenderPackage(pkg: TenderPackage): { score: number; recommendation: string };
  }

  interface ISupplyChainDomainService {
    calculatePriceComparison(items: CatalogItem[]): {
      lowest: CatalogItem;
      highest: CatalogItem;
      spread_pct: number;
      recommended: CatalogItem;
    };
    lookupUNSPSC(code: UNSPSCCode): { title: string; family: string; class: string } | null;
  }

  interface IEngineeringDomainService {
    calculateRebarWeight(diameter_mm: number, length_m: number, nos: number): number;
    calculateClashCostImpact(clash: BIMClash): SAR;
  }

  interface IFinanceDomainService {
    computeFullEVM(bac: SAR, pv: SAR, ev: SAR, ac: SAR): EVMMetrics;
    generateZatcaQR(invoice: ZATCAInvoice): string;
  }

  /**
   * Legacy MimarERP global state object (backward compatible)
   */
  interface MimarERPState {
    companies:            Company[];
    branches:             Branch[];
    partners:             Partner[];
    projects:             Project[];
    wbsBoqData:           WBSItem[];
    partnerCatalog:       CatalogItem[];
    procurement:          PurchaseOrder[];
    subcontractsMaster:   Subcontract[];
    contractorsMaster:    ContractorMaster[];
    contractorRatesMaster: ContractorRate[];
    tenderPackagesMaster: TenderPackage[];
    safetyIncidents:      SafetyIncident[];
    siteDiaryLogs:        any[];
    techOffice:           {
      submittals:         any[];
      rfis:               any[];
      clashes:            BIMClash[];
      rebarBBS:           RebarBBS[];
      quality_inspections: QualityInspection[];
    };
    billing:              any[];
    schedule:             any[];
    drawings:             any[];
    variationOrders:      any[];
    punchList:            any[];
    rateAnalysis:         any[];
    auditLog:             AuditEntry[];
    currentRole:          ERP_Role;
    activeProjectCode:    string;
  }

  /* ──────────────────────────────────────────────────────
     GLOBAL WINDOW EXTENSIONS
  ────────────────────────────────────────────────────── */

  interface Window {
    // Core modules
    DOMSanitizer:              IDOMSanitizer;
    PolicyGatekeeper:          IPolicyGatekeeper;
    AuditLogger:               IAuditLogger;
    EnterpriseStore:           IEnterpriseStore;
    ValidationEngine:          IValidationEngine;
    APIGateway:                IAPIGateway;
    XLSXWorkerManager:         IXLSXWorkerManager;

    // Domain services
    CommercialDomainService:   ICommercialDomainService;
    SupplyChainDomainService:  ISupplyChainDomainService;
    EngineeringDomainService:  IEngineeringDomainService;
    FinanceDomainService:      IFinanceDomainService;

    // Component library
    EnterpriseDataTable:       any;
    EnterpriseModal:           any;
    EnterpriseFormEngine:      any;

    // Legacy state
    MimarERP:                  MimarERPState;

    // Helper shortcuts
    exportToCSV:               (entity: string, data: object[], filename?: string) => Promise<void>;
    exportToExcel:             (entity: string, data: object[], filename?: string) => Promise<void>;
    exportZATCA:               (invoices: ZATCAInvoice[], filename?: string) => Promise<void>;

    // Core functions
    showToast:                 (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showView:                  (viewId: string) => void;
    renderAllViews:            () => void;
    toggleSidebar:             () => void;
    onRoleChange:              (role: ERP_Role) => void;
    logAudit:                  (action: string, entity: string, description: string) => void;
    saveToLocalStorage:        () => void;

    // Validation rules
    RULES:                     Record<string, ValidationRule>;
  }
}
