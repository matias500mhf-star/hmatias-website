import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const radarRoutes = [
  { path: "/source-ao/radar/", lang: "pt-AO", unavailable: "Ligação live temporariamente indisponível" },
  { path: "/en/source-ao/radar/", lang: "en", unavailable: "Live connection temporarily unavailable" },
];
const partnerRoutes = [
  { path: "/source-ao/parceiros/", lang: "pt-AO", privacy: "/privacidade/", title: "Apresente a sua empresa para avaliação." },
  { path: "/en/source-ao/partners/", lang: "en", privacy: "/en/privacy/", title: "Submit your company for assessment." },
];

test.describe("SOURCE AO — Radar e candidaturas de parceiros", () => {
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
      await expect(page.locator("#confirmAccuracy")).toBeRequired();
      await expect(page.locator("#confirmAccuracy")).not.toBeChecked();
      await expect(page.locator("#partnerForm button[type='submit']")).toBeDisabled();
      await expect(page.locator(".partner-stage-note")).toContainText(/staging/i);
      await expect(page.locator(".consent a")).toHaveAttribute("href", route.privacy);
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
