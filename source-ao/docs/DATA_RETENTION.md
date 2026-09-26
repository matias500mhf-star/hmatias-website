# Source AO — Data Retention Baseline

Status: production-ready baseline for Source AO v1.

## Principles
- Keep only the data required to fulfil sourcing, verification, security and audit needs.
- Separate public commercial facts from private evidence and requester contact data.
- Expiry of a commercial confirmation is not the same as deletion of its audit record.
- Do not retain raw client IP addresses for rate limiting.
- Do not put restricted evidence or contacts in the public GitHub repository.

## Enforced rules

### Requester contact data
- Direct contact is encrypted at intake.
- While a sourcing request is active, the contact remains available to authorized HMATIAS operators.
- After a request is marked completed or closed, daily maintenance purges the encrypted contact and masked hint after the configured retention window.
- Production retention for direct requester contact: **180 days after completion/closure**.
- Staging retention: **30 days** so deletion can be exercised safely.
- Non-identifying request fields may remain for aggregate Demand Radar analysis.
- The staging purge drill has been exercised successfully against real staging D1.

### Rate-limit windows
- Storage: D1 rate_limit_windows.
- Identifier: HMAC-pseudonymized client address; raw address is not stored by Source AO.
- Retention: **48 hours**.
- Enforcement: daily Worker maintenance deletes older rows.

### Supplier confirmation links
- Link validity: **48 hours** when a verification request is created.
- Open unanswered requests are marked expired by daily maintenance after their deadline.
- Submitted supplier responses are one-shot and cannot silently overwrite an earlier response.

### Commercial observations
- Current availability expires according to the verification window.
- Expired observations remain audit history but the public engine downgrades them to needs_reconfirmation.
- A historical observation is not a current stock claim.

### Private evidence
Source AO v1 does not accept screenshots, PDFs, photos, email files, chat exports or other private evidence attachments through its public, supplier or internal API. Any document that must be preserved for a contract or dispute belongs in an authorized business document system outside the Source AO v1 attachment surface.

### Application and infrastructure logs
- Application logs contain request ID, method, route, status, timing, environment and release only.
- Search text, requester contact, request bodies, confirmation tokens and tracking tokens are excluded from normal application logs.
- Cloudflare Workers Logs are enabled with a 10% head-sampling rate.
- Infrastructure log retention is controlled by the active Cloudflare plan and is intentionally short. Cloudflare currently documents 3 days on Workers Free and 7 days on Workers Paid; verify the account plan at launch if this provider policy changes.

## Launch gate
Before public production:
1. contact purge must pass in staging;
2. staging API and frontend smoke tests must pass;
3. no evidence-upload route may exist in v1;
4. Workers Logs sampling must be enabled and application logs must remain sanitized;
5. rollback must be rehearsed against staging and the reviewed release restored;
6. Privacy and Terms must reflect the approved retention periods;
7. production must use the 180-day requester-contact setting.
