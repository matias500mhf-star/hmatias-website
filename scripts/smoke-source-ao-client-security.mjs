import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "source-ao");
const publicTextFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["backend", "node_modules", ".git"].includes(entry.name)) continue;
      await walk(fullPath);
    } else if (/\.(?:html|js|mjs|css)$/i.test(entry.name)) {
      publicTextFiles.push(fullPath);
    }
  }
}

await walk(sourceRoot);

const failures = [];
const forbidden = [
  { name: "external development gateway", pattern: /ais-dev-[a-z0-9-]+\.run\.app/i },
  { name: "embedded Source AO live API key", pattern: /sao_live_[a-z0-9_-]{8,}/i },
  { name: "hard-coded admin login", pattern: /\.auth\.login\s*\(\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*\)/i },
];

for (const file of publicTextFiles) {
  const content = await readFile(file, "utf8");
  const relative = path.relative(root, file);
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) failures.push(`${relative}: ${rule.name}`);
  }
}

const indexHtml = await readFile(path.join(sourceRoot, "index.html"), "utf8");
if (/source-ao-sdk\.js/i.test(indexHtml)) {
  failures.push("source-ao/index.html: third-party SDK is loaded directly");
}

const runtime = await readFile(path.join(sourceRoot, "runtime-config.js"), "utf8");
if (!/apiBase:\s*["']https:\/\/source-ao-api\.[a-z0-9-]+\.workers\.dev["']/.test(runtime)) {
  failures.push("source-ao/runtime-config.js: API base is not the expected Source AO Worker endpoint");
}
if (/apiKey\s*:|ADMIN_API_TOKEN|CLOUDFLARE_API_TOKEN/i.test(runtime)) {
  failures.push("source-ao/runtime-config.js: privileged credential-like configuration detected");
}

const apiClient = await readFile(path.join(sourceRoot, "api-client.js"), "utf8");
for (const [name, pattern] of [
  ["public search endpoint", /request\('\/api\/search\?/],
  ["search intelligence endpoint", /request\('\/api\/search-intelligence\?/],
  ["procurement mission endpoint", /request\('\/api\/procurement-mission\?/],
  ["public opportunities endpoint", /request\('\/api\/opportunities'\)/],
  ["health endpoint", /request\('\/health'\)/],
]) {
  if (!pattern.test(apiClient)) failures.push(`source-ao/api-client.js: missing expected ${name}`);
}
if (/ADMIN_API_TOKEN|CLOUDFLARE_API_TOKEN|sao_live_|\.auth\.login\s*\(/i.test(apiClient)) {
  failures.push("source-ao/api-client.js: privileged credential or authentication implementation detected in public client");
}
if (/method\s*:\s*['"]POST['"]|method\s*:\s*['"]PUT['"]|method\s*:\s*['"]DELETE['"]/i.test(apiClient)) {
  failures.push("source-ao/api-client.js: public read-only API client unexpectedly contains a write request");
}

if (failures.length) {
  console.error("Source AO client integration security check FAILED:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Source AO client integration security check passed (${publicTextFiles.length} public source files scanned).`);
console.log("Public API contract and read-only client boundary verified; no development gateway or embedded privileged credentials detected.");
