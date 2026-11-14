import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: process.env.ASTRO_PREVIEW_SITE_URL ?? "https://hmatias-astro-preview.onrender.com",
  trailingSlash: "always",
  build: {
    format: "directory",
    assets: "_astro"
  },
  vite: {
    server: {
      host: "127.0.0.1"
    }
  }
});