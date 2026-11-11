import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/blog/", "/acessibilidade/"];

test.describe("HMATIAS — navegação e conteúdo", () => {
  test("homepage apresenta identidade, proposta e contactos", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/HMATIAS/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Capacidade para");
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeAttached();
    await expect(page.getByRole("link", { name: /Falar com a HMATIAS/ })).toBeAttached();
    await expect(page.getByText("geral@comercialhmatiasps.com").first()).toBeAttached();
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

  test("menu móvel abre e fecha ao navegar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-webkit", "Teste exclusivo do viewport móvel.");
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Abrir menu" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Serviços" }).click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  for (const route of routes) {
    test(`rota ${route} responde e contém conteúdo principal`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page).toHaveTitle(/HMATIAS/);
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
