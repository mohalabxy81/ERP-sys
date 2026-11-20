# -*- coding: utf-8 -*-
"""
Module specs 1 to 5: Auth, Organizations, Projects, Cost Control, Planning
"""

def get_modules_1_to_5():
    return """
### Module 1: Authentication & Identity (`/api/v1/auth`)

#### 1.1 POST `/auth/login`
- **Description:** Authenticates user via email and password credentials within a specific tenant context or auto-resolves tenant via domain. Issues a short-lived access JWT (15 min) and sliding refresh token (7 days).
- **Permissions Required:** None (Public / Unauthenticated).
- **Rate Limit:** 20 req/min per IP.
- **Request Body:**
```json
{
  "email": "salman.alotaibi@mimar-contracting.sa",
  "password": "SecurePassword#2026",
  "tenantSubdomain": "mimar-contracting",
  "deviceInfo": {
    "deviceId": "dev_994a-88bc-11df",
    "deviceType": "WEB_SPA",
    "browser": "Chrome 131",
    "ipAddress": "212.138.10.45"
  }
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": {
    "user": {
      "id": "usr_7718294a-bc10-4491-a882-192039485712",
      "email": "salman.alotaibi@mimar-contracting.sa",
      "fullNameAr": "سلمان فهيد العتيبي",
      "fullNameEn": "Salman Faheed Al-Otaibi",
      "jobTitle": "Senior Project Director",
      "roles": ["project_director", "cost_approver"],
      "avatarUrl": "https://cdn.mimar.sa/avatars/usr_771829.jpg"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InByb2QtMjAyNi0xMSJ9...",
      "tokenType": "Bearer",
      "expiresInSeconds": 900,
      "refreshToken": "rft_88a91c0e-4321-4fca-9912-882910fa7701"
    },
    "tenant": {
      "id": "ten_7a82b012-3294-4d83-9b88-129039fbc811",
      "name": "Mimar Contracting & Trading Co.",
      "code": "MIMAR-KSA",
      "crNumber": "1010192847",
      "vatNumber": "300182938400003"
    }
  },
  "meta": { "timestamp": "2026-11-20T18:45:00Z", "requestId": "req_auth_01" },
  "errors": null
}
```
- **Possible Errors:**
  - `400 Bad Request`: `E_INVALID_CREDENTIALS` (Invalid email or password).
  - `403 Forbidden`: `E_TENANT_SUSPENDED` (Tenant account past due).
  - `423 Locked`: `E_ACCOUNT_LOCKED` (Exceeded 5 consecutive failed login attempts).
  - `429 Too Many Requests`: `E_RATE_LIMIT_EXCEEDED`.

#### 1.2 POST `/auth/refresh`
- **Description:** Trades an active Refresh Token for a brand-new 15-minute Access JWT and a rotated Refresh Token. Enforces strict single-use refresh token rotation.
- **Permissions Required:** None (Valid Refresh Token Bearer).
- **Request Body:**
```json
{
  "refreshToken": "rft_88a91c0e-4321-4fca-9912-882910fa7701"
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InByb2QtMjAyNi0xMSJ9...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "refreshToken": "rft_99b02d1f-5432-5edb-aa23-993021fb8812"
  },
  "meta": { "timestamp": "2026-11-20T18:46:00Z", "requestId": "req_auth_02" }
}
```
- **Possible Errors:**
  - `401 Unauthorized`: `E_TOKEN_EXPIRED`, `E_INVALID_REFRESH_TOKEN`, `E_TOKEN_REUSED_DETECTED`.

#### 1.3 POST `/auth/logout`
- **Description:** Invalidates the caller's active access token JTI and revokes the associated refresh token chain in Redis.
- **Permissions Required:** Authenticated User.
- **Request Body:**
```json
{
  "refreshToken": "rft_99b02d1f-5432-5edb-aa23-993021fb8812",
  "logoutAllDevices": false
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": { "revoked": true, "sessionsTerminated": 1 },
  "meta": { "timestamp": "2026-11-20T18:47:00Z", "requestId": "req_auth_03" }
}
```

#### 1.4 POST `/auth/forgot-password`
- **Description:** Generates a cryptographically secure 6-digit OTP and reset token delivered via SMS (Saudi CITC licensed aggregator) and email.
- **Permissions Required:** None.
- **Request Body:**
```json
{
  "email": "salman.alotaibi@mimar-contracting.sa",
  "channel": "ALL"
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": { "message": "Verification instructions dispatched to registered channels." },
  "meta": { "timestamp": "2026-11-20T18:48:00Z", "requestId": "req_auth_04" }
}
```

#### 1.5 POST `/auth/reset-password`
- **Description:** Validates reset OTP/token and updates user password hash using Argon2id.
- **Permissions Required:** None.
- **Request Body:**
```json
{
  "email": "salman.alotaibi@mimar-contracting.sa",
  "resetToken": "rst_9918237461928475",
  "newPassword": "NewStrongPassword$2027"
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": { "passwordReset": true, "allSessionsInvalidated": true },
  "meta": { "timestamp": "2026-11-20T18:49:00Z", "requestId": "req_auth_05" }
}
```

---

### Module 2: Organizations & Cost Centers (`/api/v1/organizations`)

#### 2.1 GET `/organizations` & POST `/organizations`
- **GET `/organizations`:** Lists all legal entities, subsidiaries, regional offices, and branches under the current tenant.
  - **Permissions:** `organizations:read`.
  - **Response Body:** Paginated array of organization entities with hierarchical metadata.
- **POST `/organizations`:** Creates a new legal company, joint venture entity, or operational branch.
  - **Permissions:** `organizations:create` (Tenant Admin / Managing Director).
  - **Request Body:**
```json
{
  "code": "ORG-KSA-02",
  "nameAr": "شركة معمار للمقاولات التخصصية ذ.م.م",
  "nameEn": "Mimar Specialized Contracting LLC",
  "type": "SUBSIDIARY",
  "parentId": "org_55102048-9182-4f77-aa11-8820491029ab",
  "crNumber": "1010394851",
  "vatNumber": "300481920300003",
  "legalForm": "LLC",
  "country": "SA",
  "city": "Riyadh",
  "currency": "SAR",
  "headOfficeAddress": {
    "street": "King Fahd Road, Al-Olaya",
    "buildingNumber": "7421",
    "postalCode": "12214",
    "additionalNumber": "3190"
  }
}
```
  - **Response Body (`HTTP 201 Created`):** Returns the created organization with assigned UUID and audit timestamp.
  - **Possible Errors:** `409 Conflict`: `E_DUPLICATE_CR_NUMBER` or `E_DUPLICATE_VAT_NUMBER`.

#### 2.2 GET `/organizations/{id}`, PUT `/organizations/{id}`, DELETE `/organizations/{id}`
- **GET `/organizations/{id}`:** Fetches details of a specific organization node.
- **PUT `/organizations/{id}`:** Updates registration details, tax metadata, or corporate address.
- **DELETE `/organizations/{id}`:** Soft-deletes organization node if no active projects or posted ledger transactions exist.

#### 2.3 GET `/organizations/{id}/tree`
- **Description:** Returns the complete corporate hierarchy as a nested recursive tree node structure from Holding company down to operational project branches.
- **Permissions:** `organizations:read`.
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": {
    "id": "org_55102048-9182-4f77-aa11-8820491029ab",
    "code": "MIMAR-HOLDING",
    "nameAr": "مجموعة معمار القابضة",
    "nameEn": "Mimar Holding Group",
    "type": "HOLDING",
    "children": [
      {
        "id": "org_77102048-0001-4f77-aa11-8820491029bb",
        "code": "MIMAR-CIVIL",
        "nameAr": "معمار للإنشاءات المدنية",
        "nameEn": "Mimar Civil Construction",
        "type": "SUBSIDIARY",
        "children": [
          {
            "id": "org_88102048-0002-4f77-aa11-8820491029cc",
            "code": "BRANCH-RIYADH",
            "nameAr": "فرع منطقة الرياض والمشاريع الكبرى",
            "nameEn": "Riyadh Region & Mega-Projects Branch",
            "type": "BRANCH",
            "children": []
          }
        ]
      }
    ]
  }
}
```

#### 2.4 GET & POST `/organizations/{id}/cost-centers`
- **GET `/organizations/{id}/cost-centers`:** Returns all operational and profit/cost centers configured under this corporate entity.
- **POST `/organizations/{id}/cost-centers`:** Creates a new general cost center for allocation.
- **Request Body:**
```json
{
  "code": "CC-1100-HEAVY-EQ",
  "nameAr": "مركز تكلفة أسطول المعدات الثقيلة",
  "nameEn": "Heavy Equipment Fleet Cost Center",
  "type": "COST_CENTER",
  "parentCostCenterId": null,
  "allocatedAnnualBudget": 18500000.00,
  "currency": "SAR",
  "managerEmployeeId": "emp_01JG8X97N5D0W0N0K2T9A7C1P4"
}
```

---

### Module 3: Project Management (`/api/v1/projects`)

#### 3.1 CRUD `/projects` (`GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`)
- **GET `/projects`:** Queries multi-project portfolio with filtering by client, region, status, and health metrics (CPI/SPI).
- **POST `/projects`:** Initializes a new construction project.
- **Permissions:** `projects:create` (Project Director / PMO Lead).
- **Request Body:**
```json
{
  "projectCode": "PRJ-2026-RYD-041",
  "nameAr": "مشروع إنشاء برج المرقاب الإداري الفندقي",
  "nameEn": "Al-Murqab Commercial & Hospitality Tower",
  "organizationId": "org_88102048-0002-4f77-aa11-8820491029cc",
  "clientId": "clt_99182374-1294-4a22-b918-771829384756",
  "contractType": "FIDIC_RED_BOOK_1999",
  "scopeSummary": "Construction of 45-storey mixed-use tower with 4 basements, MEP and LEED Gold fitout.",
  "originalContractValue": 348500000.00,
  "currency": "SAR",
  "commencementDate": "2026-03-01",
  "originalCompletionDate": "2028-09-30",
  "location": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "addressAr": "الرياض - طريق الملك فهد - حي الصحافة",
    "addressEn": "Riyadh - King Fahd Rd - Al-Sahafa District"
  },
  "projectDirectorId": "usr_7718294a-bc10-4491-a882-192039485712"
}
```
- **Response Body (`HTTP 201 Created`):** Returns full project object including generated tracking hashes and default cost/schedule roots.

#### 3.2 GET & POST `/projects/{id}/phases`
- **GET:** Returns project execution phases (e.g. Mobilization, Substructure, Superstructure, Facade, MEP, Testing & Commissioning, Handover).
- **POST:** Creates or re-sequences a project phase.
- **Request Body:**
```json
{
  "phaseCode": "PH-02",
  "nameEn": "Substructure & Deep Foundation Works",
  "nameAr": "أعمال الأساسات العميقة والهيكل السفلي",
  "startDate": "2026-05-01",
  "endDate": "2026-12-15",
  "sequenceNumber": 2,
  "weightagePercentage": 14.5
}
```

#### 3.3 GET & POST `/projects/{id}/wbs`
- **Description:** Manages the Hierarchical Work Breakdown Structure (WBS) up to 8 levels deep.
- **POST `/projects/{id}/wbs` Request Body:**
```json
{
  "wbsCode": "1.2.3.01",
  "parentWbsId": "wbs_01JG8X97N5D0W0N0K2T9A7C1P0",
  "titleAr": "صب خرسانة مسلحة لأعمدة الطابق الأرضي",
  "titleEn": "RC Columns Casting - Ground Floor",
  "costCodeRef": "03-3100.01",
  "estimatedBudget": 1450000.00,
  "currency": "SAR"
}
```

#### 3.4 GET, POST, DELETE `/projects/{id}/team`
- **Description:** Allocates site staff, project managers, planning engineers, QS, QA/QC inspectors, and HSE officers to project security boundaries.
- **POST `/projects/{id}/team`:**
```json
{
  "userId": "usr_10293847-1928-4bc2-8812-771829384710",
  "projectRole": "LEAD_QAQC_MANAGER",
  "allocationPercentage": 100,
  "assignedStartDate": "2026-03-01",
  "assignedEndDate": "2028-09-30",
  "canApproveSubmittals": true,
  "canSignInspectionRequests": true
}
```

#### 3.5 GET & POST `/projects/{id}/baselines`
- **Description:** Captures or retrieves an immutable snapshot of Project Budget (Cost Baseline 0) or Schedule (Schedule Baseline 0).
- **POST `/projects/{id}/baselines`:**
```json
{
  "baselineType": "INITIAL_APPROVED_BASELINE",
  "baselineCode": "BL-001-REV0",
  "description": "Board Approved Target Baseline per Contract Award",
  "approvedByUserId": "usr_7718294a-bc10-4491-a882-192039485712",
  "approvalReference": "BOD-RES-2026-042"
}
```

#### 3.6 GET & POST `/projects/{id}/milestones`
- **Description:** Manages contractual and operational milestone gates (e.g. Substructure completion, Roof slab pouring, Substation energization, Civil Defense Certificate).
- **POST `/projects/{id}/milestones`:**
```json
{
  "milestoneCode": "MS-04",
  "titleAr": "إنهاء أعمال الهيكل الإنشائي بالكامل (Roof Slab Complete)",
  "titleEn": "Top-out / Structural Superstructure Completion",
  "contractualDate": "2027-08-30",
  "isContractualGate": true,
  "liquidatedDamagesPerDay": 25000.00,
  "maxLiquidatedDamages": 17425000.00,
  "associatedBillingPercent": 10.0
}
```

---

### Module 4: Cost Control & EVM (`/api/v1/projects/{id}`)

#### 4.1 GET & POST `/projects/{id}/budgets`
- **GET:** Returns the multi-level original and approved current working budget (BAC) distributed across CSI MasterFormat / UniFormat cost codes.
- **POST:** Creates or updates a revised budget allocation with formal change audit.
- **Permissions:** `cost:manage`.
- **Request Body:**
```json
{
  "budgetRevisionCode": "REV-02-VARIATION-01",
  "effectiveDate": "2026-06-01",
  "reason": "Approved Variation Order VO-001 (Basement Waterproofing Upgrade)",
  "lines": [
    {
      "costCode": "07-1000",
      "costCodeDescription": "Dampproofing and Waterproofing",
      "originalBudget": 2200000.00,
      "adjustmentAmount": 340000.00,
      "revisedBudget": 2540000.00,
      "justification": "Consultant Instruction CI-014 change to dual membrane system"
    }
  ]
}
```

#### 4.2 GET & POST `/projects/{id}/cost-codes`
- **Description:** Standardizes enterprise and project-level Cost Breakdown Structure (CBS) with standard 5-part hierarchical codes (Discipline, Element, Trade, Work-Package, Sub-Item).

#### 4.3 GET `/projects/{id}/evm`
- **Description:** Computes real-time Earned Value Management (EVM) parameters strictly following PMI PMBOK & ANSI/EIA-748 standards:
  - Planned Value (PV), Earned Value (EV), Actual Cost (AC)
  - Cost Variance (CV = EV - AC), Schedule Variance (SV = EV - PV)
  - Cost Performance Index (CPI = EV / AC), Schedule Performance Index (SPI = EV / PV)
  - Estimate at Completion (EAC), Estimate to Complete (ETC), Variance at Completion (VAC), To-Complete Performance Index (TCPI).
- **Permissions:** `cost:read`, `pmo:read`.
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": {
    "asOfDate": "2026-11-01",
    "currency": "SAR",
    "budgetAtCompletion": 348500000.00,
    "plannedValue": 84200000.00,
    "earnedValue": 79650000.00,
    "actualCost": 82300000.00,
    "metrics": {
      "costVariance": -2650000.00,
      "scheduleVariance": -4550000.00,
      "cpi": 0.9678,
      "spi": 0.9460,
      "eac": 360095060.96,
      "etc": 277795060.96,
      "vac": -11595060.96,
      "tcpi": 1.0097
    },
    "healthStatus": "AMBER",
    "primaryCostDriver": "High concrete pouring overtime and steel mill price adjustments."
  }
}
```

#### 4.4 GET & POST `/projects/{id}/forecasts`
- **Description:** Manages dynamic Monthly Cost-to-Complete Forecasts (ETC) incorporating active commitments, subcontractor claims, and anticipated material escalations.

#### 4.5 GET `/projects/{id}/variance-report`
- **Description:** Produces root-cause variance breakdown comparing Actual vs Budgeted expenditures grouped by Labor, Equipment, Material, and Subcontract (LEMS).

---

### Module 5: Planning & Scheduling (`/api/v1`)

#### 5.1 GET & POST `/projects/{id}/schedules`
- **GET:** Returns Primavera P6 / MS Project compatible schedule manifests with CPM calculation status.
- **POST:** Creates a schedule version or imports an XER/XML schedule file.

#### 5.2 CRUD `/schedules/{id}/activities`
- **GET `/schedules/{id}/activities`:** Returns list of activities with early/late dates, float, and predecessor/successor logic.
- **POST `/schedules/{id}/activities`:** Adds an activity to the schedule network.
- **Request Body:**
```json
{
  "activityCode": "ACT-STR-1040",
  "nameAr": "نجارة وحدادة سقف الطابق العاشر",
  "nameEn": "Formwork and Rebar Fixing - Level 10 Slab",
  "wbsId": "wbs_01JG8X97N5D0W0N0K2T9A7C1P4",
  "activityType": "TASK_DEPENDENT",
  "originalDurationDays": 12,
  "calendarCode": "CAL-KSA-6D",
  "plannedStartDate": "2026-11-25T07:00:00Z",
  "predecessors": [
    {
      "activityCode": "ACT-STR-1030",
      "relationshipType": "FINISH_TO_START",
      "lagDays": 0
    }
  ]
}
```

#### 5.3 GET & POST `/activities/{id}/resources`
- **Description:** Assigns labor gangs, plant equipment, and bulk materials with planned consumption units per hour/day.

#### 5.4 GET `/schedules/{id}/critical-path`
- **Description:** Extracts the longest path activities with Total Float <= 0 days. Highlights contractual completion bottleneck risks.

#### 5.5 GET `/schedules/{id}/s-curve`
- **Description:** Yields cumulative Planned vs Actual vs Forecast progress percentages and monetary curves for charting.

#### 5.6 GET `/schedules/{id}/lookahead`
- **Description:** Filters activities scheduled in the next 2-week, 4-week, or 6-week window with site constraint readiness checks (Drawings approved, Materials in stock, Permits issued).
"""

if __name__ == "__main__":
    print("Modules 1-5 compiled.")
