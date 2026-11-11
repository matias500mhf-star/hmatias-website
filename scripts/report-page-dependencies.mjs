import {readdirSync, readFileSync} from 'node:fs';
import {join, relative, extname, posix} from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', '.wrangler', '.qa', '.public-site', 'dist', 'build', 'coverage']);

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (ignored.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
      files.push(relative(root, absolute).replaceAll('\\', '/'));
    }
  }
  return files;
}

function attribute(tag, name) {
  const doubleQuoted = tag.match(new RegExp(String.raw`\b${name}\s*=\s*"([^"]*)"`, 'i'));
  if (doubleQuoted) return doubleQuoted[1];
  const singleQuoted = tag.match(new RegExp(String.raw`\b${name}\s*=\s*'([^']*)'`, 'i'));
  return singleQuoted?.[1] ?? '';
}

function localAsset(raw, page) {
  const value = raw.trim().split(/[?#]/, 1)[0];
  if (!value || /^(?:data:|blob:|javascript:|mailto:|tel:|#)/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.origin === 'https://comercialhmatiasps.com' || url.origin === 'https://www.comercialhmatiasps.com'
        ? url.pathname.replace(/^\//, '')
        : url.origin + url.pathname;
    } catch {
      return null;
    }
  }
  return value.startsWith('/')
    ? value.replace(/^\/+/, '')
    : posix.normalize(posix.join(posix.dirname(page), value));
}

const pages = walk(root).sort();
const cssUsers = new Map();
const scriptUsers = new Map();

function record(map, asset, page) {
  if (!asset) return;
  if (!map.has(asset)) map.set(asset, new Set());
  map.get(asset).add(page);
}

for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel\s*=\s*["'][^"']*\bstylesheet\b[^"']*["']/i.test(tag)) continue;
    record(cssUsers, localAsset(attribute(tag, 'href'), page), page);
  }
  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = attribute(match[0], 'src');
    if (src) record(scriptUsers, localAsset(src, page), page);
  }
}

function printMap(title, map) {
  const entries = [...map.entries()].sort((a, b) =>
    b[1].size - a[1].size || a[0].localeCompare(b[0])
  );
  console.log(title);
  console.log('-'.repeat(title.length));
  console.log(`Distinct referenced files: ${entries.length}`);
  for (const [asset, users] of entries) {
    console.log(`${String(users.size).padStart(2)} page(s) | ${asset}`);
  }
  console.log('');
}

console.log('HMATIAS PAGE DEPENDENCY MAP');
console.log('==========================');
console.log(`HTML pages scanned: ${pages.length}`);
console.log('Counts represent distinct HTML pages that reference an asset, not repeated tags within one page.');
console.log('Relative and root-relative first-party paths are normalized to the same repository path.');
console.log('');
printMap('SHARED STYLESHEETS', cssUsers);
printMap('SCRIPT REFERENCES', scriptUsers);
console.log('Scope: HTML-declared links only. JavaScript dynamic imports, CSS @imports, runtime requests and unused selectors are not inferred.');
