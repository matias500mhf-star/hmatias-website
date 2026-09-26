# Source AO — Market Coverage

Source AO is an Angola-first procurement intelligence product. Regional coverage is deliberately separated by market so source provenance, currency, eligibility and operational risk are not blended.

## Angola

- Country code: `AO`
- Currency: `AOA`
- Role: primary HMATIAS market
- Initial official source: Portal da Contratação Pública / SNCP
- Public rule: a source and future deadline are required before an opportunity can be promoted to the public Radar.

## Namibia

- Country code: `NA`
- Currency: `NAD`
- Initial official source: Central Procurement Board of Namibia (CPBN) — Open Bids
- Source: https://www.cpbn.com.na/index/external/2
- Discovery adapter: HTML index + traceable bid detail page
- Important review: foreign-bidder eligibility, local participation/preference requirements, document fees, site meetings, tax/logistics and possible Namibian partner requirements.

## South Africa

- Country code: `ZA`
- Currency: `ZAR`
- Initial official source: National Treasury eTenders OCDS API
- API: https://ocds-api.etenders.gov.za/api/OCDSReleases
- Documentation: https://ocds-api.etenders.gov.za/swagger/index.html
- Discovery adapter: OCDS release package with a rolling date query and bounded page size.
- Important review: supplier eligibility, tender-specific registration, preferential procurement requirements, tax status, local execution and logistics.

National Treasury states that its transparency data reflects procurement information shared with it and is not necessarily a complete record of every South African procurement process. Source AO therefore treats the feed as a discovery source, not a completeness guarantee.

## Regional trust rules

1. Country and currency are stored on the source, candidate and promoted opportunity.
2. Deduplication includes country so identical references in different jurisdictions do not collide.
3. Automated discovery never publishes directly.
4. Human review confirms contracting entity, location, deadline and source before promotion.
5. A foreign-market opportunity triggers a cross-border review recommendation instead of automatic direct bid.
6. Public users are always directed back to the original source and procurement documents.
7. Expired opportunities are removed from active public results by maintenance.
