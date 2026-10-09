# Source AO Backend

Cloudflare backend for Source AO. Server files are excluded from the public HMATIAS website artifact; API deployment is managed by the production release workflow.

## Architecture

- Edge API: Cloudflare Worker-compatible runtime.
- Persistent data: D1/SQLite-compatible schema.
- Public routes: catalogue search, anonymised procurement, active opportunities and customer RFQ intake/tracking.
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

`GET /api/procurement-mission?q=<query>&location=Luanda`

Both public search and procurement use explicit response projections. They retain product specifications, evidence status and dates, but do not return supplier/provider identities, contacts, shortlists or purchase prices. Service results describe categories, not named providers. The legacy core search entry point uses the same projection.

Only `catalog.json`, `opportunities.json` and `source-registry.json` are copied into public production/staging assets. Offline search uses catalogue families without asserting stock. Supplier, service, observation and verification queue data remain excluded from those artifacts.

This boundary does not conceal files or history in a public Git repository. Repository visibility/history and hosting support require separate review; do not commit new confidential sourcing relationships or contacts to seed files.

### Supplier confirmation

`GET /api/confirm/:requestId?token=<signed-token>`

`POST /api/confirm/:requestId?token=<signed-token>`

Supplier responses are stored with status `supplier_responded`; they are not published automatically.

### HMATIAS internal

Requires `Authorization: Bearer <ADMIN_API_TOKEN>`.

`GET /api/admin/procurement-mission?q=<query>&location=Luanda`

The authenticated procurement route retains supplier contact details, shortlists and purchase information for HMATIAS operations. Supplying an admin token to the public route does not expand its response.

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


## Commercial RFQ and partner notifications (production)

The Source AO API stores sourcing requests and partner applications in private D1 tables. Migration `0023_intake_alert_queue.sql` creates a durable notification outbox from both tables. **A stored SAO reference is not proof that the HMATIAS commercial inbox was notified.**

To activate email notification from the production deployment workflow, set the following in the GitHub repository/environment used by the production release:
- Repository/environment **secret** `SOURCE_AO_RESEND_API_KEY`: valid Resend API key with permission to send mail from a verified domain.
- Repository/environment **variable** `SOURCE_AO_ALERT_FROM`: verified sender identity (e.g. `HMATIAS <noreply@your-verified-domain>`).
- Repository/environment **variable** `SOURCE_AO_ALERT_TO`: `geral@comercialhmatiasps.com`.

Do **not** put the Resend API key into code, public forms, documentation or ChatGPT conversation content. GitHub Actions transfers the values to Cloudflare Worker secrets only when all three are present; if any is missing, previously configured Worker secrets are preserved and outbound email remains unconfirmed.

After a controlled production deployment, verify the **admin-only** endpoint `GET /api/admin/intake-alerts/status` with the existing secret `ADMIN_API_TOKEN`. It exposes only `configured`, `pending` and `sent` counts, never client contact details. Then submit two labelled **test** records (one sourcing RFQ and one partner application), validate the references and D1 rows, and check the email inbox and D1 transition from pending to sent. Verify duplicate protection and retry on simulated provider failure. A provider-accepted email is not evidence of inbox delivery; review Resend delivery logs and the actual mailbox.

The production deploy job also runs read-only health, private-outbox and search verification after the migration. New notification rows are created only for **new** requests; no backfill is run against historical customers. The existing workbench uses an entirely separate `lead-intake/` Worker for non-SourceAO HMATIAS website forms; that integration remains disabled until independently tested with HubSpot and Turnstile.

