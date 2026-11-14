# Source AO — Public Partner Catalogue Model

## Purpose

The partner catalogue is a public product-discovery layer for Source AO. Visitors may browse and search published partner products without creating an account. A visitor may select products, quantities and specifications and carry those selections into the existing RFQ workflow.

Source AO remains a procurement and sourcing intake platform. It does not sell products, accept payment, collect money, hold stock or execute transactions.

## Public data boundary

The public feed is `data/partner-catalog.json`. It is copied to public web assets alongside the existing catalogue data. It must contain only records explicitly approved for publication.

- A partner is public only when `publication_status` is `approved`.
- A product is public only when `publication_status` is `published`.
- Every product must have at least one image that the partner has authorised HMATIAS to publish.
- Supplier private contacts, internal notes, acquisition costs, margins, profit, credentials and private evidence references must never enter this feed.
- Partner identity and logo are shown only where the partner has authorised public attribution. Otherwise use the approved public display identity agreed with that partner.

The existing `data/suppliers.json` is a sourcing research/operations dataset. Its entries are not automatically partner approvals and must not be copied into the public catalogue as partner records.

## Product record

A published product should include, where available:

- stable product ID and partner ID;
- public product name, category and description;
- brand, model, reference/SKU and technical specifications;
- one or more authorised product images with descriptive alt text;
- product or manufacturer reference URL;
- publication and update timestamps;
- availability state and last-confirmed timestamp;
- optional public price only where the partner explicitly authorises publication.

Do not invent missing attributes. Omit unknown brand, model, price or dimensions rather than filling them with generic values.

## Availability vocabulary

- `unknown`: no current information has been obtained;
- `confirmation_pending`: HMATIAS or the partner is checking;
- `in_stock_confirmed`: direct, dated confirmation exists and has not expired;
- `out_of_stock`: supplier has confirmed no available stock;
- `made_to_order`: supply depends on production or a new order;
- `discontinued`: product is no longer offered.

A catalogue listing is not proof of stock. `in_stock_confirmed` requires a confirmation timestamp, expiry and method. When confirmation expires, the interface must downgrade the state and must not continue displaying the item as confirmed.

## RFQ hand-off

The public catalogue must hand selected product IDs, descriptions, quantities, units and customer specifications into the existing RFQ form. The RFQ backend remains responsible for validation, encrypted request storage, private tracking and commercial workflow.

The public RFQ must not expose supplier acquisition prices, negotiated supplier terms, HMATIAS margins or internal supplier contacts. Customer proposals are prepared and reviewed by HMATIAS staff outside the public catalogue.

## Partner onboarding and publication workflow

1. Receive the partner's catalogue (PDF, XLSX, CSV, product feed or approved website source).
2. Confirm written permission to use product descriptions, trademarks and images.
3. Extract product records and map them to Source AO categories.
4. Validate technical fields, image rights, URLs and duplicates.
5. Obtain partner confirmation of the public display name and availability wording.
6. HMATIAS reviews and approves the partner and each product batch.
7. Publish only approved records to `partner-catalog.json`.
8. Reconfirm availability on a defined schedule and unpublish stale or withdrawn products.

No supplier is represented as a formal HMATIAS partner merely because it appears in an internal research list or has a public website.

## Initial release boundary

The public feed is intentionally empty until HMATIAS receives and approves real partner catalogues and image permissions. No sample products, stock quantities, prices or partner endorsements are fabricated to make the catalogue appear populated.

The first implementation milestone establishes the data contract, public asset delivery and automated quality checks. The public catalogue browsing interface and RFQ product-selection integration follow once the first approved partner catalogue is available for accurate acceptance testing.
