# Source AO

Source AO is an HMATIAS sourcing and commercial-verification product for Angola.

**Positioning:** Search. Verify. Source.

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
- current production requester-contact baseline: 365 days, subject to final launch review;
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
- provider log retention is configured;
- D1 export/rollback path is rehearsed;
- mobile and desktop acceptance review passes;
- Privacy and Terms are finalized;
- the branch is synchronized with then-current `main` and all gates are rerun.

The HMATIAS production site must remain independently operational if Source AO is disabled.
