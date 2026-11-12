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

  test("Business Services preserves the six published service areas and uses the existing secure intake", async ({ page }) => {
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
    await expect(page.getByRole("link", { name: /Abrir formulário de pedido/ }))
      .toHaveAttribute("href", "https://comercialhmatiasps.com/servicos-administrativos.html#contacto-business");
    await expect(page.getByRole("link", { name: /Solicitar atendimento/ }))
      .toHaveAttribute("href", "https://comercialhmatiasps.com/agendamento.html");
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
    await expect(page.getByRole("heading", { name: /O que orienta cada trabalho/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Construir relações de confiança/ })).toBeVisible();
    await expect(page.getByText("Henrique Matias", { exact: true })).toBeVisible();
    await expect(page.locator(".about-service-grid a")).toHaveCount(4);
    for (const name of ["Construção e remodelação", "Facilities e manutenção", "Supply e procurement", "Business Services"]) {
      await expect(page.locator(".about-service-grid a").filter({ hasText: name })).toHaveCount(1);
    }
    await expect(page.getByText(/MISSÃO|VISÃO/i)).toHaveCount(0);
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

  test("new institutional pages do not introduce horizontal overflow", async ({ page }) => {
    for (const route of ["/business-services/", "/empresa/", "/privacidade/", "/termos/", "/catalogo-obras/"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, route).toBe(false);
    }
  });

  test("new institutional pages have no critical or serious axe violations", async ({ page }) => {
    for (const route of ["/business-services/", "/empresa/", "/privacidade/", "/termos/", "/catalogo-obras/"]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(item => ["critical", "serious"].includes(item.impact || ""));
      expect(blocking, route).toEqual([]);
    }
  });
});
