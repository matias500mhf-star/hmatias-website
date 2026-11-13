import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const outDir = new URL("../dist/", import.meta.url).pathname;
const indexPath = join(outDir, "index.html");
assert.ok(existsSync(indexPath), "Astro build must generate dist/index.html");

const html = readFileSync(indexPath, "utf8");
assert.match(html, /<html lang="pt-AO"/, "Portuguese Angola document language must be present");
assert.match(html, /name="robots" content="noindex, nofollow"/, "Prototype must not be indexed");
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
assert.match(html, /mailto:geral@comercialhmatiasps\.com/, "Footer commercial mail link is missing");
assert.match(html, /tel:\+244948806673/, "Footer telephone link is missing");
assert.match(html, /SOURCE AO/, "Source AO footer link is missing");
const sourceAoLanding = readFileSync(join(outDir, "source-ao", "index.html"), "utf8");
assert.ok(sourceAoLanding.includes('href="/source-ao/radar/"'), "SOURCE AO landing page must link to the opportunity Radar");
assert.ok(sourceAoLanding.includes('href="/source-ao/parceiros/"'), "SOURCE AO landing page must link to the partner application");
const sourceAoLandingEn = readFileSync(join(outDir, "en", "source-ao", "index.html"), "utf8");
assert.ok(sourceAoLandingEn.includes('href="/en/source-ao/radar/"'), "English SOURCE AO landing page must link to the opportunity Radar");
assert.ok(sourceAoLandingEn.includes('href="/en/source-ao/partners/"'), "English SOURCE AO landing page must link to the partner application");
assert.match(html, /Blog · Perspetivas empresariais/, "Blog footer link is missing");
assert.match(html, /KARTA Wallet · Projeto Alpha/, "KARTA Alpha project footer link is missing");
assert.match(html, /href="\/estaleiro\//, "Footer project link must point to the Integrated Yard preview");
assert.ok(html.includes('href="/empresa/">Sobre a HMATIAS'), "Footer About link must point to the About page");
assert.ok(html.includes('href="/credibilidade/">Credibilidade'), "Footer credibility link must point to the credibility page");
assert.match(html, /Política de Privacidade/, "Privacy Policy footer link is missing");
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
assert.match(blogHtml, /Guias práticos para/, "Blog page content is missing");
assert.ok(blogHtml.includes("/blog/como-preparar-um-pedido-de-cotacao/"), "Blog must link to its published Supply guide");
assert.ok(!blogHtml.includes("EM PREPARAÇÃO"), "The blog must not present the featured article as a placeholder");

const supplyGuidePath = join(outDir, "blog", "como-preparar-um-pedido-de-cotacao", "index.html");
assert.ok(existsSync(supplyGuidePath), "The published HMATIAS Supply guide must be generated");
const supplyGuideHtml = readFileSync(supplyGuidePath, "utf8");
assert.match(supplyGuideHtml, /Como preparar um pedido de cotação/, "Supply guide title is missing");
assert.match(supplyGuideHtml, /quantidade e unidade/i, "Supply guide must explain quantities and units");
assert.match(supplyGuideHtml, /local de entrega/i, "Supply guide must explain delivery destination");
assert.match(supplyGuideHtml, /até 20 linhas/i, "Supply guide must reflect the Smart RFQ item limit");
assert.ok(supplyGuideHtml.includes('href="/source-ao/smart-rfq/"'), "Supply guide must link to Smart RFQ");

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
assert.equal(lighthouseRoutes.length, 50, "Lighthouse must audit all 50 generated PT/EN routes");
assert.equal(new Set(lighthouseRoutes).size, 50, "Lighthouse route list must not contain duplicates");
for (const route of [
  "/dossier-institucional/",
  "/en/institutional-dossier/",
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
assert.match(sourceRfqScript, /fetch\('\/source-ao\/data\/catalog\.json'/, "SOURCE AO RFQ must load the local catalogue endpoint");
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
assert.doesNotMatch(businessHtml, /servicos-administrativos\.html#contacto-business/, "Business Services must not send visitors to the legacy intake form");

const aboutPath = join(outDir, "empresa", "index.html");
assert.ok(existsSync(aboutPath), "About page must be generated");
const aboutHtml = readFileSync(aboutPath, "utf8");
const aboutText = aboutHtml.replace(/<[^>]*>/g, " ");
assert.ok(aboutHtml.includes("SOBRE A HMATIAS"), "About page label is missing");
assert.doesNotMatch(aboutText, /\bMISSÃO\b|\bVISÃO\b|MENSAGEM DO CEO|Direção Executiva/i, "Removed generic institutional copy must not return");
assert.ok(aboutHtml.includes("Construção e remodelação"), "About page service overview is missing");
assert.match(aboutHtml, /pavilhoes-rurais-concluidos/i, "About page must use a distinct real-work photograph");
assert.doesNotMatch(aboutHtml, /instalacoes-embutidas-construcao/i, "About page must not reuse the homepage photograph");
assert.ok(aboutHtml.includes('href="/credibilidade/"'), "About page must link to the separate credibility page");

const credibilityPath = join(outDir, "credibilidade", "index.html");
assert.ok(existsSync(credibilityPath), "Dedicated credibility page must be generated");
const credibilityHtml = readFileSync(credibilityPath, "utf8");
assert.ok(credibilityHtml.includes("5001578065"), "Company NIF is missing from credibility page");
assert.ok(credibilityHtml.includes("24.094-23"), "Commercial registration is missing from credibility page");
assert.ok(credibilityHtml.includes("IDENTIFICAÇÃO EMPRESARIAL"), "Company identification section is missing");
assert.ok(credibilityHtml.includes("CONTACTO OFICIAL"), "Official contact section is missing");
assert.ok(credibilityHtml.includes("HMATIAS – Prestação de Serviços SU, LDA"), "Company legal name must use the shared approved display form");
assert.ok(!credibilityHtml.includes("Prestação de Serviços, (SU)"), "Legacy punctuation in company name must not return");
assert.ok(credibilityHtml.includes('href="/empresa/"'), "Credibility page must link back to About");

for (const [route, heading, marker] of [
  ["privacidade", /Política de Privacidade/, /Cookies, consentimento e estatísticas/],
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

const englishPrivacyHtml = readFileSync(join(outDir, "en", "privacy", "index.html"), "utf8");
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
assert.equal(catalogueImgCount, 14, "Twelve catalogue photographs and two shared brand marks must be rendered");
assert.equal(catalogueImgWithAltCount, catalogueImgCount, "Every catalogue image must have alt text");

const assetDir = join(outDir, "_astro");
assert.ok(existsSync(assetDir), "Astro must emit processed assets");
const assets = readdirSync(assetDir).filter((file) => statSync(join(assetDir, file)).isFile());
assert.ok(assets.length >= 5, "Expected optimized local project images, fonts or styles in the build output");
const compiledCss = assets
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(join(assetDir, file), "utf8"))
  .join("\\n");
assert.match(compiledCss, /HMATIAS Manrope/, "Local Manrope display font must be active");
assert.match(compiledCss, /HMATIAS IBM Plex Mono/, "Local IBM Plex Mono utility font must be active");
assert.ok(assets.some((file) => file.includes("manrope-latin-variable")), "Manrope font asset must be emitted");
assert.ok(assets.some((file) => file.includes("ibm-plex-mono-latin-600")), "IBM Plex Mono font asset must be emitted");

for (const route of ["construcao", "facilities", "coberturas-industriais", "limpeza-pos-obra", "fornecimento-de-epi-e-fardamento", "remodelacao-de-escritorios", "supply", "business-services", "catalogo-obras", "empresa", "credibilidade", "blog", "blog/como-preparar-um-pedido-de-cotacao", "acessibilidade", "privacidade", "termos", "source-ao/smart-rfq", "source-ao/radar", "source-ao/parceiros"]) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  assert.doesNotMatch(
    content,
    /informacção|instalacção|criaccção|relacção|configuracção|pre-visualizacção|Prestacção|projecto|projectos|Seleccione|Selecção|directa|optimizada|facturas|recepção|actualizados|actualização/i,
    `Malformed words detected in ${route}`
  );
  assert.equal(content.includes("</p>\\n"), false, `Literal newline escape detected in ${route}`);
}

// English routes must exist as independently translated pages, not as Portuguese pages with a changed label.
const englishRoutes = [
  ["en", /Capability to/, /Construction, Facilities, Supply and Business Services/],
  ["en/about", /An Angolan company/, /Service areas\./],
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
  ["en/works-catalogue", /Works, interventions/, /Completed Rural Pavilions/],
  ["en/blog", /Practical guides/, /FEATURED ARTICLE/],
  ["en/blog/how-to-prepare-a-comparable-supply-quotation", /How to prepare a quotation request/, /quantity and unit/i],
  ["en/source-ao/smart-rfq", /<h1[^>]*data-en="What do you need to source\?"/, /Isolated preview: online registration/],
  ["en/accessibility", /more accessible to everyone/i, /independent audit/i],
  ["en/privacy", /Privacy Policy/, /Cookiebot/],
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
assert.match(cleanPortuguese, /noindex, nofollow/);
assert.match(cleanPortuguese, /href="https:\/\/www\.tmpn\.com\/resources\/taurus-catalogue\.pdf"/);
assert.match(cleanEnglish, /HMATIAS Clean/);
assert.match(cleanEnglish, /Featured product references|Featured product/);
assert.match(cleanEnglish, /clean-catalog-search/);
assert.match(cleanEnglish, /clean-catalog-tabs/);
assert.match(cleanEnglish, /clean-catalog-results/);
assert.match(cleanEnglish, /cleanQuoteForm/);
assert.match(cleanEnglish, /clean-privacy-consent/);
assert.match(cleanEnglish, /does not submit a server request or register an order/);
assert.match(cleanEnglish, /noindex, nofollow/);

const englishHomepage = readFileSync(join(outDir, "en", "index.html"), "utf8");
assert.ok(englishHomepage.includes('href="/en/construction/"'), "English homepage must link to English construction");
assert.ok(englishHomepage.includes('href="/en/facilities/"'), "English homepage must link to English facilities");
assert.ok(englishHomepage.includes('href="/en/supply/"'), "English homepage must link to English supply");
assert.ok(englishHomepage.includes('href="/en/business-services/"'), "English homepage must link to English Business Services");

const englishAbout = readFileSync(join(outDir, "en", "about", "index.html"), "utf8");
const englishAboutText = englishAbout.replace(/<[^>]*>/g, " ");
assert.doesNotMatch(englishAboutText, /\bMISSION\b|\bVISION\b|\bVALUES\b/i, "Generic mission, vision and values boilerplate must not return");
assert.match(englishAboutText, /Service areas\./, "English About page service overview is missing");
assert.doesNotMatch(englishAboutText, /Our commitment|THE CEO.s COMMITMENT|Integrity in every relationship/i, "Generic executive copy must not return");
assert.match(englishAbout, /pavilhoes-rurais-concluidos/i, "English About page must use the distinct real-work photograph");
assert.doesNotMatch(englishAbout, /instalacoes-embutidas-construcao/i, "English About page must not reuse the homepage photograph");

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

for (const [ptRoute, enRoute, ptHref, enHref] of languagePairs) {
  const ptPath = join(outDir, ptRoute, "index.html");
  const enPath = join(outDir, enRoute, "index.html");
  assert.ok(existsSync(ptPath), `Portuguese route must exist: /${ptRoute}/`);
  assert.ok(existsSync(enPath), `English counterpart must exist: /${enRoute}/`);

  const ptHtml = readFileSync(ptPath, "utf8");
  const enHtml = readFileSync(enPath, "utf8");
  if (ptRoute === "source-ao/smart-rfq") {
    assert.ok(ptHtml.includes('id="rfqLanguage"'), "Portuguese RFQ must expose its language control");
    assert.ok(enHtml.includes('id="rfqLanguage"'), "English RFQ must expose its language control");
    assert.match(sourceRfqScript, /\$\('#rfqLanguage'\)\.addEventListener\('click'/, "SOURCE AO RFQ language control must be interactive");
    assert.match(sourceRfqScript, /en=!en;staticLanguage\(\)/, "SOURCE AO RFQ language control must switch the form language");
  } else {
    assert.equal(languageSwitchTarget(ptHtml, ptRoute), enHref,
      `Portuguese language switch must lead to /${enRoute}/`);
    assert.equal(languageSwitchTarget(enHtml, enRoute), ptHref,
      `English language switch must lead to /${ptRoute}/`);
  }
}

const specialistRoutes = [
  ["coberturas-industriais", /Coberturas industriais: avaliação, reparação e manutenção/, "construction"],
  ["limpeza-pos-obra", /Limpeza pós-obra para espaços empresariais/, "cleaning-facilities"],
  ["fornecimento-de-epi-e-fardamento", /Fornecimento de EPI e fardamento para empresas/, "industrial-supply"],
  ["remodelacao-de-escritorios", /Remodelação de escritórios e espaços comerciais/, "construction"],
];
for (const [route, heading, category] of specialistRoutes) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  assert.match(content, /<html lang="pt-AO"/, `Portuguese specialist route must use pt-AO: /${route}/`);
  assert.match(content, /name="robots" content="noindex, nofollow"/, `Preview route must remain noindex: /${route}/`);
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

console.log(`Astro static output verified: homepage has ${htmlImgCount} accessible images; ${assets.length} processed assets emitted.`);
