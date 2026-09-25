# Source AO — Smart Search v2

Status: implementation foundation on `feature/source-ao-ai-search-v2-20260925`.

## Goal

Turn a vague or locally named requirement into a structured sourcing plan that works for Angola, where supplier catalogues are often incomplete, poorly indexed or published under different product names.

## What v2 adds

- semantic family detection;
- Portuguese/English query expansion;
- automatic extraction of common technical dimensions and quantity expressions;
- urgency detection;
- Angola-first search lanes;
- explicit separation between discovery and commercial confirmation;
- no fabricated stock, price or availability.

The first real acceptance case is:

> cinta PP 9 mm, 1 rolo, Luanda, urgente

Expected interpretation:

- family: packaging strapping;
- category: industrial supply;
- aliases include fita de arquear PP / PP strapping / polypropylene strapping;
- 9 mm is retained as a technical specification;
- one roll is retained as quantity;
- urgent mode prioritises local supplier discovery and direct RFQ confirmation.

## Trust rule

Smart Search creates a sourcing plan. It does **not** convert a discovered supplier into confirmed stock. Stock, price, delivery and commercial availability remain subject to traceable supplier/source confirmation and human review.

## Next production layer

The search-plan endpoint is designed to feed collectors and supplier discovery adapters. External web/business-directory/social-source collectors should be connected only with source attribution, freshness timestamps, rate controls and the existing Evidence Policy.
