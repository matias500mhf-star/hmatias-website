import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const masterPath = resolve(scriptDir, "../../../source-ao/data/catalog.json");
const publicPath = resolve(scriptDir, "../../../source-ao/data/public-catalog.json");
const EXCLUDED_IDS = new Set(["item-formaldehyde"]);
const ALLOWED_ITEM_KEYS = [
  "id",
  "name",
  "aliases",
  "category",
  "subcategory",
  "specification",
  "keywords",
  "name_pt"
];

export function buildPublicCatalog(master) {
  if (!master || typeof master !== "object" || Array.isArray(master)) {
    throw new Error("Master catalogue must be an object.");
  }
  if (typeof master.version !== "string" || !master.version.trim()) {
    throw new Error("Master catalogue version is required.");
  }
  if (typeof master.updated_at !== "string" || !Number.isFinite(Date.parse(master.updated_at))) {
    throw new Error("Master catalogue updated_at must be a valid date.");
  }
  if (!Array.isArray(master.items)) {
    throw new Error("Master catalogue items must be an array.");
  }

  const seen = new Set();
  const items = [];
  for (const item of master.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Every catalogue item must be an object.");
    }

    const unsupported = Object.keys(item).filter((key) => !ALLOWED_ITEM_KEYS.includes(key));
    if (unsupported.length) {
      throw new Error("Catalogue item contains fields not approved for public export: " + unsupported.join(", "));
    }
    if (typeof item.id !== "string" || !item.id.trim()) {
      throw new Error("Every catalogue item must have a stable id.");
    }
    if (seen.has(item.id)) throw new Error("Duplicate catalogue item id: " + item.id);
    seen.add(item.id);

    if (EXCLUDED_IDS.has(item.id)) continue;
    if (typeof item.name !== "string" || !item.name.trim()) {
      throw new Error("Catalogue item " + item.id + " has no public name.");
    }
    if (typeof item.category !== "string" || !item.category.trim()) {
      throw new Error("Catalogue item " + item.id + " has no category.");
    }
    if (typeof item.specification !== "string" || !item.specification.trim()) {
      throw new Error("Catalogue item " + item.id + " has no specification.");
    }
    for (const key of ["aliases", "keywords"]) {
      if (!Array.isArray(item[key]) || item[key].some((value) => typeof value !== "string")) {
        throw new Error("Catalogue item " + item.id + " has invalid " + key + ".");
      }
    }
    if (item.name_pt != null && typeof item.name_pt !== "string") {
      throw new Error("Catalogue item " + item.id + " has invalid Portuguese name.");
    }
    if (item.subcategory != null && typeof item.subcategory !== "string") {
      throw new Error("Catalogue item " + item.id + " has invalid subcategory.");
    }

    // Allowlist projection: any newly added field requires an explicit review above.
    items.push(Object.fromEntries(
      ALLOWED_ITEM_KEYS.filter((key) => Object.hasOwn(item, key)).map((key) => [key, item[key]])
    ));
  }

  return {
    version: master.version,
    updated_at: master.updated_at,
    items
  };
}

export function renderPublicCatalog(master) {
  return JSON.stringify(buildPublicCatalog(master), null, 2) + "\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const master = JSON.parse(readFileSync(masterPath, "utf8"));
  const expected = renderPublicCatalog(master);

  if (process.argv.includes("--check")) {
    const existing = readFileSync(publicPath, "utf8");
    if (existing !== expected) {
      throw new Error("Public catalogue fallback is stale. Run npm run build to regenerate it from the master catalogue.");
    }
    console.log("PASS: public catalogue fallback matches the reviewed master data.");
  } else {
    writeFileSync(publicPath, expected, "utf8");
    console.log("Generated sanitised public catalogue (" + buildPublicCatalog(master).items.length + " items).");
  }
}
