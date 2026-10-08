import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './src/index.js';

const allowed='https://comercialhmatiasps.com';
const input=()=>({
  nonce:'ABCDEF0123456789ABCDEF0123456789',kind:'contact',name:'Teste Comercial',
  company:'Cliente Exemplo',email:'cliente@example.test',phone:'+244900000000',
  service:'Facilities',location:'Luanda',details:'Solicitação de manutenção e limpeza no escritório.',
  consent:true,turnstileToken:'mock-verified-token'
});
function fakeDb(){
  const leads=new Map(),nonces=new Map(),limits=new Map();
  return {
    leads,
    prepare(sql){
      let vals=[];
      return {
        bind(...v){vals=v;return this},
        async run(){
          if(sql.startsWith('INSERT INTO hourly_rate')){limits.set(vals[0],(limits.get(vals[0])||0)+1);return {success:true}}
          if(sql.startsWith('INSERT INTO leads(')){
            const [reference,nonce,created_at,kind,full_name,company,email,phone,service,location,details,consent_at]=vals;
            if(nonces.has(nonce))throw new Error('duplicate');
            const record={reference,nonce,created_at,kind,full_name,company,email,phone,service,location,details,consent_at,crm_status:'pending',alert_status:'pending',receipt_status:'pending'};
            leads.set(reference,record);nonces.set(nonce,record);return {success:true};
          }
          if(sql.startsWith('UPDATE leads SET ')){
            const col=sql.match(/SET (\w+)=\?/)[1],record=leads.get(vals[1]);record[col]=vals[0];return {success:true};
          }
          return {success:true};
        },
        async first(){
          if(sql.startsWith('SELECT count FROM hourly_rate'))return {count:limits.get(vals[0])||0};
          if(sql.startsWith('SELECT * FROM leads WHERE nonce='))return nonces.get(vals[0])||null;
          return null;
        },
        async all(){return {results:[...leads.values()]}}
      };
    }
  };
}
function configured(db){
 return {
  LEADS_DB:db,TURNSTILE_SECRET:'test-only',RATE_LIMIT_SALT:'test-only-random-string',
  LEADS_NOTIFY_TO:'geral@example.test',RESEND_API_KEY:'test-api-key',
  RESEND_FROM:'HMATIAS <noreply@example.test>',
  HUBSPOT_PORTAL_ID:'test-portal',HUBSPOT_FORM_GUID:'test-form'
 };
}
function request(body,origin=allowed){
 return new Request('https://hmatias-lead-intake.example/v1/leads',{
  method:'POST',headers:{'content-type':'application/json',origin,'CF-Connecting-IP':'192.0.2.25'},
  body:JSON.stringify(body)
 });
}
test('health is not ready until secrets are configured',async()=>{
 const r=await worker.fetch(new Request('https://example.test/health'),{},{});assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{status:'not_configured'});
});
test('CORS rejects foreign website origins',async()=>{
 const r=await worker.fetch(request(input(),'https://not-hmatias.example'),configured(fakeDb()),{waitUntil(){}});
 assert.equal(r.status,403);assert.equal((await r.json()).error,'origin_not_allowed');
});
test('no lead is accepted without configured persistent backend and notification channels',async()=>{
 const r=await worker.fetch(request(input()),{},{});assert.equal(r.status,503);
 assert.equal((await r.json()).error,'service_not_configured');
});
test('lack of express consent is rejected without reaching external providers',async()=>{
 const r=await worker.fetch(request({...input(),consent:false}),configured(fakeDb()),{waitUntil(){}});
 assert.equal(r.status,422);assert.equal((await r.json()).error,'invalid_fields_or_consent');
});
test('successful request is stored once, has a reference, and sends optional outbound messages',async()=>{
 const db=fakeDb(),env=configured(db),sent=[];
 const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  sent.push({url:String(url),body:options?.body});
  if(String(url).includes('turnstile'))return new Response(JSON.stringify({success:true,hostname:'comercialhmatiasps.com'}),{status:200});
  return new Response(JSON.stringify({success:true}),{status:200});
 };
 try{
  const pending=[],ctx={waitUntil(p){pending.push(p)}};
  const a=await worker.fetch(request(input()),env,ctx);
  assert.equal(a.status,201);const body=await a.json();
  assert.equal(body.saved,true);assert.match(body.reference,/^HM-\d{8}-[A-Z0-9]+$/);
  assert.equal(db.leads.size,1);
  await Promise.all(pending);
  const record=[...db.leads.values()][0];
  assert.equal(record.crm_status,'synced');assert.equal(record.alert_status,'sent');assert.equal(record.receipt_status,'sent');
  assert.equal(sent.filter(x=>x.url.includes('api.hsforms.com')).length,1);
  assert.equal(sent.filter(x=>x.url.includes('resend.com')).length,2);
  const again=await worker.fetch(request(input()),env,{waitUntil(){}});
  assert.equal(again.status,200);assert.equal((await again.json()).reference,body.reference);
  assert.equal(db.leads.size,1);
 }finally{globalThis.fetch=original}
});
