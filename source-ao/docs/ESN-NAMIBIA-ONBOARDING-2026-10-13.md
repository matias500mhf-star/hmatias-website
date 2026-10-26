# Source AO — Evolution Safety Namibia (ESN) | Supplier qualification
Date: 2026-10-13
Owner: HMATIAS Supply / Source AO
Market: Namibia (material procurement), **not** Angola opportunity / tender radar

## Evidence and current status
- Identity: **Evolution Safety Namibia**, Walvis Bay, Namibia.
- Official website: https://www.esn.com.na/
- Company-published business contact: sales@esn.com.na; +264 83 723 3790.
- Source-check date: 2026-10-13 (Africa/Luanda).
- Evidence level: **source_checked**. Source pages identify a supplier/catalogue range; they do not certify stock, prices, delivery capability, authorisation to resell in Angola, product conformity or commercial relationship with HMATIAS.
- Commercial relationship: **not yet established**; outreach prepared but not sent from Source AO.
- Availability: **unknown / on request**; do not use `supplier_confirmed` or `in_stock_confirmed` without dated first-party commercial evidence.

## One supplier, seven indexed brand pages

| Brand | Supplier page | Indicative range (catalogue page only) |
|---|---|---|
| Wenaas | https://www.esn.com.na/wenaas | FR/multinorm workwear, footwear, gloves, offshore, visibility |
| Vulcan | https://www.esn.com.na/vulcan | Workwear |
| Brady | https://www.esn.com.na/brady | Lockout/tagout, area marking, identification |
| Karam | https://www.esn.com.na/karam | Fall arrest, fixed-line systems, PPE |
| Blackline | https://www.esn.com.na/blackline | Connected gas/safety technology |
| Mechanix | https://www.esn.com.na/mechanix | Protective work gloves |
| Wiley X | https://www.esn.com.na/wiley | Protective eyewear |

These brands are stored as **capability/search terms associated with one supplier**, not seven separate companies. No prices, stock figures, product variants or certifications were ingested.

## Private commercial qualification (not public website content)
1. Send B2B introduction to `sales@esn.com.na` from `geral@comercialhmatiasps.com` using an approved channel. Avoid describing ESN as a current HMATIAS partner.
2. Request B2B price structure, tax/export treatment, minimum order, payment terms, shipping Incoterms, lead times, brand coverage and reseller restrictions for Angola.
3. For each client RFQ, confirm **exact SKU, technical standard, certification, quantity, lead time, currency, shipment terms and cost landed in Luanda** separately.
4. Use the private `POST /api/admin/sourcing-suppliers` operator workflow to create/qualify the associated private sourcing supplier only after authenticated review; use country `NA`, market channel `regional`, role `supplier`, quality `source_checked`, availability `unknown` and the seven brands. Do not commit private access tokens, quotes, margin details or confidential contacts to the repository.
5. Validate database seed import and the private Angola-first/regional fallback process in staging before production. The public search must not reveal private supplier shortlists/contact details.
6. Promote commercial state only on documented response and internal review. Record responses in secure desk, not in public indexed HTML/JSON.

## Implementation boundary
- `data/suppliers.json`: curated ESN public source, brands and technical search aliases.
- `backend/src/smart-search.js`: PPE/workwear intent detection aligned with existing public catalogue item families.
- Live Cloudflare D1 supplier records are **not** updated by committing JSON alone. Follow the Source AO runbook, seed/migration flow, staging acceptance and explicit production release gates.
- The homepage, public website design, forms and unrelated supplier records must remain untouched.
