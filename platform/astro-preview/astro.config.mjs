import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
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