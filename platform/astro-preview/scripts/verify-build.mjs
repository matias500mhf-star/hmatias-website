import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSiteUrl } from "./site-url.mjs";

const outDir = fileURLToPath(new URL("../dist/", import.meta.url));
const indexPath = join(outDir, "index.html");
assert.ok(existsSync(indexPath), "Astro build must generate dist/index.html");

const html = readFileSync(indexPath, "utf8");
const configuredSite = new URL(resolveSiteUrl(process.env));
const expectedHomepageCanonical = new URL("/", configuredSite).toString();
assert.ok(
  html.includes(`<link rel="canonical" href="${expectedHomepageCanonical}"`),
  "Homepage canonical must use the resolved deployment host",
);
const productionIndexingEnabled = process.env.PUBLIC_INDEXING_ENABLED === "true"
  && configuredSite.protocol === "https:"
  && configuredSite.hostname === "comercialhmatiasps.com";
const expectedRobotsPattern = productionIndexingEnabled
  ? /name="robots" content="index, follow"/
  : /name="robots" content="noindex, nofollow"/;
assert.match(html, /<html lang="pt-AO"/, "Portuguese Angola document language must be present");
assert.match(html, expectedRobotsPattern, productionIndexingEnabled ? "Official production build must be indexable" : "Preview must not be indexed");
const robotsTxtPath = join(outDir, "robots.txt");
assert.ok(existsSync(robotsTxtPath), "Every deployment must publish an explicit robots.txt");
const robotsTxt = readFileSync(robotsTxtPath, "utf8");
if (productionIndexingEnabled) {
  assert.ok(robotsTxt.includes("User-agent: *\nAllow: /"), "Production robots.txt must allow crawling");
  assert.ok(robotsTxt.includes("Sitemap: https://comercialhmatiasps.com/sitemap.xml"), "Production robots.txt must reference the official sitemap");
  const sitemapPath = join(outDir, "sitemap.xml");
  assert.ok(existsSync(sitemapPath), "Indexable production build must generate sitemap.xml");
  const sitemapXml = readFileSync(sitemapPath, "utf8");
  assert.ok(sitemapXml.includes("http://www.sitemaps.org/schemas/sitemap/0.9"), "Production sitemap XML namespace is missing");
  assert.ok(sitemapXml.includes("https://comercialhmatiasps.com/"), "Production sitemap must include canonical official URLs");
  assert.ok((sitemapXml.match(/<url>/g) || []).length >= 40, "Production sitemap must include the complete public page set");
} else {
  assert.ok(robotsTxt.includes("User-agent: *\nDisallow: /"), "Preview robots.txt must block crawling");
  assert.ok(!existsSync(join(outDir, "sitemap.xml")), "No indexable sitemap may be emitted for a noindex preview");
}
assert.match(html, /property="og:title"/, "Open Graph title is missing");
assert.match(html, /property="og:description"/, "Open Graph description is missing");
assert.match(html, /name="twitter:card" content="summary_large_image"/, "Twitter card metadata is missing");
assert.match(html, /Capacidade para/, "Homepage hero is missing");
assert.match(html, /geral@comercialhmatiasps\.com/, "Commercial email is missing");
assert.match(html, /info@comercialhmatiasps\.com/, "Institutional email is missing");
assert.match(html, /Viana, Bairro 1 de Maio/, "Company address is missing");
assert.match(html, /WhatsApp/, "WhatsApp contact is missing");
assert.match(html, /Construção/, "Footer construction links are missing");
assert.match(html, /Serviços/, "Footer services links are missing");
assert.match(html, /Contacto e localização/, "Footer contact column is missing");
assert.match(html, /Todos os direitos reservados/, "Footer legal copyright line is missing");
assert.match(html, /Voltar ao topo/, "Footer back-to-top link is missing");
const mainNavHtml = html.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(mainNavHtml, "Primary navigation is missing");
for (const label of ["Início", "Sobre nós", "Áreas de negócio", "Projetos", "SOURCE AO", "Blog", "Solicitar orçamento"]) {
  assert.ok(mainNavHtml.includes(label), "Portuguese primary navigation is missing: " + label);
}
for (const href of ["/#inicio", "/empresa/", "/credibilidade/", "/#parceiros", "/#servicos", "/construcao/", "/facilities/", "/supply/", "/business-services/", "/#projetos", "/catalogo-obras/", "/estaleiro/", "/source-ao/", "/source-ao/radar/", "/source-ao/smart-rfq/", "/source-ao/parceiros/", "/blog/"]) {
  assert.ok(mainNavHtml.includes('href="' + href + '"'), "Portuguese primary navigation destination is missing: " + href);
}
assert.doesNotMatch(mainNavHtml, /instagram|wa\.me/i, "Social networks must remain outside the primary navigation");
assert.match(html, /mailto:geral@comercialhmatiasps\.com/, "Footer commercial mail link is missing");
assert.match(html, /tel:\+244948806673/, "Footer telephone link is missing");
assert.match(html, /SOURCE AO/, "Source AO footer link is missing");
for (const [relativePath, destination] of [
  ["areas-de-negocio/index.html", "/#servicos"],
  ["en/business-areas/index.html", "/en/#services"],
]) {
  const redirectPath = join(outDir, relativePath);
  assert.ok(existsSync(redirectPath), `Retired business-area URL must remain available as a redirect: /${relativePath}`);
  const redirectHtml = readFileSync(redirectPath, "utf8");
  assert.match(redirectHtml, /http-equiv=["']refresh["']/i, `Retired route must redirect automatically: /${relativePath}`);
  assert.ok(redirectHtml.includes(destination), `Retired route must lead to ${destination}: /${relativePath}`);
}

const publicSourceAoCatalogPath = join(outDir, "api", "source-ao", "catalog.json");
assert.ok(existsSync(publicSourceAoCatalogPath), "Sanitised static SOURCE AO catalogue endpoint must be generated");
const publicSourceAoCatalog = JSON.parse(readFileSync(publicSourceAoCatalogPath, "utf8"));
assert.equal(publicSourceAoCatalog.version, "1.0", "Static public catalogue version must match the reviewed release");
assert.equal(publicSourceAoCatalog.items.length, 135, "Static public catalogue must include all 135 approved public entries");
assert.equal(publicSourceAoCatalog.items.filter((item) => item.id.startsWith("item-carbodiam-sku-")).length, 43,
  "Static public catalogue must include all 43 exact Carbodiam SKU references");
assert.ok(!publicSourceAoCatalog.items.some((item) => item.id === "item-formaldehyde"),
  "Restricted chemical item must remain excluded from the public catalogue");
const publicCatalogueItemKeys = new Set(["id", "name", "aliases", "category", "subcategory", "specification", "keywords", "name_pt"]);
for (const item of publicSourceAoCatalog.items) {
  for (const key of Object.keys(item)) {
    assert.ok(publicCatalogueItemKeys.has(key), `Unapproved field ${key} in static public catalogue item ${item.id}`);
  }
}
assert.match(publicSourceAoCatalog.public_rule, /Prices, suppliers, stock, availability and internal commercial data are not included/,
  "Static public catalogue must declare its privacy boundary");

const sourceAoLanding = readFileSync(join(outDir, "source-ao", "index.html"), "utf8");
assert.ok(sourceAoLanding.includes('href="/source-ao/radar/"'), "SOURCE AO landing page must link to the opportunity Radar");
assert.ok(sourceAoLanding.includes('href="/source-ao/parceiros/"'), "SOURCE AO landing page must link to the partner application");
const sourceAoLandingEn = readFileSync(join(outDir, "en", "source-ao", "index.html"), "utf8");
assert.ok(sourceAoLandingEn.includes('href="/en/source-ao/radar/"'), "English SOURCE AO landing page must link to the opportunity Radar");
assert.ok(sourceAoLandingEn.includes('href="/en/source-ao/partners/"'), "English SOURCE AO landing page must link to the partner application");
assert.match(html, /Blog · Perspetivas empresariais/, "Blog footer link is missing");

const footerHtml = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0];
assert.ok(footerHtml, "Homepage footer is missing");
const portugueseFooterOrder = ["footer-identity", "footer-explore", "footer-operations", "footer-contacts"]
  .map((className) => footerHtml.indexOf('class="footer-column ' + className + '"'));
assert.ok(portugueseFooterOrder.every((position) => position >= 0), "Every Portuguese footer column must be present");
assert.ok(portugueseFooterOrder.every((position, index) => index === 0 || position > portugueseFooterOrder[index - 1]), "Portuguese footer order must be Identity, Explore, Operational Areas, Contact");
assert.equal((footerHtml.match(/class="footer-column footer-(?:identity|operations|explore|contacts)"/g) || []).length, 4, "Footer must have four organised columns");
const operationsHtml = footerHtml.match(/<nav class="footer-column footer-operations"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(operationsHtml, "Operational areas footer column is missing");
assert.equal((operationsHtml.match(/class="footer-area-link"/g) || []).length, 4, "Footer must list the four HMATIAS operational areas");
assert.equal((operationsHtml.match(/class="footer-subnav"/g) || []).length, 1, "Construction must contain one nested resources group");
assert.match(operationsHtml, /href="\/catalogo-obras\//, "Works catalogue must be nested under Construction");
assert.match(operationsHtml, /href="\/estaleiro\//, "Development project must be nested under Construction");
assert.doesNotMatch(operationsHtml, /KARTA Wallet/, "KARTA must remain outside operational areas");
assert.ok(footerHtml.includes('href="/karta/">KARTA Wallet · Projeto Alpha'), "Portuguese footer Explore must link to KARTA Alpha");
const exploreHtml = footerHtml.match(/<nav class="footer-column footer-explore"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(exploreHtml, "Explore footer column is missing");
assert.equal((exploreHtml.match(/<a\b/g) || []).length, 4, "Explore must contain exactly four links");
assert.match(exploreHtml, /footer-source-link/, "SOURCE AO must receive a restrained Explore accent");
assert.doesNotMatch(exploreHtml, /Smart RFQ|Projetos|Catálogo de Obras/, "Construction resources must not be duplicated in Explore");
assert.doesNotMatch(html, /<section class="karta-feature"/, "KARTA must not be a homepage section");
assert.doesNotMatch(html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "", /SOURCE AO|source-ao-highlight/i, "Portuguese homepage main content must not promote SOURCE AO");
assert.match(footerHtml ?? "", /footer-source-link/, "SOURCE AO must remain accessible from the footer");
const englishHomeHtml = readFileSync(join(outDir, "en", "index.html"), "utf8");
const englishNavHtml = englishHomeHtml.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(englishNavHtml, "English primary navigation is missing");
for (const label of ["Home", "About us", "Business areas", "Projects", "SOURCE AO", "Blog", "Request a quote"]) {
  assert.ok(englishNavHtml.includes(label), "English primary navigation is missing: " + label);
}
for (const href of ["/en/#inicio", "/en/about/", "/en/credibility/", "/en/#partners", "/en/#services", "/en/construction/", "/en/facilities/", "/en/supply/", "/en/business-services/", "/en/#projetos", "/en/works-catalogue/", "/en/integrated-yard/", "/en/source-ao/", "/en/source-ao/radar/", "/en/source-ao/smart-rfq/", "/en/source-ao/partners/", "/en/blog/"]) {
  assert.ok(englishNavHtml.includes('href="' + href + '"'), "English primary navigation destination is missing: " + href);
}
assert.doesNotMatch(englishNavHtml, /instagram|wa\.me/i, "Social networks must remain outside the English primary navigation");
const englishFooterHtml = englishHomeHtml.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0];
assert.ok(englishFooterHtml, "English homepage footer is missing");
const englishFooterOrder = ["footer-identity", "footer-explore", "footer-operations", "footer-contacts"]
  .map((className) => englishFooterHtml.indexOf('class="footer-column ' + className + '"'));
assert.ok(englishFooterOrder.every((position) => position >= 0), "Every English footer column must be present");
assert.ok(englishFooterOrder.every((position, index) => index === 0 || position > englishFooterOrder[index - 1]), "English footer order must be Identity, Explore, Operational Areas, Contact");
assert.ok(englishFooterHtml.includes('href="/en/karta/">KARTA Wallet · Alpha project'), "English footer Explore must link to KARTA Alpha");
const englishOperationsHtml = englishFooterHtml.match(/<nav class="footer-column footer-operations"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(englishOperationsHtml, "English operational areas footer column is missing");
assert.equal((englishOperationsHtml.match(/class="footer-area-link"/g) || []).length, 4, "English footer must list the four operational areas");
assert.match(englishOperationsHtml, /href="\/en\/works-catalogue\//, "English works catalogue must be nested under Construction");
assert.match(englishOperationsHtml, /href="\/en\/integrated-yard\//, "English projects must be nested under Construction");
const englishExploreHtml = englishFooterHtml.match(/<nav class="footer-column footer-explore"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert.ok(englishExploreHtml, "English Explore footer column is missing");
assert.equal((englishExploreHtml.match(/<a\b/g) || []).length, 4, "English Explore must contain exactly four links");
assert.doesNotMatch(englishHomeHtml.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "", /SOURCE AO|source-ao-highlight/i, "English homepage main content must not promote SOURCE AO");
assert.doesNotMatch(englishHomeHtml, /<section class="karta-feature"/, "KARTA must not be an English homepage section");
assert.ok(html.includes('href="/empresa/">Sobre a HMATIAS'), "Footer About link must point to the About page");
assert.ok(html.includes('href="/credibilidade/">Credibilidade'), "Footer credibility link must point to the credibility page");
assert.match(html, /Política de Privacidade/, "Privacy Policy footer link is missing");
assert.match(html, /Política de Cookies/, "Cookie Policy footer link is missing");
assert.match(html, /Termos e Condições/, "Terms footer link is missing");
assert.match(html, /Acessibilidade/, "Accessibility footer link is missing");
assert.match(html, /5001578065/, "Company tax number is missing");
assert.match(html, /24\.094-23/, "Company commercial registration is missing");
assert.match(html, /Instagram/, "Instagram footer link is missing");

for (const activity of ["Construção e remodelação", "Facilities e manutenção", "Supply e procurement", "Business Services"]) {
  assert.ok(html.includes(activity), `Activity missing: ${activity}`);
}
for (const project of ["Galpão com estrutura metálica", "Preparação de terreno", "Substituição de cobertura", "Pavilhões rurais concluídos"]) {
  assert.ok(html.includes(project), `Project missing: ${project}`);
}

const blogPath = join(outDir, "blog", "index.html");
assert.ok(existsSync(blogPath), "Blog page must be generated");
const blogHtml = readFileSync(blogPath, "utf8");
assert.match(blogHtml, /Perspetivas empresariais/, "Blog page content is missing");
assert.ok(blogHtml.includes("/blog/como-preparar-um-pedido-de-cotacao/"), "Blog must link to its published Supply guide");
assert.ok(!blogHtml.includes("EM PREPARAÇÃO"), "The blog must not present the featured article as a placeholder");
assert.match(blogHtml, /editorial-feature-visual/, "Featured Blog article must include an editorial image");
assert.match(blogHtml, /Imagem ilustrativa/, "Portuguese Blog must label editorial imagery as illustrative");
assert.match(blogHtml, /Crédito fotográfico/, "Portuguese Blog must credit editorial photography");
assert.match(blogHtml, /images\.unsplash\.com/, "Portuguese Blog must use its approved illustrative image source");
const englishBlogHtml = readFileSync(join(outDir, "en", "blog", "index.html"), "utf8");
assert.match(englishBlogHtml, /Illustrative image only/, "English Blog must label editorial imagery as illustrative");
assert.match(englishBlogHtml, /Photo credit/, "English Blog must credit editorial photography");
assert.match(englishBlogHtml, /images\.unsplash\.com/, "English Blog must use its approved illustrative image source");

const supplyGuidePath = join(outDir, "blog", "como-preparar-um-pedido-de-cotacao", "index.html");
assert.ok(existsSync(supplyGuidePath), "The published HMATIAS Supply guide must be generated");
const supplyGuideHtml = readFileSync(supplyGuidePath, "utf8");
assert.match(supplyGuideHtml, /Como preparar um pedido de cotação/, "Supply guide title is missing");
assert.match(supplyGuideHtml, /quantidade e unidade/i, "Supply guide must explain quantities and units");
assert.match(supplyGuideHtml, /local de entrega/i, "Supply guide must explain delivery destination");
assert.match(supplyGuideHtml, /até 20 linhas/i, "Supply guide must reflect the Smart RFQ item limit");
assert.ok(supplyGuideHtml.includes('href="/source-ao/smart-rfq/"'), "Supply guide must link to Smart RFQ");
assert.match(supplyGuideHtml, /article-cover-figure/, "Supply article must include its editorial cover image");
assert.match(supplyGuideHtml, /Imagem ilustrativa/, "Supply article must disclose that its cover image is illustrative");
assert.match(supplyGuideHtml, /Crédito fotográfico/, "Supply article must credit its editorial cover image");
const accessibilityPath = join(outDir, "acessibilidade", "index.html");
assert.ok(existsSync(accessibilityPath), "Accessibility page must be generated");
const accessibilityHtml = readFileSync(accessibilityPath, "utf8");
assert.match(accessibilityHtml, /acessibilidade/i, "Accessibility page content is missing");

const kartaPath = join(outDir, "karta", "index.html");
assert.ok(existsSync(kartaPath), "KARTA Alpha page must be generated");
const kartaHtml = readFileSync(kartaPath, "utf8");
assert.match(kartaHtml, /KARTA Wallet Mobile/, "KARTA product name is missing");
assert.match(kartaHtml, /A sua identidade\. Os seus documentos\. O seu controlo\./, "KARTA positioning is missing");
assert.match(kartaHtml, /ESTADO DO PRODUTO/, "KARTA status section is missing");
assert.match(kartaHtml, />ALPHA</, "KARTA must retain its Alpha status");
assert.match(kartaHtml, /não disponível para download público/i, "KARTA must not claim public availability");
assert.match(kartaHtml, /objetivos futuros/i, "KARTA roadmap must be distinguished from current capabilities");
assert.match(kartaHtml, /mailto:geral@comercialhmatiasps\.com\?subject=KARTA%20Wallet/, "KARTA interest handoff must use the published email channel");

const yardPath = join(outDir, "estaleiro", "index.html");
assert.ok(existsSync(yardPath), "Integrated Yard page must be generated");
const yardHtml = readFileSync(yardPath, "utf8");
assert.match(yardHtml, /Estaleiro Integrado HMATIAS/, "Integrated Yard title is missing");
assert.match(yardHtml, /378,53 m²/, "Integrated Yard plot area is missing");
assert.match(yardHtml, /15,141 × 25 m/, "Integrated Yard plot dimensions are missing");
assert.match(yardHtml, /Armazém compacto com cobertura lateral/, "Integrated Yard Alternative A is missing");
assert.match(yardHtml, /Armazém ampliado com acesso lateral/, "Integrated Yard Alternative B is missing");
assert.match(yardHtml, /Estudo preliminar de implantação/, "Integrated Yard preliminary status is missing");
assert.match(yardHtml, /não substituem os projetos de arquitetura e especialidades/, "Integrated Yard technical disclaimer is missing");
assert.doesNotMatch(yardHtml, /obra concluída|instalação concluída/i, "Integrated Yard must not be presented as completed");
assert.equal((yardHtml.match(/class="yard-plan-image"/g) || []).length, 2, "Both dimensioned yard plans must be rendered");
assert.equal((yardHtml.match(/<img\b[^>]*\balt=/g) || []).length, (yardHtml.match(/<img\b/g) || []).length, "Every yard image must have alt text");

const constructionPath = join(outDir, "construcao", "index.html");
assert.ok(existsSync(constructionPath), "Construction page must be generated");
const constructionHtml = readFileSync(constructionPath, "utf8");
assert.match(constructionHtml, /Construção e/, "Construction page title is missing");
assert.match(constructionHtml, /Pavilhões rurais concluídos/, "Construction page project content is missing");
assert.match(constructionHtml, /Pedido de orçamento/i, "Construction page contact section is missing");
assert.match(constructionHtml, /href="https:\/\/wa\.me\/244948806673\?text=/, "Construction WhatsApp enquiry must include a prefilled service brief");
const constructionImgCount = (constructionHtml.match(/<img\b/g) || []).length;
const constructionImgWithAltCount = (constructionHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(constructionImgWithAltCount, constructionImgCount, "Every construction page image must have an alt attribute");
assert.match(constructionHtml, /anexo-coberto-estrutura-metalica/i, "Construction hero must use its distinct real-work photograph");
assert.doesNotMatch(constructionHtml, /instalacoes-embutidas-construcao/i, "Construction hero must not reuse the homepage photograph");

const facilitiesPath = join(outDir, "facilities", "index.html");
assert.ok(existsSync(facilitiesPath), "Facilities page must be generated");
const facilitiesHtml = readFileSync(facilitiesPath, "utf8");
assert.match(facilitiesHtml, /Facilities e/, "Facilities page title is missing");
assert.match(facilitiesHtml, /Manutenção de instalações/, "Facilities services are missing");
assert.match(facilitiesHtml, /Substituição localizada de cobertura/, "Facilities project evidence is missing");
assert.match(facilitiesHtml, /Pedido de serviço/i, "Facilities contact section is missing");
assert.match(facilitiesHtml, /href="https:\/\/wa\.me\/244948806673\?text=/, "Facilities WhatsApp enquiry must include a prefilled service brief");
const facilitiesImgCount = (facilitiesHtml.match(/<img\b/g) || []).length;
const facilitiesImgWithAltCount = (facilitiesHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(facilitiesImgWithAltCount, facilitiesImgCount, "Every Facilities page image must have an alt attribute");

const supplyPath = join(outDir, "supply", "index.html");
assert.ok(existsSync(supplyPath), "Supply page must be generated");
const supplyHtml = readFileSync(supplyPath, "utf8");
assert.match(supplyHtml, /Procurement e/, "Supply page heading is missing");
assert.match(supplyHtml, /não mantém stock próprio/i, "Supply stock disclosure is missing");
assert.match(supplyHtml, /Materiais de construção/, "Supply construction-materials category is missing");
assert.match(supplyHtml, /EPI e fardamento/, "Supply PPE and workwear category is missing");
assert.match(supplyHtml, /Fornecimento industrial/i, "Supply industrial category is missing");
assert.match(supplyHtml, /SOURCE AO/, "Supply page must link to SOURCE AO");
assert.match(supplyHtml, /Registar pedido de cotação/, "Supply RFQ action is missing");
const supplyImgCount = (supplyHtml.match(/<img\b/g) || []).length;
const supplyImgWithAltCount = (supplyHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(supplyImgWithAltCount, supplyImgCount, "Every Supply page image must have an alt attribute");
assert.equal((supplyHtml.match(/class="supply-evidence-photo"/g) || []).length, 2, "Two Supply evidence photographs are expected");

const smartRfqPath = join(outDir, "source-ao", "smart-rfq", "index.html");
assert.ok(existsSync(smartRfqPath), "SOURCE AO Smart RFQ page must be generated");
const smartRfqHtml = readFileSync(smartRfqPath, "utf8");
assert.match(smartRfqHtml, /<h1[^>]*data-en="What do you need to source\?"/, "SOURCE AO RFQ heading must describe the sourcing task");
for (const id of ["rfqForm", "rfqItems", "addItem", "deliveryFields", "contactFields", "rfqReview", "rfqConsent", "rfqSubmit", "rfqResult", "rfqNext", "rfqBack", "catalogStatus", "rfqLanguage"]) {
  assert.ok(smartRfqHtml.includes('id="' + id + '"'), "SOURCE AO RFQ control is missing: " + id);
}
assert.match(smartRfqHtml, /Your item list|A sua lista de artigos/, "RFQ item stage is missing");
assert.match(smartRfqHtml, /Delivery and purchasing needs|Entrega e condições do pedido/, "RFQ delivery stage is missing");
assert.match(smartRfqHtml, /Who should receive the proposal|Quem deve receber a proposta/, "RFQ contact stage is missing");
assert.match(smartRfqHtml, /Pré-visualização isolada|isolated preview/i, "RFQ preview must disclose its isolated staging state");
assert.doesNotMatch(smartRfqHtml, /id="smartRfqForm"|id="rfqEmailSend"|id="rfqWhatsapp"/, "Obsolete browser-only Smart RFQ controls must not return");
assert.doesNotMatch(smartRfqHtml, /comercialhmatiasps\.com\/(?:rfq|rfq-en)\.html/i, "SOURCE AO RFQ must not link to the legacy RFQ pages");

const radarRoutes = [
  ["source-ao/radar", "pt-AO", "Pré-visualização isolada", "/source-ao/smart-rfq/"],
  ["en/source-ao/radar", "en", "Isolated preview", "/en/source-ao/smart-rfq/"],
];
for (const [route, language, previewLabel, rfqHref] of radarRoutes) {
  const file = join(outDir, route, "index.html");
  assert.ok(existsSync(file), `SOURCE AO Radar route must be generated: /${route}/`);
  const content = readFileSync(file, "utf8");
  assert.match(content, new RegExp(`<html lang="${language}"`), `Radar language is incorrect: /${route}/`);
  assert.match(content, /data-radar-preview/, `Radar preview marker is missing: /${route}/`);
  assert.match(content, /id="opList"/, `Radar opportunity list is missing: /${route}/`);
  assert.match(content, /id="refreshRadar"/, `Radar refresh control is missing: /${route}/`);
  assert.match(content, new RegExp(previewLabel), `Radar staging isolation notice is missing: /${route}/`);
  assert.match(content, new RegExp(rfqHref.replaceAll("/", "\\/")), `Radar must link to the matching-language RFQ route: /${route}/`);
}

const partnerRoutes = [
  ["source-ao/parceiros", "pt-AO", "/privacidade/", "/en/source-ao/partners/"],
  ["en/source-ao/partners", "en", "/en/privacy/", "/source-ao/parceiros/"],
];
for (const [route, language, privacyHref, languageHref] of partnerRoutes) {
  const file = join(outDir, route, "index.html");
  assert.ok(existsSync(file), `SOURCE AO partner application route must be generated: /${route}/`);
  const content = readFileSync(file, "utf8");
  assert.match(content, new RegExp(`<html lang="${language}"`), `Partner application language is incorrect: /${route}/`);
  for (const id of ["partnerForm", "confirmAccuracy", "formStatus", "submitPartner", "capabilities"]) {
    assert.ok(content.includes(`id="${id}"`), `Partner application control ${id} is missing: /${route}/`);
  }
  assert.match(content, /name="privacy_consent"/, `Partner privacy consent field is missing: /${route}/`);
  assert.ok(content.includes(`href="${privacyHref}"`), `Partner privacy link is incorrect: /${route}/`);
  assert.ok(content.includes(`href="${languageHref}"`), `Partner language switch is incorrect: /${route}/`);
  assert.match(content, /staging/i, `Partner application must disclose isolated staging state: /${route}/`);
}

const lighthouseConfig = readFileSync(new URL("../lighthouserc.cjs", import.meta.url), "utf8");
const lighthouseRoutes = [...lighthouseConfig.matchAll(/http:\/\/127\.0\.0\.1:4321([^"]+)/g)].map((match) => match[1]);
assert.equal(lighthouseRoutes.length, 34, "Lighthouse must audit 34 representative PT/EN routes");
assert.equal(new Set(lighthouseRoutes).size, 34, "Lighthouse route list must contain 34 unique routes");
assert.ok(lighthouseRoutes.includes("/") && lighthouseRoutes.includes("/en/"), "Lighthouse must include both homepages");
for (const route of lighthouseRoutes) {
  const segments = route.split("/").filter(Boolean);
  const file = join(outDir, ...segments, "index.html");
  assert.ok(existsSync(file), "Lighthouse route must resolve to generated HTML: " + route);
  const content = readFileSync(file, "utf8");
  const language = route.startsWith("/en/") ? "en" : "pt-AO";
  assert.match(content, new RegExp('<html lang="' + language + '"'), "Generated route language is incorrect: " + route);
}
for (const route of [


  "/source-ao/radar/",
  "/en/source-ao/radar/",
  "/source-ao/parceiros/",
  "/en/source-ao/partners/",
]) {
  assert.ok(lighthouseRoutes.includes(route), `Lighthouse route coverage is missing ${route}`);
}

const sourceRfqScript = readFileSync(new URL("../../../source-ao/rfq.js", import.meta.url), "utf8");
const radarScript = readFileSync(new URL("../../../source-ao/opportunity-radar.js", import.meta.url), "utf8");
assert.match(radarScript, /data-radar-preview/, "Radar preview must route analysis into local Smart RFQ");
assert.match(radarScript, /\/source-ao\/smart-rfq\//, "Portuguese Radar must prefill Smart RFQ internally");
assert.match(radarScript, /\/en\/source-ao\/smart-rfq\//, "English Radar must prefill Smart RFQ internally");
const partnerScript = readFileSync(new URL("../../../source-ao/partner-application.js", import.meta.url), "utf8");
assert.match(partnerScript, /privacy_consent:consent/, "Partner application must transmit explicit privacy consent");
assert.match(sourceRfqScript, /apiBase\(\)\+'\/api\/catalog'/, "SOURCE AO RFQ must prefer the live catalog API when configured");
assert.match(sourceRfqScript, /staticCatalogUrl=.*'\/source-ao\/data\/public-catalog\.json'/, "SOURCE AO RFQ must retain the sanitised local catalogue fallback");
assert.match(sourceRfqScript, /loadCatalog\(staticCatalogUrl\)/, "SOURCE AO RFQ must retry the local catalogue when the live API is unavailable");
const previewCatalogEndpoint = readFileSync(new URL('../src/pages/api/source-ao/catalog.json.ts', import.meta.url), 'utf8');
assert.ok(previewCatalogEndpoint.includes('public-catalog.json'), 'Astro fallback must use the sanitised public catalogue');
assert.match(sourceRfqScript, /fetch\(apiBase\(\)\+'\/api\/sourcing-requests'/, "SOURCE AO RFQ must post requests to its configured API");
assert.match(sourceRfqScript, /result\?\.ok!==true/, "SOURCE AO RFQ must require a confirmed API response");
assert.match(sourceRfqScript, /trackingUrl\(result\.request\.status_path\)/, "SOURCE AO RFQ must validate and expose the private tracking link");

const englishSmartRfqHtml = readFileSync(join(outDir, "en", "source-ao", "smart-rfq", "index.html"), "utf8");
assert.match(englishSmartRfqHtml, /<html lang="en"/, "English SOURCE AO RFQ must declare its language");
assert.match(englishSmartRfqHtml, /data-en="What do you need to source\?"/, "English SOURCE AO RFQ heading is missing");
assert.match(englishSmartRfqHtml, /id="rfqForm"/, "English SOURCE AO RFQ form is missing");
assert.match(englishSmartRfqHtml, /id="rfqSubmit"/, "English SOURCE AO RFQ submit control is missing");
assert.doesNotMatch(englishSmartRfqHtml, /comercialhmatiasps\.com\/(?:rfq|rfq-en)\.html/i, "English SOURCE AO RFQ must not redirect to the official legacy form");
const businessPath = join(outDir, "business-services", "index.html");
assert.ok(existsSync(businessPath), "Business Services page must be generated");
const businessHtml = readFileSync(businessPath, "utf8");
assert.match(businessHtml, /HMATIAS BUSINESS SERVICES/, "Business Services identity is missing");
for (const service of ["Expediente Administrativo e Redação Institucional", "Estruturação de CV Profissional", "Gestão e Organização Documental", "Propostas Comerciais e Apoio Empresarial", "Apresentações Empresariais", "Apoio Administrativo Recorrente para PME"]) {
  assert.ok(businessHtml.includes(service), `Business Services offer missing: ${service}`);
}
assert.match(businessHtml, /wa\.me\/244948806673/, "Business Services WhatsApp enquiry channel is missing");
assert.match(businessHtml, /mailto:geral@comercialhmatiasps\.com/, "Business Services email enquiry channel is missing");
assert.match(businessHtml, /Consultar Política de Privacidade/, "Business Services privacy notice is missing");
assert.ok(businessHtml.includes('href="https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business"'), "Business Services must preserve the exact approved official request form until an equivalent intake is validated");
assert.ok(businessHtml.includes('href="https://comercialhmatiasps.com/agendamento.html"'), "Business Services must preserve the official appointment route until an equivalent booking flow is validated");
assert.doesNotMatch(businessHtml, /comercialhmatiasps\.com\/(?:rfq|rfq-en)\.html/i, "Business Services must not be diverted to either legacy Smart RFQ form");
const englishBusinessPath = join(outDir, "en", "business-services", "index.html");
assert.ok(existsSync(englishBusinessPath), "English Business Services page must be generated");
const englishBusinessHtml = readFileSync(englishBusinessPath, "utf8");
assert.ok(englishBusinessHtml.includes('href="https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business"'), "English Business Services must preserve the exact approved official request form");
assert.ok(englishBusinessHtml.includes('href="https://comercialhmatiasps.com/agendamento.html"'), "English Business Services must preserve the official appointment route");

const aboutPath = join(outDir, "empresa", "index.html");
assert.ok(existsSync(aboutPath), "About page must be generated");
const aboutHtml = readFileSync(aboutPath, "utf8");
const aboutText = aboutHtml.replace(/<[^>]*>/g, " ");
assert.ok(aboutHtml.includes("SOBRE A HMATIAS"), "About page label is missing");
assert.match(aboutText, /MISSÃO/, "About page mission is missing");
assert.match(aboutText, /VISÃO/, "About page vision is missing");
assert.match(aboutText, /Uma empresa angolana, com uma abordagem/, "About page company introduction is missing");
assert.match(aboutText, /Identidade e enquadramento/, "About page company profile is missing");
assert.match(aboutText, /Integridade/, "About page principles are missing");
assert.match(aboutText, /Cooperação/, "About page cooperation principle is missing");
assert.doesNotMatch(aboutHtml, /source-ao-highlight|portfolio|project-gallery/i, "About page must not duplicate homepage platform or project sections");
const aboutMainHtml = aboutHtml.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? aboutHtml;
assert.doesNotMatch(aboutMainHtml, /Construção e remodelação|Facilities e Manutenção|HMATIAS Supply|Business Services/, "About page main content must not repeat the operational service cards");

const credibilityPath = join(outDir, "credibilidade", "index.html");
assert.ok(existsSync(credibilityPath), "Dedicated credibility page must be generated");
const credibilityHtml = readFileSync(credibilityPath, "utf8");
assert.ok(credibilityHtml.includes("5001578065"), "Company NIF is missing from credibility page");
assert.ok(credibilityHtml.includes('href="https://inapem.gov.ao/"'), "Credibility page must link to the official issuing institution");
assert.ok(credibilityHtml.includes("24.094-23"), "Commercial registration is missing from credibility page");
assert.ok(credibilityHtml.includes("IDENTIFICAÇÃO EMPRESARIAL"), "Company identification section is missing");
assert.ok(credibilityHtml.includes("CONTACTO OFICIAL"), "Official contact section is missing");
assert.ok(credibilityHtml.includes("HMATIAS - PRESTAÇÃO DE SERVIÇOS, (SU), LDA"), "Company legal name must match the INAPEM certificate");
assert.equal((credibilityHtml.match(/class="credibility-principle"/g) || []).length, 4, "Credibility page must present four practical trust blocks");
assert.ok(!credibilityHtml.includes("HMATIAS – Prestação de Serviços SU, LDA"), "Legacy company name without the registered (SU) form must not return");
assert.ok(credibilityHtml.includes('href="/empresa/"'), "Credibility page must link back to About");

for (const [route, heading, marker] of [
  ["privacidade", /Política de Privacidade/, /Cookies, consentimento e estatísticas/],
  ["cookies", /Política de Cookies/, /Cookiebot/],
  ["termos", /Termos &amp; Condições/, /Propriedade intelectual/],
]) {
  const path = join(outDir, route, "index.html");
  assert.ok(existsSync(path), `${route} legal page must be generated`);
  const content = readFileSync(path, "utf8");
  assert.match(content, heading, `${route} legal heading is missing`);
  assert.match(content, marker, `${route} legal content is incomplete`);
  if (route === "privacidade") {
    assert.match(content, /Microsoft Clarity/, "Privacy policy must disclose the consent-gated Clarity integration");
    assert.match(content, /candidaturas à rede de parceiros SOURCE AO/i, "Privacy policy must describe SOURCE AO partner application data");
    assert.match(content, /perfil privado cifrado/i, "Privacy policy must describe encrypted partner contact storage");
  }
}

const englishCredibilityHtml = readFileSync(join(outDir, "en", "credibility", "index.html"), "utf8");
assert.ok(englishCredibilityHtml.includes('href="https://inapem.gov.ao/"'), "English credibility page must link to the official issuing institution");
const englishPrivacyHtml = readFileSync(join(outDir, "en", "privacy", "index.html"), "utf8");
const englishCookieHtml = readFileSync(join(outDir, "en", "cookies", "index.html"), "utf8");
assert.match(englishCookieHtml, /Cookiebot/, "English Cookie Policy must describe the consent platform");
assert.match(englishPrivacyHtml, /SOURCE AO partner applications may collect/i, "English privacy policy must describe partner application data");
assert.match(englishPrivacyHtml, /encrypted private profile/i, "English privacy policy must describe encrypted partner contact storage");

const worksCataloguePath = join(outDir, "catalogo-obras", "index.html");
assert.ok(existsSync(worksCataloguePath), "Works catalogue page must be generated");
const worksCatalogueHtml = readFileSync(worksCataloguePath, "utf8");
assert.match(worksCatalogueHtml, /Obras, intervenções/, "Works catalogue heading is missing");
assert.match(worksCatalogueHtml, /Fornecimentos/, "Catalogue must include supply references in its scope");
assert.match(worksCatalogueHtml, /divulgação é adequada ou autorizada/i, "Catalogue must preserve its client and location disclosure");
assert.match(worksCatalogueHtml, /faturas/, "Catalogue disclaimer must use current Portuguese orthography");
assert.match(worksCatalogueHtml, /Apresente o seu projeto/, "Catalogue CTA must use current Portuguese orthography");
assert.equal((worksCatalogueHtml.match(/<article class="works-catalogue-card"/g) || []).length, 12, "The complete 12-record catalogue must be present");
const catalogueImgCount = (worksCatalogueHtml.match(/<img\b/g) || []).length;
const catalogueImgWithAltCount = (worksCatalogueHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(catalogueImgCount, 19, "Fifteen documentary catalogue photographs, two shared brand marks and two footer social icons must be rendered");
assert.equal(catalogueImgWithAltCount, catalogueImgCount, "Every catalogue image must have alt text");

const assetDir = join(outDir, "_astro");
assert.ok(existsSync(assetDir), "Astro must emit processed assets");
const assets = readdirSync(assetDir).filter((file) => statSync(join(assetDir, file)).isFile());
assert.ok(assets.length >= 5, "Expected optimized local project images, fonts or styles in the build output");
const compiledCss = assets
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(join(assetDir, file), "utf8"))
  .join("\n");
assert.match(compiledCss, /HMATIAS Manrope/, "Local Manrope display font must be active");
assert.match(compiledCss, /HMATIAS IBM Plex Mono/, "Local IBM Plex Mono utility font must be active");
assert.ok(assets.some((file) => file.includes("manrope-latin-variable")), "Manrope font asset must be emitted");
assert.ok(assets.some((file) => file.includes("ibm-plex-mono-latin-600")), "IBM Plex Mono font asset must be emitted");

for (const route of ["construcao", "facilities", "coberturas-industriais", "limpeza-pos-obra", "fornecimento-de-epi-e-fardamento", "remodelacao-de-escritorios", "supply", "business-services", "catalogo-obras", "empresa", "credibilidade", "blog", "blog/como-preparar-um-pedido-de-cotacao", "acessibilidade", "privacidade", "termos", "source-ao/smart-rfq", "source-ao/radar", "source-ao/parceiros"]) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  const visibleText = content
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|nbsp|quot|#39);/g, " ");
  assert.doesNotMatch(
    visibleText,
    /informacção|instalacção|criaccção|relacção|configuracção|pre-visualizacção|Prestacção|Seleccione|Selecção|directa|optimizada|facturas|recepção|actualizados|actualização/i,
    `Malformed visible copy detected in /${route}/`
  );
  assert.equal(content.includes("</p>\\n"), false, `Literal newline escape detected in ${route}`);
}

// English routes must exist as independently translated pages, not as Portuguese pages with a changed label.
const englishRoutes = [
  ["en", /Capability to/, /Construction, Facilities, Supply and Business Services/],
  ["en/about", /An Angolan company/, /Areas and services/],
  ["en/credibility", /HMATIAS CREDIBILITY/, /COMPANY IDENTIFICATION/],
  ["en/construction", /Construction and/, /Metal-frame building/],
  ["en/industrial-roofing", /Industrial roofing:/, /Execution subject to assessment/],
  ["en/post-construction-cleaning", /Post-construction cleaning/, /Scope agreed before execution/],
  ["en/ppe-workwear", /PPE and workwear supply/, /Supply subject to confirmation/],
  ["en/office-remodelling", /Office and commercial premises remodelling/, /Proposal after site assessment/],
  ["en/facilities", /Facilities and/, /Building maintenance/],
  ["en/clean", /HMATIAS Clean/, /Prepare a multi-item request/],
  ["en/supply", /Procurement and/, /does not hold its own stock/i],
  ["en/business-services", /Administrative,/, /Professional CV structuring/],
  ["en/works-catalogue", /Works, interventions/, /Pavilions with metal roofing/],
  ["en/blog", /Practical Guides/, /FEATURED/],
  ["en/blog/how-to-prepare-a-comparable-supply-quotation", /How to prepare a quotation request/, /quantity and unit/i],
  ["en/source-ao/smart-rfq", /<h1[^>]*data-en="What do you need to source\?"/, /Isolated preview: online registration/],
  ["en/accessibility", /more accessible to everyone/i, /independent audit/i],
  ["en/privacy", /Privacy Policy/, /Cookiebot/],
  ["en/cookies", /Cookie Policy/, /Cookiebot/],
  ["en/terms", /Terms and Conditions/, /Intellectual property/],
  ["en/karta", /KARTA Wallet Mobile/, /not yet available for public download/i],
  ["en/integrated-yard", /HMATIAS Integrated Yard/, /preliminary site-layout study/i],
];
for (const [route, heading, marker] of englishRoutes) {
  const path = join(outDir, route, "index.html");
  assert.ok(existsSync(path), `English route must be generated: /${route}/`);
  const content = readFileSync(path, "utf8");
  assert.match(content, /<html lang="en"/, `English document language is missing: /${route}/`);
  assert.match(content, heading, `English heading is missing: /${route}/`);
  assert.match(content, marker, `English key content is missing: /${route}/`);
  if (route === "en/source-ao/smart-rfq") {
    assert.ok(content.includes('id="rfqLanguage"'), "RFQ language control is missing: /" + route + "/");
  } else {
    assert.ok(content.includes('class="language-switch"'), `Language switch is missing: /${route}/`);
  }
}

const cleanPortuguese = readFileSync(join(outDir, "clean", "index.html"), "utf8");
const cleanEnglish = readFileSync(join(outDir, "en", "clean", "index.html"), "utf8");
assert.match(cleanPortuguese, /HMATIAS Clean/);
assert.match(cleanPortuguese, /Produtos em destaque/);
assert.match(cleanPortuguese, /Taurus technical catalogue|Catálogo técnico Taurus/);
assert.match(cleanPortuguese, /clean-catalog-search/);
assert.match(cleanPortuguese, /clean-catalog-tabs/);
assert.match(cleanPortuguese, /clean-catalog-results/);
assert.match(cleanPortuguese, /cleanQuoteForm/);
assert.match(cleanPortuguese, /clean-privacy-consent/);
assert.match(cleanPortuguese, /Não submete dados a um servidor nem regista uma encomenda/);
assert.match(cleanPortuguese, expectedRobotsPattern);
assert.match(cleanPortuguese, /href="https:\/\/www\.tmpn\.com\/resources\/taurus-catalogue\.pdf"/);
assert.match(cleanEnglish, /HMATIAS Clean/);
assert.match(cleanEnglish, /Featured product references|Featured product/);
assert.match(cleanEnglish, /clean-catalog-search/);
assert.match(cleanEnglish, /clean-catalog-tabs/);
assert.match(cleanEnglish, /clean-catalog-results/);
assert.match(cleanEnglish, /cleanQuoteForm/);
assert.match(cleanEnglish, /clean-privacy-consent/);
assert.match(cleanEnglish, /does not submit a server request or register an order/);
assert.match(cleanEnglish, expectedRobotsPattern);

const englishHomepage = readFileSync(join(outDir, "en", "index.html"), "utf8");
assert.ok(englishHomepage.includes('href="/en/construction/"'), "English homepage must link to English construction");
assert.ok(englishHomepage.includes('href="/en/facilities/"'), "English homepage must link to English facilities");
assert.ok(englishHomepage.includes('href="/en/supply/"'), "English homepage must link to English supply");
assert.ok(englishHomepage.includes('href="/en/business-services/"'), "English homepage must link to English Business Services");

const englishAbout = readFileSync(join(outDir, "en", "about", "index.html"), "utf8");
const englishAboutText = englishAbout.replace(/<[^>]*>/g, " ");
assert.match(englishAboutText, /MISSION/, "English About page mission is missing");
assert.match(englishAboutText, /VISION/, "English About page vision is missing");
assert.match(englishAboutText, /OPERATING PRINCIPLES/, "English About operating principles are missing");
const englishValuesHtml = englishAbout.match(/<ul class="values-list"[^>]*>([\s\S]*?)<\/ul>/)?.[1];
assert.ok(englishValuesHtml, "English About values list is missing");
const expectedEnglishValues = ["Integrity", "Responsibility", "Rigour", "Cooperation"];
for (const value of expectedEnglishValues) {
  assert.match(englishValuesHtml, new RegExp(value), `English About page is missing the ${value} principle`);
}
assert.equal((englishValuesHtml.match(/<li\b/g) || []).length, expectedEnglishValues.length, "English About page must present four operating principles");
assert.match(englishAboutText, /Areas and services/, "English About page footer service navigation is missing");
assert.doesNotMatch(englishAboutText, /Our commitment|THE CEO.s COMMITMENT|Integrity in every relationship/i, "Generic executive copy must not return");

for (const [route] of englishRoutes) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  const imageCount = (content.match(/<img\b/g) || []).length;
  const imageAltCount = (content.match(/<img\b[^>]*\balt=/g) || []).length;
  assert.equal(imageAltCount, imageCount, `Every image in English route /${route}/ must have alt text`);
  assert.doesNotMatch(content, /Lorem ipsum|This is a space to share|Coming soon|EM PREPARAÇÃO|Publicação em preparação/i, `Placeholder copy must not appear in /${route}/`);
}

const portugueseAbout = readFileSync(join(outDir, "empresa", "index.html"), "utf8");
const portugueseArticle = readFileSync(join(outDir, "blog", "como-preparar-um-pedido-de-cotacao", "index.html"), "utf8");
const englishBlogArticle = readFileSync(join(outDir, "en", "blog", "how-to-prepare-a-comparable-supply-quotation", "index.html"), "utf8");
assert.ok(html.includes('class="language-switch" href="/en/"'), "Portuguese homepage must switch to the English homepage");
assert.ok(englishHomepage.includes('class="language-switch" href="/"'), "English homepage must switch to the Portuguese homepage");
assert.ok(portugueseAbout.includes('class="language-switch" href="/en/about/"'), "Portuguese About page must switch to English About");
assert.ok(englishAbout.includes('class="language-switch" href="/empresa/"'), "English About page must switch to Portuguese About");
assert.ok(portugueseArticle.includes('class="language-switch" href="/en/blog/how-to-prepare-a-comparable-supply-quotation/"'), "Portuguese article must switch to its English counterpart");
assert.ok(englishBlogArticle.includes('class="language-switch" href="/blog/como-preparar-um-pedido-de-cotacao/"'), "English article must switch to its Portuguese counterpart");

const englishConstruction = readFileSync(join(outDir, "en", "construction", "index.html"), "utf8");
assert.match(englishConstruction, /anexo-coberto-estrutura-metalica/i, "English construction hero must use its distinct real-work photograph");
assert.doesNotMatch(englishConstruction, /instalacoes-embutidas-construcao/i, "English construction hero must not reuse the homepage photograph");
assert.match(englishConstruction, /href="https:\/\/wa\.me\/244948806673\?text=/, "English construction WhatsApp enquiry must include a prefilled service brief");
const englishFacilities = readFileSync(join(outDir, "en", "facilities", "index.html"), "utf8");
assert.match(englishFacilities, /href="https:\/\/wa\.me\/244948806673\?text=/, "English Facilities WhatsApp enquiry must include a prefilled service brief");

const englishArticle = readFileSync(join(outDir, "en", "blog", "how-to-prepare-a-comparable-supply-quotation", "index.html"), "utf8");
assert.ok(englishArticle.includes('href="/en/source-ao/smart-rfq/"'), "English article must link to the English SOURCE AO RFQ page");

const htmlImgCount = (html.match(/<img\b/g) || []).length;
const htmlImgWithAltCount = (html.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(htmlImgWithAltCount, htmlImgCount, "Every image must have an alt attribute");


const languagePairs = [
  ["", "en", "/", "/en/"],
  ["empresa", "en/about", "/empresa/", "/en/about/"],
  ["credibilidade", "en/credibility", "/credibilidade/", "/en/credibility/"],
  ["construcao", "en/construction", "/construcao/", "/en/construction/"],
  ["facilities", "en/facilities", "/facilities/", "/en/facilities/"],
  ["coberturas-industriais", "en/industrial-roofing", "/coberturas-industriais/", "/en/industrial-roofing/"],
  ["limpeza-pos-obra", "en/post-construction-cleaning", "/limpeza-pos-obra/", "/en/post-construction-cleaning/"],
  ["fornecimento-de-epi-e-fardamento", "en/ppe-workwear", "/fornecimento-de-epi-e-fardamento/", "/en/ppe-workwear/"],
  ["remodelacao-de-escritorios", "en/office-remodelling", "/remodelacao-de-escritorios/", "/en/office-remodelling/"],
  ["clean", "en/clean", "/clean/", "/en/clean/"],
  ["supply", "en/supply", "/supply/", "/en/supply/"],
  ["business-services", "en/business-services", "/business-services/", "/en/business-services/"],
  ["catalogo-obras", "en/works-catalogue", "/catalogo-obras/", "/en/works-catalogue/"],
  ["blog", "en/blog", "/blog/", "/en/blog/"],
  ["blog/como-preparar-um-pedido-de-cotacao", "en/blog/how-to-prepare-a-comparable-supply-quotation", "/blog/como-preparar-um-pedido-de-cotacao/", "/en/blog/how-to-prepare-a-comparable-supply-quotation/"],
  ["blog/avaliar-propostas-fornecimento-sem-comparar-apenas-preco", "en/blog/evaluating-supply-proposals-beyond-price", "/blog/avaliar-propostas-fornecimento-sem-comparar-apenas-preco/", "/en/blog/evaluating-supply-proposals-beyond-price/"],
  ["blog/substituicao-localizada-cobertura-metalica", "en/blog/localised-metal-roof-replacement", "/blog/substituicao-localizada-cobertura-metalica/", "/en/blog/localised-metal-roof-replacement/"],
  ["blog/plano-manutencao-preventiva-instalacoes", "en/blog/preventive-facilities-maintenance-plan", "/blog/plano-manutencao-preventiva-instalacoes/", "/en/blog/preventive-facilities-maintenance-plan/"],
  ["blog/recepcao-e-conferencia-de-fornecimentos", "en/blog/receiving-and-inspecting-supply-deliveries", "/blog/recepcao-e-conferencia-de-fornecimentos/", "/en/blog/receiving-and-inspecting-supply-deliveries/"],
  ["blog/comparar-propostas-perfis-metalicos-chapas-cobertura", "en/blog/comparing-metal-profiles-and-roofing-sheets", "/blog/comparar-propostas-perfis-metalicos-chapas-cobertura/", "/en/blog/comparing-metal-profiles-and-roofing-sheets/"],
  ["source-ao", "en/source-ao", "/source-ao/", "/en/source-ao/"],
  ["source-ao/radar", "en/source-ao/radar", "/source-ao/radar/", "/en/source-ao/radar/"],
  ["source-ao/smart-rfq", "en/source-ao/smart-rfq", "/source-ao/smart-rfq/", "/en/source-ao/smart-rfq/"],
  ["source-ao/parceiros", "en/source-ao/partners", "/source-ao/parceiros/", "/en/source-ao/partners/"],
  ["acessibilidade", "en/accessibility", "/acessibilidade/", "/en/accessibility/"],
  ["privacidade", "en/privacy", "/privacidade/", "/en/privacy/"],
  ["termos", "en/terms", "/termos/", "/en/terms/"],
  ["karta", "en/karta", "/karta/", "/en/karta/"],
  ["estaleiro", "en/integrated-yard", "/estaleiro/", "/en/integrated-yard/"],
];

function languageSwitchTarget(pageHtml, route) {
  const match = pageHtml.match(/<a\b[^>]*class="[^"]*\blanguage-switch\b[^"]*"[^>]*href="([^"]+)"/);
  assert.ok(match, `Language switch link is missing from /${route || ""}/`);
  return match[1];
}

assert.equal(languagePairs.length, 29, "All 29 Portuguese/English page pairs must be verified");

for (const [ptRoute, enRoute, ptHref, enHref] of languagePairs) {
  const ptPath = join(outDir, ptRoute, "index.html");
  const enPath = join(outDir, enRoute, "index.html");
  assert.ok(existsSync(ptPath), `Portuguese route must exist: /${ptRoute}/`);
  assert.ok(existsSync(enPath), `English counterpart must exist: /${enRoute}/`);

  const ptHtml = readFileSync(ptPath, "utf8");
  const enHtml = readFileSync(enPath, "utf8");
  const expectedPtUrl = new URL(ptHref, configuredSite).toString();
  const expectedEnUrl = new URL(enHref, configuredSite).toString();
  const getCanonical = (pageHtml, route) => {
    const match = pageHtml.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(match, `Canonical link is missing from /${route}/`);
    return match[1];
  };
  const getAlternate = (pageHtml, language, route) => {
    const match = pageHtml.match(new RegExp(`<link rel="alternate" hreflang="${language}" href="([^"]+)"`));
    assert.ok(match, `hreflang=${language} is missing from /${route}/`);
    return match[1];
  };

  assert.equal(getCanonical(ptHtml, ptRoute), expectedPtUrl, `Portuguese canonical must use the resolved deployment host: /${ptRoute}/`);
  assert.equal(getCanonical(enHtml, enRoute), expectedEnUrl, `English canonical must use the resolved deployment host: /${enRoute}/`);
  assert.equal(getAlternate(ptHtml, "pt-AO", ptRoute), expectedPtUrl, `Portuguese hreflang must be self-referential: /${ptRoute}/`);
  assert.equal(getAlternate(ptHtml, "en", ptRoute), expectedEnUrl, `Portuguese hreflang must point to the English counterpart: /${ptRoute}/`);
  assert.equal(getAlternate(ptHtml, "x-default", ptRoute), expectedPtUrl, `x-default must point to the Portuguese counterpart: /${ptRoute}/`);
  assert.equal(getAlternate(enHtml, "pt-AO", enRoute), expectedPtUrl, `English hreflang must point to the Portuguese counterpart: /${enRoute}/`);
  assert.equal(getAlternate(enHtml, "en", enRoute), expectedEnUrl, `English hreflang must be self-referential: /${enRoute}/`);
  assert.equal(getAlternate(enHtml, "x-default", enRoute), expectedPtUrl, `English x-default must point to the Portuguese counterpart: /${enRoute}/`);
  if (ptRoute === "source-ao/smart-rfq") {
    assert.ok(ptHtml.includes('id="rfqLanguage"'), "Portuguese RFQ must expose its language control");
    assert.ok(enHtml.includes('id="rfqLanguage"'), "English RFQ must expose its language control");
    assert.match(sourceRfqScript, /\$\('#rfqLanguage'\)\.addEventListener\('click'/, "SOURCE AO RFQ language control must be interactive");
    assert.match(sourceRfqScript, /en=!en;staticLanguage\(\)/, "SOURCE AO RFQ language control must switch the form language");
  } else if (ptRoute === "source-ao") {
    assert.ok(ptHtml.includes('class="source-lang" href="/en/source-ao/"'), "Portuguese SOURCE AO landing page must link to the English landing page");
    assert.ok(enHtml.includes('class="source-lang" href="/source-ao/"'), "English SOURCE AO landing page must link to the Portuguese landing page");
  } else if (ptRoute === "source-ao/radar") {
    assert.ok(ptHtml.includes('id="langToggle"'), "Portuguese SOURCE AO Radar must expose its interactive language switch");
    assert.ok(enHtml.includes('id="langToggle"'), "English SOURCE AO Radar must expose its interactive language switch");
  } else {
    assert.equal(languageSwitchTarget(ptHtml, ptRoute), enHref,
      `Portuguese language switch must lead to /${enRoute}/`);
    assert.equal(languageSwitchTarget(enHtml, enRoute), ptHref,
      `English language switch must lead to /${ptRoute}/`);
  }
}

function collectGeneratedHtml(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectGeneratedHtml(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

const generatedPages = collectGeneratedHtml(outDir);
assert.ok(generatedPages.length >= 61, "The complete 61-page PT/EN route set must be generated before footer auditing");
for (const pagePath of generatedPages) {
  const pageHtml = readFileSync(pagePath, "utf8");
  const relativePagePath = pagePath.slice(outDir.length).replaceAll("\\", "/");
  if (["areas-de-negocio/index.html", "en/business-areas/index.html"].includes(relativePagePath)) continue;
  const isEnglishPage = relativePagePath.startsWith("en/");
  const imageTags = [...pageHtml.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  for (const imageTag of imageTags) {
    assert.match(imageTag, /\balt=/, "Every image must declare alternative text, including decorative empty alt: " + relativePagePath);
  }
  assert.match(pageHtml, /<title>[^<]+<\/title>/, "Every generated page must have a non-empty title: " + relativePagePath);
  assert.match(pageHtml, /<meta name="description" content="[^"]+"/, "Every generated page must have a meta description: " + relativePagePath);
  assert.match(pageHtml, /<link rel="canonical" href="https:\/\//, "Every generated page must have an absolute canonical URL: " + relativePagePath);
  assert.match(pageHtml, /<meta property="og:title" content="[^"]+"/, "Every generated page must have an Open Graph title: " + relativePagePath);
  assert.match(pageHtml, /<meta property="og:description" content="[^"]+"/, "Every generated page must have an Open Graph description: " + relativePagePath);
  assert.match(pageHtml, /<meta name="twitter:card" content="summary_large_image"/, "Every generated page must have a Twitter card: " + relativePagePath);
  const expectedLanguage = isEnglishPage ? "en" : "pt";
  // SOURCE AO standalone product routes use dedicated footers, not the corporate footer.
  const isSourceAoLanding = relativePagePath === "source-ao/index.html" || relativePagePath === "en/source-ao/index.html";
  const isSourceAoPartner = relativePagePath === "source-ao/parceiros/index.html" || relativePagePath === "en/source-ao/partners/index.html";
  const isSourceAoRadar = relativePagePath === "source-ao/radar/index.html" || relativePagePath === "en/source-ao/radar/index.html";
  const isSourceAoRfq = relativePagePath === "source-ao/smart-rfq/index.html" || relativePagePath === "en/source-ao/smart-rfq/index.html";
  if (isSourceAoRadar || isSourceAoRfq) {
    const sourceFooterMatches = [...pageHtml.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/g)];
    assert.equal(sourceFooterMatches.length, 1, "SOURCE AO application must render exactly one dedicated footer: " + relativePagePath);
    const sourceFooter = sourceFooterMatches[0][0];
    if (isSourceAoRadar) {
      const radarHeader = pageHtml.match(/<header\b[^>]*class="[^"]*\bop-topbar\b[^"]*"[^>]*>[\s\S]*?<\/header>/)?.[0];
      assert.ok(radarHeader, "Opportunity Radar must render its dedicated product header: " + relativePagePath);
      const radarHomeAnchor = (pageHtml.match(/<a\b[^>]*>/g) || []).find((anchor) => anchor.includes('id="radarHomeLink"'));
      assert.ok(radarHomeAnchor?.includes("source-ao/"), "Radar must provide a return link to SOURCE AO: " + relativePagePath);
      assert.match(radarHeader, /id="radarBackLink"/, "Radar header must provide a SOURCE AO back link: " + relativePagePath);
      assert.match(radarHeader, /id="langToggle"/, "Radar header must provide an accessible language switch: " + relativePagePath);
      assert.match(sourceFooter, /id="radarRfqLink"/, "Radar footer must link to Smart RFQ: " + relativePagePath);
      assert.match(sourceFooter, /id="radarPartnerLink"/, "Radar footer must link to partner applications: " + relativePagePath);
      assert.match(sourceFooter, /href="[^"]*(?:privacy|privacidade)[^"]*"/i, "Radar footer must provide a privacy link: " + relativePagePath);
      assert.match(sourceFooter, /href="[^"]*(?:terms|termos)[^"]*"/i, "Radar footer must provide a terms link: " + relativePagePath);
      assert.match(sourceFooter, /href="mailto:geral@comercialhmatiasps\.com"/, "Radar footer must provide a commercial contact route: " + relativePagePath);
    } else {
      const rfqHeader = pageHtml.match(/<header\b[^>]*class="[^"]*\brfq-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/)?.[0];
      assert.ok(rfqHeader, "Smart RFQ must render its dedicated product header: " + relativePagePath);
      const rfqBackAnchor = (rfqHeader.match(/<a\b[^>]*>/g) || []).find((anchor) => anchor.includes('id="sourceAoBackLink"'));
      assert.ok(rfqBackAnchor?.includes("source-ao/"), "Smart RFQ must link back to SOURCE AO: " + relativePagePath);
      assert.match(rfqHeader, /mailto:geral@comercialhmatiasps\.com/, "Smart RFQ header must provide commercial contact: " + relativePagePath);
      assert.match(sourceFooter, /id="sourceAoSupplyLink"/, "Smart RFQ footer must link to HMATIAS Supply: " + relativePagePath);
      assert.match(sourceFooter, /id="sourceAoPrivacyLink"[^>]*data-en="Privacy"/, "Smart RFQ footer must provide a bilingual privacy link: " + relativePagePath);
      assert.match(sourceFooter, /id="sourceAoTermsLink"[^>]*data-en="Terms"/, "Smart RFQ footer must provide a bilingual terms link: " + relativePagePath);
      assert.match(sourceFooter, /href="mailto:geral@comercialhmatiasps\.com"/, "Smart RFQ footer must provide the institutional email: " + relativePagePath);
      assert.match(sourceFooter, /href="mailto:info@comercialhmatiasps\.com"/, "Smart RFQ footer must provide the institutional information email: " + relativePagePath);
    }
    continue;
  }
  if (isSourceAoLanding || isSourceAoPartner) {
    const sourceFooterMatches = [...pageHtml.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/g)];
    assert.equal(sourceFooterMatches.length, 1, "SOURCE AO standalone page must render exactly one product footer: " + relativePagePath);
    const sourceFooter = sourceFooterMatches[0][0];
    if (isSourceAoLanding) {
      assert.match(sourceFooter, isEnglishPage ? /A sourcing platform operated by HMATIAS/ : /Uma plataforma de sourcing operada pela HMATIAS/,
        "SOURCE AO footer description must match the page language: " + relativePagePath);
      assert.match(sourceFooter, /href="[^"]*(?:privacy|privacidade)[^"]*"/i, "SOURCE AO footer must provide a privacy link: " + relativePagePath);
      assert.match(sourceFooter, /href="[^"]*(?:terms|termos)[^"]*"/i, "SOURCE AO footer must provide a terms link: " + relativePagePath);
      assert.ok(sourceFooter.includes('href="https://wa.me/244948806673') || sourceFooter.includes('href="mailto:'),
        "SOURCE AO footer must provide a commercial contact route: " + relativePagePath);
    } else {
      assert.match(sourceFooter, /© 2026 SOURCE AO · HMATIAS/, "Partner application footer must identify SOURCE AO and HMATIAS: " + relativePagePath);
      assert.match(sourceFooter, /href="[^"]*privacy[^"]*"|href="[^"]*privacidade[^"]*"/i,
        "Partner application footer must provide a privacy link: " + relativePagePath);
      assert.match(sourceFooter, /href="mailto:geral@comercialhmatiasps\.com"/,
        "Partner application footer must provide the institutional contact email: " + relativePagePath);
    }
    continue;
  }

  const pageFooterMatches = [...pageHtml.matchAll(/<footer\b(?=[^>]*\bclass="site-footer")[^>]*>[\s\S]*?<\/footer>/g)];
  assert.equal(pageFooterMatches.length, 1, "Every generated corporate page must render exactly one shared footer: " + relativePagePath);

  const pageHeader = pageHtml.match(/<header class="site-header"[^>]*>[\s\S]*?<\/header>/)?.[0];
  assert.ok(pageHeader, "Every generated corporate page must render the shared HMATIAS header: " + relativePagePath);
  const pageNav = pageHeader.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(pageNav, "Every generated corporate page must render the primary navigation: " + relativePagePath);
  const expectedNavigationLabels = isEnglishPage
    ? ["Home", "About us", "Services", "Projects", "SOURCE AO", "Blog", "Request a quote"]
    : ["Início", "Sobre nós", "Serviços", "Projetos", "SOURCE AO", "Blog", "Solicitar orçamento"];
  for (const label of expectedNavigationLabels) {
    assert.ok(pageNav.includes(label), "Primary navigation label " + label + " is missing: " + relativePagePath);
  }
  const expectedNavigationTargets = isEnglishPage
    ? ["/en/#inicio", "/en/about/", "/en/credibility/", "/en/#partners", "/en/#servicos", "/en/construction/", "/en/facilities/", "/en/supply/", "/en/business-services/", "/en/#projetos", "/en/works-catalogue/", "/en/integrated-yard/", "/en/source-ao/", "/en/source-ao/radar/", "/en/source-ao/smart-rfq/", "/en/source-ao/partners/", "/en/blog/"]
    : ["/#inicio", "/empresa/", "/credibilidade/", "/#parceiros", "/#servicos", "/construcao/", "/facilities/", "/supply/", "/business-services/", "/#projetos", "/catalogo-obras/", "/estaleiro/", "/source-ao/", "/source-ao/radar/", "/source-ao/smart-rfq/", "/source-ao/parceiros/", "/blog/"];
  for (const href of expectedNavigationTargets) {
    assert.ok(pageNav.includes('href="' + href + '"'), "Primary navigation destination " + href + " is missing: " + relativePagePath);
  }
  assert.doesNotMatch(pageNav, /instagram|wa\.me/i, "Social channels must stay out of the primary navigation: " + relativePagePath);

  const pageFooter = pageFooterMatches[0][0];
  const columnNames = ["identity", "explore", "operations", "contacts"];
  const columnPositions = columnNames.map((name) => pageFooter.indexOf('class="footer-column footer-' + name + '"'));
  assert.ok(columnPositions.every((position) => position >= 0), "All four footer columns must exist: " + relativePagePath);
  assert.ok(columnPositions.every((position, index) => index === 0 || position > columnPositions[index - 1]),
    "Footer column order must remain Identity, Explore, Operations, Contacts: " + relativePagePath);
  assert.equal((pageFooter.match(/class="footer-column footer-(?:explore|identity|operations|contacts)"/g) || []).length, 4,
    "Footer must contain exactly four main columns: " + relativePagePath);
  assert.equal((pageFooter.match(/class="footer-legal-links"/g) || []).length, 1,
    "Footer must contain one legal navigation: " + relativePagePath);
  assert.equal((pageFooter.match(/class="footer-socials"/g) || []).length, 1,
    "Footer must contain one social group: " + relativePagePath);
  assert.equal((pageFooter.match(/class="footer-icon-link/g) || []).length, 2,
    "Footer must contain the approved WhatsApp and Instagram links: " + relativePagePath);

  const expectedContactForm = isEnglishPage
    ? "https://comercialhmatiasps.com/en.html#contact"
    : "https://comercialhmatiasps.com/#contacto";
  const contactLinkStart = pageFooter.indexOf('<a href="' + expectedContactForm + '"');
  assert.ok(contactLinkStart >= 0, "Quotation CTA must preserve the approved official form handoff: " + relativePagePath);
  const contactLinkEnd = pageFooter.indexOf(">", contactLinkStart);
  const contactLink = pageFooter.slice(contactLinkStart, contactLinkEnd + 1);
  assert.match(contactLink, /target="_blank"/, "Official form must open in a new tab: " + relativePagePath);
  assert.match(contactLink, /rel="noopener noreferrer"/, "Official form handoff must be isolated from the preview tab: " + relativePagePath);
}
console.log("Shared footer structure and language verified on all " + generatedPages.length + " generated HTML pages.");

const specialistRoutes = [
  ["coberturas-industriais", /Coberturas industriais: avaliação, reparação e manutenção/, "construction"],
  ["limpeza-pos-obra", /Limpeza pós-obra para espaços empresariais/, "cleaning-facilities"],
  ["fornecimento-de-epi-e-fardamento", /Fornecimento de EPI e fardamento para empresas/, "industrial-supply"],
  ["remodelacao-de-escritorios", /Remodelação de escritórios e espaços comerciais/, "construction"],
];
for (const [route, heading, category] of specialistRoutes) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  assert.match(content, /<html lang="pt-AO"/, `Portuguese specialist route must use pt-AO: /${route}/`);
  assert.match(content, expectedRobotsPattern, `Robots policy mismatch: /${route}/`);
  assert.match(content, heading, `Specialist page heading is missing: /${route}/`);
  assert.match(content, new RegExp(`href="\\/source-ao\\/smart-rfq\\/\\?category=${category}(?:&amp;|&)request=`), `Specialist request must prefill the SOURCE AO RFQ category: /${route}/`);
}

const englishSpecialistRoutes = [
  ["en/industrial-roofing", /Industrial roofing: assessment, repair and maintenance/, "construction"],
  ["en/post-construction-cleaning", /Post-construction cleaning for business premises/, "cleaning-facilities"],
  ["en/ppe-workwear", /PPE and workwear supply for businesses/, "industrial-supply"],
  ["en/office-remodelling", /Office and commercial premises remodelling/, "construction"],
];
for (const [route, heading, category] of englishSpecialistRoutes) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  assert.match(content, /<html lang="en"/, `English specialist route must use en: /${route}/`);
  assert.match(content, heading, `English specialist page heading is missing: /${route}/`);
  assert.match(content, new RegExp(`href="\\/en\\/source-ao\\/smart-rfq\\/\\?category=${category}(?:&amp;|&)request=`), `English specialist request must prefill the English SOURCE AO RFQ category: /${route}/`);
}

const cataloguePtPath = join(outDir, "catalogo-obras", "index.html");
const catalogueEnPath = join(outDir, "en", "works-catalogue", "index.html");
assert.ok(existsSync(cataloguePtPath), "Portuguese works catalogue must be generated");
assert.ok(existsSync(catalogueEnPath), "English works catalogue must be generated");
const cataloguePt = readFileSync(cataloguePtPath, "utf8");
const catalogueEn = readFileSync(catalogueEnPath, "utf8");
const privateLuandaPt = cataloguePt.match(/<section[^>]*id="obra-privada-luanda"[^>]*>[\s\S]*?<\/section>/)?.[0];
const privateLuandaEn = catalogueEn.match(/<section[^>]*id="private-project-luanda"[^>]*>[\s\S]*?<\/section>/)?.[0];
assert.ok(privateLuandaPt, "Portuguese catalogue must contain the documented private Luanda project");
assert.ok(privateLuandaEn, "English catalogue must contain the documented private Luanda project");
for (const [content, label] of [[privateLuandaPt, "Portuguese"], [privateLuandaEn, "English"]]) {
  assert.equal((content.match(/<img\b/g) || []).length, 3, label + " Luanda project must contain exactly three documentary photographs");
  assert.doesNotMatch(content, /images\.unsplash\.com|pexels\.com|gemini|generated image/i, label + " project record must not use generic or AI imagery");
}
for (const [needle, label] of [["Fundações e alvenaria", "Portuguese title"], ["Luanda, Angola", "Portuguese location"], ["identidade confidencial", "Portuguese client privacy"], ["cofragem", "Portuguese formwork alt"], ["blocos de betão", "Portuguese masonry alt"], ["vão de acesso", "Portuguese access opening alt"]]) {
  assert.ok(privateLuandaPt.toLowerCase().includes(needle.toLowerCase()), "Portuguese catalogue is missing " + label);
}
for (const [needle, label] of [["Foundations and masonry", "English title"], ["Luanda, Angola", "English location"], ["identity confidential", "English client privacy"], ["Formwork and reinforcement", "English formwork alt"], ["concrete-block wall", "English masonry alt"], ["access opening", "English access opening alt"]]) {
  assert.ok(privateLuandaEn.toLowerCase().includes(needle.toLowerCase()), "English catalogue is missing " + label);
}
const worksPtSection = cataloguePt.match(/<section[^>]*id="obras"[^>]*>[\s\S]*?<\/section>/)?.[0];
const supplyPtSection = cataloguePt.match(/<section[^>]*id="fornecimentos"[^>]*>[\s\S]*?<\/section>/)?.[0];
const worksEnSection = catalogueEn.match(/<section[^>]*id="works"[^>]*>[\s\S]*?<\/section>/)?.[0];
const supplyEnSection = catalogueEn.match(/<section[^>]*id="supply-records"[^>]*>[\s\S]*?<\/section>/)?.[0];
for (const [section, count, label] of [[worksPtSection,9,"Portuguese works"],[supplyPtSection,3,"Portuguese supply"],[worksEnSection,9,"English works"],[supplyEnSection,3,"English supply"]]) {
  assert.ok(section, label + " catalogue section must exist");
  assert.equal((section.match(/class="works-catalogue-card"/g) || []).length,count,label + " catalogue section must contain " + count + " records");
  assert.doesNotMatch(section,/images\.unsplash\.com|pexels\.com|gemini|generated image/i,label + " catalogue section must not contain generic or AI imagery");
}
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
for (const file of ["obra-privada-luanda-alvenaria-vista-geral.avif","obra-privada-luanda-cofragem-armadura-fundacao.avif","obra-privada-luanda-detalhe-alvenaria.avif"]) {
  assert.ok(existsSync(join(repoRoot, "images", "catalogue", file)), "Documentary catalogue photograph must be versioned: " + file);
}

const genericImageHostPattern = /(?:images\.)?(?:unsplash\.com|pexels\.com|pixabay\.com|pixabayusercontent\.com|picsum\.photos|placehold\.co)/i;
for (const pagePath of generatedPages) {
  const relativePagePath = pagePath.slice(outDir.length).replaceAll("\\", "/");
  const isBlogPage = /^(?:en\/)?blog(?:\/|$)/.test(relativePagePath);
  if (!isBlogPage) {
    const pageHtml = readFileSync(pagePath, "utf8");
    assert.doesNotMatch(
      pageHtml,
      genericImageHostPattern,
      "Generic editorial imagery is reserved for the Blog: " + relativePagePath,
    );
  }
}

console.log(`Astro static output verified: homepage has ${htmlImgCount} accessible images; ${assets.length} processed assets emitted.`);
