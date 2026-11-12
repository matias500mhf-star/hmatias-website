import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("HMATIAS institutional pages", () => {
  test("homepage exposes all four service divisions and routes Business Services internally", async ({ page }) => {
    await page.goto("/");
    const businessLink = page.locator(".service-row").filter({ hasText: "Business Services" });
    await expect(businessLink).toHaveAttribute("href", "/business-services/");
    await businessLink.click();
    await expect(page).toHaveURL(/\/business-services\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Apoio administrativo/);
  });

  test("Business Services preserves the six published service areas and direct enquiry channels", async ({ page }) => {
    await page.goto("/business-services/");
    for (const name of [
      "Expediente Administrativo e Redação Institucional",
      "Estruturação de CV Profissional",
      "Gestão e Organização Documental",
      "Propostas Comerciais e Apoio Empresarial",
      "Apresentações Empresariais",
      "Apoio Administrativo Recorrente para PME",
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
    await expect(page.locator(".business-contact-cta a[href^='https://wa.me/244948806673']")).toBeVisible();
    await expect(page.locator(".business-contact-cta a[href^='mailto:geral@comercialhmatiasps.com']")).toBeVisible();
    await expect(page.getByRole("link", { name: "Consultar Política de Privacidade" }))
      .toHaveAttribute("href", "/privacidade/");
  });

  test("works catalogue preserves all twelve archive records and image descriptions", async ({ page }) => {
    await page.goto("/catalogo-obras/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Obras, intervenções/);
    await expect(page.locator(".works-catalogue-card")).toHaveCount(12);
    await expect(page.locator(".works-catalogue-card img[alt]")).toHaveCount(12);
    await expect(page.getByText(/não substitui contratos, autos de medição/)).toBeVisible();
  });

  test("company page presents its registered identity and four service areas", async ({ page }) => {
    await page.goto("/empresa/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Empresa angolana/);
    await expect(page.locator(".about-lead")).toContainText("HMATIAS – Prestação de Serviços SU, LDA");
    await expect(page.getByRole("heading", { name: "Áreas de serviço." })).toBeVisible();
    await expect(page.locator(".ceo-message")).toContainText("Henrique Matias");
    await expect(page.locator(".ceo-message")).toContainText("Sócio Único, CEO & Managing Director");
    await expect(page.getByText(/MISSÃO|VISÃO|O nosso compromisso|Integridade nas relações/i)).toHaveCount(0);
    await expect(page.locator(".about-service-grid a")).toHaveCount(4);
    for (const name of ["Construção e remodelação", "Facilities e manutenção", "Supply e procurement", "Business Services"]) {
      await expect(page.locator(".about-service-grid a").filter({ hasText: name })).toHaveCount(1);
    }
    await expect(page.getByText(/MISSÃO|VISÃO/i)).toHaveCount(0);
  });

  test("KARTA page accurately presents Alpha status and future roadmap", async ({ page }) => {
    await page.goto("/karta/");
    await expect(page).toHaveTitle(/KARTA Wallet Mobile/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("KARTA Wallet Mobile");
    await expect(page.locator(".karta-status-panel")).toContainText("ALPHA");
    await expect(page.getByText(/Ainda não disponível para download público/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Capacidades previstas para etapas posteriores." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Registar interesse" }))
      .toHaveAttribute("href", /^mailto:geral@comercialhmatiasps\.com\?subject=KARTA/);
    await expect(page.locator(".karta-roadmap-grid article")).toHaveCount(3);
    await expect(page.locator(".karta-roadmap-grid")).toContainText("OBJETIVO FUTURO");
  });

  test("Integrated Yard preserves preliminary-study status, alternatives and dimensioned plans", async ({ page }) => {
    await page.goto("/estaleiro/");
    await expect(page).toHaveTitle(/Estaleiro Integrado HMATIAS/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Estaleiro Integrado HMATIAS");
    await expect(page.locator(".yard-facts")).toContainText("378,53 m²");
    await expect(page.locator(".yard-facts")).toContainText("15,141 × 25 m");
    await expect(page.locator(".yard-plan-card")).toHaveCount(2);
    await expect(page.locator(".yard-plan-image img[alt]")).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Estudo preliminar de implantação." })).toBeVisible();
    await expect(page.locator(".yard-disclaimer")).toContainText("não substituem os projetos de arquitetura");
    await expect(page.getByRole("link", { name: "Consultar planta integral" })).toHaveCount(2);
    await expect(page.locator(".yard-disclaimer")).not.toContainText(/obra concluída|instalação concluída/i);
  });

  test("credibility page displays the registered company identifiers", async ({ page }) => {
    await page.goto("/credibilidade/");
    await expect(page.getByText("5001578065", { exact: true })).toBeVisible();
    await expect(page.getByText("24.094-23", { exact: true })).toBeVisible();
    await expect(page.getByText("NIF", { exact: true })).toBeVisible();
    await expect(page.getByText("Registo Comercial", { exact: true })).toBeVisible();
  });

  test("privacy, terms and accessibility pages are reachable from the shared footer", async ({ page }) => {
    await page.goto("/privacidade/");
    await expect(page.getByRole("heading", { level: 1, name: "Política de Privacidade" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Cookies, consentimento/ })).toBeVisible();

    await page.goto("/termos/");
    await expect(page.getByRole("heading", { level: 1, name: "Termos & Condições" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Propriedade intelectual/ })).toBeVisible();

    await page.goto("/acessibilidade/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/acessível a todos/i);
  });

  test("HMATIAS Clean exposes the full 100-reference catalogue and prepares a multi-item request", async ({ page }) => {
    await page.goto("/clean/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Produtos de limpeza e higiene/);
    await expect(page.locator("#clean-catalog-count")).toHaveText("100 produtos");
    await expect(page.locator(".clean-catalog-item")).toHaveCount(100);
    await page.locator("#clean-catalog-search").fill("T563P");
    await expect(page.locator(".clean-catalog-item")).toHaveCount(1);
    await expect(page.locator(".clean-catalog-item")).toContainText("Pine Gel");
    await page.locator("#clean-catalog-search").fill("");
    await page.locator('[data-clean-product="Bundu Lodge T215"]').click();
    await expect(page.locator(".clean-cart-section")).toBeVisible();
    await expect(page.locator("#cleanCartCount")).toHaveText("1");
    await page.locator("#clean-name").fill("Cliente de teste");
    await page.locator("#clean-client-type").selectOption({ label: "Empresa" });
    await page.locator("#clean-request").selectOption({ label: "Pedir cotação" });
    await page.locator("#clean-location").fill("Viana, Luanda");
    await page.locator("#clean-phone").fill("+244900000000");
    await page.locator("#clean-privacy-consent").check();
    await page.getByRole("button", { name: /Preparar pedido de cotação/ }).click();
    await expect(page.locator("[data-hmatias-clean-handoff]")).toBeVisible();
    await expect(page.locator("[data-clean-request-preview]")).toContainText("Bundu Lodge T215");
    await expect(page.locator("[data-clean-send-whatsapp]")).toHaveAttribute("href", /^https:\/\/wa\.me\/244948806673\?text=/);
    await expect(page.locator("[data-clean-send-email]")).toHaveAttribute("href", /^mailto:geral@comercialhmatiasps\.com/);
    await expect(page.locator("#clean-form-status")).toContainText("não foi registado automaticamente");
    await expect(page.locator("[data-hmatias-clean-handoff]")).toContainText("não foi submetido automaticamente");
  });

  test("HMATIAS Clean English page keeps language and product catalogue", async ({ page }) => {
    await page.goto("/en/clean/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Cleaning and hygiene products/);
    await expect(page.locator("#clean-catalog-count")).toHaveText("100 products");
    await expect(page.locator(".clean-catalog-item")).toHaveCount(100);
    await expect(page.locator(".language-switch")).toHaveAttribute("href", "/clean/");
    await expect(page.getByText(/does not submit a server request or register an order/)).toBeVisible();
  });

  test("new institutional pages do not introduce horizontal overflow", async ({ page }) => {
    for (const route of ["/business-services/", "/empresa/", "/privacidade/", "/termos/", "/catalogo-obras/", "/clean/", "/en/clean/"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, route).toBe(false);
    }
  });

  test("new institutional pages have no critical or serious axe violations", async ({ page }) => {
    for (const route of ["/business-services/", "/empresa/", "/privacidade/", "/termos/", "/catalogo-obras/", "/clean/", "/en/clean/"]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(item => ["critical", "serious"].includes(item.impact || ""));
      expect(blocking, route).toEqual([]);
    }
  });
});
