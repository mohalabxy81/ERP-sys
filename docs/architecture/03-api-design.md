# MimarERP v7 — Complete REST API Design Specification
## Document ID: MIMAR-API-003 | Version 7.0.0

---

## 1. API Design Standards & Principles

### 1.1 Base Configuration
```
Base URL (Production):   https://api.mimar.sa/v1
Base URL (Staging):      https://api-staging.mimar.sa/v1
Base URL (Development):  https://api-dev.mimar.sa/v1
Mobile Sync Gateway:     https://sync.mimar.sa/v1
AI Copilot Gateway:      https://ai.mimar.sa/v1
Document CDN:            https://docs.mimar.sa/files/
```

### 1.2 Authentication & Authorization
```
Auth Scheme:        OAuth 2.0 + JWT (RS256)
Access Token TTL:   15 minutes
Refresh Token TTL:  30 days (rotating)
Token Claims:       { sub, tenant_id, roles[], permissions[], org_id, project_ids[] }
```

### 1.3 Request/Response Standards
```http
# Required Headers
Authorization:  Bearer <access_token>
X-Tenant-ID:    ten_abc123
X-Request-ID:   uuid-v4             (idempotency key)
Content-Type:   application/json
Accept-Language: ar-SA              (or en-US)

# Optional Headers
X-Project-ID:   prj_xyz789          (scope to project)
X-Timezone:     Asia/Riyadh
X-Currency:     SAR
```

### 1.4 Standard Response Envelope
```json
{
  "data":       { ... } | [ ... ],
  "meta": {
    "request_id":   "req_abc123",
    "timestamp":    "2026-01-15T10:30:00Z",
    "tenant_id":    "ten_abc123",
    "version":      "1.0"
  },
  "pagination": {
    "cursor":       "eyJpZCI6IjEwMCJ9",
    "next_cursor":  "eyJpZCI6IjIwMCJ9",
    "has_more":     true,
    "total":        1500,
    "per_page":     50
  },
  "errors": null
}
```

### 1.5 Error Response Format
```json
{
  "data": null,
  "errors": [
    {
      "code":     "VALIDATION_ERROR",
      "message":  "Contract value must be a positive number",
      "field":    "contract_value",
      "details":  { "min": 0, "received": -5000 }
    }
  ],
  "meta": { "request_id": "req_abc123", "timestamp": "2026-01-15T10:30:00Z" }
}
```

### 1.6 Standard Error Codes
| HTTP Status | Code | Description |
|---|---|---|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | UNAUTHENTICATED | Missing or expired token |
| 403 | UNAUTHORIZED | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate/concurrent modification |
| 422 | BUSINESS_RULE_VIOLATION | Business logic constraint |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Maintenance mode |

### 1.7 Rate Limiting
```
Per Tenant:  1,000 requests/minute
Per User:    100 requests/minute
Bulk Import: 10 requests/minute (special rate limit group)
AI Queries:  20 requests/minute per user
Headers returned:
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 847
  X-RateLimit-Reset: 1699999999
```

### 1.8 Pagination
```
Default cursor-based for large datasets:
GET /projects?cursor=eyJpZCI6IjEwMCJ9&per_page=50
GET /projects?page=3&per_page=25             (offset-based for reports)
GET /projects?sort=created_at&order=desc
GET /projects?filter[status]=active&filter[city]=Riyadh
```

---

## 2. OpenAPI 3.0 Specification Header

```yaml
openapi: 3.0.3
info:
  title: MimarERP v7 Construction ERP API
  version: 7.0.0
  description: >
    Enterprise REST API for MimarERP v7 — the complete Construction &
    Civil Engineering ERP Platform for GCC/MENA contractors, developers,
    and PMCs. Covers 25 modules: Organization, Projects, Cost Control,
    Planning, QS, Procurement, Inventory, Equipment, HR, Documents,
    Technical Office, Contracts, Claims, QA/QC, HSE, BIM, CRM, PMO,
    Finance, ZATCA, Analytics, Mobile Sync, and AI Copilot.
  contact:
    name: MimarERP API Support
    email: api@mimar.sa
    url: https://developers.mimar.sa
  license:
    name: Proprietary
    url: https://mimar.sa/license
servers:
  - url: https://api.mimar.sa/v1
    description: Production
  - url: https://api-staging.mimar.sa/v1
    description: Staging
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Pagination:
      type: object
      properties:
        cursor: { type: string }
        next_cursor: { type: string }
        has_more: { type: boolean }
        total: { type: integer }
        per_page: { type: integer }
    Error:
      type: object
      properties:
        code: { type: string }
        message: { type: string }
        field: { type: string, nullable: true }
security:
  - bearerAuth: []
```

---

## 3. Module APIs — Complete Endpoint Reference

---

### 3.1 Authentication Module

#### POST /auth/login
```
Description:  Authenticate user, return JWT access + refresh tokens
Permissions:  Public (no auth required)
Rate limit:   10/min per IP

Request Body:
{
  "email":     "user@contractor.sa",
  "password":  "SecurePass123!",
  "tenant":    "mimar-construction",   // subdomain or tenant_id
  "mfa_code":  "123456"                // optional if MFA enabled
}

Response 200:
{
  "data": {
    "access_token":   "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token":  "rt_abc123def456...",
    "token_type":     "Bearer",
    "expires_in":     900,
    "user": {
      "id":          "usr_abc123",
      "name_ar":     "م. أحمد المالك",
      "name_en":     "Eng. Ahmed Al-Malek",
      "email":       "ahmed@contractor.sa",
      "roles":       ["ProjectManager", "CostControlEngineer"],
      "permissions": ["VIEW_COST_CONTROL", "APPROVE_IPC", "CREATE_PO"],
      "tenant_id":   "ten_abc123",
      "org_id":      "org_xyz789"
    }
  }
}

Errors: 401 (invalid credentials), 423 (account locked), 429 (rate limited)
```

#### POST /auth/refresh
```
Request Body:  { "refresh_token": "rt_abc123..." }
Response 200:  { "data": { "access_token": "...", "expires_in": 900 } }
```

#### POST /auth/logout
```
Request Body:  { "refresh_token": "rt_abc123..." }   // revoke refresh token
Response 200:  { "data": { "logged_out": true } }
```

#### POST /auth/forgot-password
```
Request Body:  { "email": "user@example.sa" }
Response 200:  { "data": { "message": "Reset link sent" } }
```

#### POST /auth/reset-password
```
Request Body:  { "token": "reset_abc123", "new_password": "NewPass123!" }
Response 200:  { "data": { "message": "Password updated successfully" } }
```

---

### 3.2 Organization Management

#### GET /organizations
```
Description:  List all organizations in hierarchy (tree or flat)
Permissions:  VIEW_ORGANIZATION
Query Params:
  ?type=holding|subsidiary|branch|department
  ?format=tree|flat
  ?parent_id=org_abc123

Response 200:
{
  "data": [
    {
      "id":          "org_001",
      "name_ar":     "مجموعة ميمار القابضة",
      "name_en":     "Mimar Holding Group",
      "type":        "holding",
      "parent_id":   null,
      "cr_number":   "1010123456",
      "vat_number":  "300123456700003",
      "children": [
        {
          "id":        "org_002",
          "name_ar":   "ميمار للمقاولات",
          "name_en":   "Mimar Contracting Co.",
          "type":      "subsidiary",
          "parent_id": "org_001"
        }
      ]
    }
  ]
}
```

#### POST /organizations
```
Permissions: MANAGE_ORGANIZATION
Request Body:
{
  "name_ar":    "فرع الرياض",
  "name_en":    "Riyadh Branch",
  "type":       "branch",
  "parent_id":  "org_002",
  "cr_number":  "1010654321",
  "address_ar": "الرياض، حي العليا، شارع التخصصي",
  "city":       "Riyadh",
  "phone":      "+966112345678",
  "manager_id": "usr_abc123"
}
```

#### GET /organizations/{id}/cost-centers
```
Description: List cost/profit centers for an org unit
Response:    Array of cost center objects with budget and actuals
```

#### GET /organizations/approval-matrix
```
Description:  Return the approval authority matrix for the organization
Response:     Matrix of roles × transaction types × approval limits (SAR)
```

---

### 3.3 Project Management

#### GET /projects
```
Permissions:  VIEW_PROJECTS
Query Params: ?status=active|tendering|completed&city=Riyadh&cursor=...
Response 200:
{
  "data": [
    {
      "id":              "prj_abc123",
      "code":            "PRJ-2026-001",
      "name_ar":         "مشروع برج المركز المالي",
      "name_en":         "Financial Center Tower Project",
      "client_name":     "Invest Real Estate Co.",
      "contract_value":  450000000,
      "currency":        "SAR",
      "status":          "active",
      "completion_pct":  43.5,
      "cpi":             0.94,
      "spi":             0.88,
      "rag_status":      "amber",
      "start_date":      "2025-03-01",
      "planned_end":     "2027-06-30",
      "city":            "Riyadh",
      "contract_type":   "FIDIC Red Book 2017"
    }
  ],
  "pagination": { "total": 24, "has_more": false }
}
```

#### POST /projects
```
Permissions: CREATE_PROJECT
Request Body:
{
  "code":                   "PRJ-2026-002",
  "name_ar":                "مشروع مجمع سكني بجدة",
  "name_en":                "Jeddah Residential Complex",
  "company_id":             "org_002",
  "client_id":              "ptn_client01",
  "consultant_id":          "ptn_consult01",
  "contract_type":          "Lump Sum",
  "contract_value":         125000000,
  "currency":               "SAR",
  "start_date":             "2026-02-01",
  "planned_end_date":       "2027-08-31",
  "contract_duration_days": 547,
  "location":               "جدة - حي النزهة",
  "sector":                 "Residential",
  "fidic_conditions":       true,
  "retention_pct":          5,
  "advance_payment_pct":    10,
  "ld_per_day":             10000,
  "performance_bond_pct":   10
}
```

#### GET /projects/{id}
```
Response: Full project object with computed KPIs (CPI, SPI, EAC, completion %)
```

#### PUT /projects/{id}
```
Permissions: UPDATE_PROJECT (ProjectManager, ProjectDirector)
```

#### GET /projects/{id}/wbs
```
Description: Return full WBS tree structure
Query: ?level=1-5&include_costs=true&include_progress=true
Response:
{
  "data": [
    {
      "id":          "wbs_001",
      "code":        "1",
      "description": "أعمال الهياكل الإنشائية",
      "level":       1,
      "budget":      85000000,
      "actual":      38200000,
      "eac":         90500000,
      "completion":  45,
      "children": [...]
    }
  ]
}
```

#### POST /projects/{id}/wbs
```
Request Body:
{
  "parent_id":   "wbs_001",
  "code":        "1.2",
  "description": "أعمال الخرسانة المسلحة - الأعمدة",
  "unit":        "م³",
  "quantity":    1250,
  "unit_rate":   850,
  "cost_code":   "CC-03-30-00"
}
```

#### GET /projects/{id}/milestones
```
Response: Array of milestones with planned/actual dates, LD exposure, status
```

#### POST /projects/{id}/baselines
```
Description:  Save a new schedule/cost baseline snapshot
Permissions:  APPROVE_BASELINE
Request Body: { "baseline_name": "Revision 1 - Client Approved", "reason": "Scope change VO-003" }
```

#### GET /projects/{id}/team
```
Response: Project organizational chart (OBS) with RACI roles
```

---

### 3.4 Cost Control

#### GET /projects/{id}/evm
```
Description: Return full Earned Value Management metrics
Response 200:
{
  "data": {
    "as_of_date":        "2026-11-20",
    "bac":               450000000,
    "pv":                195000000,
    "ev":                171600000,
    "ac":                182400000,
    "cv":               -10800000,
    "sv":               -23400000,
    "cpi":               0.941,
    "spi":               0.880,
    "eac_cpi":           478236344,
    "eac_tcpi":          461000000,
    "etc":               295836344,
    "vac":              -28236344,
    "tcpi":              1.071,
    "percent_complete":  43.5,
    "percent_spent":     46.2,
    "trend":             "deteriorating",
    "narrative":         "Cost overrun driven by concrete price escalation (+18%) and rework on Level 3 slabs (NCR-2026-047)"
  }
}
```

#### GET /projects/{id}/cost-codes
```
Description: Return hierarchical cost code structure with budget vs actual
Response: Tree of cost codes with variance analysis at each level
```

#### POST /projects/{id}/cost-codes
```
Request Body:
{
  "parent_code": "CC-03",
  "code":        "CC-03-30-00",
  "name_ar":     "خرسانة مصبوبة في الموقع",
  "name_en":     "Cast-In-Place Concrete",
  "type":        "direct_cost",
  "budget":      38000000
}
```

#### GET /projects/{id}/forecasts
```
Response: EAC trend over time, monthly forecast vs budget, funding requirements
```

#### POST /projects/{id}/commitments
```
Description: Record a cost commitment (PO, Subcontract)
Request Body: { "type": "subcontract", "ref_id": "sub_abc123", "amount": 12500000, "cost_code": "CC-03-30-00" }
```

#### GET /projects/{id}/variance-report
```
Description:  Monthly variance analysis report
Query Params: ?period=2026-10&breakdown=cost_code|wbs|responsible
Response:     Tabular variance data with narrative explanations
```

#### GET /projects/{id}/cash-flow
```
Response: Monthly cash in (IPC receipts) vs cash out (payments) for 24 months
```

---

### 3.5 Planning & Scheduling

#### GET /projects/{id}/schedules
```
Response: List of schedules (Original, Revised, Recovery Plan)
```

#### GET /schedules/{id}/activities
```
Query: ?filter=critical_path|near_critical&lookahead_weeks=4
Response:
{
  "data": [
    {
      "id":            "act_001",
      "code":          "A100",
      "name":          "إزالة الأعمال المدنية وأعمال الحفر",
      "type":          "task",
      "duration_days": 25,
      "planned_start": "2026-01-05",
      "planned_finish":"2026-01-30",
      "actual_start":  "2026-01-07",
      "actual_finish": null,
      "percent_complete": 85,
      "total_float":   0,
      "free_float":    0,
      "is_critical":   true,
      "predecessors":  [{ "activity_id": "act_000", "relationship": "FS", "lag": 0 }],
      "resources":     [{ "resource_id": "res_001", "type": "labor", "units": 15 }]
    }
  ]
}
```

#### POST /schedules/{id}/activities
```
Request Body:
{
  "code":          "A250",
  "name":          "صب خرسانة سقف الدور الثالث",
  "wbs_id":        "wbs_003",
  "duration_days": 5,
  "planned_start": "2026-11-25",
  "calendar_id":   "cal_6day",
  "constraint_type": "SNET",
  "constraint_date": "2026-11-23",
  "predecessors":  [{ "activity_id": "act_240", "relationship": "FS", "lag": 1 }]
}
```

#### GET /schedules/{id}/critical-path
```
Response: Array of critical activities forming the project critical path
```

#### GET /schedules/{id}/s-curve
```
Query: ?type=planned|actual|earned_value&from=2026-01&to=2026-12
Response: Array of { month, cumulative_planned, cumulative_actual, cumulative_ev } data points
```

#### GET /schedules/{id}/lookahead
```
Query: ?weeks=4
Response: Activities starting or finishing in the next 4 weeks, grouped by week
```

#### POST /schedules/{id}/progress-update
```
Request Body:
{
  "as_of_date": "2026-11-20",
  "updates": [
    { "activity_id": "act_001", "percent_complete": 85, "remaining_days": 2 },
    { "activity_id": "act_002", "actual_start": "2026-11-18", "percent_complete": 15 }
  ]
}
```

---

### 3.6 Estimation & Tendering

#### GET /estimates
```
Response: List of project estimates with status and totals
```

#### POST /estimates
```
Request Body:
{
  "project_id":    "prj_abc123",
  "name":          "Detailed Estimate Rev 3",
  "currency":      "SAR",
  "markup_pct":    12.5,
  "overhead_pct":  8,
  "contingency_pct": 5
}
```

#### GET /rate-library
```
Query: ?category=concrete|steel|formwork&region=Riyadh
Response: Array of resource rates (labor, material, equipment) from rate library
```

#### GET /estimates/{id}/summary
```
Response: Cost summary by division with markup, overhead, profit, and bid price
```

#### POST /tenders/{id}/award
```
Permissions: AWARD_TENDER (ExecutiveDirector)
Request Body: { "awarded_to": "ptn_supplier01", "awarded_value": 125000000, "award_date": "2026-11-20" }
```

---

### 3.7 Quantity Surveying

#### GET /projects/{id}/boq
```
Response: Full Bill of Quantities with quantities, rates, extensions, VAT
```

#### GET /projects/{id}/ipcs
```
Response: List of Interim Payment Certificates with status
```

#### POST /projects/{id}/ipcs
```
Permissions: CREATE_IPC (QS Engineer)
Request Body:
{
  "ipc_number":  "IPC-007",
  "period_from": "2026-10-01",
  "period_to":   "2026-10-31",
  "items": [
    { "boq_item_id": "boq_001", "qty_this_period": 350, "cumulative_qty": 2850 }
  ]
}
```

#### POST /ipcs/{id}/submit
```
Description: Submit IPC to Consultant for certification
Permissions: SUBMIT_IPC
```

#### POST /ipcs/{id}/certify
```
Description: Consultant certifies IPC (or issues partial certification)
Permissions: CERTIFY_IPC (Consultant role)
Request Body: { "certified_amount": 4850000, "deductions": [...], "comments": "..." }
```

#### POST /ipcs/{id}/approve-payment
```
Permissions: APPROVE_PAYMENT (CFO, Finance Director)
```

---

### 3.8 Procurement

#### GET /purchase-requests
```
Query: ?status=pending|approved|rejected&raised_by=usr_abc
Response: List of PRs with approval status
```

#### POST /purchase-requests
```
Permissions: CREATE_PR
Request Body:
{
  "project_id":    "prj_abc123",
  "cost_code":     "CC-03-30-00",
  "material_desc": "أسمنت بورتلاندي عادي 50 كجم",
  "unit":          "كيس",
  "qty_required":  5000,
  "required_date": "2026-12-01",
  "justification": "صب خرسانة قاعدة D-12",
  "urgency":       "normal"
}
```

#### POST /purchase-requests/{id}/approve
```
Permissions: APPROVE_PR (based on value threshold in approval matrix)
```

#### POST /rfqs
```
Description: Issue Request for Quotation to selected vendors
Request Body:
{
  "pr_ids":           ["pr_001", "pr_002"],
  "vendor_ids":       ["ptn_v01", "ptn_v02", "ptn_v03"],
  "submission_deadline": "2026-11-28T17:00:00Z",
  "terms":            "Payment: 30 days. Delivery: DDP site"
}
```

#### POST /quotations
```
Description: Record a vendor quotation response
Request Body:
{
  "rfq_id":    "rfq_001",
  "vendor_id": "ptn_v01",
  "items": [
    { "pr_item_id": "pri_001", "unit_price": 18.50, "lead_time_days": 7 }
  ],
  "validity_days": 30,
  "payment_terms": "Net 30"
}
```

#### GET /rfqs/{id}/comparison
```
Description: Return bid comparison matrix — all vendors side-by-side
Response:
{
  "data": {
    "rfq_id":  "rfq_001",
    "items":   [...],
    "vendors": [
      { "vendor_id": "ptn_v01", "total": 92500, "technical_score": 88, "recommended": true },
      { "vendor_id": "ptn_v02", "total": 97200, "technical_score": 82, "recommended": false }
    ]
  }
}
```

#### POST /purchase-orders
```
Permissions: CREATE_PO (Procurement Engineer) | APPROVE_PO (Procurement Manager based on value)
Request Body:
{
  "rfq_id":          "rfq_001",
  "vendor_id":       "ptn_v01",
  "project_id":      "prj_abc123",
  "delivery_date":   "2026-12-05",
  "delivery_address":"موقع المشروع - الرياض",
  "payment_terms":   "Net 30",
  "items": [
    { "description": "أسمنت بورتلاندي", "unit": "كيس", "qty": 5000, "unit_price": 18.50, "cost_code": "CC-03-30-00" }
  ],
  "zatca_eligible":  true
}
```

#### POST /deliveries
```
Description: Record Goods Receipt Note (GRN)
Permissions: RECORD_GRN (Storekeeper)
Request Body:
{
  "po_id":           "po_abc123",
  "delivery_date":   "2026-12-06",
  "delivery_note":   "DN-2026-1234",
  "items": [
    { "po_line_id": "pol_001", "qty_received": 4800, "qty_rejected": 50, "rejection_reason": "Damaged bags" }
  ]
}
```

---

### 3.9 Inventory & Warehouse

#### GET /warehouses/{id}/stock
```
Query: ?category=&low_stock=true&search=
Response: Current stock levels with reorder alerts
```

#### POST /stock-movements
```
Description: Record stock issue, receipt, transfer, or adjustment
Request Body:
{
  "warehouse_id":  "wh_001",
  "type":          "issue",           // receipt | issue | transfer | adjustment
  "reference":     "MR-2026-0045",
  "items": [
    { "stock_item_id": "sti_001", "qty": 200, "unit_cost": 18.50, "destination_project": "prj_abc" }
  ]
}
```

#### POST /material-requests
```
Request Body:
{
  "project_id":  "prj_abc123",
  "site_foreman":"م. علي الحربي",
  "items": [
    { "stock_item_id": "sti_001", "qty_required": 500, "required_date": "2026-11-25", "cost_code": "CC-03-30-00" }
  ]
}
```

#### GET /stock/reorder-alerts
```
Response: Items below reorder level with auto-PR generation status
```

---

### 3.10 Equipment Management

#### GET /equipment
```
Query: ?status=working|idle|breakdown|maintenance&type=crane|excavator
Response: Fleet list with utilization summary
```

#### POST /fuel-logs
```
Request Body:
{
  "equipment_id":  "eq_001",
  "date":          "2026-11-20",
  "fuel_type":     "Diesel",
  "qty_liters":    450,
  "hours_reading": 12450,
  "project_id":    "prj_abc123",
  "operator_id":   "emp_001"
}
```

#### POST /maintenance-orders
```
Permissions: CREATE_MAINTENANCE_ORDER
Request Body:
{
  "equipment_id":  "eq_001",
  "type":          "preventive",        // preventive | corrective | inspection
  "scheduled_date":"2026-11-25",
  "estimated_hours": 8,
  "work_description": "5000-hour service: oil change, filters, hydraulics check",
  "parts_required": [{ "part_name": "Oil Filter", "qty": 2 }]
}
```

---

### 3.11 Human Resources & Payroll

#### GET /employees
```
Query: ?nationality=Saudi|Egyptian&designation=Engineer&project_id=
Response: Employee list with status, IQAMA expiry alerts
```

#### POST /attendance
```
Description: Bulk attendance record from biometric or mobile
Request Body:
{
  "date": "2026-11-20",
  "records": [
    { "employee_id": "emp_001", "check_in": "07:02", "check_out": "17:15", "site_id": "site_abc" }
  ]
}
```

#### POST /payroll/runs
```
Permissions: PROCESS_PAYROLL (HR Manager)
Request Body:
{
  "period_month": 11,
  "period_year":  2026,
  "org_id":       "org_002",
  "include_employees": "all"           // or array of employee IDs
}
```

#### GET /payroll/runs/{id}/items
```
Response: Payroll breakdown per employee: earnings, deductions, net pay, WPS status
```

---

### 3.12 Document Control

#### GET /documents
```
Query: ?discipline=structural|mechanical|civil&status=approved|under_review&search=
Response: Document register with revision history summary
```

#### POST /documents
```
Permissions: UPLOAD_DOCUMENT
Request Body (multipart/form-data):
  file:            <binary>
  metadata: {
    "doc_number":  "STR-DWG-001",
    "title":       "Foundation Plan — Grid A-J",
    "discipline":  "Structural",
    "type":        "Drawing",
    "revision":    "0",
    "project_id":  "prj_abc123"
  }
```

#### POST /documents/{id}/revisions
```
Description: Upload a new revision of an existing document
Request Body: multipart — file + { "revision": "B", "change_description": "Foundation depth revised" }
```

#### POST /transmittals
```
Description: Issue a document transmittal to a recipient
Request Body:
{
  "to":          "ptn_consultant01",
  "document_ids":["doc_001", "doc_002"],
  "purpose":     "For Review and Approval",
  "remarks":     "Please review and return within 14 days per contractual obligation"
}
```

#### POST /documents/{id}/review
```
Description: Submit document review response
Permissions: REVIEW_DOCUMENT (Consultant role)
Request Body:
{
  "review_code":  "B",   // A=Approved, B=Approved with Comments, C=Revise & Resubmit, D=Rejected
  "comments":     "Foundation reinforcement details incomplete — refer to SKE-COM-001",
  "markup_file":  "url_to_marked_up_pdf"
}
```

---

### 3.13 Technical Office

#### GET /rfis
```
Query: ?status=open|responded|closed&discipline=structural
Response: RFI register with response time KPI
```

#### POST /rfis
```
Request Body:
{
  "rfi_number":   "RFI-2026-0089",
  "subject":      "Clarification on Foundation Bearing Capacity at Column D-12",
  "question":     "...",
  "discipline":   "Structural",
  "raised_by":    "usr_abc123",
  "addressee_id": "ptn_consultant01",
  "required_by":  "2026-11-30",
  "attachments":  ["doc_001"]
}
```

#### POST /submittals
```
Request Body:
{
  "submittal_number": "SUB-MAT-0023",
  "type":             "Material Submittal",
  "description":      "Concrete Mix Design — C40/50 SRC",
  "spec_reference":   "Section 03 30 00",
  "submitted_by":     "us_abc123",
  "addressee_id":     "ptn_consultant01"
}
```

---

### 3.14 Contract Management

#### GET /contracts
```
Response: List of main and subcontracts with key dates and financial summary
```

#### POST /contracts/{id}/variations
```
Permissions: CREATE_VO (ProjectManager, ContractManager)
Request Body:
{
  "vo_number":     "VO-2026-012",
  "type":          "instructed",    // instructed | assessed | agreed
  "description":   "Additional underground drainage works at Zone B",
  "scope_impact":  true,
  "time_impact":   true,
  "eot_days":      14,
  "cost_impact":   1250000,
  "fidic_clause":  "13.1",
  "instruction_date": "2026-11-15"
}
```

#### POST /contracts/{id}/eot
```
Description: Claim Extension of Time
Request Body:
{
  "eot_ref":         "EOT-2026-003",
  "cause":           "Employer Risk — Design Changes",
  "fidic_clause":    "8.5",
  "delay_days":      28,
  "baseline_ref":    "baseline_02",
  "supporting_docs": ["doc_045", "doc_046"]
}
```

---

### 3.15 Claims Management

#### GET /claims
```
Response: Claim register — all types (delay, disruption, cost escalation, variation)
```

#### POST /claims
```
Permissions: CREATE_CLAIM (Contract Manager, Commercial Manager)
Request Body:
{
  "claim_number":   "CLM-2026-004",
  "type":           "delay_eot",   // delay_eot | disruption | variation | escalation
  "description":    "EOT for Force Majeure — COVID-related labor restrictions",
  "fidic_clause":   "19.1",
  "notice_date":    "2026-03-15",
  "quantum_days":   45,
  "cost_quantum":   3800000,
  "status":         "submitted"
}
```

#### GET /claims/{id}/delay-analysis
```
Response: Time Impact Analysis (TIA) data — windows, impacted activities, EOT entitlement
```

---

### 3.16 QA/QC

#### GET /inspection-requests
```
Query: ?status=pending|accepted|rejected&discipline=concrete
Response: WIR/IR register with response times
```

#### POST /inspection-requests
```
Request Body:
{
  "ir_number":      "WIR-2026-0234",
  "type":           "Work Inspection Request",
  "element":        "Reinforcement — Slab Level 5 Zone A",
  "location":       "Grid B-F, C-G",
  "inspection_date":"2026-11-21",
  "time":           "09:00",
  "itp_reference":  "ITP-STR-003",
  "raised_by":      "usr_abc123"
}
```

#### POST /ncrs
```
Description: Issue Non-Conformance Report
Request Body:
{
  "ncr_number":     "NCR-2026-0067",
  "description":    "Concrete cube strength below specified f'c=40 MPa — results show 34.5 MPa",
  "location":       "Level 3 Slab — Column Grid H-12",
  "severity":       "major",
  "raised_by":      "usr_qa01",
  "responsible_id": "sub_001",
  "closure_deadline":"2026-11-30"
}
```

---

### 3.17 HSE

#### POST /incidents
```
Permissions: REPORT_INCIDENT (Any user)
Request Body:
{
  "incident_number": "INC-2026-0012",
  "date":            "2026-11-20",
  "time":            "10:35",
  "type":            "near_miss",   // fatality | lti | first_aid | near_miss | property_damage
  "description":     "Scaffolding plank slipped on Level 4 — no injury",
  "location":        "النطاق D — الواجهة الغربية",
  "injured_name":    null,
  "root_cause":      "Inadequate securing of scaffold boards",
  "immediate_action":"Area cordoned, boards replaced and re-tied"
}
```

#### POST /ptw-requests
```
Description: Issue Permit to Work
Request Body:
{
  "ptw_number":    "PTW-2026-0089",
  "type":          "hot_work",    // hot_work | confined_space | working_at_height | electrical | excavation
  "work_description": "Welding of steel reinforcement lap joints — Level 6",
  "location":      "Grid B-D, Level 6",
  "valid_from":    "2026-11-21T07:00:00Z",
  "valid_to":      "2026-11-21T17:00:00Z",
  "responsible":   "emp_welder01",
  "precautions":   ["Fire extinguisher present", "Hot work attendant assigned", "SIMOPS clearance obtained"]
}
```

---

### 3.18 BIM Integration

#### POST /bim-models
```
Description: Upload BIM model (IFC format)
Permissions: MANAGE_BIM_MODELS
Request Body (multipart): file (IFC) + metadata
```

#### GET /bim-models/{id}/elements
```
Query: ?discipline=structural&level=4
Response: BIM element list with quantities, linked cost codes, linked activities
```

#### GET /clash-reports/{id}/items
```
Response: Clash detection results — element pairs, discipline conflict, severity, BCF reference
```

#### GET /bim-models/{id}/quantity-extraction
```
Description:  5D QTO — extract quantities from BIM for BOQ comparison
Query:        ?element_type=wall|slab|column&level=
Response:     Quantities per element type with area, volume, weight
```

---

### 3.19 Reports

#### GET /reports/evm
```
Query: ?project_id=prj_abc&as_of_date=2026-11&format=json|pdf|excel
Response: Full EVM report (BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, ETC, VAC, TCPI)
```

#### GET /reports/cash-flow
```
Query: ?project_id=prj_abc&from=2026-01&to=2026-12
Response: Monthly cash flow projection (income, expenditure, net, cumulative)
```

#### GET /reports/safety-statistics
```
Query: ?project_id=&from=&to=
Response: LTIFR, TRIFR, LTISR, man-hours worked, days without LTI
```

#### GET /reports/progress
```
Query: ?project_id=&period=2026-10
Response: Monthly progress report — planned vs actual, issues, upcoming milestones
```

#### GET /reports/subcontract-status
```
Response: All subcontracts — contract value, certified, retained, net payable, status
```

---

### 3.20 Finance & ZATCA

#### POST /gl/journal-entries
```
Permissions: POST_JOURNAL_ENTRY (Finance Manager)
Request Body:
{
  "reference":    "JE-2026-1234",
  "description":  "IPC-007 Revenue Recognition",
  "date":         "2026-10-31",
  "lines": [
    { "account_code": "1200", "debit": 4850000, "credit": 0,       "cost_code": "CC-03", "description": "Accounts Receivable" },
    { "account_code": "4100", "debit": 0,       "credit": 4850000, "cost_code": "CC-03", "description": "Construction Revenue" }
  ]
}
```

#### POST /zatca/submit
```
Description:  Submit e-invoice to ZATCA FATOORAH portal (Phase 2)
Permissions:  SUBMIT_ZATCA_INVOICE
Request Body:
{
  "invoice_id":   "inv_abc123",
  "invoice_type": "tax_invoice",    // tax_invoice | simplified_tax_invoice | credit_note | debit_note
  "zatca_env":    "production"      // sandbox | production
}
Response:
{
  "data": {
    "zatca_uuid":          "3cf5ee18-ee25-44ea-a444-2c37ba7f28be",
    "zatca_status":        "REPORTED",
    "zatca_clearance_status": "CLEARED",
    "cryptographic_stamp": "...",
    "qr_code_base64":      "..."
  }
}
```

---

### 3.21 AI Construction Copilot

#### POST /ai/chat
```
Description:  Natural language query to the AI Copilot
Request Body:
{
  "message":    "ما هو التكلفة المتوقعة لإكمال المشروع؟ وما أسباب الانحراف في التكلفة؟",
  "agent":      "cost_control",   // planning | cost_control | qs | procurement | qaqc | hse | contracts | claims | bim
  "project_id": "prj_abc123",
  "context":    { "include_evm": true, "include_ncrs": true }
}
Response:
{
  "data": {
    "response":  "بناءً على بيانات EVM الحالية، التكلفة المتوقعة للإكمال (EAC) = 478,236,344 ريال، بزيادة 28.2 مليون عن الميزانية (BAC = 450M). أسباب الانحراف الرئيسية: 1) ارتفاع أسعار الخرسانة 18%، 2) أعمال معادة بسبب NCR-047، 3) تأخر مقاول الباطن REI في أعمال الحديد.",
    "citations": [{ "type": "evm_report", "ref": "EVM-2026-10" }, { "type": "ncr", "ref": "NCR-2026-047" }],
    "actions":   [{ "label": "عرض تقرير EVM", "url": "/reports/evm?project_id=prj_abc" }]
  }
}
```

#### POST /ai/analyze/{entity}
```
Examples:
  POST /ai/analyze/claim   — assess claim merit, precedent, FIDIC compliance
  POST /ai/analyze/rfi     — suggest response based on spec/drawings
  POST /ai/analyze/schedule — identify delay patterns, predict critical path shift
  POST /ai/analyze/cost    — predict cost overrun probability (ML model)

Request Body: { "entity_id": "clm_001", "analysis_type": "merit|risk|recommendation" }
```

#### POST /ai/generate-report
```
Description: AI-generated PDF/Word report from project data
Request Body:
{
  "report_type": "monthly_progress|evm|safety_stats|claims_summary",
  "project_id":  "prj_abc123",
  "period":      "2026-10",
  "format":      "pdf",
  "language":    "ar"
}
Response: { "data": { "download_url": "https://docs.mimar.sa/reports/..." } }
```

---

### 3.22 Mobile Sync

#### POST /sync/push
```
Description:  Upload offline-collected data from mobile device
Request Body:
{
  "device_id":  "dev_abc123",
  "last_sync":  "2026-11-20T07:00:00Z",
  "records": [
    { "entity": "site_diary", "local_id": "local_001", "data": {...}, "timestamp": "2026-11-20T09:15:00Z" },
    { "entity": "inspection_request", "local_id": "local_002", "data": {...}, "timestamp": "..." }
  ]
}
Response:
{
  "data": {
    "synced":   24,
    "conflicts": [{ "local_id": "local_003", "conflict_type": "concurrent_edit", "server_version": {...} }],
    "server_id_map": { "local_001": "sd_server_001", "local_002": "ir_server_002" }
  }
}
```

#### GET /sync/pull
```
Query: ?since=2026-11-20T07:00:00Z&entities=site_diary,inspection_requests,activities
Response: All server-side changes since the last sync timestamp
```

---

## 4. Permissions Matrix

| Endpoint Group | ExecutiveDirector | ProjectManager | CostControl | QS | Procurement | SiteEngineer | Storekeeper | HR | QA_QC | HSE | Consultant | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View Projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View EVM/Cost | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve IPC | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Create PO | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve PO (>100K) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create VO | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Master Data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage HSE PTW | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Process Payroll | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit ZATCA Invoice | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Copilot Query | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## 5. Webhook Events

```json
{
  "event":      "ipc.submitted",
  "tenant_id":  "ten_abc123",
  "timestamp":  "2026-11-20T10:30:00Z",
  "data": {
    "ipc_id":        "ipc_007",
    "project_id":    "prj_abc",
    "submitted_by":  "usr_abc",
    "amount":        4850000,
    "period":        "2026-10"
  }
}
```

| Event | Trigger |
|---|---|
| `project.created` | New project created |
| `project.status_changed` | Project status changes |
| `ipc.submitted` | IPC submitted for review |
| `ipc.certified` | IPC certified by Consultant |
| `ipc.payment_approved` | Finance approves IPC payment |
| `po.created` | New purchase order created |
| `po.approved` | PO approved at any level |
| `po.delivered` | GRN recorded |
| `vo.instructed` | Variation Order issued |
| `vo.approved` | VO approved |
| `eot.submitted` | EOT claim submitted |
| `claim.submitted` | Commercial claim submitted |
| `ncr.raised` | Non-Conformance raised |
| `ncr.closed` | NCR closed |
| `incident.reported` | HSE incident reported |
| `incident.fatal` | Fatal incident (immediate notification) |
| `ptw.issued` | Permit to Work issued |
| `schedule.delay_detected` | Critical activity behind schedule |
| `cost.overrun_alert` | CPI falls below threshold |
| `document.approved` | Document approved in review cycle |
| `rfi.responded` | RFI response received |
| `payroll.processed` | Payroll run complete |
| `zatca.invoice_cleared` | ZATCA clearance confirmed |
| `ai.recommendation` | AI Copilot generates action recommendation |
