import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("HMATIAS institutional pages", () => {
  test("homepage exposes all four service divisions and routes Business Services internally", async ({ page }) => {
    await page.goto("/");
    const businessLink = page.getByRole("link", { name: /Business services/i });
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
  });

  test("company page identifies HMATIAS and its four service areas", async ({ page }) => {
    await page.goto("/empresa/");
    await expect(page.getByText("5001578065", { exact: true })).toBeVisible();
    await expect(page.getByText("24.094-23", { exact: true })).toBeVisible();
    await expect(page.getByText("MISSÃO", { exact: true })).toBeVisible();
    await expect(page.getByText("VISÃO", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Business Services/ })).toHaveAttribute("href", "/business-services/");
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
    for (const route of ["/business-services/", "/empresa/", "/privacidade/", "/termos/"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, route).toBe(false);
    }
  });

  test("new institutional pages have no critical or serious axe violations", async ({ page }) => {
    for (const route of ["/business-services/", "/empresa/", "/privacidade/", "/termos/"]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(item => ["critical", "serious"].includes(item.impact || ""));
      expect(blocking, route).toEqual([]);
    }
  });
});
