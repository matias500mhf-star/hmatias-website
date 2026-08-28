# HMATIAS AI Assistant — Cloudflare Worker

This folder contains the backend for the HMATIAS website assistant.

## Current status

The Worker code is prepared in `cloudflare-ai/src/index.js` and uses the active Cloudflare Workers AI model `@cf/meta/llama-3.1-8b-instruct-fast`.

The Worker is intentionally **not** loaded by the public GitHub Pages site yet. This keeps the live site unchanged until the Cloudflare Worker is deployed and routed.

## Cloudflare setup

1. In Cloudflare Workers & Pages, create/deploy a Worker from this folder.
2. Keep the Workers AI binding named `AI` as defined in `wrangler.jsonc`.
3. Add a route for the Worker, ideally:
   - `comercialhmatiasps.com/api/ai`
4. Add a Cloudflare rate-limiting rule for `/api/ai` before public launch.
5. Enable Bot Fight Mode for the zone.
6. Use AI Crawl Control in monitor mode first; block individual AI crawlers only after reviewing traffic.
7. When the Worker is live, add the small chat interface to the website and point it to `/api/ai`.

## Security already built into the Worker

- Allows only HMATIAS website origins.
- Accepts POST JSON only.
- Rejects empty and oversized messages.
- Limits chat history length and per-message history size.
- Uses `Cache-Control: no-store`.
- Sends `X-Content-Type-Options: nosniff`.
- Uses `Referrer-Policy: strict-origin-when-cross-origin`.
- Does not request passwords, banking information, identity documents or other unnecessary sensitive information.
- System instructions explicitly forbid inventing prices, contracts, certifications, clients or exclusivity.

## Important

The Cloudflare account must supply the actual Worker route and account configuration. Do not expose Cloudflare API tokens or secrets in this repository.
