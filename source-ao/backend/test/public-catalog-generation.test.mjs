import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPublicCatalog, renderPublicCatalog } from "../../../platform/astro-preview/scripts/generate-public-catalog.mjs";
import { generateSupplyCatalogues } from "../../../platform/astro-preview/scripts/generate-supply-catalogues.mjs";

const taxonomy = [{
  id: "construction",
  name_en: "Construction materials",
  name_pt: "Materiais de construção",
  aliases: ["cement", "cimento", "formol", "formaldeído 37%", "CAS 50-00-0"]
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
  assert.deepEqual(output.taxonomy, [{...taxonomy[0], aliases:["cement", "cimento"]}]);
  assert.match(output.public_rule, /Supplier identities, sourcing channels, prices, stock, availability and internal commercial data are not included/i);
  assert.equal(JSON.stringify(output).includes("item-formaldehyde"), false);
  assert.equal(JSON.stringify(output).includes("formol"), false);
  assert.equal(JSON.stringify(output).includes("formalde"), false);
  assert.equal(JSON.stringify(output).includes("CAS 50-00-0"), false);
});


test("public catalogue removes supplier identities and sourcing details from public text", () => {
  const master = {
    version: "1.0", updated_at: "2026-11-13T10:00:00Z",
    items: [{
      id: "item-diamond", name: "Diamond cutting disc",
      aliases: ["cutting disc", "SYNVOR Industrial"], category: "diamond-tools",
      subcategory: "cutting",
      specification: "The published SYNVOR catalogue includes Carbodiam products. This reference is sourced from SYNVOR Industrial in Portugal.",
      keywords: ["diamond", "SYNVOR", "Carbodiam"], name_pt: "Disco diamantado"
    }],
    taxonomy: [{id:"diamond-tools",name_en:"Diamond tools",name_pt:"Ferramentas diamantadas",aliases:["diamond","SYNVOR"]}]
  };
  const output = JSON.stringify(buildPublicCatalog(master));
  assert.equal(/SYNVOR|ADY-FERRAZ|ADY FERRAZ|D Wood|Evolution Safety|Miliart|Kent Offshore|Fransga|MATEANA|Premier Yangue|Vizers Consultores|NovaEra Tech Solutions|Telewise/i.test(output), false);
  assert.match(output, /Carbodiam/);
  assert.match(output, /The product range includes/);
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


test("HMATIAS diamond-tools catalogues generate valid PT and EN PDFs without sourcing identities", () => {
  const master = JSON.parse(readFileSync(new URL("../../data/catalog.json", import.meta.url), "utf8"));
  const result = generateSupplyCatalogues(master);
  const expectedCount = master.items.filter((item) => item.category === "diamond-tools" && item.subcategory !== "cutting-drilling-grinding").length;
  assert.equal(result.itemCount, expectedCount);
  assert.notEqual(result.ptPdf, result.enPdf, 'Portuguese and English catalogues must be separate files.');
  const groupedPages = ["diamond-cutting-discs", "diamond-core-crowns", "diamond-grinding-polishing"].reduce((sum, key) => sum + Math.ceil(master.items.filter((item) => item.category === "diamond-tools" && item.subcategory === key).length / 6), 0);
  assert.equal(result.pageCount, 2 + groupedPages);
  for (const pdf of [result.ptPdf, result.enPdf]) {
    assert.ok(pdf.startsWith("%PDF-1.4"));
    assert.ok(pdf.endsWith("%%EOF\n"));
    assert.doesNotMatch(pdf, /SYNVOR|ADY-FERRAZ|ADY FERRAZ|D Wood|Evolution Safety|Kent Offshore|Miliart|Fransga|Würth/i);
  }
});

test("generated public catalogue exactly matches the committed safe projection", () => {
  const master = JSON.parse(readFileSync(new URL("../../data/catalog.json", import.meta.url), "utf8"));
  const committed = readFileSync(new URL("../../data/public-catalog.json", import.meta.url), "utf8");
  assert.equal(renderPublicCatalog(master), committed);
});
