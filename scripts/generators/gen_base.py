# -*- coding: utf-8 -*-
"""
MimarERP v7 API Design Document Generator
"""
import sys
import os

OUT_FILE = r"d:\ERP sys\docs\architecture\03-api-design.md"

def build_api_document():
    parts = []

    # ----------------------------------------------------
    # SECTION 1: API STANDARDS
    # ----------------------------------------------------
    parts.append("""# MimarERP v7 — Enterprise Construction ERP: REST API Specification
**Document Reference:** `MIMAR-SPEC-API-003`  
**Version:** `1.0.0-PROD`  
**Classification:** Enterprise Architecture / Restricted  
**Applicability:** Monorepo Backend Microservices, Web SPA Frontend, Mobile Client (Flutter/Offline-first), External ERP Adapters (Primavera P6, Autodesk ACC, SAP, Procore), ZATCA Fatoora Platform.

---

## 1. Enterprise API Architecture & Global Standards

The MimarERP v7 API is designed from first principles for Tier-1 mega-construction projects, engineering contractors, and project management offices (PMOs) operating in the Kingdom of Saudi Arabia and the GCC region. It provides resilient, high-speed, and secure access across multi-company structures, joint ventures, and deep supply-chain tiers.

### 1.1 Base URLs and Protocols
- **Production Public Gateway:** `https://api.mimar.sa/api/v1`
- **Sandbox / Testing Gateway:** `https://sandbox-api.mimar.sa/api/v1`
- **Internal Service Mesh (Envoy/mTLS):** `http://mesh-gateway.internal/api/v1`
- **Protocol Enforcement:** HTTP/2 over TLS 1.3 is strictly enforced on all public ingress points. Legacy TLS versions (< 1.3) and plain HTTP are terminated immediately at Cloudflare Edge WAF.

### 1.2 Authentication & Token Lifecycles
MimarERP v7 uses standard OAuth 2.0 / OpenID Connect with JWT bearer authentication:
1. **Access Tokens (JWT):**
   - **Lifespan:** 15 minutes.
   - **Algorithm:** Asymmetric RS256 (2048-bit RSA) or Ed25519; keys rotated weekly and served via `/.well-known/jwks.json`.
   - **Token Claims:**
     ```json
     {
       "iss": "https://auth.mimar.sa",
       "sub": "usr_99d023a1-4328-4f11-9a76-90fba8c011e2",
       "tenant_id": "ten_7a82b012-3294-4d83-9b88-129039fbc811",
       "org_id": "org_55102048-9182-4f77-aa11-8820491029ab",
       "email": "ahmed.mansour@alrashid-contracting.sa",
       "roles": ["project_manager", "cost_engineer"],
       "permissions": [
         "projects:read", "projects:update", "boq:read", "boq:certify",
         "ipcs:create", "cost:read", "rfis:approve"
       ],
       "exp": 1763664000,
       "iat": 1763663100,
       "jti": "tok_01JG8X97N5D0W0N0K2T9A7C1P4"
     }
     ```
2. **Refresh Tokens:**
   - **Lifespan:** 7 days sliding window; maximum absolute lifetime of 30 days.
   - **Rotation:** Strict Refresh Token Rotation (RTR). Every refresh issuance invalidates the previous token. A reused refresh token triggers instant session revocation across the entire tenant user tree in Redis.
3. **Session Revocation:**
   - Real-time revocation via Redis Pub/Sub broadcast across all API Gateway worker nodes.

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InByb2QtMjAyNi0xMSJ9...
```

### 1.3 Multi-Tenant Isolation & Header Specification
Every API call must be strictly bound to a tenant:
- **Mandatory Request Header:**
  ```http
  X-Tenant-ID: 7a82b012-3294-4d83-9b88-129039fbc811
  ```
- **Validation Rule:** The API Gateway validates that `X-Tenant-ID` matches the `tenant_id` claim in the verified JWT.
- **Cross-Tenant Delegation:** Group executives and JV auditors accessing multiple tenant spaces must explicitly switch context via `/auth/switch-tenant` to receive a scoped JWT.
- **Database Search Path:** Node.js backend services enforce tenant context at the PostgreSQL connection pool level:
  `SET LOCAL search_path = tenant_7a82b012, public;` and enforce PostgreSQL Row-Level Security (RLS).

### 1.4 Standard Request & Response Envelopes
To guarantee uniform parsing across Vanilla JS SPA, Native Mobile clients, and external enterprise ESB integrations, every endpoint returns the standardized Mimar response envelope.

#### Standard Success Response (`HTTP 200 OK / HTTP 201 Created`)
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-20T18:45:00.120Z",
    "requestId": "req_01JG8X97N5D0W0N0K2T9A7C1P4",
    "version": "1.0.0",
    "executionTimeMs": 24.8,
    "tenantId": "7a82b012-3294-4d83-9b88-129039fbc811"
  },
  "errors": null,
  "pagination": null
}
```

#### Standard Paginated Collection Response (`HTTP 200 OK`)
```json
{
  "data": [ ... ],
  "meta": {
    "timestamp": "2026-11-20T18:45:00.120Z",
    "requestId": "req_01JG8X97N5D0W0N0K2T9A7C1P4",
    "version": "1.0.0",
    "executionTimeMs": 38.2
  },
  "errors": null,
  "pagination": {
    "limit": 50,
    "hasMore": true,
    "cursor": "eyJpZCI6ImFjdF8wMUpHOFhZIiwidGltZXN0YW1wIjoxNzAwMDAwMDAwfQ==",
    "nextCursor": "eyJpZCI6ImFjdF8wMUpHOFhaIiwidGltZXN0YW1wIjoxNzAwMDAxMjAwfQ==",
    "totalCount": 1845
  }
}
```

#### Standard Error Response (`HTTP 4xx / 5xx`)
```json
{
  "data": null,
  "meta": {
    "timestamp": "2026-11-20T18:45:00.120Z",
    "requestId": "req_01JG8X97N5D0W0N0K2T9A7C1P4",
    "version": "1.0.0"
  },
  "errors": [
    {
      "code": "E_BUDGET_OVERRUN",
      "message": "Commitment of SAR 450,000 exceeds available budget for Cost Code 03-3100 (Concrete Formwork).",
      "field": "lineItems[2].unitPrice",
      "details": {
        "costCode": "03-3100",
        "currentBudget": 1200000.00,
        "committedToDate": 832500.00,
        "requestedAmount": 450000.00,
        "exceededBy": 82500.00,
        "currency": "SAR"
      },
      "helpUrl": "https://docs.mimar.sa/errors/E_BUDGET_OVERRUN"
    }
  ],
  "pagination": null
}
```

### 1.5 Rate Limiting & Abuse Prevention
Rate limits are strictly tracked via Redis distributed token buckets:
- **Tenant Limit:** 1,000 requests / minute (Burst: 2,000 requests)
- **User Limit:** 100 requests / minute (Burst: 250 requests)
- **Public Auth Endpoints:** 20 requests / minute per IP (Burst: 40 requests)
- **High-Throughput Mobile/IoT Sync:** 3,000 requests / minute
- **Headers Returned:**
  ```http
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 984
  X-RateLimit-Reset: 1763664060
  Retry-After: 30
  ```

### 1.6 Pagination Architecture
Large datasets (BOQs with 50,000 items, daily labor logs, ledger transactions) enforce **opaque cursor-based pagination** using indexed compound tuples `(created_at, id)` base64-encoded.
- Query Parameters: `?limit=50&cursor=ey...`
- Deterministic ordering prevents duplicated or skipped items during concurrent writes.

### 1.7 Idempotency & Financial Safety
All mutating financial endpoints (Invoicing, Subcontractor IPCs, Journal Entries, Material POs) require the client to supply an idempotency key:
```http
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```
The gateway caches identical requests for 24 hours in Redis; replayed requests return the original payload with header `X-Cache-Lookup: HIT`.

---
""")

    # ----------------------------------------------------
    # SECTION 2: FULL API ENDPOINT SPECS FOR ALL 25 MODULES
    # ----------------------------------------------------
    parts.append("""## 2. Comprehensive Endpoint Specifications (All 25 Modules)

Every endpoint below is fully documented with HTTP Method, Path, Business Logic, Request Payload Schema, Response Body Schema, Required RBAC Permissions, and Error Status Codes.

---
""")

    # We will append specs for modules 1 through 25
    return parts

if __name__ == "__main__":
    print("Base initialized")
