import { cpSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryFonts = resolve(scriptDir, "../../../fonts");
const publicFonts = resolve(scriptDir, "../public/fonts");
const requiredFonts = [
  "inter-latin-variable.woff2",
  "manrope-latin-variable.woff2",
  "ibm-plex-mono-latin-600.woff2"
];

if (!existsSync(repositoryFonts)) {
  throw new Error("Repository font directory was not found.");
}
mkdirSync(publicFonts, { recursive: true });
for (const filename of requiredFonts) {
  const source = resolve(repositoryFonts, filename);
  if (!existsSync(source)) throw new Error(`Required font asset is missing: ${filename}`);
  cpSync(source, resolve(publicFonts, filename));
}
console.log(`Prepared ${requiredFonts.length} licensed font assets for the Astro preview.`);
