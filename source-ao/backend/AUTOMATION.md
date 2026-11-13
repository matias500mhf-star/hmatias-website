# HMATIAS / SOURCE AO — Automation model

Reference implementation: 13 November 2026

## What updates automatically today

The Cloudflare Worker in `source-ao/backend/wrangler.jsonc` declares two cron triggers:

- `*/15 * * * *`: processes a bounded batch of pending intake notifications, website lead alerts, supplier-discovery jobs and due public-opportunity source scans.
- `17 2 * * *`: performs the same scheduled work and additionally expires verification requests and public opportunities, clears old rate-limit windows, and applies the configured retention rule to closed/completed requester contacts.

The source scanner only checks active Angola opportunity sources that are due according to each source's configured interval. New discoveries enter a private review queue. They are **not** promoted to the public Radar automatically. HMATIAS review remains required before publication.

The SOURCE AO Radar requests live opportunities from the API and refreshes its visible data every five minutes while the page is active. It removes expired deadlines from the visible list. The page also requests `GET /api/automation/status`, a read-only aggregate endpoint that exposes no source names, source URLs, supplier identities, contacts, internal notes or failure messages.

## What remains release-driven

The HMATIAS institutional pages and product imagery remain release assets. The SOURCE AO product-family catalogue now has a live database-backed path: the RFQ prefers `GET /api/catalog` and falls back to the parity-checked `source-ao/data/public-catalog.json` projection if the API is unavailable. The backend validates each RFQ against the same public-visible D1 records, so a newly published family is accepted without a website rebuild. This catalogue is not a stock or supplier inventory.

Prices, stock, supplier lead times and transport conditions must never be inferred from a catalogue entry or automatically published as confirmed facts. They require current evidence and appropriate commercial approval.

## Live catalogue operations

The catalogue has two content modes:

- **Seed-managed:** curated entries from `source-ao/data/catalog.json` are synchronised into D1 on a reviewed backend release. These values can be updated with a source release.
- **Admin-managed:** entries edited or created through SOURCE AO Ops are marked `management_mode='managed'`; the seed process preserves their content and explicit visibility decision across later redeployments.

The internal **SOURCE AO Ops → Catálogo público** panel requires the same administrator session as the other private operations. It uses:

- `GET /api/admin/catalog/items` to load the internal catalogue;
- `POST /api/admin/items` to create a managed entry (private by default);
- `PATCH /api/admin/catalog/items/:id` to edit bilingual names, category, public specification, unit, aliases, keywords and explicit public visibility;
- `GET /api/catalog` for the public projection.

Only rows with `public_visible=1` enter the public RFQ catalogue. The excluded `item-formaldehyde` identifier cannot be published. The public projection contains no prices, supplier identities, contacts, stock levels, lead times, margins or internal notes.

The RFQ prefers the live catalogue API when configured. When the API is unavailable, it falls back to the static public catalogue. The server-side RFQ validator reads the same published D1 records; private items are rejected even when a client manually submits their IDs.

Administrator tokens remain in page memory only. Do not store them in localStorage, sessionStorage, source files or browser exports.

## Publication boundaries

Automation may collect and classify public notices, detect expired records, refresh approved feed data, run tests and report failures. It must not autonomously:

- promote newly discovered tenders or RFQs to the public Radar;
- approve or reject partner applications;
- publish unverified project claims, client references or completed-work photographs;
- change commercial prices, margins, stock commitments or delivery promises;
- change legal/privacy terms, redirects, canonical URLs, DNS or the production publisher.

## Health endpoint

`GET /api/automation/status` returns aggregate data:

- automation status (`operational`, `attention` or `not_configured`);
- configured source count, overdue count and count with a recent source error;
- most recent check and successful check timestamps;
- count of active public Angola opportunities and the latest public source-check timestamp;
- declared scan, browser-refresh and maintenance cadence.

The endpoint is read-only and uses a generic unavailable response if D1 cannot be queried. The Radar displays the status when its API is configured.

## Required rollout sequence

1. Pass backend tests, data-quality checks and Astro QA.
2. Deploy the backend change to the isolated SOURCE AO staging environment; confirm the endpoint returns aggregate data and no private fields.
3. Verify the scheduled trigger executions and the public Radar refresh in staging.
4. Keep catalog/page publishing release-driven until an approved content-management source and editorial permissions are implemented.
5. Promote to production only through the separate production release gate and an approved rollout window.
