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
assert.match(html, /Blog · Perspetivas empresariais/, "Blog footer link is missing");
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
assert.match(blogHtml, /Perspetivas empresariais/, "Blog page content is missing");

const accessibilityPath = join(outDir, "acessibilidade", "index.html");
assert.ok(existsSync(accessibilityPath), "Accessibility page must be generated");
const accessibilityHtml = readFileSync(accessibilityPath, "utf8");
assert.match(accessibilityHtml, /acessibilidade/i, "Accessibility page content is missing");

const constructionPath = join(outDir, "construcao", "index.html");
assert.ok(existsSync(constructionPath), "Construction page must be generated");
const constructionHtml = readFileSync(constructionPath, "utf8");
assert.match(constructionHtml, /Construção e/, "Construction page title is missing");
assert.match(constructionHtml, /Pavilhões rurais concluídos/, "Construction page project content is missing");
assert.match(constructionHtml, /Pedido de orçamento/i, "Construction page contact section is missing");
const constructionImgCount = (constructionHtml.match(/<img\b/g) || []).length;
const constructionImgWithAltCount = (constructionHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(constructionImgWithAltCount, constructionImgCount, "Every construction page image must have an alt attribute");

const facilitiesPath = join(outDir, "facilities", "index.html");
assert.ok(existsSync(facilitiesPath), "Facilities page must be generated");
const facilitiesHtml = readFileSync(facilitiesPath, "utf8");
assert.match(facilitiesHtml, /Facilities e/, "Facilities page title is missing");
assert.match(facilitiesHtml, /Manutenção de instalações/, "Facilities services are missing");
assert.match(facilitiesHtml, /Substituição localizada de cobertura/, "Facilities project evidence is missing");
assert.match(facilitiesHtml, /Pedido de serviço/i, "Facilities contact section is missing");
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
assert.match(supplyHtml, /Fornecimento industrial/, "Supply industrial category is missing");
assert.match(supplyHtml, /SOURCE AO/, "Supply page must link to SOURCE AO");
assert.match(supplyHtml, /Registar pedido de cotação/, "Supply RFQ action is missing");
const supplyImgCount = (supplyHtml.match(/<img\b/g) || []).length;
const supplyImgWithAltCount = (supplyHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(supplyImgWithAltCount, supplyImgCount, "Every Supply page image must have an alt attribute");
assert.equal((supplyHtml.match(/supply-evidence-card/g) || []).length, 3, "Three Supply evidence cards are expected");

const smartRfqPath = join(outDir, "source-ao", "smart-rfq", "index.html");
assert.ok(existsSync(smartRfqPath), "Smart RFQ page must be generated");
const smartRfqHtml = readFileSync(smartRfqPath, "utf8");
assert.match(smartRfqHtml, /Uma necessidade/, "Smart RFQ heading is missing");
assert.match(smartRfqHtml, /até 20 linhas/i, "Smart RFQ item limit disclosure is missing");
assert.match(smartRfqHtml, /ligação privada de acompanhamento/i, "Smart RFQ private tracking explanation is missing");
assert.match(smartRfqHtml, /uma ligação privada de acompanhamento/i, "Smart RFQ tracking link grammar is incorrect");
assert.match(smartRfqHtml, /Seleccione uma categoria/i, "Smart RFQ category instruction is missing");
assert.doesNotMatch(smartRfqHtml, /link privado|Selecione/i, "Old Smart RFQ wording must not return");
assert.match(smartRfqHtml, /source-ao\/rfq\.html/, "Smart RFQ must link to the operational Source AO form");
const smartRfqImgCount = (smartRfqHtml.match(/<img\b/g) || []).length;
const smartRfqImgWithAltCount = (smartRfqHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(smartRfqImgWithAltCount, smartRfqImgCount, "Every Smart RFQ page image must have an alt attribute");

const businessPath = join(outDir, "business-services", "index.html");
assert.ok(existsSync(businessPath), "Business Services page must be generated");
const businessHtml = readFileSync(businessPath, "utf8");
assert.match(businessHtml, /HMATIAS BUSINESS SERVICES/, "Business Services identity is missing");
for (const service of ["Expediente Administrativo e Redação Institucional", "Estruturação de CV Profissional", "Gestão e Organização Documental", "Propostas Comerciais e Apoio Empresarial", "Apresentações Empresariais", "Apoio Administrativo Recorrente para PME"]) {
  assert.ok(businessHtml.includes(service), `Business Services offer missing: ${service}`);
}
assert.match(businessHtml, /contacto-business/, "Business Services operational intake link is missing");
assert.match(businessHtml, /website actual/i, "Business Services must identify the official website as the current request channel");
assert.match(businessHtml, /recepção segura de pedidos/i, "Business Services intake migration notice is missing");

const aboutPath = join(outDir, "empresa", "index.html");
assert.ok(existsSync(aboutPath), "About page must be generated");
const aboutHtml = readFileSync(aboutPath, "utf8");
assert.ok(aboutHtml.includes("SOBRE A HMATIAS"), "About page label is missing");
assert.ok(aboutHtml.includes("MENSAGEM DO CEO"), "CEO message section is missing");
assert.ok(aboutHtml.includes("Direção Executiva"), "About page executive signature is missing");
assert.ok(aboutHtml.includes("Construção e remodelação"), "About page service overview is missing");
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
  }
}

const worksCataloguePath = join(outDir, "catalogo-obras", "index.html");
assert.ok(existsSync(worksCataloguePath), "Works catalogue page must be generated");
const worksCatalogueHtml = readFileSync(worksCataloguePath, "utf8");
assert.match(worksCatalogueHtml, /Obras, intervenções/, "Works catalogue heading is missing");
assert.match(worksCatalogueHtml, /Fornecimentos/, "Catalogue must include supply references in its scope");
assert.match(worksCatalogueHtml, /optimizadas/, "Catalogue copy must use consistent Angolan Portuguese orthography");
assert.match(worksCatalogueHtml, /facturas/, "Catalogue disclaimer must retain its document terminology");
assert.match(worksCatalogueHtml, /Apresente o seu projecto/, "Catalogue CTA must use the established company wording");
assert.equal((worksCatalogueHtml.match(/<article class="works-catalogue-card"/g) || []).length, 12, "The complete 12-record catalogue must be present");
const catalogueImgCount = (worksCatalogueHtml.match(/<img\b/g) || []).length;
const catalogueImgWithAltCount = (worksCatalogueHtml.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(catalogueImgCount, 14, "Twelve catalogue photographs and two shared brand marks must be rendered");
assert.equal(catalogueImgWithAltCount, catalogueImgCount, "Every catalogue image must have alt text");

const assetDir = join(outDir, "_astro");
assert.ok(existsSync(assetDir), "Astro must emit processed assets");
const assets = readdirSync(assetDir).filter((file) => statSync(join(assetDir, file)).isFile());
assert.ok(assets.length >= 5, "Expected optimized local project images, fonts or styles in the build output");

for (const route of ["construcao", "facilities", "supply", "business-services", "catalogo-obras", "empresa", "credibilidade", "blog", "acessibilidade", "privacidade", "termos", "source-ao/smart-rfq"]) {
  const content = readFileSync(join(outDir, route, "index.html"), "utf8");
  assert.doesNotMatch(
    content,
    /informacção|instalacção|criaccção|relacção|configuracção|pre-visualizacção|Prestacção/i,
    `Malformed words detected in ${route}`
  );
  assert.equal(content.includes("</p>\\n"), false, `Literal newline escape detected in ${route}`);
}

const htmlImgCount = (html.match(/<img\b/g) || []).length;
const htmlImgWithAltCount = (html.match(/<img\b[^>]*\balt=/g) || []).length;
assert.equal(htmlImgWithAltCount, htmlImgCount, "Every image must have an alt attribute");

console.log(`Astro static output verified: homepage has ${htmlImgCount} accessible images; ${assets.length} processed assets emitted.`);
