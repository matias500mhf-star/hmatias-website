import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const [sourcingUi, apiClient, runtime] = await Promise.all([
  readFile(path.join(root, "source-ao/sourcing-ui.js"), "utf8"),
  readFile(path.join(root, "source-ao/api-client.js"), "utf8"),
  readFile(path.join(root, "source-ao/runtime-config.js"), "utf8"),
]);

const checks = [
  ["RFQ uses the existing sourcing-request endpoint", sourcingUi, /fetch\(apiBase\(\)\s*\+\s*['"]\/api\/sourcing-requests['"]/],
  ["RFQ requires requester consent", sourcingUi, /!\$\(['"]#requestConsent['"]\)\.checked/],
  ["RFQ requires item, location and a usable contact", sourcingUi, /!item\s*\|\|\s*!loc\s*\|\|\s*contact\.length\s*<\s*5/],
  ["RFQ rejects non-positive quantities", sourcingUi, /quantity\s*<=\s*0/],
  ["RFQ only confirms storage after a reference is returned", sourcingUi, /body\?\.ok\s*!==\s*true\s*\|\|\s*!body\.request\?\.reference/],
  ["RFQ distinguishes storage from team notification", sourcingUi, /does not confirm stock, pricing, team notification or a quotation/],
  ["RFQ offers manual WhatsApp handoff", sourcingUi, /https:\/\/wa\.me\/244948806673/],
  ["Private tracking URL validates the API origin", sourcingUi, /endpoint\.origin\s*!==\s*new URL\(apiBase\(\)\)\.origin/],
  ["Private tracking token is kept in the URL fragment", sourcingUi, /result\.hash\s*=\s*new URLSearchParams\(\{id,token\}\)\.toString\(\)/],
  ["Public API client remains read-only", apiClient, !/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i],
  ["Runtime uses the existing HTTPS Cloudflare Worker", runtime, /apiBase:\s*["']https:\/\/source-ao-api\.[a-z0-9-]+\.workers\.dev["']/],
];

for (const [name, source, rule] of checks) {
  const passed = rule instanceof RegExp ? rule.test(source) : rule;
  if (!passed) failures.push(name);
}

if (failures.length) {
  console.error("SOURCE AO RFQ smoke checks FAILED:");
  for (const failure of failures) console.error(\` - \${failure}\`);
  process.exit(1);
}
console.log(\`SOURCE AO RFQ smoke checks passed (\${checks.length} journey and boundary assertions).\`);
