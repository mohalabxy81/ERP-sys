# -*- coding: utf-8 -*-
"""
Module specs 16 to 20: Claims, QA/QC, HSE, BIM, CRM
"""

def get_modules_16_to_20():
    return """
### Module 16: Claims & Forensic Delay Analysis (`/api/v1`)

#### 16.1 GET, POST, GET `/{id}` `/claims`
- **Description:** Registers formal claims dossiers for prolongation costs, disruption, and acceleration claims.

#### 16.2 GET & POST `/claims/{id}/events`
- **Description:** Logs cause-and-effect delay events with contemporaneous records (Daily Reports, Weather Delays, Late Access to Site, Differing Physical Conditions).

#### 16.3 GET & POST `/claims/{id}/evidence`
- **Description:** Attaches verified legal evidence, site photographs, certified letters, and correspondence references.

#### 16.4 GET & POST `/claims/{id}/delay-analysis`
- **Description:** Stores delay analysis methodology outputs:
  - Time Impact Analysis (TIA)
  - As-Planned vs As-Built
  - Window Analysis / Collapsed As-Built.
- **POST `/claims/{id}/delay-analysis` Request Body:**
```json
{
  "methodology": "TIME_IMPACT_ANALYSIS_TIA",
  "fragnetScheduleCode": "FRAG-EVT-014",
  "analyzedImpactDays": 42,
  "compensableDays": 35,
  "concurrentContractorDelayDays": 7,
  "prolongationCostClaimSAR": 3850000.00
}
```

---

### Module 17: Quality Assurance & Quality Control (QA/QC) (`/api/v1`)

#### 17.1 GET & POST `/itps`
- **Description:** Inspection & Test Plans (ITP) defining Surveillance, Witness, Hold, and Review inspection points for each trade.

#### 17.2 GET, POST, PUT `/{id}/status` `/inspection-requests`
- **Description:** Work Inspection Requests (WIR / MIR) issued to the Supervising Consultant.
- **POST `/inspection-requests` Request Body:**
```json
{
  "wirNumber": "WIR-STR-0248",
  "projectId": "prj_2026_041",
  "itpReference": "ITP-CONC-01",
  "locationDescription": "Level 10 - Grid Axis A1 to E8 - Floor Slab & Beams",
  "inspectionDateTime": "2026-11-26T09:00:00Z",
  "discipline": "STRUCTURAL",
  "inspectionScope": "Final check of top/bottom reinforcement, embedded conduits, and formwork cleanliness."
}
```

#### 17.3 GET, POST, PUT `/{id}/closure` `/ncrs`
- **Description:** Non-Conformance Reports (NCR) tracking defective workmanship or material failures with root cause analysis and corrective action closure.
- **POST `/ncrs` Request Body:**
```json
{
  "ncrNumber": "NCR-QC-0082",
  "severityLevel": "MAJOR",
  "deficiencyDescription": "Concrete 28-day cube compressive strength tested 27.5 MPa against specified 40.0 MPa for Column C-12.",
  "rootCauseCategory": "SUPPLIER_BATCH_ERROR",
  "proposedRemedialAction": "Perform core extraction and structural load re-calculation by structural consultant."
}
```

#### 17.4 GET & POST `/cars`
- **Description:** Corrective Action Requests (CAR) issued to vendors, subcontractors, or internal departments.

#### 17.5 GET, POST, PUT `/{id}/items/{itemId}` `/punch-lists`
- **Description:** Snagging and Punch list items captured during pre-commissioning and substantial handover walkthroughs with photo markup.

---

### Module 18: Health, Safety & Environment (HSE) (`/api/v1`)

#### 18.1 GET, POST, GET `/{id}` `/incidents`
- **Description:** OSHA and Saudi Ministry of Human Resources compliant accident and injury reporting.
- **POST `/incidents` Request Body:**
```json
{
  "incidentNumber": "INC-2026-014",
  "incidentType": "LOST_TIME_INJURY_LTI",
  "dateTime": "2026-11-20T11:15:00Z",
  "location": "Murqab Tower - Basement 2 Excavation Pit",
  "injuredPersonnelCount": 1,
  "fatalities": 0,
  "description": "Scaffolding handrail gave way causing worker to slip 1.8m. Sustained minor wrist fracture.",
  "emergencyServicesContacted": true,
  "initialRiskRating": "HIGH"
}
```

#### 18.2 GET & POST `/near-misses`
- **Description:** Proactive reporting of unsafe acts and conditions to drive hazard mitigation before incidents occur.

#### 18.3 GET & POST `/risk-assessments`
- **Description:** Job Safety Analyses (JSA) and Hazard Identification & Risk Assessments (HIRA) with 5x5 likelihood/consequence matrix.

#### 18.4 GET, POST, PUT `/{id}/approve` `/ptw-requests`
- **Description:** Permit to Work (PTW) workflows covering:
  - Hot Work (Welding/Cutting)
  - Confined Space Entry
  - Deep Excavation (>1.2m)
  - Work at Height (>1.8m)
  - Heavy Critical Lifting Operations
  - High Voltage Electrical Isolation.

#### 18.5 GET & POST `/toolbox-talks`
- **Description:** Daily morning safety briefing logs including topic, language (Arabic, English, Urdu, Hindi), and worker biometric signatures.

---

### Module 19: Building Information Modeling (BIM) (`/api/v1`)

#### 19.1 GET, POST, GET `/{id}` `/bim-models`
- **Description:** OpenBIM (IFC 4.3 / glTF) federated model repository managing architectural, structural, and MEP model versions.

#### 19.2 GET `/bim-models/{id}/elements`
- **Description:** Queries individual IFC GUID building elements with associated property sets (Psets), material specifications, and WBS linkage.

#### 19.3 GET & POST `/clash-reports/run`
- **Description:** BCF (BIM Collaboration Format) clash detection jobs isolating hard clashes (e.g. Duct vs Girder) and clearance tolerances.

#### 19.4 GET & POST `/quantity-extractions/generate`
- **Description:** Automated 5D BIM model quantity takeoff (QTO) extracting cubic meters of concrete, tonnage of steel, and duct surface areas directly into the Estimation & BOQ modules.

---

### Module 20: CRM & Client Business Development (`/api/v1`)

#### 20.1 GET & POST `/leads`
- **Description:** Commercial project pipeline management tracking private developers, Giga-project invitations, and public sector tenders.

#### 20.2 GET & POST `/clients`
- **Description:** Real estate developer, ministry, and corporate client directory with financial rating, payment history, and credit terms.

#### 20.3 GET & POST `/opportunities`
- **Description:** Bid qualification stage gates (Go / No-Go decision framework) with scoring on capacity, strategic fit, and margin potential.

#### 20.4 GET & POST `/contacts`
- **Description:** Key stakeholder contact register (Client Representatives, Commercial Directors, Lead Architects).
"""

if __name__ == "__main__":
    print("Modules 16-20 compiled.")
