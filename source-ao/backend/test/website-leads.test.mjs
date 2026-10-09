import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWebsiteLead,websiteLeadCors,createWebsiteLead,
  listWebsiteLeads,websiteDeliveryReady,deliverWebsiteLeadAlerts
} from '../src/website-leads.js';
import {rateLimitPolicy} from '../src/security.js';
import {websiteLeadDesk} from '../src/website-lead-desk.js';

const body={
  kind:'contact',nonce:'550e8400-e29b-41d4-a716-446655440000',
  consent:true,website:'',name:'Cliente Teste',company:'Firma',
  phone:'+244 900 000 000',email:'teste@example.invalid',
  service:'Construção',location:'Luanda',
  details:'Solicito uma avaliação técnica.',preferred_channel:'whatsapp'
};
const submit=(data=body,origin='https://comercialhmatiasps.com')=>
  new Request('https://worker.example/api/website-leads',{
    method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)
  });

test('accepts only explicit consent and valid business contact fields',()=>{
  const v=validateWebsiteLead(body);
  assert.equal(v.name,'Cliente Teste');
  assert.equal(v.kind,'contact');
  assert.equal('consent' in v,false);
  assert.equal('website' in v,false);
  assert.equal(validateWebsiteLead({...body,consent:false}),null);
  assert.equal(validateWebsiteLead({...body,website:'spam bot'}),null);
  assert.equal(validateWebsiteLead({...body,phone:'',email:''}),null);
  assert.equal(validateWebsiteLead({...body,kind:'test'}),null);
  assert.equal(validateWebsiteLead({...body,email:'not-an-email'}),null);
  assert.equal(validateWebsiteLead({...body,nonce:'too short'}),null);
});
test('blocks cross-origin preflights and production writes',async()=>{
  assert.equal(websiteLeadCors(new Request('https://worker.example/api/website-leads',{
    method:'OPTIONS',headers:{origin:'https://attacker.example'}
  })).status,403);
  const allowed=websiteLeadCors(new Request('https://worker.example/api/website-leads',{
    method:'OPTIONS',headers:{origin:'https://comercialhmatiasps.com'}
  }));
  assert.equal(allowed.status,204);
  assert.equal(allowed.headers.get('access-control-allow-origin'),'https://comercialhmatiasps.com');
  let res=await createWebsiteLead(submit(body,'https://attacker.example'),{});
  assert.equal(res.status,403);
  res=await createWebsiteLead(submit(),{WEBSITE_LEAD_INTAKE_ENABLED:'false'});
  assert.equal(res.status,503);
  assert.equal((await res.json()).error.code,'website_intake_disabled');
});
test('route has stricter creation rate limit than public searches',()=>{
  const p=rateLimitPolicy(submit(),'/api/website-leads');
  assert.equal(p.bucket,'website-lead-create');
  assert.equal(p.limit,4);
});
test('admin listing rejects missing or incorrect tokens',async()=>{
  const request=new Request('https://worker.example/api/admin/website-leads',{headers:{origin:'https://comercialhmatiasps.com'}});
  const r=await listWebsiteLeads(request,{ADMIN_API_TOKEN:'correct'});
  assert.equal(r.status,401);
});
test('delivery cannot claim acceptance without configured Resend secrets',async()=>{
  assert.equal(websiteDeliveryReady({SOURCE_AO_DB:{}}),false);
  assert.deepEqual(await deliverWebsiteLeadAlerts({SOURCE_AO_DB:{}}),{
    configured:false,processed:0,accepted:0,failed:0
  });
});
test('preserves idempotent submissions and stores only ciphertext',async()=>{
  const data=new Map();
  let inserted=0;
  const db={
    prepare(sql){
      let args=[];
      return {
        bind(...values){args=values;return this;},
        async first(){
          if(sql.startsWith('SELECT reference,payload_hash'))return data.get(args[0])||null;
          return null;
        },
        async run(){
          if(sql.includes('INSERT INTO website_leads')){
            inserted++;
            if(!data.has(args[2]))data.set(args[2],{
              reference:args[1],payload_hash:args[3],encrypted_payload:args[6]
            });
          }
          return {success:true};
        }
      };
    }
  };
  const env={WEBSITE_LEAD_INTAKE_ENABLED:'true',PII_ENCRYPTION_KEY:'safe-test-key-not-live',SOURCE_AO_DB:db};
  const first=await createWebsiteLead(submit(),env);
  assert.equal(first.status,201);
  const x=await first.json();
  assert.match(x.reference,/^HM-[0-9]{8}-[A-Z0-9]{8}$/);
  assert.equal(x.saved,true);
  assert.equal(x.notification,'not_confirmed');
  const second=await createWebsiteLead(submit(),env);
  assert.equal(second.status,200);
  assert.equal((await second.json()).reference,x.reference);
  assert.equal(inserted,1);
  const saved=[...data.values()][0];
  assert.equal(saved.encrypted_payload.includes('Cliente Teste'),false);
  const conflict=await createWebsiteLead(submit({...body,details:'Texto diferente no mesmo nonce.'}),env);
  assert.equal(conflict.status,409);
});


test('internal review shell exposes no private data or credentials',async()=>{
  const response=websiteLeadDesk();
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store, private');
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  const html=await response.text();
  assert.match(html,/\/api\/admin\/website-leads/);
  assert.equal(html.includes('ADMIN_API_TOKEN'),false);
  assert.equal(html.includes('geral@comercialhmatiasps.com'),false);
});
