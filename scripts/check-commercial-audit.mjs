import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateHomeCssBundles} from './build-home-css.mjs';

validateHomeCssBundles();

const read=path=>readFileSync(path,'utf8');
const ptCatalogue=read('catalogo-obras.html');
const enCatalogue=read('work-catalogue.html');
assert.ok(!ptCatalogue.includes('<a href="karta.html">KARTA Wallet</a>'));
assert.ok(!enCatalogue.includes('<a href="karta-en.html">KARTA Wallet</a>'));
assert.ok(ptCatalogue.includes('href="explorar.html#karta-wallet">KARTA Wallet</a>'));
assert.ok(enCatalogue.includes('href="explore.html#karta-wallet">KARTA Wallet</a>'));
assert.ok(read('explorar.html').includes('id="karta-wallet" href="karta.html"'));
assert.ok(read('explore.html').includes('id="karta-wallet" href="karta-en.html"'));
assert.ok(!read('karta.html').includes('credibilidade.html#projetos-digitais'));
assert.ok(!read('karta-en.html').includes('credibility.html#digital-projects'));

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
  // The approved premium homepage uses the compact hero-bottom proof row
  // and the HMATIAS design-system stylesheets instead of the legacy home-proof block.
  assert.ok(home.includes('class="hero-bottom"'),'Homepage proof row missing: '+path);
  assert.ok(home.includes('hm-design-system.css') && home.includes('hm-blue-institutional.css'),
    'Approved HMATIAS design system is missing: '+path);

  const mainStart=home.indexOf('<main');
  const mainEnd=home.indexOf('</main>',mainStart);
  const main=mainStart>=0&&mainEnd>mainStart?home.slice(mainStart,mainEnd):'';
  assert.ok(main,'Homepage main content missing: '+path);
  for(const phrase of ['HMATIAS BLOG','CONHECIMENTO PRÁTICO','PRACTICAL KNOWLEDGE','INFORMAÇÃO INSTITUCIONAL','INSTITUTIONAL INFORMATION','credibility-band'])
    assert.ok(!main.includes(phrase),'Removed generic or duplicated homepage content returned: '+path+' / '+phrase);
  assert.equal((main.match(/class="intro-band"/g)||[]).length,1,'Homepage must have one company introduction: '+path);
  const contactStart=home.indexOf('<section class="contact contact-premium"');
  const contactEnd=home.indexOf('</section>',contactStart);
  const contact=contactStart>=0&&contactEnd>contactStart?home.slice(contactStart,contactEnd):'';
  assert.ok(contact.includes('id="smart-rfq"'),'Smart RFQ must be inside the contact section: '+path);
  assert.equal((home.match(/id="smart-rfq"/g)||[]).length,1,'Smart RFQ should appear once: '+path);
  for(const href of path==='index.html'?['construcao.html','facilities.html','supply.html']:['construction.html','facilities-en.html','supply-en.html'])
    assert.ok(contact.includes('href="'+href+'"'),'Smart RFQ service link missing: '+path+' / '+href);
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
    // Premium homepages load the versioned site bootstrap dynamically from script.js.
    assert.match(html,/script[.]js[?]v=[a-zA-Z0-9._-]+/);
    assert.match(read('script.js'),/site-bootstrap[.]js[?]v=[a-zA-Z0-9._-]+/);
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
  assert.ok(html.includes('site-bootstrap.js?v=20261108-whatsapp-bilingual1'),
    'Cache-busted email icon normalizer missing: '+path);
}
assert.ok(read('script.js').includes('const existing=target.querySelector'));
assert.ok(read('growth-intelligence.js').includes('[data-hmatias-email-alternative]'));
assert.ok(client.includes("id:'cleanQuoteForm'"));
assert.ok(client.includes("id:'smartRfqForm'"));

for(const [path,anchor,labels] of [
  ['credibilidade.html','como-trabalhamos',['DADOS DA EMPRESA','Do pedido à proposta.','Pedido','Avaliação','Proposta']],
  ['credibility.html','how-we-work',['COMPANY DETAILS','From enquiry to proposal.','Enquiry','Assessment','Proposal']]
]){
  const html=read(path);
  assert.ok(html.includes('credibility-page.css?v=20261110-minimal-profile1'),'Credibility layout stylesheet missing: '+path);
  assert.ok(html.includes('id="'+anchor+'"'),'Credibility process anchor missing: '+path+'#'+anchor);
  for(const label of labels) assert.ok(html.includes(label),'Company profile copy missing: '+path+' / '+label);
  const panelStart=html.indexOf('<aside class="cred-identity"');
  const panelEnd=html.indexOf('</aside>',panelStart);
  const identity=panelStart>=0&&panelEnd>=0?html.slice(panelStart,panelEnd+8):'';
  assert.equal((identity.match(/href="mailto:geral@comercialhmatiasps[.]com"/g)||[]).length,1,'Official company email link must appear once in the identity panel: '+path);
  const visibleIdentity=identity.replace(/href="mailto:geral@comercialhmatiasps[.]com"/g,'');
  assert.equal((visibleIdentity.match(/geral@comercialhmatiasps[.]com/g)||[]).length,1,'Official company email must be shown once in the identity panel: '+path);
}
assert.ok(read('index.html').includes('EMPRESAS · INSTITUIÇÕES · PARTICULARES'));
assert.ok(read('index.html').includes('ÂMBITO AVALIADO POR PEDIDO'));
assert.ok(read('index.html').includes('PROPOSTA DA EQUIPA COMERCIAL'));
assert.ok(read('en.html').includes('BUSINESSES · INSTITUTIONS · PRIVATE CLIENTS'));
assert.ok(read('en.html').includes('SCOPE REVIEWED PER REQUEST'));
assert.ok(read('en.html').includes('COMMERCIAL PROPOSAL'));

assert.ok(!read('credibilidade.html').includes('orientados pela nossa missão, visão e valores.'));
assert.ok(!read('credibility.html').includes('guided by our mission, vision and values.'));
assert.ok(!read('credibilidade.html').includes('MISSÃO') && !read('credibilidade.html').includes('VISÃO'));
assert.ok(!read('credibility.html').includes('MISSION') && !read('credibility.html').includes('VISION'));
assert.ok(!read('credibilidade.html').includes('projetos-digitais') && !read('credibility.html').includes('digital-projects'));
const credibilityCss=read('credibility-page.css');
assert.ok(credibilityCss.includes('minmax(230px,1.65fr)'),'Desktop credibility footer needs room for contact addresses');
assert.ok(credibilityCss.includes('.hmatias-credibility footer .footer-grid>div:nth-child(4){grid-column:1/-1}'),'Tablet credibility footer contact must span the row');
console.log('PASS: credibility, institutional, Clean and Smart RFQ surfaces and consent-gated lead attribution align.');
