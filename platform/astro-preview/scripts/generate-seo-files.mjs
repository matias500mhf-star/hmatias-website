import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { resolveSiteUrl } from "./site-url.mjs";

const distRoot = new URL("../dist/", import.meta.url);
const configuredSite = new URL(resolveSiteUrl(process.env));
const productionIndexingEnabled = process.env.PUBLIC_INDEXING_ENABLED === "true"
  && configuredSite.protocol === "https:"
  && configuredSite.hostname === "comercialhmatiasps.com";

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

const robots = productionIndexingEnabled
  ? `User-agent: *
Allow: /

Sitemap: ${new URL("/sitemap.xml", configuredSite).toString()}
`
  : `User-agent: *
Disallow: /
`;

await writeFile(new URL("robots.txt", distRoot), robots, "utf8");

const sitemapPath = new URL("sitemap.xml", distRoot);
if (!productionIndexingEnabled) {
  // Preview deployments must not advertise an indexable sitemap.
  const { rm } = await import("node:fs/promises");
  await rm(sitemapPath, { force: true });
  console.log("SEO files generated: preview robots.txt blocks crawling; sitemap intentionally omitted.");
  process.exit(0);
}

const urls = new Set();
for (const file of await collectHtml(distRoot)) {
  const relativePath = relative(new URL(distRoot).pathname, file);
  if (relativePath === "404.html" || relativePath.startsWith(`404${sep}`)) continue;

  const html = await readFile(file, "utf8");
  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  if (!robotsMatch || !/^index,\s*follow$/i.test(robotsMatch[1])) continue;

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  assert.ok(canonicalMatch, `Indexable page is missing canonical: ${relativePath}`);

  const canonical = new URL(canonicalMatch[1]);
  assert.equal(canonical.origin, configuredSite.origin, `Canonical must use the configured production origin: ${relativePath}`);
  assert.ok(canonical.pathname.endsWith("/"), `Canonical must follow the trailing-slash policy: ${relativePath}`);
  urls.add(canonical.toString());
}

assert.ok(urls.has(new URL("/", configuredSite).toString()), "Production sitemap must include the canonical homepage");
assert.ok(urls.size >= 40, `Production sitemap unexpectedly small: ${urls.size} URLs`);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...[...urls].sort().map((url) => `  <url><loc>${url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</loc></url>`),
  '</urlset>',
  ''
].join("\n");

await writeFile(sitemapPath, xml, "utf8");
console.log(`SEO files generated: production robots.txt and sitemap.xml with ${urls.size} canonical, indexable URLs.`);
