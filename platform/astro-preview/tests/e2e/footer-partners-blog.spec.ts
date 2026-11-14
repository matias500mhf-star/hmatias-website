import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const homepageRoutes = [
  { route: "/", language: "pt-AO", explore: "Explorar", contact: "Contacto e localização", sourceHref: "/source-ao/" },
  { route: "/en/", language: "en", explore: "Explore", contact: "Contact and location", sourceHref: "/en/source-ao/" },
] as const;

const articlePairs = [
  {
    pt: "/blog/como-preparar-um-pedido-de-cotacao/",
    en: "/en/blog/how-to-prepare-a-comparable-supply-quotation/",
    categoryPt: "Procurement e fornecimento",
    categoryEn: "Procurement and Supply",
  },
  {
    pt: "/blog/avaliar-propostas-fornecimento-sem-comparar-apenas-preco/",
    en: "/en/blog/evaluating-supply-proposals-beyond-price/",
    categoryPt: "Procurement e fornecimento",
    categoryEn: "Procurement and Supply",
  },
  {
    pt: "/blog/caso-pratico-intervencao-cobertura-industrial/",
    en: "/en/blog/industrial-roofing-intervention-case-study/",
    categoryPt: "Obras e manutenção",
    categoryEn: "Construction and Maintenance",
  },
  {
    pt: "/blog/caso-pratico-comparacao-tres-propostas-fornecimento/",
    en: "/en/blog/illustrative-case-study-comparing-three-supply-proposals/",
    categoryPt: "Casos práticos",
    categoryEn: "Illustrative Case Studies",
  },
  {
    pt: "/blog/plano-manutencao-preventiva-instalacoes/",
    en: "/en/blog/preventive-facilities-maintenance-plan/",
    categoryPt: "Gestão operacional",
    categoryEn: "Operations Management",
  },
  {
    pt: "/blog/recepcao-e-conferencia-de-fornecimentos/",
    en: "/en/blog/receiving-and-inspecting-supply-deliveries/",
    categoryPt: "Procurement e fornecimento",
    categoryEn: "Procurement and Supply",
  },
] as const;

for (const homepage of homepageRoutes) {
  test("homepage " + homepage.language + " alinha rodapé, parceiros e acessibilidade", async ({ page }, testInfo) => {
    const response = await page.goto(homepage.route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", homepage.language);
    await expect(page.locator(".partner-section")).toBeVisible();

    const footerColumns = page.locator(".footer-main > .footer-column");
    await expect(footerColumns).toHaveCount(4);
    await expect(page.locator(".footer-operations h2")).toContainText(homepage.language === "en" ? "Areas and services" : "Áreas e serviços");
    await expect(page.locator(".footer-explore h2")).toHaveText(homepage.explore);
    await expect(page.locator(".footer-contacts h2")).toHaveText(homepage.contact);

    await page.locator(".partner-logos").scrollIntoViewIfNeeded();

    const partners = page.locator(".partner-logo");
    await expect(partners).toHaveCount(6);
    await expect(partners.nth(0).locator("img")).toHaveAttribute("alt", "Miliart");
    await expect(partners.nth(1).locator("img")).toHaveAttribute("alt", /FRANSGA/);
    await expect(partners.nth(2).locator("img")).toHaveAttribute("alt", "D&WOOD");
    await expect(partners.nth(3)).toHaveText("Telewise");
    await expect(partners.nth(3).locator("img")).toHaveCount(0);
    await expect(partners.nth(4).locator("img")).toHaveAttribute("alt", "SYNVOR Industrial");
    await expect(partners.nth(5).locator("img")).toHaveAttribute("alt", "Kent Offshore");
    await expect(page.locator(".partner-logo img")).toHaveCount(5);

    await expect.poll(() => page.locator(".partner-logo img").evaluateAll((images) =>
      images.every((image) => image.complete && image.naturalWidth > 0)
    )).toBe(true);

    const whatsapp = page.locator(".footer-contacts .footer-whatsapp");
    const instagram = page.locator(".footer-socials a");
    const responsiveWidths = [
      { width: 1280, footerColumns: 4, partnerColumns: 3 },
      { width: 768, footerColumns: 2, partnerColumns: 2 },
      { width: 390, footerColumns: 1, partnerColumns: 1 },
    ];
    for (const layout of responsiveWidths) {
      await page.setViewportSize({ width: layout.width, height: 900 });
      const gridColumns = await page.locator(".footer-main").evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
      );
      const partnerGridColumns = await page.locator(".partner-logos").evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
      );
      expect(gridColumns, "Footer columns at " + layout.width + "px").toBe(layout.footerColumns);
      expect(partnerGridColumns, "Partner columns at " + layout.width + "px").toBe(layout.partnerColumns);

      const contactRight = await page.locator(".footer-contacts").evaluate((element) => element.getBoundingClientRect().right);
      const whatsappRight = await whatsapp.evaluate((element) => element.getBoundingClientRect().right);
      const instagramRight = await instagram.evaluate((element) => element.getBoundingClientRect().right);
      expect(Math.abs(contactRight - whatsappRight), "WhatsApp alignment at " + layout.width + "px").toBeLessThanOrEqual(1);
      expect(Math.abs(contactRight - instagramRight), "Instagram alignment at " + layout.width + "px").toBeLessThanOrEqual(1);

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(overflow.document, "Horizontal overflow at " + layout.width + "px").toBeLessThanOrEqual(overflow.viewport + 1);
    }

    const projectViewport = testInfo.project.use.viewport ?? { width: 1280, height: 900 };
    await page.setViewportSize(projectViewport);

    const operations = page.locator(".footer-operations");
    await expect(operations.getByRole("link", { name: /Construction|Construção Civil/ })).toBeVisible();
    await expect(operations.getByRole("link", { name: /Facilities/ })).toBeVisible();
    await expect(operations.getByRole("link", { name: "HMATIAS Supply" })).toBeVisible();
    await expect(operations.getByRole("link", { name: "Business Services" })).toBeVisible();
    await expect(operations.getByRole("link", { name: "Smart RFQ" })).toHaveAttribute("href", homepage.language === "en" ? "/en/source-ao/smart-rfq/" : "/source-ao/smart-rfq/");
    await expect(page.locator(".footer-explore").getByRole("link", { name: /KARTA Wallet/ })).toContainText("Alpha");

    await expect(whatsapp).toHaveAttribute("aria-label", /WhatsApp/);
    await expect(whatsapp.locator("img")).toHaveAttribute("src", /social-whatsapp\.svg/);
    await expect(instagram).toHaveAttribute("aria-label", "Instagram HMATIAS");
    await expect(instagram.locator("img")).toHaveAttribute("src", /social-instagram\.svg/);


    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const seriousViolations = axe.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({ id: violation.id, help: violation.help, nodes: violation.nodes.map((node) => node.target) }));
    expect(seriousViolations).toEqual([]);
  });
}

for (const pair of articlePairs) {
  test("artigos PT/EN mantêm categoria e ligação recíproca: " + pair.pt, async ({ page }) => {
    for (const variant of [
      { route: pair.pt, counterpart: pair.en, language: "pt-AO", category: pair.categoryPt, switchLanguage: "en" },
      { route: pair.en, counterpart: pair.pt, language: "en", category: pair.categoryEn, switchLanguage: "pt-AO" },
    ]) {
      const response = await page.goto(variant.route);
      expect(response?.status(), variant.route).toBe(200);
      await expect(page.locator("html"), variant.route).toHaveAttribute("lang", variant.language);
      await expect(page.locator("main h1"), variant.route).toBeVisible();
      await expect(page.locator("main h1"), variant.route).not.toHaveText("");
      await expect(page.locator(".preview-bar > span").nth(1), variant.route).toHaveText(variant.category.toUpperCase());
      await expect(page.locator(".language-switch"), variant.route).toHaveAttribute("href", variant.counterpart);
      await expect(page.locator(".language-switch"), variant.route).toHaveAttribute("lang", variant.switchLanguage);
      await expect(page.locator(".article-content")).toBeVisible();
      await expect(page.locator(".article-content h2").first()).toBeVisible();
      await expect(page.locator(".article-cta a.button-light")).toHaveAttribute(
        "href",
        variant.language === "en" ? "/en/source-ao/smart-rfq/" : "/source-ao/smart-rfq/",
      );

      const missingAlt = await page.locator("img").evaluateAll((images) =>
        images.filter((image) => !(image.getAttribute("alt") || "").trim())
          .map((image) => image.getAttribute("src") || "(imagem sem texto alternativo)")
      );
      expect(missingAlt, variant.route).toEqual([]);
    }
  });
}
