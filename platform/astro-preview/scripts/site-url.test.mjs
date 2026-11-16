import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteUrl } from "./site-url.mjs";

test("uses the explicit Astro site URL before deployment-specific defaults", () => {
  assert.equal(
    resolveSiteUrl({
      ASTRO_SITE_URL: "https://comercialhmatiasps.com/path",
      VERCEL_URL: "preview-hmatias.vercel.app",
    }),
    "https://comercialhmatiasps.com",
  );
});

test("uses the Vercel deployment hostname for preview canonicals", () => {
  assert.equal(
    resolveSiteUrl({ VERCEL_URL: "hmatias-astro-preview-abc123.vercel.app" }),
    "https://hmatias-astro-preview-abc123.vercel.app",
  );
});

test("uses the production project domain for a Vercel production build", () => {
  assert.equal(
    resolveSiteUrl({
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "comercialhmatiasps.com",
      VERCEL_URL: "hmatias-astro-preview-abc123.vercel.app",
    }),
    "https://comercialhmatiasps.com",
  );
});

test("preserves the Render preview host when Vercel metadata is absent", () => {
  assert.equal(resolveSiteUrl({}), "https://hmatias-astro-preview.onrender.com");
});

test("rejects a non-HTTPS explicit site URL", () => {
  assert.throws(
    () => resolveSiteUrl({ ASTRO_SITE_URL: "http://comercialhmatiasps.com" }),
    /must use HTTPS/,
  );
});
