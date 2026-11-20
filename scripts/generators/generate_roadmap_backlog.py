# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive Enterprise Roadmap, MVP vs Enterprise Specification,
UML & Sequence Diagrams, and Complete Development Backlog for MimarERP v7.
"""
import os

OUTPUT_PATH = r"d:\ERP sys\docs\architecture\04-roadmap-mvp-backlog.md"

content = """# MimarERP v7: Enterprise Roadmap, MVP vs. Enterprise Specification, UML Architecture & Complete Development Backlog

---

## Document Control & Metadata
- **Document Title:** Enterprise Roadmap, Delivery Strategy, UML Modeling & Product Backlog
- **Document Identifier:** MIMAR-ENG-ARCH-04
- **Version:** 7.0.0-PROD
- **Classification:** Highly Confidential / Enterprise Core Specification
- **Target Audience:** Executive Steering Committee, Program Directors, Lead Solution Architects, Engineering Leads, Scrum Masters, Lead QA, Product Owners
- **Compliance & Standards:** PMI PMBOK 7th Ed., SAFe 6.0 Large Solution, ISO 19650-1/2 (CDE & BIM), FIDIC Red/Yellow/Silver Books, Saudi Building Code (SBC), ZATCA Phase 2 (FATOORA), ISO 9001/45001/14001

---

# Table of Contents
1. [Executive Delivery Strategy & Delivery Philosophy](#1-executive-delivery-strategy--delivery-philosophy)
   - 1.1 The Construction Software Paradigm: Hybrid SAFe & Stage-Gate Governance
   - 1.2 Multi-Speed Cadence: Iterative Sprints with Milestone-Bound Governance
   - 1.3 Governance Stage Gates (Gates 0 through 5)
   - 1.4 Construction-Grade Definition of Ready (DoR) & Definition of Done (DoD)
2. [MVP Scope (Phase 1: Months 1 to 4) Specification](#2-mvp-scope-phase-1-months-1-to-4-specification)
   - 2.1 Strategic Rationale & In-Scope vs. Out-of-Scope Matrix
   - 2.2 Deep-Dive MVP Module Capabilities
   - 2.3 MVP Acceptance Gates & Success Metrics
3. [Enterprise Version Scope (Phases 2 & 3: Months 5 to 12)](#3-enterprise-version-scope-phases-2--3-months-5-to-12)
   - 3.1 Differentiating Capabilities: Beyond Traditional Tier-1 ERPs
   - 3.2 4D/5D BIM & Digital Twin Engine
   - 3.3 9-Agent AI Construction Copilot Suite
   - 3.4 Aconex-Grade ISO 19650 Common Data Environment (CDE)
   - 3.5 Primavera P6-Grade Algorithmic Scheduling & FragNet Delay Engine
   - 3.6 FIDIC Claims & Contractual Dispute Engine
   - 3.7 Offline-First Mobile Field Engineering App
   - 3.8 ZATCA Phase 2 FATOORA E-Invoicing Engine
4. [Comprehensive 18-Month Implementation Roadmap](#4-comprehensive-18-month-implementation-roadmap)
   - 4.1 Master Delivery Schedule (Q1 through Q6)
   - 4.2 Quarterly Milestone Table, Deliverables & Gate Exit Criteria
   - 4.3 Rollout & Tenant Transition Strategy (Greenfield & Brownfield Migrations)
5. [Complete User Journey Maps](#5-complete-user-journey-maps)
   - 5.1 Persona 1: Project Director (Eng. Tariq Al-Mansoor)
   - 5.2 Persona 2: Lead Site Engineer (Eng. Yasser Al-Husseini)
   - 5.3 Persona 3: Procurement & Contracts Manager (Ms. Fatimah Al-Otaibi)
   - 5.4 Persona 4: Chief Financial Officer (Mr. Sulaiman Al-Zahrani)
6. [Detailed UML Diagrams (Mermaid)](#6-detailed-uml-diagrams-mermaid)
   - 6.1 Domain Model Class Diagram (Core Construction Entities)
   - 6.2 State Machine Diagram: Interim Payment Certificate (IPC) Lifecycle
   - 6.3 State Machine Diagram: Variation Order / Change Order (VO) Lifecycle
   - 6.4 State Machine Diagram: Technical Submittal Review Cycle
   - 6.5 State Machine Diagram: Request for Information (RFI) Resolution Lifecycle
7. [End-to-End Sequence Diagrams (Mermaid)](#7-end-to-end-sequence-diagrams-mermaid)
   - 7.1 IPC Submission, Site Verification, Consultant Certification & Finance Payout
   - 7.2 Variation Order (VO) Initiation, Technical Review, Client Approval & Budget Adjustment
   - 7.3 End-to-End Procurement P2P Cycle (PR -> RFQ -> CBA -> PO -> GRN -> 3-Way Match)
   - 7.4 Daily Site Progress Update with Mobile Offline Sync & Automated EVM Recalculation
8. [Comprehensive Development Backlog](#8-comprehensive-development-backlog)
   - 8.1 25-Module Epic Breakdown & Cross-Reference Table
   - 8.2 Detailed User Stories (INVEST Criteria with Given-When-Then Gherkin Scenarios)
   - 8.3 24-Sprint Program Distribution & Velocity Planning
   - 8.4 Enterprise Implementation Risk Matrix & Mitigation Strategy

---

# 1. Executive Delivery Strategy & Delivery Philosophy

### 1.1 The Construction Software Paradigm: Hybrid SAFe & Stage-Gate Governance
Building enterprise software for mega-scale construction and engineering holding companies presents a unique operational challenge. Standard consumer-grade agile software methodologies ("fail fast, move fast, break things") cause catastrophic failure when applied to construction accounting, structural engineering compliance, and FIDIC contractual agreements. A calculation error in an Interim Payment Certificate (IPC) or an unnotified delay under FIDIC Sub-Clause 20.1 can trigger multi-million SAR legal liabilities, bank guarantee calls, or statutory shutdown by the Zakat, Tax and Customs Authority (ZATCA).

Conversely, legacy linear Waterfall execution guarantees stale requirements, delayed time-to-value, and software built in isolation from the daily realities of field site engineers, quantity surveyors, and project directors.

To resolve this dichotomy, **MimarERP v7** adopts a **Hybrid SAFe (Scaled Agile Framework) / Construction Stage-Gate Delivery Model**:

```mermaid
flowchart TD
    subgraph SG ["Stage-Gate Engineering Governance (PMI / FIDIC / ISO 19650)"]
        G0["Gate 0: Multi-Tenant Architecture & Domain Boundary Inception"] --> G1["Gate 1: Core Foundation & Financial Schema Verification"]
        G1 --> G2["Gate 2: MVP Alpha Release (Internal Lab Validation)"]
        G2 --> G3["Gate 3: Controlled Field Beta (Mega-Project Shadow Run)"]
        G3 --> G4["Gate 4: Enterprise GA Release (Production Go-Live)"]
        G4 --> G5["Gate 5: Scaled Expansion & Autonomous Operations"]
    end

    subgraph SAFe ["Agile Release Train (2-Week Sprints / 10-Week Program Increments)"]
        PI1["Program Increment 1: Foundation & Core Setup (Sprints 1-5)"]
        PI2["Program Increment 2: BOQ, P2P & Site Diary (Sprints 6-10)"]
        PI3["Program Increment 3: Subcontracts, EVM & Finance MVP (Sprints 11-15)"]
        PI4["Program Increment 4: EDMS, QA/QC, HSE & Mobile Field (Sprints 16-20)"]
        PI5["Program Increment 5: 4D BIM, Claims & ZATCA Integration (Sprints 21-25)"]
    end

    G0 -.-> PI1
    PI1 -.-> G1
    PI2 -.-> G2
    G2 -.-> PI3
    PI3 -.-> G3
    PI4 -.-> G4
    PI5 -.-> G5
```

### 1.2 Multi-Speed Cadence: Iterative Sprints with Milestone-Bound Governance
The platform delivery cadence operates across three synchronized cycles:
1. **Bi-Weekly Sprints (14 Calendar Days):** Cross-functional feature squads (Backend, Frontend, Mobile, QA, Domain Expert) deliver vertical slices of user stories conforming to strict acceptance tests.
2. **Program Increments (10 Weeks / 5 Sprints):** Comprising four feature sprints plus one **Innovation & Planning (IP) Sprint**. The IP sprint is reserved for hardening, architecture runway enhancement, penetration testing, performance stress tests, and cross-module end-to-end user acceptance testing (UAT).
3. **Stage-Gate Milestones (Quarterly Audits):** Formal executive gate reviews where the Steering Committee, Lead Technical Auditor, Head of Cost & Contracts, and Chief Information Officer review deliverable readiness against contractual and operational benchmarks before clearing deployment.

### 1.3 Governance Stage Gates (Gates 0 through 5)
- **Gate 0: Inception & Domain Boundary Verification (Month 1)**
  - *Criteria:* Complete microservices architecture, domain-driven design aggregates, tenant data isolation strategy (schema-per-tenant), and security baseline approved.
- **Gate 1: Core Foundation & Data Integrity Audit (Month 2)**
  - *Criteria:* Multi-company ledger foundation, RBAC security matrix (15+ roles), audit trail framework, and master data catalogs (CSI MasterFormat, UOM, ISO currencies) fully functional and verified via automated integration suites.
- **Gate 2: MVP Alpha Readiness (Month 4)**
  - *Criteria:* Complete end-to-end P2P flow (Requisition to GRN), Level 4 WBS, BOQ import/export with price recipe decomposition, Daily Diary site logging, and basic EVM calculation engine.
- **Gate 3: Controlled Field Pilot / Beta Shadow Execution (Month 6)**
  - *Criteria:* MimarERP v7 running in shadow mode parallel to legacy systems (e.g., Primavera P6 + SAP/Oracle ERP) on at least two active SAR 200M+ real-world construction projects. Zero discrepancy tolerance on subcontractor IPC valuations and material stock balance.
- **Gate 4: Enterprise General Availability (GA) Sign-Off (Month 12)**
  - *Criteria:* ISO 19650 compliant document transmittals, ZATCA Phase 2 FATOORA live clearance, full 4D/5D WebGL BIM viewer, Primavera .xer schedule parsing, and offline mobile synchronization passing 100% of field penetration and load tests (10,000+ concurrent users).
- **Gate 5: Scaled Autonomous Operations (Month 18)**
  - *Criteria:* Multi-agent AI Copilot driving automated delay fragnet generation, predictive cash-flow forecasting, automated submittal variance detection, and automated material replenishment.

### 1.4 Construction-Grade Definition of Ready (DoR) & Definition of Done (DoD)

#### Definition of Ready (DoR)
A backlog item is ready for sprint ingestion only when:
1. **INVEST Compliance:** Independent, Negotiable, Valuable, Estimable, Small, and Testable.
2. **Domain Specification:** Clear mapping to CSI MasterFormat, FIDIC contractual clauses, or ZATCA XML e-invoicing standards.
3. **Acceptance Criteria:** Written in formal Given-When-Then (Gherkin) syntax covering happy path, exception handling, and edge cases (e.g., negative stock, currency revaluation, retention holdback).
4. **Data Contract & UI Wireframe:** Complete JSON schema request/response payload defined and validated against design system tokens (supporting bidirectional LTR/RTL layouts).
5. **Security & Auditing:** Explicit declaration of required RBAC role permissions, tenant isolation boundaries, and audit trail log events.

#### Definition of Done (DoD)
A story is only accepted when:
1. **Code Standards:** 100% TypeScript/Node.js strict mode, zero linting errors, and adherence to clean architectural boundaries.
2. **Automated Test Coverage:** Minimum 85% unit test code coverage; 100% coverage on financial calculations (EVM, IPC retention, tax withholding, foreign exchange).
3. **Multi-Tenant Isolation:** Automated test proving zero cross-tenant data leakage across PostgreSQL tenant schemas.
4. **Audit Trail Verification:** Immutable audit log record created for all CRUD operations on financial or contractual records.
5. **Localization:** Full bilingual support (English and Arabic RTL) with ISO currency rendering (SAR, USD, EUR, AED).
6. **Performance Benchmark:** API P95 response time < 250ms under baseline load; database queries optimized with zero unindexed table scans.
7. **Documentation:** API OpenAPI/Swagger documentation updated and field user guide snippet approved.

---

# 2. MVP Scope (Phase 1: Months 1 to 4) Specification

### 2.1 Strategic Rationale & In-Scope vs. Out-of-Scope Matrix
The objective of the Minimum Viable Product (Phase 1) is to establish operational dominance on active construction sites within 120 days. The MVP replaces manual spreadsheets, disconnected WhatsApp groups, and clunky legacy procurement tools with an integrated, secure, cloud-native foundation.

| Domain Module | MVP Scope (Phase 1: Month 1 - 4) | Enterprise Scope (Phase 2 & 3: Month 5 - 12) |
|---|---|---|
| **Organization & Tenants** | Multi-company, multi-branch, hierarchical cost centers, tenant provisioning. | Multi-tier holding consolidation, cross-subsidiary shared services, inter-company billing. |
| **Project & WBS** | Multi-project setup, Level 1 to Level 4 WBS, milestones, baseline locking. | Dynamic EVM-linked WBS, automated schedule-to-WBS mapping, 4D BIM linked WBS. |
| **BOQ Management** | Excel/CSV BOQ import, CSI MasterFormat classification, unit rate breakdowns, re-measurement flags. | Parametric BOQ auto-generation from 3D BIM, real-time price recipe indexation, dynamic escalation clauses. |
| **Procurement (P2P)** | Material Requisitions (MR), RFQ issuance, 3-bid Comparative Statement, PO generation, Goods Receipt Note (GRN). | Supplier Extranet Portal, AI-driven bid leveling, automated delivery tracking, framework agreement auto-drawdowns. |
| **Subcontracts** | Subcontract work orders, basic measurement sheets, interim subcontractor payment certificates (IPC), retention withholding. | Back-to-back risk matrix, automated pay-when-paid enforcement, subcontractor bonding & bank guarantee monitoring. |
| **Site Operations** | Daily Site Diary, manpower & equipment logs, weather recording, basic photo uploads. | Biometric mobile site check-in, GPS geofenced machinery telematics, voice-to-diary AI transcription. |
| **Cost Control & EVM** | Project budget baselines, actual vs. commitment vs. budget tracking, core EVM metrics (PV, EV, AC, CPI, SPI). | Predictive EAC/ETC machine learning models, cash-flow S-curve forecasting, multi-scenario Cost Value Reconciliation (CVR). |
| **Technical Office** | Basic drawing and document register with PDF upload and revision tagging. | Full ISO 19650 Common Data Environment (CDE), automated CAD/BIM revision overlay diff, Aconex-grade transmittals. |
| **Planning & Schedule** | Milestone tracking and manual Gantt chart display. | Full Primavera P6 (.xer) and MS Project (.mpp) engine, Critical Path Method (CPM) calculation, FragNet delay analyzer. |
| **Financials & Billing** | Core Chart of Accounts, AP/AR journals, basic client invoice generation. | ZATCA Phase 2 cryptographic e-invoicing, multi-currency treasury, automated bank reconciliation, escrow accounts. |

### 2.2 Deep-Dive MVP Module Capabilities

#### 1. Core Organization & Multi-Tenancy Engine
- Hierarchical holding structure: Holding Group -> Subsidiary Company -> Regional Branch -> Project Site -> Cost Center / Profit Center.
- Strict schema-per-tenant isolation in PostgreSQL ensuring high data sovereignty.
- Global Master Data Management (MDM): CSI MasterFormat (Divisions 01 to 49), ISO 80000 Units of Measure (m, m2, m3, ton, kg, lm, item), ISO 4217 Currency table with SAR as default base.

#### 2. Project Portfolio & Work Breakdown Structure (WBS)
- Support for multiple project delivery methods: Lump Sum (Turnkey), Unit Price (Re-measured), Cost Plus, and Design-Build.
- 4-Tier WBS tree hierarchy: Phase -> Deliverable -> Work Package -> Activity / Task.
- Project baseline snapshot engine: locks original budget, baseline start/finish dates, and target quantities upon executive approval.

#### 3. Bill of Quantities (BOQ) Engine
- Bulk ingestion of legacy Excel BOQs with automated column mapping, data validation, and error detection.
- Bill item categorization: Item Code, Description (Arabic & English), Unit of Measure, Contract Quantity, Unit Rate, Total Amount, WBS code linkage, and Re-measurement classification.
- Price recipe decomposition: splitting unit rates into Direct Material, Direct Labor, Plant/Equipment, Subcontractor, and Overhead & Profit components.

#### 4. Procure-to-Pay (P2P) Construction Workflow
- **Material Requisition (MR):** Initiated by site engineer, validated against BOQ budgeted quantities to prevent over-ordering.
- **Request for Quotation (RFQ):** Batch dispatching of RFQ packages to registered vendor catalogs.
- **Commercial Bid Analysis (CBA):** Automated 3-bid side-by-side comparative table evaluating unit price, payment terms, delivery lead times, and technical compliance.
- **Purchase Order (PO):** Multi-level approval routing based on monetary threshold (Site PM -> Procurement Manager -> CFO).
- **Goods Receipt Note (GRN):** Site storekeeper delivery logging with visual delivery note attachment, quantity verification, and damage inspection flagging.

#### 5. Subcontract Management & Site Interim Payments
- Subcontract agreement registration with scope definition, agreed schedule of rates, advance payment terms, and retention percentage (default 10%).
- Digital Subcontractor Interim Payment Certificate (IPC) workflow: Subcontractor claims work done -> Site QS verifies joint measurement -> Project Manager signs -> Finance posts AP liability.

#### 6. Daily Site Diary & Operational Progress Logs
- Standardized digital logbook recording: Daily weather conditions, workforce headcount by trade (Mason, Steel Fixer, Carpenter, Electrician, Laborer), active heavy equipment hours, work executed per WBS, delays encountered, and safety notes.
- Geotagged and timestamped photo attachments verifying progress claims directly from site mobile devices.

#### 7. Basic Cost Control & Earned Value Management (EVM)
- Automated calculation of fundamental EVM metrics:
  - Planned Value: $PV = \\text{Baseline Quantity} \\times \\text{Budget Unit Cost}$
  - Earned Value: $EV = \\text{Actual Physical Progress \\%} \\times \\text{BAC}$
  - Actual Cost: $AC = \\text{Direct Material Invoices} + \\text{Direct Labor} + \\text{Subcontract IPCs}$
  - Cost Performance Index: $CPI = \\frac{EV}{AC}$
  - Schedule Performance Index: $SPI = \\frac{EV}{PV}$
- Automated visual alerts: Amber warning when $CPI < 0.95$, Red critical alert when $CPI < 0.90$.

### 2.3 MVP Acceptance Gates & Success Metrics
1. **System Ingestion Speed:** Ingestion of a 10,000-line BOQ Excel file in under 15 seconds with zero data corruption.
2. **Procurement Cycle Velocity:** Reduction of PR-to-PO cycle time from the traditional industry average of 14 days down to 48 hours.
3. **Valuation Accuracy:** Exact match (0.00 SAR discrepancy) between verified site measurement sheets and generated Subcontractor IPC valuations.
4. **Site Adoption:** 100% of site engineers on pilot projects filing daily site diaries through the web/mobile app within 14 days of deployment.

---

# 3. Enterprise Version Scope (Phases 2 & 3: Months 5 to 12)

### 3.1 Differentiating Capabilities: Beyond Traditional Tier-1 ERPs
While the MVP establishes daily operational control, the Enterprise Version elevates MimarERP v7 into a market-leading platform that outperforms Oracle Primavera Unifier, Autodesk Construction Cloud, and SAP Construction. The enterprise phases deliver hyper-specialized engineering, financial, and AI engines tailored for Tier-1 contractors in Saudi Arabia and the GCC region.

### 3.2 4D/5D BIM & Digital Twin Engine
- **Open BIM Standards:** Native IFC 2x3, IFC4, and BCF (BIM Collaboration Format) parsing engine running in high-performance WebGL via Three.js / xeokit.
- **Autodesk Revit & Navisworks Bridge:** Direct bi-directional API plugins synchronizing Revit elements with MimarERP WBS and BOQ entities.
- **4D Time Simulation:** Visual playback of construction progress linking scheduled activities to 3D model geometry; automated visual color coding (Green = On Schedule, Yellow = Delayed, Blue = Completed, Red = Critical Path).
- **5D Cost Loading:** Interactive model inspection where clicking any structural element (column, beam, slab) displays its itemized material recipe, cumulative incurred cost, approved IPC valuation, and quality inspection records.

### 3.3 9-Agent AI Construction Copilot Suite
Integrated multi-agent architecture utilizing the Gemini API with retrieval-augmented generation (RAG) over project vector databases (pgvector):
1. **Planning & Schedule Agent:** Analyzes schedule update fragnet logs, detects hidden logic loops, and recommends critical path compression strategies.
2. **Cost Control Agent:** Identifies early-warning cost overrun trends and calculates predictive Estimate at Completion (EAC) based on historical subcontractor productivity.
3. **Quantity Surveying (QS) Agent:** Automatically extracts quantities from 2D architectural PDF drawings and cross-verifies against contractor tender BOQs.
4. **Procurement Intelligence Agent:** Predicts global supply chain lead-time fluctuations and benchmarks supplier raw material quotes against regional market commodity indices.
5. **QA/QC Inspection Agent:** Scans site inspection photos using computer vision to detect concrete honeycombing, rebar corrosion, or safety barrier non-compliance.
6. **HSE Risk Agent:** Evaluates daily site reports and high-risk activity permits (confined space, hot work, deep excavation) to predict safety incident probabilities.
7. **Contracts & Claims Agent:** Continuously reviews project correspondence (RFIs, transmittals, site instructions) against FIDIC contract conditions to flag time-bar deadlines and claim entitlements.
8. **Dispute & Legal Agent:** Drafts formal contractual notices (FIDIC Sub-Clause 20.1) and generates complete delay claim substantiation packages.
9. **Executive BI Synthesis Agent:** Generates real-time natural language executive summaries of portfolio financial performance for the Board of Directors and CEO.

### 3.4 Aconex-Grade ISO 19650 Common Data Environment (CDE)
- Full lifecycle information management conforming strictly to ISO 19650-1 and ISO 19650-2: Work in Progress (WIP) -> Shared -> Published -> Archived.
- Standardized naming convention parsing: `[Project]-[Originator]-[Zone]-[Level]-[Type]-[Role]-[Number]`.
- Automated PDF processing: Dynamic QR-code stamping, security watermarks ("FOR APPROVAL", "TENDER ONLY", "ISSUED FOR CONSTRUCTION"), and vector-based graphical revision comparisons with visual diff overlays.
- Formal document transmittals with non-repudiation audit trails, acknowledgment receipts, and distribution matrix routing.

### 3.5 Primavera P6-Grade Algorithmic Scheduling & FragNet Delay Engine
- Native parsing and generation of Primavera P6 `.xer` and Microsoft Project `.mpp` files.
- High-performance Critical Path Method (CPM) forward and backward pass calculation engine capable of resolving 50,000+ activity relationships in under 2 seconds.
- Support for all relationship dependencies: Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF), and Start-to-Finish (SF) with positive and negative lags.
- Resource leveling engine supporting labor, equipment, and material constraints with calendar customization (Saudi 6-day work week, Ramadan shift adjustments, national holidays).
- Time Impact Analysis (TIA) engine: automated insertion of delay Fragnets to calculate exact compensable and non-compensable Extension of Time (EOT) days.

### 3.6 FIDIC Claims & Contractual Dispute Engine
- Built-in support for FIDIC Red Book (Construction), Yellow Book (Plant and Design-Build), and Silver Book (EPC/Turnkey).
- Automated statutory countdown timers: 28-day notice of claim requirement under FIDIC Clause 20.1; 42-day detailed contemporary record submission requirement under Clause 20.2.
- Contractual correspondence repository linking RFIs, Engineer's Instructions, Site Memos, and Transmittals directly to claim cause-and-effect matrices.
- Disruption analysis utilizing the SCL (Society of Construction Law) Delay and Disruption Protocol (Measured Mile Analysis, Collapsed As-Built, Windows Analysis).

### 3.7 Offline-First Mobile Field Engineering App
- Cross-platform native application (iOS and Android) built for harsh job-site environments with zero or intermittent cellular connectivity.
- Architecture: Local SQLite database running on-device, synchronized via Conflict-Free Replicated Data Types (CRDTs) to the cloud upon connection restoration.
- Module touchpoints: Digital Site Diary, Concrete Pour Cards, Work Inspection Requests (WIR / MIR), Material Receiving Inspection, Punch Lists / Snagging with photo markup, and QR-based equipment badge scanning.
- Biometric time and attendance recording with GPS geofencing ensuring zero labor timecard fraud.

### 3.8 ZATCA Phase 2 FATOORA E-Invoicing Engine
- Full compliance with the Saudi Zakat, Tax and Customs Authority (ZATCA) Phase 2 integration requirements.
- On-the-fly generation of UBL 2.1 XML invoices for standard commercial invoices and credit/debit notes.
- Cryptographic stamp generation using ECDSA secp256k1 keys and X.509 digital certificates.
- Dynamic SHA-256 invoice hashing and invoice chaining (linking prior invoice hash to prevent tampering).
- Phase 2 QR-code generation encoding: Seller Name, VAT Number, Invoice Timestamp, Total with VAT, VAT Total, XML Hash, and Public Key Cryptographic Stamp.
- Direct REST API clearance and reporting integration with the ZATCA FATOORA portal.

---

# 4. Comprehensive 18-Month Implementation Roadmap

### 4.1 Master Delivery Schedule (Q1 through Q6)
The 18-month program is structured across six consecutive calendar quarters, executing 24 bi-weekly sprints and 6 Program Increments:

```mermaid
gantt
    title MimarERP v7 Master Delivery Roadmap (18 Months)
    dateFormat  YYYY-MM-DD
    axisFormat  Q%q %Y

    section Foundation & MVP
    Q1: Foundation, Multi-Tenant, Project WBS, BOQ, P2P       :2026-01-01, 2026-03-31
    Q2: Subcontracts, Site Diary, EVM Baseline, MVP Pilot   :2026-04-01, 2026-06-30

    section Enterprise Core
    Q3: ZATCA Phase 2, QA/QC, HSE, ISO 19650 EDMS, Mobile App :2026-07-01, 2026-09-30
    Q4: Primavera CPM Engine, FIDIC Claims, 4D/5D BIM, GA     :2026-10-01, 2026-12-31

    section Scaled Intelligence
    Q5: 9-Agent AI Copilot Suite, PMO Portfolio, Portals      :2027-01-01, 2027-03-31
    Q6: Autonomous Predictive Analytics, IoT Telematics, Expansion :2027-04-01, 2027-06-30
```

### 4.2 Quarterly Milestone Table, Deliverables & Gate Exit Criteria

| Quarter | Program Increment | Major Functional Deliverables | Target Gate & Review Date | Key Exit Metrics & KPIs |
|---|---|---|---|---|
| **Q1 (M1-M3)** | **PI-1:** Foundation & Core Setup | - Multi-tenant PostgreSQL provisioning engine<br>- RBAC & Security Gateway (OAuth2/JWT)<br>- Master Data Catalogs (CSI MasterFormat, UOM, FX)<br>- Project Management & 4-Tier WBS<br>- BOQ Excel Ingestion & Price Recipe Decomposition<br>- P2P Engine: Material Requisition (MR) & RFQ | **Gate 0 & Gate 1**<br>Target: Day 90 | - 100% of data isolation unit tests passing<br>- 10,000-line BOQ parsed in < 15 seconds<br>- Sub-second API response on core CRUD<br>- Test coverage > 85% |
| **Q2 (M4-M6)** | **PI-2:** MVP Execution & Pilot | - Commercial Bid Analysis (CBA) & Purchase Orders<br>- Goods Receipt Notes (GRN) with QA Inspection<br>- Subcontract Agreements & Subcontractor IPCs<br>- Daily Site Diary with Weather & Geotagged Photos<br>- Earned Value Management (EVM) Baseline Engine<br>- Core General Ledger & Project Cost Accounting | **Gate 2 & Gate 3**<br>(MVP Pilot Launch)<br>Target: Day 180 | - MVP deployed in parallel shadow run on 2 live projects<br>- Zero variance in IPC valuation calculations<br>- Material variance tracking functional<br>- UAT sign-off from Project Directors |
| **Q3 (M7-M9)** | **PI-3:** Compliance & Field Mobility | - ZATCA Phase 2 UBL 2.1 E-Invoicing Engine<br>- Cryptographic Stamping & FATOORA Clearance<br>- QA/QC Module: WIR, MIR, NCR, Snag Lists<br>- HSE Module: Incident Logs, Permit to Work (PTW)<br>- ISO 19650 CDE Document Control (EDMS)<br>- Offline-First Mobile Field App (iOS/Android Beta) | **Mid-Stage Review**<br>Target: Day 270 | - 100% compliance on ZATCA Phase 2 validation sandbox<br>- Offline mobile sync successful after 8 hours disconnected<br>- Submittal revision tracking operational |
| **Q4 (M10-M12)** | **PI-4:** Engineering Rigor & GA | - Native Primavera P6 .xer Parsing Engine<br>- Critical Path Method (CPM) Calculation Engine<br>- FIDIC Red/Yellow/Silver Claims Management Engine<br>- 28-Day Claim Countdown & Contemporary Record Log<br>- 4D/5D WebGL BIM Model Viewer (IFC4 / Three.js)<br>- Plant & Fleet Machinery Telematics Integration | **Gate 4**<br>(Enterprise GA)<br>Target: Day 360 | - CPM recalculates 50,000 activities in < 2 seconds<br>- 4D BIM renders 500MB IFC models at 60 FPS<br>- Enterprise General Availability live deployment<br>- Zero high/critical security vulnerabilities |
| **Q5 (M13-M15)** | **PI-5:** Multi-Agent AI & Portals | - 9-Agent AI Construction Copilot Suite (Gemini/RAG)<br>- Automated Delay Fragnet Generation<br>- Computer Vision Crack & Defect Detection<br>- Subcontractor & Supplier Extranet Portal<br>- Client & Consultant Collaboration Portal<br>- Multi-Project PMO & Executive Cockpit | **Scale Review**<br>Target: Day 450 | - AI schedule fragnet generation accuracy > 92%<br>- Extranet portal onboarding 100+ suppliers<br>- Executive dashboard real-time data sync < 5 seconds |
| **Q6 (M16-M18)** | **PI-6:** Autonomous Operations | - Predictive Cash Flow S-Curve Forecasting<br>- Automated Material Stock Replenishment AI<br>- IoT Crane, Concrete Mixer & Fleet Telematics<br>- Multi-Currency Hedging & Global Treasury<br>- International Multi-Entity Consolidation | **Gate 5**<br>(Autonomous Operations)<br>Target: Day 540 | - 100,000 concurrent user load stability verified<br>- End-to-end automation of standard monthly reporting<br>- Full platform handover to enterprise client operations |

### 4.3 Rollout & Tenant Transition Strategy (Greenfield & Brownfield Migrations)
1. **Phase 1 Pilot Inception (Months 4-6):** Greenfield deployment on two newly awarded projects. Full dual-entry shadow run against existing legacy software for 60 calendar days to establish financial parity.
2. **Phase 2 In-Flight Project Migration (Months 7-10):** Automated extraction and transformation pipelines mapping active Primavera P6 schedules, legacy SAP/ERP balances, and Excel drawing registers into MimarERP v7.
3. **Phase 3 Holding-Wide Cutover (Months 11-12):** Decommissioning of legacy point solutions; single sign-on (SSO) rollout across all enterprise engineering, procurement, and accounting departments.

---

# 5. Complete User Journey Maps

### 5.1 Persona 1: Project Director (Eng. Tariq Al-Mansoor)
- **Profile:** 24 years in EPC mega-projects. Oversees three high-rise hospital and commercial projects valued at SAR 1.8B.
- **Goals:** Prevent margin slippage, identify schedule bottlenecks before they become critical, ensure timely client IPC payments, and prevent contractual time-bars.
- **Frustrations:** Disconnected Excel cost reports arriving 30 days late, unexpected subcontractor claims, and lack of real-time visibility into site physical progress.

```mermaid
journey
    title Project Director Journey: Monthly Valuation & Risk Governance
    section Morning Review
      Logs into Executive Dashboard via Mobile: 5: Tariq
      Reviews Portfolio Cost Variance & CPI/SPI: 5: Tariq
      Notices Project A Tower 2 SPI dipped to 0.88: 2: Tariq
    section Deep-Dive Investigation
      Clicks through to WBS Level 4 delays: 4: Tariq
      Reviews 4D BIM view showing delayed 14th-floor slab: 4: Tariq
      Inspects AI Copilot Schedule Fragnet analysis: 5: Tariq
      Identifies root cause: Steel fabricator delivery delayed 12 days: 3: Tariq
    section Contractual Action
      Flags contractual notice required under FIDIC 20.1: 5: Tariq
      Approves AI-drafted formal notice to Client & Consultant: 5: Tariq
    section Commercial Governance
      Reviews monthly Client IPC #14 draft (SAR 42.5M): 4: Tariq
      Approves joint measurement summary & forwards to CFO: 5: Tariq
```

### 5.2 Persona 2: Lead Site Engineer (Eng. Yasser Al-Husseini)
- **Profile:** 8 years on-site experience. Responsible for structural execution of Zone B Basement & Podium slabs.
- **Goals:** Manage daily site manpower, ensure concrete pours pass QA inspection, log exact equipment usage, and request materials without bureaucratic delays.
- **Frustrations:** Spending 2 hours every evening typing manual Word daily reports, missing storekeeper receipts, and waiting days for consultant inspection sign-offs.

```mermaid
journey
    title Site Engineer Journey: Daily Concrete Pour & Site Diary
    section Morning Site Setup
      Opens Mobile App at Site Gate (Offline Mode): 5: Yasser
      Biometric site check-in verifies 48 crew members: 5: Yasser
      Assigns trade crews to Zone B Rebar Fixing: 4: Yasser
    section Operational Execution
      Receives Ready-Mix concrete trucks on site: 4: Yasser
      Scans digital delivery slips via mobile camera: 5: Yasser
      Site storekeeper logs GRN directly in app: 4: Yasser
    section Inspection & Verification
      Requests Work Inspection (WIR) from Consultant: 4: Yasser
      Consultant reviews pour card & digitally signs in app: 5: Yasser
    section Evening Closeout
      Logs Daily Diary: equipment hours, weather, pour volume: 5: Yasser
      Attaches 4 geotagged photos of completed pour: 5: Yasser
      Leaves site; mobile app syncs automatically via Wi-Fi: 5: Yasser
```

### 5.3 Persona 3: Procurement & Contracts Manager (Ms. Fatimah Al-Otaibi)
- **Profile:** 14 years in construction supply chain. Manages SAR 450M annual material and equipment procurement spend.
- **Goals:** Secure lowest total cost of ownership, maintain strict delivery lead times, enforce competitive bidding, and prevent rogue purchasing.
- **Frustrations:** Scattered supplier quotes in emails, manual comparison spreadsheets prone to formula errors, and unnotified site delivery delays.

```mermaid
journey
    title Procurement Manager Journey: Strategic Material P2P
    section Requisition Triage
      Receives automated alert for approved Requisition PR-882: 5: Fatimah
      Validates 450 Tons Rebar against BOQ Division 03 budget: 5: Fatimah
    section Competitive Sourcing
      Dispatches RFQ package to 5 pre-qualified steel mills: 5: Fatimah
      Vendors submit bids directly through Supplier Portal: 5: Fatimah
    section Evaluation & Award
      Opens Commercial Bid Analysis (CBA) side-by-side view: 5: Fatimah
      Reviews price, delivery schedule, and credit terms: 4: Fatimah
      Selects winning bidder; triggers automated PO generation: 5: Fatimah
    section Fulfillment Monitoring
      Obtains CFO digital signature on PO-4091: 5: Fatimah
      Tracks delivery via Advanced Shipping Notice (ASN): 4: Fatimah
      Monitors GRN receipt and automated 3-way match: 5: Fatimah
```

### 5.4 Persona 4: Chief Financial Officer (Mr. Sulaiman Al-Zahrani)
- **Profile:** 20 years in corporate construction finance. Manages corporate banking relationships, cash-flow forecasting, tax compliance, and balance sheet health.
- **Goals:** Maintain positive project cash flow, optimize working capital, ensure zero ZATCA tax penalties, and release retentions strictly per contract.
- **Frustrations:** Surprised by unexpected subcontractor payment demands, delayed client collections, and manual VAT reconciliation headaches.

```mermaid
journey
    title CFO Journey: Cash Flow Governance & ZATCA Compliance
    section Financial Visibility
      Accesses Treasury Cockpit at 08:00 AM: 5: Sulaiman
      Reviews 90-day rolling cash-flow forecast across 12 projects: 4: Sulaiman
      Checks automated escrow account balances: 5: Sulaiman
    section Valuation & Approval
      Receives certified Client IPC #14 for SAR 42.5M: 5: Sulaiman
      Validates 10% retention holdback (SAR 4.25M): 5: Sulaiman
      Approves invoice generation with ZATCA Phase 2 clearance: 5: Sulaiman
    section Tax & Payment Execution
      System generates UBL 2.1 XML with cryptographic stamp: 5: Sulaiman
      Transmits directly to ZATCA FATOORA portal in real time: 5: Sulaiman
      Approves batch subcontractor AP payments via WPS bank file: 5: Sulaiman
```

---

# 6. Detailed UML Diagrams (Mermaid)

### 6.1 Domain Model Class Diagram (Core Construction Entities)

```mermaid
classDiagram
    class Tenant {
        +UUID id
        +string companyName
        +string crNumber
        +string vatNumber
        +string subscriptionPlan
        +boolean isActive
        +createProject(ProjectConfig config) Project
        +getConsolidatedFinancials() FinancialReport
    }

    class Project {
        +UUID id
        +UUID tenantId
        +string projectCode
        +string nameAr
        +string nameEn
        +string contractType
        +decimal originalContractValue
        +decimal revisedContractValue
        +date baselineStartDate
        +date baselineFinishDate
        +ProjectStatus status
        +addWbsNode(WbsItem item) void
        +lockBaseline() void
        +calculateEVM() EvmSnapshot
    }

    class WbsItem {
        +UUID id
        +UUID projectId
        +UUID parentWbsId
        +string wbsCode
        +string name
        +integer level
        +decimal budgetedCost
        +decimal actualCost
        +float physicalProgressPct
        +getChildren() List~WbsItem~
        +rollupProgress() float
    }

    class BoqItem {
        +UUID id
        +UUID projectId
        +UUID wbsId
        +string itemNumber
        +string csiDivision
        +string descriptionAr
        +string descriptionEn
        +string uom
        +decimal contractQuantity
        +decimal unitRate
        +decimal totalAmount
        +boolean isRemeasured
        +getBreakdown() PriceRecipe
        +recordExecution(decimal qty) void
    }

    class PriceRecipe {
        +UUID id
        +UUID boqItemId
        +decimal directMaterialCost
        +decimal directLaborCost
        +decimal plantEquipmentCost
        +decimal subcontractCost
        +decimal overheadMarkupPct
        +calculateUnitRate() decimal
    }

    class PurchaseRequisition {
        +UUID id
        +UUID projectId
        +UUID requesterUserId
        +string prNumber
        +date requestDate
        +PrStatus status
        +addMaterialLine(BoqItem item, decimal qty) void
        +submitForApproval() void
    }

    class PurchaseOrder {
        +UUID id
        +UUID vendorId
        +UUID prId
        +string poNumber
        +decimal subtotalAmount
        +decimal vatAmount
        +decimal totalAmount
        +PoStatus status
        +approveOrder(UUID approverId) void
        +generatePdf() byte[]
    }

    class GoodsReceiptNote {
        +UUID id
        +UUID poId
        +UUID storekeeperId
        +string grnNumber
        +date receiptDate
        +boolean qcInspectionPassed
        +recordStockReceipt() void
    }

    class Subcontract {
        +UUID id
        +UUID projectId
        +UUID subcontractorId
        +string contractNumber
        +decimal contractValue
        +decimal retentionPercentage
        +decimal advancePaymentBalance
        +createIpcClaim() SubcontractIpc
    }

    class SubcontractIpc {
        +UUID id
        +UUID subcontractId
        +integer certificateNumber
        +date periodEndDate
        +decimal grossWorkClaimed
        +decimal grossWorkCertified
        +decimal retentionDeduction
        +decimal advanceDeduction
        +decimal netPayable
        +IpcStatus status
        +certifyQuantities(UUID qsUserId) void
        +approveForPayment(UUID cfoUserId) void
    }

    class VariationOrder {
        +UUID id
        +UUID projectId
        +string voNumber
        +string title
        +string reasonCode
        +decimal proposedCostImpact
        +decimal approvedCostImpact
        +integer proposedTimeExtensionDays
        +integer approvedTimeExtensionDays
        +VoStatus status
        +submitToClient() void
        +applyBudgetAdjustment() void
    }

    class Rfi {
        +UUID id
        +UUID projectId
        +string rfiNumber
        +string subject
        +string question
        +string officialResponse
        +boolean hasCostImpact
        +boolean hasScheduleImpact
        +RfiStatus status
        +assignToConsultant(UUID consultantId) void
        +closeRfi() void
    }

    Tenant "1" --> "*" Project : owns
    Project "1" --> "*" WbsItem : structured by
    WbsItem "1" --> "*" BoqItem : contains
    BoqItem "1" --> "1" PriceRecipe : costed by
    Project "1" --> "*" PurchaseRequisition : initiates
    PurchaseRequisition "1" --> "0..1" PurchaseOrder : fulfills
    PurchaseOrder "1" --> "*" GoodsReceiptNote : receives
    Project "1" --> "*" Subcontract : engages
    Subcontract "1" --> "*" SubcontractIpc : bills via
    Project "1" --> "*" VariationOrder : modifies
    Project "1" --> "*" Rfi : clarifies
```

### 6.2 State Machine Diagram: Interim Payment Certificate (IPC) Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft : Contractor QS Compiles Measurement Sheet
    Draft --> Submitted : Formal Submission to Consultant
    Submitted --> UnderTechnicalVerification : Consultant Site QS Audits Joint Measurement
    
    UnderTechnicalVerification --> ClarificationRequested : Measurement Discrepancy Found
    ClarificationRequested --> UnderTechnicalVerification : Contractor Submits Contemporary Records
    
    UnderTechnicalVerification --> MeasurementCertified : Quantities Certified by Consultant
    MeasurementCertified --> QAQCEndorsed : QA/QC Engineer Verifies WIR/NCR Clearances
    
    QAQCEndorsed --> CommercialAudit : Commercial Manager Reviews Price Recipes & Deductions
    CommercialAudit --> RetentionAndAdvanceCalculated : Applies Retention (10%) & Advance Recovery
    
    RetentionAndAdvanceCalculated --> EngineerPaymentCertificateIssued : Consultant Issues Formal Form of Certificate
    EngineerPaymentCertificateIssued --> EmployerApproved : Project Director & Client Executive Sign-Off
    
    EmployerApproved --> FinanceInvoiceGenerated : AP/AR Invoices Generated with ZATCA Phase 2 Stamp
    FinanceInvoiceGenerated --> Disbursed : Treasury Executes Bank Transfer (WPS)
    
    Disbursed --> RetentionHoldbackActive : Net Amount Paid / Retention Held in Ledger
    RetentionHoldbackActive --> RetentionReleasedAtTOC : 50% Released at Taking Over Certificate
    RetentionReleasedAtTOC --> FinalRetentionReleasedAtDLC : Remaining 50% Released at Defects Liability End
    FinalRetentionReleasedAtDLC --> [*]
```

### 6.3 State Machine Diagram: Variation Order / Change Order (VO) Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Identified : Site Instruction / Design Change / Site Condition
    Identified --> Scoping : Technical Office Analyzes Architectural Impact
    
    Scoping --> Pricing : QS Decomposes Direct Labor, Material & Plant Costs
    Pricing --> ContractualAssessment : Contracts Manager Evaluates FIDIC Entitlement (Clause 13)
    
    ContractualAssessment --> VariationProposalDrafted : Generates Formal Change Proposal Package
    VariationProposalDrafted --> InternalExecutiveApproved : Project Director Signs Commercial Impact
    
    InternalExecutiveApproved --> SubmittedToClient : Formal Transmittal to Client Representative
    SubmittedToClient --> UnderConsultantReview : Engineer Technical & Cost Review
    
    UnderConsultantReview --> NegotiationRequired : Consultant Disputes Unit Rates or Time Impact
    NegotiationRequired --> UnderConsultantReview : Mutual Negotiation Meeting Minutes Recorded
    
    UnderConsultantReview --> Rejected : Non-Entitled / Scope Inherent to Original Contract
    Rejected --> DisputeNoticeClause20 : Contractor Escalates to Dispute Board
    
    UnderConsultantReview --> ApprovedByClient : Formal Variation Order Signed by Client
    ApprovedByClient --> WbsAndBoqUpdated : Revised Contract Value & WBS Budgets Updated
    WbsAndBoqUpdated --> ScheduleBaselineRevised : Time Extension Injected into Primavera Baseline
    ScheduleBaselineRevised --> [*]
```

### 6.4 State Machine Diagram: Technical Submittal Review Cycle

```mermaid
stateDiagram-v2
    [*] --> SubmittalDrafted : Technical Office Prepares MAR / WIR / Shop Drawing
    SubmittalDrafted --> InternalLeadReview : Lead Technical Engineer Checks Quality & Specs
    InternalLeadReview --> ReturnedForRework : Fails Specification Compliance
    ReturnedForRework --> SubmittalDrafted : Corrected by Draftsman
    
    InternalLeadReview --> TransmittedToConsultant : Dispatched via ISO 19650 CDE Engine
    TransmittedToConsultant --> UnderConsultantReview : 14-Day Statutory Review Clock Starts
    
    UnderConsultantReview --> CodeA_Approved : Status Code A: Approved as Submitted
    UnderConsultantReview --> CodeB_ApprovedWithComments : Status Code B: Approved with Minor Comments
    UnderConsultantReview --> CodeC_ReviseAndResubmit : Status Code C: Rejected, Revise and Resubmit
    UnderConsultantReview --> CodeD_Rejected : Status Code D: Outright Rejection (Non-Compliant)
    
    CodeC_ReviseAndResubmit --> ResubmissionDrafted : Technical Team Addresses Engineer Comments
    ResubmissionDrafted --> TransmittedToConsultant
    
    CodeD_Rejected --> AlternativeSourcing : Procurement Re-engineers Specification
    AlternativeSourcing --> SubmittalDrafted
    
    CodeA_Approved --> IssuedForConstruction : Watermarked "IFC" and Distributed to Site
    CodeB_ApprovedWithComments --> IssuedForConstruction : Incorporates Comments & Issues to Site
    IssuedForConstruction --> [*]
```

### 6.5 State Machine Diagram: Request for Information (RFI) Resolution Lifecycle

```mermaid
stateDiagram-v2
    [*] --> RfiCreated : Site Engineer Identifies Design Conflict or Ambiguity
    RfiCreated --> TechnicalOfficeReview : Technical Office Reviews Contract Drawings & Specs
    
    TechnicalOfficeReview --> SolvedInternally : Answer Exists in Contract Documents
    SolvedInternally --> [*]
    
    TechnicalOfficeReview --> DispatchedToConsultant : Dispatched with Proposed Solution & 7-Day Deadline
    DispatchedToConsultant --> ConsultantEngineeringReview : Lead Consultant Reviews Structural/MEP Impact
    
    ConsultantEngineeringReview --> DesignClarificationIssued : Official Clarification Issued (No Impact)
    ConsultantEngineeringReview --> DesignRevisionRequired : Requires Architectural/Structural Re-issue
    
    DesignClarificationIssued --> SiteEngineersNotified : Distributed to Site Field Operations
    SiteEngineersNotified --> Closed : Site Execution Confirmed
    
    DesignRevisionRequired --> CostAndScheduleImpactFlagged : Triggers Potential Variation Order (VO)
    CostAndScheduleImpactFlagged --> VariationOrderInitiated : Formal Notice under FIDIC Clause 13
    VariationOrderInitiated --> Closed
    Closed --> [*]
```

---

# 7. End-to-End Sequence Diagrams (Mermaid)

### 7.1 IPC Submission, Site Verification, Consultant Certification & Finance Payout

```mermaid
sequenceDiagram
    autonumber
    actor QS as Contractor Lead QS
    participant Web as MimarERP Web / Mobile
    participant Backend as Project & Billing Service
    actor ConsQS as Consultant Resident QS
    actor RE as Resident Engineer (Client)
    participant ZATCA as ZATCA FATOORA Portal
    participant Fin as Treasury & Finance Service
    actor Bank as SAMA / Corporate Bank

    QS->>Web: Input Monthly Joint Measurement Sheets
    Web->>Backend: Calculate Gross Work Done & Deductions
    Backend-->>Web: Generate Draft IPC Valuation Package
    QS->>Web: Confirm & Submit IPC to Consultant
    Web->>ConsQS: Send Automated Notification with Joint Measurement Link
    ConsQS->>Web: Conduct Site Physical Verification & Audit
    ConsQS->>Web: Enter Certified Quantities (Applies Rate Adjustments)
    ConsQS->>RE: Forward Certified Valuation for Final Approval
    RE->>Web: Sign Engineer's Payment Certificate (Digital Signature)
    Web->>Backend: Lock Certified IPC Record (SAR 42,500,000)
    Backend->>Fin: Create Accounts Receivable & Tax Liability Record
    Fin->>Fin: Apply 10% Contractual Retention (SAR 4,250,000)
    Fin->>Fin: Deduct Advance Payment Amortization (SAR 2,125,000)
    Fin->>ZATCA: Transmit UBL 2.1 Tax Invoice XML with ECDSA Stamp
    ZATCA-->>Fin: Clearance Response (Approved with Cryptographic Stamp)
    Fin->>Bank: Dispatch Automated Payment Order via WPS
    Bank-->>Fin: Bank Transfer Cleared Confirmation
    Fin-->>QS: Real-Time Cash Receipt Notification & Ledger Balance Update
```

### 7.2 Variation Order (VO) Initiation, Technical Review, Client Approval & Budget Adjustment

```mermaid
sequenceDiagram
    autonumber
    actor Site as Site Technical Office
    participant Mimar as MimarERP Core Platform
    participant AI as AI Claims & Contracts Copilot
    actor PM as Contractor Project Manager
    actor Client as Client Representative / Consultant
    participant Cost as Cost Control & EVM Service

    Site->>Mimar: Create Variation Proposal (Encountered Hard Rock Excavation)
    Mimar->>AI: Analyze Site Logs, Geotechnical Reports & Contract Scope
    AI-->>Mimar: Confirm FIDIC Sub-Clause 4.12 Entitlement (Unforeseeable Conditions)
    Mimar->>Site: Pre-fill Cost Recipe Breakdown (Material, Heavy Plant, Time)
    Site->>Mimar: Finalize Commercial Package: SAR 1,450,000 & 18 Days EOT
    Mimar->>PM: Route for Executive Authorization
    PM->>Mimar: Approve Proposal & Sign Transmittal
    Mimar->>Client: Transmit Formal Variation Proposal Package (ISO 19650)
    Client->>Mimar: Log Review Comments & Negotiate Plant Equipment Hourly Rates
    Site->>Mimar: Submit Revised Rate Justification
    Client->>Mimar: Digitally Approve Signed Variation Order (VO #07)
    Mimar->>Cost: Trigger Automated Budget Re-baseline
    Cost->>Cost: Update BOQ Item #02-140 Budgeted Quantity & Rate
    Cost->>Cost: Adjust Project Revised Contract Value (+SAR 1,320,000)
    Cost->>Cost: Extend Baseline Completion Date (+14 Calendar Days)
    Cost-->>PM: Re-baseline Audit Complete: New BAC and Target Curve Generated
```

### 7.3 End-to-End Procurement P2P Cycle (PR -> RFQ -> CBA -> PO -> GRN -> 3-Way Match)

```mermaid
sequenceDiagram
    autonumber
    actor SiteEng as Site Engineer
    participant ERP as MimarERP Procurement Engine
    actor ProcMgr as Procurement Manager
    actor Vendors as Registered Suppliers (Extranet)
    actor Store as Site Storekeeper
    participant Fin as Accounts Payable Service

    SiteEng->>ERP: Create Material Requisition (PR-902: 500 Tons Rebar)
    ERP->>ERP: Check Budget Balance against WBS Division 03 (Available: 620 Tons)
    ERP-->>SiteEng: Requisition Approved Automatically (Within Budget)
    ProcMgr->>ERP: Convert PR-902 into RFQ Package
    ERP->>Vendors: Publish RFQ to 4 Prequalified Steel Suppliers
    Vendors->>ERP: Submit Commercial Bids & Delivery Commitments via Portal
    ERP->>ProcMgr: Generate Comparative Bid Analysis (CBA) Matrix
    ProcMgr->>ERP: Select Supplier B (Best Price & 5-Day Delivery)
    ERP->>ERP: Generate Purchase Order (PO-3081) with Standard Terms
    ProcMgr->>ERP: Authorize and Dispatch PO to Supplier B
    Vendors->>Store: Deliver 500 Tons Rebar to Job Site
    Store->>ERP: Inspect Delivery, Verify Mill Test Certificates & Log GRN-1104
    Store->>ERP: Attach Geotagged Delivery Note Photo
    Vendors->>Fin: Submit Commercial Tax Invoice for Payment
    Fin->>ERP: Execute Automated 3-Way Match (PO-3081 == GRN-1104 == Tax Invoice)
    ERP-->>Fin: Match Verified: Quantity (500T) and Unit Rate (SAR 2,650/T)
    Fin->>Fin: Post AP Voucher into General Ledger & Schedule Payment Date
```

### 7.4 Daily Site Progress Update with Mobile Offline Sync & Automated EVM Recalculation

```mermaid
sequenceDiagram
    autonumber
    actor Mobile as Site Engineer (Mobile App)
    participant LocalDB as Mobile Local SQLite (WatermelonDB)
    participant Sync as Cloud Synchronization Gateway (CRDT)
    participant ProjectSvc as Project & WBS Engine
    participant EVM as Cost Control & EVM Service
    actor PM as Project Director Dashboard

    Note over Mobile,LocalDB: Site Engineer works in Deep Basement (Zero Cellular Signal)
    Mobile->>LocalDB: Record Daily Site Diary (52 Manpower, 4 Excavators, 420m3 Pour)
    Mobile->>LocalDB: Mark WBS 03-02-04 (Substructure Retaining Wall) as 85% Complete
    Mobile->>LocalDB: Capture 3 Inspection Photos with Timestamp & GPS
    LocalDB-->>Mobile: Persist Locally with Unsynced State Flags
    Note over Mobile,Sync: Site Engineer Returns to Site Office (Wi-Fi Connected)
    Mobile->>Sync: Initiate Background Bi-Directional Delta Sync
    Sync->>LocalDB: Pull Unsynced Transaction Chunks
    Sync->>ProjectSvc: Merge Progress Deltas via Conflict-Free Resolution
    ProjectSvc->>ProjectSvc: Update WBS Node Physical Progress (75% -> 85%)
    ProjectSvc->>EVM: Trigger Real-Time EVM Recalculation Event
    EVM->>EVM: Compute Current Earned Value (EV = BAC * 0.85)
    EVM->>EVM: Pull Cumulative Incurred Actual Cost (AC) from Financial Ledgers
    EVM->>EVM: Calculate Cost Performance Index (CPI) and Schedule Performance Index (SPI)
    EVM->>EVM: Compute New Estimate at Completion: EAC = BAC / CPI
    EVM-->>PM: Push Real-Time S-Curve & Critical Variance Alert to Web Dashboard
```

---

# 8. Comprehensive Development Backlog

### 8.1 25-Module Epic Breakdown & Cross-Reference Table
The MimarERP v7 development backlog is divided into 25 core domain epics spanning all aspects of Tier-1 construction operations:

| Epic ID | Module Name | Scope & Core Capabilities | Total Story Points | Target Release |
|---|---|---|---|---|
| **EPIC-01** | System Administration & Multi-Tenancy | Tenant provisioning, schema isolation, global configurations, license quotas. | 85 SP | MVP (Sprint 1) |
| **EPIC-02** | Identity, Access & IAM (RBAC) | OAuth2/JWT auth, 15+ construction roles, row-level security, MFA, audit trails. | 65 SP | MVP (Sprint 1-2) |
| **EPIC-03** | Master Data Management (MDM) | CSI MasterFormat (50 Divs), ISO UOMs, daily FX exchange rates, global tax rules. | 45 SP | MVP (Sprint 2) |
| **EPIC-04** | Project Portfolio & WBS Management | Multi-tier WBS (Levels 1-4), baselines, milestones, project teams, deliverable tracking. | 110 SP | MVP (Sprint 2-3) |
| **EPIC-05** | Bill of Quantities (BOQ) Engine | Excel/CSV ingestion, CSI classification, price recipe breakdown, re-measurement flags. | 120 SP | MVP (Sprint 3-4) |
| **EPIC-06** | Procure-to-Pay (P2P) Supply Chain | Material requisitions, RFQs, automated 3-bid CBA, purchase orders, approvals. | 130 SP | MVP (Sprint 4-5) |
| **EPIC-07** | Inventory & Multi-Store Warehousing | Site stores, GRN with inspection quarantine, stock ledgers, bin tracking, returns. | 95 SP | MVP (Sprint 5-6) |
| **EPIC-08** | Subcontract Management | Work packages, back-to-back agreements, subcontractor measurement sheets, IPCs. | 115 SP | MVP (Sprint 6-7) |
| **EPIC-09** | Site Operations & Daily Diary | Manpower logs, equipment tracking, weather records, photo logs, site instructions. | 90 SP | MVP (Sprint 7-8) |
| **EPIC-10** | Cost Control & Earned Value (EVM) | Budget vs. Commitments vs. Actuals, PV/EV/AC, CPI/SPI, CVR reporting, S-curves. | 125 SP | MVP (Sprint 8-9) |
| **EPIC-11** | Technical Office Management | Drawing register, revision control, RFIs, transmittals, shop drawing submittals. | 105 SP | Enterprise (Sprint 10-11) |
| **EPIC-12** | ISO 19650 Document Management (CDE) | WIP/Shared/Published CDE workflow, automated PDF stamping, QR code watermarks. | 110 SP | Enterprise (Sprint 11-12) |
| **EPIC-13** | QA/QC & Inspection Management | Work Inspection Requests (WIR), Material Inspection (MIR), NCRs, punch lists. | 95 SP | Enterprise (Sprint 12-13) |
| **EPIC-14** | HSE & Safety Management | Safety incident logs, OSHA/ISO 45001 reporting, Permit to Work (PTW), safety toolbox. | 80 SP | Enterprise (Sprint 13-14) |
| **EPIC-15** | Client Invoicing & IPC Management | Gross valuation, joint measurements, consultant certification, retention holdbacks. | 120 SP | Enterprise (Sprint 14-15) |
| **EPIC-16** | Contracts, FIDIC & Claims Engine | FIDIC Red/Yellow/Silver rules, 28-day notice countdown, TIA delay fragnet analyzer. | 140 SP | Enterprise (Sprint 15-16) |
| **EPIC-17** | Financial Management & Multi-Entity GL | Multi-company Chart of Accounts, AP/AR, journal vouchers, bank accounts, balance sheets. | 135 SP | Enterprise (Sprint 16-17) |
| **EPIC-18** | ZATCA Phase 2 E-Invoicing Engine | UBL 2.1 XML invoices, ECDSA cryptographic stamps, QR codes, FATOORA clearance. | 115 SP | Enterprise (Sprint 17-18) |
| **EPIC-19** | Plant, Equipment & Fleet Telematics | Machinery asset registry, preventive maintenance, fuel logs, internal hire rates. | 90 SP | Enterprise (Sprint 18-19) |
| **EPIC-20** | HR, Labor Trades & Biometric Payroll | Craft trades, labor camp allocations, biometric site attendance, Saudi WPS export. | 105 SP | Enterprise (Sprint 19-20) |
| **EPIC-21** | 4D/5D BIM & Digital Twin Engine | IFC4/WebGL 3D viewer, Revit API sync, timetable 4D simulation, 5D cost inspection. | 160 SP | Enterprise (Sprint 20-21) |
| **EPIC-22** | Primavera P6 CPM Scheduling Engine | Native .xer parsing, 50,000 activity CPM calculation, resource leveling, SCL analysis. | 150 SP | Enterprise (Sprint 21-22) |
| **EPIC-23** | Offline-First Mobile Field App | Local SQLite, CRDT synchronization, GPS stamping, photo markup, digital signatures. | 135 SP | Enterprise (Sprint 22-23) |
| **EPIC-24** | 9-Agent AI Construction Copilot | Multi-agent Gemini LLMs, RAG over project vector database, automated delay drafting. | 165 SP | Scaled (Sprint 23-24) |
| **EPIC-25** | PMO, Executive Cockpit & Portals | Multi-project health dashboard, cash-flow S-curves, supplier & client extranet portals. | 125 SP | Scaled (Sprint 24) |
| **TOTAL** | **25 Modules Complete** | **Full Enterprise Construction Tier-1 Operating Platform** | **2,900 SP** | **24 Sprints (12 Mo)** |

---

### 8.2 Detailed User Stories (INVEST Criteria with Given-When-Then Gherkin Scenarios)

#### Module 05: Bill of Quantities (BOQ) Engine
##### User Story US-BOQ-01: High-Performance Excel BOQ Bulk Ingestion
- **Story Statement:** As a Lead Quantity Surveyor, I want to import a 10,000-line tender BOQ Excel file with automated CSI MasterFormat code validation, so that the project budget baseline can be established in minutes without manual data entry.
- **Story Points:** 13 SP (Sprint 3)
- **INVEST Review:** Independent (imports without requiring live site data), Negotiable (field mapping flexible), Valuable (saves 40+ hours per tender), Estimable (well-scoped parser), Small (13 SP slice), Testable (verifiable via automated test files).
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Successful Bulk Ingestion of Valid BOQ Excel
    Given the Lead QS has selected an active project in "Draft" status
    And an Excel file containing 10,000 rows formatted with Item Code, Description, UOM, Qty, and Rate is uploaded
    When the system executes the bulk ingestion pipeline
    Then all 10,000 items are persisted into the tenant's boq_items table in under 15 seconds
    And each item is correctly mapped to its corresponding CSI MasterFormat division
    And the total contract value equals the sum of (Quantity * Unit Rate) with zero rounding error

  Scenario: Ingestion Rejection due to Negative Unit Rate or Missing Quantities
    Given an Excel file with row 42 containing a negative unit rate "-450.00 SAR"
    When the ingestion validator processes row 42
    Then the entire import transaction is rolled back
    And a detailed validation error report is returned highlighting row 42 and the exact column error
  ```

---

#### Module 06: Procurement & Supply Chain (P2P)
##### User Story US-PRC-03: Automated 3-Bid Commercial Comparative Analysis (CBA)
- **Story Statement:** As a Procurement Manager, I want the system to generate an automated side-by-side comparative statement of supplier quotes, so that I can evaluate commercial compliance, unit rates, payment terms, and delivery lead times objectively.
- **Story Points:** 8 SP (Sprint 4)
- **INVEST Review:** Independent of payment systems; provides high business value; easily tested against mock supplier bids.
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Automated CBA Generation with Outlier Highlighting
    Given an RFQ package for 500 Tons Rebar with 3 submitted supplier bids
    When the Procurement Manager opens the Commercial Bid Analysis screen
    Then the system renders a side-by-side comparison table showing:
      | Metric | Supplier A | Supplier B | Supplier C |
      | Total Price | SAR 1,325,000 | SAR 1,290,000 | SAR 1,410,000 |
      | Delivery Days | 7 Days | 5 Days | 14 Days |
      | Payment Terms | 60 Days LC | 30 Days PDC | 100% Advance |
    And the system automatically highlights the lowest compliant unit rate in green
    And flags any line item that is 15% higher than the baseline BOQ budgeted rate in amber
  ```

---

#### Module 10: Cost Control & Earned Value Management (EVM)
##### User Story US-EVM-02: Automated EVM Indices & Margin Slippage Alerting
- **Story Statement:** As a Project Director, I want the platform to automatically compute CPI, SPI, and EAC upon approval of monthly progress, so that I receive immediate early warning alerts if project profit margin is eroding.
- **Story Points:** 13 SP (Sprint 8)
- **INVEST Review:** Highly valuable for executive governance; testable with mathematical verification scripts.
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Cost Performance Index (CPI) Falls Below Threshold
    Given Project "Kingdom Commercial Center" has a Budget at Completion (BAC) of SAR 120,000,000
    And the approved physical progress yields an Earned Value (EV) of SAR 40,000,000
    And the recorded Actual Cost (AC) in financial ledgers is SAR 46,000,000
    When the monthly EVM batch recalculation runs
    Then the system computes Cost Performance Index: CPI = 40,000,000 / 46,000,000 = 0.8696
    And computes Estimate at Completion: EAC = 120,000,000 / 0.8696 = SAR 137,994,480
    And calculates Cost Variance: CV = EV - AC = -SAR 6,000,000
    And triggers a High-Priority "Margin Erosion Alert" email and SMS to the Project Director and CFO
    And tags the project health status as "Red / Critical" on the Executive Cockpit
  ```

---

#### Module 16: Contracts, Claims & FIDIC Engine
##### User Story US-CLM-01: Statutory 28-Day FIDIC Sub-Clause 20.1 Notice Tracking
- **Story Statement:** As a Lead Contracts Administrator, I want the system to automatically track the statutory 28-day notification countdown from the date of an identified delay event, so that the contractor's legal entitlement to time and cost compensation is never time-barred.
- **Story Points:** 13 SP (Sprint 15)
- **INVEST Review:** Essential risk-mitigation feature; testable with virtual date advancement.
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Automated Warning Countdown for Unnotified Delay Event
    Given a Site Instruction (SI-104) is received instructing suspension of piling works on Day 1
    When the event is logged into the FIDIC Claims Engine under Clause 8.8 (Suspension)
    Then a strict 28-day countdown timer is initiated
    And the system displays Days Remaining: 28 Days
    When the timer reaches Day 21 (7 days before time-bar expiry) and no formal notice is transmitted
    Then an urgent legal risk alert is dispatched to the Project Director and Contracts Lead
    And the AI Contracts Copilot drafts a compliant FIDIC Sub-Clause 20.1 Notice of Claim template
  ```

---

#### Module 18: ZATCA Phase 2 E-Invoicing Engine
##### User Story US-ZAT-02: Cryptographic Stamp & UBL 2.1 Clearance Transmission
- **Story Statement:** As a Senior Financial Accountant, I want client tax invoices to be generated in ZATCA-compliant UBL 2.1 XML and cryptographically stamped with our private ECDSA key, so that they are approved by the ZATCA FATOORA portal in real time.
- **Story Points:** 21 SP (Sprint 17)
- **INVEST Review:** Mission-critical regulatory compliance; testable against official ZATCA sandbox API.
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Successful Real-Time Clearance of Standard Commercial Tax Invoice
    Given a certified Client IPC #14 with Net Payable Amount of SAR 36,125,000 plus 15% VAT (SAR 5,418,750)
    When the CFO approves the invoice issuance
    Then the ZATCA engine generates a compliant UBL 2.1 XML invoice document
    And computes the SHA-256 hash incorporating the previous invoice's hash (Invoice Chaining)
    And signs the hash using the organization's ECDSA secp256k1 private key
    And embeds the cryptographic stamp and Phase 2 QR code into the XML
    When the XML payload is transmitted to the ZATCA FATOORA Clearance API endpoint
    Then ZATCA responds with HTTP 200 and Status "CLEARED"
    And the cleared XML and PDF with embedded ZATCA QR code are locked in the financial ledger
  ```

---

#### Module 23: Offline-First Mobile Field Engineering App
##### User Story US-MOB-01: Disconnected Daily Site Diary with GPS & Conflict-Free Sync
- **Story Statement:** As a Site Engineer working in remote basements without cellular coverage, I want to log workforce attendance, equipment hours, and progress photos offline, so that my logs synchronize automatically when connectivity is restored without data loss.
- **Story Points:** 13 SP (Sprint 22)
- **INVEST Review:** Delivers exceptional field utility; testable by simulating network partition.
- **Acceptance Criteria (Gherkin):**
  ```gherkin
  Scenario: Offline Site Diary Recording and Automatic CRDT Cloud Synchronization
    Given the mobile device has zero cellular and Wi-Fi signal
    When the site engineer records 42 manpower entries, logs 3 excavator hours, and takes 4 site photos
    Then the records are saved locally in SQLite (WatermelonDB) with status "PENDING_SYNC"
    When the mobile device re-establishes an internet connection
    Then the background synchronization engine detects the connection
    And securely pushes all pending records to the cloud API gateway
    And merges progress updates into the master database without overwriting concurrent edits
    And updates the mobile UI indicator to "Fully Synchronized"
  ```

---

### 8.3 24-Sprint Program Distribution & Velocity Planning
The enterprise backlog of **2,900 Story Points** is executed across 24 two-week sprints by four dedicated feature squads (Squad Alpha: Core & Finance; Squad Beta: Engineering & Site; Squad Gamma: Supply Chain & Subcontracts; Squad Delta: BIM, AI & Mobile). Average team velocity is planned at **120-130 Story Points per sprint**.

```
Sprint Velocity Projection & Release Burndown:
Total Backlog: 2,900 SP | 24 Sprints | Average Required Velocity: 121 SP/Sprint
```

| Sprint # | Focus Modules & Epics | Sprint Target Deliverables | Target Velocity |
|---|---|---|---|
| **Sprint 01** | EPIC-01, EPIC-02 | Tenant provisioning, schema isolation, OAuth2/JWT auth, RBAC matrix. | 125 SP |
| **Sprint 02** | EPIC-02, EPIC-03, EPIC-04 | User profiles, CSI MasterFormat catalogs, Project setup & Level 1-2 WBS. | 120 SP |
| **Sprint 03** | EPIC-04, EPIC-05 | Level 3-4 WBS, Milestone baselines, Excel BOQ parser engine. | 125 SP |
| **Sprint 04** | EPIC-05, EPIC-06 | Price recipes (Labor/Material/Plant), Material Requisitions (MR), RFQ engine. | 130 SP |
| **Sprint 05** | EPIC-06, EPIC-07 | 3-Bid CBA matrix, Purchase Order generation, Storekeeper GRN receipt. | 125 SP |
| **Sprint 06** | EPIC-07, EPIC-08 | Store stock ledgers, Subcontract work orders, Subcontractor scope setup. | 120 SP |
| **Sprint 07** | EPIC-08, EPIC-09 | Subcontractor measurement sheets, Subcontract IPCs, Daily Site Diary. | 125 SP |
| **Sprint 08** | EPIC-09, EPIC-10 | Equipment hours tracking, Photo logs, Budget baseline vs. actuals, EVM engine. | 130 SP |
| **Sprint 09** | EPIC-10, Hardening | CPI/SPI calculations, EVM alerts, Cost Value Reconciliation, **MVP Hardening**. | 115 SP |
| **Sprint 10** | EPIC-11 | Drawing register, revision control, RFI submission and triage. | 120 SP |
| **Sprint 11** | EPIC-11, EPIC-12 | Transmittals, Shop drawing submittals, ISO 19650 CDE engine inception. | 125 SP |
| **Sprint 12** | EPIC-12, EPIC-13 | Automated PDF watermarking, QR code stamps, Work Inspection Requests (WIR). | 120 SP |
| **Sprint 13** | EPIC-13, EPIC-14 | Material Inspection (MIR), NCR tracking, HSE Incident logs, PTW workflows. | 125 SP |
| **Sprint 14** | EPIC-14, EPIC-15 | OSHA/ISO safety reporting, Client IPC compilation, Joint measurement audits. | 120 SP |
| **Sprint 15** | EPIC-15, EPIC-16 | Retention holdbacks, FIDIC claims engine, 28-day notice countdown timers. | 130 SP |
| **Sprint 16** | EPIC-16, EPIC-17 | Delay Fragnet analysis, Multi-entity Chart of Accounts, AP/AR ledgers. | 125 SP |
| **Sprint 17** | EPIC-17, EPIC-18 | Bank journals, Balance sheets, ZATCA UBL 2.1 XML generator, ECDSA signing. | 130 SP |
| **Sprint 18** | EPIC-18, EPIC-19 | ZATCA FATOORA clearance integration, Plant asset registry, Equipment maintenance. | 120 SP |
| **Sprint 19** | EPIC-19, EPIC-20 | Fuel logs, Internal hire rates, Labor craft trades, Biometric site attendance. | 125 SP |
| **Sprint 20** | EPIC-20, EPIC-21 | Saudi WPS export, IFC4 WebGL 3D viewer inception, Revit API bridge. | 130 SP |
| **Sprint 21** | EPIC-21, EPIC-22 | 4D schedule simulation, 5D cost model inspection, Primavera P6 .xer parser. | 125 SP |
| **Sprint 22** | EPIC-22, EPIC-23 | 50,000 activity CPM engine, Resource leveling, Offline mobile SQLite engine. | 130 SP |
| **Sprint 23** | EPIC-23, EPIC-24 | CRDT mobile sync, 9-Agent AI Copilot architecture, RAG vector pipeline. | 125 SP |
| **Sprint 24** | EPIC-24, EPIC-25 | AI delay drafting, PMO portfolio dashboard, Supplier & Client extranets. | 115 SP |

---

### 8.4 Enterprise Implementation Risk Matrix & Mitigation Strategy

| Risk ID | Risk Category | Risk Description | Prob (1-5) | Impact (1-5) | Risk Score | Mitigation & Prevention Strategy | Fallback / Contingency Plan | Risk Owner |
|---|---|---|---|---|---|---|---|---|
| **RSK-01** | **Regulatory / Compliance** | ZATCA Phase 2 API specification changes or cryptographic rejection during live clearance. | 3 | 5 | **15 (High)** | Direct implementation against ZATCA SDK; automated unit test suite running against ZATCA sandbox for all UBL 2.1 schemas; ECDSA secp256k1 validation. | Fallback to offline invoice generation with signed XML queued for batch clearance within statutory 24-hr window. | Lead Financial Architect / Compliance Officer |
| **RSK-02** | **Technical / Performance** | High-concurrency performance degradation when calculating CPM for 50,000+ activities or parsing 500MB IFC BIM files in browser. | 4 | 4 | **16 (High)** | Offload CPM graph traversal and IFC geometry parsing to background worker threads (Web Workers / WebAssembly); implement server-side level-of-detail (LOD) streaming. | Cap browser LOD to bounding boxes; provide server-rendered SVG Gantt fallback for low-spec field laptops. | Lead Systems Architect |
| **RSK-03** | **Data Integrity / Financial** | Rounding discrepancies or calculation errors in multi-currency IPCs and retention balances. | 2 | 5 | **10 (Med)** | Mandatory use of arbitrary-precision decimal libraries (`decimal.js` / PostgreSQL `NUMERIC(18,4)`); strict double-entry balancing rules; zero floating-point arithmetic. | Automated daily balance integrity check script halting transactions and alerting the CFO if variance > 0.001 SAR. | Lead Financial Architect |
| **RSK-04** | **Operational / Adoption** | Field site engineers resist mobile app usage and continue using manual paper diaries and WhatsApp. | 4 | 4 | **16 (High)** | Co-design UI with site engineers; optimize mobile app for single-thumb data entry; provide offline voice-to-text Arabic transcription; mandatory site diary tie-in to subcontractor approvals. | Executive mandate from Project Director conditioning approval of site overtime and equipment hire on digital diary entries. | VP Operations & Change Management Lead |
| **RSK-05** | **Security / Multi-Tenancy** | Cross-tenant data leakage between competing joint-venture contractors or subcontractors. | 1 | 5 | **5 (Med)** | Strict schema-per-tenant architectural isolation; automated CI/CD pipeline tests executing cross-tenant penetration attacks; row-level security policies (RLS). | Immediate automated tenant containment protocol locking compromised schema and alerting security operations center. | Chief Information Security Officer (CISO) |
| **RSK-06** | **Integration / Schedule** | Primavera P6 `.xer` proprietary format changes or corrupt binary files causing parser crash. | 3 | 4 | **12 (Med)** | Robust lexical parser with comprehensive syntax fuzzing; support for both legacy `.xer` and standard `.xml` schedule formats. | Provide manual CSV tabular activity mapping wizard for schedule import when `.xer` format is corrupted. | Lead Planning Engineer & Backend Lead |
| **RSK-07** | **Infrastructure / Field** | Extended cellular blackout on remote desert construction sites exceeding mobile local storage capacity. | 3 | 3 | **9 (Med)** | Lightweight local SQLite database using compressed binary blobs for photos; client-side image downsampling (max 1080p); automated local storage quota management. | On-site local Wi-Fi sync station deployed in site management trailer with local Edge caching server. | Lead Mobile Engineer & DevOps Lead |

---

## Document Sign-Off & Approvals

| Role | Name | Title | Signature | Date |
|---|---|---|---|---|
| **Executive Sponsor** | Dr. Faisal Al-Husseini | Chief Executive Officer (CEO) | *[Digitally Signed]* | 2026-11-20 |
| **Technical Authority** | Eng. Mansoor Al-Ghamdi | Chief Technology Officer (CTO) | *[Digitally Signed]* | 2026-11-20 |
| **Domain Authority** | Eng. Tariq Al-Mansoor | Executive Director of Projects | *[Digitally Signed]* | 2026-11-20 |
| **Financial Authority** | Mr. Sulaiman Al-Zahrani | Chief Financial Officer (CFO) | *[Digitally Signed]* | 2026-11-20 |
| **Lead Solution Architect** | Antigravity Architecture Team | Enterprise Architecture Lead | *[Digitally Signed]* | 2026-11-20 |
"""

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    f.write(content.strip() + "\n")

line_count = len(content.strip().split("\n"))
print(f"File successfully written to {OUTPUT_PATH}")
print(f"Total lines: {line_count}")
