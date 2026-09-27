# Source AO

Source AO is an Angola-first HMATIAS sourcing and commercial-verification product with controlled Southern Africa market coverage.

**Positioning:** Search. Verify. Source.

## Market coverage

Source AO separates **commercial opportunity intelligence** from **material sourcing**:

- **Angola (`AO`, AOA)** — the only market used by the Opportunity Radar for tenders, RFQs, facilities, construction and commercial opportunities;
- **Namibia (`NA`, NAD)** — material and equipment sourcing market used when the Angolan market has scarcity, weak availability or an unattractive supply option;
- **South Africa (`ZA`, ZAR)** — material and equipment sourcing market used for the same cross-border supply purpose.

Namibia and South Africa are **not foreign tender/opportunity markets for HMATIAS** in the current product scope. Foreign-market records must be treated as supplier/material discovery only, followed by stock, specification, price, lead-time, logistics, customs and landed-cost verification.

See `docs/MARKETS.md`.

## Core rule

Finding a supplier, catalogue page or social-media post is not the same as confirming availability. Source AO keeps discovery, supplier confirmation and current stock confirmation as separate states.

## Public experience

The public interface is intentionally simple:
- search materials, equipment or services;
- see a transparent verification state and freshness;
- activate Radar when current evidence is weak;
- submit a sourcing request;
- track that request privately without exposing requester contact data.

## Verification lifecycle

`Search → Radar → Supplier confirmation → HMATIAS human review → Verified observation → Expiry → Reconfirmation`

Approved public verification exposes only safe provenance: supplier, verification method, timestamp and expiry. Private evidence references are not public.

## Operational layers

- Materials / Services search
- Opportunity Radar
- Supplier Confirmation Network
- Verification Desk
- Human Review Desk
- Sourcing Desk
- Demand Radar
- private request tracking

Internal desks are not included in the public staging bundle.

## Backend

Cloudflare Worker + D1, with:
- requester contact encrypted using AES-GCM;
- private access-token hashes stored instead of raw tracking tokens;
- signed expiring supplier confirmation links;
- one-shot supplier responses;
- human approval before a response can become public;
- route-specific rate limiting using HMAC-pseudonymized client identifiers;
- `/health` and fail-closed `/ready` endpoints;
- sanitized request logs without query text, contacts, bodies or private tokens;
- daily maintenance for expired verification requests, old rate-limit windows and eligible requester-contact purging.

## Retention baseline

- rate-limit windows: 48 hours;
- staging requester-contact retention: 30 days for lifecycle testing;
- production requester-contact retention: 180 days after a request is completed or closed;
- Source AO v1 does not accept private evidence attachments.

See `docs/DATA_RETENTION.md`, `docs/EVIDENCE_POLICY.md`, and `docs/SECURITY_AND_TRUST.md`.

## Staging

Staging uses separate resources:
- API Worker: `source-ao-api-staging`;
- frontend Static Assets Worker: `source-ao-web-staging`;
- D1 database: `source-ao-staging`.

The manual staging workflow requires exact `DEPLOY-STAGING` confirmation and provider-side protected values. It runs QA, migrations, a private temporary D1 export test, API deploy, API smoke test, allowlisted frontend build/deploy, web-isolation smoke test, and optionally the synthetic end-to-end pilot.

The staging frontend is `noindex`, ships `robots.txt` with `Disallow: /`, and does not publish backend source, technical docs or internal desks.

## Synthetic pilot

The pilot covers:
1. test item creation;
2. verification request;
3. signed supplier link;
4. synthetic supplier response;
5. HMATIAS approval simulation;
6. verified public search state;
7. synthetic sourcing request;
8. private tracking without PII exposure;
9. authenticated recovery of encrypted synthetic contact;
10. request closure.

No synthetic result is a real commercial claim.

## Production gate

Do not merge/publish Source AO v1 until:
- current branch CI is green;
- real staging `/ready`, API smoke and web smoke pass;
- supplier-confirmation and sourcing pilots pass;
- contact purge is exercised in staging;
- Workers Logs are enabled with short provider-managed retention;
- D1 export/rollback path is rehearsed;
- mobile and desktop acceptance review passes;
- Privacy and Terms are finalized and production-indexable while staging rewrites them to noindex;
- the branch is synchronized with then-current `main` and all gates are rerun.

The HMATIAS production site must remain independently operational if Source AO is disabled.

## Catalogue quotation request

`rfq.html` loads product families directly from `data/catalog.json`. Public Supply category links preselect the exact catalogue item. Requests support up to 20 lines with quantities, units and specifications, delivery to Angola, purchasing intent, alternatives and an optional AOA budget.

The existing sourcing API accepts the versioned RFQ contract while preserving legacy requests. The complete customer profile and item list are encrypted with the existing PII key. An unpredictable browser-generated retry token is hashed for atomic deduplication and private tracking; no drafts or private tokens are saved in browser storage. Contact and full RFQ data follow the 180-day closed/completed retention schedule.

The authenticated Sourcing Desk displays qualification and supports adjudication, purchasing and delivery states. Operators remain responsible for supplier selection, confirmed cost, margin, proposal, purchase and profit accounting; none of these actions or values is automatic or public.


## Private commercial case

Authenticated sourcing operations can attach a private commercial case to a customer request. The workflow is deliberately explicit:

`request → qualification → private supplier → confirmed cost → landed cost → HMATIAS sale price → gross profit/margin → proposal`

Supplier cost options are stored separately from the public request. Material cost, transport, customs, taxes/fees, other costs, contingency and FX-to-AOA are entered by an authenticated operator; the system does not invent missing prices, FX, duties or logistics. Foreign-currency options can remain drafts without an FX rate, but cannot become verified/selected until the FX rate is supplied.

Gross profit and gross margin are calculated only when a selected verified cost and an explicit AOA sale price exist. A proposal cannot move to ready/sent/revised/accepted until the request is qualified and those inputs are complete. All commercial-case endpoints are admin-only and are never exposed through public request tracking.


## Proposal pack

A qualified commercial case can prepare an internal customer-facing proposal summary only after the operator explicitly records a proposal reference, validity period, payment terms, delivery terms and tax treatment. The proposal pack reuses the encrypted RFQ line items but deliberately excludes the selected supplier, supplier quote, landed cost, internal profit and gross margin.

The proposal preview is still an operational draft: SOURCE AO does not send it automatically, create invoices, award purchases or claim stock/lead time that has not been confirmed. Operators must review the scope and commercial conditions before issuing any proposal to a customer.
