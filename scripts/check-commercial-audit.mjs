import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateHomeCssBundles} from './build-home-css.mjs';

validateHomeCssBundles();

const read=path=>readFileSync(path,'utf8');
const ptCatalogue=read('catalogo-obras.html');
const enCatalogue=read('work-catalogue.html');
assert.ok(!ptCatalogue.includes('<a href="karta.html">KARTA Wallet</a>'));
assert.ok(!enCatalogue.includes('<a href="karta-en.html">KARTA Wallet</a>'));
assert.ok(ptCatalogue.includes('href="credibilidade.html#projetos-digitais"'));
assert.ok(enCatalogue.includes('href="credibility.html#digital-projects"'));

for(const path of ['karta.html','karta-en.html']){
  const html=read(path);
  assert.match(html, /Projeto Digital HMATIAS|Digital Project/);
  assert.match(html, /Alpha/i);
}

const source=read('source-ao/index.html');
const sourceJs=read('source-ao/sourceao.js');
const partnerForm=read('source-ao/partner-application.html');
const partnerApi=read('source-ao/backend/src/partner-applications.js');
assert.ok(source.includes('Transforme a necessidade de compra numa cotação validada.'));
assert.ok(source.includes('A pesquisa pública é uma referência, não uma confirmação de fornecimento.'));
assert.ok(sourceJs.includes("publicSearch:'Abrir pesquisa pública (Google)'"));
assert.ok(sourceJs.includes("publicSearch:'Open public search (Google)'"));
assert.ok(!source.includes('<strong data-i18n="cap2t">Supplier Discovery</strong>'));
assert.match(source,/sourceao[.]js[?]v=[a-zA-Z0-9._-]+/);
assert.ok(source.includes('class="source-header-email"') && source.includes('../images/contact-email.svg'));
assert.ok(partnerForm.includes('Empresas de outros mercados, incluindo Portugal e China'));
assert.ok(partnerForm.includes('mailto:geral@comercialhmatiasps.com'));
assert.ok(partnerApi.includes("const COUNTRIES=new Set(['AO','NA','ZA']);"));
for(const path of ['index.html','en.html']){
  const home=read(path);
  assert.ok(home.includes('class="home-proof"'),'Homepage proof row missing: '+path);
  assert.ok(home.includes('site-improvements.css'),'Responsive homepage refinements missing: '+path);
}

const events=read('analytics-events.js');
assert.ok(events.includes("form.dataset.hmatiasWebsiteIntake!=='true'"));
assert.ok(events.includes("track('generate_lead'"));
const loader=read('website-lead-client.js');
assert.ok(loader.includes('website-lead-intake.js?v='));
const client=read('website-lead-intake.js');
assert.ok(client.includes("window.hmatiasAnalytics?.confirmLead?.("));
assert.ok(client.includes("if(!response.ok||result?.saved!==true"));
assert.ok(client.includes('turnstileToken:challengeToken'));
assert.ok(client.includes('attribution:campaignAttribution()'));
assert.ok(client.includes("utm_source"));
assert.ok(client.includes("referrer_host"));

const allForms=['index.html','en.html','servicos-administrativos.html',
  'business-services.html','agendamento.html','booking.html',
  'clean.html','clean-en.html','rfq.html','rfq-en.html'];
for(const path of allForms){
  const html=read(path);
  assert.match(html,/analytics[.]js[?]v=[a-zA-Z0-9._-]+/,
    'Analytics script must be versioned: '+path);
  if(path==='index.html'||path==='en.html'){
    assert.match(html,/site-bootstrap[.]js[?]v=[a-zA-Z0-9._-]+/);
  }else{
    assert.match(html,/website-lead-client[.]js[?]v=[a-zA-Z0-9._-]+/,
      'Secure versioned client not loaded: '+path);
  }
}
for(const path of ['rfq.html','rfq-en.html']){
  const html=read(path);
  assert.equal((html.match(/id="rfqEmail"/g)||[]).length,1,'One contact email input: '+path);
  assert.equal((html.match(/id="rfqEmailSend"/g)||[]).length,1,'One email send link: '+path);
  assert.ok(!/<a id="rfqEmailSend"[^>]*data-quote-link/.test(html),
    'Email action must not be redirected as quote CTA: '+path);
}
assert.ok(read('rfq.js').includes("getElementById('rfqEmailSend')"));
const bootstrap=read('site-bootstrap.js');
assert.match(bootstrap,/website-lead-client[.]js[?]v=[a-zA-Z0-9._-]+/);
assert.ok(bootstrap.includes('growth-intelligence.js?v=20261009-email-cta1'));
assert.ok(bootstrap.includes('document.createTreeWalker(link, NodeFilter.SHOW_TEXT)'),
  'Official email normalization must preserve icon markup');
assert.ok(!bootstrap.includes('link.textContent = officialEmail'),
  'Official email normalization must not replace child icon markup');
for(const path of ['index.html','en.html','credibilidade.html','credibility.html']){
  const html=read(path);
  assert.match(html,/href="mailto:geral@comercialhmatiasps[.]com"><img[^>]+contact-email[.]svg/,
    'Official email icon missing from shared contact surface: '+path);
  assert.ok(html.includes('site-bootstrap.js?v=20261029-email-icon-preserve1'),
    'Cache-busted email icon normalizer missing: '+path);
}
assert.ok(read('script.js').includes('const existing=target.querySelector'));
assert.ok(read('growth-intelligence.js').includes('[data-hmatias-email-alternative]'));
assert.ok(client.includes("id:'cleanQuoteForm'"));
assert.ok(client.includes("id:'smartRfqForm'"));
console.log('PASS: institutional, Clean and Smart RFQ intake surfaces and consent-gated lead attribution align.');
