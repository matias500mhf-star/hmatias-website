import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative, extname} from 'node:path';

const root = process.cwd();
const ignored = new Set([
  '.git',
  'node_modules',
  '.wrangler',
  '.qa',
  '.public-site',
  'dist',
  'build',
  'coverage',
]);

function walk(directory) {
  const found = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (ignored.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(absolute));
    } else if (entry.isFile()) {
      found.push(relative(root, absolute).replaceAll('\\', '/'));
    }
  }
  return found;
}

const files = walk(root);
const byExtension = extension => files.filter(file => extname(file).toLowerCase() === extension);
const htmlFiles = byExtension('.html');
const cssFiles = byExtension('.css');
const jsFiles = [...byExtension('.js'), ...byExtension('.mjs')];
const imageFiles = files.filter(file => /\.(?:png|jpe?g|webp|svg|gif|avif)$/i.test(file));
const rootHtml = htmlFiles.filter(file => !file.includes('/'));
const sourceAoHtml = htmlFiles.filter(file => file.startsWith('source-ao/'));
const tsFiles = [...byExtension('.ts'), ...byExtension('.tsx')];

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};
const packageNames = Object.keys(dependencies);
const frameworkNames = ['astro', 'react', 'react-dom', 'next', 'vue', 'svelte'];
const installedFrameworks = frameworkNames.filter(name => packageNames.includes(name));

let inlineScripts = 0;
let externalScripts = 0;
let inlineStyleBlocks = 0;
let imagesWithoutAlt = 0;
let pagesWithoutViewport = 0;

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), 'utf8');
  inlineScripts += (html.match(/<script\b(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script\s*>/gi) || []).length;
  externalScripts += (html.match(/<script\b[^>]*\bsrc\s*=/gi) || []).length;
  inlineStyleBlocks += (html.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) || []).length;
  imagesWithoutAlt += (html.match(/<img\b(?![^>]*\balt\s*=)[^>]*>/gi) || []).length;
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) pagesWithoutViewport += 1;
}

const pagesWorkflowPath = '.github/workflows/jekyll-docker.yml';
const pagesWorkflowExists = files.includes(pagesWorkflowPath);
const packageHasBuild = Boolean(packageJson.scripts?.build);
const warnings = [];

if (!pagesWorkflowExists) warnings.push('The GitHub Pages workflow was not found at its expected path.');
if (packageHasBuild) {
  warnings.push('A root build script exists. Recheck the separate Vercel project and domain assignment before running it.');
}
if (imagesWithoutAlt > 0) warnings.push(`${imagesWithoutAlt} image element(s) lack an alt attribute; review them in context before changing content.`);
if (pagesWithoutViewport > 0) warnings.push(`${pagesWithoutViewport} HTML page(s) lack a viewport meta tag.`);

console.log('HMATIAS PLATFORM STRUCTURAL AUDIT');
console.log('=================================');
console.log(`Tracked source files scanned: ${files.length}`);
console.log(`HTML pages: ${htmlFiles.length} (${rootHtml.length} at root; ${sourceAoHtml.length} under source-ao/)`);
console.log(`CSS files: ${cssFiles.length}`);
console.log(`JavaScript files: ${jsFiles.length}`);
console.log(`TypeScript files: ${tsFiles.length}`);
console.log(`Image assets: ${imageFiles.length}`);
console.log(`HTML script references: ${externalScripts} external; ${inlineScripts} inline blocks`);
console.log(`Inline style blocks: ${inlineStyleBlocks}`);
console.log(`Images without alt attribute: ${imagesWithoutAlt}`);
console.log(`HTML pages without viewport meta: ${pagesWithoutViewport}`);
console.log('');
console.log('ROOT TOOLCHAIN');
console.log(`Node package: ${packageJson.name ?? '(unnamed)'}`);
console.log(`Vite: ${dependencies.vite ?? 'not installed'}`);
console.log(`Lightning CSS: ${dependencies.lightningcss ?? 'not installed'}`);
console.log(`Frontend framework packages: ${installedFrameworks.join(', ') || 'none in root package'}`);
console.log(`Root build script: ${packageHasBuild ? 'present — deployment routing review required' : 'not configured'}`);
console.log(`GitHub Pages workflow: ${pagesWorkflowExists ? 'present' : 'missing'}`);
console.log('');

if (warnings.length) {
  console.log('REVIEW NOTES');
  for (const warning of warnings) console.log(`- ${warning}`);
} else {
  console.log('REVIEW NOTES');
  console.log('- No structural warning detected by this inventory.');
}

console.log('');
console.log('Scope: structural inventory only. This command does not run a browser,');
console.log('measure Core Web Vitals, verify DNS/routing, or publish/deploy anything.');
