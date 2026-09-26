# Source AO — Staging Gate

Staging exists to prove the product before any public launch. It must remain isolated from the HMATIAS production website.

## Environment

- Branch: `source-ao-v1`
- Public production site: unchanged
- Staging API: separate hostname
- Staging frontend: separate Static Assets Worker
- Staging database: separate from any future production database
- Robots/search indexing: disabled for staging frontend and legal pages
- Real secrets: provider secret store only; never source-controlled
- Requester contact retention: 30 days in staging so purge can be exercised quickly
- Daily maintenance cron: enabled
- Internal Verification/Review/Sourcing desks are not bundled in the public staging frontend

## Required staging tests

1. `GET /health` returns `ok: true`.
2. `GET /ready` returns `ready: true` and confirms configuration, D1, rate-limit schema and contact-retention schema.
3. Public search returns valid JSON for a known query.
4. A discovered/source-checked record never appears as current stock.
5. Confirmed stock must include a verification timestamp and safe provenance: supplier + verification method + timestamp. Private evidence references must not be public.
6. Expired approved observations remain traceable but are downgraded to `needs_reconfirmation`; they must not silently revert to `discovered`.
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
17. A remote D1 export succeeds into a temporary runner-only SQL file, the file is non-empty, and it is deleted immediately. The workflow must not publish the backup as a GitHub artifact.
18. The staging frontend runtime points only to the staging API.
19. The staging frontend remains `noindex` and ships a `robots.txt` that disallows crawling.
20. Backend source, technical docs and internal desks return non-200 from the public staging origin.

Run external smoke tests after deployment:

```bash
SOURCE_AO_API_BASE=https://<staging-api-host> npm run smoke:staging
SOURCE_AO_API_BASE=https://<staging-api-host> SOURCE_AO_STAGING_PUBLIC_ORIGIN=https://<staging-web-host> npm run smoke:web:staging
```

The API smoke test must fail if `/ready` does not pass all required checks. The web smoke test must fail if internal/private files are publicly bundled.

## First end-to-end pilot

Use controlled test records, not a public customer request.

1. Create one test item and one test supplier.
2. Create a verification request.
3. Open the signed supplier link.
4. Submit a test availability response.
5. Confirm it remains private/pending review.
6. Approve it in the HMATIAS internal route.
7. Search publicly and confirm the verified state, timestamp, safe provenance and expiry.
8. Change the test expiry into the past and confirm public search returns `needs_reconfirmation` while retaining safe provenance.
9. Create a synthetic sourcing request and confirm its private tracking link exposes no requester contact.
10. Confirm the authenticated Sourcing Desk can decrypt that synthetic contact.
11. Close the synthetic sourcing request.
12. Exercise retention on an eligible synthetic closed request and confirm contact data is purged. The automated `npm run retention:staging` drill creates a synthetic request, closes it, backdates only that test row in staging D1, runs staging-only maintenance, verifies the contact is purged, and confirms private tracking still preserves non-identifying request state.

## Promotion gate

Do not move Source AO to public production unless all are true:

- current branch CI is green;
- staging API `/ready` and smoke test pass;
- isolated staging frontend deploy + web smoke test pass;
- full supplier-confirmation pilot passes;
- synthetic sourcing + contact-purge pilot passes;
- no secrets exist in repository history or frontend code;
- mobile and desktop frontend pass manual review;
- public copy contains no invented statistics or availability claims;
- rate limiting / abuse controls are active;
- Workers Logs are enabled with sanitized application logging and short provider-managed retention;
- v1 continues to reject private evidence attachments unless a separate secure evidence store is approved;
- private D1 export path succeeds without publishing the backup artifact;
- rollback has been rehearsed and the reviewed candidate restored with API/web smoke tests passing;
- Privacy and Terms are reviewed for launch, indexable in production source, and rewritten to noindex in the staging bundle;
- Source AO branch is synchronized with the then-current `main` and all gates are rerun before merge;
- HMATIAS site integration is limited to an approved Source AO link/entry point.

## Code freeze rule

Once the current branch quality suite is green, application code stays frozen until provider-side staging is activated and the smoke/pilot sequence is executed. Only a defect found by those acceptance tests should reopen the implementation phase.

## Rollback rule

If staging or production Source AO fails, disable its API/frontend endpoint. Do not modify core HMATIAS pages as an emergency workaround. The HMATIAS site must remain operational independently of Source AO.
