const PRIVATE_SUPPLIER_NAMES = [
  "SYNVOR Industrial",
  "SYNVOR",
  "ADY-FERRAZ",
  "ADY FERRAZ",
  "Evolution Safety Namibia",
  "Evolution Safety",
  "Miliart Intemporal",
  "Miliart",
  "D Wood",
  "Kent Offshore",
  "Fransga",
  "MATEANA",
  "Premier Yangue",
  "Vizers Consultores",
  "NovaEra Tech Solutions",
  "Telewise"
];
const replacePattern = new RegExp(PRIVATE_SUPPLIER_NAMES.join("|"), "gi");
const detectionPattern = new RegExp(PRIVATE_SUPPLIER_NAMES.join("|"), "i");

export function containsPrivateSupplierName(value) {
  return detectionPattern.test(String(value ?? ""));
}

export function sanitizePublicText(value) {
  return String(value ?? "")
    .replace(/The published SYNVOR catalogue includes/gi, "The product range includes")
    .replace(/The SYNVOR public catalogue lists/gi, "The published product range includes")
    .replace(/SYNVOR public crown catalogue lists/gi, "The published product range includes")
    .replace(/SYNVOR indicates/gi, "Published technical data indicates")
    .replace(/sourced from SYNVOR Industrial in Portugal/gi, "")
    .replace(replacePattern, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

export function sanitizePublicArray(values) {
  return (Array.isArray(values) ? values : [])
    .map(sanitizePublicText)
    .filter((value) => value && !containsPrivateSupplierName(value));
}
