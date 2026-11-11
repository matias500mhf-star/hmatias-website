module.exports = {
  ci: {
    collect: {
      url: [
        "http://127.0.0.1:4321/",
        "http://127.0.0.1:4321/blog/",
        "http://127.0.0.1:4321/acessibilidade/",
        "http://127.0.0.1:4321/construcao/",
        "http://127.0.0.1:4321/facilities/",
        "http://127.0.0.1:4321/supply/",
        "http://127.0.0.1:4321/source-ao/smart-rfq/",
        "http://127.0.0.1:4321/termos/",
        "http://127.0.0.1:4321/privacidade/",
        "http://127.0.0.1:4321/empresa/",
        "http://127.0.0.1:4321/business-services/",
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
