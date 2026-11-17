import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const contentRoot = resolve(scriptDir, "../src/content/blog");
const distRoot = resolve(scriptDir, "../dist");
const files = readdirSync(contentRoot).filter((name) => name.endsWith(".md"));
const imageCounts = new Map();
assert.equal(files.length, 12, "The bilingual blog must contain six PT/EN article pairs.");

for (const filename of files) {
  const source = readFileSync(resolve(contentRoot, filename), "utf8");
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter, "Missing frontmatter: " + filename);
  const metadata = frontmatter[1];
  assert.doesNotMatch(source, /fictional scenario|fictitious case/i, "Fictitious content must not be presented as HMATIAS work: " + filename);
  const contentType = metadata.match(/^contentType: "([^"]+)"/m)?.[1] ?? "guide";
  assert.equal(contentType, "guide", "Published blog items must remain factual guides or technical notes: " + filename);
  const imageMatch = metadata.match(/^coverImage: "([^"]+)"/m);
  const altMatch = metadata.match(/^coverAlt: "([^"]+)"/m);
  const creditMatch = metadata.match(/^coverCredit: "([^"]+)"/m);
  const creditUrlMatch = metadata.match(/^coverCreditUrl: "([^"]+)"/m);
  assert.ok(imageMatch, "Missing cover image: " + filename);
  assert.ok(altMatch && altMatch[1].length >= 20, "Missing meaningful image alternative text: " + filename);
  assert.ok(creditMatch && creditUrlMatch, "Missing photographer attribution: " + filename);
  const cover = new URL(imageMatch[1]);
  assert.equal(cover.hostname, "images.unsplash.com", "Editorial cover must use the approved image CDN: " + filename);
  const credit = new URL(creditUrlMatch[1]);
  assert.equal(credit.hostname, "unsplash.com", "Photo credit must link to Unsplash: " + filename);
  imageCounts.set(cover.pathname, (imageCounts.get(cover.pathname) ?? 0) + 1);

  const language = /language: "en"/.test(metadata) ? "en" : "pt-AO";
  const slug = filename.replace(/\.md$/, "");
  const htmlPath = language === "en"
    ? resolve(distRoot, "en", "blog", slug, "index.html")
    : resolve(distRoot, "blog", slug, "index.html");
  assert.ok(existsSync(htmlPath), "Generated blog article is missing: " + htmlPath);
  const html = readFileSync(htmlPath, "utf8");
  assert.ok(html.includes(cover.pathname), "Generated article does not use its assigned image: " + filename);
  assert.match(html, /srcset=/, "Responsive srcset is missing: " + filename);
  assert.match(html, /Illustrative image|Imagem ilustrativa/, "The image must be explicitly labelled illustrative: " + filename);
  assert.match(html, /Photo credit|Crédito fotográfico/, "The photo credit is missing from the article page: " + filename);
  assert.match(html, /<meta property="og:type" content="article"/, "Article Open Graph type is missing: " + filename);
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(ogImage && new URL(ogImage).hostname === "images.unsplash.com", "Article social preview must use the assigned Unsplash image: " + filename);
}

assert.equal(imageCounts.size, 6, "Each bilingual article pair must use a distinct editorial image.");
for (const [imagePath, count] of imageCounts) assert.equal(count, 2, "Each editorial image must be reused only by its PT/EN pair: " + imagePath);

for (const languagePath of ["blog/index.html", "en/blog/index.html"]) {
  const html = readFileSync(resolve(distRoot, languagePath), "utf8");
  assert.match(html, /images\.unsplash\.com/, "Blog index must show editorial imagery: " + languagePath);
  assert.match(html, /srcset=/, "Blog index images must be responsive: " + languagePath);
  assert.match(html, /Photo credit|Crédito fotográfico/, "Blog index must show image credits: " + languagePath);
  assert.match(html, /illustrative|ilustrativas/i, "Blog index must label stock images as illustrative: " + languagePath);
}

console.log("PASS: the 12 bilingual blog articles use six distinct, credited illustrative images with responsive variants.");
