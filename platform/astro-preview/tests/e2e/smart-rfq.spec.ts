import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("SOURCE AO Smart RFQ", () => {
  test("presents the product and routes customers to the operational request form", async ({ page }) => {
    await page.goto("/source-ao/smart-rfq/");

    await expect(page).toHaveTitle(/Smart RFQ/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Uma necessidade\.\s*Um pedido claro\./);
    await expect(page.getByRole("link", { name: /Preparar pedido/ }))
      .toHaveAttribute("href", "https://comercialhmatiasps.com/source-ao/rfq.html");
    await expect(page.getByRole("link", { name: /Abrir Smart RFQ/ }))
      .toHaveAttribute("href", "https://comercialhmatiasps.com/source-ao/rfq.html");
    await expect(page.getByText(/não gera automaticamente uma cotação/i)).toBeVisible();
  });

  test("has no horizontal overflow on desktop and mobile viewports", async ({ page }) => {
    await page.goto("/source-ao/smart-rfq/");
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflows).toBe(false);
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
