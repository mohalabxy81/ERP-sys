# -*- coding: utf-8 -*-
"""
Module specs 6 to 10: Estimation, Tendering, QS, Procurement, Inventory
"""

def get_modules_6_to_10():
    return """
### Module 6: Estimation & Cost Library (`/api/v1`)

#### 6.1 GET, POST, GET `/{id}` `/estimates`
- **GET `/estimates`:** Lists all project cost estimates with tender stage and revision indicators.
- **POST `/estimates`:** Initializes an estimate linked to a tender opportunity or project feasibility study.
- **Request Body:**
```json
{
  "estimateCode": "EST-2026-TND-019",
  "titleAr": "دراسة تسعير مشروع مجمع عيادات العليا التخصصية",
  "titleEn": "Cost Estimate: Al-Olaya Medical Complex",
  "currency": "SAR",
  "tenderId": "tnd_01JG8X97N5D0W0N0K2T9A7C1P0",
  "estimationMethod": "ANALYTICAL_BOTTOM_UP"
}
```

#### 6.2 GET & POST `/estimates/{id}/items`
- **Description:** Manages individual line items in the estimate breakdown with detailed unit rate build-up:
  - Labor (Gang composition, productivity rates)
  - Plant & Equipment (Hourly rate, fuel, operator)
  - Materials (Supply rate, wastage allowance %, delivery)
  - Subcontractor quotes.
- **POST `/estimates/{id}/items` Request Body:**
```json
{
  "itemNumber": "02.04.01",
  "descriptionAr": "توريد وتركيب خرسانة مسبقة الصنع للجدران الخارجية سمك 20 سم",
  "descriptionEn": "Supply & Installation of Precast Concrete Wall Panels 200mm thk",
  "unitOfMeasure": "M2",
  "estimatedQuantity": 14200.0,
  "costBuildUp": {
    "materialUnitCost": 185.00,
    "laborUnitCost": 42.50,
    "equipmentUnitCost": 28.00,
    "subcontractorUnitCost": 0.00,
    "wastagePercentage": 3.0
  }
}
```

#### 6.3 GET & POST `/rate-library`
- **Description:** Enterprise central rate master database containing certified market unit rates for Saudi Arabia construction trades (e.g. ready-mix concrete C35/40, rebar grade 60, MEP cables, crane rental rates).

#### 6.4 POST `/estimates/{id}/markup`
- **Description:** Configures indirect cost add-ons, site overheads, corporate general & administrative (G&A) expenses, contingency risk reserves, and targeted net profit margins.
- **Request Body:**
```json
{
  "siteOverheadsPercent": 8.5,
  "corporateGaPercent": 4.0,
  "unforeseenRiskContingencyPercent": 3.5,
  "financingCostPercent": 2.0,
  "targetProfitMarginPercent": 9.0
}
```

#### 6.5 GET `/estimates/{id}/summary`
- **Description:** Calculates total direct cost, indirect cost, gross margin, selling tender price, and cash-outflow exposure profile.

---

### Module 7: Tendering & Bid Management (`/api/v1`)

#### 7.1 GET, POST, GET `/{id}` `/tenders`
- **Description:** Manages client bid opportunities, RFPs, bond deadlines, submission bonds, and prequalification criteria.

#### 7.2 GET & POST `/tenders/{id}/bid-packages`
- **Description:** Partitions project scope into specialty subcontract trade packages (e.g., Piling & Shoring, Glass Curtain Wall, Elevators, HVAC Chillers).

#### 7.3 GET & POST `/tenders/{id}/bids`
- **Description:** Collects and logs incoming subcontractor and supplier competitive tender submissions.
- **POST `/tenders/{id}/bids` Request Body:**
```json
{
  "bidPackageId": "bp_01JG8X97N5D0W0N0K2T9A7C1P2",
  "subcontractorId": "sub_88192039-4412-4fab-9912-771829384755",
  "submissionDate": "2026-11-18T14:30:00Z",
  "quotedAmount": 14850000.00,
  "currency": "SAR",
  "technicalScore": 92.5,
  "complianceStatus": "FULLY_COMPLIANT"
}
```

#### 7.4 GET `/tenders/{id}/comparison`
- **Description:** Generates automated multi-vendor commercial and technical comparison matrix identifying rate anomalies, deviations, and outlier bids.

#### 7.5 POST `/tenders/{id}/award`
- **Description:** Approves final trade award, creates official Letter of Acceptance (LOA), and automatically provisions Subcontract in Contracts Module.

---

### Module 8: Quantity Surveying & Billing (`/api/v1`)

#### 8.1 GET & POST `/projects/{id}/boq`
- **Description:** Manages the contractual Master Bill of Quantities (BOQ) with bilingual Arabic/English item specifications, POMI / CESMM4 / Saudi Ministry of Finance standard measurement methods.
- **POST `/projects/{id}/boq` Request Body:**
```json
{
  "boqTitle": "Contract Bill of Quantities - Architectural Division",
  "standardMethodOfMeasurement": "POMI",
  "currency": "SAR",
  "items": [
    {
      "itemNumber": "04.01.001",
      "descriptionAr": "بناء قواطع بلوك أسمنتي مفرغ مقاس 200×200×400 ملم",
      "descriptionEn": "Hollow concrete blockwork partitions 200x200x400 mm including ties and mortar",
      "unit": "M2",
      "contractQuantity": 45000.0,
      "unitRate": 78.50
    }
  ]
}
```

#### 8.2 GET, POST, PUT `/boq/{id}/items`
- **Description:** Handles CRUD operations for granular BOQ items, linking each line item to corresponding WBS nodes and cost codes.

#### 8.3 GET & POST `/projects/{id}/ipcs`
- **Description:** Governs Interim Payment Certificates (IPCs) for Client Billing and Subcontractor claims. Handles:
  - Cumulative work completed to date
  - Materials on site (MOS) allowance (80%)
  - Advance payment amortization deductions
  - 10% Retention deductions up to 5% contractual cap
  - Withholding tax & 15% Saudi VAT calculations.
- **POST `/projects/{id}/ipcs` Request Body:**
```json
{
  "ipcNumber": "IPC-CLIENT-08",
  "ipcType": "MAIN_CONTRACT_CLIENT_BILLING",
  "periodStartDate": "2026-10-01",
  "periodEndDate": "2026-10-31",
  "grossWorkAmount": 24850000.00,
  "materialsOnSiteAmount": 3200000.00,
  "advancePaymentDeduction": 2485000.00,
  "retentionDeduction": 2485000.00,
  "netPayableBeforeVat": 23080000.00,
  "vatAmount": 3462000.00,
  "totalDue": 26542000.00,
  "currency": "SAR"
}
```

#### 8.4 GET & PUT `/ipcs/{id}/items`
- **Description:** Itemized line-by-line measurement sheet breakdown verifying survey records against site Joint Measurement Sheets (JMS).

#### 8.5 GET & POST `/projects/{id}/billing`
- **Description:** Orchestrates the formal Certificate of Payment workflow (Draft -> QS Verification -> Consultant Review -> Client Engineer Certification -> Finance Invoice Generation).

---

### Module 9: Procurement & Subcontract Purchasing (`/api/v1`)

#### 9.1 GET, POST, GET `/{id}` `/purchase-requests`
- **Description:** Site Purchase Requisitions (PR) raised by Site Engineers with budget validation against project cost codes.
- **POST `/purchase-requests` Request Body:**
```json
{
  "projectId": "prj_2026_041",
  "prNumber": "PR-2026-041-0182",
  "costCode": "03-2100",
  "wbsId": "wbs_01JG8X97N5D0W0N0K2T9A7C1P0",
  "requiredOnSiteDate": "2026-12-05",
  "priority": "HIGH",
  "items": [
    {
      "itemDescriptionAr": "حديد تسليح عالي المقاومة قطر 16 مم مطابق للمواصفات السعودية SASO",
      "itemDescriptionEn": "High Tensile Deformed Rebar Grade 60 Dia 16mm SASO Compliant",
      "quantity": 180.0,
      "unit": "TON",
      "estimatedUnitPrice": 2650.00
    }
  ]
}
```

#### 9.2 GET, POST, GET `/{id}` `/rfqs`
- **Description:** Request for Quotation (RFQ) distribution to qualified vendors via supplier portal.

#### 9.3 GET & POST `/quotations`
- **Description:** Captures incoming supplier technical bids, prices, lead times, payment terms, and mill test certificates.

#### 9.4 GET, POST, GET `/{id}` `/purchase-orders`
- **Description:** Legally binding Purchase Orders (PO) containing delivery schedules, penalties, and accounting commitment links.
- **POST `/purchase-orders` Request Body:**
```json
{
  "poNumber": "PO-2026-041-0095",
  "vendorId": "vnd_88192039-4412-4fab-9912-771829384755",
  "projectId": "prj_2026_041",
  "paymentTerms": "30_DAYS_AFTER_GRN",
  "currency": "SAR",
  "subtotal": 477000.00,
  "vatAmount": 71550.00,
  "totalAmount": 548550.00,
  "deliveryLocation": "Murqab Tower Site, Riyadh, Gate 2"
}
```

#### 9.5 GET & POST `/deliveries`
- **Description:** Logs Good Receipt Notes (GRN) / Material Delivery Notes upon arrival at site, triggering QA/QC visual inspections and weighbridge logging.

#### 9.6 GET & POST `/vendor-evaluation`
- **Description:** Evaluates vendor performance across Delivery On-Time Rate, Material Compliance, and After-Sales Support.

---

### Module 10: Inventory & Warehouse Management (`/api/v1`)

#### 10.1 GET & POST `/warehouses`
- **Description:** Configures Central Warehouses, Regional Supply Depots, and Site Laydown Yards.

#### 10.2 GET `/stock`
- **Description:** Queries real-time stock levels with multi-warehouse bin location, lot tracking, expiry date, and valuation method (Weighted Average / FIFO).

#### 10.3 GET & POST `/material-requests`
- **Description:** Site Store Material Issue Requests (MIR) for issuing consumables, rebar, chemicals, or tools to site subcontractors.

#### 10.4 GET & POST `/stock-movements`
- **Description:** Records material transactions: Store Receipts (GRN), Store Issues (to Project/WBS), Inter-Warehouse Transfers, and Site-to-Site Reallocations.
- **POST `/stock-movements` Request Body:**
```json
{
  "movementType": "ISSUE_TO_PROJECT",
  "sourceWarehouseId": "wh_01JG8X97N5D0W0N0K2T9A7C1P0",
  "destinationProjectId": "prj_2026_041",
  "costCode": "03-2100",
  "items": [
    {
      "materialId": "mat_rebar_16mm",
      "quantityIssued": 25.0,
      "unit": "TON",
      "issuedToForemanId": "emp_01JG8X97N5D0W0N0K2T9A7C1P4"
    }
  ]
}
```

#### 10.5 GET `/reorder-alerts`
- **Description:** Analyzes current burn rates against critical path milestones and raises automated purchase requisition warnings when inventory falls below Safety Stock thresholds.
"""

if __name__ == "__main__":
    print("Modules 6-10 compiled.")
