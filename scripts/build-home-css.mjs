import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {transform} from 'lightningcss';

const root = new URL('../', import.meta.url);
export const homeCssBundles = {
  'home-base.css': ['style.css', 'typography.css'],
  'home-details.css': ['assistant.css', 'karta-access.css', 'brand-lock.css', 'premium-editorial.css'],
  'clean-base.css': ['style.css', 'premium.css', 'division.css', 'commerce.css', 'clean-store.css', 'clean-cart.css', 'assistant.css'],
  // The final cart rules preserve the original runtime stylesheet cascade.
  'clean-details.css': ['typography.css', 'site-review.css', 'premium-typography.css', 'institutional-premium.css', 'facilities-clean.css', 'clean-cart.css'],
};

export const homeCssSource = sources => sources
  .map(source => `/* ${source} */\n${readFileSync(new URL(source, root), 'utf8').trimEnd()}\n`)
  .join('\n');

// Minify after concatenation so source order and the final cart overrides stay intact.
// The original stylesheets remain readable and are the only files edited by hand.
export const homeCssContent = sources => transform({
  filename: 'hmatias-bundle.css',
  code: Buffer.from(homeCssSource(sources)),
  minify: true,
}).code.toString() + '\n';

export function validateHomeCssBundles() {
  for (const [bundle, sources] of Object.entries(homeCssBundles)) {
    if (readFileSync(new URL(bundle, root), 'utf8') !== homeCssContent(sources)) {
      throw new Error(`${bundle} is stale. Run node scripts/build-home-css.mjs --write after editing its source stylesheets.`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--write')) {
    for (const [bundle, sources] of Object.entries(homeCssBundles)) {
      writeFileSync(new URL(bundle, root), homeCssContent(sources));
    }
  }
  validateHomeCssBundles();
  console.log('PASS: homepage and Clean styles preserve the source CSS and cascade order.');
}
