# HMATIAS — Design system and page audit (2026)

## Scope and safety
This review is based on the repository's `main` tree and source inspection of the Portuguese/English homepage, core service pages, credibility page, Smart RFQ and works catalogue. All new design work remains in `design/2026-premium-experience`. The approved production homepage and `main` branch have not been modified. No production deployment was performed.

## Repository inventory
- 50 HTML documents in the current repository tree, including Portuguese and English pages and the separate Source AO application.
- The approved homepage is `index.html`; its current stylesheet stack is `home-base.css`, `header.css`, `home-details.css` and `site-improvements.css`.
- Core division pages (`construcao.html`, `facilities.html`, `supply.html`, `servicos-administrativos.html`) share a common stylesheet foundation, then add page-specific styles.
- English equivalents exist for the homepage and several divisions.
- Source AO has a separate interface and CSS family. It should not inherit the corporate-site redesign indiscriminately.
- All stylesheet paths inspected on the 12 core PT/EN pages resolve to files in the repository.

## Confirmed design and maintenance findings
1. The homepage and internal pages do not use one identical stylesheet stack. The homepage has its own set of home styles; internal pages share a broader legacy stack.
2. Internal pages load multiple common CSS layers (`style.css`, `premium.css`, `division.css`, `assistant.css`, `header.css`, typography and institutional styles) plus page-specific overrides. This creates a risk of cascade overlap and inconsistent page-level tuning.
3. The common navigation markup on the reviewed corporate pages is consistent in its main destinations (Home, About, Services, Projects), but labels and language variants differ as expected.
4. The current repository contains no `blog.html`, `insights.html`, or matching path/file names. The Blog and Insights destinations therefore need to be identified or implemented as separate content experiences before links are published.
5. The approved homepage uses the existing hero photograph `images/catalogue/instalacoes-embutidas-construcao.webp`; the prototype uses this existing asset and the existing local Inter font.
6. The logo is stored at `images/logo-hmatias.png`. The prototype references that verified path.

## Prototype design rules
- Preserve the current approved homepage as the baseline; do not replace it without a separate approval.
- Preserve HMATIAS institutional blue and local Inter typography.
- Use real, existing project images only. Never fabricate work evidence or company claims.
- Use a clear service hierarchy, consistent spacing, readable content widths and a single responsive navigation pattern.
- Keep Blog (long-form guidance and explainers) separate from Insights (market updates and company/sector developments).
- Motion is restrained and respects `prefers-reduced-motion`.
- Every interactive element must have a real destination or behavior. Placeholder concepts must not be presented as working links.
- Keep Source AO as a distinct product experience while sharing only suitable brand tokens.

## Review status
- [x] Isolated design branch created.
- [x] Desktop/mobile prototype source created.
- [x] Verified local logo, font and hero image paths.
- [x] Checked stylesheet references on 12 core Portuguese/English pages; no missing stylesheet files found.
- [x] Confirmed Blog/Insights standalone destinations are absent from the current tree.
- [ ] Browser visual regression test at desktop and mobile widths.
- [ ] Full audit of all 50 HTML documents and all nested Source AO screens.
- [ ] Review and approval of visual direction.
- [ ] Extract approved shared tokens/components into production without changing homepage composition.
- [ ] Build separate Blog and Insights content structures and verified destinations.

## Next safe implementation sequence
1. Complete browser-based visual testing of the isolated prototype.
2. Review every production page by page family (home, divisions, credibility/portfolio, RFQ, Source AO, legal and English).
3. Agree a small shared token layer (color, typography, spacing, content width, focus and motion) before refactoring CSS.
4. Refactor one internal page family at a time, preserving the homepage.
5. Run link, mobile, accessibility and form tests before preparing a production pull request.


## Light institutional page system — 10 November 2026
- Added `internal-pages-premium.css` as a shared visual layer for the five core Portuguese corporate pages and their English equivalents.
- The layer keeps the institutional navy/blue palette but moves internal-page heroes to a pale blue field, uses white/light content areas, flat editorial service rows, restrained borders and shorter vertical spacing.
- Real project imagery remains sourced from existing repository assets; the stylesheet does not add or fabricate photography.
- The stylesheet is explicitly excluded from the approved homepage and all Source AO screens.
- The page-level stylesheet is loaded after the existing legacy stack so the new visual rules take precedence without rewriting existing functional styles.
- Visual review is still required on the Netlify preview at desktop and mobile widths before production approval.


## Interaction refinement extracted from Lovable — 10 November 2026
- Reused the Lovable prototype's consistent button component principles: shared minimum height, predictable horizontal spacing, clear primary/outline/light variants, restrained radius, and one hover/focus language.
- Adapted the colors to the HMATIAS institutional palette already present in the repository: navy `#062d56`, blue `#075da8`, pale surface `#f4f8fc`, border `#dce6f0`.
- Kept the existing local Inter family; the Lovable prototype's DM Sans / Space Grotesk pairing was not copied because HMATIAS already uses Inter and the local font asset is verified.
- Added consistent focus-visible treatment, input/select/textarea states, mobile tap height and reduced-motion behavior.
- Scope remains limited to `body.hmatias-institutional`; the approved homepage and Source AO are excluded.
- No page structure, copy, business claims, links, form destinations or production settings were changed in this refinement.
