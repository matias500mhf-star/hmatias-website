import { cpSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryFonts = resolve(scriptDir, "../../../fonts");
const publicFonts = resolve(scriptDir, "../public/fonts");
const repositoryPhotos = resolve(scriptDir, "../../../images/catalogue");
const publicPhotos = resolve(scriptDir, "../public/images/hmatias");
const requiredPhotos = [
  "logistica-estrutura-metalica.webp",
  "perfis-metalicos-estrutura.webp",
  "chapas-cobertura-fornecimento.webp",
  "cobertura-metalica-substituicao.webp",
  "instalacoes-embutidas-construcao.webp",
  "pavilhoes-rurais-concluidos.webp"
];
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
if (!existsSync(repositoryPhotos)) throw new Error("HMATIAS project photo directory was not found.");
mkdirSync(publicPhotos, { recursive: true });
for (const filename of requiredPhotos) {
  const source = resolve(repositoryPhotos, filename);
  if (!existsSync(source)) throw new Error(`Required HMATIAS project photo is missing: ${filename}`);
  cpSync(source, resolve(publicPhotos, filename));
}
console.log(`Prepared ${requiredFonts.length} licensed font assets and ${requiredPhotos.length} authentic HMATIAS project photos for the Astro preview.`);
