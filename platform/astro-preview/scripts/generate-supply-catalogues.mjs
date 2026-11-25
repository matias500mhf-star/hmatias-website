import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const sourcePath = resolve(root, "source-ao/data/catalog.json");
const outputDir = resolve(here, "../public/catalogos");
const outputPath = resolve(outputDir, "hmatias-ferramentas-diamantadas-2026.pdf");

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
function cleanSupplierText(value) {
  return String(value || "")
    .replace(/The published SYNVOR catalogue includes/gi, "A gama de produto inclui")
    .replace(/The SYNVOR public catalogue lists/gi, "A documentação técnica identifica")
    .replace(/SYNVOR public crown catalogue lists/gi, "A documentação técnica identifica")
    .replace(/SYNVOR indicates/gi, "A documentação técnica indica")
    .replace(/sourced from SYNVOR Industrial in Portugal/gi, "")
    .replace(/SYNVOR(?: Industrial)?/gi, "")
    .replace(/ADY-FERRAZ|Evolution Safety(?: Namibia)?|Miliart Intemporal|Miliart|Kent Offshore|Fransga|Würth|Wurth/gi, "")
    .replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}
function technicalSummary(item) {
  const spec = cleanSupplierText(item.specification);
  const diameter = spec.match(/Diameter\s*(?:Ø)?\s*(Ø?\d+(?:[–-]\d+)?\s*mm)/i);
  const bore = spec.match(/(?:bore\/connection|connection|bore)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*mm/i);
  const machine = spec.match(/machine\/application:\s*([^.;]+)/i);
  const process = spec.match(/process:\s*([^.;]+)/i);
  const details = [];
  if (diameter) details.push("Diâmetro: " + diameter[1]);
  if (bore) details.push("Furo/interface: " + bore[1] + " mm");
  if (machine) details.push("Máquina/aplicação: " + machine[1]);
  if (process) details.push("Processo: " + process[1]);
  return details.length ? details.join(" · ") : "Referência técnica; confirmar configuração e compatibilidade na consulta.";
}
function buildPageContents(items) {
  const pages = [];
  let cover = rect(0, 0, 595, 842, "0.02 0.12 0.23") + rect(42, 758, 64, 4, "0.18 0.63 0.91");
  cover += text(42, 725, 10, "HMATIAS  /  SUPPLY", "F2", "0.72 0.86 0.97");
  cover += text(42, 610, 36, "FERRAMENTAS", "F2", "1 1 1") + text(42, 565, 36, "DIAMANTADAS", "F2", "1 1 1");
  cover += text(42, 510, 14, "Corte  ·  Perfuração  ·  Desbaste  ·  Polimento", "F1", "0.65 0.82 0.94");
  cover += line(42, 468, 553, 468, "0.25 0.43 0.58");
  cover += text(42, 425, 12, "CATÁLOGO TÉCNICO", "F2", "0.42 0.76 0.98");
  cover += text(42, 398, 11, "Referências de produto e parâmetros técnicos disponíveis.", "F1", "0.91 0.95 0.98");
  cover += text(42, 376, 11, "Documento de apoio à preparação de pedidos de cotação.", "F1", "0.91 0.95 0.98");
  cover += text(42, 92, 9, "EDIÇÃO 2026  |  PORTUGUÊS", "F2", "0.72 0.86 0.97");
  cover += text(42, 68, 9, "comercialhmatiasps.com  ·  geral@comercialhmatiasps.com", "F1", "0.72 0.86 0.97");
  pages.push(cover);

  const perPage = 6;
  for (let offset = 0; offset < items.length; offset += perPage) {
    const subset = items.slice(offset, offset + perPage);
    let body = rect(0, 0, 595, 842, "0.98 0.99 1") + rect(0, 790, 595, 52, "0.02 0.12 0.23");
    body += text(38, 811, 9, "HMATIAS  /  SUPPLY", "F2", "0.82 0.91 0.98");
    body += text(38, 765, 18, "Ferramentas diamantadas", "F2", "0.02 0.12 0.23");
    body += text(38, 746, 8, "FAMÍLIAS E REFERÊNCIAS TÉCNICAS", "F2", "0.12 0.39 0.63") + line(38, 733, 557, 733, "0.82 0.87 0.92");
    let y = 714;
    for (let i = 0; i < subset.length; i++) {
      const item = subset[i];
      const index = String(offset + i + 1).padStart(2, "0");
      const title = item.name_pt || item.name;
      body += text(40, y, 8, index, "F2", "0.12 0.39 0.63");
      body += text(72, y, 9, title.slice(0, 88), "F2", "0.02 0.12 0.23");
      let descY = y - 16;
      for (const row of wrap(technicalSummary(item), 86).slice(0, 2)) {
        body += text(72, descY, 8, row, "F1", "0.30 0.39 0.48");
        descY -= 12;
      }
      body += text(72, descY - 1, 7, "Preço, stock, prazo e compatibilidade: confirmar antes da encomenda.", "F1", "0.38 0.46 0.54");
      body += line(40, descY - 12, 557, descY - 12, "0.86 0.90 0.94");
      y -= 105;
    }
    body += line(38, 42, 557, 42, "0.82 0.87 0.92");
    body += text(38, 25, 7, "HMATIAS  |  Catálogo técnico de consulta  |  Informação sujeita a confirmação comercial", "F1", "0.38 0.46 0.54");
    body += text(530, 25, 7, String(pages.length + 1), "F2", "0.12 0.39 0.63");
    pages.push(body);
  }

  let end = rect(0, 0, 595, 842, "0.95 0.97 0.99") + rect(0, 790, 595, 52, "0.02 0.12 0.23");
  end += text(38, 811, 9, "HMATIAS  /  SUPPLY", "F2", "0.82 0.91 0.98");
  end += text(42, 716, 24, "Prepare o seu pedido", "F2", "0.02 0.12 0.23");
  end += text(42, 680, 11, "Para uma consulta comparável, indique:", "F1", "0.30 0.39 0.48");
  const checklist = [
    "01  Referência técnica ou modelo pretendido",
    "02  Diâmetro, furo/interface e máquina compatível",
    "03  Material a trabalhar e tipo de operação",
    "04  Operação a seco ou com água, quando aplicável",
    "05  Quantidade e local de entrega",
    "06  Prazo pretendido e documentação exigida"
  ];
  let cy = 638;
  for (const row of checklist) { end += text(48, cy, 10, row, "F2", "0.02 0.12 0.23"); cy -= 32; }
  end += line(42, 425, 553, 425, "0.82 0.87 0.92") + text(42, 390, 13, "Condições de fornecimento", "F2", "0.02 0.12 0.23");
  const notes = [
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
function renderPdf(pages) {
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = null;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
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
  pdf += "trailer\n<< /Size " + objects.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return pdf;
}
export function generateSupplyCatalogue(master) {
  if (!master || !Array.isArray(master.items)) throw new Error("Invalid master catalogue.");
  const items = master.items.filter((item) => item.category === "diamond-tools");
  if (items.length < 20) throw new Error("Insufficient technical references for public catalogue.");
  const pdf = renderPdf(buildPageContents(items));
  if (!pdf.startsWith("%PDF-1.4") || !pdf.endsWith("%%EOF\n")) throw new Error("Invalid PDF output.");
  const publicText = items.map((item) => [item.name, item.name_pt, cleanSupplierText(item.specification)].join(" ")).join(" ");
  if (/SYNVOR|ADY-FERRAZ|Evolution Safety|Kent Offshore|Miliart|Fransga|Würth/i.test(publicText)) throw new Error("Supplier identity found in generated catalogue content.");
  return { pdf, itemCount: items.length, pageCount: 2 + Math.ceil(items.length / 6) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const master = JSON.parse(readFileSync(sourcePath, "utf8"));
  const result = generateSupplyCatalogue(master);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, result.pdf, "binary");
  console.log("Generated HMATIAS diamond-tools catalogue: " + result.itemCount + " references, " + result.pageCount + " pages.");
}