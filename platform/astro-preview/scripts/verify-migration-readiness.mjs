import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(projectRoot, "dist");
const manifestPath = join(projectRoot, "migration", "legacy-url-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

assert.equal(manifest.production_changes_permitted, false, "The prototype must never authorize production changes");
assert.equal(manifest.preview_must_remain_noindex, true, "The preview must remain protected from indexing");
assert.ok(Array.isArray(manifest.routes), "Migration routes must be an array");

const legacyRoutes = manifest.routes.filter((route) => route.in_legacy_sitemap);
assert.equal(
  legacyRoutes.length,
  manifest.legacy_sitemap_expected_count,
  "Every URL in the legacy sitemap must have exactly one inventory entry"
);

const seen = new Set();
for (const route of manifest.routes) {
  assert.ok(route.source_url?.startsWith("/"), "Source URLs must be root-relative");
  assert.ok(!route.source_url.startsWith("//"), "Protocol-relative source URLs are not allowed");
  assert.ok(!seen.has(route.source_url), `Duplicate migration inventory entry: ${route.source_url}`);
  seen.add(route.source_url);
  assert.ok(route.treatment, `A migration decision is required for ${route.source_url}`);
  assert.ok(route.notes?.trim(), `A decision rationale is required for ${route.source_url}`);

  if (route.in_legacy_sitemap) {
    assert.equal(
      route.preserve_until_approved,
      true,
      `Legacy URL must remain protected until approval: ${route.source_url}`
    );
  }

  if (route.treatment === "preserve_official" || route.treatment === "unverified_repository_page") {
    assert.equal(route.preview_target, null, `Preserved legacy page must not pretend to have an equivalent preview: ${route.source_url}`);
    continue;
  }

  assert.ok(route.preview_target?.startsWith("/"), `Preview target missing for ${route.source_url}`);
  assert.ok(!route.preview_target.startsWith("//"), "Protocol-relative preview targets are not allowed");

  const relativeTarget = route.preview_target === "/"
    ? "index.html"
    : join(route.preview_target.replace(/^\/+|\/+$/g, ""), "index.html");
  const targetPath = resolve(distRoot, relativeTarget);
  assert.ok(
    targetPath.startsWith(distRoot + sep) || targetPath === join(distRoot, "index.html"),
    `Preview target escapes the build directory: ${route.preview_target}`
  );
  assert.ok(
    existsSync(targetPath),
    `Mapped preview route was not generated for ${route.source_url}: ${route.preview_target}`
  );

  const targetHtml = readFileSync(targetPath, "utf8");
  assert.match(
    targetHtml,
    /<meta[^>]+name=["']robots["'][^>]+content=["']noindex,\s*nofollow["']/i,
    `Preview target must remain noindex,nofollow: ${route.preview_target}`
  );
}

assert.ok(manifest.launch_gates.length >= 8, "Production launch gates must be explicit");
console.log(
  `Migration inventory PASS: ${legacyRoutes.length} legacy sitemap URLs, ${manifest.routes.length - legacyRoutes.length} additional repository URLs, ${manifest.routes.filter((route) => route.preview_target).length} generated preview mappings. Production changes remain disabled.`
);
