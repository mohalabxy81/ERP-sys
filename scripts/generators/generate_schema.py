# -*- coding: utf-8 -*-
"""
Generator for MimarERP v7 Database Schema Architecture Document
Outputs d:\ERP sys\docs\architecture\02-database-schema.md
"""
import os
import sys

output_file = r"d:\ERP sys\docs\architecture\02-database-schema.md"
os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, "w", encoding="utf-8") as f:
    f.write("""# MimarERP v7 — Enterprise Construction ERP: Database Schema & Architecture Specification

**Document Version:** 7.0.0-PROD  
**Database Engine:** PostgreSQL 16.2 Enterprise Edition with PostGIS, pgvector, and pg_partman  
**Classification:** Proprietary / Engineering Specification  
**Target Workload:** Multi-Tenant SaaS, Tier-1 General Contractors & Mega-Projects (100,000+ Concurrent Users)  
**Standard Adherence:** Saudi Building Code (SBC), ZATCA E-Invoicing Phase 2, FIDIC (Red/Silver/Yellow), PMI PMBOK 7th Ed., ISO 19650 (BIM), ISO 9001 (QA), ISO 45001 (HSE)

---

## 1. Executive Summary & Design Principles

MimarERP v7 provides a mission-critical relational database backbone for enterprise construction and engineering organizations operating in the Kingdom of Saudi Arabia and the GCC region. Built natively on **PostgreSQL 16**, the architecture implements a rigorous hybrid tenant isolation paradigm combining Row-Level Security (RLS) with schema-per-tenant support, ensuring hardened isolation, regulatory compliance, and near-linear horizontal scalability.

### Architectural Tenets
1. **Universal Standard Columns:** Every table in the MimarERP schema implements:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `tenant_id UUID NOT NULL` (enforced via PostgreSQL Row-Level Security policies)
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `created_by UUID` (references `users.id`)
   - `updated_by UUID` (references `users.id`)
   - `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` (soft deletion flag)
2. **Naming Convention:** Pure `snake_case` across all schemas, tables, columns, indexes, and triggers. Table names are pluralized nouns.
3. **Auditability & Tamper-Resistance:** All financial, contractual, and compliance-sensitive tables are protected by immutable append-only triggers and cryptographic hash chains.
4. **Bilingual Arabic & English Support:** Full native support for Saudi localization: dual Arabic (`_ar`) and English (`_en`) naming attributes, Arabic full-text search configurations, and UTF-8 collation.
5. **High-Performance Partitioning:** Time-series tables (actual costs, attendance, offline sync logs, audit logs, IoT logs) utilize native PostgreSQL range/declarative partitioning managed via `pg_partman`.

---

## 2. PostgreSQL 16 Architecture & Extensions

```sql
-- Core PostgreSQL 16 Extensions Setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for AI Copilot RAG embeddings
CREATE EXTENSION IF NOT EXISTS "postgis";     -- Spatial engine for site coordinates & BIM footprints
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- Multilingual text processing
```

### Multi-Tenancy Row-Level Security (RLS) Pattern
```sql
-- RLS Tenant Identification Function
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Macro template applied to all platform and domain tables:
-- ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON <table_name>
--   USING (tenant_id = current_tenant_id())
--   WITH CHECK (tenant_id = current_tenant_id());
```

---

## PART A: Core Platform Tables (Multi-Tenant Foundation)

The platform core establishes tenant tenancy, identity, organization units, cost centers, role-based access control (RBAC), and security audit logging.

```sql
-- ============================================================================
-- CORE 01: TENANTS
-- ============================================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Self-referencing to satisfy RLS macro
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    plan VARCHAR(50) NOT NULL DEFAULT 'enterprise' CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    default_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    default_language VARCHAR(5) NOT NULL DEFAULT 'ar-SA',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Riyadh',
    settings_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    subscription_start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subscription_end_date TIMESTAMPTZ,
    max_users INT NOT NULL DEFAULT 100,
    max_projects INT NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================================
-- CORE 02: USERS
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    national_id_iqama VARCHAR(50),
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'invited')),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    last_login TIMESTAMPTZ,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'ar-SA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

-- ============================================================================
-- CORE 03: ROLES
-- ============================================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    permissions_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, code)
);

-- ============================================================================
-- CORE 04: TENANT_USERS (User-Tenant-Role Mapping)
-- ============================================================================
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_primary_tenant BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'resigned')),
    permissions_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_limits_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_tenant_users_tenant_user UNIQUE (tenant_id, user_id)
);

-- ============================================================================
-- CORE 05: ORGANIZATIONS (Multi-Company & Department Hierarchy)
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('holding', 'subsidiary', 'branch', 'division', 'dept')),
    parent_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    cr_number VARCHAR(50), -- Commercial Registration Number (Saudi CR)
    vat_number VARCHAR(50), -- Saudi ZATCA 15-digit VAT ID
    national_address_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    bank_account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_organizations_tenant_code UNIQUE (tenant_id, code)
);

-- ============================================================================
-- CORE 06: COST_CENTERS (Analytical Cost Allocation)
-- ============================================================================
CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES cost_centers(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'cost' CHECK (type IN ('cost', 'profit', 'revenue', 'investment')),
    budget NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    allocated_actual NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_cost_centers_tenant_code UNIQUE (tenant_id, code)
);

-- ============================================================================
-- CORE 07: AUDIT_LOGS (Immutable System & Data Audit Trail)
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT')),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    diff_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

## PART B: Per-Module Production DDL (All 25 Modules)

Every table below includes comprehensive column schemas, PostgreSQL types, primary keys, tenant isolation keys, constraints, checks, foreign keys, and audit attributes.

### Module 01: Project Management

```sql
-- 1.1 Projects Master
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    cost_center_id UUID REFERENCES cost_centers(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('infrastructure', 'building', 'industrial', 'mep', 'fitout', 'residential')),
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('lump_sum', 'unit_rate', 'cost_plus', 'epc', 'fidic_red', 'fidic_yellow', 'fidic_silver')),
    client_name VARCHAR(255) NOT NULL,
    consultant_name VARCHAR(255),
    project_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    revised_end_date DATE,
    contract_value NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    country VARCHAR(3) NOT NULL DEFAULT 'SA',
    city VARCHAR(100) NOT NULL DEFAULT 'Riyadh',
    gps_coordinates POINT,
    status VARCHAR(50) NOT NULL DEFAULT 'tender' CHECK (status IN ('tender', 'awarded', 'active', 'on_hold', 'substantially_completed', 'handed_over', 'closed')),
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (progress_percentage BETWEEN 0.00 AND 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_projects_tenant_code UNIQUE (tenant_id, code)
);

-- 1.2 Project Phases
CREATE TABLE project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_order INT NOT NULL DEFAULT 1,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    planned_start DATE NOT NULL,
    planned_end DATE NOT NULL,
    actual_start DATE,
    actual_end DATE,
    weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 1.3 Work Breakdown Structure (WBS) Items
CREATE TABLE wbs_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES wbs_items(id) ON DELETE RESTRICT,
    code VARCHAR(100) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    level INT NOT NULL DEFAULT 1,
    is_work_package BOOLEAN NOT NULL DEFAULT FALSE,
    weightage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_wbs_tenant_project_code UNIQUE (tenant_id, project_id, code)
);

-- 1.4 Milestones
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    wbs_id UUID REFERENCES wbs_items(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    actual_date DATE,
    is_contractual BOOLEAN NOT NULL DEFAULT FALSE,
    is_critical_path BOOLEAN NOT NULL DEFAULT FALSE,
    payment_linked BOOLEAN NOT NULL DEFAULT FALSE,
    billing_amount NUMERIC(18, 4) DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'delayed', 'waived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 1.5 Baselines
CREATE TABLE baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    baseline_number VARCHAR(50) NOT NULL, -- e.g. BL-0, BL-1
    type VARCHAR(50) NOT NULL CHECK (type IN ('initial', 'revised', 'eot_approved', 'recovery')),
    approval_status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'consultant_approved', 'client_approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMPTZ,
    data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 1.6 Deliverables
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    wbs_id UUID REFERENCES wbs_items(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completion_date DATE,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'under_review', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 1.7 Project Team
CREATE TABLE project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_role VARCHAR(100) NOT NULL, -- Project Manager, Resident Engineer, Site Architect, QA Manager, etc.
    allocation_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_project_team_member UNIQUE (tenant_id, project_id, user_id, project_role)
);
```

---

### Module 02: Cost Control

```sql
-- 2.1 Budgets
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_code VARCHAR(30) NOT NULL DEFAULT 'V1', -- Original Budget (BO), Working Budget (BW)
    title VARCHAR(255) NOT NULL,
    total_budget NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    contingency_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    management_reserve NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'active', 'archived', 'superseded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.2 Cost Codes (Master Standard CBS / CSI MasterFormat)
CREATE TABLE cost_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES cost_codes(id) ON DELETE RESTRICT,
    discipline VARCHAR(50) NOT NULL CHECK (discipline IN ('civil', 'architectural', 'structural', 'mechanical', 'electrical', 'infrastructure', 'preliminaries', 'overheads')),
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('labor', 'material', 'plant', 'subcontractor', 'general')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_cost_codes_tenant_code UNIQUE (tenant_id, code)
);

-- 2.3 Budget Lines
CREATE TABLE budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    wbs_id UUID REFERENCES wbs_items(id) ON DELETE SET NULL,
    cost_code_id UUID NOT NULL REFERENCES cost_codes(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    revised_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.4 Actual Costs
CREATE TABLE actual_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_code_id UUID NOT NULL REFERENCES cost_codes(id) ON DELETE RESTRICT,
    source_module VARCHAR(50) NOT NULL CHECK (source_module IN ('procurement', 'inventory', 'payroll', 'equipment', 'finance', 'subcontract')),
    source_document_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    description TEXT,
    gl_posted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.5 Commitments
CREATE TABLE commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_code_id UUID NOT NULL REFERENCES cost_codes(id) ON DELETE RESTRICT,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('purchase_order', 'subcontract', 'work_order')),
    reference_id UUID NOT NULL,
    committed_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    invoiced_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_invoiced', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.6 Accruals
CREATE TABLE accruals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_code_id UUID NOT NULL REFERENCES cost_codes(id) ON DELETE RESTRICT,
    period_date DATE NOT NULL,
    accrual_type VARCHAR(50) NOT NULL CHECK (accrual_type IN ('received_not_invoiced', 'unbilled_subcontract', 'payroll_accrual', 'provisions')),
    accrual_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    reversal_date DATE,
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.7 Forecasts (Cost At Completion / Estimate to Complete)
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cost_code_id UUID NOT NULL REFERENCES cost_codes(id) ON DELETE RESTRICT,
    forecast_month DATE NOT NULL,
    cost_to_date NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    etc_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Estimate to Complete
    eac_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Estimate at Completion = Actual + ETC
    variance_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Budget - EAC
    justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.8 EVM Data (Earned Value Management Metrics)
CREATE TABLE evm_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reporting_date DATE NOT NULL,
    pv NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Planned Value
    ev NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Earned Value
    ac NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Actual Cost
    bac NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Budget at Completion
    cv NUMERIC(18, 4) GENERATED ALWAYS AS (ev - ac) STORED, -- Cost Variance
    sv NUMERIC(18, 4) GENERATED ALWAYS AS (ev - pv) STORED, -- Schedule Variance
    cpi NUMERIC(8, 4) DEFAULT 1.0000, -- ev / ac (handled by trigger/app to guard /0)
    spi NUMERIC(8, 4) DEFAULT 1.0000, -- ev / pv
    tcpi NUMERIC(8, 4) DEFAULT 1.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_evm_project_date UNIQUE (tenant_id, project_id, reporting_date)
);
```

---

### Module 03: Planning & Scheduling

```sql
-- 3.1 Schedules Master
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schedule_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    data_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    primavera_guid VARCHAR(100), -- Synchronization mapping with Oracle Primavera P6
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.2 Working Calendars
CREATE TABLE calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    work_days_per_week INT NOT NULL DEFAULT 6, -- Standard KSA construction 6-day week
    work_hours_per_day NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
    holidays_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb, -- Official Saudi holidays (Eid, National Day, Foundation Day)
    ramadan_working_hours NUMERIC(4, 2) DEFAULT 6.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.3 Activities (CPM Network Nodes)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    wbs_id UUID REFERENCES wbs_items(id) ON DELETE SET NULL,
    calendar_id UUID REFERENCES calendars(id) ON DELETE RESTRICT,
    activity_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'task' CHECK (activity_type IN ('task', 'start_milestone', 'finish_milestone', 'hammock', 'wbs_summary')),
    duration_days INT NOT NULL DEFAULT 1,
    planned_start TIMESTAMPTZ NOT NULL,
    planned_finish TIMESTAMPTZ NOT NULL,
    early_start TIMESTAMPTZ,
    early_finish TIMESTAMPTZ,
    late_start TIMESTAMPTZ,
    late_finish TIMESTAMPTZ,
    free_float_days INT DEFAULT 0,
    total_float_days INT DEFAULT 0,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    actual_start TIMESTAMPTZ,
    actual_finish TIMESTAMPTZ,
    percent_complete NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_activities_schedule_code UNIQUE (tenant_id, schedule_id, activity_code)
);

-- 3.4 Activity Relationships (CPM Precedence Diagram Method)
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    predecessor_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    successor_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(5) NOT NULL DEFAULT 'FS' CHECK (relationship_type IN ('FS', 'SS', 'FF', 'SF')),
    lag_days INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_no_self_precedence CHECK (predecessor_id <> successor_id)
);

-- 3.5 Activity Resources (Labor, Machinery, Material Loading)
CREATE TABLE activity_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('labor', 'equipment', 'material')),
    resource_id UUID NOT NULL, -- references employees, equipment_master, or stock_items
    planned_units NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    actual_units NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit_of_measure VARCHAR(30) NOT NULL,
    cost_per_unit NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.6 Activity Constraints
CREATE TABLE constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    constraint_type VARCHAR(50) NOT NULL CHECK (constraint_type IN ('start_no_earlier_than', 'start_no_later_than', 'must_start_on', 'finish_no_earlier_than', 'finish_no_later_than', 'must_finish_on', 'as_late_as_possible')),
    constraint_date DATE NOT NULL,
    justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.7 Progress Updates
CREATE TABLE progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    cutoff_date DATE NOT NULL,
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    actual_units_consumed NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    actual_start TIMESTAMPTZ,
    actual_finish TIMESTAMPTZ,
    remaining_duration_days INT,
    notes TEXT,
    site_photo_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 04: Estimation

```sql
-- 4.1 Cost Rate Library
CREATE TABLE rate_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    description_ar VARCHAR(255) NOT NULL,
    description_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('labor', 'equipment', 'materials', 'subcontractors')),
    unit_of_measure VARCHAR(30) NOT NULL,
    base_rate NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    effective_date DATE NOT NULL,
    expiration_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4.2 Resource Specific Rates
CREATE TABLE resource_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rate_library_id UUID NOT NULL REFERENCES rate_library(id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL DEFAULT 'Riyadh', -- Rate differences across NEOM, Western, Eastern, Riyadh
    direct_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    indirect_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_rate NUMERIC(18, 4) GENERATED ALWAYS AS (direct_cost + indirect_cost) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4.3 Estimates Master
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    estimate_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'converted_to_budget')),
    direct_total NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    indirect_total NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    margin_total NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    grand_total NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4.4 Estimate Items (Detailed Work & Material Unit Price Analysis)
CREATE TABLE estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    item_number VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    uom VARCHAR(30) NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 1.0000,
    unit_labor_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    unit_material_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    unit_equipment_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    unit_subcontract_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_unit_cost NUMERIC(18, 4) GENERATED ALWAYS AS (unit_labor_cost + unit_material_cost + unit_equipment_cost + unit_subcontract_cost) STORED,
    total_amount NUMERIC(18, 4) GENERATED ALWAYS AS (quantity * (unit_labor_cost + unit_material_cost + unit_equipment_cost + unit_subcontract_cost)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4.5 Overheads
CREATE TABLE overheads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    overhead_type VARCHAR(50) NOT NULL CHECK (overhead_type IN ('head_office', 'site_management', 'insurance', 'bonds', 'permits', 'safety')),
    calculation_basis VARCHAR(50) NOT NULL CHECK (calculation_basis IN ('percentage_direct', 'fixed_amount', 'per_month')),
    value NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_calculated NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4.6 Markups
CREATE TABLE markups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('net_profit', 'risk_contingency', 'financial_charges', 'escalation')),
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    calculated_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 05: Tendering & Bid Management

```sql
-- 5.1 Tenders Master
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tender_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) NOT NULL CHECK (client_type IN ('government_etimad', 'semi_gov', 'private', 'aramco')),
    etimad_tender_id VARCHAR(100), -- KSA Etimad Portal Reference
    rfp_release_date DATE NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    bond_amount NUMERIC(18, 4) DEFAULT 0.0000,
    bond_validity_days INT DEFAULT 90,
    status VARCHAR(50) NOT NULL DEFAULT 'opportunity' CHECK (status IN ('opportunity', 'go_no_go', 'in_preparation', 'submitted', 'awarded', 'lost', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_tenders_tenant_number UNIQUE (tenant_id, tender_number)
);

-- 5.2 Tender Items (Client RFP BOQ)
CREATE TABLE tender_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    bill_number VARCHAR(50) NOT NULL,
    item_number VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(30) NOT NULL,
    tender_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    cost_estimate_rate NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    bid_rate NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5.3 Bid Packages (Subcontractor & Supplier Enquiry Packages)
CREATE TABLE bid_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    package_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    scope_of_work TEXT NOT NULL,
    target_send_date DATE,
    bid_due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'evaluating', 'negotiating', 'finalized')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5.4 Vendor Bids
CREATE TABLE vendor_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bid_package_id UUID NOT NULL REFERENCES bid_packages(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL, -- references suppliers/subcontractors
    submitted_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quoted_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    technical_compliance_score NUMERIC(5, 2),
    commercial_rank INT,
    status VARCHAR(50) NOT NULL DEFAULT 'under_evaluation' CHECK (status IN ('received', 'under_evaluation', 'shortlisted', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5.5 Bid Comparison (Commercial & Technical Bid Evaluation Matrix)
CREATE TABLE bid_comparison (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bid_package_id UUID NOT NULL REFERENCES bid_packages(id) ON DELETE CASCADE,
    evaluation_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    comparison_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    selected_bid_id UUID REFERENCES vendor_bids(id) ON DELETE RESTRICT,
    selection_justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5.6 Tender Submissions
CREATE TABLE tender_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('technical_envelope', 'financial_envelope', 'bond_envelope', 'combined')),
    submission_timestamp TIMESTAMPTZ NOT NULL,
    confirmation_number VARCHAR(100),
    official_total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 06: Quantity Surveying & Billing (QS)

```sql
-- 6.1 Bill of Quantities (BOQ) Items
CREATE TABLE boq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    wbs_id UUID REFERENCES wbs_items(id) ON DELETE SET NULL,
    bill_number VARCHAR(50) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    unit VARCHAR(30) NOT NULL,
    contract_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    contract_unit_rate NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_amount NUMERIC(18, 4) GENERATED ALWAYS AS (contract_quantity * contract_unit_rate) STORED,
    executed_quantity_to_date NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    billed_quantity_to_date NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_boq_items_project_code UNIQUE (tenant_id, project_id, bill_number, item_code)
);

-- 6.2 Quantity Tracking (Daily Measurement Sheets / Joint Measurements)
CREATE TABLE quantity_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    boq_item_id UUID NOT NULL REFERENCES boq_items(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    location_grid VARCHAR(100), -- Grid axis / elevation
    measured_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    consultant_signed BOOLEAN NOT NULL DEFAULT FALSE,
    consultant_remarks TEXT,
    surveyor_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6.3 Interim Payment Certificates (IPC / Payment Certs)
CREATE TABLE payment_certs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ipc_number INT NOT NULL,
    cutoff_date DATE NOT NULL,
    gross_work_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    materials_on_site_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    retention_deduction NUMERIC(18, 4) NOT NULL DEFAULT 0.0000, -- Typically 10% in Saudi contracts
    advance_payment_recovery NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    other_deductions NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    net_amount_due NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_rate NUMERIC(4, 2) NOT NULL DEFAULT 15.00,
    vat_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_payable_with_vat NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted_to_consultant', 'certified_by_consultant', 'approved_by_client', 'paid', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_payment_certs_project_ipc UNIQUE (tenant_id, project_id, ipc_number)
);

-- 6.4 IPC Line Items
CREATE TABLE ipc_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_cert_id UUID NOT NULL REFERENCES payment_certs(id) ON DELETE CASCADE,
    boq_item_id UUID NOT NULL REFERENCES boq_items(id) ON DELETE RESTRICT,
    previous_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    current_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    cumulative_quantity NUMERIC(18, 4) GENERATED ALWAYS AS (previous_quantity + current_quantity) STORED,
    rate NUMERIC(18, 4) NOT NULL,
    current_amount NUMERIC(18, 4) GENERATED ALWAYS AS (current_quantity * rate) STORED,
    consultant_certified_qty NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    consultant_certified_amt NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6.5 Client Invoices (Tax Invoices linked to certified IPC)
CREATE TABLE client_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    payment_cert_id UUID NOT NULL REFERENCES payment_certs(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_sar NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_sar NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_sar NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    zatca_uuid UUID,
    zatca_qr_code TEXT,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'fully_paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_client_invoices_number UNIQUE (tenant_id, invoice_number)
);
```

---

### Module 07: Procurement & Supply Chain

```sql
-- 7.1 Purchase Requests (PR)
CREATE TABLE purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pr_number VARCHAR(100) NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    required_date DATE NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pm_approved', 'procurement_assigned', 'rejected')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_pr_number UNIQUE (tenant_id, pr_number)
);

-- 7.2 Request for Quotations (RFQ)
CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rfq_number VARCHAR(100) NOT NULL,
    pr_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    terms_conditions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rfq_number UNIQUE (tenant_id, rfq_number)
);

-- 7.3 Supplier Quotations
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL, -- references vendors/suppliers
    quote_reference VARCHAR(100) NOT NULL,
    quote_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    subtotal NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    payment_terms VARCHAR(255),
    delivery_period_days INT,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7.4 Purchase Order Headers (PO)
CREATE TABLE po_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES quotations(id) ON DELETE RESTRICT,
    po_number VARCHAR(100) NOT NULL,
    vendor_id UUID NOT NULL,
    po_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_location VARCHAR(255) NOT NULL,
    subtotal NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent_to_vendor', 'partially_received', 'fully_received', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_po_headers_number UNIQUE (tenant_id, po_number)
);

-- 7.5 Purchase Order Lines
CREATE TABLE po_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_id UUID NOT NULL REFERENCES po_headers(id) ON DELETE CASCADE,
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE RESTRICT,
    line_number INT NOT NULL,
    item_description TEXT NOT NULL,
    uom VARCHAR(30) NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 1.0000,
    unit_price NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    line_subtotal NUMERIC(18, 4) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7.6 Deliveries / Goods Received Notes (GRN / Delivery Notes)
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_id UUID NOT NULL REFERENCES po_headers(id) ON DELETE RESTRICT,
    grn_number VARCHAR(100) NOT NULL,
    delivery_note_ref VARCHAR(100) NOT NULL,
    delivery_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_by UUID NOT NULL REFERENCES users(id),
    warehouse_id UUID, -- references warehouses
    vehicle_plate_number VARCHAR(50),
    driver_name VARCHAR(100),
    qc_passed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_grn_number UNIQUE (tenant_id, grn_number)
);

-- 7.7 Delivery Items
CREATE TABLE delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    po_line_id UUID NOT NULL REFERENCES po_lines(id) ON DELETE RESTRICT,
    quantity_delivered NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    quantity_accepted NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    quantity_rejected NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 08: Inventory & Warehouse Management

```sql
-- 8.1 Warehouses Master
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('central', 'site_laydown_yard', 'transit', 'scrap')),
    location_address TEXT,
    warehouse_keeper_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_warehouses_code UNIQUE (tenant_id, code)
);

-- 8.2 Stock Items (Catalogue of Construction Materials)
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    barcode VARCHAR(100),
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('civil_raw', 'rebar', 'structural_steel', 'cement_aggregates', 'piping_plumbing', 'electrical_cables', 'finishing', 'consumables', 'safety_gear')),
    uom VARCHAR(30) NOT NULL,
    valuation_method VARCHAR(20) NOT NULL DEFAULT 'moving_average' CHECK (valuation_method IN ('fifo', 'lifo', 'moving_average', 'standard_cost')),
    average_unit_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    safety_stock_level NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    reorder_point NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_stock_items_code UNIQUE (tenant_id, item_code)
);

-- 8.3 Stock Levels (Warehouse-Item Inventory Matrix)
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
    quantity_on_hand NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    quantity_allocated NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    quantity_available NUMERIC(18, 4) GENERATED ALWAYS AS (quantity_on_hand - quantity_allocated) STORED,
    bin_location VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_stock_warehouse_item UNIQUE (tenant_id, warehouse_id, stock_item_id)
);

-- 8.4 Material Requests (MR / Store Issue Requisition)
CREATE TABLE material_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    mr_number VARCHAR(100) NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    required_date DATE NOT NULL,
    purpose TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'partially_issued', 'issued', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_mr_number UNIQUE (tenant_id, mr_number)
);

-- 8.5 Material Request Items
CREATE TABLE mr_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    material_request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    quantity_requested NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    quantity_issued NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8.6 Stock Movements (Ledger of In, Out, Transfer, Scrap Transactions)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('receipt', 'issuance', 'transfer_in', 'transfer_out', 'adjustment', 'scrap')),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
    from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    quantity NUMERIC(18, 4) NOT NULL,
    unit_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_cost NUMERIC(18, 4) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reference_document_type VARCHAR(50) NOT NULL, -- e.g. 'grn', 'mr', 'physical_count'
    reference_document_id UUID NOT NULL,
    movement_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 09: Plant & Equipment Fleet

```sql
-- 9.1 Equipment Master (Heavy Machinery, Cranes, Earthmoving, Fleet)
CREATE TABLE equipment_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    equipment_code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('tower_crane', 'mobile_crane', 'excavator', 'loader', 'bulldozer', 'dump_truck', 'concrete_pump', 'generator', 'compactor', 'light_vehicle')),
    make VARCHAR(100),
    model VARCHAR(100),
    model_year INT,
    chassis_serial_no VARCHAR(100),
    license_plate VARCHAR(50),
    ownership_type VARCHAR(30) NOT NULL CHECK (ownership_type IN ('owned', 'rented', 'leased')),
    assigned_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    hourly_cost_rate NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    odometer_hours NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (current_status IN ('available', 'working', 'under_maintenance', 'breakdown', 'demobilized')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_equipment_code UNIQUE (tenant_id, equipment_code)
);

-- 9.2 Fuel Logs
CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
    log_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fuel_type VARCHAR(30) NOT NULL DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'gasoline_91', 'gasoline_95')),
    quantity_liters NUMERIC(10, 2) NOT NULL,
    unit_price_sar NUMERIC(8, 4) NOT NULL DEFAULT 1.1500,
    total_cost_sar NUMERIC(18, 4) GENERATED ALWAYS AS (quantity_liters * unit_price_sar) STORED,
    odometer_reading NUMERIC(12, 2) NOT NULL,
    bowser_truck_ref VARCHAR(100),
    driver_signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9.3 Utilization Logs (Daily Equipment Timesheets)
CREATE TABLE utilization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    operating_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    idle_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    breakdown_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    operator_id UUID REFERENCES users(id),
    cost_code_id UUID REFERENCES cost_codes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9.4 Maintenance Orders (Preventive & Corrective Maintenance)
CREATE TABLE maintenance_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    equipment_id UUID NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('preventive_service_500h', 'service_1000h', 'major_overhaul', 'corrective_repair', 'inspection')),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    parts_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    labor_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    technician_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_maint_order_number UNIQUE (tenant_id, order_number)
);

-- 9.5 Equipment Breakdowns
CREATE TABLE breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
    breakdown_time TIMESTAMPTZ NOT NULL,
    reported_by UUID REFERENCES users(id),
    failure_mode VARCHAR(100) NOT NULL,
    site_impact VARCHAR(50) NOT NULL CHECK (site_impact IN ('critical_path_stopped', 'minor_delay', 'no_impact')),
    repaired_time TIMESTAMPTZ,
    root_cause TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9.6 Rental Agreements (External Plant Hire)
CREATE TABLE rental_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agreement_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_basis VARCHAR(30) NOT NULL CHECK (rental_basis IN ('daily', 'monthly', 'dry_lease', 'wet_lease')),
    rate_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    includes_operator BOOLEAN NOT NULL DEFAULT TRUE,
    includes_fuel BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rental_agreement_number UNIQUE (tenant_id, agreement_number)
);
```

---

### Module 10: Human Resources & Payroll (HR)

```sql
-- 10.1 Designations Master
CREATE TABLE designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    grade_level VARCHAR(20) NOT NULL DEFAULT 'G1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10.2 Employees Master (Saudi Qiwa / GOSI / Muqeem compliant)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_badge_id VARCHAR(50) NOT NULL,
    designation_id UUID NOT NULL REFERENCES designations(id) ON DELETE RESTRICT,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    assigned_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    first_name_ar VARCHAR(100) NOT NULL,
    last_name_ar VARCHAR(100) NOT NULL,
    first_name_en VARCHAR(100) NOT NULL,
    last_name_en VARCHAR(100) NOT NULL,
    nationality_code VARCHAR(3) NOT NULL DEFAULT 'SA',
    is_saudi BOOLEAN NOT NULL DEFAULT FALSE,
    iqama_national_id VARCHAR(50) NOT NULL,
    iqama_expiry_hijri VARCHAR(20),
    gosi_number VARCHAR(50),
    passport_number VARCHAR(50),
    joining_date DATE NOT NULL,
    basic_salary NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    housing_allowance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    transport_allowance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    other_allowances NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'on_leave', 'terminated', 'resigned', 'runaway_huroob')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_employees_badge UNIQUE (tenant_id, employee_badge_id),
    CONSTRAINT uq_employees_iqama UNIQUE (tenant_id, iqama_national_id)
);

-- 10.3 Attendance Records (Biometric Site Turnstiles & Geofencing)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    work_hours NUMERIC(4, 2) DEFAULT 0.00,
    overtime_hours NUMERIC(4, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_duty', 'sick_leave', 'annual_leave')),
    verification_mode VARCHAR(30) DEFAULT 'biometric_face' CHECK (verification_mode IN ('biometric_finger', 'biometric_face', 'rfid_card', 'mobile_gps')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_employee_attendance_date UNIQUE (tenant_id, employee_id, attendance_date)
);

-- 10.4 Payroll Runs (Saudi WPS - Wage Protection System File Compliant)
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_month DATE NOT NULL, -- e.g. 2026-03-01
    total_gross NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_deductions NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_net NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    wps_file_generated BOOLEAN NOT NULL DEFAULT FALSE,
    wps_file_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'hr_approved', 'finance_approved', 'disbursed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10.5 Payroll Items (Individual Employee Pay Slip Lines)
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_earned NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    housing_earned NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    transport_earned NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    overtime_earned NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    gosi_employee_deduction NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    gosi_company_share NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    absence_deduction NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    net_payable NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    iban_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10.6 Leave Requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'hajj', 'marriage', 'paternity', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL,
    exit_reentry_visa_required BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'manager_approved', 'hr_approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10.7 Camp Assignments (Labor Accommodation Linking)
CREATE TABLE camp_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    room_id UUID NOT NULL, -- references camp_rooms in Module 23
    bed_number INT NOT NULL,
    assigned_from DATE NOT NULL,
    assigned_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 11: Document Control & EDMS

```sql
-- 11.1 Documents Master
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('drawing', 'specification', 'contract', 'correspondence', 'minutes_of_meeting', 'report', 'calc_sheet')),
    discipline VARCHAR(50) NOT NULL CHECK (discipline IN ('architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'civil', 'general')),
    confidentiality VARCHAR(30) NOT NULL DEFAULT 'internal' CHECK (confidentiality IN ('public', 'internal', 'restricted', 'confidential')),
    current_revision VARCHAR(10) NOT NULL DEFAULT 'A',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved_for_construction', 'as_built', 'superseded', 'void')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_documents_number UNIQUE (tenant_id, project_id, document_number)
);

-- 11.2 Document Revisions
CREATE TABLE document_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    revision_code VARCHAR(10) NOT NULL, -- 00, 01, A, B, C
    revision_date DATE NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_sha256 VARCHAR(64) NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 11.3 Transmittals Master
CREATE TABLE transmittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    transmittal_number VARCHAR(100) NOT NULL,
    sender_org VARCHAR(255) NOT NULL,
    recipient_org VARCHAR(255) NOT NULL,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('for_approval', 'for_review', 'for_information', 'for_construction', 'as_built')),
    status VARCHAR(50) NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'acknowledged', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_transmittal_number UNIQUE (tenant_id, project_id, transmittal_number)
);

-- 11.4 Transmittal Items
CREATE TABLE transmittal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transmittal_id UUID NOT NULL REFERENCES transmittals(id) ON DELETE CASCADE,
    document_revision_id UUID NOT NULL REFERENCES document_revisions(id) ON DELETE RESTRICT,
    copies_count INT NOT NULL DEFAULT 1,
    action_required VARCHAR(50) NOT NULL DEFAULT 'review_and_comment',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 11.5 Review Cycles
CREATE TABLE review_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_revision_id UUID NOT NULL REFERENCES document_revisions(id) ON DELETE CASCADE,
    cycle_number INT NOT NULL DEFAULT 1,
    lead_reviewer_id UUID REFERENCES users(id),
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue')),
    overall_consultant_code VARCHAR(10) CHECK (overall_consultant_code IN ('A', 'B', 'C', 'D')), -- A: Approved, B: Approved w/ Comments, C: Revise & Resubmit, D: Rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 11.6 Review Comments
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    review_cycle_id UUID NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
    page_sheet_number VARCHAR(50),
    annotation_coordinates JSONB, -- Coordinates on PDF viewer canvas
    comment_text TEXT NOT NULL,
    contractor_response TEXT,
    consultant_verification VARCHAR(50) DEFAULT 'open' CHECK (consultant_verification IN ('open', 'resolved', 'reopened')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 12: Technical Office & Engineering

```sql
-- 12.1 Shop Drawings Register
CREATE TABLE shop_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    drawing_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    discipline VARCHAR(50) NOT NULL CHECK (discipline IN ('arch', 'struct', 'mep', 'infrastructure')),
    target_submission_date DATE NOT NULL,
    consultant_status VARCHAR(10) DEFAULT 'pending' CHECK (consultant_status IN ('pending', 'Code_A', 'Code_B', 'Code_C', 'Code_D')),
    scale VARCHAR(20) DEFAULT '1:50',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_shop_drawings_number UNIQUE (tenant_id, project_id, drawing_number)
);

-- 12.2 Material & Technical Submittals (MAT / MAR)
CREATE TABLE submittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submittal_number VARCHAR(100) NOT NULL,
    submittal_type VARCHAR(50) NOT NULL CHECK (submittal_type IN ('material_approval', 'method_statement', 'prequalification', 'sample', 'test_report')),
    title VARCHAR(255) NOT NULL,
    specification_section VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    supplier VARCHAR(255),
    consultant_action_code VARCHAR(10) CHECK (consultant_action_code IN ('A', 'B', 'C', 'D')),
    action_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_submittals_number UNIQUE (tenant_id, project_id, submittal_number)
);

-- 12.3 Requests for Information (RFI)
CREATE TABLE rfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rfi_number VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    contractor_proposed_solution TEXT,
    cost_impact BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_impact BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_cost_sar NUMERIC(18, 4) DEFAULT 0.0000,
    estimated_delay_days INT DEFAULT 0,
    consultant_response TEXT,
    consultant_responder_id UUID REFERENCES users(id),
    date_responded TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'responded', 'closed', 'escalated_to_client')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rfis_number UNIQUE (tenant_id, project_id, rfi_number)
);

-- 12.4 Technical Queries (TQ)
CREATE TABLE technical_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tq_number VARCHAR(100) NOT NULL,
    originator_type VARCHAR(50) NOT NULL CHECK (originator_type IN ('subcontractor', 'site_engineer', 'procurement')),
    query_details TEXT NOT NULL,
    technical_office_reply TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'converted_to_rfi')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 12.5 Engineering Design Reviews
CREATE TABLE engineering_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    review_stage VARCHAR(50) NOT NULL CHECK (review_stage IN ('concept_30', 'schematic_60', 'detailed_90', 'ifc_100')),
    findings_summary TEXT,
    value_engineering_potential_sar NUMERIC(18, 4) DEFAULT 0.0000,
    signoff_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (signoff_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 13: Contract Management & Commercial

```sql
-- 13.1 Contracts Master (Client & Subcontractor Agreements)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    party_type VARCHAR(30) NOT NULL CHECK (party_type IN ('client', 'subcontractor', 'joint_venture_partner')),
    second_party_name VARCHAR(255) NOT NULL,
    contract_standard VARCHAR(50) NOT NULL DEFAULT 'fidic_red_book' CHECK (contract_standard IN ('fidic_red_book', 'fidic_yellow_book', 'fidic_silver_book', 'government_standard_saudi', 'custom')),
    signing_date DATE NOT NULL,
    commencement_date DATE NOT NULL,
    original_duration_days INT NOT NULL,
    original_completion_date DATE NOT NULL,
    revised_completion_date DATE,
    original_contract_value NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    revised_contract_value NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    retention_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    advance_payment_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    delay_damages_per_day NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    max_delay_damages_cap NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'completed_defects_period', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_contracts_number UNIQUE (tenant_id, contract_number)
);

-- 13.2 Contract Lines
CREATE TABLE contract_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    scope_description TEXT NOT NULL,
    agreed_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    payment_terms_milestone VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 13.3 Variation Orders (VO / Change Orders)
CREATE TABLE variation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    vo_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('client_scope_change', 'design_discrepancy', 'unforeseen_site_conditions', 'authority_regulations', 'value_engineering')),
    initiated_by VARCHAR(50) NOT NULL CHECK (initiated_by IN ('client', 'engineer_consultant', 'contractor')),
    submitted_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    approved_cost NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    submitted_eot_days INT NOT NULL DEFAULT 0,
    approved_eot_days INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'submitted', 'under_negotiation', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_vo_number UNIQUE (tenant_id, contract_id, vo_number)
);

-- 13.4 Extension of Time (EOT) Requests
CREATE TABLE eot_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    eot_number VARCHAR(100) NOT NULL,
    fidic_clause_reference VARCHAR(50) DEFAULT '8.4',
    event_description TEXT NOT NULL,
    delay_days_claimed INT NOT NULL,
    delay_days_granted INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'engineer_determined', 'client_approved', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_eot_number UNIQUE (tenant_id, contract_id, eot_number)
);

-- 13.5 Guarantees & Bonds (Performance Bonds, Advance Payment Bonds)
CREATE TABLE bonds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    bond_type VARCHAR(50) NOT NULL CHECK (bond_type IN ('bid_bond', 'advance_payment_bond', 'performance_bond', 'retention_money_bond', 'maintenance_bond')),
    issuing_bank VARCHAR(255) NOT NULL,
    bond_reference_number VARCHAR(100) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    extended_expiry_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'liquidated', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 13.6 Insurances (CAR - Contractor All Risk, Third Party Liability)
CREATE TABLE insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('contractors_all_risks_car', 'third_party_liability_tpl', 'workmens_compensation', 'plant_machinery_cpm')),
    insurance_company VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    insured_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    deductible_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'renewed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 13.7 Contractual Formal Claims Register
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    claim_code VARCHAR(100) NOT NULL,
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN ('cost_only', 'time_only', 'cost_and_time')),
    amount_claimed NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    amount_awarded NUMERIC(18, 4) DEFAULT 0.0000,
    days_claimed INT NOT NULL DEFAULT 0,
    days_awarded INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'notice_served' CHECK (status IN ('notice_served', 'particulars_submitted', 'engineer_assessing', 'amicably_settled', 'dispute_board', 'arbitration')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_claims_code UNIQUE (tenant_id, contract_id, claim_code)
);
```

---

### Module 14: Claims & Dispute Resolution

```sql
-- 14.1 Claim Register Master
CREATE TABLE claim_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reference_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    fidic_clause VARCHAR(50) NOT NULL DEFAULT '20.1',
    date_of_notice DATE NOT NULL, -- Mandatory 28-day notice rule in FIDIC
    date_of_detailed_claim DATE,  -- Mandatory 42-day particulars rule
    claim_category VARCHAR(50) NOT NULL CHECK (claim_category IN ('late_drawings', 'site_possession_delay', 'unforeseen_subsurface', 'force_majeure', 'suspension_by_employer', 'variation_dispute')),
    total_cost_impact NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_time_impact_days INT NOT NULL DEFAULT 0,
    current_status VARCHAR(50) NOT NULL DEFAULT 'notice_sent' CHECK (current_status IN ('notice_sent', 'detailed_submission', 'engineer_consultation', 'determination', 'referral_to_dab', 'court_or_arbitration')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_claim_register_ref UNIQUE (tenant_id, project_id, reference_number)
);

-- 14.2 Claim Chronological Events
CREATE TABLE claim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    claim_register_id UUID NOT NULL REFERENCES claim_register(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_headline VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impacted_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14.3 Claim Evidence Repository
CREATE TABLE claim_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    claim_register_id UUID NOT NULL REFERENCES claim_register(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('site_instruction', 'daily_report', 'weather_bulletin', 'transmittal', 'survey_record', 'photograph', 'email_correspondence')),
    title VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    relevance_explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14.4 Delay Analysis Methodologies
CREATE TABLE delay_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    claim_register_id UUID NOT NULL REFERENCES claim_register(id) ON DELETE CASCADE,
    methodology VARCHAR(50) NOT NULL CHECK (methodology IN ('impacted_as_planned', 'time_impact_analysis_tia', 'as_built_critical_path', 'windows_analysis', 'collapsed_as_built')),
    analysis_date DATE NOT NULL,
    analyst_name VARCHAR(255) NOT NULL,
    critical_path_delays_days INT NOT NULL,
    concurrent_delays_days INT NOT NULL DEFAULT 0,
    employer_risk_events_days INT NOT NULL,
    contractor_risk_events_days INT NOT NULL DEFAULT 0,
    report_file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14.5 EOT Calculations & Prolongation Costs
CREATE TABLE eot_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    claim_register_id UUID NOT NULL REFERENCES claim_register(id) ON DELETE CASCADE,
    extended_days INT NOT NULL,
    daily_prolongation_rate NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    head_office_overhead_formula VARCHAR(50) NOT NULL DEFAULT 'hudson' CHECK (methodology IN ('hudson', 'emden', 'eichleay', 'actual_cost')),
    site_overheads_claimed NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    ho_overheads_claimed NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    loss_of_productivity_claimed NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    finance_charges_claimed NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_claim_value NUMERIC(18, 4) GENERATED ALWAYS AS (site_overheads_claimed + ho_overheads_claimed + loss_of_productivity_claimed + finance_charges_claimed) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 15: Quality Assurance & Quality Control (QA/QC)

```sql
-- 15.1 Inspection and Test Plans (ITP)
CREATE TABLE itps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    itp_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    discipline VARCHAR(50) NOT NULL CHECK (discipline IN ('civil', 'structural', 'architectural', 'mep', 'infrastructure')),
    specification_reference VARCHAR(100) NOT NULL,
    revision VARCHAR(10) NOT NULL DEFAULT '0',
    status VARCHAR(50) NOT NULL DEFAULT 'approved' CHECK (status IN ('draft', 'under_review', 'approved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_itp_number UNIQUE (tenant_id, project_id, itp_number)
);

-- 15.2 ITP Line Items / Inspection Points
CREATE TABLE itp_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    itp_id UUID NOT NULL REFERENCES itps(id) ON DELETE CASCADE,
    item_order INT NOT NULL,
    activity_description TEXT NOT NULL,
    standard_specification TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    contractor_point VARCHAR(20) NOT NULL DEFAULT 'H' CHECK (contractor_point IN ('H', 'W', 'S', 'R')), -- Hold, Witness, Surveillance, Review
    consultant_point VARCHAR(20) NOT NULL DEFAULT 'H' CHECK (consultant_point IN ('H', 'W', 'S', 'R')),
    client_point VARCHAR(20) NOT NULL DEFAULT 'S' CHECK (client_point IN ('H', 'W', 'S', 'R')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 15.3 Work & Material Inspection Requests (WIR / MIR)
CREATE TABLE inspection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    itp_item_id UUID REFERENCES itp_items(id) ON DELETE SET NULL,
    ir_number VARCHAR(100) NOT NULL,
    ir_type VARCHAR(10) NOT NULL CHECK (ir_type IN ('WIR', 'MIR')), -- Work or Material
    location_details VARCHAR(255) NOT NULL,
    inspection_datetime TIMESTAMPTZ NOT NULL,
    consultant_verdict VARCHAR(20) DEFAULT 'pending' CHECK (consultant_verdict IN ('pending', 'approved', 'approved_with_notes', 'rejected')),
    inspector_signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_ir_number UNIQUE (tenant_id, project_id, ir_number)
);

-- 15.4 Non-Conformance Reports (NCR)
CREATE TABLE ncrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ncr_number VARCHAR(100) NOT NULL,
    issued_to VARCHAR(50) NOT NULL CHECK (issued_to IN ('main_contractor', 'subcontractor', 'supplier')),
    non_conformance_details TEXT NOT NULL,
    clause_violated VARCHAR(100) NOT NULL,
    root_cause_analysis TEXT,
    corrective_action_proposed TEXT,
    disposition VARCHAR(50) CHECK (disposition IN ('scrap_and_rework', 'repair', 'accept_as_is', 'concession_requested')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'disposition_approved', 'reinspection_ready', 'closed_verified')),
    closure_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_ncr_number UNIQUE (tenant_id, project_id, ncr_number)
);

-- 15.5 Corrective Action Requests (CAR)
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    car_number VARCHAR(100) NOT NULL,
    ncr_id UUID REFERENCES ncrs(id) ON DELETE SET NULL,
    process_name VARCHAR(100) NOT NULL,
    systemic_failure_description TEXT NOT NULL,
    preventive_action_plan TEXT NOT NULL,
    implementation_target_date DATE NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_car_number UNIQUE (tenant_id, project_id, car_number)
);

-- 15.6 Punch Lists (Defect / Snagging Lists for Handover)
CREATE TABLE punch_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    list_code VARCHAR(100) NOT NULL,
    zone_building VARCHAR(100) NOT NULL,
    floor_level VARCHAR(50) NOT NULL,
    handover_phase VARCHAR(50) NOT NULL CHECK (handover_phase IN ('pre_handover', 'consultant_walkthrough', 'client_snagging', 'toc_handover')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared', 'signed_off')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_punch_list_code UNIQUE (tenant_id, project_id, list_code)
);

-- 15.7 Punch Items
CREATE TABLE punch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    punch_list_id UUID NOT NULL REFERENCES punch_lists(id) ON DELETE CASCADE,
    item_number INT NOT NULL,
    room_identifier VARCHAR(50),
    defect_description TEXT NOT NULL,
    defect_category VARCHAR(50) NOT NULL CHECK (defect_category IN ('paint_blemish', 'missing_hardware', 'mep_leak', 'tile_crack', 'door_alignment', 'cleaning')),
    subcontractor_responsible VARCHAR(255),
    photo_before_url TEXT,
    photo_after_url TEXT,
    rectified_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'rectified', 'accepted_closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 16: Health, Safety & Environment (HSE)

```sql
-- 16.1 HSE Incidents (OSHA / ISO 45001 Compliant)
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    incident_number VARCHAR(100) NOT NULL,
    incident_timestamp TIMESTAMPTZ NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('first_aid', 'medical_treatment', 'lost_time_injury_lti', 'fatality', 'environmental_spill', 'property_damage')),
    location_zone VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    injured_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    lost_workdays INT NOT NULL DEFAULT 0,
    investigation_findings TEXT,
    corrective_actions TEXT,
    reported_to_gosi BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_incident_number UNIQUE (tenant_id, project_id, incident_number)
);

-- 16.2 Near Misses
CREATE TABLE near_misses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_number VARCHAR(100) NOT NULL,
    observation_time TIMESTAMPTZ NOT NULL,
    hazard_type VARCHAR(50) NOT NULL CHECK (hazard_type IN ('working_at_height', 'electrical_hazard', 'falling_objects', 'lifting_operations', 'trench_excavation', 'fire_risk', 'chemical_exposure')),
    description TEXT NOT NULL,
    immediate_action_taken TEXT NOT NULL,
    potential_severity VARCHAR(20) NOT NULL CHECK (potential_severity IN ('low', 'medium', 'high', 'fatal')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 16.3 Risk Assessments (HIRA / JHA - Job Hazard Analysis)
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    activity_title VARCHAR(255) NOT NULL,
    hazard_description TEXT NOT NULL,
    initial_risk_score INT NOT NULL, -- Probability x Severity (1 to 25)
    control_measures TEXT NOT NULL,
    residual_risk_score INT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 16.4 Permits to Work (PTW)
CREATE TABLE ptw_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    permit_number VARCHAR(100) NOT NULL,
    permit_type VARCHAR(50) NOT NULL CHECK (permit_type IN ('hot_work', 'confined_space', 'deep_excavation', 'working_at_height', 'electrical_isolation', 'critical_lifting', 'radiography')),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    site_location VARCHAR(255) NOT NULL,
    contractor_supervisor_id UUID REFERENCES users(id),
    hse_officer_id UUID REFERENCES users(id),
    gas_test_required BOOLEAN NOT NULL DEFAULT FALSE,
    gas_test_results JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'authorized', 'active', 'suspended', 'closed_surrendered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_ptw_number UNIQUE (tenant_id, project_id, permit_number)
);

-- 16.5 Toolbox Talks (TBT)
CREATE TABLE toolbox_talks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    talk_date DATE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    conductor_id UUID NOT NULL REFERENCES users(id),
    attendees_count INT NOT NULL DEFAULT 0,
    photo_evidence_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 16.6 HSE Training Register
CREATE TABLE hse_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    training_date DATE NOT NULL,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    passed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 17: BIM & 4D/5D VDC Integration

```sql
-- 17.1 BIM Models Master (IFC & Autodesk Revit Federated Models)
CREATE TABLE bim_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    discipline VARCHAR(50) NOT NULL CHECK (discipline IN ('architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'site_federated')),
    lod VARCHAR(10) NOT NULL DEFAULT 'LOD300' CHECK (lod IN ('LOD100', 'LOD200', 'LOD300', 'LOD350', 'LOD400', 'LOD500')),
    file_format VARCHAR(20) NOT NULL DEFAULT 'ifc' CHECK (file_format IN ('ifc', 'rvt', 'nwd', 'nwc')),
    storage_path TEXT NOT NULL,
    filesize_bytes BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 17.2 BIM Elements (Granular IFC Component Database)
CREATE TABLE bim_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    ifc_guid VARCHAR(64) NOT NULL,
    ifc_type VARCHAR(100) NOT NULL, -- IfcWallStandardCase, IfcBeam, IfcColumn, IfcPipeSegment
    element_name VARCHAR(255),
    level_storey VARCHAR(100),
    bounding_box_jsonb JSONB,
    properties_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL, -- 4D Scheduling Link
    boq_item_id UUID REFERENCES boq_items(id) ON DELETE SET NULL,   -- 5D Cost Control Link
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_bim_element_model_guid UNIQUE (tenant_id, model_id, ifc_guid)
);

-- 17.3 Clash Detection Reports
CREATE TABLE clash_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_title VARCHAR(255) NOT NULL,
    model_a_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    model_b_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tolerance_mm NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    total_clashes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 17.4 Clash Items (BCF - BIM Collaboration Format Compatible)
CREATE TABLE clash_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    clash_report_id UUID NOT NULL REFERENCES clash_reports(id) ON DELETE CASCADE,
    clash_point_coordinates POINT,
    element_a_guid VARCHAR(64) NOT NULL,
    element_b_guid VARCHAR(64) NOT NULL,
    clash_type VARCHAR(30) NOT NULL CHECK (clash_type IN ('hard_clash', 'soft_clearance', 'duplicate')),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'approved_tolerance', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 17.5 BIM Quantity Extractions (QTO - Automated Take-off)
CREATE TABLE quantity_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES bim_models(id) ON DELETE CASCADE,
    ifc_type VARCHAR(100) NOT NULL,
    net_volume_m3 NUMERIC(18, 4) DEFAULT 0.0000,
    net_area_m2 NUMERIC(18, 4) DEFAULT 0.0000,
    net_length_m NUMERIC(18, 4) DEFAULT 0.0000,
    total_count INT NOT NULL DEFAULT 0,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 18: CRM & Business Development

```sql
-- 18.1 Leads Master
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_code VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(50) NOT NULL CHECK (source IN ('etimad_tender', 'referral', 'exhibition', 'direct_outreach', 'government_initiatives')),
    estimated_budget NUMERIC(18, 4) DEFAULT 0.0000,
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'unqualified' CHECK (qualification_status IN ('unqualified', 'contacted', 'qualified', 'converted', 'lost')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 18.2 Clients Master
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    sector VARCHAR(50) NOT NULL CHECK (sector IN ('giga_project', 'ministry', 'royal_commission', 'private_developer', 'industrial')),
    vat_number VARCHAR(50),
    cr_number VARCHAR(50),
    headquarters_address TEXT,
    credit_limit NUMERIC(18, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_clients_code UNIQUE (tenant_id, client_code)
);

-- 18.3 Opportunities Master (Sales Pipeline)
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'prequalification', 'rfp_received', 'bidding', 'negotiation', 'won', 'lost')),
    expected_value NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    probability_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    weighted_value NUMERIC(18, 4) GENERATED ALWAYS AS (expected_value * (probability_percentage / 100.00)) STORED,
    expected_award_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 18.4 Client Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(100),
    email VARCHAR(255),
    mobile VARCHAR(50),
    is_primary_decision_maker BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 18.5 CRM Activities (Meetings, Phone Calls, Site Visits)
CREATE TABLE activities_crm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'meeting', 'site_visit', 'email', 'bid_presentation')),
    activity_date TIMESTAMPTZ NOT NULL,
    summary TEXT NOT NULL,
    next_follow_up DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 19: PMO & Executive Governance

```sql
-- 19.1 Portfolios Master
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    strategic_objective TEXT,
    allocated_budget NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    director_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_portfolios_code UNIQUE (tenant_id, code)
);

-- 19.2 Programs Master
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    program_manager_id UUID REFERENCES users(id),
    target_start DATE NOT NULL,
    target_end DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_programs_code UNIQUE (tenant_id, code)
);

-- 19.3 Portfolio Projects (Mapping Projects into Portfolios/Programs)
CREATE TABLE portfolio_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    strategic_weight NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_portfolio_project_mapping UNIQUE (tenant_id, portfolio_id, project_id)
);

-- 19.4 KPI Definitions
CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('schedule_performance', 'cost_variance', 'quality_ncr_rate', 'safety_ltir', 'cash_collection')),
    unit_of_measure VARCHAR(30) NOT NULL,
    target_threshold NUMERIC(12, 4) NOT NULL,
    warning_threshold NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_kpi_definitions_code UNIQUE (tenant_id, code)
);

-- 19.5 KPI Values (Historical Metric Time-Series)
CREATE TABLE kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL,
    actual_value NUMERIC(12, 4) NOT NULL,
    compliance_status VARCHAR(20) NOT NULL CHECK (compliance_status IN ('green', 'amber', 'red')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 20: Financial Management & Accounting

```sql
-- 20.1 General Ledger Accounts (Chart of Accounts - Saudi SOCPA Compliant)
CREATE TABLE gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    parent_account_id UUID REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'cost_of_revenue', 'expense')),
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_gl_accounts_number UNIQUE (tenant_id, account_number)
);

-- 20.2 Journal Entries Master
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_number VARCHAR(100) NOT NULL,
    entry_date DATE NOT NULL,
    source_module VARCHAR(50) NOT NULL CHECK (source_module IN ('manual', 'ap', 'ar', 'payroll', 'inventory', 'cost_control')),
    reference_id UUID,
    description TEXT NOT NULL,
    is_posted BOOLEAN NOT NULL DEFAULT FALSE,
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_je_entry_number UNIQUE (tenant_id, entry_number)
);

-- 20.3 Journal Entry Lines (Double-Entry Balance Enforced)
CREATE TABLE je_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    gl_account_id UUID NOT NULL REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    cost_center_id UUID REFERENCES cost_centers(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    debit NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    credit NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_debit_or_credit CHECK (debit >= 0 AND credit >= 0 AND (debit > 0 OR credit > 0))
);

-- 20.4 Accounts Payable (AP) Invoices
CREATE TABLE ap_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,
    po_id UUID REFERENCES po_headers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    retention_withheld NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_payable NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 20.5 Accounts Receivable (AR) Invoices
CREATE TABLE ar_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    net_certified_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    total_receivable NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'partially_collected', 'settled', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 20.6 Payment Vouchers
CREATE TABLE payment_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    voucher_number VARCHAR(100) NOT NULL,
    voucher_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('bank_transfer', 'cheque', 'letter_of_credit', 'petty_cash')),
    amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    beneficiary_name VARCHAR(255) NOT NULL,
    bank_account_id UUID, -- references bank_accounts
    ap_invoice_id UUID REFERENCES ap_invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 20.7 Corporate Bank Accounts
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    iban VARCHAR(50) NOT NULL,
    swift_code VARCHAR(30) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    current_balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    gl_account_id UUID REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_bank_accounts_iban UNIQUE (tenant_id, iban)
);

-- 20.8 Cash Flow Projections
CREATE TABLE cash_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    cash_inflow NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    cash_outflow NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    net_cash NUMERIC(18, 4) GENERATED ALWAYS AS (cash_inflow - cash_outflow) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 21: Finance / ZATCA Phase 2 E-Invoicing

```sql
-- 21.1 ZATCA Invoices Master (Standard & Simplified Tax Invoices)
CREATE TABLE zatca_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL CHECK (invoice_type IN ('standard_tax_invoice_388', 'simplified_tax_invoice_381', 'debit_note_383', 'credit_note_381')),
    issue_date DATE NOT NULL,
    issue_time TIME NOT NULL,
    seller_vat_id VARCHAR(15) NOT NULL, -- 15-digit KSA Tax Number
    buyer_vat_id VARCHAR(15),
    buyer_name VARCHAR(255) NOT NULL,
    line_extension_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    tax_exclusive_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    tax_inclusive_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    allowance_total NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    vat_total NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    previous_invoice_hash TEXT NOT NULL, -- Cryptographic PIH chain
    invoice_hash TEXT NOT NULL,          -- SHA-256 Base64 hash
    digital_signature TEXT,              -- ECDSA signature
    qr_code TEXT NOT NULL,               -- TLV Base64 encoded QR Code
    compliance_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'cleared', 'reported', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_zatca_invoices_uuid UNIQUE (tenant_id, invoice_uuid)
);

-- 21.2 ZATCA API Submissions & Clearance Logs
CREATE TABLE zatca_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    zatca_invoice_id UUID NOT NULL REFERENCES zatca_invoices(id) ON DELETE CASCADE,
    submission_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    api_endpoint VARCHAR(255) NOT NULL,
    http_status_code INT NOT NULL,
    zatca_request_id VARCHAR(100),
    clearance_status VARCHAR(50) NOT NULL,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    validation_warnings JSONB DEFAULT '[]'::jsonb,
    cleared_invoice_xml_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 21.3 E-Invoice UBL 2.1 XML Payloads
CREATE TABLE e_invoice_xml (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    zatca_invoice_id UUID NOT NULL REFERENCES zatca_invoices(id) ON DELETE CASCADE,
    ubl_version VARCHAR(20) NOT NULL DEFAULT '2.1',
    raw_xml TEXT NOT NULL,
    signed_xml TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 22: Organization & Branch Hierarchy (Extended)

*(Core structural tables `organizations` and `cost_centers` are fully defined in PART A).*

---

### Module 23: HR Camp & Site Accommodation

```sql
-- 23.1 Camp Facilities Master
CREATE TABLE camp_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    camp_code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    location_city VARCHAR(100) NOT NULL,
    gps_coordinates POINT,
    total_capacity_beds INT NOT NULL DEFAULT 0,
    mess_hall_available BOOLEAN NOT NULL DEFAULT TRUE,
    clinic_available BOOLEAN NOT NULL DEFAULT TRUE,
    recreation_hall_available BOOLEAN NOT NULL DEFAULT TRUE,
    supervisor_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_camp_code UNIQUE (tenant_id, camp_code)
);

-- 23.2 Camp Rooms
CREATE TABLE camp_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES camp_facilities(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    block_building VARCHAR(50) NOT NULL,
    floor_level VARCHAR(20) NOT NULL DEFAULT 'ground',
    bed_count INT NOT NULL DEFAULT 4,
    ac_type VARCHAR(50) DEFAULT 'split',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_camp_room_number UNIQUE (tenant_id, facility_id, room_number)
);

-- 23.3 Room Assignments
CREATE TABLE room_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES camp_rooms(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    bed_number INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE,
    key_card_rfid VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 24: Mobile Field & Offline Sync

```sql
-- 24.1 Offline Sync Queue (Conflict-free Replicated Mutations)
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_mutation_id UUID NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    entity_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    payload JSONB NOT NULL,
    sync_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'applied', 'conflict_resolved', 'rejected')),
    conflict_resolution_strategy VARCHAR(50) DEFAULT 'last_write_wins',
    server_error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 24.2 Device Registrations
CREATE TABLE device_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_uuid VARCHAR(100) NOT NULL,
    os_name VARCHAR(30) NOT NULL CHECK (os_name IN ('ios', 'android', 'windows')),
    os_version VARCHAR(50),
    app_version VARCHAR(50) NOT NULL,
    push_token TEXT,
    last_active TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_device_registration UNIQUE (tenant_id, user_id, device_uuid)
);

-- 24.3 Push Notifications
CREATE TABLE push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    body_ar TEXT NOT NULL,
    body_en TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('inspection_reminder', 'approval_request', 'safety_alert', 'claim_deadline', 'payroll_notice')),
    deep_link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### Module 25: AI Copilot & Vector Store

```sql
-- 25.1 AI Conversations Master
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    specialist_agent VARCHAR(50) NOT NULL DEFAULT 'general_assistant' CHECK (specialist_agent IN ('cost_advisor', 'schedule_analyst', 'contract_claims_copilot', 'procurement_optimizer', 'hse_inspector_ai', 'general_assistant')),
    session_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 25.2 AI Messages
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    model_name VARCHAR(100) DEFAULT 'gemini-1.5-pro',
    tool_calls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 25.3 AI Context Embeddings (pgvector RAG Store for Saudi Construction Knowledge Base)
CREATE TABLE ai_context_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_table VARCHAR(100) NOT NULL,
    source_record_id UUID NOT NULL,
    document_chunk TEXT NOT NULL,
    embedding vector(1536) NOT NULL, -- 1536-dimensional embedding vector (Gemini / OpenAI compatible)
    metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 25.4 AI Actions Log (Audit Trail for Autonomous Copilot Invocations)
CREATE TABLE ai_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- 'draft_variation_order', 'query_evm_cpi', 'generate_claim_particulars'
    parameters JSONB NOT NULL,
    execution_result JSONB,
    user_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

## PART C: Comprehensive Index Strategy

```sql
-- ============================================================================
-- INDEX STRATEGY 01: FOREIGN KEY INDEXES (Eliminate Sequential Table Scans)
-- ============================================================================
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_cost_centers_tenant_id ON cost_centers(tenant_id);
CREATE INDEX idx_cost_centers_org_id ON cost_centers(org_id);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(tenant_id, status);
CREATE INDEX idx_project_phases_project_id ON project_phases(tenant_id, project_id);
CREATE INDEX idx_wbs_items_project_id ON wbs_items(tenant_id, project_id);
CREATE INDEX idx_wbs_items_parent_id ON wbs_items(parent_id);
CREATE INDEX idx_milestones_project_id ON milestones(tenant_id, project_id);
CREATE INDEX idx_milestones_target_date ON milestones(tenant_id, target_date);
CREATE INDEX idx_baselines_project_id ON baselines(tenant_id, project_id);
CREATE INDEX idx_deliverables_project_id ON deliverables(tenant_id, project_id);
CREATE INDEX idx_project_team_project_user ON project_team(tenant_id, project_id, user_id);

CREATE INDEX idx_budgets_project_id ON budgets(tenant_id, project_id);
CREATE INDEX idx_budget_lines_budget_id ON budget_lines(tenant_id, budget_id);
CREATE INDEX idx_budget_lines_cost_code ON budget_lines(cost_code_id);
CREATE INDEX idx_actual_costs_project_costcode ON actual_costs(tenant_id, project_id, cost_code_id);
CREATE INDEX idx_actual_costs_trans_date ON actual_costs(tenant_id, transaction_date);
CREATE INDEX idx_commitments_project_id ON commitments(tenant_id, project_id);
CREATE INDEX idx_evm_data_project_date ON evm_data(tenant_id, project_id, reporting_date);

CREATE INDEX idx_activities_schedule_id ON activities(tenant_id, schedule_id);
CREATE INDEX idx_activities_wbs_id ON activities(wbs_id);
CREATE INDEX idx_activities_dates ON activities(tenant_id, planned_start, planned_finish);
CREATE INDEX idx_relationships_pred_succ ON relationships(tenant_id, predecessor_id, successor_id);
CREATE INDEX idx_activity_resources_activity ON activity_resources(tenant_id, activity_id);
CREATE INDEX idx_progress_updates_activity_date ON progress_updates(tenant_id, activity_id, cutoff_date);

CREATE INDEX idx_estimates_project_id ON estimates(tenant_id, project_id);
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(tenant_id, estimate_id);
CREATE INDEX idx_tenders_status_deadline ON tenders(tenant_id, status, submission_deadline);
CREATE INDEX idx_tender_items_tender_id ON tender_items(tenant_id, tender_id);
CREATE INDEX idx_bid_packages_tender_id ON bid_packages(tenant_id, tender_id);
CREATE INDEX idx_vendor_bids_package_id ON vendor_bids(tenant_id, bid_package_id);

CREATE INDEX idx_boq_items_project_id ON boq_items(tenant_id, project_id);
CREATE INDEX idx_quantity_tracking_boq_date ON quantity_tracking(tenant_id, boq_item_id, measurement_date);
CREATE INDEX idx_payment_certs_project_ipc ON payment_certs(tenant_id, project_id, ipc_number);
CREATE INDEX idx_ipc_items_payment_cert_id ON ipc_items(tenant_id, payment_cert_id);
CREATE INDEX idx_client_invoices_cert_id ON client_invoices(tenant_id, payment_cert_id);

CREATE INDEX idx_purchase_requests_project_status ON purchase_requests(tenant_id, project_id, status);
CREATE INDEX idx_rfqs_pr_id ON rfqs(tenant_id, pr_id);
CREATE INDEX idx_po_headers_project_vendor ON po_headers(tenant_id, project_id, vendor_id);
CREATE INDEX idx_po_lines_po_id ON po_lines(tenant_id, po_id);
CREATE INDEX idx_deliveries_po_id ON deliveries(tenant_id, po_id);

CREATE INDEX idx_stock_levels_wh_item ON stock_levels(tenant_id, warehouse_id, stock_item_id);
CREATE INDEX idx_stock_movements_item_time ON stock_movements(tenant_id, stock_item_id, movement_timestamp);
CREATE INDEX idx_material_requests_project ON material_requests(tenant_id, project_id);

CREATE INDEX idx_equipment_master_status ON equipment_master(tenant_id, current_status);
CREATE INDEX idx_fuel_logs_equip_date ON fuel_logs(tenant_id, equipment_id, log_date);
CREATE INDEX idx_utilization_logs_equip_date ON utilization_logs(tenant_id, equipment_id, work_date);

CREATE INDEX idx_employees_project_status ON employees(tenant_id, assigned_project_id, employment_status);
CREATE INDEX idx_attendance_emp_date ON attendance(tenant_id, employee_id, attendance_date);
CREATE INDEX idx_payroll_items_run_emp ON payroll_items(tenant_id, payroll_run_id, employee_id);

CREATE INDEX idx_documents_project_category ON documents(tenant_id, project_id, category);
CREATE INDEX idx_document_revisions_doc_id ON document_revisions(tenant_id, document_id);
CREATE INDEX idx_transmittals_project_id ON transmittals(tenant_id, project_id);
CREATE INDEX idx_shop_drawings_project_status ON shop_drawings(tenant_id, project_id, consultant_status);
CREATE INDEX idx_submittals_project_status ON submittals(tenant_id, project_id, status);
CREATE INDEX idx_rfis_project_status ON rfis(tenant_id, project_id, status);

CREATE INDEX idx_contracts_project_party ON contracts(tenant_id, project_id, party_type);
CREATE INDEX idx_variation_orders_contract ON variation_orders(tenant_id, contract_id, status);
CREATE INDEX idx_bonds_contract_expiry ON bonds(tenant_id, contract_id, expiry_date);
CREATE INDEX idx_claims_contract_status ON claims(tenant_id, contract_id, status);

CREATE INDEX idx_claim_register_project ON claim_register(tenant_id, project_id);
CREATE INDEX idx_inspection_requests_project_date ON inspection_requests(tenant_id, project_id, inspection_datetime);
CREATE INDEX idx_ncrs_project_status ON ncrs(tenant_id, project_id, status);
CREATE INDEX idx_punch_items_list_status ON punch_items(tenant_id, punch_list_id, status);

CREATE INDEX idx_incidents_project_severity ON incidents(tenant_id, project_id, severity);
CREATE INDEX idx_ptw_project_dates ON ptw_requests(tenant_id, project_id, valid_from, valid_until);

CREATE INDEX idx_bim_elements_model_ifctype ON bim_elements(tenant_id, model_id, ifc_type);
CREATE INDEX idx_bim_elements_activity_id ON bim_elements(activity_id);
CREATE INDEX idx_bim_elements_boq_item_id ON bim_elements(boq_item_id);

CREATE INDEX idx_opportunities_client_stage ON opportunities(tenant_id, client_id, stage);
CREATE INDEX idx_gl_accounts_number ON gl_accounts(tenant_id, account_number);
CREATE INDEX idx_je_lines_account_je ON je_lines(tenant_id, gl_account_id, journal_entry_id);
CREATE INDEX idx_zatca_invoices_uuid ON zatca_invoices(tenant_id, invoice_uuid);

-- ============================================================================
-- INDEX STRATEGY 02: FULL-TEXT SEARCH & ARABIC TRIGRAM INDEXES (GIN)
-- ============================================================================
CREATE INDEX idx_projects_name_search ON projects USING gin(to_tsvector('arabic', name_ar), to_tsvector('english', name_en));
CREATE INDEX idx_documents_title_search ON documents USING gin(to_tsvector('english', title));
CREATE INDEX idx_boq_desc_search ON boq_items USING gin(to_tsvector('arabic', description_ar), to_tsvector('english', description_en));
CREATE INDEX idx_employees_name_trgm ON employees USING gin(first_name_ar gin_trgm_ops, last_name_ar gin_trgm_ops);

-- ============================================================================
-- INDEX STRATEGY 03: HIGH-PERFORMANCE PGVECTOR HNSW INDEX
-- ============================================================================
CREATE INDEX idx_ai_context_vector_hnsw ON ai_context_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- INDEX STRATEGY 04: BRIN RANGE INDEXES FOR TIME-SERIES PARTITIONS
-- ============================================================================
CREATE INDEX idx_audit_logs_brin_timestamp ON audit_logs USING brin(timestamp);
CREATE INDEX idx_actual_costs_brin_date ON actual_costs USING brin(transaction_date);
CREATE INDEX idx_attendance_brin_date ON attendance USING brin(attendance_date);
CREATE INDEX idx_offline_sync_brin_queued ON offline_sync_queue USING brin(queued_at);
```

---

## PART D: Mermaid Entity-Relationship Diagrams (ERD)

### 1. Enterprise Core & Organizational Relationship Model
```mermaid
erDiagram
    TENANTS ||--o{ ORGANIZATIONS : owns
    TENANTS ||--o{ USERS : registers
    TENANTS ||--o{ ROLES : defines
    USERS ||--o{ TENANT_USERS : assigns
    ROLES ||--o{ TENANT_USERS : authorizes
    ORGANIZATIONS ||--o{ ORGANIZATIONS : sub_branches
    ORGANIZATIONS ||--o{ COST_CENTERS : establishes
    ORGANIZATIONS ||--o{ PROJECTS : executes
    COST_CENTERS ||--o{ PROJECTS : charges
```

### 2. Commercial, Project Management & Engineering Model
```mermaid
erDiagram
    PROJECTS ||--o{ PROJECT_PHASES : divides
    PROJECTS ||--o{ WBS_ITEMS : structures
    PROJECTS ||--o{ MILESTONES : benchmarks
    PROJECTS ||--o{ CONTRACTS : executes
    PROJECTS ||--o{ BUDGETS : limits
    WBS_ITEMS ||--o{ ACTIVITIES : schedules
    ACTIVITIES ||--o{ RELATIONSHIPS : links
    ACTIVITIES ||--o{ PROGRESS_UPDATES : tracks
    PROJECTS ||--o{ BOQ_ITEMS : bills
    BOQ_ITEMS ||--o{ PAYMENT_CERTS : certifies
    PAYMENT_CERTS ||--o{ CLIENT_INVOICES : bills
    CONTRACTS ||--o{ VARIATION_ORDERS : amends
    CONTRACTS ||--o{ CLAIMS : adjudicates
```

### 3. Supply Chain, Site Inventory & Fleet Execution Model
```mermaid
erDiagram
    PROJECTS ||--o{ PURCHASE_REQUESTS : initiates
    PURCHASE_REQUESTS ||--o{ RFQS : tenders
    RFQS ||--o{ QUOTATIONS : receives
    QUOTATIONS ||--o{ PO_HEADERS : awards
    PO_HEADERS ||--o{ PO_LINES : details
    PO_HEADERS ||--o{ DELIVERIES : delivers
    WAREHOUSES ||--o{ STOCK_LEVELS : stores
    STOCK_ITEMS ||--o{ STOCK_LEVELS : stocks
    DELIVERIES ||--o{ STOCK_MOVEMENTS : receives_into
    PROJECTS ||--o{ EQUIPMENT_MASTER : deploys
    EQUIPMENT_MASTER ||--o{ FUEL_LOGS : consumes
    EQUIPMENT_MASTER ||--o{ UTILIZATION_LOGS : operates
```

### 4. QA/QC, Site Safety & Workforce Accommodation Model
```mermaid
erDiagram
    PROJECTS ||--o{ EMPLOYEES : employs
    EMPLOYEES ||--o{ ATTENDANCE : logs
    EMPLOYEES ||--o{ PAYROLL_ITEMS : pays
    EMPLOYEES ||--o{ CAMP_ASSIGNMENTS : accommodates
    CAMP_ROOMS ||--o{ CAMP_ASSIGNMENTS : allocates
    CAMP_FACILITIES ||--o{ CAMP_ROOMS : hosts
    PROJECTS ||--o{ INSPECTION_REQUESTS : inspects
    PROJECTS ||--o{ NCRS : controls
    PROJECTS ||--o{ INCIDENTS : records
    PROJECTS ||--o{ PTW_REQUESTS : permits
```

### 5. Financial Ledger, ZATCA Compliance & AI Engine Model
```mermaid
erDiagram
    GL_ACCOUNTS ||--o{ JE_LINES : records
    JOURNAL_ENTRIES ||--o{ JE_LINES : posts
    CLIENT_INVOICES ||--o{ ZATCA_INVOICES : converts_to
    ZATCA_INVOICES ||--o{ ZATCA_SUBMISSIONS : submits
    ZATCA_INVOICES ||--o{ E_INVOICE_XML : serializes
    PROJECTS ||--o{ BIM_MODELS : authors
    BIM_MODELS ||--o{ BIM_ELEMENTS : instantiates
    BIM_ELEMENTS ||--o{ CLASH_ITEMS : detects
    USERS ||--o{ AI_CONVERSATIONS : consults
    AI_CONVERSATIONS ||--o{ AI_MESSAGES : exchanges
    AI_CONTEXT_EMBEDDINGS ||--o{ AI_CONVERSATIONS : augments_rag
```

---

## PART E: Comprehensive Enterprise Data Dictionary

| # | Table Name | Business Module | Functional Purpose & Scope | Estimated Scale (5 Yrs / 100k Users) | Retention Policy | Partitioning Strategy |
|---|---|---|---|---|---|---|
| 1 | `tenants` | Core Platform | SaaS company registration, subscription plans, root tenant domain | 5,000 rows | Permanent | None |
| 2 | `users` | Core Platform | User authentication, iqama, credentials, preferences | 250,000 rows | Permanent | None |
| 3 | `roles` | Core Platform | RBAC role definitions and JSONB permissions | 50,000 rows | Permanent | None |
| 4 | `tenant_users` | Core Platform | Tenant-user junction and specific permissions override | 500,000 rows | Permanent | None |
| 5 | `organizations` | Core Platform | Multi-company, corporate holding, subsidiary, branch hierarchy | 25,000 rows | Permanent | None |
| 6 | `cost_centers` | Core Platform | Analytic cost accounting nodes and departmental budgeting | 150,000 rows | Permanent | None |
| 7 | `audit_logs` | Core Platform | Immutable regulatory audit logging for all mutations | 500,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 8 | `projects` | Project Mgmt | Enterprise construction project master records | 50,000 rows | 15 Years | None |
| 9 | `project_phases` | Project Mgmt | Milestones and major work stage breakdown | 250,000 rows | 15 Years | None |
| 10 | `wbs_items` | Project Mgmt | Hierarchical work breakdown structure | 5,000,000 rows | 15 Years | None |
| 11 | `milestones` | Project Mgmt | Contractual and critical path benchmark dates | 500,000 rows | 15 Years | None |
| 12 | `baselines` | Project Mgmt | Contractual target snapshots (P6 snapshot imports) | 250,000 rows | 15 Years | None |
| 13 | `deliverables` | Project Mgmt | Tangible milestone deliverables and signoff records | 1,000,000 rows | 15 Years | None |
| 14 | `project_team` | Project Mgmt | Key personnel allocations and responsibilities | 500,000 rows | 15 Years | None |
| 15 | `budgets` | Cost Control | Project cost budgets, management reserves, contingencies | 150,000 rows | 15 Years | None |
| 16 | `budget_lines` | Cost Control | Detailed budget allocations per cost code and WBS | 2,500,000 rows | 15 Years | None |
| 17 | `cost_codes` | Cost Control | CSI MasterFormat / CBS cost code dictionary | 20,000 rows | Permanent | None |
| 18 | `actual_costs` | Cost Control | Real-time project cost accounting ledger | 100,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 19 | `commitments` | Cost Control | Committed purchase orders and subcontracts | 15,000,000 rows | 10 Years | None |
| 20 | `accruals` | Cost Control | Uninvoiced expenses, provisions, and reversals | 10,000,000 rows | 10 Years | None |
| 21 | `forecasts` | Cost Control | Monthly Estimate At Completion (EAC) projections | 5,000,000 rows | 10 Years | None |
| 22 | `evm_data` | Cost Control | Historical CPI/SPI Earned Value snapshots | 1,500,000 rows | 10 Years | None |
| 23 | `schedules` | Planning | CPM schedule network definitions | 100,000 rows | 15 Years | None |
| 24 | `calendars` | Planning | Site work shifts, Saudi holidays, and Ramadan rules | 5,000 rows | Permanent | None |
| 25 | `activities` | Planning | Critical path schedule activity nodes | 25,000,000 rows | 15 Years | None |
| 26 | `relationships` | Planning | CPM precedence ties (FS, SS, FF, SF with lag) | 50,000,000 rows | 15 Years | None |
| 27 | `activity_resources`| Planning | Resource loading (labor, plant, material consumption) | 75,000,000 rows | 15 Years | None |
| 28 | `constraints` | Planning | Early/late CPM schedule boundary constraints | 2,500,000 rows | 15 Years | None |
| 29 | `progress_updates` | Planning | Weekly physical site progress certifications | 50,000,000 rows | 15 Years | None |
| 30 | `rate_library` | Estimation | Standard resource price catalogue | 50,000 rows | Permanent | None |
| 31 | `resource_rates` | Estimation | Regional market cost adjustments across KSA | 200,000 rows | Permanent | None |
| 32 | `estimates` | Estimation | Detailed project bid tender estimates | 100,000 rows | 10 Years | None |
| 33 | `estimate_items` | Estimation | Granular rate build-up and unit price analysis | 15,000,000 rows | 10 Years | None |
| 34 | `overheads` | Estimation | Indirect site management and headquarters overheads | 500,000 rows | 10 Years | None |
| 35 | `markups` | Estimation | Profit margins and contingency risk adjustments | 500,000 rows | 10 Years | None |
| 36 | `tenders` | Tendering | Etimad and private tender opportunities | 50,000 rows | 10 Years | None |
| 37 | `tender_items` | Tendering | Client tender BOQ line items | 10,000,000 rows | 10 Years | None |
| 38 | `bid_packages` | Tendering | Trade sub-packages issued to supply market | 250,000 rows | 10 Years | None |
| 39 | `vendor_bids` | Tendering | Supplier and subcontractor tender quotes | 1,500,000 rows | 10 Years | None |
| 40 | `bid_comparison` | Tendering | Multi-criteria technical & commercial matrices | 250,000 rows | 10 Years | None |
| 41 | `tender_submissions`| Tendering | Official technical & financial tender envelope logs | 100,000 rows | 10 Years | None |
| 42 | `boq_items` | QS & Billing | Client contract Bill of Quantities | 15,000,000 rows | 15 Years | None |
| 43 | `quantity_tracking` | QS & Billing | Daily site measurement sheets and surveyor records | 50,000,000 rows | 15 Years | None |
| 44 | `payment_certs` | QS & Billing | Interim Payment Certificates (IPC 1 to N) | 1,000,000 rows | 15 Years | None |
| 45 | `ipc_items` | QS & Billing | IPC line-level certified quantities and deductions | 30,000,000 rows | 15 Years | None |
| 46 | `client_invoices` | QS & Billing | Commercial tax invoices billed to employer | 1,000,000 rows | 15 Years | None |
| 47 | `purchase_requests` | Procurement | Material and service site purchase requisitions | 10,000,000 rows | 10 Years | None |
| 48 | `rfqs` | Procurement | Requests for quotations sent to vendors | 5,000,000 rows | 10 Years | None |
| 49 | `quotations` | Procurement | Commercial vendor price offerings | 15,000,000 rows | 10 Years | None |
| 50 | `po_headers` | Procurement | Binding purchase orders | 5,000,000 rows | 10 Years | None |
| 51 | `po_lines` | Procurement | Purchase order line details | 25,000,000 rows | 10 Years | None |
| 52 | `deliveries` | Procurement | Material site delivery and GRN notes | 15,000,000 rows | 10 Years | None |
| 53 | `delivery_items` | Procurement | Line item acceptance and QC testing logs | 45,000,000 rows | 10 Years | None |
| 54 | `warehouses` | Inventory | Site laydown yards and central warehouses | 10,000 rows | Permanent | None |
| 55 | `stock_items` | Inventory | Master inventory material sku catalogue | 500,000 rows | Permanent | None |
| 56 | `stock_levels` | Inventory | Current on-hand quantities per warehouse bin | 2,500,000 rows | Permanent | None |
| 57 | `material_requests` | Inventory | Store issue requisitions from site engineers | 20,000,000 rows | 10 Years | None |
| 58 | `mr_items` | Inventory | Line item material issue requests | 60,000,000 rows | 10 Years | None |
| 59 | `stock_movements` | Inventory | Ledger of receipts, issues, transfers, and scrap | 120,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 60 | `equipment_master` | Equipment | Heavy plant, mobile cranes, and vehicle master | 100,000 rows | 15 Years | None |
| 61 | `fuel_logs` | Equipment | Site diesel bowser fueling events | 25,000,000 rows | 7 Years | Range Partitioned (Monthly) |
| 62 | `utilization_logs` | Equipment | Daily machine hours and breakdown monitoring | 50,000,000 rows | 7 Years | Range Partitioned (Monthly) |
| 63 | `maintenance_orders`| Equipment | Workshop preventive and corrective work orders | 2,500,000 rows | 10 Years | None |
| 64 | `breakdowns` | Equipment | Site failure reports and mechanical delays | 500,000 rows | 10 Years | None |
| 65 | `rental_agreements` | Equipment | External equipment supplier lease contracts | 250,000 rows | 10 Years | None |
| 66 | `designations` | HR / Payroll | Job title classifications and grade ladders | 5,000 rows | Permanent | None |
| 67 | `employees` | HR / Payroll | Workforce records, Iqamas, GOSI, Qiwa parameters | 250,000 rows | 15 Years | None |
| 68 | `attendance` | HR / Payroll | Daily turnstile biometric attendance punches | 300,000,000 rows | 7 Years | Range Partitioned (Monthly) |
| 69 | `payroll_runs` | HR / Payroll | Monthly payroll batches and WPS generation | 150,000 rows | 10 Years | None |
| 70 | `payroll_items` | HR / Payroll | Individual employee payslips and GOSI deductions | 15,000,000 rows | 10 Years | None |
| 71 | `leave_requests` | HR / Payroll | Vacation, sick leave, and exit-reentry visas | 2,500,000 rows | 10 Years | None |
| 72 | `camp_assignments` | HR / Payroll | Worker labor camp room allocations | 1,000,000 rows | 10 Years | None |
| 73 | `documents` | EDMS | Project drawings, specifications, specifications | 15,000,000 rows | 15 Years | None |
| 74 | `document_revisions`| EDMS | File metadata, revisions, and storage SHA256 hashes | 45,000,000 rows | 15 Years | None |
| 75 | `transmittals` | EDMS | Formal drawing/document transmittals | 2,500,000 rows | 15 Years | None |
| 76 | `transmittal_items` | EDMS | Transmittal document item manifest | 10,000,000 rows | 15 Years | None |
| 77 | `review_cycles` | EDMS | Consultant document review workflows | 15,000,000 rows | 15 Years | None |
| 78 | `review_comments` | EDMS | PDF canvas markup annotations and responses | 45,000,000 rows | 15 Years | None |
| 79 | `shop_drawings` | Technical Office | Engineering shop drawing submissions | 5,000,000 rows | 15 Years | None |
| 80 | `submittals` | Technical Office | Material approval requests (MAR) | 2,500,000 rows | 15 Years | None |
| 81 | `rfis` | Technical Office | Requests for information to supervising consultant | 1,500,000 rows | 15 Years | None |
| 82 | `technical_queries` | Technical Office | Internal site engineering queries | 1,000,000 rows | 15 Years | None |
| 83 | `engineering_reviews`| Technical Office | 30/60/90% design reviews and value engineering | 250,000 rows | 15 Years | None |
| 84 | `contracts` | Commercial | FIDIC prime contracts and trade subcontracts | 250,000 rows | 15 Years | None |
| 85 | `contract_lines` | Commercial | Scope items and payment milestones | 1,500,000 rows | 15 Years | None |
| 86 | `variation_orders` | Commercial | Variation orders and scope amendments | 750,000 rows | 15 Years | None |
| 87 | `eot_requests` | Commercial | Extension of time claims under FIDIC 8.4 | 250,000 rows | 15 Years | None |
| 88 | `bonds` | Commercial | Bank guarantees, performance and advance bonds | 500,000 rows | 15 Years | None |
| 89 | `insurance` | Commercial | CAR, CPM, and workmen compensation policies | 250,000 rows | 15 Years | None |
| 90 | `claims` | Commercial | Formal commercial claims and arbitration files | 100,000 rows | 15 Years | None |
| 91 | `claim_register` | Claims Mgmt | Master dispute register under FIDIC 20.1 | 50,000 rows | 15 Years | None |
| 92 | `claim_events` | Claims Mgmt | Contemporaneous record timeline of delays | 500,000 rows | 15 Years | None |
| 93 | `claim_evidence` | Claims Mgmt | Evidence files, weather reports, and instructions | 1,000,000 rows | 15 Years | None |
| 94 | `delay_analysis` | Claims Mgmt | Time impact analysis (TIA) and critical path runs | 100,000 rows | 15 Years | None |
| 95 | `eot_calculations` | Claims Mgmt | Prolongation costs, Hudson/Eichleay formula claims | 100,000 rows | 15 Years | None |
| 96 | `itps` | QA/QC | Inspection and Test Plans | 100,000 rows | 15 Years | None |
| 97 | `itp_items` | QA/QC | Specific hold/witness/surveillance inspection points | 1,000,000 rows | 15 Years | None |
| 98 | `inspection_requests`| QA/QC | Work & Material Inspection Requests (WIR / MIR) | 25,000,000 rows | 15 Years | None |
| 99 | `ncrs` | QA/QC | Non-conformance reports and corrective actions | 1,500,000 rows | 15 Years | None |
| 100 | `cars` | QA/QC | Systemic Corrective Action Requests | 250,000 rows | 15 Years | None |
| 101 | `punch_lists` | QA/QC | Building zone handover defect lists | 250,000 rows | 10 Years | None |
| 102 | `punch_items` | QA/QC | Granular snagging items with photo evidence | 5,000,000 rows | 10 Years | None |
| 103 | `incidents` | HSE | OSHA reportable safety and environmental events | 100,000 rows | 20 Years | None |
| 104 | `near_misses` | HSE | Leading safety indicator hazard observations | 1,500,000 rows | 10 Years | None |
| 105 | `risk_assessments` | HSE | Activity hazard analyses and risk matrices | 250,000 rows | 15 Years | None |
| 106 | `ptw_requests` | HSE | Permits to work (hot work, confined space, etc.) | 5,000,000 rows | 10 Years | None |
| 107 | `toolbox_talks` | HSE | Daily pre-shift safety briefings | 5,000,000 rows | 7 Years | None |
| 108 | `hse_training` | HSE | Mandatory site safety certifications | 2,500,000 rows | 10 Years | None |
| 109 | `bim_models` | BIM / VDC | IFC and Revit federated model versions | 100,000 rows | 15 Years | None |
| 110 | `bim_elements` | BIM / VDC | Granular IFC components linked to 4D/5D | 50,000,000 rows | 15 Years | None |
| 111 | `clash_reports` | BIM / VDC | Automated geometric clash detection runs | 250,000 rows | 10 Years | None |
| 112 | `clash_items` | BIM / VDC | BCF clash issues and spatial coordinates | 10,000,000 rows | 10 Years | None |
| 113 | `quantity_extractions`| BIM / VDC | Automated model quantity takeoffs (QTO) | 5,000,000 rows | 10 Years | None |
| 114 | `leads` | CRM | Prospective development projects and tenders | 250,000 rows | 10 Years | None |
| 115 | `clients` | CRM | Employer organizations and government authorities | 50,000 rows | Permanent | None |
| 116 | `opportunities` | CRM | Active sales and bid pipeline | 150,000 rows | 10 Years | None |
| 117 | `contacts` | CRM | Executive client stakeholder directory | 250,000 rows | Permanent | None |
| 118 | `activities_crm` | CRM | Client meetings, presentations, and correspondence | 1,500,000 rows | 7 Years | None |
| 119 | `portfolios` | PMO | Corporate strategic investment portfolios | 5,000 rows | Permanent | None |
| 120 | `programs` | PMO | Grouped project programs | 25,000 rows | Permanent | None |
| 121 | `portfolio_projects`| PMO | Program-to-project allocation weights | 100,000 rows | Permanent | None |
| 122 | `kpi_definitions` | PMO | Executive KPI thresholds and formula targets | 2,500 rows | Permanent | None |
| 123 | `kpi_values` | PMO | Historical KPI score timeseries | 10,000,000 rows | 10 Years | None |
| 124 | `gl_accounts` | Finance | SOCPA compliant Chart of Accounts | 50,000 rows | Permanent | None |
| 125 | `journal_entries` | Finance | General ledger journal voucher headers | 20,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 126 | `je_lines` | Finance | Double-entry debit/credit ledger lines | 80,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 127 | `ap_invoices` | Finance | Supplier and subcontractor accounts payable | 10,000,000 rows | 10 Years | None |
| 128 | `ar_invoices` | Finance | Certified client billing receivables | 2,500,000 rows | 10 Years | None |
| 129 | `payment_vouchers` | Finance | Corporate bank disbursements | 5,000,000 rows | 10 Years | None |
| 130 | `bank_accounts` | Finance | Corporate multi-currency treasury accounts | 5,000 rows | Permanent | None |
| 131 | `cash_flows` | Finance | Periodic liquidity forecasts and actuals | 1,000,000 rows | 10 Years | None |
| 132 | `zatca_invoices` | ZATCA Phase 2 | Phase 2 XML/PDF A3 compliant invoices | 5,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 133 | `zatca_submissions` | ZATCA Phase 2 | ZATCA Fatoora API transmission audit logs | 10,000,000 rows | 10 Years | Range Partitioned (Monthly) |
| 134 | `e_invoice_xml` | ZATCA Phase 2 | Signed UBL 2.1 XML documents | 5,000,000 rows | 10 Years | None |
| 135 | `camp_facilities` | Camp Mgmt | Remote site camp locations and amenities | 2,500 rows | Permanent | None |
| 136 | `camp_rooms` | Camp Mgmt | Accommodation rooms and capacities | 50,000 rows | Permanent | None |
| 137 | `room_assignments` | Camp Mgmt | Worker check-in, keycards, and billeting history | 2,500,000 rows | 10 Years | None |
| 138 | `offline_sync_queue`| Mobile Field | Edge device mutation synchronization buffer | 150,000,000 rows | 1 Year | Range Partitioned (Monthly) |
| 139 | `device_registrations`| Mobile Field| Enrolled tablets, rugged phones, and push tokens | 500,000 rows | 3 Years | None |
| 140 | `push_notifications`| Mobile Field| Automated critical alerts and dispatch notices | 50,000,000 rows | 1 Year | None |
| 141 | `ai_conversations` | AI Copilot | User chat sessions with specialized ERP agents | 25,000,000 rows | 5 Years | None |
| 142 | `ai_messages` | AI Copilot | Individual prompts, responses, and token stats | 150,000,000 rows | 5 Years | None |
| 143 | `ai_context_embeddings`| AI Copilot | 1536-dim vector embeddings of construction data | 50,000,000 rows | 5 Years | None |
| 144 | `ai_actions_log` | AI Copilot | Autonomous agent action execution audit trail | 10,000,000 rows | 5 Years | None |

---

## 3. Database Maintenance, Backup & Disaster Recovery

### Automated Partition Management
All high-volume transaction tables (`actual_costs`, `attendance`, `stock_movements`, `audit_logs`, `offline_sync_queue`, `journal_entries`, `je_lines`, `zatca_submissions`) utilize **PostgreSQL 16 native declarative range partitioning by month**, dynamically orchestrated via the `pg_partman` background worker:

```sql
-- pg_partman automated partition maintenance configuration example
SELECT partman.create_parent(
    p_parent_table => 'public.actual_costs',
    p_control => 'transaction_date',
    p_type => 'native',
    p_interval => 'monthly',
    p_premake => 3
);
```

### High Availability & Disaster Recovery
- **Replication Architecture:** PostgreSQL 16 Physical Streaming Replication with 1 Synchronous Standby for zero data loss (RPO = 0) and 2 Asynchronous Read Replicas serving reporting and analytics queries.
- **Continuous Archiving:** Write-Ahead Logging (WAL) streaming directly to immutable S3-compatible cloud object storage with point-in-time recovery (PITR) up to 35 days.
- **RTO / RPO Objectives:**
  - **Recovery Point Objective (RPO):** < 1 second.
  - **Recovery Time Objective (RTO):** < 30 seconds (Automated failover using Patroni with etcd consensus).
""")

print("Successfully written schema document.")
EOF
