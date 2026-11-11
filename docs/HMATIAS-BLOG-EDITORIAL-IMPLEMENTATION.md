# HMATIAS Editorial Blog — Implementation Brief

Status: implementation in progress; not published.

## Purpose
Build a bilingual Portuguese (Angola) and English editorial section that demonstrates practical expertise, explains business and technical topics relevant to Angola, and creates qualified enquiries for HMATIAS services.

## Editorial areas (future taxonomy)
The editorial plan covers four areas:
1. Construção Civil e Engenharia em Angola — Construction & Engineering in Angola
2. Procurement e Supply — Procurement & Supply
3. Facilities e Manutenção — Facilities & Maintenance
4. Mercado Empresarial e Oportunidades em Angola — Business Market & Opportunities in Angola

Do not display empty category lists or non-functional category controls. Introduce visible category navigation only when each category has enough published content to support useful browsing. At launch, keep the landing page focused on the publication introduction and one featured article.

## Visual and reading standard
- Preserve the approved HMATIAS navy/blue palette and Inter typography; the blog is an editorial adaptation of the institutional identity, not a separate brand.
- Use light backgrounds, restrained accents, generous whitespace, readable type sizes and a clear title/body hierarchy.
- Prioritise one strong editorial feature and direct navigation over empty modules, decorative panels or excessive image galleries.
- Keep article reading width comfortable and responsive on desktop and mobile.

## First article
PT: Como estruturar um pedido de cotação de fornecimento para empresas em Angola
EN: How to Prepare a Supply Request for Quotation for Businesses in Angola

The article must explain, in practical terms:
- a precise description and technical specification;
- quantity, unit of measure and acceptable alternatives;
- delivery location, required date and delivery conditions;
- supporting documents or compliance requirements, only where relevant;
- quotation validity, payment terms, taxes and transport as separate commercial items;
- how to compare offers on equivalent scope, not price alone;
- how to record clarifications, changes and supplier confirmation.

## Accuracy and trust rules
- Do not invent HMATIAS projects, clients, supplier relationships, stock, prices, certifications, licences, delivery capacity or results.
- Clearly distinguish general guidance from legal or regulatory requirements.
- Do not present supplier discovery as proof of current stock, price or availability.
- HMATIAS does not claim to own general merchandise inventory; supply is handled on request and commercial details must be confirmed for each enquiry.
- No fabricated case studies, testimonials, statistics or AI-generated imagery that could be mistaken for real HMATIAS work.
- Use official primary sources for any legal, regulatory, statistical or public-procurement claim, with publication/update dates and direct references.
- Each PT article must have a genuine EN counterpart; avoid machine-translated duplication.
- Every article must have a named editorial owner or HMATIAS institutional attribution, publication/update dates, canonical URL, reciprocal hreflang, Open Graph metadata and appropriate Article/BlogPosting structured data.
- Keep pages fast, accessible, mobile-first and consistent with the approved Inter typography and navy/blue HMATIAS identity.

## Technical boundaries
- Do not redesign or edit the homepage.
- Do not change existing approved service-page content or navigation until the blog pages and links are validated.
- Work on this isolated feature branch; do not publish to production directly.
- Include PT and EN listing pages and articles, sitemap entries, internal links to relevant HMATIAS service pages and automated integrity checks. Add category navigation only when it points to populated, useful destinations.
- Review existing open PRs #303, #304 and #305 before integrating any overlapping sitemap or shared-site changes. Do not merge or duplicate those PRs as part of this work.
- Publication requires desktop/mobile, accessibility, metadata, canonical/hreflang, sitemap, internal-link and performance checks.
