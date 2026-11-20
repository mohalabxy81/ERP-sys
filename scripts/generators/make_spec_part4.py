# -*- coding: utf-8 -*-
"""
Module specs 11 to 15: Equipment, HR, Documents, Technical Office, Contracts
"""

def get_modules_11_to_15():
    return """
### Module 11: Plant, Machinery & Heavy Equipment (`/api/v1`)

#### 11.1 GET, POST, GET `/{id}` `/equipment`
- **Description:** Centralized fleet register for tower cranes, mobile cranes, excavators, transit mixers, concrete pumps, generators, and heavy transport.
- **POST `/equipment` Request Body:**
```json
{
  "assetTag": "EQ-CRN-007",
  "nameAr": "رافعة برجية تلسكوبية 12 طن",
  "nameEn": "Potain Tower Crane 12 Ton Capacity",
  "serialNumber": "PT-9948190-2024",
  "ownershipType": "OWNED",
  "currentProjectId": "prj_2026_041",
  "hourlyInternalBillingRate": 280.00,
  "currency": "SAR",
  "thirdPartyInspectionExpiryDate": "2027-02-15"
}
```

#### 11.2 GET & POST `/fuel-logs`
- **Description:** Logs daily diesel and oil refueling via bowser meters or fuel cards with engine hour meter and odometer cross-checks.

#### 11.3 GET `/utilization`
- **Description:** Aggregates productive operating hours, standby hours, breakdown downtime, and financial utilization percentage against capital amortization.

#### 11.4 GET & POST `/maintenance-orders`
- **Description:** Manages Preventive Maintenance (PM) schedules based on operating hours (250h, 500h, 1000h service intervals) and spare parts consumption.

#### 11.5 GET & POST `/breakdowns`
- **Description:** Tracks emergency breakdown incident reports, technician dispatch, Mean Time To Repair (MTTR), and replacement equipment mobilization.

---

### Module 12: Human Capital & Camp Management (`/api/v1`)

#### 12.1 GET, POST, GET `/{id}` `/employees`
- **Description:** Construction workforce master file capturing Iqama/National ID, GOSI number, Qiwa labor contract, trade classification, and wage breakdown.
- **POST `/employees` Request Body:**
```json
{
  "employeeCode": "EMP-9481",
  "fullNameAr": "ممدوح عبد العزيز النجار",
  "fullNameEn": "Mamdouh Abdelaziz Al-Najjar",
  "nationalOrIqamaId": "2391049182",
  "professionQiwa": "Steel Fixer Foreman",
  "nationality": "EG",
  "basicSalary": 4500.00,
  "housingAllowance": 1125.00,
  "transportationAllowance": 500.00,
  "assignedProjectId": "prj_2026_041"
}
```

#### 12.2 GET & POST `/attendance`
- **Description:** Synchronizes biometric face-recognition turnstile data and mobile GPS geofenced site clock-in records.

#### 12.3 GET `/payroll` & POST `/payroll/run`
- **Description:** Generates monthly payroll conforming to the Saudi Wage Protection System (WPS / Mudad) with automatic calculation of overtime, site hardship allowances, and GOSI deductions.

#### 12.4 GET, POST, PUT `/{id}/status` `/leave-requests`
- **Description:** Manages annual vacation, emergency leaves, exit-reentry visa processing, and ticket allowances.

#### 12.5 GET `/camp-management` & POST `/camp-management/allocations`
- **Description:** Labor camp room and bed assignment, catering management, hygiene inspections, and camp bus transportation logistics.

---

### Module 13: Document Control & Common Data Environment (`/api/v1`)

#### 13.1 GET, POST, GET `/{id}` `/documents`
- **Description:** ISO 19650 compliant document register supporting metadata taxonomy (Project, Originator, Volume, Level, Type, Role, Number).
- **POST `/documents` Request Body:**
```json
{
  "projectId": "prj_2026_041",
  "documentNumber": "MUR-STR-01-DWG-0024",
  "titleAr": "مخطط تفاصيل تسليح سقف الطابق العاشر",
  "titleEn": "Structural Details: Level 10 Slab Rebar Layout",
  "discipline": "STRUCTURAL",
  "suitabilityCode": "S3_FOR_REVIEW_AND_COMMENT",
  "confidentiality": "CONFIDENTIAL"
}
```

#### 13.2 GET & POST `/documents/{id}/revisions`
- **Description:** Uploads new revisions (e.g. Rev A, Rev 0, Rev 1), automatically computing SHA-256 binary hash, cloud storage URI, and change logs.

#### 13.3 GET & POST `/transmittals`
- **Description:** Formal Document Transmittal Notes (DTN) exchanged between Main Contractor, Supervising Consultant, Client, and Subcontractors.

#### 13.4 GET & POST `/review-cycles`
- **Description:** Multi-tier review workflows with approval codes:
  - Code A: Approved without comments
  - Code B: Approved with comments; proceed with work
  - Code C: Revise and resubmit; work shall not proceed
  - Code D: Rejected.

---

### Module 14: Technical Office & Engineering Submittals (`/api/v1`)

#### 14.1 GET, POST, GET `/{id}` `/shop-drawings`
- **Description:** Tracks production, revision, consultant submission, and site issuance of coordinated engineering shop drawings.

#### 14.2 GET, POST, PUT `/{id}/review` `/submittals`
- **Description:** Material Approval Requests (MAR) and Method Statements submitted to the supervising engineering consultant.
- **POST `/submittals` Request Body:**
```json
{
  "submittalNumber": "MAR-STR-0042",
  "submittalType": "MATERIAL_SAMPLE",
  "title": "Post-Tensioning Anchorage Heads and Strands (VSL / Freyssinet)",
  "discipline": "STRUCTURAL",
  "specificationSection": "03-3800",
  "manufacturer": "Freyssinet Saudi Arabia",
  "countryOfOrigin": "SA",
  "complianceSheetAttached": true
}
```

#### 14.3 GET, POST, POST `/{id}/responses` `/rfis`
- **Description:** Request for Information (RFI) management tracking design ambiguities, drawing conflicts, and engineering queries.
- **POST `/rfis` Request Body:**
```json
{
  "rfiNumber": "RFI-ARC-0108",
  "projectId": "prj_2026_041",
  "subject": "Conflict between Duct Shaft Opening and Shear Wall SW-04 at Level 12",
  "question": "Shop drawing STR-04 shows solid wall at grid C4, while HVAC-08 requires 600x800mm opening. Please provide clarification.",
  "drawingReference": "STR-04 Rev 1, HVAC-08 Rev 2",
  "costImpact": "POTENTIAL",
  "scheduleImpactDays": 0,
  "requiredResponseDate": "2026-11-28"
}
```

#### 14.4 GET & POST `/technical-queries`
- **Description:** Internal technical queries escalated to the Design Architect / Structural Engineer of Record (EOR).

---

### Module 15: Contract Management & Commercial Administration (`/api/v1`)

#### 15.1 GET, POST, GET `/{id}` `/contracts`
- **Description:** Main Contracts and Subcontracts governed by FIDIC conditions (Red/Yellow/Silver/White books) and Saudi Government Tender & Procurement Law (GTPL).
- **POST `/contracts` Request Body:**
```json
{
  "contractNumber": "SUB-2026-041-HVAC-01",
  "contractType": "SUBCONTRACT_LUMP_SUM",
  "fidicEdition": "FIDIC_YELLOW_1999_ADAPTED",
  "partyAOrganizationId": "org_88102048-0002-4f77-aa11-8820491029cc",
  "partyBPartyName": "Saudi Modern HVAC Systems Co.",
  "contractValue": 28500000.00,
  "retentionPercent": 10.0,
  "advancePaymentPercent": 15.0,
  "delayDamagesCapPercent": 10.0
}
```

#### 15.2 GET & POST `/contracts/{id}/variations`
- **Description:** Variation Orders (VO) and Variation Proposals (VP) with valuation under FIDIC Clause 13.

#### 15.3 GET & POST `/contracts/{id}/eot`
- **Description:** Extension of Time (EOT) requests assessing excusable compensable vs excusable non-compensable delay events.

#### 15.4 GET & POST `/contracts/{id}/claims`
- **Description:** Formal commercial contractual claims submitted under FIDIC Clause 20.1 / 20.2.

#### 15.5 GET & POST `/bonds`
- **Description:** Bank Guarantee Bonds tracking:
  - Tender / Bid Bonds
  - Performance Bonds (typically 10% valid through Defects Notification Period)
  - Advance Payment Guarantees (APG)
  - Retention Money Bonds.
"""

if __name__ == "__main__":
    print("Modules 11-15 compiled.")
