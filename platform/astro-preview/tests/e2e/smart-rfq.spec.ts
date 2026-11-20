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

  test("preview without a staging API prepares a complete manual handoff without attempting registration", async ({ page }) => {
    const registrationRequests: string[] = [];
    page.on("request", request => {
      const url = new URL(request.url());
      if (request.method() === "POST" && url.pathname === "/api/sourcing-requests") {
        registrationRequests.push(request.url());
      }
    });

    await page.goto("/source-ao/smart-rfq/");
    await expect(page.locator(".source-rfq-stage-note")).toContainText("API de staging");
    await expect(page.locator("#rfqSubmit")).toHaveText("Preparar envio manual");

    const item = page.locator(".rfq-item").first();
    await item.locator(".item-category").selectOption("diamond-tools");
    await item.locator(".item-description").fill("Disco diamantado BETONSOL Ø600 mm");
    await item.locator(".item-quantity").fill("76");
    await item.locator(".item-unit").selectOption("un");
    await item.locator(".item-specification").fill("Ref. 14475; ligação a confirmar.");

    await page.locator("#rfqNext").click();
    await page.locator("#rfqLocation").fill("Luanda");
    await page.locator("#rfqDate").fill("2026-11-26");

    await page.locator("#rfqNext").click();
    await page.locator("#rfqName").fill("Contacto de teste");
    await page.locator("#rfqCompany").fill("HMATIAS Teste");
    await page.locator("#rfqChannel").selectOption("email");
    await page.locator("#rfqContact").fill("teste@example.com");
    await page.locator("#rfqConsent").check();

    await page.locator("#rfqSubmit").click();

    const result = page.locator("#rfqResult");
    await expect(result).toBeVisible();
    await expect(result.locator("h2")).toHaveText("Pedido preparado para envio manual.");
    await expect(result).toContainText("não foi registado nem guardado");
    await expect(result).not.toContainText("Não foi possível registar");
    const manualMessage = await result.locator("textarea").inputValue();
    expect(manualMessage).toContain("Contacto de teste");
    expect(manualMessage).toContain("HMATIAS Teste");
    expect(manualMessage).toContain("teste@example.com");
    expect(manualMessage).toContain("Disco diamantado BETONSOL Ø600 mm");
    expect(manualMessage).toContain("76 un");
    expect(manualMessage).toContain("Luanda");
    const whatsapp = new URL(await result.getByRole("link", { name: "Abrir WhatsApp com o pedido" }).getAttribute("href") || "");
    expect(whatsapp.hostname).toBe("wa.me");
    expect(whatsapp.searchParams.get("text")).toContain("teste@example.com");
    expect(registrationRequests).toEqual([]);
  });

});
