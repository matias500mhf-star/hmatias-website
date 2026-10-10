import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const read=path=>readFileSync(path,'utf8');
const rootPages=readdirSync('.').filter(n=>n.endsWith('.html'));
const sourcePages=readdirSync('source-ao').filter(n=>n.endsWith('.html')).map(n=>'source-ao/'+n);
const pages=[...rootPages,...sourcePages];

test('every static HTML page uses unique element IDs',()=>{
  for(const path of pages){
    const ids=[...read(path).matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);
    const found=new Set();
    for(const id of ids){
      assert.ok(!found.has(id),path+': duplicate ID '+id);
      found.add(id);
    }
  }
});
test('smart RFQ email field and delivery link cannot conflict or be rerouted',()=>{
  for(const page of ['rfq.html','rfq-en.html']){
    const html=read(page);
    assert.match(html,/<input\s+id="rfqEmail"\s+name="email"/);
    assert.match(html,/<a\s+id="rfqEmailSend"\b[^>]*href="mailto:geral@comercialhmatiasps.com"/);
    assert.doesNotMatch(html,/<a\s+id="rfqEmailSend"[^>]*data-quote-link/);
    assert.match(html,/website-advanced-intake\.js/);
  }
  assert.match(read('rfq.js'),/getElementById\('rfqEmailSend'\)/);
});
test('commercial and cleaning forms provide explicit delivery rather than popup-only',()=>{
  const shared=read('script.js'),clean=read('clean-store.js');
  assert.match(shared,/formOutcome\.present\(form,text/);
  assert.match(shared,/formOutcome\.present\(businessForm,text/);
  assert.match(shared,/formOutcome\.present\(bookingForm,text/);
  assert.match(shared,/Enviar pelo WhatsApp/);
  assert.match(shared,/mailto:geral@comercialhmatiasps.com/);
  assert.doesNotMatch(shared,/window\.open\('https:\/\/wa\.me\/244948806673\?text=/);
  assert.match(clean,/hmatias:clean-quote-prepared/);
  assert.match(clean,/HMATIASFormOutcome\.present/);
  assert.doesNotMatch(clean,/window\.open\(/);
});
test('secure quote intake is capability-gated and recognises only stored references',()=>{
  const client=read('website-advanced-intake.js');
  assert.match(client,/config\?\.enabled!==true/);
  assert.match(client,/turnstile\.render/);
  assert.match(client,/body\?\.saved!==true/);
  assert.match(client,/receipt|reference|Referência/);
  assert.match(client,/NÃO está confirmado|Registration could not be confirmed/);
  for(const p of ['clean.html','clean-en.html','rfq.html','rfq-en.html'])
    assert.match(read(p),/website-advanced-intake\.js/,p);
});
test('Source AO has a stored request route, not just an unverified WhatsApp popup',()=>{
  assert.match(read('source-ao/sourcing-ui.js'),/api\/sourcing-requests/);
  assert.match(read('source-ao/sourcing-ui.js'),/addEventListener\('submit',onSubmit,true\)/);
  assert.match(read('source-ao/rfq.js'),/result\.request\.reference/);
  assert.match(read('source-ao/partner-application.js'),/api\/partner-applications/);
});
