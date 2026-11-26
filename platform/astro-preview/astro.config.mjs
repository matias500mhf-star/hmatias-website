import { defineConfig } from "astro/config";
import { resolveSiteUrl } from "./scripts/site-url.mjs";

export default defineConfig({
  output: "static",
  site: resolveSiteUrl(process.env),
  trailingSlash: "always",
  redirects: {
    "/areas-de-negocio": "/#servicos",
    "/en/business-areas": "/en/#services"
  },
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