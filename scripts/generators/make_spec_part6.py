# -*- coding: utf-8 -*-
"""
Module specs 21 to 25: PMO, Finance & ZATCA, Reports, AI Copilot, Mobile Sync
"""

def get_modules_21_to_25():
    return """
### Module 21: PMO & Portfolio Governance (`/api/v1`)

#### 21.1 GET & POST `/programs`
- **Description:** Aggregates interrelated construction projects under unified strategic programs (e.g. Healthcare Facilities Program, Regional Infrastructure Expansion).

#### 21.2 GET & POST `/portfolios`
- **Description:** Corporate investment portfolio grouping projects by geography, business unit, or funding source.

#### 21.3 GET `/portfolio/kpis`
- **Description:** Executive cross-project portfolio metrics:
  - Aggregate Contract Value
  - Total Earned Value vs Planned Value
  - Portfolio CPI & SPI
  - Active Disputed Claims SAR Exposure
  - Lost Time Injury Frequency Rate (LTIFR).

#### 21.4 GET `/portfolio/dashboard`
- **Description:** Real-time data feed powering the CEO and Board of Directors Executive Cockpit with Red/Amber/Green (RAG) risk scoring.

---

### Module 22: Construction Finance, Accounting & ZATCA Phase 2 (`/api/v1`)

#### 22.1 GET & POST `/gl-accounts`
- **Description:** Multi-currency Chart of Accounts (COA) mapped to Saudi standard statutory taxonomy, cost centers, and project cost codes.

#### 22.2 GET & POST `/journal-entries`
- **Description:** Multi-line balanced double-entry accounting journals with project and cost center tags.
- **POST `/journal-entries` Request Body:**
```json
{
  "entryDate": "2026-11-20",
  "reference": "JV-2026-11-0045",
  "memo": "Accrual of Subcontractor Progress Billing for Month of October",
  "currency": "SAR",
  "lines": [
    {
      "accountId": "acc_5101_direct_subcontract_cost",
      "costCenterId": "cc_murqab_tower",
      "projectId": "prj_2026_041",
      "costCode": "03-3100",
      "debit": 1850000.00,
      "credit": 0.00,
      "description": "Formwork Subcontract October Progress"
    },
    {
      "accountId": "acc_2104_subcontractor_accruals",
      "costCenterId": "cc_murqab_tower",
      "projectId": "prj_2026_041",
      "debit": 0.00,
      "credit": 1850000.00,
      "description": "Accrued Payable to Modern Formwork Co."
    }
  ]
}
```

#### 22.3 GET & POST `/ap-invoices`
- **Description:** Accounts Payable (AP) invoice processing matching 3-way reconciliation (PO vs GRN vs Invoice) and subcontractor IPC certifications.

#### 22.4 GET & POST `/ar-invoices`
- **Description:** Accounts Receivable (AR) invoices generated from certified Client IPCs and variation certificates.

#### 22.5 GET `/cash-flow`
- **Description:** 12-month rolling project and corporate cash flow forecasting reconciling expected billings, client retention collections, and supplier payment cycles.

#### 22.6 POST `/zatca/submit`
- **Description:** Real-time integration with Saudi Tax, Zakat and Customs Authority (ZATCA) Fatoora Platform Phase 2:
  - Generates UBL 2.1 XML complying with ZATCA Business Rules
  - Generates ECDSA P-256 digital signature
  - Computes SHA-256 cryptographic invoice hash and previous invoice hash (PIH) chain
  - Encodes Base64 TLV QR Code (Vendor, VAT, Timestamp, Total, VAT Total, Hash, Signature, Public Key)
  - Transmits to ZATCA Clearance (B2B Tax Invoice) or Reporting (B2C Simplified Invoice) APIs.
- **Request Body:**
```json
{
  "invoiceId": "inv_ar_2026_0182",
  "invoiceType": "TAX_INVOICE_STANDARD",
  "zatcaTransactionType": "CLEARANCE",
  "ublXmlSignedPayload": "<Invoice xmlns=...><cbc:ID>INV-2026-001</cbc:ID>...</Invoice>",
  "cryptographicHash": "a984f1b...29ef",
  "previousInvoiceHash": "7718bc...01fa"
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": {
    "zatcaStatus": "CLEARED",
    "clearanceId": "ZATCA-CLR-2026-99182374",
    "clearedTimestamp": "2026-11-20T18:50:12Z",
    "qrCodeTlvBase64": "AQ1NaW1hciBDb250cmFjdGluZwIPMzAwMTgyOTM4NDAwMDAzAxM...",
    "validationResults": {
      "infoMessages": [],
      "warningMessages": [],
      "errorMessages": []
    }
  }
}
```

---

### Module 23: Business Intelligence & Executive Reporting (`/api/v1/reports`)

#### 23.1 GET `/reports/evm`
- **Description:** Multi-project Earned Value summary report exporting to PDF and Excel with SPI/CPI distribution.

#### 23.2 GET `/reports/cash-flow`
- **Description:** Actual vs Projected Cash Outflow/Inflow breakdown by project discipline.

#### 23.3 GET `/reports/progress`
- **Description:** Monthly Executive Project Progress report combining schedule S-curve, milestone statuses, physical vs financial progress, and site photographs.

#### 23.4 GET `/reports/safety`
- **Description:** HSE Safety metrics report: Safe Man-Hours Worked to Date, Lost Time Incident Frequency Rate (LTIFR), and Total Recordable Incident Rate (TRIR).

#### 23.5 GET `/reports/quality`
- **Description:** QA/QC summary: Open NCR aging analysis, ITP first-time-pass rate, and consultant rejection root-causes.

---

### Module 24: AI Copilot & Construction Intelligence (`/api/v1/ai`)

#### 24.1 POST `/ai/chat`
- **Description:** Conversational AI Copilot agent powered by Gemini API and fine-tuned on construction domain standards (Saudi Building Code SBC, FIDIC, PMBOK). Provides contextual project intelligence.
- **Request Body:**
```json
{
  "projectId": "prj_2026_041",
  "contextModule": "COST_CONTROL",
  "prompt": "Analyze our current concrete pouring cost variance on Level 10 and suggest mitigation options to recover our CPI.",
  "conversationHistoryId": "conv_01JG8X97N5D0W0N0K2T9A7C1P4"
}
```
- **Response Body (`HTTP 200 OK`):**
```json
{
  "data": {
    "answer": "Current cost variance on Cost Code 03-3100 is -SAR 182,500 with CPI of 0.94. Primary driver is 18% overtime hours recorded during last week's continuous pour. Recommend shifting column formwork to pre-assembled modular systems to save 3 days on cycle time.",
    "citations": [
      { "entity": "ACTUAL_COST", "id": "act_cost_0081", "ref": "JV-2026-11-0045" },
      { "entity": "TIME_SHEET", "id": "ts_2026_w46", "ref": "Night Pour Shift #2" }
    ],
    "suggestedActions": [
      { "action": "REALLOCATE_LABOR", "label": "Review Concrete Gang Shift Schedule" },
      { "action": "CREATE_RFI", "label": "Draft Formwork Optimization Query" }
    ]
  }
}
```

#### 24.2 POST `/ai/analyze/{entity}`
- **Description:** Autonomous AI analysis for high-risk construction entities:
  - `CONTRACT_REVIEW`: Detects harsh non-standard clauses, unlimited liabilities, and unfair delay damage caps.
  - `SCHEDULE_HEALTH`: Evaluates P6 schedule logic against DCMA 14-Point Assessment.
  - `VARIATION_ESTIMATOR`: Auto-calculates rate justification using rate library and historical trends.

#### 24.3 GET `/ai/suggestions`
- **Description:** Proactive AI recommendation feed highlighting impending supply bottlenecks, clash conflicts, or overdue submittal approvals.

#### 24.4 POST `/ai/generate-report`
- **Description:** Auto-drafts complete narrative Executive Monthly Reports synthesizing data across all 25 modules into a polished Arabic/English executive brief.

---

### Module 25: Mobile Offline Synchronization (`/api/v1/sync`)

#### 25.1 POST `/sync/push`
- **Description:** Uploads offline mutation transactions created on mobile site devices (Daily Field Logs, Safety Observations, Turnstile Clock-ins, Snag Photos).
- **Request Body:**
```json
{
  "deviceId": "dev_mobile_s24_001",
  "syncBatchId": "bat_01JG8X97N5D0W0N0K2T9A7C1P0",
  "clientTimestamp": "2026-11-20T17:15:00Z",
  "mutations": [
    {
      "mutationId": "mut_001",
      "entity": "HSE_OBSERVATION",
      "operation": "CREATE",
      "payload": {
        "projectId": "prj_2026_041",
        "category": "FALL_PROTECTION",
        "severity": "MEDIUM",
        "location": "Level 8 Perimeter",
        "photoBase64Ref": "media_blob_001"
      }
    }
  ]
}
```

#### 25.2 GET `/sync/pull`
- **Description:** Delta synchronization endpoint returning only entities created or modified since `lastSyncTimestamp`. Supports delta cursors to conserve mobile cellular data bandwidth.

#### 25.3 POST `/sync/resolve-conflicts`
- **Description:** Resolves three-way concurrent updates between mobile site offline edits and headquarters office updates using deterministic Vector Clock and Last-Write-Wins (LWW) rules with administrative overrides.
"""

if __name__ == "__main__":
    print("Modules 21-25 compiled.")
