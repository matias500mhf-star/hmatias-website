# HMATIAS — GA4 measurement and migration checklist

Date: 26 November 2026  
Scope: PR #316 — Astro platform modernization  
Status: implementation and production validation required before release

## 1. Purpose

Preserve reliable measurement when the approved Astro website eventually replaces the current public website. Measurement must distinguish discovery, content engagement and qualified commercial actions. GA4 figures from the current public website must not be attributed to the isolated Astro preview.

## 2. Existing production measurement — preserve, do not duplicate

The current public website repository already contains:

- GA4 loader in `analytics.js`, using measurement ID `G-JNJDL6LZFY`.
- Google Tag Manager loader in `tag-manager.js`, using container `GTM-MXT9VM65`.
- Cookiebot consent integration. Statistics consent is required before GA4/Google Tag Manager analytics are loaded; advertising storage and advertising signals remain denied.
- Commercial and AI-referral event handling in `analytics-events.js`.

Before release, inspect the live GTM container configuration and GA4 DebugView to establish whether GA4 is also configured as a GTM tag. Do not deploy a second GA4 configuration or duplicate page_view events. Retain one deliberate page-view strategy and document which component owns it.

The Astro preview's `BaseLayout.astro` currently does not load analytics. Keep preview measurement disabled while the preview is isolated, noindex/nofollow and not the production hostname. Do not weaken the preview's robots policy to obtain analytics.

## 3. Attribution baseline and interpretation

The Google Analytics mobile report supplied on 26 November 2026 covers 19–25 November 2026 against 12–18 November 2026:

- 10 sessions, down 13 sessions (56.52%) against the comparison period.
- 8 sessions attributed to `chatgpt.com / ai-assistant`.
- 2 sessions attributed to `vercel.com / referral`.
- 0 sessions shown for the Astro Render preview referral and direct traffic in this report.

This is a small sample and a week-over-week comparison, not evidence of qualified leads, rankings, organic-search performance or the performance of the new Astro design. Referral attribution may be affected by consent, browser privacy, referrer handling and campaign tagging. Confirm source/medium definitions in GA4 before drawing conclusions.

Search Console remains a separate measurement source for Google organic visibility (impressions, clicks, CTR and average position). Do not treat GA4 sessions as Search Console clicks or combine the two totals.

## 4. Event measurement requirements

Preserve and validate the existing event vocabulary where it matches the Astro experience. Do not create duplicate or competing event names.

| Commercial question | Event / measurement | Required safe parameters |
|---|---|---|
| Which service pages attract attention? | `service_view` | `service_name`, `page_language` |
| Which service links are used? | `service_click` | `service_name` |
| Which contact channel is selected? | `contact_click` | `contact_method` (phone, email, WhatsApp) |
| Are quote CTAs used? | `quote_cta_click` | `service_name`, `contact_method` |
| Are contact/quote forms attempted? | `form_submit` | approved form identifier and `lead_type`; never field values |
| Was a lead actually accepted? | `generate_lead` | `method`, `lead_type`; emit only after confirmed successful receipt |
| Are public catalogues opened/downloaded? | `catalogue_open` / `file_download` | approved catalogue identifier, language, file type |
| Which AI assistant referred a visit? | `ai_referral_view` | allowlisted provider only (ChatGPT, Perplexity, Gemini, Copilot) |
| Is SOURCE AO content used? | `source_ao_view` | public surface identifier only |

Use GA4 recommended event `file_download` where applicable; avoid sending file URLs containing private parameters. Keep existing event names where already implemented and map the table to the actual Astro components before adding listeners.

A form attempt is not a confirmed lead. A click to WhatsApp is a contact handoff, not a completed enquiry. Only record `generate_lead` after the existing approved intake confirms successful receipt. Do not alter the Resend production form or its routing as part of this analytics work.

## 5. Privacy and consent requirements

- Cookiebot statistics consent must gate analytics loading and event transmission.
- A consent withdrawal or decline must update Google consent state and stop analytics storage in accordance with the existing CMP implementation.
- Do not send names, company names, phone numbers, email addresses, message bodies, RFQ descriptions, search terms, budgets, private references, tracking tokens or other visitor-entered values to GA4, GTM, Clarity or URL query parameters.
- Do not send full URLs containing personal data or private query strings. Strip fragments and allowlist only approved campaign parameters.
- Do not track noindex, preview, admin, SOURCE AO operational, review, request-confirmation or other private routes.
- Keep advertising storage and advertising personalisation denied unless a separately approved legal and consent configuration explicitly changes this policy.
- No secrets, API keys or private connector credentials belong in the repository.

## 6. Migration and release validation

Before the Astro website is promoted:

1. Confirm the production GA4 property and GTM container in the live account; inspect whether GA4 is configured directly, through GTM, or both.
2. Choose one page_view owner and remove duplicate configuration paths before enabling production analytics.
3. Implement the existing consent contract in the Astro production build; test accepted, rejected and withdrawn statistics consent.
4. Map PT and EN routes to stable page identifiers and service taxonomy; ensure route changes do not fragment reporting.
5. Test each approved event in GA4 DebugView using synthetic data and verify that no form values, personal data or private route details are transmitted.
6. Verify that `form_submit` and `generate_lead` are distinct and that `generate_lead` only fires after successful intake confirmation.
7. Validate catalogue download tracking for the final approved PDF assets without exposing supplier data or private URLs.
8. Confirm real production page_view, source/medium, language and event data after cutover; compare against the pre-migration baseline only after equivalent consent and attribution conditions are understood.
9. Keep Search Console validation separate: verify domain property, canonical URLs, indexing, sitemap, redirects and organic search performance independently.
10. Record the date/time of cutover and the exact deployed commit so before/after comparisons are reproducible.

## 7. Minimum reporting dashboard

Create a GA4 report or exploration with:

- Sessions and engaged sessions by session source / medium.
- New and returning users, with date comparison.
- Landing page and page path, split by PT/EN.
- Service views by service (Construction, Facilities, Supply, Business Services).
- Contact clicks by channel.
- Quote CTA clicks and form submissions.
- Confirmed leads (`generate_lead`) as a separate conversion metric.
- Catalogue opens/downloads by approved catalogue and language.
- AI referrals by allowlisted provider.
- Conversion rate from session to confirmed lead, with the denominator and attribution scope clearly stated.

Use a rolling 28-day view alongside week-over-week comparisons. Annotate low sample sizes and do not make decisions from isolated single-week movements.

## 8. Release gates

- [ ] Existing production GA4/GTM configuration inspected; duplicate page_view risk resolved.
- [ ] Astro production consent integration reviewed and tested.
- [ ] Preview remains noindex/nofollow and analytics-disabled.
- [ ] No PII or visitor-entered data in analytics payloads.
- [ ] PT/EN page and service taxonomy validated.
- [ ] Contact, quote, catalogue and confirmed-lead events pass DebugView tests.
- [ ] Resend and official intake remain unchanged and operational.
- [ ] GA4 and Search Console reporting scopes are documented separately.
- [ ] Post-cutover baseline and rollback checks are ready.

## 9. Current decision

This document defines the analytics requirements for PR #316. It does not activate tracking in preview, change the live GA4 property, modify GTM, Cookiebot, Resend, DNS or the production website, or authorise a merge or deployment. Production analytics must only be enabled as part of an explicitly approved release after the gates above pass.


## 10. Implementation added to PR #316 — 26 November 2026

The following code has now been added to the Astro branch:

- `src/scripts/analytics.ts`: a production-host-only GTM loader, guarded by `PUBLIC_ANALYTICS_ENABLED=true`, an indexed production build, and Cookiebot Statistics consent. It keeps advertising consent denied, excludes noindex and private operational routes, and sends only allowlisted event values.
- `BaseLayout.astro`: Cookiebot and the analytics module are rendered only when the production indexing and explicit analytics build flags are both enabled. Render/Vercel/Cloudflare preview builds remain analytics-disabled by default.
- Event instrumentation has been added for service-page views, AI-assistant referral provider, phone/email/WhatsApp clicks, quote CTAs, PDF downloads, approved catalogue opens and form submission attempts. Form field values, full URLs, query strings, search text, names, emails, phone numbers, RFQ content and private identifiers are not included in event payloads.
- `generate_lead` is separate from `form_submit` and is only emitted when a trusted success handler dispatches `hmatias:lead-confirmed` after a server-confirmed receipt. No existing form has been changed to claim success without that confirmation.
- Node regression checks have been added to `npm run verify` for production gating, consent, advertising defaults, PII exclusions and the distinction between form attempts and confirmed leads.
- The production GA4 direct loader is deliberately not copied into Astro. GTM is the single tag-loader path for the Astro release, avoiding a second direct GA4 configuration in this new layout.

### Validation still blocked

- The connected GSC Wizard account refused the GA4 property inspection because its trial ended / it has no active subscription (`payment_required`). The linked GA4 property, configured key events and custom dimensions therefore could not be read in this session.
- The GTM container workspace/configuration is not available through the connected tools. Its GA4 Configuration/Google tag, page_view behaviour, custom event triggers and consent checks must be inspected in Google Tag Manager before the production flag is enabled.
- Until that inspection is complete, keep `PUBLIC_ANALYTICS_ENABLED` unset/false. Do not enable GA4/GTM in production and do not claim that events are arriving in GA4.
- After GTM inspection, configure the GTM container to receive the named dataLayer events, define the agreed GA4 key events (only confirmed `generate_lead` should count as a lead conversion), and test in Preview/DebugView and GA4 Realtime. Confirm there is exactly one page_view per page load.

### Current safe configuration

- `PUBLIC_ANALYTICS_ENABLED`: unset or `false` for all preview environments.
- `PUBLIC_INDEXING_ENABLED`: remains `false` for previews.
- Production enablement requires an approved production build with `PUBLIC_INDEXING_ENABLED=true`, `PUBLIC_ANALYTICS_ENABLED=true`, the verified GTM container ID and the Cookiebot consent ID.
- No production environment variables, GTM container, GA4 property, Cookiebot account, Resend route, DNS, production site, merge or deployment were changed by this implementation.
