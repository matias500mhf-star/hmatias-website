import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const contentRoot = resolve(scriptDir, "../src/content/blog");
const publicRoot = resolve(scriptDir, "../public");
const distRoot = resolve(scriptDir, "../dist");
const approvedPhotos = new Set([
  "logistica-estrutura-metalica.webp",
  "perfis-metalicos-estrutura.webp",
  "chapas-cobertura-fornecimento.webp",
  "cobertura-metalica-substituicao.webp",
  "instalacoes-embutidas-construcao.webp",
  "pavilhoes-rurais-concluidos.webp"
]);
const files = readdirSync(contentRoot).filter((name) => name.endsWith(".md"));
const imageCounts = new Map();
assert.equal(files.length, 12, "The approved bilingual blog must contain six PT/EN article pairs.");

for (const filename of files) {
  const source = readFileSync(resolve(contentRoot, filename), "utf8");
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter, "Missing frontmatter: " + filename);
  const metadata = frontmatter[1];
  assert.doesNotMatch(source, /fictional scenario|fictitious case|illustrative case study/i, "Fictional case-study content must not be published as HMATIAS editorial: " + filename);
  const contentType = metadata.match(/^contentType: "([^"]+)"/m)?.[1] ?? "guide";
  assert.equal(contentType, "guide", "Published blog items must be factual guides or technical notes: " + filename);
  assert.doesNotMatch(metadata, /unsplash|photoCredit|photoCreditUrl/i, "Stock image or external photo credit remains: " + filename);
  const imageMatch = metadata.match(/^coverImage: "([^"]+)"/m);
  const altMatch = metadata.match(/^coverAlt: "([^"]+)"/m);
  assert.ok(imageMatch, "Missing cover image: " + filename);
  assert.ok(altMatch && altMatch[1].length >= 20, "Missing meaningful image alternative text: " + filename);
  const imagePath = imageMatch[1];
  assert.ok(imagePath.startsWith("/images/hmatias/"), "Blog cover must use the HMATIAS portfolio: " + filename);
  assert.ok(approvedPhotos.has(basename(imagePath)), "Unapproved portfolio image: " + filename);
  imageCounts.set(imagePath, (imageCounts.get(imagePath) ?? 0) + 1);
  assert.ok(existsSync(resolve(publicRoot, "." + imagePath)), "Portfolio image was not copied to public assets: " + imagePath);
  assert.ok(existsSync(resolve(distRoot, "." + imagePath)), "Portfolio image is missing from the production build: " + imagePath);

  const language = /language: "en"/.test(metadata) ? "en" : "pt-AO";
  const slug = filename.replace(/\.md$/, "");
  const htmlPath = language === "en"
    ? resolve(distRoot, "en", "blog", slug, "index.html")
    : resolve(distRoot, "blog", slug, "index.html");
  assert.ok(existsSync(htmlPath), "Generated blog article is missing: " + htmlPath);
  const html = readFileSync(htmlPath, "utf8");
  assert.ok(html.includes('src="' + imagePath + '"'), "Generated article does not use its approved HMATIAS image: " + filename);
  assert.match(html, /<meta property="og:type" content="article"/, "Article Open Graph type is missing: " + filename);
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(ogImage?.endsWith(imagePath), "Article social preview must use its authentic portfolio image: " + filename);
  assert.doesNotMatch(html, /images\.unsplash\.com|unsplash\.com/i, "Generated article still references stock imagery: " + filename);
}

assert.equal(imageCounts.size, 6, "Each article pair must use its own distinct portfolio photograph.");
for (const [imagePath, count] of imageCounts) assert.equal(count, 2, "Each portfolio image must be used only by its PT/EN pair: " + imagePath);

for (const languagePath of ["blog/index.html", "en/blog/index.html"]) {
  const html = readFileSync(resolve(distRoot, languagePath), "utf8");
  assert.doesNotMatch(html, /images\.unsplash\.com|unsplash\.com/i, "Blog index still references stock imagery: " + languagePath);
  assert.match(html, /images\/hmatias\//, "Blog index must use HMATIAS portfolio photographs: " + languagePath);
}

console.log("PASS: all 12 bilingual blog articles use approved HMATIAS portfolio photographs; no Unsplash stock imagery remains.");
