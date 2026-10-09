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
assert.ok(source.includes('sourceao.js?v=20261009-evidence-copy1'));

const events=read('analytics-events.js');
assert.ok(events.includes("form.dataset.hmatiasWebsiteIntake!=='true'"));
assert.ok(events.includes("track('generate_lead'"));
const client=read('website-lead-client.js');
assert.ok(client.includes("window.hmatiasAnalytics?.confirmLead?.("));
assert.ok(client.includes("if(!response.ok||result?.saved!==true"));
assert.ok(client.includes('turnstileToken:challengeToken'));

const allForms=['index.html','en.html','servicos-administrativos.html',
  'business-services.html','agendamento.html','booking.html'];
for(const path of allForms){
  const html=read(path);
  assert.ok(html.includes('analytics.js?v=20261009-confirmed-leads1'),
    'Analytics cache version not updated: '+path);
  if(path==='index.html'||path==='en.html'){
    assert.ok(html.includes('site-bootstrap.js?v=20261009-commercial-audit1'));
  }else{
    assert.ok(html.includes('website-lead-client.js?v=20261009-confirmed-attribution1'),
      'Secure client not loaded: '+path);
  }
}
const bootstrap=read('site-bootstrap.js');
assert.ok(bootstrap.includes('website-lead-client.js?v=20261009-confirmed-attribution1'));
assert.ok(bootstrap.includes('growth-intelligence.js?v=20261009-email-cta1'));
assert.ok(read('script.js').includes('const existing=target.querySelector'));
assert.ok(read('growth-intelligence.js').includes('[data-hmatias-email-alternative]'));
console.log('PASS: HMATIAS digital portfolio, Source AO copy, six intake surfaces and consent-gated lead attribution align.');
