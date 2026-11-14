import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const dist = join(root, "dist");
assert.ok(existsSync(dist), "Build output missing. Run npm run build first.");
const htmlFiles = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(path);
  }
}
walk(dist);
const failures = [];
const approvedOperationalContactForms = new Set([
  "https://comercialhmatiasps.com/#contacto",
  "https://comercialhmatiasps.com/en.html#contact",
]);
const approvedContactFormsUsed = new Set();
let checked = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const rel = relative(dist, file).split("\\\\").join("/");
  const route = rel === "index.html" ? "/" : rel.endsWith("/index.html") ? "/" + rel.slice(0, -"index.html".length) : "/" + rel;
  const base = new URL(route, "https://preview.invalid");
  for (const match of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const href = (match[2] || "").trim();
    if (!href || href.startsWith("#")) continue;
    if (/^javascript:/i.test(href)) { failures.push({ route, href, reason: "javascript link" }); continue; }
    if (/^(?:mailto:|tel:|sms:)/i.test(href)) continue;
    let target;
    try { target = new URL(href, base); } catch { failures.push({ route, href, reason: "invalid URL" }); continue; }
    if (["comercialhmatiasps.com", "www.comercialhmatiasps.com"].includes(target.hostname.toLowerCase())) {
      if (approvedOperationalContactForms.has(target.href)) {
        approvedContactFormsUsed.add(target.href);
        checked++;
        continue;
      }
      failures.push({ route, href, reason: "unapproved legacy official website destination" }); continue;
    }
    if (target.origin !== "https://preview.invalid") continue;
    const pathname = decodeURIComponent(target.pathname);
    let targetPath = join(dist, pathname.replace(/^\/+/, ""));
    if (pathname.endsWith("/") || !/\.[a-z0-9]{1,8}$/i.test(pathname)) targetPath = join(targetPath, "index.html");
    if (!existsSync(targetPath)) failures.push({ route, href, reason: "missing local destination" });
    checked++;
  }
}
assert.equal(approvedContactFormsUsed.size, 2, "Both language versions must retain the two approved operational Resend contact-form destinations");
if (failures.length) {
  console.error("Preview link audit FAILED:");
  for (const item of failures.slice(0, 100)) console.error("- " + item.route + " -> " + item.href + ": " + item.reason);
  assert.fail(failures.length + " broken/legacy links across " + htmlFiles.length + " pages");
}
console.log("Preview link audit PASS: " + checked + " local/approved operational links checked across " + htmlFiles.length + " pages; only the two explicit Resend contact-form handoffs may reach the official website.");
