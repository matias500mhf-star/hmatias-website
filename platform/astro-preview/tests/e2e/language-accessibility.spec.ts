import { expect, test } from "@playwright/test";

test.describe("Bilingual brand and language accessibility", () => {
  test("English pages expose English brand descriptions and language controls", async ({ page }) => {
    await page.goto("/en/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator(".brand img")).toHaveAttribute(
      "alt",
      "HMATIAS — Construction, Facilities, Supply and Business Services",
    );
    await expect(page.locator(".footer-logo img")).toHaveAttribute(
      "alt",
      "HMATIAS — Construction, Facilities, Supply and Business Services",
    );

    const languageSwitch = page.locator(".language-switch");
    await expect(languageSwitch).toHaveAttribute("href", "/");
    await expect(languageSwitch).toHaveAttribute("lang", "pt-AO");
    await expect(languageSwitch).toHaveAttribute("aria-label", "Switch to Portuguese");

    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "HMATIAS — Construction, Facilities, Supply and Business Services",
    );

    const legalIdentity = page.locator(".footer-legal-id");
    await expect(legalIdentity).toContainText("Tax ID");
    await expect(legalIdentity).toContainText("Commercial Registration");
    await expect(legalIdentity).not.toContainText("NIF");
    await expect(legalIdentity).not.toContainText("Registo Comercial");
  });

  test("Portuguese pages retain Portuguese brand descriptions and language controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "pt-AO");
    await expect(page.locator(".brand img")).toHaveAttribute(
      "alt",
      "HMATIAS — Prestação de Serviços",
    );
    await expect(page.locator(".footer-logo img")).toHaveAttribute(
      "alt",
      "HMATIAS — Prestação de Serviços",
    );

    const languageSwitch = page.locator(".language-switch");
    await expect(languageSwitch).toHaveAttribute("href", "/en/");
    await expect(languageSwitch).toHaveAttribute("lang", "en");
    await expect(languageSwitch).toHaveAttribute("aria-label", "Mudar para inglês");

    await expect(page.locator(".footer-legal-id")).toContainText("NIF");
    await expect(page.locator(".footer-legal-id")).toContainText("Registo Comercial");
  });

  test("English mobile navigation announces its state in English", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-webkit", "Mobile viewport test only.");
    await page.goto("/en/");

    const toggle = page.locator(".menu-toggle");
    const nav = page.locator("#main-nav");

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Open menu");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Close menu");
    await expect(nav).toHaveClass(/is-open/);

    await nav.getByRole("link", { name: "Services" }).click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Open menu");
    await expect(nav).not.toHaveClass(/is-open/);
  });
});

test("all English routes expose matching language, brand descriptions and reciprocal Portuguese links", async ({ page }) => {
  const routes = [
    ["/en/", "/"],
    ["/en/about/", "/empresa/"],
    ["/en/credibility/", "/credibilidade/"],
    ["/en/construction/", "/construcao/"],
    ["/en/facilities/", "/facilities/"],
    ["/en/supply/", "/supply/"],
    ["/en/business-services/", "/business-services/"],
    ["/en/works-catalogue/", "/catalogo-obras/"],
    ["/en/blog/", "/blog/"],
    ["/en/blog/how-to-prepare-a-comparable-supply-quotation/", "/blog/como-preparar-um-pedido-de-cotacao/"],
    ["/en/source-ao/smart-rfq/", "/source-ao/smart-rfq/"],
    ["/en/accessibility/", "/acessibilidade/"],
    ["/en/privacy/", "/privacidade/"],
    ["/en/terms/", "/termos/"],
  ] as const;

  for (const [englishRoute, portugueseRoute] of routes) {
    await page.goto(englishRoute);
    await expect(page.locator("html"), englishRoute).toHaveAttribute("lang", "en");
    await expect(page.locator(".brand img"), englishRoute).toHaveAttribute(
      "alt",
      "HMATIAS — Construction, Facilities, Supply and Business Services",
    );
    await expect(page.locator(".footer-logo img"), englishRoute).toHaveAttribute(
      "alt",
      "HMATIAS — Construction, Facilities, Supply and Business Services",
    );
    await expect(page.locator('meta[property="og:image:alt"]'), englishRoute).toHaveAttribute(
      "content",
      "HMATIAS — Construction, Facilities, Supply and Business Services",
    );
    await expect(page.locator(".language-switch"), englishRoute).toHaveAttribute("href", portugueseRoute);
    await expect(page.locator(".language-switch"), englishRoute).toHaveAttribute("lang", "pt-AO");
    await expect(page.locator(".language-switch"), englishRoute).toHaveAttribute("aria-label", "Switch to Portuguese");
    await expect(page.locator(".footer-legal-id"), englishRoute).toContainText("Tax ID");
    await expect(page.locator(".footer-legal-id"), englishRoute).toContainText("Commercial Registration");
  }
});
