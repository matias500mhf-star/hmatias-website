# HMATIAS — Site-wide design and presentation standard

**Scope:** all Astro preview pages, Portuguese and English, across the HMATIAS corporate website and its business areas.  
**Status:** implementation standard for PR #316; production publication remains separately gated by review and approval.

## 1. Visual system

- Use the shared HMATIAS palette, typography, spacing tokens and component patterns defined in `src/styles/global.css`.
- Keep one visual language across PT/EN. Translation may change text length, but must not change component order, hierarchy, spacing logic or interaction behaviour.
- Keep the design restrained and corporate: clear hierarchy, generous but controlled whitespace, thin borders, deliberate contrast and limited decorative effects.
- Do not introduce a new colour, typeface, radius, shadow or card treatment for an individual page without a system-level reason.

## 2. Layout and alignment

- Use the shared `.section-pad` rhythm and `--hm-gutter` page gutter for standard content sections.
- Align section headings, supporting copy, grids and calls to action to a common content edge.
- Use CSS Grid/Flexbox with `minmax(0, 1fr)` and `min-width: 0` to prevent overflow.
- Keep card heights, image frames, titles, descriptive text and action placement consistent within each repeated collection.
- Avoid oversized panels, unnecessary full-width cards and inconsistent empty space.

## 3. Typography and content

- Use the established display, sans-serif and mono font roles; do not introduce page-specific font families.
- Maintain a clear scale for eyebrow/kicker, page title, section title, card title, body copy, metadata and legal/support text.
- Body copy must remain readable on mobile, use a comfortable line height and avoid excessively long line lengths.
- Use the correct language, spelling and terminology in each locale. PT and EN pages must be equivalent in information and functionality.
- Do not add generic marketing claims, unsupported capabilities, stock statements, certifications or delivery promises.

## 4. Cards, catalogues and documents

- Repeated cards in the same collection use the same image geometry, padding, border treatment, title order, metadata placement and action position.
- Catalogue covers use a 3:4 ratio and a maximum rendered width of approximately 180 px on desktop. The grid targets four columns on wide screens and two columns on tablets and phones, collapsing only where the viewport requires it.
- Preserve official supplier branding on supplier-issued catalogues. HMATIAS-owned documents use the HMATIAS identity and must not imply that HMATIAS manufactures a partner's products.
- Use `object-fit: contain` for logos and product/covers where the full artwork matters; use `cover` only for photographs whose crop is acceptable.
- PDFs must not be embedded or preloaded in the page. Open the document only after an explicit click, in a new tab where appropriate.
- No catalogue card may link to a PDF that has not been checked for existence, current version, language, rights to publish and accurate description.

## 5. Photography and media

- Use verified HMATIAS project photographs for work records and portfolio evidence. Do not use illustrative stock imagery as proof of executed work.
- Partner/product imagery must be official or have publication permission and must be labelled accurately.
- Use responsive AVIF/WebP variants where supported, explicit image dimensions/aspect ratios, descriptive alt text and lazy loading for below-the-fold media.
- Only the actual LCP/hero image may be eagerly loaded where justified. Do not load catalogue PDFs, unnecessary video or large media before user intent.

## 6. Navigation, actions and forms

- Header, navigation, language switch, footer, floating contact action and core button patterns must be shared components.
- Navigation labels, current-page state, destinations, dropdown behaviour and keyboard operation must be consistent in PT and EN.
- Calls to action must describe the real next step. Do not label a request form as a quote, booking or confirmed order.
- Forms must use consistent labels, required-field indication, validation feedback, error and success states, keyboard focus, privacy copy and mobile spacing.
- Interactive controls must remain usable by keyboard, touch and assistive technology; respect `prefers-reduced-motion`.

## 7. Responsive and quality assurance

- Review at minimum: 360 px mobile, 390 px mobile, 768 px tablet, 1024 px compact desktop and 1440 px wide desktop.
- Check for horizontal scrolling, clipped text, broken image ratios, uneven card actions, menu overlap, inaccessible contrast, focus visibility and touch targets.
- Run the existing Astro type-check, static build, generated-site verification, link checks, Playwright desktop/mobile, axe accessibility tests and Lighthouse CI before declaring a page set validated.
- Validate representative routes in both languages and all shared components after every global CSS change.
- Keep PR #316 isolated. Do not merge, change DNS or publish to the official domain without separate approval.

## 8. Completion rule

A page is not considered uniform merely because it uses the same colours. It must also follow the same layout rhythm, hierarchy, image rules, card geometry, responsive behaviour, accessibility and interaction standards. Exceptions must be intentional, documented and visually justified.
