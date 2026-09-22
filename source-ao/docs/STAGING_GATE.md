# Source AO — Staging Gate

Staging exists to prove the product before any public launch. It must remain isolated from the HMATIAS production website.

## Environment

- Branch: `source-ao-v1`
- Public production site: unchanged
- Staging API: separate hostname
- Staging database: separate from any future production database
- Robots/search indexing: disabled for staging frontend
- Real secrets: provider secret store only; never source-controlled

## Required staging tests

1. `GET /health` returns `ok: true`.
2. Public search returns valid JSON for a known query.
3. A discovered/source-checked record never appears as current stock.
4. Confirmed stock must include a verification timestamp and traceable evidence.
5. Expired observations are downgraded to `needs_reconfirmation`.
6. Expired opportunities are not exposed as active.
7. Admin write routes reject requests without the staging bearer token.
8. Supplier confirmation links reject altered/expired signatures.
9. Supplier response enters review state; it is not published automatically.
10. HMATIAS approval creates an immutable observation with expiry.

Run external smoke test after deployment:

```bash
SOURCE_AO_API_BASE=https://<staging-api-host> npm run smoke:staging
```

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

## Promotion gate

Do not move Source AO to public production unless all are true:

- branch CI is green;
- staging smoke test passes;
- full supplier-confirmation pilot passes;
- no secrets exist in repository history or frontend code;
- mobile and desktop frontend pass manual review;
- public copy contains no invented statistics or availability claims;
- API rate limiting / abuse controls are configured;
- database backup/export path is tested;
- rollback has been rehearsed;
- HMATIAS site integration is limited to an approved Source AO link/entry point.

## Rollback rule

If staging or production Source AO fails, disable its API/frontend endpoint. Do not modify core HMATIAS pages as an emergency workaround. The HMATIAS site must remain operational independently of Source AO.
