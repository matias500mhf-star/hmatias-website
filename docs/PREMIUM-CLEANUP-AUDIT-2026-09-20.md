# HMATIAS Premium Cleanup Audit — 20 September 2026

## Objective
Reduce editorial and technical clutter while preserving the approved HMATIAS visual system, SEO structure, Smart RFQ, Assistant HMATIAS and the current stable production baseline.

## Current baseline
- Production baseline: `b1bb0c521a5995caffd0d899d09bb3bdff534b5d`.
- GitHub Pages deployment, Site Integrity, Jekyll CI and Lighthouse Quality are green.
- Lighthouse baseline: PT desktop 99 / mobile 80 performance; EN desktop 99 / mobile 85 performance; accessibility, best practices and SEO 100 on all four homepage runs.
- Search Console currently shows very low organic volume and no material service-page query traction; avoid removing core intent terms, but there is no evidence that the current editorial duplication is producing useful search demand.

## Priority 1 — Source-of-truth cleanup
1. Remove legacy homepage sections from `index.html` and `en.html` when they are already hidden/removed by `site-bootstrap.js`. Do not rely on runtime JavaScript to hide content that should not be public or crawlable.
2. After source cleanup, remove the corresponding runtime cleanup code (for example `removeLegacyHomeLeadership`) when no longer required.
3. Keep the public HTML as the authoritative representation seen by browsers and crawlers.

## Priority 2 — Homepage editorial reduction
The homepage currently repeats the same commercial proposition across service cards, a dedicated Supply section, operating-context cards, company identity, leadership, process, CTA, contact and footer.

Recommended final structure:
1. Hero — Construction / Facilities / Supply positioning and one primary CTA.
2. Three core service pillars — Construction, Facilities, Supply.
3. Selected real projects / proof.
4. Two specialised divisions — HMATIAS Clean and Business Services.
5. Compact company / trust block.
6. Single commercial CTA and contact.
7. Footer.

Remove or consolidate:
- duplicate `Fornecimento Empresarial` vs `HMATIAS Supply` cards;
- repeated Supply explanation after the service grid;
- `Contexto de atuação` when it repeats the same four categories;
- repeated NIF / Commercial Registration / operational-base blocks;
- leadership block from homepage if leadership is not a deliberate commercial conversion element;
- repeated process language such as scope / conditions / follow-up / execution when already stated in service pages.

Keep legal/institutional details in the Credibility page and a compact footer, rather than repeating them in multiple homepage sections.

## Priority 3 — Portuguese editorial consistency
Use natural Portuguese instead of unnecessary `&` and mixed English in Portuguese service copy.

Examples to standardise:
- `Apoio Administrativo, Documental & Empresarial` → `Apoio administrativo, documental e empresarial`.
- `SERVIÇOS & VALORES` → `SERVIÇOS E VALORES`.
- `Expediente Administrativo & Redação Institucional` → `Expediente administrativo e redação institucional`.
- `Gestão & Organização Documental` → `Gestão e organização documental`.
- `Propostas Comerciais & Business Support` → `Propostas comerciais e apoio empresarial`.
- `Apoio Administrativo a Processos de Visto & Agendamentos Consulares` → `Apoio administrativo a processos de visto e agendamentos consulares`.

Update matching select options, structured data and Assistant knowledge so public copy and assistant answers remain consistent.

## Priority 4 — Supply page
Remove internal/defensive editorial language from the customer-facing page.

Specifically:
- remove wording explaining that construction/remodelling photos are not used as evidence of Supply;
- keep only one compact statement explaining that third-party brand or supplier references do not imply representation/exclusivity;
- reduce repeated sourcing/process explanations while preserving commercial-intent terms and the RFQ CTA.

## Priority 5 — Business Services
- Keep Business Services as a specialised division, not a competing core identity against Construction / Facilities / Supply.
- Keep visa/consular support clearly administrative and non-legal.
- Compress the long disclaimer visually or move expanded legal limitations to Terms while keeping the essential warning next to the service.
- Review whether exact public base prices are operationally maintained; stale prices are worse than `sob consulta` for a premium corporate site.

## Priority 6 — HMATIAS Clean
- Keep landing-page product information concise.
- Move long dilution/application instructions to product details, datasheets or expandable technical sections.
- Keep third-party/manufacturer disclaimers compact.
- Exact prices should remain public only if there is a reliable process to keep them current.
- Preserve the structured quotation workflow and commercial stock/lead-time confirmation.

## Priority 7 — CSS and runtime consolidation
Current homepage head loads multiple layers (`style.css`, `premium.css`, `division.css`, `home-divisions.css`, `assistant.css`, `header.css`, `typography.css`, `home-review.css`, `site-review.css`) plus inline `home-visual-polish` rules. `site-bootstrap.js` then injects additional shared assets.

Actions:
1. Fold approved final rules from review/polish layers into stable base/component/page stylesheets.
2. Remove obsolete `review`, `visual-fixes`, `home-review` and inline polish overrides only after visual regression checks prove equivalence.
3. Align static `site-review.css` version strings across pages with the bootstrap version, or stop runtime href replacement, to avoid a possible second CSS fetch.
4. Reduce global runtime injection to assets genuinely required site-wide.
5. Keep Assistant knowledge lazy-loaded; do not load its knowledge payload before the user opens/uses the assistant.
6. Keep Clean catalogue JS isolated to Clean pages.

Target architecture after cleanup: roughly base + components + page-specific CSS rather than a chain of historical override layers.

## Priority 8 — English stale public information
A search-engine snapshot still exposes older English homepage fields such as `Licensed activity CAE 82900` and `Commercial Licence Valid until 09.10.2028`, while the current `main` no longer contains those phrases.

Actions:
1. Confirm the live page source after deployment/cache propagation.
2. If absent live, do not re-add them; request/encourage recrawl via Search Console and update sitemap `lastmod` when the cleaned version is deployed.
3. If still present live, investigate cache/deployment mismatch before editing content again.

## Priority 9 — RFQ / Business Services availability
External page-open checks intermittently report errors for `business-services.html`, `rfq.html` and `rfq-en.html`, while repository integrity/deployment checks are green and search results confirm a previously crawlable Business Services page.

Treat as an incident to reproduce with a second HTTP source before declaring a production 500. Do not make speculative code changes based only on the external checker.

## SEO guardrails
- Preserve canonical URLs, hreflang pairs, structured data and core service-intent terms.
- Keep `/construcao.html`, `/construction.html`, `/facilities.html`, `/facilities-en.html`, `/supply.html`, `/supply-en.html`, `/clean.html`, `/clean-en.html`, `/servicos-administrativos.html`, `/business-services.html`, Smart RFQ and catalogue pages.
- Do not keep paragraphs solely to make pages long. One strong service-intent section plus proof/process/CTA is preferable to repeated near-synonymous copy.
- After deployment, monitor Search Console by query + page + country and compare impressions/clicks/CTR/position before and after cleanup.

## Acceptance criteria
- No legacy content is hidden only through JavaScript when it can be removed from source.
- No mixed Portuguese/English service labels in PT pages unless they are deliberate product/division names.
- Homepage visibly shorter and focused on the three core commercial pillars.
- No duplicate institutional/legal data blocks.
- No internal editorial notes presented to customers.
- Lighthouse remains ≥ current quality floors; target PT mobile >85 and EN mobile >85 without sacrificing accessibility/SEO.
- Smart RFQ and Assistant HMATIAS remain operational.
- All PT/EN canonical and hreflang relationships remain valid.
- Main is merged only after visual, mobile, accessibility, link and workflow checks pass.
