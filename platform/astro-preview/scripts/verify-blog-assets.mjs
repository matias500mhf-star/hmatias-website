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
  "anexo-coberto-estrutura-metalica.webp",
  "instalacoes-embutidas-construcao.webp",
  "pavilhoes-rurais-concluidos.webp"
]);
const files = readdirSync(contentRoot).filter((name) => name.endsWith(".md"));
assert.equal(files.length, 12, "The approved bilingual blog must contain six PT/EN article pairs.");

for (const filename of files) {
  const source = readFileSync(resolve(contentRoot, filename), "utf8");
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter, "Missing frontmatter: " + filename);
  const metadata = frontmatter[1];
  assert.doesNotMatch(metadata, /unsplash|photoCredit|photoCreditUrl/i, "Stock image or external photo credit remains: " + filename);
  const imageMatch = metadata.match(/^coverImage: "([^"]+)"/m);
  const altMatch = metadata.match(/^coverAlt: "([^"]+)"/m);
  assert.ok(imageMatch, "Missing cover image: " + filename);
  assert.ok(altMatch && altMatch[1].length >= 20, "Missing meaningful image alternative text: " + filename);
  const imagePath = imageMatch[1];
  assert.ok(imagePath.startsWith("/images/hmatias/"), "Blog cover must use the HMATIAS portfolio: " + filename);
  assert.ok(approvedPhotos.has(basename(imagePath)), "Unapproved portfolio image: " + filename);
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
  assert.doesNotMatch(html, /images\.unsplash\.com|unsplash\.com/i, "Generated article still references stock imagery: " + filename);
}

for (const languagePath of ["blog/index.html", "en/blog/index.html"]) {
  const html = readFileSync(resolve(distRoot, languagePath), "utf8");
  assert.doesNotMatch(html, /images\.unsplash\.com|unsplash\.com/i, "Blog index still references stock imagery: " + languagePath);
  assert.match(html, /images\/hmatias\//, "Blog index must use HMATIAS portfolio photographs: " + languagePath);
}

console.log("PASS: all 12 bilingual blog articles use approved HMATIAS portfolio photographs; no Unsplash stock imagery remains.");
