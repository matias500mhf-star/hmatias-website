import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
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

export const pageCssBundles = {
  'clean-page.css': ['clean-base.css', 'header.css', 'clean-details.css', 'assistant-handoff.css'],
  'facilities-page.css': [
    'style.css', 'premium.css', 'division.css', 'assistant.css', 'header.css',
    'typography.css', 'site-review.css', 'premium-typography.css',
    'institutional-premium.css', 'facilities-clean.css', 'assistant-handoff.css',
  ],
};

export const homeCssSource = sources => sources
  .map(source => `/* ${source} */\n${readFileSync(new URL(source, root), 'utf8').trimEnd()}\n`)
  .join('\n');

// Minify after concatenation so source order and the final cart overrides stay intact.
// The original stylesheets remain readable and are the only files edited by hand.
export const homeCssContent = sources => {
  let visitor;
  if(sources.includes('clean-store.css')||sources.includes('facilities-clean.css')){
    const cleanMarkup=['clean.html','clean-en.html'].map(path=>readFileSync(new URL(path,root),'utf8')).join('\n');
    const sharedRuntime=readdirSync(root).filter(path=>path.endsWith('.js'))
      .map(path=>readFileSync(new URL(path,root),'utf8')).join('\n');
    // Remove only audited families from other pages. Header, forms, cart,
    // assistant and unknown/dynamically generated classes always remain.
    const otherPageClass=/^(?:(?:unit|business|division|visa|karta|rfq|booking|catalogue|company|project|sector|supply|why-us)-|hmatias-(?:booking|credibility|facilities|karta|legal|rfq|catalogue)$)/;
    const unused=name=>otherPageClass.test(name)&&!cleanMarkup.includes(name)&&!sharedRuntime.includes(name);
    visitor={Rule:{style(rule){
      // Inspect direct positive classes only. Nested :not(), :is(), :has()
      // branches are deliberately preserved, including non-home positioning.
      // Keep mixed selector lists intact. Drop a rule only when every selector
      // explicitly belongs to an unused family from another page.
      if(rule.value.selectors.every(selector=>selector.some(part=>part.type==='class'&&unused(part.name))))return [];
    }}};
  }
  return transform({filename:'hmatias-bundle.css',code:Buffer.from(homeCssSource(sources)),minify:true,visitor}).code.toString()+'\n';
};

export function validateHomeCssBundles() {
  for (const [bundle, sources] of Object.entries(homeCssBundles)) {
    if (readFileSync(new URL(bundle, root), 'utf8') !== homeCssContent(sources)) {
      throw new Error(`${bundle} is stale. Run node scripts/build-home-css.mjs --write after editing its source stylesheets.`);
    }
  }
  for (const [bundle, sources] of Object.entries(pageCssBundles)) {
    if (readFileSync(new URL(bundle, root), 'utf8') !== homeCssSource(sources)) {
      throw new Error(`${bundle} is stale. Run node scripts/build-home-css.mjs --write after editing its source stylesheets.`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--write')) {
    for (const [bundle, sources] of Object.entries(homeCssBundles)) {
      writeFileSync(new URL(bundle, root), homeCssContent(sources));
    }
    for (const [bundle, sources] of Object.entries(pageCssBundles)) {
      writeFileSync(new URL(bundle, root), homeCssSource(sources));
    }
  }
  validateHomeCssBundles();
  console.log('PASS: homepage and Clean styles preserve the source CSS and cascade order.');
}
