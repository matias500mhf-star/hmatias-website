module.exports = {
  ci: {
    collect: {
      // Representative PT/EN routes cover the shared templates and highest-risk flows.
      // Static verification and Playwright continue to cover the complete 58-page site.
      url: [
        "http://127.0.0.1:4321/",
        "http://127.0.0.1:4321/construcao/",
        "http://127.0.0.1:4321/facilities/",
        "http://127.0.0.1:4321/supply/",
        "http://127.0.0.1:4321/business-services/",
        "http://127.0.0.1:4321/source-ao/",
        "http://127.0.0.1:4321/source-ao/smart-rfq/",
        "http://127.0.0.1:4321/source-ao/radar/",
        "http://127.0.0.1:4321/source-ao/parceiros/",
        "http://127.0.0.1:4321/clean/",
        "http://127.0.0.1:4321/catalogo-obras/",
        "http://127.0.0.1:4321/blog/como-preparar-um-pedido-de-cotacao/",
        "http://127.0.0.1:4321/en/",
        "http://127.0.0.1:4321/en/construction/",
        "http://127.0.0.1:4321/en/facilities/",
        "http://127.0.0.1:4321/en/supply/",
        "http://127.0.0.1:4321/en/business-services/",
        "http://127.0.0.1:4321/en/source-ao/",
        "http://127.0.0.1:4321/en/source-ao/smart-rfq/",
        "http://127.0.0.1:4321/en/source-ao/radar/",
        "http://127.0.0.1:4321/en/source-ao/partners/",
        "http://127.0.0.1:4321/en/clean/",
        "http://127.0.0.1:4321/en/works-catalogue/",
        "http://127.0.0.1:4321/en/blog/how-to-prepare-a-comparable-supply-quotation/",
      ],
      numberOfRuns: 2,
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4321 --strictPort",
      startServerReadyPattern: "127\\.0\\.0\\.1:4321",
      startServerReadyTimeout: 30_000,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.75 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
