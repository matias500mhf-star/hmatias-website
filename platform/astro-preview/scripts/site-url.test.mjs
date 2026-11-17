import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteUrl } from "./site-url.mjs";
import { getLanguagePair, getLanguageSwitchPath } from "../src/data/locales.ts";

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

test("keeps all six Portuguese and English blog articles paired after slug changes", () => {
  const pairs = [
    ["/blog/como-preparar-um-pedido-de-cotacao/", "/en/blog/how-to-prepare-a-comparable-supply-quotation/"],
    ["/blog/avaliar-propostas-fornecimento-sem-comparar-apenas-preco/", "/en/blog/evaluating-supply-proposals-beyond-price/"],
    ["/blog/comparar-propostas-perfis-metalicos-chapas-cobertura/", "/en/blog/comparing-metal-profiles-and-roofing-sheets/"],
    ["/blog/substituicao-localizada-cobertura-metalica/", "/en/blog/localised-metal-roof-replacement/"],
    ["/blog/plano-manutencao-preventiva-instalacoes/", "/en/blog/preventive-facilities-maintenance-plan/"],
    ["/blog/recepcao-e-conferencia-de-fornecimentos/", "/en/blog/receiving-and-inspecting-supply-deliveries/"],
  ];

  for (const [pt, en] of pairs) {
    assert.deepEqual(getLanguagePair(pt), { pt, en });
    assert.deepEqual(getLanguagePair(en), { pt, en });
    assert.equal(getLanguageSwitchPath(pt, false), en);
    assert.equal(getLanguageSwitchPath(en, true), pt);
  }
});
