# HMATIAS AI Assistant — Cloudflare Worker

## Current architecture

- The public website is published through GitHub Pages by `.github/workflows/jekyll-docker.yml` (workflow display name: **HMATIAS Pages Deploy**).
- The browser assistant is loaded by the public pages. `assistant-api-bridge.js` routes the legacy API URL to `https://hmatias-ai-assistant.matias500-mhf.workers.dev/api/ai`.
- The assistant Worker source is `cloudflare-ai/src/index.js`.
- Its authoritative Wrangler configuration is `cloudflare-ai/wrangler.jsonc`, with Worker name `hmatias-ai-assistant` and entry point `src/index.js`.
- The deployment and post-deploy smoke tests for that Worker are owned by `.github/workflows/hmatias-ai-worker-deploy.yml`. Changes under `cloudflare-ai/**` or to `assistant-api-bridge.js` trigger the validation workflow; pushes to `main` deploy the dedicated assistant Worker and test both its health endpoint and a real AI response.

## Separate root Wrangler configuration

The repository-root `wrangler.jsonc` is named `hmatias-website1` and points at the same source file using a different Worker identity. It belongs to a separate Cloudflare Workers Builds integration and is **not** the authoritative deployment configuration for the website assistant.

Do not deploy the assistant with the root config. Use the config inside this folder. If the separate `hmatias-website1` Cloudflare Git integration is no longer intended, disconnect that integration in the Cloudflare dashboard before removing its root configuration from the repository. Do not delete a Worker or route until confirming that it has no production traffic.

## Cloudflare Workers Builds settings

For the `hmatias-ai-assistant` Workers Builds connection:

- Keep `main` as the production branch.
- Set the production root directory to `cloudflare-ai` and the deploy command to `npx wrangler@4 deploy --config wrangler.jsonc`.
- Set the preview root directory to `cloudflare-ai` and the preview command to `npx wrangler preview`.
- Preview builds are isolated from production. Keep the Workers AI binding available to previews through the `previews.ai.binding` configuration below.

A root directory of `/` selects the unrelated repository-level Wrangler configuration and causes preview builds to target the wrong Worker.

## Cloudflare setup for the assistant

1. Keep the AI binding named `AI` as declared in `wrangler.jsonc`.
2. The assistant endpoint is `https://hmatias-ai-assistant.matias500-mhf.workers.dev/api/ai`.
3. Keep a suitable rate limit for the public API before expanding traffic.
4. Never expose Cloudflare API tokens or other secrets in this repository.

## Security and answer-quality controls

The Worker:
- allows the HMATIAS website origins;
- accepts POST JSON only for chat requests;
- rejects empty and oversized messages and limits history length;
- uses `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` and a restrictive referrer policy;
- instructs the assistant not to invent prices, stock, contracts, certifications, partnerships or guarantees;
- does not ask visitors for passwords, banking information or unnecessary sensitive data.

The website bridge and Worker are separately validated by the GitHub Actions workflow. A successful GitHub Actions run confirms the dedicated assistant deployment; it does not prove that the separate `hmatias-website1` native Cloudflare Builds project is healthy.
