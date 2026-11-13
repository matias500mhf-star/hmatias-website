import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const masterPath = resolve(scriptDir, "../../../source-ao/data/catalog.json");
const publicPath = resolve(scriptDir, "../../../source-ao/data/public-catalog.json");
const EXCLUDED_IDS = new Set(["item-formaldehyde"]);
const PUBLIC_RULE = "Only curated public supply families are exposed. Prices, suppliers, stock, availability and internal commercial data are not included.";
const ALLOWED_MASTER_KEYS = ["version", "updated_at", "items", "taxonomy"];
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
const ALLOWED_TAXONOMY_KEYS = ["id", "name_en", "name_pt", "aliases"];

function assertOnlyKeys(record, allowed, context) {
  const unsupported = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unsupported.length) {
    throw new Error(context + " contains fields not approved for public export: " + unsupported.join(", "));
  }
}

function assertStringArray(value, context) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    throw new Error(context + " must be an array of non-empty strings.");
  }
}

export function buildPublicCatalog(master) {
  if (!master || typeof master !== "object" || Array.isArray(master)) {
    throw new Error("Master catalogue must be an object.");
  }
  assertOnlyKeys(master, ALLOWED_MASTER_KEYS, "Master catalogue");
  if (typeof master.version !== "string" || !master.version.trim()) {
    throw new Error("Master catalogue version is required.");
  }
  if (typeof master.updated_at !== "string" || !Number.isFinite(Date.parse(master.updated_at))) {
    throw new Error("Master catalogue updated_at must be a valid date.");
  }
  if (!Array.isArray(master.items)) {
    throw new Error("Master catalogue items must be an array.");
  }
  if (!Array.isArray(master.taxonomy)) {
    throw new Error("Master catalogue taxonomy must be an array.");
  }

  const seen = new Set();
  const items = [];
  for (const item of master.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Every catalogue item must be an object.");
    }

    assertOnlyKeys(item, ALLOWED_ITEM_KEYS, "Catalogue item");
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
    assertStringArray(item.aliases, "Catalogue item " + item.id + " aliases");
    assertStringArray(item.keywords, "Catalogue item " + item.id + " keywords");
    if (item.name_pt != null && typeof item.name_pt !== "string") {
      throw new Error("Catalogue item " + item.id + " has invalid Portuguese name.");
    }
    if (item.subcategory != null && typeof item.subcategory !== "string") {
      throw new Error("Catalogue item " + item.id + " has invalid subcategory.");
    }

    // Allowlist projection: any newly added field requires explicit review above.
    items.push(Object.fromEntries(
      ALLOWED_ITEM_KEYS.filter((key) => Object.hasOwn(item, key)).map((key) => [key, item[key]])
    ));
  }

  const taxonomy = master.taxonomy.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Catalogue taxonomy entry " + index + " must be an object.");
    }
    assertOnlyKeys(entry, ALLOWED_TAXONOMY_KEYS, "Catalogue taxonomy entry");
    for (const key of ["id", "name_en", "name_pt"]) {
      if (typeof entry[key] !== "string" || !entry[key].trim()) {
        throw new Error("Catalogue taxonomy entry " + index + " is missing " + key + ".");
      }
    }
    assertStringArray(entry.aliases, "Catalogue taxonomy entry " + index + " aliases");
    return Object.fromEntries(
      ALLOWED_TAXONOMY_KEYS.filter((key) => Object.hasOwn(entry, key)).map((key) => [key, entry[key]])
    );
  });

  return {
    version: master.version,
    updated_at: master.updated_at,
    items,
    taxonomy,
    public_rule: PUBLIC_RULE
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
