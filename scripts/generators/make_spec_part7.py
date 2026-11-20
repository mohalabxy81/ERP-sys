# -*- coding: utf-8 -*-
"""
Part 7: OpenAPI 3.0 YAML Spec (Header + First 10 Endpoints in Full Detail),
Permissions Matrix (Role x Endpoint), Webhook Events Catalog
"""

def get_openapi_and_tables():
    return """
---

## 3. OpenAPI 3.0 Specification (Header & Top 10 Core Endpoints)

Below is the production-grade OpenAPI 3.0.3 specification covering security definitions, global parameter schemas, and the first 10 core endpoints in full YAML detail.

```yaml
openapi: 3.0.3
info:
  title: MimarERP v7 Enterprise REST API
  description: >
    Enterprise Construction Enterprise Resource Planning (ERP) REST API.
    Designed for mega-projects, Tier-1 main contractors, and PMOs operating under
    Saudi Building Code (SBC), FIDIC contracts, and ZATCA Phase 2 regulations.
  version: 1.0.0-PROD
  contact:
    name: Mimar Systems Architecture Group
    email: api-architecture@mimar.sa
    url: https://developer.mimar.sa
  license:
    name: Proprietary / Restricted Commercial License
    url: https://mimar.sa/licenses/enterprise-v7

servers:
  - url: https://api.mimar.sa/api/v1
    description: Production Cloud Gateway (Riyadh Data Center)
  - url: https://sandbox-api.mimar.sa/api/v1
    description: Sandbox / Integration Staging Gateway
  - url: http://mesh-gateway.internal/api/v1
    description: High-throughput Internal Service Mesh

security:
  - BearerAuth: []
  - TenantHeader: []

paths:
  /auth/login:
    post:
      tags:
        - Authentication
      summary: User authentication and token issuance
      description: Validates email and password credentials, returning short-lived JWT and sliding refresh token.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '400':
          $ref: '#/components/responses/400BadRequest'
        '401':
          $ref: '#/components/responses/401Unauthorized'
        '429':
          $ref: '#/components/responses/429RateLimit'

  /auth/refresh:
    post:
      tags:
        - Authentication
      summary: Refresh expired access token
      description: Trades an active refresh token for a newly rotated access token and fresh refresh token.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken:
                  type: string
                  example: rft_88a91c0e-4321-4fca-9912-882910fa7701
      responses:
        '200':
          description: Token successfully refreshed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TokenPair'
        '401':
          $ref: '#/components/responses/401Unauthorized'

  /auth/logout:
    post:
      tags:
        - Authentication
      summary: Terminate session and revoke tokens
      description: Invalidates active access token JTI and purges refresh token family in Redis.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken:
                  type: string
                logoutAllDevices:
                  type: boolean
                  default: false
      responses:
        '200':
          description: Session successfully invalidated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'

  /auth/forgot-password:
    post:
      tags:
        - Authentication
      summary: Request password reset OTP
      description: Dispatches a cryptographically secure reset code via email and Saudi SMS gateway.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email:
                  type: string
                  format: email
                  example: salman.alotaibi@mimar-contracting.sa
      responses:
        '200':
          description: Instructions dispatched if account exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'

  /auth/reset-password:
    post:
      tags:
        - Authentication
      summary: Complete password reset
      description: Validates reset token and sets new password.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, resetToken, newPassword]
              properties:
                email:
                  type: string
                  format: email
                resetToken:
                  type: string
                newPassword:
                  type: string
                  minLength: 12
      responses:
        '200':
          description: Password reset successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'

  /organizations:
    get:
      tags:
        - Organizations
      summary: List legal entities and branches
      description: Returns multi-company legal structures and subsidiaries under the current tenant.
      parameters:
        - $ref: '#/components/parameters/CursorParam'
        - $ref: '#/components/parameters/LimitParam'
      responses:
        '200':
          description: List of organizations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrganizationListResponse'
    post:
      tags:
        - Organizations
      summary: Register new legal entity or branch
      description: Creates a new corporate subsidiary or joint venture entity.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrganizationRequest'
      responses:
        '201':
          description: Organization successfully created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrganizationDetailResponse'
        '409':
          $ref: '#/components/responses/409Conflict'

  /organizations/{id}:
    get:
      tags:
        - Organizations
      summary: Get organization details
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Organization detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrganizationDetailResponse'
        '404':
          $ref: '#/components/responses/404NotFound'

  /organizations/{id}/tree:
    get:
      tags:
        - Organizations
      summary: Retrieve complete organization hierarchy
      description: Returns corporate structure as a nested tree from Holding down to regional branches.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Corporate hierarchy tree
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrganizationTreeResponse'

  /projects:
    get:
      tags:
        - Projects
      summary: Query project portfolio
      description: Fetches projects with filtering by client, region, status, and health indicators.
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [TENDERING, ACTIVE, SUSPENDED, COMPLETED, DEFECTS_LIABILITY]
        - $ref: '#/components/parameters/CursorParam'
        - $ref: '#/components/parameters/LimitParam'
      responses:
        '200':
          description: Filtered project portfolio
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectListResponse'
    post:
      tags:
        - Projects
      summary: Create new construction project
      description: Initializes a construction project with contractual budget, timeline, and location.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
      responses:
        '201':
          description: Project created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectDetailResponse'

  /projects/{id}:
    get:
      tags:
        - Projects
      summary: Retrieve single project overview
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Complete project record
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectDetailResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: OAuth2 RFC 6750 JWT Bearer Token.
    TenantHeader:
      type: apiKey
      in: header
      name: X-Tenant-ID
      description: Tenant UUID isolating multi-tenant schema scope.

  parameters:
    CursorParam:
      name: cursor
      in: query
      required: false
      description: Base64 opaque pagination cursor.
      schema:
        type: string
    LimitParam:
      name: limit
      in: query
      required: false
      description: Number of records to return (default 50, max 200).
      schema:
        type: integer
        default: 50
        maximum: 200

  schemas:
    StandardMeta:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string
        version:
          type: string
          example: 1.0.0
        executionTimeMs:
          type: number
          example: 18.4

    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
        tenantSubdomain:
          type: string

    LoginResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            user:
              type: object
            tokens:
              $ref: '#/components/schemas/TokenPair'
            tenant:
              type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

    TokenPair:
      type: object
      properties:
        accessToken:
          type: string
        tokenType:
          type: string
          example: Bearer
        expiresInSeconds:
          type: integer
          example: 900
        refreshToken:
          type: string

    CreateOrganizationRequest:
      type: object
      required: [code, nameAr, nameEn, type, crNumber, vatNumber]
      properties:
        code:
          type: string
        nameAr:
          type: string
        nameEn:
          type: string
        type:
          type: string
          enum: [HOLDING, SUBSIDIARY, BRANCH, JOINT_VENTURE]
        crNumber:
          type: string
        vatNumber:
          type: string

    CreateProjectRequest:
      type: object
      required: [projectCode, nameAr, nameEn, originalContractValue, commencementDate, originalCompletionDate]
      properties:
        projectCode:
          type: string
          example: PRJ-2026-RYD-041
        nameAr:
          type: string
        nameEn:
          type: string
        originalContractValue:
          type: number
          example: 348500000.00
        currency:
          type: string
          default: SAR
        commencementDate:
          type: string
          format: date
        originalCompletionDate:
          type: string
          format: date

    StandardResponse:
      type: object
      properties:
        data:
          type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

    OrganizationListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

    OrganizationDetailResponse:
      type: object
      properties:
        data:
          type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

    OrganizationTreeResponse:
      type: object
      properties:
        data:
          type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

    ProjectListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

    ProjectDetailResponse:
      type: object
      properties:
        data:
          type: object
        meta:
          $ref: '#/components/schemas/StandardMeta'

  responses:
    400BadRequest:
      description: Bad request payload or failed validation.
    401Unauthorized:
      description: Missing or expired authentication token.
    403Forbidden:
      description: Insufficient privileges or tenant mismatch.
    404NotFound:
      description: Requested entity does not exist.
    409Conflict:
      description: Resource state conflict or unique constraint violation.
    429RateLimit:
      description: Too many requests. Rate limit quota exceeded.
```

---

## 4. Enterprise RBAC Permissions Matrix

MimarERP v7 enforces deep Role-Based Access Control (RBAC) across 16 specialized construction roles. The matrix below specifies authorization rights:
- **C:** Create / Submit
- **R:** Read / Query / View Reports
- **U:** Update / Edit Draft
- **D:** Delete / Cancel
- **A:** Approve / Certify / Sign-off
- **—:** No Access / Forbidden

### Role Definitions:
1. **ADM:** Super / Tenant Administrator
2. **MD:** Managing Director / Board Executive
3. **PD:** Project Director / Senior PM
4. **CM:** Construction Manager / Site Manager
5. **PLN:** Planning Engineer
6. **CST:** Cost Control Engineer
7. **QS:** Quantity Surveyor / Billing Engineer
8. **PRC:** Procurement Manager / Buyer
9. **STR:** Warehouse Manager / Storekeeper
10. **QC:** QA/QC Manager / Inspector
11. **HSE:** HSE Manager / Safety Officer
12. **ENG:** Technical Office / BIM Engineer
13. **CLM:** Contract & Claims Specialist
14. **FIN:** Chief Financial Officer / Accountant
15. **HR:** HR Director / Camp Manager
16. **SUB:** Subcontractor / Client Representative

| Module & Endpoint Group | ADM | MD | PD | CM | PLN | CST | QS | PRC | STR | QC | HSE | ENG | CLM | FIN | HR | SUB |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **01. Auth & Profiles** | CRUD | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| **02. Organizations & CC** | CRUD | CRUA | R | R | — | R | — | — | — | — | — | — | — | CRUA | R | — |
| **03. Projects & WBS** | CRUD | CRUA | CRUA | RU | CRU | R | R | R | R | R | R | RU | R | R | R | R |
| **04. Cost Control & EVM** | CRUD | R | RUA | R | R | CRUA | R | R | — | — | — | — | R | RUA | — | — |
| **05. Planning & Schedules** | CRUD | R | RUA | RU | CRUA | R | R | R | — | — | — | R | RU | R | — | R |
| **06. Estimation & Rates** | CRUD | R | RU | — | R | CRUA | CRU | R | — | — | — | R | R | R | — | — |
| **07. Tendering & Bids** | CRUD | CRUA | CRUA | — | R | RU | RU | CRUA | — | — | — | R | RU | R | — | C (Bid) |
| **08. QS, BOQ & IPCs** | CRUD | R | RUA | R | R | RU | CRUA | R | — | R | — | R | RU | RUA | — | CR (Own) |
| **09. Procurement & POs** | CRUD | R | RUA | R | R | R | R | CRUA | RU | — | — | R | R | RUA | — | R (Own) |
| **10. Inventory & Stores** | CRUD | R | R | RU | — | R | R | RU | CRUA | — | — | — | — | R | — | — |
| **11. Plant & Equipment** | CRUD | R | RU | RU | R | R | — | R | RU | — | — | — | — | R | — | — |
| **12. HR, Payroll & Camp** | CRUD | R | R | R | — | — | — | — | — | — | — | — | — | RUA | CRUA | — |
| **13. Document Control** | CRUD | R | CRUA | CRU | CRU | R | R | R | R | CRU | CRU | CRUA | R | R | R | CR (Own) |
| **14. Technical Office & RFIs** | CRUD | R | RUA | CRU | R | — | — | — | — | R | — | CRUA | RU | — | — | CR (Own) |
| **15. Contracts & Variations** | CRUD | CRUA | CRUA | R | R | RU | RU | R | — | — | — | R | CRUA | RUA | — | R (Own) |
| **16. Claims & Forensic TIA** | CRUD | R | RUA | R | RU | RU | RU | — | — | — | — | R | CRUA | R | — | — |
| **17. QA/QC & NCRs** | CRUD | R | R | RU | — | — | — | — | — | CRUA | — | RU | — | — | — | R (Own) |
| **18. HSE & Work Permits** | CRUD | R | R | RU | — | — | — | — | — | — | CRUA | — | — | — | — | C (PTW) |
| **19. BIM & Clash Reports** | CRUD | R | R | R | R | — | RU | — | — | R | — | CRUA | — | — | — | R |
| **20. CRM & Opportunities** | CRUD | CRUA | R | — | — | — | — | — | — | — | — | — | — | R | — | — |
| **21. PMO Portfolio Dash** | CRUD | CRUA | RUA | R | R | R | R | R | R | R | R | R | R | R | R | — |
| **22. Finance & ZATCA** | CRUD | RUA | R | — | — | R | RU | R | — | — | — | — | — | CRUA | R | — |
| **23. Executive Reports** | CRUD | CRUA | CRUA | R | R | R | R | R | R | R | R | R | R | R | R | — |
| **24. AI Copilot** | CRUD | R | R | R | R | R | R | R | R | R | R | R | R | R | R | — |
| **25. Mobile Sync Engine** | CRUD | R | CRU | CRU | CRU | — | — | — | CRU | CRU | CRU | CRU | — | — | — | — |

---

## 5. Webhook Events Catalog & Notification Architecture

MimarERP v7 incorporates an event-driven webhook subsystem built on top of Apache Kafka and Redis Streams. External subscriber endpoints (e.g. Corporate Slack/Teams, SAP S/4HANA ESB, Primavera Sync, Subcontractor Portals) receive near real-time notifications for critical construction milestones.

### 5.1 Webhook Delivery Guarantees & Security
- **Delivery Guarantee:** At-least-once delivery with exponential backoff retry policy (1m, 5m, 15m, 1h, 6h, 24h).
- **HMAC Signature Verification:**
  Every webhook request includes an HTTP header:
  ```http
  X-Mimar-Signature: sha256=d3b07384d113edec49eaa6238ad5ff00...
  ```
  Generated using the tenant's pre-shared webhook secret: `HMAC-SHA256(request_body, tenant_secret)`.
- **Payload Idempotency:** Each event payload includes an immutable `eventId` (UUIDv4) and `timestamp` (ISO 8601).

### 5.2 Catalog of Standard Webhook Events

| Event Type | Trigger Condition | Primary Consumer Systems |
| :--- | :--- | :--- |
| `project.created` | New project authorized by PMO | Primavera P6, BIM CDE, SAP Cost Center |
| `wbs.updated` | WBS structure or budget revised | ERP Cost Engine, Scheduling Services |
| `po.approved` | Purchase Order formally signed | Supplier Portal, Site Warehouse Inventory |
| `ipc.certified` | Interim Payment Certificate approved | Financial Ledger, ZATCA Invoicing, Client Billing |
| `ncr.issued` | Quality Non-Conformance Report logged | Consultant Dashboard, Subcontractor Alert |
| `incident.reported` | Safety Incident (LTI / High Potential) | Corporate Safety Director, Ministry Portal |
| `submittal.reviewed`| Consultant issues Code A/B/C/D on submittal| Technical Office, Site Field Engineers |
| `zatca.cleared` | Tax Invoice successfully cleared by ZATCA | Client Accounting, Archive Vault |
| `claim.submitted` | Formal contractor delay/cost claim filed | Legal Counsel, PMO Risk Committee |

### 5.3 Event Payload Schemas & Examples

#### Event 1: `ipc.certified`
Fires when an Interim Payment Certificate is formally certified by the Supervising Consultant or Project Director.
```json
{
  "eventId": "evt_01JG8X97N5D0W0N0K2T9A7C1P4",
  "eventType": "ipc.certified",
  "eventTimestamp": "2026-11-20T18:55:00.000Z",
  "tenantId": "7a82b012-3294-4d83-9b88-129039fbc811",
  "data": {
    "ipcId": "ipc_99481029-4412-4fab-aa11-881920394857",
    "ipcNumber": "IPC-CLIENT-08",
    "projectId": "prj_2026_041",
    "projectCode": "PRJ-2026-RYD-041",
    "certifiedGrossAmount": 24850000.00,
    "netPayableBeforeTax": 23080000.00,
    "vatAmount": 3462000.00,
    "totalPayableSAR": 26542000.00,
    "certifiedBy": {
      "userId": "usr_7718294a-bc10-4491-a882-192039485712",
      "nameEn": "Salman Faheed Al-Otaibi",
      "role": "Project Director"
    },
    "zatcaTriggerRequired": true
  }
}
```

#### Event 2: `incident.reported`
Fires immediately upon logging a Critical Safety Incident or Lost Time Injury (LTI) at any jobsite.
```json
{
  "eventId": "evt_01JG8X97N5D0W0N0K2T9A7C1P5",
  "eventType": "incident.reported",
  "eventTimestamp": "2026-11-20T11:20:00.000Z",
  "tenantId": "7a82b012-3294-4d83-9b88-129039fbc811",
  "data": {
    "incidentId": "inc_2026_014",
    "incidentNumber": "INC-2026-014",
    "projectId": "prj_2026_041",
    "incidentType": "LOST_TIME_INJURY_LTI",
    "severityRating": "HIGH",
    "location": "Murqab Tower - Basement 2 Excavation Pit",
    "injuriesCount": 1,
    "workStopped": true,
    "safetyOfficer": {
      "employeeId": "emp_01JG8X97N5D0W0N0K2T9A7C1P4",
      "name": "Tariq Al-Harbi"
    }
  }
}
```

#### Event 3: `zatca.cleared`
Fires when an invoice payload achieves cryptographic clearance from the ZATCA Fatoora Platform.
```json
{
  "eventId": "evt_01JG8X97N5D0W0N0K2T9A7C1P6",
  "eventType": "zatca.cleared",
  "eventTimestamp": "2026-11-20T18:50:15.000Z",
  "tenantId": "7a82b012-3294-4d83-9b88-129039fbc811",
  "data": {
    "invoiceId": "inv_ar_2026_0182",
    "clearanceId": "ZATCA-CLR-2026-99182374",
    "clearedTimestamp": "2026-11-20T18:50:12Z",
    "totalWithVatSAR": 26542000.00,
    "qrCodeTlvBase64": "AQ1NaW1hciBDb250cmFjdGluZwIPMzAwMTgyOTM4NDAwMDAzAxM...",
    "status": "CLEARED"
  }
}
```

---
*End of MimarERP v7 REST API Specification Document (`MIMAR-SPEC-API-003`).*
"""

if __name__ == "__main__":
    print("OpenAPI & Tables compiled.")
