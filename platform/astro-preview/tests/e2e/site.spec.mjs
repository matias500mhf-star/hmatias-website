import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/blog/", "/acessibilidade/", "/construcao/", "/facilities/", "/supply/", "/source-ao/smart-rfq/", "/termos/", "/privacidade/", "/empresa/", "/business-services/", "/catalogo-obras/"];

test.describe("HMATIAS — navegação e conteúdo", () => {
  test("homepage apresenta identidade, proposta e contactos", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/HMATIAS/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Capacidade para");
    await expect(page.locator("#main-nav")).toBeAttached();
    await expect(page.getByRole("link", { name: /Contactar a equipa/ })).toBeVisible();
    await expect(page.getByText("geral@comercialhmatiasps.com").first()).toBeAttached();
  });
  test("página de construção apresenta serviços e registos reais", async ({ page }) => {
    const response = await page.goto("/construcao/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Construção e Remodelação/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Construção e");
    await expect(page.getByRole("heading", { name: "Construção civil" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preparação de terreno" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pavilhões rurais concluídos" })).toBeVisible();
    await expect(page.locator(".construction-work-card img")).toHaveCount(4);
    await expect(page.locator('.main-nav a[href="/#servicos"]')).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Voltar ao topo" })).toHaveAttribute("href", "/#inicio");
  });

  test("página de Facilities apresenta serviços e intervenções reais", async ({ page }) => {
    const response = await page.goto("/facilities/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Facilities e Manutenção/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Facilities e");
    await expect(page.getByRole("heading", { name: "Manutenção de instalações" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Limpeza e conservação" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Apoio operacional", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Substituição localizada de cobertura" })).toBeVisible();
    await expect(page.locator(".facilities-work-card img")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Voltar ao topo" })).toHaveAttribute("href", "/#inicio");
  });

  test("página HMATIAS Supply explica procurement e categorias de fornecimento", async ({ page }) => {
    const response = await page.goto("/supply/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/HMATIAS Supply/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Procurement e");
    await expect(page.getByRole("heading", { name: "Materiais de construção" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "EPI e fardamento" })).toBeVisible();
    await expect(page.getByText("A HMATIAS não mantém stock próprio.", { exact: false })).toBeVisible();
    await expect(page.locator(".supply-evidence-card img")).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Registar pedido de cotação" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar ao topo" })).toHaveAttribute("href", "/#inicio");
  });

  test("âncoras internas apontam para secções existentes", async ({ page }) => {
    await page.goto("/");
    const missingTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href") || "")
        .filter((href) => href.length > 1)
        .filter((href) => !document.getElementById(decodeURIComponent(href.slice(1))))
    );
    expect(missingTargets).toEqual([]);
  });

  test("todas as imagens possuem texto alternativo", async ({ page }) => {
    await page.goto("/");
    const missingAlt = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => !(image.getAttribute("alt") || "").trim())
        .map((image) => image.getAttribute("src") || "(imagem sem src)")
    );
    expect(missingAlt).toEqual([]);
  });

  test("imagens da página de construção possuem texto alternativo", async ({ page }) => {
    await page.goto("/construcao/");
    const missingAlt = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => !(image.getAttribute("alt") || "").trim())
        .map((image) => image.getAttribute("src") || "(imagem sem src)")
    );
    expect(missingAlt).toEqual([]);
  });

  test("imagens da página de Facilities possuem texto alternativo", async ({ page }) => {
    await page.goto("/facilities/");
    const missingAlt = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => !(image.getAttribute("alt") || "").trim())
        .map((image) => image.getAttribute("src") || "(imagem sem src)")
    );
    expect(missingAlt).toEqual([]);
  });

  test("imagens da página Supply possuem texto alternativo", async ({ page }) => {
    await page.goto("/supply/");
    const missingAlt = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => !(image.getAttribute("alt") || "").trim())
        .map((image) => image.getAttribute("src") || "(imagem sem src)")
    );
    expect(missingAlt).toEqual([]);
  });

  test("layout não cria deslocamento horizontal", async ({ page }) => {
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(
      dimensions.documentWidth,
      `Deslocamento horizontal: documento ${dimensions.documentWidth}px; viewport ${dimensions.viewportWidth}px`
    ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });

  test("página de construção não cria deslocamento horizontal", async ({ page }) => {
    await page.goto("/construcao/");
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(
      dimensions.documentWidth,
      `Deslocamento horizontal: documento ${dimensions.documentWidth}px; viewport ${dimensions.viewportWidth}px`
    ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });

  test("página de Facilities não cria deslocamento horizontal", async ({ page }) => {
    await page.goto("/facilities/");
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(
      dimensions.documentWidth,
      `Deslocamento horizontal: documento ${dimensions.documentWidth}px; viewport ${dimensions.viewportWidth}px`
    ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });

  test("página Supply não cria deslocamento horizontal", async ({ page }) => {
    await page.goto("/supply/");
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(
      dimensions.documentWidth,
      `Deslocamento horizontal: documento ${dimensions.documentWidth}px; viewport ${dimensions.viewportWidth}px`
    ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  });

  for (const route of routes) {
    test(`menu móvel abre e fecha em ${route}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile-webkit", "Teste exclusivo do viewport móvel.");
      await page.goto(route);
      const toggle = page.locator(".menu-toggle");
      const nav = page.locator("#main-nav");
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(toggle).toHaveAttribute("aria-label", "Fechar menu");
      await expect(nav).toHaveClass(/is-open/);
      await nav.getByRole("link", { name: "Serviços" }).click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toHaveAttribute("aria-label", "Abrir menu");
      await expect(nav).not.toHaveClass(/is-open/);
    });
  }

  for (const route of routes) {
    test(`rota ${route} responde, apresenta conteúdo e não tem erros estruturais`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page).toHaveTitle(/HMATIAS|SOURCE AO/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", await page.title());
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

      if (route === "/supply/") {
        await expect(page.getByRole("link", { name: "Registar pedido de cotação" }))
          .toHaveAttribute("href", "https://comercialhmatiasps.com/source-ao/rfq.html?from=supply");
      }
      if (route === "/source-ao/smart-rfq/") {
        await expect(page.getByRole("link", { name: "Abrir Smart RFQ" }))
          .toHaveAttribute("href", "https://comercialhmatiasps.com/source-ao/rfq.html");
      }
      if (route === "/business-services/") {
        await expect(page.getByRole("link", { name: "Abrir formulário de pedido" }))
          .toHaveAttribute("href", "https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business");
        await expect(page.getByRole("link", { name: "Solicitar atendimento" }))
          .toHaveAttribute("href", "https://comercialhmatiasps.com/agendamento.html");
      }

      const missingAlt = await page.locator("img").evaluateAll((images) =>
        images.filter((image) => !(image.getAttribute("alt") || "").trim())
          .map((image) => image.getAttribute("src") || "(imagem sem src)")
      );
      expect(missingAlt, `Imagens sem texto alternativo em ${route}`).toEqual([]);

      await page.locator("img").evaluateAll((images) => images.forEach((image) => { image.loading = "eager"; }));
      const brokenImages = await page.locator("img").evaluateAll(async (images) => {
        const results = await Promise.all(images.map(async (image) => {
          try { await image.decode(); return null; }
          catch { return image.currentSrc || image.src || "(imagem sem origem)"; }
        }));
        return results.filter(Boolean);
      });
      expect(brokenImages, `Imagens que não carregam em ${route}`).toEqual([]);

      const missingTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") || "")
          .filter((href) => href.length > 1)
          .filter((href) => !document.getElementById(decodeURIComponent(href.slice(1))))
      );
      expect(missingTargets, `Âncoras sem destino em ${route}`).toEqual([]);

      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(
        dimensions.documentWidth,
        `Deslocamento horizontal em ${route}: documento ${dimensions.documentWidth}px; viewport ${dimensions.viewportWidth}px`
      ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);

      const internalPaths = await page.locator("a[href]").evaluateAll((links) => {
        const paths = links.flatMap((link) => {
          const href = link.getAttribute("href");
          if (!href) return [];
          const url = new URL(href, location.href);
          return url.origin === location.origin ? [url.pathname + url.search] : [];
        });
        return [...new Set(paths)];
      });
      for (const target of internalPaths) {
        const targetResponse = await page.request.get(new URL(target, page.url()).href);
        expect(targetResponse.status(), `Ligação interna ${target} em ${route}`).toBe(200);
      }
      expect(pageErrors, `Erros JavaScript em ${route}`).toEqual([]);
    });
  }
});

test.describe("Acessibilidade automatizada — axe-core", () => {
  for (const route of routes) {
    test(`sem falhas críticas ou graves em ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const severeViolations = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact || "")
      );
      const moderateViolations = results.violations.filter((violation) =>
        ["moderate", "minor"].includes(violation.impact || "")
      );

      if (moderateViolations.length) {
        console.warn(
          `Axe findings (moderate/minor) em ${route}: ${moderateViolations
            .map((violation) => `${violation.id} (${violation.impact})`)
            .join(", ")}`
        );
      }

      const severeEvidence = severeViolations.flatMap((violation) =>
        violation.nodes.map((node) => ({
          rule: violation.id,
          impact: violation.impact,
          target: node.target,
          failureSummary: node.failureSummary,
          checks: node.any.map((check) => ({ id: check.id, message: check.message, data: check.data })),
        }))
      );

      if (severeEvidence.length) {
        console.error("[axe-core] Critical/serious accessibility findings:", JSON.stringify(severeEvidence, null, 2));
      }
      expect(severeEvidence).toEqual([]);
    });
  }
});
