# HMATIAS / SOURCE AO — Automation model

Reference implementation: 13 November 2026

## What updates automatically today

The Cloudflare Worker in `source-ao/backend/wrangler.jsonc` declares two cron triggers:

- `*/15 * * * *`: processes a bounded batch of pending intake notifications, website lead alerts, supplier-discovery jobs and due public-opportunity source scans.
- `17 2 * * *`: performs the same scheduled work and additionally expires verification requests and public opportunities, clears old rate-limit windows, and applies the configured retention rule to closed/completed requester contacts.

The source scanner only checks active Angola opportunity sources that are due according to each source's configured interval. New discoveries enter a private review queue. They are **not** promoted to the public Radar automatically. HMATIAS review remains required before publication.

The SOURCE AO Radar requests live opportunities from the API and refreshes its visible data every five minutes while the page is active. It removes expired deadlines from the visible list. The page also requests `GET /api/automation/status`, a read-only aggregate endpoint that exposes no source names, source URLs, supplier identities, contacts, internal notes or failure messages.

## What remains release-driven

The HMATIAS institutional pages and product catalogue are static release assets. Changes to approved page copy, catalogue descriptions, product references or imagery require a reviewed repository change and a new site build/deployment. This is not currently a live CMS or a supplier-synchronised inventory.

Prices, stock, supplier lead times and transport conditions must never be inferred from a catalogue entry or automatically published as confirmed facts. They require current evidence and appropriate commercial approval.

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
