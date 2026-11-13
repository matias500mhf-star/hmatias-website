import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPublicCatalog, renderPublicCatalog } from "../../../platform/astro-preview/scripts/generate-public-catalog.mjs";

const taxonomy = [{
  id: "construction",
  name_en: "Construction materials",
  name_pt: "Materiais de construção",
  aliases: ["cement", "cimento"]
}];

test("public catalogue is an allowlisted projection and excludes the restricted chemical", () => {
  const master = {
    version: "1.0",
    updated_at: "2026-11-13T10:00:00Z",
    items: [
      {
        id: "item-public",
        name: "Construction materials",
        aliases: ["cimento"],
        category: "construction",
        subcategory: "general",
        specification: "Exact brand and stock require confirmation.",
        keywords: ["obra"],
        name_pt: "Materiais de construção"
      },
      {
        id: "item-formaldehyde",
        name: "Formaldehyde",
        aliases: ["formol"],
        category: "industrial-supply",
        subcategory: "chemicals",
        specification: "Restricted entry.",
        keywords: ["chemical"],
        name_pt: "Formaldeído"
      }
    ],
    taxonomy
  };

  const output = buildPublicCatalog(master);
  assert.equal(output.items.length, 1);
  assert.equal(output.items[0].id, "item-public");
  assert.deepEqual(Object.keys(output.items[0]), [
    "id", "name", "aliases", "category", "subcategory", "specification", "keywords", "name_pt"
  ]);
  assert.deepEqual(output.taxonomy, taxonomy);
  assert.match(output.public_rule, /Prices, suppliers, stock, availability and internal commercial data are not included/);
  assert.equal(JSON.stringify(output).includes("item-formaldehyde"), false);
  assert.equal(JSON.stringify(output).includes("formol"), false);
});

test("public catalogue fails closed when a source item adds an unreviewed field", () => {
  const master = {
    version: "1.0",
    updated_at: "2026-11-13T10:00:00Z",
    items: [{
      id: "item-a",
      name: "Item A",
      category: "other",
      aliases: [],
      keywords: [],
      specification: "Specification",
      internal_notes: "must never be exported"
    }],
    taxonomy
  };

  assert.throws(() => buildPublicCatalog(master), /not approved for public export: internal_notes/);
});

test("public catalogue rejects duplicate ids, incomplete items and unsafe taxonomy fields", () => {
  const base = {
    version: "1.0",
    updated_at: "2026-11-13T10:00:00Z",
    items: [{
      id: "item-a",
      name: "Item A",
      category: "other",
      aliases: [],
      keywords: [],
      specification: "Specification"
    }],
    taxonomy
  };
  assert.doesNotThrow(() => buildPublicCatalog(base));
  assert.throws(() => buildPublicCatalog({...base, items:[...base.items, ...base.items]}), /Duplicate catalogue item id/);
  assert.throws(() => buildPublicCatalog({...base, items:[{...base.items[0], specification:""}]}), /has no specification/);
  assert.throws(() => buildPublicCatalog({...base, taxonomy:[{...taxonomy[0], internal_notes:"private"}]}), /not approved for public export: internal_notes/);
});

test("generated public catalogue exactly matches the committed safe projection", () => {
  const master = JSON.parse(readFileSync(new URL("../../data/catalog.json", import.meta.url), "utf8"));
  const committed = readFileSync(new URL("../../data/public-catalog.json", import.meta.url), "utf8");
  assert.equal(renderPublicCatalog(master), committed);
});
