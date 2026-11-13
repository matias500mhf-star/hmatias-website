import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("HMATIAS Smart RFQ", () => {
  test("Portuguese request builder prepares a local brief and enables manual handoff", async ({ page }) => {
    await page.goto("/source-ao/smart-rfq/");

    await expect(page).toHaveTitle(/Smart RFQ/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Transforme a necessidade num pedido claro/);
    await expect(page.locator("#smartRfqForm")).toBeVisible();
    await expect(page.locator("#rfqEmailSend")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#rfqWhatsapp")).toHaveAttribute("aria-disabled", "true");

    await page.locator("#rfqName").fill("Cliente de teste");
    await page.locator("#rfqCompany").fill("Empresa de demonstração");
    await page.locator("#rfqEmail").fill("teste@example.com");
    await page.locator("#rfqLocation").fill("Viana, Luanda");
    await page.locator("#rfqService").selectOption("construction");

    await expect(page.locator('.rfq-context[data-service="construction"]')).toBeVisible();
    await expect(page.locator('.rfq-context[data-service="facilities"]')).toBeHidden();

    await page.locator("#constructionType").selectOption({ label: "Remodelação / reabilitação" });
    await page.locator("#constructionDescription").fill("Remodelação de um escritório com cerca de 120 metros quadrados.");
    await page.getByRole("button", { name: "Gerar briefing do pedido" }).click();

    await expect(page.locator("#rfqReference")).toHaveText(/^HM-RFQ-\d{8}-[A-F0-9]{4}$/);
    await expect(page.locator("#rfqSummary")).toContainText("Cliente de teste");
    await expect(page.locator("#rfqSummary")).toContainText("Remodelação de um escritório");
    await expect(page.locator("#rfqEmailSend")).toHaveAttribute("href", /^mailto:geral@comercialhmatiasps\.com\?/);
    await expect(page.locator("#rfqWhatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/244948806673\?text=/);
    await expect(page.locator("#rfqEmailSend")).not.toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#rfqWhatsapp")).not.toHaveAttribute("aria-disabled", "true");
  });

  test("English request builder displays the same service flow and uses English output", async ({ page }) => {
    await page.goto("/en/source-ao/smart-rfq/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Turn your requirement into a clear request/);
    await expect(page.locator("#smartRfqForm")).toBeVisible();

    await page.locator("#rfqName").fill("Test contact");
    await page.locator("#rfqEmail").fill("test@example.com");
    await page.locator("#rfqLocation").fill("Viana, Luanda");
    await page.locator("#rfqService").selectOption("facilities");

    await expect(page.locator('.rfq-context[data-service="facilities"]')).toBeVisible();
    await page.locator("#facilityType").fill("Office building");
    await page.locator("#facilityFrequency").selectOption({ label: "Monthly" });
    await page.locator("#facilityDescription").fill("Monthly preventive maintenance for the office building.");
    await page.getByRole("button", { name: "Generate request brief" }).click();

    await expect(page.locator("#rfqSummary")).toContainText("Test contact");
    await expect(page.locator("#rfqSummary")).toContainText("Office building");
    await expect(page.locator("#rfqEmailSend")).toHaveAttribute("href", /^mailto:geral@comercialhmatiasps\.com\?/);
    await expect(page.locator("#rfqWhatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/244948806673\?text=/);
    await expect(page.getByText(/Nothing is sent until you choose email or WhatsApp/i)).toBeVisible();
  });

  test("Supply request keeps the selected specification and excludes inactive service fields", async ({ page }) => {
    await page.goto("/source-ao/smart-rfq/");

    await page.locator("#rfqName").fill("Contacto de teste Supply");
    await page.locator("#rfqEmail").fill("supply-test@example.com");
    await page.locator("#rfqLocation").fill("Viana, Luanda");
    await page.locator("#rfqService").selectOption("supply");

    await expect(page.locator('.rfq-context[data-service="supply"]')).toBeVisible();
    await expect(page.locator('.rfq-context[data-service="construction"]')).toBeHidden();
    await expect(page.locator('.rfq-context[data-service="facilities"]')).toBeHidden();

    await page.locator("#supplyItem").fill("Luvas de proteção industrial, referência indicada pelo cliente");
    await page.locator("#supplyQty").fill("250");
    await page.locator("#supplySpec").fill("Tamanho L; norma e ficha técnica a validar antes da proposta.");
    await page.locator("#constructionDescription").evaluate((field: HTMLTextAreaElement) => { field.value = "Este conteúdo não pode integrar o pedido Supply."; });
    await page.getByRole("button", { name: "Gerar briefing do pedido" }).click();

    await expect(page.locator("#rfqSummary")).toContainText("Luvas de proteção industrial");
    await expect(page.locator("#rfqSummary")).toContainText("250");
    await expect(page.locator("#rfqSummary")).toContainText("ficha técnica a validar");
    await expect(page.locator("#rfqSummary")).not.toContainText("Este conteúdo não pode integrar o pedido Supply.");
    await expect(page.locator("#rfqSummary")).toContainText("não constitui cotação");
    await expect(page.locator("#rfqEmailSend")).toHaveAttribute("href", /^mailto:geral@comercialhmatiasps\.com\?/);
    await expect(page.locator("#rfqWhatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\/244948806673\?text=/);
  });

  test("has no horizontal overflow on desktop and mobile viewports", async ({ page }) => {
    for (const route of ["/source-ao/smart-rfq/", "/en/source-ao/smart-rfq/"]) {
      await page.goto(route);
      const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflows, route).toBe(false);
    }
  });

  test("has no critical or serious automated accessibility violations", async ({ page }) => {
    await page.goto("/source-ao/smart-rfq/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(item => ["critical", "serious"].includes(item.impact || ""));
    expect(blocking).toEqual([]);
  });
});
