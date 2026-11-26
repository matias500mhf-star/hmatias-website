import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { containsPrivateSupplierName, sanitizePublicText } from "../../../source-ao/data/public-catalog-privacy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const sourcePath = resolve(root, "source-ao/data/catalog.json");
const outputDir = resolve(here, "../public/catalogos");
const outputPathPt = resolve(outputDir, "hmatias-ferramentas-diamantadas-2026.pdf");
const outputPathEn = resolve(outputDir, "hmatias-diamond-tools-2026.pdf");

const special = new Map([["€",128],["‘",145],["’",146],["“",147],["”",148],["•",149],["–",150],["—",151],["Ø",216],["ø",248],["×",215],["°",176],["·",183]]);
function hexText(value) {
  let out = "";
  for (const char of String(value)) {
    let code = special.has(char) ? special.get(char) : char.codePointAt(0);
    if (code > 255) {
      const fallback = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      for (const part of fallback) out += (part.codePointAt(0) <= 255 ? part.codePointAt(0) : 63).toString(16).padStart(2, "0");
    } else out += code.toString(16).padStart(2, "0");
  }
  return out.toUpperCase();
}
function text(x, y, size, value, font, color) {
  return color + " rg BT /" + font + " " + size + " Tf 1 0 0 1 " + x + " " + y + " Tm <" + hexText(value) + "> Tj ET\n";
}
function rect(x, y, w, h, color) { return color + " rg " + x + " " + y + " " + w + " " + h + " re f\n"; }
function line(x1, y1, x2, y2, color) { return color + " RG 0.7 w " + x1 + " " + y1 + " m " + x2 + " " + y2 + " l S\n"; }
function wrap(value, max) {
  const words = String(value).replace(/\s+/g, " ").trim().split(" ");
  const lines = []; let current = "";
  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (next.length > max && current) { lines.push(current); current = word; }
    else current = next;
  }
  if (current) lines.push(current);
  return lines;
}
function cleanSupplierText(value) { return sanitizePublicText(value); }
function technicalSummary(item, english) {
  const spec = cleanSupplierText(item.specification);
  const diameter = spec.match(/Diameter\s*(?:Ø)?\s*(Ø?\d+(?:[–-]\d+)?\s*mm)/i) || String(item.name_pt || item.name).match(/Ø\s*\d+(?:[–-]\d+)?\s*mm/i);
  const bore = spec.match(/(?:bore\/connection|connection|bore)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*mm/i);
  const machine = spec.match(/machine\/application:\s*([^.;]+)/i);
  const process = spec.match(/process:\s*([^.;]+)/i);
  const details = [];
  if (diameter) details.push((english ? "Diameter: " : "Diâmetro: ") + diameter[1]);
  if (bore) details.push((english ? "Bore/interface: " : "Furo/interface: ") + bore[1] + " mm");
  if (machine) details.push((english ? "Machine/application: " : "Máquina/aplicação: ") + machine[1]);
  if (process) details.push((english ? "Process: " : "Processo: ") + process[1]);
  return details.length ? details.join(" · ") : (english ? "Technical reference; confirm configuration and compatibility during enquiry." : "Referência técnica; confirmar configuração e compatibilidade na consulta.");
}
function buildPageContents(items, english) {
  const pages = [];
  const groups = [
    { key: "diamond-cutting-discs", titlePt: "Discos diamantados de corte", titleEn: "Diamond cutting discs" },
    { key: "diamond-core-crowns", titlePt: "Coroas diamantadas de perfuração", titleEn: "Diamond core-drilling crowns" },
    { key: "diamond-grinding-polishing", titlePt: "Desbaste e polimento", titleEn: "Grinding and polishing" }
  ].map((group) => ({ ...group, items: items.filter((item) => item.subcategory === group.key) })).filter((group) => group.items.length);
  const subtitle = english ? "Cutting  ·  Drilling  ·  Grinding  ·  Polishing" : "Corte  ·  Perfuração  ·  Desbaste  ·  Polimento";
  const edition = english ? "2026 EDITION  |  ENGLISH" : "EDIÇÃO 2026  |  PORTUGUÊS";
  const coverLead = english ? "Product references and available technical parameters." : "Referências de produto e parâmetros técnicos disponíveis.";
  const coverSub = english ? "A reference document to support quotation requests." : "Documento de apoio à preparação de pedidos de cotação.";
  const discCount = items.filter((item) => item.subcategory === "diamond-cutting-discs").length;
  const crownCount = items.filter((item) => item.subcategory === "diamond-core-crowns").length;
  const grindCount = items.filter((item) => item.subcategory === "diamond-grinding-polishing").length;
  let cover = rect(0, 0, 595, 842, "0.02 0.12 0.23") + rect(42, 758, 64, 4, "0.18 0.63 0.91");
  cover += text(42, 725, 10, "HMATIAS", "F2", "0.72 0.86 0.97");
  if (english) {
    cover += text(42, 610, 36, "DIAMOND", "F2", "1 1 1") + text(42, 565, 36, "TOOLS", "F2", "1 1 1");
  } else {
    cover += text(42, 610, 36, "FERRAMENTAS", "F2", "1 1 1") + text(42, 565, 36, "DIAMANTADAS", "F2", "1 1 1");
  }
  cover += text(42, 510, 14, subtitle, "F1", "0.65 0.82 0.94");
  cover += line(42, 468, 553, 468, "0.25 0.43 0.58");
  cover += text(42, 425, 12, english ? "TECHNICAL CATALOGUE" : "CATÁLOGO TÉCNICO", "F2", "0.42 0.76 0.98");
  cover += text(42, 398, 11, coverLead, "F1", "0.91 0.95 0.98");
  cover += text(42, 376, 11, coverSub, "F1", "0.91 0.95 0.98");
  cover += text(42, 338, 9, english ? (discCount + " cutting-disc entries  ·  " + crownCount + " core-crown entries  ·  " + grindCount + " grinding/polishing entries") : (discCount + " referências de discos  ·  " + crownCount + " referências de coroas  ·  " + grindCount + " entradas de desbaste/polimento"), "F2", "0.72 0.86 0.97");
  cover += text(42, 92, 9, edition, "F2", "0.72 0.86 0.97");
  cover += text(42, 68, 9, "comercialhmatiasps.com  ·  geral@comercialhmatiasps.com", "F1", "0.72 0.86 0.97");
  pages.push(cover);

  const perPage = 6;
  for (const group of groups) {
    for (let offset = 0; offset < group.items.length; offset += perPage) {
      const subset = group.items.slice(offset, offset + perPage);
      let body = rect(0, 0, 595, 842, "0.98 0.99 1") + rect(0, 790, 595, 52, "0.02 0.12 0.23");
      body += text(38, 811, 9, "HMATIAS", "F2", "0.82 0.91 0.98");
      body += text(38, 765, 18, english ? group.titleEn : group.titlePt, "F2", "0.02 0.12 0.23");
      body += text(38, 746, 8, english ? "PRODUCT FAMILY  ·  TECHNICAL REFERENCES" : "FAMÍLIA DE PRODUTO  ·  REFERÊNCIAS TÉCNICAS", "F2", "0.12 0.39 0.63") + line(38, 733, 557, 733, "0.82 0.87 0.92");
      let y = 714;
      for (let i = 0; i < subset.length; i++) {
        const item = subset[i];
        const index = String(offset + i + 1).padStart(2, "0");
        const itemTitle = english ? item.name : (item.name_pt || item.name);
        body += text(40, y, 8, index, "F2", "0.12 0.39 0.63");
        let titleY = y;
        for (const titleRow of wrap(itemTitle, 72).slice(0, 2)) {
          body += text(72, titleY, 9, titleRow, "F2", "0.02 0.12 0.23");
          titleY -= 11;
        }
        let descY = titleY - 5;
        for (const row of wrap(technicalSummary(item, english), 86).slice(0, 2)) {
          body += text(72, descY, 8, row, "F1", "0.30 0.39 0.48");
          descY -= 12;
        }
        body += text(72, descY - 1, 7, english ? "Price, stock, lead time and compatibility: confirm before ordering." : "Preço, stock, prazo e compatibilidade: confirmar antes da encomenda.", "F1", "0.38 0.46 0.54");
        body += line(40, descY - 12, 557, descY - 12, "0.86 0.90 0.94");
        y -= 105;
      }
      body += line(38, 42, 557, 42, "0.82 0.87 0.92");
      body += text(38, 25, 7, english ? "HMATIAS  |  Technical reference catalogue  |  Commercial details subject to confirmation" : "HMATIAS  |  Catálogo técnico de consulta  |  Informação sujeita a confirmação comercial", "F1", "0.38 0.46 0.54");
      body += text(530, 25, 7, String(pages.length + 1), "F2", "0.12 0.39 0.63");
      pages.push(body);
    }
  }

  let end = rect(0, 0, 595, 842, "0.95 0.97 0.99") + rect(0, 790, 595, 52, "0.02 0.12 0.23");
  end += text(38, 811, 9, "HMATIAS", "F2", "0.82 0.91 0.98");
  end += text(42, 716, 24, english ? "Prepare your enquiry" : "Prepare o seu pedido", "F2", "0.02 0.12 0.23");
  end += text(42, 680, 11, english ? "For a comparable quotation, please provide:" : "Para uma consulta comparável, indique:", "F1", "0.30 0.39 0.48");
  const checklist = english ? [
    "01  Technical reference or required model",
    "02  Diameter, bore/interface and compatible machine",
    "03  Material to be worked and intended operation",
    "04  Wet or dry operation, where applicable",
    "05  Quantity and delivery location",
    "06  Required timing and documentation"
  ] : [
    "01  Referência técnica ou modelo pretendido",
    "02  Diâmetro, furo/interface e máquina compatível",
    "03  Material a trabalhar e tipo de operação",
    "04  Operação a seco ou com água, quando aplicável",
    "05  Quantidade e local de entrega",
    "06  Prazo pretendido e documentação exigida"
  ];
  let cy = 638;
  for (const row of checklist) { end += text(48, cy, 10, row, "F2", "0.02 0.12 0.23"); cy -= 32; }
  end += line(42, 425, 553, 425, "0.82 0.87 0.92") + text(42, 390, 13, english ? "Supply conditions" : "Condições de fornecimento", "F2", "0.02 0.12 0.23");
  const notes = english ? [
    "This catalogue supports technical identification and quotation preparation.",
    "Listing a reference does not confirm stock in Angola or immediate availability,",
    "price, delivery lead time, compatibility with any machine or certification.",
    "Final validation depends on the exact reference and written commercial confirmation."
  ] : [
    "Este catálogo apoia a identificação técnica e a preparação de pedidos.",
    "A inclusão de uma referência não confirma stock em Angola, disponibilidade imediata,",
    "preço, prazo de entrega, compatibilidade com qualquer máquina ou certificação.",
    "A validação final depende da referência exacta e da confirmação comercial por escrito."
  ];
  let ny = 365;
  for (const row of notes) { end += text(42, ny, 9, row, "F1", "0.30 0.39 0.48"); ny -= 18; }
  end += text(42, 225, 10, "HMATIAS – Prestação de Serviços, (SU), Lda.", "F2", "0.02 0.12 0.23");
  end += text(42, 202, 9, "Viana · Luanda · Angola", "F1", "0.30 0.39 0.48");
  end += text(42, 180, 9, "geral@comercialhmatiasps.com  |  +244 948 806 673", "F1", "0.30 0.39 0.48");
  end += text(42, 158, 9, "comercialhmatiasps.com", "F1", "0.30 0.39 0.48");
  pages.push(end);
  return pages;
}
function renderPdf(pages, english) {
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R /Lang (" + (english ? "en" : "pt-PT") + ") >>";
  objects[2] = null;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  objects[5] = "<< /Title <" + hexText(english ? "HMATIAS | Diamond Tools Technical Catalogue" : "HMATIAS | Catalogo Tecnico de Ferramentas Diamantadas") + "> /Author <" + hexText("HMATIAS - Prestacao de Servicos, (SU), Lda.") + "> /Subject <" + hexText("Technical product references and specification summary") + "> /Creator <" + hexText("HMATIAS Catalogue Generator") + "> >>";
  const refs = [];
  for (const content of pages) {
    const streamId = objects.length;
    objects.push("<< /Length " + content.length + " >>\nstream\n" + content + "endstream");
    const pageId = objects.length;
    objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + streamId + " 0 R >>");
    refs.push(pageId + " 0 R");
  }
  objects[2] = "<< /Type /Pages /Kids [" + refs.join(" ") + "] /Count " + pages.length + " >>";
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) { offsets[i] = pdf.length; pdf += i + " 0 obj\n" + objects[i] + "\nendobj\n"; }
  const xref = pdf.length;
  pdf += "xref\n0 " + objects.length + "\n0000000000 65535 f \n";
  for (let i = 1; i < objects.length; i++) pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  pdf += "trailer\n<< /Size " + objects.length + " /Root 1 0 R /Info 5 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return pdf;
}
export function generateSupplyCatalogues(master) {
  if (!master || !Array.isArray(master.items)) throw new Error("Invalid master catalogue.");
  const items = master.items.filter((item) => item.category === "diamond-tools" && item.subcategory !== "cutting-drilling-grinding");
  if (items.length < 20) throw new Error("Insufficient technical references for public catalogues.");
  const publicText = items.map((item) => [item.name, item.name_pt, cleanSupplierText(item.specification)].join(" ")).join(" ");
  if (containsPrivateSupplierName(publicText)) throw new Error("Supplier identity found in generated catalogue content.");
  const ptPdf = renderPdf(buildPageContents(items, false), false);
  const enPdf = renderPdf(buildPageContents(items, true), true);
  for (const pdf of [ptPdf, enPdf]) {
    if (!pdf.startsWith("%PDF-1.4") || !pdf.endsWith("%%EOF\n")) throw new Error("Invalid PDF output.");
  }
  const pageCount = 2 + ["diamond-cutting-discs", "diamond-core-crowns", "diamond-grinding-polishing"].reduce((sum, key) => sum + Math.ceil(items.filter((item) => item.subcategory === key).length / 6), 0);
  return { ptPdf, enPdf, itemCount: items.length, pageCount };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const master = JSON.parse(readFileSync(sourcePath, "utf8"));
  const result = generateSupplyCatalogues(master);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPathPt, result.ptPdf, "binary");
  writeFileSync(outputPathEn, result.enPdf, "binary");
  console.log("Generated HMATIAS diamond-tools catalogues in Portuguese and English: " + result.itemCount + " references, " + result.pageCount + " pages each.");
}