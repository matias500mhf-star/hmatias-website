# Source AO Backend

Private backend scaffold for Source AO. This code is intentionally isolated from the public HMATIAS website and is not production-deployed by this branch.

## Architecture

- Edge API: Cloudflare Worker-compatible runtime.
- Persistent data: D1/SQLite-compatible schema.
- Public routes: search and active opportunities only.
- Supplier routes: signed, expiring confirmation links.
- HMATIAS routes: bearer-protected creation/review/approval.
- Trust model: supplier responses never become public facts until HMATIAS review creates an approved observation.

## Required secrets

Never commit these values.

- `ADMIN_API_TOKEN` — protects HMATIAS internal write/review routes.
- `CONFIRMATION_SECRET` — HMAC secret used to sign supplier confirmation links.

`PUBLIC_ORIGIN` is non-secret and may be configured in `wrangler.jsonc`.

## Database setup

1. Create a database named `source-ao` in the target environment.
2. Replace `REPLACE_AT_DEPLOY_TIME` locally with the actual database identifier or inject the binding through the deployment environment.
3. Apply `migrations/0001_init.sql`.
4. Export the existing verified static seed data:

```bash
node scripts/export-seed-sql.mjs > seed.sql
```

5. Review `seed.sql` before importing it. The seed contains supplier/service/opportunity discovery records only; it does not create fake stock observations.

## API zones

### Public

`GET /health`

`GET /api/search?q=<query>&location=Luanda`

`GET /api/opportunities`

Public search can return catalog/service matches and approved, unexpired observations. Expired availability is not presented as current.

### Supplier confirmation

`GET /api/confirm/:requestId?token=<signed-token>`

`POST /api/confirm/:requestId?token=<signed-token>`

Supplier responses are stored with status `supplier_responded`; they are not published automatically.

### HMATIAS internal

Requires `Authorization: Bearer <ADMIN_API_TOKEN>`.

`POST /api/admin/items`

`POST /api/admin/verification-requests`

`GET /api/admin/verification-requests?status=<status>`

`POST /api/admin/verification/:requestId/approve`

Approval creates an immutable market observation with an expiry window.

## Verification lifecycle

1. HMATIAS creates a verification request.
2. API creates a 48-hour signed confirmation link.
3. Supplier confirms availability/quantity/price or unavailability.
4. Response enters `supplier_responded` state.
5. HMATIAS reviews and normalizes the item.
6. Approval creates one of:
   - `in_stock_confirmed` — default freshness 24 hours;
   - `supplier_confirmed` — default freshness 72 hours;
   - `unavailable`.
7. Public search computes freshness from the observation expiry and downgrades expired records to `needs_reconfirmation`.

## Local quality checks

No external package is required for the trust tests:

```bash
node --check src/index.js
node --test test/*.test.mjs
```

The Source AO GitHub workflow runs these checks together with the static data validator.

## Deployment gate

Do not deploy until all of the following are true:

- CI passes on the branch;
- secrets are configured outside GitHub source files;
- database migrations are reviewed;
- confirmation flow is tested with a non-production supplier/test account;
- CORS origin is correct;
- frontend API base URL is configured only after backend health checks pass;
- rollback is prepared.

## Rollback

The public HMATIAS website does not depend on this backend. If the backend deployment fails, remove/disable the Source AO API endpoint or frontend API configuration; the HMATIAS main site remains unaffected.
