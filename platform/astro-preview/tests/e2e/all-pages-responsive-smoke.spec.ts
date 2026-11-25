import AxeBuilder from "@axe-core/playwright";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";

const distRoot = join(process.cwd(), "dist");
function collectHtmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(fullPath);
    if (!entry.isFile() || !entry.name.endsWith(".html")) return [];
    const rel = relative(distRoot, fullPath).replaceAll("\\", "/");
    if (rel === "404.html" || rel.endsWith("/404.html")) return [];
    if (rel === "areas-de-negocio/index.html" || rel === "en/business-areas/index.html") return [];
    return [fullPath];
  });
}
function routeFromFile(file: string): string {
  const rel = relative(distRoot, file).replaceAll("\\", "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}
const generatedRoutes = [...new Set(collectHtmlFiles(distRoot).map(routeFromFile))].sort();
const viewports = [
  { name: "desktop 1440px", width: 1440, height: 1000 },
  { name: "mobile 390px", width: 390, height: 844 },
];
test("the static build contains the expected bilingual page set", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The page inventory is checked once.");
  expect(generatedRoutes.length, "The static build must expose its complete HTML page set").toBeGreaterThanOrEqual(50);
});
for (const route of generatedRoutes) {
  test(`generated page ${route} passes responsive and accessibility checks`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One Chromium run checks both viewport sizes for every generated route.");
    test.setTimeout(60_000);
    const issues: string[] = [];
    let routeReady = true;
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      if (response?.status() !== 200) {
        issues.push("HTTP " + (response?.status() ?? "sem resposta") + " em " + viewport.name);
        routeReady = false;
        break;
      }
      const inspection = await page.evaluate(() => ({
        title: document.title.trim(),
        language: document.documentElement.lang,
        headingCount: document.querySelectorAll("h1").length,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        imagesWithoutAlt: [...document.images].filter((image) => !image.hasAttribute("alt")).map((image) => image.getAttribute("src") || "(source não identificada)"),
      }));
      if (!inspection.title) issues.push("título vazio em " + viewport.name);
      if (inspection.headingCount === 0) issues.push("sem H1 em " + viewport.name);
      const expectedLanguage = route === "/en/" || route.startsWith("/en/") ? "en" : "pt-AO";
      if (inspection.language !== expectedLanguage) issues.push("idioma " + inspection.language + ", esperado " + expectedLanguage);
      if (inspection.documentWidth > inspection.viewportWidth + 1) issues.push("overflow horizontal de " + (inspection.documentWidth - inspection.viewportWidth) + "px em " + viewport.name);
      if (inspection.imagesWithoutAlt.length) issues.push("imagens sem atributo alt em " + viewport.name + ": " + inspection.imagesWithoutAlt.join(", "));
    }
    if (routeReady) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      for (const violation of axe.violations.filter((item) => item.impact === "critical" || item.impact === "serious")) {
        issues.push("axe " + violation.impact + " / " + violation.id + " — " + violation.nodes.map((node) => node.target.join(" ")).join("; "));
      }
    }
    expect(issues, "Audit findings for " + route).toEqual([]);
  });
}
