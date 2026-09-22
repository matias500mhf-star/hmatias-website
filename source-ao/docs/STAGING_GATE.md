# Source AO — Staging Gate

Staging exists to prove the product before any public launch. It must remain isolated from the HMATIAS production website.

## Environment

- Branch: `source-ao-v1`
- Public production site: unchanged
- Staging API: separate hostname
- Staging database: separate from any future production database
- Robots/search indexing: disabled for staging frontend and legal pages
- Real secrets: provider secret store only; never source-controlled
- Requester contact retention: 30 days in staging so purge can be exercised quickly
- Daily maintenance cron: enabled

## Required staging tests

1. `GET /health` returns `ok: true`.
2. `GET /ready` returns `ready: true` and confirms configuration, D1, rate-limit schema and contact-retention schema.
3. Public search returns valid JSON for a known query.
4. A discovered/source-checked record never appears as current stock.
5. Confirmed stock must include a verification timestamp and traceable evidence.
6. Expired observations are downgraded to `needs_reconfirmation`.
7. Expired opportunities are not exposed as active.
8. Admin write routes reject requests without the staging bearer token.
9. Supplier confirmation links reject altered/expired signatures.
10. Supplier response enters review state; it is not published automatically.
11. HMATIAS approval creates an immutable observation with expiry.
12. Rate limiting returns HTTP 429 after the configured threshold and does not store a raw client IP in D1.
13. Daily maintenance marks unanswered expired verification requests as `expired`.
14. Daily maintenance deletes rate-limit windows older than 48 hours.
15. A completed/closed staging sourcing request older than 30 days has its direct contact purged while non-identifying demand fields remain.
16. Application request logs contain request ID, method, route, status and timing only — not query text, contacts, bodies or private tokens.

Run external smoke test after deployment:

```bash
SOURCE_AO_API_BASE=https://<staging-api-host> npm run smoke:staging
```

The smoke test must fail if `/ready` does not pass all required checks.

## First end-to-end pilot

Use a controlled test record, not a public customer request.

1. Create one test item and one test supplier.
2. Create a verification request.
3. Open the signed supplier link.
4. Submit a test availability response.
5. Confirm it remains private/pending review.
6. Approve it in the HMATIAS internal route.
7. Search publicly and confirm the verified state, timestamp and expiry.
8. Change the test expiry into the past and confirm public search downgrades it.
9. Create a synthetic sourcing request and confirm its private tracking link exposes no requester contact.
10. Exercise retention on a synthetic closed request and confirm contact data is purged.

## Promotion gate

Do not move Source AO to public production unless all are true:

- branch CI is green;
- staging `/ready` and smoke test pass;
- full supplier-confirmation pilot passes;
- synthetic sourcing + contact-purge pilot passes;
- no secrets exist in repository history or frontend code;
- mobile and desktop frontend pass manual review;
- public copy contains no invented statistics or availability claims;
- rate limiting / abuse controls are active;
- provider log retention is configured;
- private supplier-evidence retention is defined;
- database backup/export path is tested;
- rollback has been rehearsed;
- Privacy and Terms are reviewed for launch and then made discoverable;
- HMATIAS site integration is limited to an approved Source AO link/entry point.

## Rollback rule

If staging or production Source AO fails, disable its API/frontend endpoint. Do not modify core HMATIAS pages as an emergency workaround. The HMATIAS site must remain operational independently of Source AO.
