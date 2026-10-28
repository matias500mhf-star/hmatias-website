# Repository and deployment source of truth

**Audit date:** 2026-10-28  
**Default branch:** `main`

This document separates the active production paths from the legacy/native Cloudflare Builds integration. It is an operational map, not permission to delete a Worker or route without checking traffic.

## 1. Public website — GitHub Pages

- **Source:** the public HTML, CSS, JavaScript and assets in `main`.
- **Publisher:** `.github/workflows/jekyll-docker.yml`, displayed as **HMATIAS Pages Deploy**.
- **Release rule:** push to `main` (or an explicitly started manual workflow).
- **Safety gates:** `site-integrity.yml`, `site-quality.yml`, a public-only artifact, and production URL smoke tests.
- The workflow deliberately excludes Worker configuration, backend code, private Source AO files and repository documentation from the public artifact.

Do not create a second publisher for the homepage without first disabling or replacing this production path.

## 2. Website AI assistant — dedicated Worker

- **Code:** `cloudflare-ai/src/index.js`.
- **Authoritative Wrangler config:** `cloudflare-ai/wrangler.jsonc`.
- **Worker name:** `hmatias-ai-assistant`.
- **Endpoint used by the website:** `https://hmatias-ai-assistant.matias500-mhf.workers.dev/api/ai`.
- **Browser bridge:** `assistant-api-bridge.js` maps the challenged legacy API URL to the dedicated endpoint.
- **Publisher and smoke tests:** `.github/workflows/hmatias-ai-worker-deploy.yml`.
- That workflow deploys from the `cloudflare-ai` directory and verifies both the health endpoint and a real AI reply. Its latest observed main-branch run for commit `726db445` passed: [GitHub Actions run](https://github.com/matias500mhf-star/hmatias-website/actions/runs/40652694831).

For this assistant deployment, the Cloudflare root directory must be `cloudflare-ai` and the selected Wrangler config must be the one in that directory.

## 3. Root Wrangler config — separate `hmatias-website1` identity

The repository-root `wrangler.jsonc` is named `hmatias-website1` and points at `cloudflare-ai/src/index.js`. It therefore packages the same source code under a **different Worker name**. It is not the config used by the dedicated assistant workflow, and the browser bridge does not target a `hmatias-website1` endpoint.

This appears to be a separate Cloudflare Workers Builds integration. Its live dashboard configuration, traffic and routes cannot be established from repository code alone.

- If retaining the native Builds project named `hmatias-website1`, its root directory must resolve to the repository root so the root `wrangler.jsonc` is used.
- If deploying the assistant Worker named `hmatias-ai-assistant`, use `cloudflare-ai` and its nested config instead.
- **Do not delete the root config or the native Builds project until the Cloudflare dashboard confirms that the integration is unused and has no production routes/traffic.** If that integration is retired, disconnect it in Cloudflare first, then remove its config in a reviewed change.

This distinction is central to avoiding accidental deployment of the assistant under the wrong Worker name.

## 4. Vercel project — test deployment and domain-assignment mismatch

The Vercel team has a Git-linked project `hmatias-site-test` connected to this same repository. It is not part of the GitHub Pages or dedicated assistant release workflows.

Verified on 2026-10-28:
- The latest Vercel build for `main` (commit `726db445`) failed at `npm run build` with **Missing script: "build"**. The root `package.json` on `main` includes `"dev": "vite"` but does not include `"build"`.
- A successful Vercel deployment with target `production` was built from branch `vercel-test` at commit `8671a874`, and Vercel's deployment alias inventory associates `comercialhmatiasps.com` and `www.comercialhmatiasps.com` with it.
- The public homepage HTML and public `assistant.js` fetched from `https://comercialhmatiasps.com/` match the corresponding current `main` files byte-for-byte. The Vercel test subdomain did not serve `/assistant.js` at the same path (HTTP 404).

These facts mean Vercel is a **conflicting/ambiguous deployment integration**, but the Vercel API's domain assignment does not prove that public DNS currently routes traffic to Vercel. The live page's exact match to `main` confirms the delivered content, not the DNS provider/origin.

- Do not add a root Vite `build` script just to make the Vercel check green. That could enable new Vercel production builds against the project's custom-domain configuration and create a second publisher.
- Do not delete the Vercel project or detach its custom domains until the authoritative DNS records/Cloudflare routing and active traffic are confirmed.
- Once DNS/routing is verified to use the intended GitHub Pages/CDN path, retire `hmatias-site-test` as a Git-linked deployment or remove the custom-domain assignments deliberately. Until then, preserve it but treat its failed builds as non-authoritative noise.

## 5. Other separate services

- **Source AO API:** `source-ao/backend/wrangler.jsonc`, with its own backend, D1 configuration and guarded staging/production workflows.
- **Lead intake:** `lead-intake/wrangler.jsonc`, a separate Worker configuration. Confirm its live Cloudflare resources before decommissioning anything.
- These are not interchangeable with the website assistant Worker. Keep their QA and deployment controls until resource use is verified.

## 6. The dependency-install error

The supplied log from **2026-10-27 22:11:08 UTC** stops at `npm clean-install` with `EUSAGE`, before deployment. That log predates the dedicated deployment corrections merged on **2026-10-28** (PRs [#270](https://github.com/matias500mhf-star/hmatias-website/pull/270) and [#271](https://github.com/matias500mhf-star/hmatias-website/pull/271)).

The repository currently tracks both a root `package-lock.json` and `cloudflare-ai/package-lock.json`. If a fresh build still says there is no lockfile, verify the **repository, branch, commit SHA and root directory shown in that exact Cloudflare build**. Do not assume an old log proves the current commit failed.

Cloudflare documents that the Workers Builds root directory determines where build/deploy commands execute, and settings apply to the next build: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

## 7. Repository hygiene snapshot

At the time of the audit the repository had **293 branches and 31 open pull requests**. Several branches are explicitly temporary, dated experiments or old release candidates. That amount of unfinished work is a real maintenance problem, but branches do not publish the site by themselves: the main website publisher runs from `main`; merging a change or manually dispatching a deployment is what can affect production.

Some open requests are stacked on feature branches rather than `main` (for example, Source AO RFQ work in PRs #252–#254, and the supply/cookie consent work in #137–#138). Do not merge or close such a chain without checking its base and whether its changes are already in `main`.

The following obsolete **push triggers** were removed in this cleanup while preserving manual checks:
- production read-only Source AO diagnostic: no longer listens to the old dated `ops/*` branch;
- Source AO Resend readiness: no longer listens to the old dated `ops/*` branch;
- Source AO data quality: no longer listens to the old `source-ao-v1` branch; pull-request and manual validation remain;
- website leads readiness: no longer runs only when its own workflow file changes; manual audit remains.

No production publisher, assistant deployment, Source AO staging/production launcher, security baseline, site-integrity gate or Lighthouse gate was removed.

## 8. Safe cleanup sequence

1. Confirm the native `hmatias-website1` Builds project in Cloudflare: connected repository, watched branch, root directory, latest commit SHA, routes and traffic.
2. Keep the dedicated assistant deployment on `cloudflare-ai/wrangler.jsonc` unless that Worker is intentionally replaced.
3. Review open pull requests for duplicate/already-landed work; resolve stacked PRs in dependency order.
4. Delete only branches tied to merged/closed work and verify no open PR still references them.
5. Remove a legacy Worker config only after its Cloudflare Git integration is disconnected and its traffic/route inventory is clear.
