import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
assert.ok(source.includes('Pesquisa técnica de materiais e fornecedores.'));
assert.ok(source.includes('Referências indexadas e fontes identificadas para pesquisa comercial.'));
assert.ok(!source.includes('<strong data-i18n="cap2t">Supplier Discovery</strong>'));
assert.ok(source.includes('sourceao.js?v=20261010-professional-copy1'));

const events=read('analytics-events.js');
assert.ok(events.includes("form.dataset.hmatiasWebsiteIntake!=='true'"));
assert.ok(events.includes("track('generate_lead'"));
const client=read('website-lead-client.js');
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
assert.ok(read('script.js').includes('const existing=target.querySelector'));
assert.ok(read('growth-intelligence.js').includes('[data-hmatias-email-alternative]'));
assert.ok(client.includes("id:'cleanQuoteForm'"));
assert.ok(client.includes("id:'smartRfqForm'"));
console.log('PASS: institutional, Clean and Smart RFQ intake surfaces and consent-gated lead attribution align.');
