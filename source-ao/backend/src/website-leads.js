import {encryptPrivateText,decryptPrivateText,sha256Hex,isAdmin} from './sourcing.js';

const ALLOWED_ORIGINS=new Set(['https://comercialhmatiasps.com','https://www.comercialhmatiasps.com']);
const KINDS=new Set(['contact','business','appointment']);
const STATUSES=new Set(['received','triage','responded','closed']);
const iso=()=>new Date().toISOString();
function headers(request){
  const origin=request.headers.get('origin')||'';
  return {
    'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'vary':'Origin','x-content-type-options':'nosniff',
    ...(ALLOWED_ORIGINS.has(origin)?{
      'access-control-allow-origin':origin,
      'access-control-allow-methods':'GET,POST,OPTIONS',
      'access-control-allow-headers':'authorization,content-type'
    }:{})
  };
}
function result(request,body,status=200){
  return new Response(JSON.stringify(body),{status,headers:headers(request)});
}
function fail(request,status,code){
  return result(request,{ok:false,error:{code}},status);
}
const clean=(value,max)=>typeof value==='string'?value.trim().replace(/[\u0000-\u0008\u000b\u000e-\u001f]/g,'').slice(0,max):'';

// Only non-identifying campaign codes and approved site paths are accepted.
// Never store URLs, search phrases, ad click IDs, cookies or arbitrary referrer paths.
const ATTRIBUTION_PAGES=new Set(['/','/index.html','/en.html',
  '/servicos-administrativos.html','/business-services.html',
  '/agendamento.html','/booking.html']);
function attributionSlug(value,max){
  if(value===undefined||value===null||value==='')return '';
  if(typeof value!=='string'||value.length>max||
    !/^[a-z0-9][a-z0-9_.-]*$/i.test(value))return null;
  return value.toLowerCase();
}
function normaliseAttribution(value){
  if(value===undefined||value===null)return {source:'',medium:'',campaign:'',landing_path:'',referrer_host:''};
  if(typeof value!=='object'||Array.isArray(value))return null;
  const source=attributionSlug(value.source,60);
  const medium=attributionSlug(value.medium,60);
  const campaign=attributionSlug(value.campaign,80);
  const referrer_host=attributionSlug(value.referrer_host,100);
  const landing_path=value.landing_path===undefined||value.landing_path===null?'':value.landing_path;
  if([source,medium,campaign,referrer_host].some(x=>x===null)||
     (landing_path!==''&&!ATTRIBUTION_PAGES.has(landing_path)))return null;
  if(referrer_host&&(!referrer_host.includes('.')||referrer_host.includes('..')))return null;
  return {source,medium,campaign,landing_path,referrer_host};
}

export function validateWebsiteLead(value){
  if(!value || typeof value!=='object'||Array.isArray(value))return null;
  const kind=clean(value.kind,40);
  const submission=clean(value.nonce,90);
  const name=clean(value.name,120);
  const company=clean(value.company,160);
  const phone=clean(value.phone,60);
  const email=clean(value.email,180).toLowerCase();
  const service=clean(value.service,140);
  const location=clean(value.location,160);
  const details=clean(value.details,2400);
  const preferred=clean(value.preferred_date,20);
  const channel=clean(value.preferred_channel,20);
  const attribution=normaliseAttribution(value.attribution);
  const maxLengths={nonce:90,name:120,company:160,phone:60,email:180,service:140,location:160,details:2400,preferred_date:20,preferred_channel:20};
  if(Object.entries(maxLengths).some(([field,maxLength])=>typeof value[field]==='string'&&value[field].length>maxLength))return null;
  if(!attribution||!KINDS.has(kind)||!/^[a-zA-Z0-9_-]{18,90}$/.test(submission)||
     value.consent!==true||Boolean(value.website)||
     name.length<2||service.length<2||details.length<5||
     (!phone&&!email)|| (phone&&phone.length<6)||
     (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||
     (channel&&!['phone','email','whatsapp'].includes(channel))||
     (preferred&&!/^\d{4}-\d{2}-\d{2}$/.test(preferred)))return null;
  return {kind,submission,name,company,phone,email,service,location,details,preferred,channel,attribution};
}

export function websiteLeadConfig(request,env){
  if(!allowedPublicOrigin(request))return fail(request,403,'origin_not_allowed');
  const active=enabled(env);
  return result(request,{ok:true,enabled:active,
    ...(active?{turnstileSiteKey:env.WEBSITE_LEADS_TURNSTILE_SITE_KEY}:{})});
}
export function websiteLeadCors(request){
  if(!ALLOWED_ORIGINS.has(request.headers.get('origin')||''))return fail(request,403,'origin_not_allowed');
  return new Response(null,{status:204,headers:headers(request)});
}
function allowedPublicOrigin(request){
  return ALLOWED_ORIGINS.has(request.headers.get('origin')||'');
}
function enabled(env){
  return env.WEBSITE_LEAD_INTAKE_ENABLED==='true'&&Boolean(
    env.SOURCE_AO_DB&&env.PII_ENCRYPTION_KEY&&
    env.WEBSITE_LEADS_TURNSTILE_SECRET&&
    typeof env.WEBSITE_LEADS_TURNSTILE_SITE_KEY==='string'&&
    /^[0-9A-Za-z_-]{8,180}$/.test(env.WEBSITE_LEADS_TURNSTILE_SITE_KEY)
  );
}

export async function verifyWebsiteLeadChallenge(request,env,raw,{fetchFn=fetch}={}){
  const token=typeof raw?.turnstileToken==='string'?raw.turnstileToken.trim():'';
  if(!token||token.length>2048||!env.WEBSITE_LEADS_TURNSTILE_SECRET)return false;
  const challenge=new URLSearchParams({secret:env.WEBSITE_LEADS_TURNSTILE_SECRET,response:token});
  const ip=request.headers.get('CF-Connecting-IP')||'';
  if(ip)challenge.set('remoteip',ip);
  try{
    const response=await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:challenge,
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok)return false;
    const confirmation=await response.json();
    return confirmation?.success===true&&
      ['comercialhmatiasps.com','www.comercialhmatiasps.com'].includes(confirmation.hostname);
  }catch{return false;}
}

const ref=()=> 'HM-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase();

export async function createWebsiteLead(request,env,{fetchFn=fetch}={}){
  if(!allowedPublicOrigin(request))return fail(request,403,'origin_not_allowed');
  if(!enabled(env))return fail(request,503,'website_intake_disabled');
  if(!(request.headers.get('content-type')||'').startsWith('application/json'))return fail(request,415,'json_required');
  if(Number(request.headers.get('content-length')||0)>6500)return fail(request,413,'payload_too_large');
  let payload,submissionInput;
  try{
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>6500)return fail(request,413,'payload_too_large');
    submissionInput=JSON.parse(raw);
    payload=validateWebsiteLead(submissionInput);
  }catch{return fail(request,400,'invalid_json');}
  if(!payload)return fail(request,400,'invalid_fields_or_consent');
  const {submission,...fields}=payload;
  const nonceHash=await sha256Hex('hm-website-lead|'+submission);
  const payloadHash=await sha256Hex(JSON.stringify(fields));
  const existing=await env.SOURCE_AO_DB.prepare(
    'SELECT reference,payload_hash FROM website_leads WHERE submission_hash=?'
  ).bind(nonceHash).first();
  if(existing){
    if(existing.payload_hash!==payloadHash)return fail(request,409,'submission_changed');
    return result(request,{ok:true,saved:true,reference:existing.reference,notification:'not_confirmed'},200);
  }
  if(!(await verifyWebsiteLeadChallenge(request,env,submissionInput,{fetchFn})))
    return fail(request,403,'turnstile_verification_failed');
  const reference=ref(),id='wl_'+crypto.randomUUID();
  const encrypted=await encryptPrivateText(JSON.stringify(fields),env.PII_ENCRYPTION_KEY);
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO website_leads(id,reference,submission_hash,payload_hash,kind,service,encrypted_payload)
    VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(submission_hash) DO NOTHING
  `).bind(id,reference,nonceHash,payloadHash,fields.kind,fields.service,encrypted).run();
  const saved=await env.SOURCE_AO_DB.prepare(
    'SELECT reference,payload_hash FROM website_leads WHERE submission_hash=?'
  ).bind(nonceHash).first();
  if(!saved)return fail(request,503,'storage_not_confirmed');
  if(saved.payload_hash!==payloadHash)return fail(request,409,'submission_changed');
  return result(request,{ok:true,saved:true,reference:saved.reference,notification:'not_confirmed'},saved.reference===reference?201:200);
}

export async function listWebsiteLeads(request,env){
  if(!isAdmin(request,env))return fail(request,401,'unauthorized');
  if(!env.SOURCE_AO_DB)return fail(request,503,'storage_unavailable');
  const rows=await env.SOURCE_AO_DB.prepare(
    'SELECT id,reference,kind,service,status,alert_state,created_at FROM website_leads ORDER BY created_at DESC LIMIT 60'
  ).all();
  const tally=await env.SOURCE_AO_DB.prepare(
    "SELECT alert_state,COUNT(*) AS total FROM website_leads GROUP BY alert_state"
  ).all();
  const counts={pending:0,accepted:0};
  for(const row of tally.results||[])if(Object.hasOwn(counts,row.alert_state))counts[row.alert_state]=Number(row.total)||0;
  return result(request,{ok:true,results:rows.results||[],alerts:counts,delivery_configured:websiteDeliveryReady(env)});
}

export async function getWebsiteLead(request,env,id){
  if(!isAdmin(request,env))return fail(request,401,'unauthorized');
  if(!/^wl_[0-9a-f-]{36}$/.test(id))return fail(request,404,'not_found');
  const row=await env.SOURCE_AO_DB.prepare(
    'SELECT id,reference,kind,service,status,alert_state,created_at,encrypted_payload FROM website_leads WHERE id=?'
  ).bind(id).first();
  if(!row)return fail(request,404,'not_found');
  const {encrypted_payload,...visible}=row;
  const privateData=JSON.parse(await decryptPrivateText(encrypted_payload,env.PII_ENCRYPTION_KEY));
  return result(request,{ok:true,lead:{...visible,private:privateData}});
}

export async function updateWebsiteLeadStatus(request,env,id){
  if(!isAdmin(request,env))return fail(request,401,'unauthorized');
  if(!/^wl_[0-9a-f-]{36}$/.test(id))return fail(request,404,'not_found');
  let body;
  try{body=await request.json();}catch{return fail(request,400,'invalid_json');}
  if(!STATUSES.has(body?.status))return fail(request,400,'invalid_status');
  const done=await env.SOURCE_AO_DB.prepare(
    'UPDATE website_leads SET status=?,updated_at=? WHERE id=? RETURNING reference,status'
  ).bind(body.status,iso(),id).first();
  return done?result(request,{ok:true,lead:done}):fail(request,404,'not_found');
}

export function websiteDeliveryReady(env){
  return Boolean(env.SOURCE_AO_DB&&env.PII_ENCRYPTION_KEY&&env.RESEND_API_KEY&&env.SOURCE_AO_ALERT_FROM&&env.SOURCE_AO_ALERT_TO);
}
export async function deliverWebsiteLeadAlerts(env,{limit=5,now=new Date(),fetchFn=fetch}={}){
  if(!websiteDeliveryReady(env))return {configured:false,processed:0,accepted:0,failed:0};
  const rows=await env.SOURCE_AO_DB.prepare(
    "SELECT id,reference,kind,service,encrypted_payload,alert_attempts FROM website_leads WHERE alert_state='pending' AND datetime(next_alert_attempt)<=datetime(?) ORDER BY created_at ASC LIMIT ?"
  ).bind(now.toISOString(),Math.max(1,Math.min(10,limit))).all();
  let accepted=0,failed=0;
  for(const row of rows.results||[]){
    try{
      const details=JSON.parse(await decryptPrivateText(row.encrypted_payload,env.PII_ENCRYPTION_KEY));
      const lines=[
        'HMATIAS — NOVO PEDIDO DO WEBSITE','Referência: '+row.reference,
        'Tipo: '+row.kind,'Serviço: '+row.service,
        'Nome: '+details.name,'Empresa: '+details.company,
        'Telefone: '+details.phone,'E-mail: '+details.email,
        'Localização: '+details.location,'Descrição: '+details.details,
        'Data pretendida: '+details.preferred,
        'Origem UTM: '+(details.attribution?.source||'não identificada'),
        'Meio UTM: '+(details.attribution?.medium||'não identificado'),
        'Campanha UTM: '+(details.attribution?.campaign||'não identificada'),
        'Página de entrada: '+(details.attribution?.landing_path||'não identificada'),
        'Domínio de referência: '+(details.attribution?.referrer_host||'não identificado'),
        '',
        'Registado na D1. Atribuir responsável comercial e verificar os detalhes na área interna.'
      ];
      const response=await fetchFn('https://api.resend.com/emails',{
        method:'POST',headers:{
          authorization:'Bearer '+env.RESEND_API_KEY,
          'content-type':'application/json','Idempotency-Key':'hmatias-website-'+row.reference
        },
        body:JSON.stringify({
          from:env.SOURCE_AO_ALERT_FROM,to:[env.SOURCE_AO_ALERT_TO],
          subject:'Novo pedido HMATIAS · '+row.reference,text:lines.join('\n')
        }),signal:AbortSignal.timeout(10000)
      });
      if(!response.ok)throw Error('provider_not_accepted');
      await env.SOURCE_AO_DB.prepare(
        "UPDATE website_leads SET alert_state='accepted',alert_accepted_at=?,alert_attempts=alert_attempts+1 WHERE id=? AND alert_state='pending'"
      ).bind(now.toISOString(),row.id).run();
      accepted++;
    }catch{
      const attempts=Number(row.alert_attempts||0)+1;
      const minutes=Math.min(1440,5*2**Math.min(8,attempts-1));
      const next=new Date(now.getTime()+minutes*60000).toISOString();
      await env.SOURCE_AO_DB.prepare(
        "UPDATE website_leads SET alert_attempts=?,next_alert_attempt=? WHERE id=? AND alert_state='pending'"
      ).bind(attempts,next,row.id).run();
      failed++;
    }
  }
  return {configured:true,processed:(rows.results||[]).length,accepted,failed};
}

export async function pruneWebsiteLeads(env){
  if(!env.SOURCE_AO_DB)return 0;
  const days=Math.max(30,Math.min(180,Number(env.CONTACT_RETENTION_DAYS)||180));
  const safeDay=new Date(Date.now()-days*86400000).toISOString();
  const done=await env.SOURCE_AO_DB.prepare('DELETE FROM website_leads WHERE created_at<?').bind(safeDay).run();
  return Number(done.meta?.changes||0);
}
