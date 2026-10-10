import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWebsiteLead,websiteLeadCors,websiteLeadConfig,verifyWebsiteLeadChallenge,createWebsiteLead,
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
test('Clean and Smart RFQ are accepted as explicit business lead types',()=>{
  assert.equal(validateWebsiteLead({...body,kind:'clean',service:'HMATIAS Clean'})?.kind,'clean');
  assert.equal(validateWebsiteLead({...body,kind:'rfq',service:'Supply & Procurement'})?.kind,'rfq');
  assert.equal(validateWebsiteLead({...body,kind:'unknown'}),null);
});
test('campaign attribution is strictly limited to public paths and non-identifying codes',()=>{
  const value=validateWebsiteLead({...body,attribution:{
    source:'Google',medium:'CPC',campaign:'facilities_luanda_2026',
    landing_path:'/facilities.html',referrer_host:'google.com'
  }});
  assert.deepEqual(value.attribution,{
    source:'google',medium:'cpc',campaign:'facilities_luanda_2026',
    landing_path:'/facilities.html',referrer_host:'google.com'
  });
  assert.equal(validateWebsiteLead({...body,attribution:{source:'lead@example.com'}}),null);
  assert.equal(validateWebsiteLead({...body,attribution:{landing_path:'/source-ao/ops.html'}}),null);
  assert.equal(validateWebsiteLead({...body,attribution:{landing_path:'/private?token=secret'}}),null);
  assert.equal(validateWebsiteLead({...body,attribution:{referrer_host:'https://example.com/contact?id=2'}}),null);
  assert.equal(validateWebsiteLead({...body,attribution:{campaign:'a'.repeat(81)}}),null);
  assert.equal(validateWebsiteLead({...body,attribution:{campaign:'obra agosto'}}),null);
  assert.equal(validateWebsiteLead({...body,attribution:{landing_path:'/source-ao/rfq.html'}})?.attribution.landing_path,'/source-ao/rfq.html');
  assert.equal(validateWebsiteLead({...body,attribution:undefined})?.attribution.source,'');
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
  const env={WEBSITE_LEAD_INTAKE_ENABLED:'true',PII_ENCRYPTION_KEY:'safe-test-key-not-live',SOURCE_AO_DB:db,
    WEBSITE_LEADS_TURNSTILE_SECRET:'test-turnstile-secret',WEBSITE_LEADS_TURNSTILE_SITE_KEY:'0x4AAAA_testsitekey'};
  const fetchFn=async()=>new Response(JSON.stringify({success:true,hostname:'comercialhmatiasps.com'}),{status:200});
  const first=await createWebsiteLead(submit({...body,turnstileToken:'valid-challenge-token'}),env,{fetchFn});
  assert.equal(first.status,201);
  const x=await first.json();
  assert.match(x.reference,/^HM-[0-9]{8}-[A-Z0-9]{8}$/);
  assert.equal(x.saved,true);
  assert.equal(x.notification,'not_confirmed');
  const second=await createWebsiteLead(submit({...body,turnstileToken:'valid-challenge-token'}),env,{fetchFn});
  assert.equal(second.status,200);
  assert.equal((await second.json()).reference,x.reference);
  assert.equal(inserted,1);
  const saved=[...data.values()][0];
  assert.equal(saved.encrypted_payload.includes('Cliente Teste'),false);
  const conflict=await createWebsiteLead(submit({...body,details:'Texto diferente no mesmo nonce.',turnstileToken:'valid-challenge-token'}),env,{fetchFn});
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

test('public site key is offered only with complete anti-bot configuration',()=>{
  const request=new Request('https://worker.example/api/website-leads/config',{
    headers:{origin:'https://comercialhmatiasps.com'}
  });
  const env={WEBSITE_LEAD_INTAKE_ENABLED:'true',SOURCE_AO_DB:{},PII_ENCRYPTION_KEY:'secret'};
  let r=websiteLeadConfig(request,env);
  assert.equal(r.status,200);
  return r.json().then(async value=>{
    assert.equal(value.enabled,false);
    assert.equal(Object.hasOwn(value,'turnstileSiteKey'),false);
    const complete={...env,WEBSITE_LEADS_TURNSTILE_SITE_KEY:'0x4AAAA_testsitekey',
      WEBSITE_LEADS_TURNSTILE_SECRET:'private-server-key'};
    r=websiteLeadConfig(request,complete);
    const config=await r.json();
    assert.equal(config.enabled,true);
    assert.equal(config.turnstileSiteKey,'0x4AAAA_testsitekey');
    assert.equal(JSON.stringify(config).includes('private-server-key'),false);
  });
});
test('server anti-bot validation rejects missing, failed and foreign-host challenges',async()=>{
  const env={WEBSITE_LEADS_TURNSTILE_SECRET:'server-secret'};
  assert.equal(await verifyWebsiteLeadChallenge(submit(body),env,{}),false);
  assert.equal(await verifyWebsiteLeadChallenge(submit(body),env,{turnstileToken:'some-token'},{
    fetchFn:async()=>new Response(JSON.stringify({success:false,hostname:'comercialhmatiasps.com'}))
  }),false);
  assert.equal(await verifyWebsiteLeadChallenge(submit(body),env,{turnstileToken:'some-token'},{
    fetchFn:async()=>new Response(JSON.stringify({success:true,hostname:'fraudulent.example'}))
  }),false);
  assert.equal(await verifyWebsiteLeadChallenge(submit(body),env,{turnstileToken:'some-token'},{
    fetchFn:async()=>new Response(JSON.stringify({success:true,hostname:'comercialhmatiasps.com'}))
  }),true);
});
test('new lead cannot be stored before the server validates Turnstile',async()=>{
  let writes=0;
  const db={prepare(sql){return{
    bind(){return this;},
    async first(){return null;},
    async run(){writes++;return{success:true};}
  };}};
  const env={WEBSITE_LEAD_INTAKE_ENABLED:'true',PII_ENCRYPTION_KEY:'test-key',SOURCE_AO_DB:db,
    WEBSITE_LEADS_TURNSTILE_SECRET:'server-key',WEBSITE_LEADS_TURNSTILE_SITE_KEY:'0x4AAAA_testsitekey'};
  const r=await createWebsiteLead(submit({...body,turnstileToken:'bad-token'}),env,{
    fetchFn:async()=>new Response(JSON.stringify({success:false,hostname:'comercialhmatiasps.com'}))
  });
  assert.equal(r.status,403);
  assert.equal((await r.json()).error.code,'turnstile_verification_failed');
  assert.equal(writes,0);
});
