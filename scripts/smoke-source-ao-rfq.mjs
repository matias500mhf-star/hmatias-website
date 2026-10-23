import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const sourcingUi = await readFile(path.join(root, "source-ao/sourcing-ui.js"), "utf8");
const apiClient = await readFile(path.join(root, "source-ao/api-client.js"), "utf8");
const runtime = await readFile(path.join(root, "source-ao/runtime-config.js"), "utf8");

const checks = [
  ["RFQ uses the existing sourcing-request endpoint", /fetch\(apiBase\(\)\s*\+\s*['"]\/api\/sourcing-requests['"]/],
  ["RFQ requires requester consent", /!\$\(['"]#requestConsent['"]\)\.checked/],
  ["RFQ requires item, location and a usable contact", /!item\s*\|\|\s*!loc\s*\|\|\s*contact\.length\s*<\s*5/],
  ["RFQ rejects non-positive quantities", /quantity\s*<=\s*0/],
  ["RFQ only confirms storage after a reference is returned", /body\?\.ok\s*!==\s*true\s*\|\|\s*!body\.request\?\.reference/],
  ["RFQ clearly distinguishes storage from team notification", /does not confirm stock, pricing, team notification or a quotation/],
  ["RFQ offers manual WhatsApp handoff", /https:\/\/wa\.me\/244948806673/],
  ["Private tracking URL validates the API origin", /endpoint\.origin\s*!==\s*new URL\(apiBase\(\)\)\.origin/],
  ["Private tracking token is kept in the URL fragment", /result\.hash\s*=\s*new URLSearchParams\(\{id,token\}\)\.toString\(\)/],
  ["Public API client remains read-only", !/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(apiClient)],
  ["Runtime uses the existing HTTPS Cloudflare Worker", /apiBase:\s*["']https:\/\/source-ao-api\.[a-z0-9-]+\.workers\.dev["']/.test(runtime)],
];

for (const [name, rule] of checks) {
  const passed = rule instanceof RegExp ? rule.test(sourcingUi) : rule;
  if (!passed) failures.push(name);
}
if (!checks[9][1]) failures.push("Public API client must remain read-only");

if (failures.length) {
  console.error("SOURCE AO RFQ smoke checks FAILED:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`SOURCE AO RFQ smoke checks passed (${checks.length} journey and boundary assertions).`);
