# Source AO — by HMATIAS

## Product position
Source AO is not a generic marketplace and not a search-results directory. It is an Angola-focused commercial search and sourcing layer designed to answer a harder question:

> Who can actually supply or execute this requirement, where, and how recently was that information verified?

Public experience stays simple. The intelligence sits behind the interface.

## Core product

### 1. Search
One search box for materials, equipment and services.
- understand aliases and common wording;
- normalise specifications;
- classify the request;
- search by location;
- never convert an unverified mention into an availability claim.

### 2. Radar
A requirement can stay active when there is no verified answer yet.
Radar is designed to monitor:
- Materials Radar — products, sizes, specifications, parts and consumables;
- Services Radar — companies, technicians and contractors;
- Opportunities Radar — RFQs, small contracts, supply requests, maintenance and subcontracting opportunities.

Radar states:
1. Found
2. Source checked
3. Supplier confirmed
4. In-stock confirmed
5. Needs reconfirmation
6. Unavailable

### 3. Verification layer
Every current-market claim must carry:
- source;
- verification timestamp;
- verification status;
- freshness window;
- evidence reference where appropriate.

AI may classify, deduplicate, translate and rank information. AI may NOT upgrade the verification state.

### 4. Sourcing request
When no verified result exists, the user can send a structured request with:
- item or service;
- specification;
- quantity;
- delivery location;
- urgency.

HMATIAS can then perform commercial validation and quotation work.

## Data strategy
Source AO should build a first-party commercial index over time.

Priority sources:
1. direct supplier confirmation;
2. supplier official channels;
3. documented partner feeds;
4. structured marketplaces;
5. business directories;
6. social media posts;
7. general web discovery.

A public web result is discovery evidence, not stock evidence.

## UX rule
The public interface should remain short:
- Search
- Results
- Radar
- Request sourcing

No fake counters, fake supplier totals, invented prices or decorative dashboards.

## Language
Default: English.
Toggle: Portuguese (Angola).

## Brand relationship
Display: `Source AO — by HMATIAS`
HMATIAS main website remains independent and unchanged during Source AO development.

## Current MVP status
Implemented in branch `source-ao-v1`:
- responsive premium landing/search UI;
- English default + Portuguese toggle;
- search interpretation and category classification;
- public-source search handoff;
- local Radar watch list;
- structured HMATIAS sourcing request via WhatsApp;
- verification/freshness data contract.

## Next implementation milestones
1. Real supplier database and admin ingestion.
2. Source connectors and evidence capture.
3. Automated freshness expiry.
4. Supplier confirmation workflow.
5. Search ranking based on specification + location + verification.
6. Opportunity Radar for HMATIAS commercial team.
7. Only after validation: controlled public deployment on a Source AO subdomain/domain.
