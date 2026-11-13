import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("SOURCE AO Smart RFQ", () => {
  test("Portuguese form collects a multi-item request for review", async ({ page }) => {
    await page.goto("/source-ao/smart-rfq/");

    await expect(page).toHaveTitle(/SOURCE AO/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("O que precisa de encontrar?");
    await expect(page.locator("#rfqForm")).toBeVisible();
    await expect(page.locator(".source-rfq-stage-note")).toContainText("Pré-visualização isolada");
    await expect(page.locator(".rfq-item")).toHaveCount(1);

    const first = page.locator(".rfq-item").nth(0);
    await first.locator(".item-category").selectOption("construction");
    await first.locator(".item-description").fill("Chapas perfiladas para cobertura industrial");
    await first.locator(".item-quantity").fill("50");
    await first.locator(".item-unit").selectOption("un");
    await first.locator(".item-specification").fill("Chapa galvanizada, perfil e espessura a confirmar.");

    await page.locator("#addItem").click();
    await expect(page.locator(".rfq-item")).toHaveCount(2);
    const second = page.locator(".rfq-item").nth(1);
    await second.locator(".item-category").selectOption("industrial-supply");
    await second.locator(".item-description").fill("Luvas de protecção industrial");
    await second.locator(".item-quantity").fill("250");
    await second.locator(".item-unit").selectOption("par");
    await second.locator(".item-specification").fill("Tamanho L; norma e ficha técnica a validar.");

    await page.locator("#rfqNext").click();
    await expect(page.locator('[data-step="1"]')).toBeVisible();
    await page.locator("#rfqLocation").fill("Viana, Luanda");
    await page.locator("#rfqNotes").fill("Entrega em horário laboral.");

    await page.locator("#rfqNext").click();
    await expect(page.locator('[data-step="2"]')).toBeVisible();
    await page.locator("#rfqName").fill("Contacto de teste");
    await page.locator("#rfqChannel").selectOption("email");
    await page.locator("#rfqContact").fill("teste@example.com");
    await page.locator("#rfqConsent").check();

    await expect(page.locator("#itemCount")).toHaveText("2 artigos");
    await expect(page.locator("#rfqReview")).toContainText("Chapas perfiladas para cobertura industrial");
    await expect(page.locator("#rfqReview")).toContainText("Luvas de protecção industrial");
    await expect(page.locator("#rfqReview")).toContainText("250");
    await expect(page.locator("#rfqSubmit")).toBeVisible();
    await expect(page.locator("#rfqResult")).toBeHidden();
  });

  test("English form toggles language without losing the request or using Portuguese routes", async ({ page }) => {
    await page.goto("/en/source-ao/smart-rfq/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What do you need to source?");
    await expect(page.locator("#rfqForm")).toBeVisible();
    await expect(page.locator("#sourceAoPreviewHomeLink")).toHaveAttribute("href", "/en/source-ao/");
    await expect(page.locator("#sourceAoSupplyLink")).toHaveAttribute("href", "/en/supply/");
    await expect(page.locator("#sourceAoPrivacyLink")).toHaveAttribute("href", "/en/privacy/");

    const first = page.locator(".rfq-item").first();
    await first.locator(".item-category").selectOption("cleaning-facilities");
    await first.locator(".item-description").fill("Monthly maintenance of an office building");
    await first.locator(".item-quantity").fill("1");
    await first.locator(".item-unit").selectOption("serviço");

    await page.locator("#rfqLanguage").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-AO");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("O que precisa de encontrar?");
    await expect(page.locator(".item-description").first()).toHaveValue("Monthly maintenance of an office building");
    await expect(page.locator("#sourceAoPreviewHomeLink")).toHaveAttribute("href", "/source-ao/");
    await expect(page.locator("#sourceAoSupplyLink")).toHaveAttribute("href", "/supply/");

    await page.locator("#rfqLanguage").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What do you need to source?");
    await expect(page.locator(".item-description").first()).toHaveValue("Monthly maintenance of an office building");
    await expect(page.locator("#sourceAoPreviewHomeLink")).toHaveAttribute("href", "/en/source-ao/");
    await expect(page.locator("#rfqPrivacyNoticeLink")).toHaveAttribute("href", "/en/privacy/");
  });

  test("form has no horizontal overflow in Portuguese or English", async ({ page }) => {
    for (const route of ["/source-ao/smart-rfq/", "/en/source-ao/smart-rfq/"]) {
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.documentWidth, route).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
    }
  });

  test("Portuguese and English RFQ screens have no critical or serious axe violations", async ({ page }) => {
    for (const route of ["/source-ao/smart-rfq/", "/en/source-ao/smart-rfq/"]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(item => ["critical", "serious"].includes(item.impact || ""));
      expect(blocking, route).toEqual([]);
    }
  });
});
