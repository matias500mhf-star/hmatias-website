# Source AO — API Contract v0.1

The public interface must never depend directly on raw supplier evidence. A backend/API layer will expose only reviewed commercial fields.

## Core resources

### POST /v1/search
Input:
```json
{
  "query": "PVC pipe 110 mm",
  "location": "Luanda",
  "language": "en"
}
```
Output:
```json
{
  "query_id": "qry_...",
  "category": "construction",
  "results": [],
  "verification_summary": {
    "confirmed": 0,
    "needs_reconfirmation": 0,
    "discovered": 0
  }
}
```
Rules:
- no raw private notes;
- no current availability without timestamp;
- expired confirmation is downgraded before response.

### POST /v1/radar-watches
Creates a persistent material/service watch.

Required:
- normalized query;
- location;
- optional specification/quantity;
- requester/session reference.

### GET /v1/radar-watches/{id}
Returns current watch status and reviewed matches only.

### POST /v1/sourcing-requests
Creates a commercial sourcing request.

Required:
- item/service;
- location;
- requester contact consent.

Optional:
- specification;
- quantity;
- unit;
- urgency;
- delivery deadline.

### POST /v1/verification-requests
Internal/authorised endpoint.
Creates supplier confirmation work.

Required:
- supplier_id;
- item/service;
- location;
- operator identity.

### POST /v1/supplier-confirmations
Internal or signed supplier endpoint.
A response cannot become public until human review.

Required:
- verification request ID;
- supplier identity;
- confirmation status;
- channel/source;
- timestamp;
- evidence reference.

### POST /v1/supplier-confirmations/{id}/review
Human-only action.
Actions:
- approve;
- reject;
- request clarification.

Approval creates or updates an immutable market observation.

### GET /v1/opportunities
Returns only active opportunities with traceable source and valid deadline.

Filters:
- type;
- sector;
- location;
- deadline;
- fit.

## Trust response fields
Every market result that is more than discovery should expose:
```json
{
  "verification_status": "supplier_confirmed",
  "verified_at": "2026-09-22T16:30:00Z",
  "valid_until": "2026-09-23T16:30:00Z",
  "source_class": "direct_supplier_confirmation"
}
```

## Authentication model
Public:
- search;
- public results;
- sourcing request;
- public opportunity radar.

Authenticated operator:
- supplier records;
- verification queue;
- evidence review;
- market observations;
- opportunity ingestion.

Supplier-signed/limited token:
- respond only to a specific verification request;
- cannot edit historical confirmations;
- cannot change another supplier's records.

## Non-negotiable backend rules
1. AI cannot approve verification status.
2. Every status upgrade is auditable.
3. Confirmation timestamps are immutable.
4. Evidence is private by default.
5. Public data is minimised.
6. Expiry is computed server-side, not trusted from the browser.
7. Price without currency is invalid.
8. Stock confirmation without quantity and validity is invalid.
