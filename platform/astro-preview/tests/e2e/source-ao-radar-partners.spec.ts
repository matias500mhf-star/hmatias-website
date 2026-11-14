import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const radarRoutes = [
  { path: "/source-ao/radar/", lang: "pt-AO", unavailable: "API de staging não configurada" },
  { path: "/en/source-ao/radar/", lang: "en", unavailable: "Staging API not configured" },
];
const partnerRoutes = [
  { path: "/source-ao/parceiros/", lang: "pt-AO", privacy: "/privacidade/", title: "Apresente a sua empresa para avaliação." },
  { path: "/en/source-ao/partners/", lang: "en", privacy: "/en/privacy/", title: "Submit your company for assessment." },
];

test.describe("SOURCE AO — Radar e candidaturas de parceiros", () => {
  test("SOURCE AO landing page exposes the real Radar, RFQ and partner routes", async ({ page }) => {
    await page.goto("/source-ao/");
    await expect(page.locator(".source-rfq .source-button")).toHaveAttribute("href", "/source-ao/smart-rfq/");
    await expect(page.getByRole("link", { name: "Consultar Radar de Oportunidades" })).toHaveAttribute("href", "/source-ao/radar/");
    await expect(page.getByRole("link", { name: "Candidatura de parceiros" })).toHaveAttribute("href", "/source-ao/parceiros/");
    await page.goto("/en/source-ao/");
    await expect(page.getByRole("link", { name: "View Opportunity Radar" })).toHaveAttribute("href", "/en/source-ao/radar/");
    await expect(page.getByRole("link", { name: "Partner application" })).toHaveAttribute("href", "/en/source-ao/partners/");
  });

  test("public catalogue search stays safely disabled without the staging API", async ({ page }) => {
    let apiRequests = 0;
    page.on("request", request => {
      if (/\/api\/(search|catalog|sourcing-requests)/.test(new URL(request.url()).pathname)) apiRequests += 1;
    });

    for (const route of [
      { path: "/source-ao/", lang: "pt-AO", rfq: "/source-ao/smart-rfq/", notice: /aguarda a configuração da API de staging/i },
      { path: "/en/source-ao/", lang: "en", rfq: "/en/source-ao/smart-rfq/", notice: /awaiting staging API configuration/i },
    ]) {
      await page.goto(route.path);
      await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
      await expect(page.locator("#sourceAoSearchForm")).toBeVisible();
      await expect(page.locator("#sourceAoSearchQuery")).toBeDisabled();
      await expect(page.locator("#sourceAoSearchForm button[type='submit']")).toBeDisabled();
      await expect(page.locator("#sourceAoSearchStatus")).toContainText(route.notice);
      await expect(page.locator(".source-live-search-footnote a")).toHaveAttribute("href", route.rfq);
    }

    expect(apiRequests).toBe(0);
  });

  for (const route of radarRoutes) {
    test(`Radar ${route.lang} is isolated, honest about live status and operational`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
      await expect(page.locator("main[data-radar-preview]")).toBeVisible();
      await expect(page.locator(".source-radar-stage-note")).toBeVisible();
      await expect(page.locator(".source-radar-stage-note")).toContainText(/staging/i);
      await expect(page.locator("#refreshRadar")).toBeVisible();
      await expect(page.locator("#opportunitySearch")).toBeVisible();
      await expect(page.locator("#opList")).toContainText(
        route.lang === "en" ? "No active opportunity in this filter." : "Nenhuma oportunidade ativa neste filtro."
      );
      await expect(page.locator("#syncStatus")).toContainText(route.unavailable);
      await page.locator("#refreshRadar").click();
      await expect(page.locator("#syncStatus")).toContainText(route.unavailable);
      await page.locator("#langToggle").click();
      await expect(page.locator("html")).toHaveAttribute("lang", route.lang === "en" ? "pt-AO" : "en");
      await expect(page.locator("#radarHomeLink")).toHaveAttribute("href", route.lang === "en" ? "/source-ao/" : "/en/source-ao/");
      await expect(page.locator("#radarRfqLink")).toHaveAttribute("href", route.lang === "en" ? "/source-ao/smart-rfq/" : "/en/source-ao/smart-rfq/");
      await expect(page.locator("#radarPartnerLink")).toHaveAttribute("href", route.lang === "en" ? "/source-ao/parceiros/" : "/en/source-ao/partners/");
      expect(errors).toEqual([]);
    });
  }

  for (const route of partnerRoutes) {
    test(`partner application ${route.lang} has required privacy consent and safe preview mode`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.title);
      await expect(page.locator("#partnerForm")).toBeVisible();
      await expect(page.locator("#confirmAccuracy")).toHaveAttribute("required", "");
      await expect(page.locator("#confirmAccuracy")).not.toBeChecked();
      await expect(page.locator("#partnerForm button[type='submit']")).toBeDisabled();
      await expect(page.locator(".partner-stage-note")).toContainText(/staging/i);
      await expect(page.locator(".consent a")).toHaveAttribute("href", route.privacy);
      await expect(page.locator(".consent")).toContainText(/eventual relação comercial|potential commercial relationship/i);
      await expect(page.locator(".language-switch")).toHaveAttribute(
        "href",
        route.lang === "en" ? "/source-ao/parceiros/" : "/en/source-ao/partners/"
      );
      expect(errors).toEqual([]);
    });
  }

  test("Radar and partner routes do not overflow a mobile viewport", async ({ page }) => {
    for (const route of [...radarRoutes, ...partnerRoutes]) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route.path);
      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.documentWidth, route.path).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
    }
  });

  test("Radar and partner pages have no critical or serious accessibility violations", async ({ page }) => {
    for (const route of [...radarRoutes, ...partnerRoutes]) {
      await page.goto(route.path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(item => ["critical", "serious"].includes(item.impact || ""));
      expect(blocking, route.path).toEqual([]);
    }
  });
});


test("the public SOURCE AO catalogue contains reviewed SYNVOR families without private commercial fields", async ({ page }) => {
  const response = await page.request.get("/api/source-ao/catalog.json");
  expect(response.status()).toBe(200);
  const catalogue = await response.json();

  expect(catalogue.version).toBe("1.0");
  expect(catalogue.items).toHaveLength(135);
  expect(catalogue.items.filter((item: { id: string }) => item.id.startsWith("item-disc-family-"))).toHaveLength(8);
  expect(catalogue.items.filter((item: { id: string }) => item.id.startsWith("item-crown-family-"))).toHaveLength(33);
  expect(catalogue.items.filter((item: { id: string }) => item.id.startsWith("item-carbodiam-sku-"))).toHaveLength(43);

  const items = new Map(catalogue.items.map((item: { id: string }) => [item.id, item]));
  for (const id of [
    "item-carbodiam-pantera-115",
    "item-carbodiam-pantera-neutre-115",
    "item-carbodiam-crack-chaser-115",
    "item-carbodiam-sku-pantera-pantera-125-ref-9194",
    "item-carbodiam-sku-neutre-pantera-neutre-125-ref-15449",
    "item-carbodiam-sku-crack-crack-chaser-125-ref-11603",
    "item-carbodiam-sku-acier-acier-300-h20-ref-14491",
    "item-carbodiam-sku-beton-beton-400-ref-19722",
    "item-carbodiam-sku-betonsol-beton-sol-600-1-ref-13745",
    "item-carbodiam-sku-incisor-incisor-125-ref-5182",
    "item-crown-family-carbodiam-profor",
    "item-crown-family-samedia-master-dbk",
    "item-synvor-diamond-grinding-cups",
    "item-synvor-metal-grinding-segments",
    "item-synvor-diamond-polishing-resins",
    "item-carbodiam-multicut-400p",
    "item-weka-dk17",
  ]) {
    expect(items.has(id), "missing public catalogue item " + id).toBe(true);
  }

  expect(items.has("item-formaldehyde")).toBe(false);
  const allowed = new Set(["id", "name", "aliases", "category", "subcategory", "specification", "keywords", "name_pt"]);
  for (const item of catalogue.items) {
    for (const key of Object.keys(item)) expect(allowed.has(key), "unapproved public field " + key).toBe(true);
  }
  expect(catalogue.public_rule).toContain("Prices, suppliers, stock, availability and internal commercial data are not included");
});
