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

test("every generated page passes desktop and mobile structural layout checks", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One Chromium run checks both viewport sizes for every generated route.");
  test.setTimeout(6 * 60 * 1000);

  expect(generatedRoutes.length, "The static build must expose its complete HTML page set").toBeGreaterThanOrEqual(50);

  const viewports = [
    { name: "desktop 1440px", width: 1440, height: 1000 },
    { name: "mobile 390px", width: 390, height: 844 },
  ];

  for (const route of generatedRoutes) {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route + " must load at " + viewport.name).toBe(200);

      const inspection = await page.evaluate(() => ({
        title: document.title.trim(),
        language: document.documentElement.lang,
        headingCount: document.querySelectorAll("h1").length,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        imagesWithoutAlt: [...document.images]
          .filter((image) => !image.hasAttribute("alt"))
          .map((image) => image.getAttribute("src") || "(source não identificada)"),
      }));

      expect(inspection.title, route + " must have a page title at " + viewport.name).not.toBe("");
      expect(inspection.headingCount, route + " must have an H1 at " + viewport.name).toBeGreaterThan(0);
      expect(
        inspection.language,
        route + " must declare the correct language at " + viewport.name,
      ).toBe(route === "/en/" || route.startsWith("/en/") ? "en" : "pt-AO");
      expect(
        inspection.documentWidth,
        route + " must not overflow horizontally at " + viewport.name,
      ).toBeLessThanOrEqual(inspection.viewportWidth + 1);
      expect(
        inspection.imagesWithoutAlt,
        route + " must not contain images without an alt attribute at " + viewport.name,
      ).toEqual([]);
    }
  }
});
