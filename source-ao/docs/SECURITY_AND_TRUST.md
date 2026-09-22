# Source AO — Security & Trust Baseline

## Data classes

### Public
- supplier/company name;
- business location;
- public business website;
- category/specialty;
- reviewed verification status;
- verification time/freshness window;
- public opportunity source.

### Internal
- operator notes;
- verification queue;
- response history;
- supplier outreach history;
- evidence references;
- sourcing-request metadata.

### Restricted
- screenshots of private conversations;
- non-public phone numbers;
- private email threads;
- documents received from suppliers;
- customer identity/contact data;
- pricing negotiated privately;
- internal commercial margins.

Restricted data must never be committed to a public GitHub repository.

## Principle of least exposure
The public interface receives only what is required to make a sourcing decision. Evidence stays private; the UI displays the resulting status and timestamp, not the underlying private conversation.

Requester contact data is encrypted before storage. Public tracking responses do not include requester contact, internal notes or private supplier evidence.

## Verification integrity
- Status upgrades require a human reviewer.
- Evidence reference is mandatory for direct confirmation.
- Historical observations are immutable; corrections create a new observation.
- Expired confirmations remain in history but are downgraded for current display.
- Supplier responses are one-shot and cannot silently overwrite an earlier response.
- Conflicting supplier responses block a positive current-status claim until resolved.

## API hardening
- Public and private API routes have route-specific rate limits.
- Rate limiting stores an HMAC-pseudonymized client identifier, not the raw client address.
- Rate-limit windows are removed after 48 hours by scheduled maintenance.
- Responses include request IDs and browser security headers.
- Application request logs include route, method, status, timing, environment and release only.
- Request bodies, search query strings, requester contacts, confirmation tokens and tracking tokens are not written to normal request logs.
- In staging/production, the API fails closed when rate-limit security configuration is missing.

## Readiness
`GET /health` only proves that the Worker process responds.

`GET /ready` is the deployment gate. It requires:
- D1 binding;
- strong admin/confirmation/PII/rate-limit secrets;
- HTTPS public origin;
- valid contact-retention window;
- rate-limit database schema;
- requester-contact purge schema.

Production readiness does not disclose the names of missing protected configuration values.

## Secrets
- Secrets stay in the provider/GitHub protected secret store.
- No real secret value belongs in repository files, HTML, browser storage or exports.
- Staging deployment requires protected secrets of at least 32 characters for admin, confirmation, PII encryption and rate limiting.
- Administrative browser sessions keep the token in memory only.

## Supplier response links
Supplier confirmation links:
- use signed, short-lived tokens;
- are scoped to one verification request;
- expire automatically;
- prevent editing after submission;
- never expose customer identity by default.

## Search and AI
AI may:
- normalise spelling;
- identify aliases;
- classify categories;
- extract structured fields from supplier responses;
- detect contradictions;
- rank candidate suppliers.

AI may not:
- invent suppliers;
- infer stock from a general catalogue;
- mark a supplier as confirmed without reviewed evidence;
- create a current price from an old listing;
- silently merge conflicting identities.

## Data retention
Current enforced controls:
- rate-limit windows: 48 hours;
- supplier verification requests: unanswered expired requests are marked `expired` automatically;
- completed/closed sourcing requests: direct requester contact is purged after the configured retention period while non-identifying demand data remains;
- staging contact retention: 30 days for lifecycle testing;
- current production baseline: 365 days, subject to final launch review.

See `DATA_RETENTION.md` for the production launch gate.

## Scheduled maintenance
A daily Worker cron:
1. expires unanswered supplier verification requests;
2. deletes old rate-limit windows;
3. purges direct requester contact from eligible completed/closed sourcing requests.

## Incident rule
If a public result is proven wrong or stale:
1. downgrade immediately to `needs_reconfirmation` or `unavailable`;
2. preserve the audit record;
3. correct the source mapping;
4. review whether similar records share the same faulty source;
5. do not hide the failure by overwriting history.
