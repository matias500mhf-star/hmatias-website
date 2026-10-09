// Production-safe smoke: inspect institutional website lead intake without creating PII or leads.
import assert from 'node:assert/strict';

const base=(process.env.SOURCE_AO_PRODUCTION_API_BASE||'').replace(/\/$/,'');
const admin=process.env.SOURCE_AO_ADMIN_API_TOKEN||'';
const origin='https://comercialhmatiasps.com';
if(!/^https:\/\//.test(base)||!admin)throw Error('Production website lead smoke credentials missing');

async function call(route,{method='GET',token='',body,headers={}}={}){
  const response=await fetch(base+route,{
    method,headers:{
      origin,accept:'application/json',
      ...(body?{'content-type':'application/json'}:{}),
      ...(token?{authorization:'Bearer '+token}:{}),...headers
    },
    body:body?JSON.stringify(body):undefined,
    signal:AbortSignal.timeout(14000)
  });
  const parsed=response.status===204?null:await response.json().catch(()=>null);
  return {response,parsed};
}
const desk=await fetch(base+'/internal/website-leads',{signal:AbortSignal.timeout(12000)});
assert.equal(desk.status,200);
assert.equal(desk.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
assert.match(desk.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
const deskBody=await desk.text();
assert.match(deskBody,/HMATIAS/);
assert.match(deskBody,/\/api\/admin\/website-leads/);
assert.equal(deskBody.includes('ADMIN_API_TOKEN'),false);

const config=await call('/api/website-leads/config');
assert.equal(config.response.status,200);
assert.equal(config.parsed?.ok,true);
assert.equal(config.parsed?.enabled,false,'Institutional lead intake must remain opt-in until acceptance testing');

const preflight=await call('/api/website-leads',{method:'OPTIONS',headers:{'access-control-request-method':'POST'}});
assert.equal(preflight.response.status,204);
assert.equal(preflight.response.headers.get('access-control-allow-origin'),origin);

const unauthorized=await call('/api/admin/website-leads');
assert.equal(unauthorized.response.status,401);
const authorized=await call('/api/admin/website-leads',{token:admin});
assert.equal(authorized.response.status,200);
assert.equal(authorized.parsed?.ok,true);
assert.ok(Array.isArray(authorized.parsed?.results));
assert.ok(typeof authorized.parsed?.alerts?.pending==='number');

const disabled=await call('/api/website-leads',{method:'POST',body:{
  nonce:'550e8400-e29b-41d4-a716-446655440000',kind:'contact',consent:true,
  name:'Smoke automatico',phone:'+244900000000',service:'Teste desativado',
  details:'Nao gravar pedido sintético em producao.'
}});
assert.equal(disabled.response.status,503);
assert.equal(disabled.parsed?.error?.code,'website_intake_disabled');
console.log('PASS: production website leads API ready, private list protected, intake remains disabled; no test lead saved.');
