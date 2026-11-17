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
    // Inspect menu links in a desktop layout even when this test runs in the mobile browser project.
    await page.setViewportSize({ width: 1280, height: 900 });

    const nav = page.locator(".main-nav");
    const isEnglish = homepage.language === "en";
    await expect(nav.locator(":scope > .nav-link")).toHaveCount(2);
    await expect(nav.locator(".nav-item")).toHaveCount(4);
    await expect(nav.locator(".nav-home")).toHaveAttribute("href", isEnglish ? "/en/#inicio" : "/#inicio");
    await expect(nav.locator(".nav-about")).toHaveAttribute("href", isEnglish ? "/en/about/" : "/empresa/");
    await expect(nav.locator(".nav-blog")).toHaveAttribute("href", isEnglish ? "/en/blog/" : "/blog/");
    await expect(nav.getByRole("link", { name: isEnglish ? "Services" : "Serviços", exact: true })).toHaveAttribute("href", isEnglish ? "/en/#servicos" : "/#servicos");
    await expect(nav.getByRole("link", { name: isEnglish ? "Projects" : "Projetos", exact: true })).toHaveAttribute("href", isEnglish ? "/en/#projetos" : "/#projetos");
    await expect(nav.getByRole("link", { name: "SOURCE AO", exact: true })).toHaveAttribute("href", homepage.sourceHref);
    await expect(nav.locator(".nav-item").nth(0).locator(".nav-submenu a")).toHaveCount(3);
    await expect(nav.locator(".nav-item").nth(1).locator(".nav-submenu a")).toHaveCount(4);
    await expect(nav.locator(".nav-item").nth(2).locator(".nav-submenu a")).toHaveCount(2);
    await expect(nav.locator(".nav-item").nth(3).locator(".nav-submenu a")).toHaveCount(3);
    const expectedAboutTargets = isEnglish
      ? ["/en/about/", "/en/credibility/", "/en/#partners"]
      : ["/empresa/", "/credibilidade/", "/#parceiros"];
    const aboutTargets = await nav.locator(".nav-item").nth(0).locator(".nav-submenu a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")));
    expect(aboutTargets).toEqual(expectedAboutTargets);
    const expectedServiceTargets = isEnglish
      ? ["/en/construction/", "/en/facilities/", "/en/supply/", "/en/business-services/"]
      : ["/construcao/", "/facilities/", "/supply/", "/business-services/"];
    const serviceTargets = await nav.locator(".nav-item").nth(1).locator(".nav-submenu a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")));
    expect(serviceTargets).toEqual(expectedServiceTargets);
    const expectedProjectTargets = isEnglish
      ? ["/en/works-catalogue/", "/en/integrated-yard/"]
      : ["/catalogo-obras/", "/estaleiro/"];
    const projectTargets = await nav.locator(".nav-item").nth(2).locator(".nav-submenu a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")));
    expect(projectTargets).toEqual(expectedProjectTargets);
    const expectedSourceTargets = isEnglish
      ? ["/en/source-ao/radar/", "/en/source-ao/smart-rfq/", "/en/source-ao/partners/"]
      : ["/source-ao/radar/", "/source-ao/smart-rfq/", "/source-ao/parceiros/"];
    const sourceTargets = await nav.locator(".nav-item").nth(3).locator(".nav-submenu a").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")));
    expect(sourceTargets).toEqual(expectedSourceTargets);
    const quoteLink = nav.locator(".nav-quote");
    await expect(quoteLink).toHaveAttribute("href", isEnglish ? "https://comercialhmatiasps.com/en.html#contact" : "https://comercialhmatiasps.com/#contacto");
    await expect(quoteLink).toHaveAttribute("target", "_blank");
    await expect(quoteLink).toHaveAttribute("rel", "noopener noreferrer");

    if (!testInfo.project.use.isMobile) {
      const aboutItem = nav.locator(".nav-item").nth(0);
      const aboutToggle = aboutItem.locator(".submenu-toggle");
      await aboutItem.hover();
      await expect(aboutToggle).toHaveAttribute("aria-expanded", "true");
      await expect(aboutItem.locator(".nav-submenu a").first()).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(aboutToggle).toHaveAttribute("aria-expanded", "false");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const menuToggle = page.locator(".menu-toggle");
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toBeVisible();
    const servicesToggle = nav.locator(".nav-item").nth(1).locator(".submenu-toggle");
    await expect(servicesToggle).toHaveAttribute("aria-expanded", "false");
    await servicesToggle.click();
    await expect(servicesToggle).toHaveAttribute("aria-expanded", "true");
    await expect(nav.locator(".nav-item").nth(1).locator(".nav-submenu a").first()).toBeVisible();
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toBeHidden();

    const footerColumns = page.locator(".footer-main > .footer-column");
    await expect(footerColumns).toHaveCount(4);
    const footerColumnOrder = await footerColumns.evaluateAll((columns) =>
      columns.map((column) => [...column.classList].find((className) => /^footer-(?:explore|identity|operations|contacts)$/.test(className)))
    );
    expect(footerColumnOrder).toEqual(["footer-explore", "footer-identity", "footer-operations", "footer-contacts"]);
    await expect(page.locator(".footer-operations h2")).toContainText(homepage.language === "en" ? "Areas and services" : "Áreas e serviços");
    await expect(page.locator(".footer-explore h2")).toHaveText(homepage.explore);
    await expect(page.locator(".footer-contacts h2")).toHaveText(homepage.contact);

    const quotationHref = homepage.language === "en"
      ? "https://comercialhmatiasps.com/en.html#contact"
      : "https://comercialhmatiasps.com/#contacto";
    const quotationLink = page.locator('.footer-contacts a[href="' + quotationHref + '"]');
    await expect(quotationLink).toBeVisible();
    await expect(quotationLink).toHaveAttribute("target", "_blank");
    await expect(quotationLink).toHaveAttribute("rel", "noopener noreferrer");

    const footerTypography = await page.evaluate(() => ({
      heading: parseFloat(getComputedStyle(document.querySelector(".footer-column h2")!).fontSize),
      links: parseFloat(getComputedStyle(document.querySelector(".footer-explore a")!).fontSize),
      legal: parseFloat(getComputedStyle(document.querySelector(".footer-legal-id")!).fontSize),
    }));
    expect(footerTypography.heading).toBeGreaterThanOrEqual(10);
    expect(footerTypography.links).toBeGreaterThanOrEqual(11);
    expect(footerTypography.legal).toBeGreaterThanOrEqual(9);

    await expect(page.locator(".footer-operations .footer-area-link")).toHaveCount(4);
    await expect(page.locator(".footer-operations .footer-subnav a")).toHaveCount(2);
    await expect(page.locator(".karta-feature")).toHaveCount(0);
    await expect(page.locator(".source-ao-highlight")).toHaveCount(0);
    await expect(page.locator(".footer-source-link")).toBeVisible();
    await expect(page.locator(".footer-source-link")).toHaveAttribute("href", homepage.sourceHref);
    await expect(page.locator("main a[href='/karta/'], main a[href='/en/karta/']")).toHaveCount(0);
    await expect(page.locator("main img[src*='images.unsplash.com']")).toHaveCount(0);
    const kartaExploreLink = page.locator(".footer-explore a", { hasText: "KARTA Wallet" });
    await expect(kartaExploreLink).toHaveCount(1);
    await expect(kartaExploreLink).toHaveAttribute("href", homepage.language === "en" ? "/en/karta/" : "/karta/");
    await expect(kartaExploreLink).toContainText(homepage.language === "en" ? "Alpha project" : "Projeto Alpha");

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

    const whatsapp = page.locator(".footer-socials .footer-whatsapp");
    const instagram = page.locator(".footer-socials a[aria-label^=\"Instagram\"]");
    await expect(page.locator(".footer-socials a")).toHaveCount(2);
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
      const socials = page.locator(".footer-socials");
      const socialsRight = await socials.evaluate((element) => element.getBoundingClientRect().right);
      const whatsappBounds = await whatsapp.evaluate((element) => { const { left, right, top } = element.getBoundingClientRect(); return { left, right, top }; });
      const instagramBounds = await instagram.evaluate((element) => { const { left, right, top } = element.getBoundingClientRect(); return { left, right, top }; });
      const whatsappTop = whatsappBounds.top;
      const instagramTop = instagramBounds.top;
      const addressBottom = await page.locator(".footer-contacts address").evaluate((element) => element.getBoundingClientRect().bottom);
      const socialsTop = await socials.evaluate((element) => element.getBoundingClientRect().top);
      expect(Math.abs(contactRight - socialsRight), "Social icon group alignment at " + layout.width + "px").toBeLessThanOrEqual(1);
      expect(Math.abs(contactRight - instagramBounds.right), "Instagram closes the social group at " + layout.width + "px").toBeLessThanOrEqual(1);
      expect(Math.abs(instagramBounds.left - whatsappBounds.right - 10), "Social icon spacing at " + layout.width + "px").toBeLessThanOrEqual(1);
      expect(Math.abs(whatsappTop - instagramTop), "Social icon row at " + layout.width + "px").toBeLessThanOrEqual(1);
      expect(socialsTop).toBeGreaterThan(addressBottom);

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(overflow.document, "Horizontal overflow at " + layout.width + "px").toBeLessThanOrEqual(overflow.viewport + 1);
    }

    const projectViewport = testInfo.project.use.viewport ?? { width: 1280, height: 900 };
    await page.setViewportSize(projectViewport);

    const operations = page.locator(".footer-operations");
    await expect(operations.getByRole("link", { name: /Construction|Construção/ })).toBeVisible();
    await expect(operations.getByRole("link", { name: /Facilities/ })).toBeVisible();
    await expect(operations.getByRole("link", { name: "HMATIAS Supply" })).toBeVisible();
    await expect(operations.getByRole("link", { name: "Business Services" })).toBeVisible();
    await expect(operations.locator(".footer-subnav").getByRole("link", { name: /Works catalogue|Catálogo de Obras/ }))
      .toHaveAttribute("href", homepage.language === "en" ? "/en/works-catalogue/" : "/catalogo-obras/");
    await expect(operations.locator(".footer-subnav").getByRole("link", { name: /Projects in development|Projetos em desenvolvimento/ }))
      .toHaveAttribute("href", homepage.language === "en" ? "/en/integrated-yard/" : "/estaleiro/");
    const submenuTargets = await operations.locator(".footer-subnav a").evaluateAll((links) =>
      links.map((link) => link.getBoundingClientRect().height)
    );
    expect(submenuTargets.every((height) => height >= 24)).toBe(true);
    const explore = page.locator(".footer-explore");
    await expect(explore.locator("a")).toHaveCount(4);
    await expect(explore.getByRole("link", { name: /About HMATIAS|Sobre a HMATIAS/ })).toBeVisible();
    await expect(explore.getByRole("link", { name: "SOURCE AO" })).toBeVisible();
    await expect(explore.getByRole("link", { name: /Blog/ })).toBeVisible();
    await expect(explore.getByRole("link", { name: /KARTA Wallet/ })).toBeVisible();
    await expect(explore.getByRole("link", { name: "Smart RFQ" })).toHaveCount(0);

    await expect(whatsapp).toHaveAttribute("aria-label", /WhatsApp/);
    await expect(whatsapp.locator("img")).toHaveAttribute("src", /social-whatsapp\.[^.]+\.svg$/);
    await expect(instagram).toHaveAttribute("aria-label", "Instagram HMATIAS");
    await expect(instagram.locator("img")).toHaveAttribute("src", /social-instagram\.[^.]+\.svg$/);


    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const seriousViolations = axe.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({ id: violation.id, help: violation.help, nodes: violation.nodes.map((node) => node.target) }));
    expect(seriousViolations).toEqual([]);
  });
}

for (const route of [
  { path: "/blog/", language: "pt-AO" },
  { path: "/en/blog/", language: "en" },
]) {
  test("Blog " + route.language + " keeps illustrative photographs inside the editorial section", async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", route.language);
    const covers = page.locator(".editorial-feature-visual img, .editorial-card-cover img");
    await expect(covers).toHaveCount(6);
    const missingCredits = await page.locator(".editorial-feature-visual, .editorial-card-cover").evaluateAll((figures) =>
      figures.filter((figure) => !figure.querySelector("img[alt]")?.getAttribute("alt")?.trim() ||
        !figure.querySelector("figcaption a[href*='unsplash.com/photos/']"))
        .map((figure) => figure.textContent?.trim() || "Uncredited editorial image")
    );
    expect(missingCredits).toEqual([]);
    await expect(page.locator(".editorial-archive-note")).toContainText(
      route.language === "en" ? "do not represent HMATIAS projects" : "Não representam obras"
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const blogTitleSize = await page.locator(".editorial-hero h1").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(blogTitleSize).toBeLessThanOrEqual(40);
    const featuredImage = await page.locator(".editorial-feature-visual img").boundingBox();
    expect(featuredImage?.height || 0).toBeLessThanOrEqual(215);
    const featuredSrcSet = await page.locator(".editorial-feature-visual img").getAttribute("srcset");
    expect(featuredSrcSet).toContain("w=480");
    const archiveImage = await page.locator(".editorial-card-cover img").first().boundingBox();
    expect(archiveImage?.height || 0).toBeLessThanOrEqual(185);
    const archiveSrcSet = await page.locator(".editorial-card-cover img").first().getAttribute("srcset");
    expect(archiveSrcSet).toContain("w=480");
    const archiveOverflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(archiveOverflow.scroll).toBeLessThanOrEqual(archiveOverflow.client + 1);

    const articleUrl = await page.locator(".editorial-feature h2 a").getAttribute("href");
    expect(articleUrl).toBeTruthy();
    await page.goto(articleUrl!);
    const articleTitleSize = await page.locator(".article-hero h1").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(articleTitleSize).toBeLessThanOrEqual(38);
    const articleImage = await page.locator(".article-cover-figure img").boundingBox();
    expect(articleImage?.height || 0).toBeLessThanOrEqual(225);
    const articleSrcSet = await page.locator(".article-cover-figure img").getAttribute("srcset");
    expect(articleSrcSet).toContain("w=480");
    const articleOverflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(articleOverflow.scroll).toBeLessThanOrEqual(articleOverflow.client + 1);
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
      const articleCover = page.locator(".article-cover-figure");
      await expect(articleCover).toBeVisible();
      await expect(articleCover.locator("img")).toHaveAttribute("alt", /.+/);
      await expect(articleCover.locator("figcaption")).toContainText(variant.language === "en" ? "Illustrative image" : "Imagem ilustrativa");
      await expect(articleCover.locator("figcaption a").first()).toHaveAttribute("href", /https:\/\/unsplash.com\/photos\//);
      await expect(page.locator(".article-content h2").first()).toBeVisible();
      await expect(page.locator(".article-cta a.button-light")).toHaveAttribute(
        "href",
        variant.language === "en" ? "/en/source-ao/smart-rfq/" : "/source-ao/smart-rfq/",
      );

      const missingAlt = await page.locator("img").evaluateAll((images) =>
        images.filter((image) => !image.hasAttribute("alt") || (!(image.getAttribute("alt") || "").trim() && image.getAttribute("aria-hidden") !== "true"))
          .map((image) => image.getAttribute("src") || "(imagem sem texto alternativo)")
      );
      expect(missingAlt, variant.route).toEqual([]);
    }
  });
}
