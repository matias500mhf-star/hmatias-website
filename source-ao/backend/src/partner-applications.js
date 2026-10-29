import {isAdmin,normalizeSearch} from './index.js';
import {encryptPrivateText,decryptPrivateText,sha256Hex} from './sourcing.js';

const PARTNER_TYPES=new Set(['supplier','subcontractor','service_provider','technical_partner','strategic_partner']);
const COUNTRIES=new Set(['AO','NA','ZA']);
const STATUSES=new Set(['pending_review','under_review','accepted','rejected']);
const enc=new TextEncoder();

const headers=env=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
  'access-control-allow-methods':'GET,POST,OPTIONS',
  'access-control-allow-headers':'content-type,authorization'
});
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(env)});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);
const clean=(value,max=500)=>{
  if(value==null)return '';
  const text=String(value).trim();
  if(text.length>max)throw new Error('value_too_long');
  return text;
};
const list=(value,maxItems=24,maxLen=100)=>Array.isArray(value)
  ?[...new Set(value.map(v=>clean(v,maxLen)).filter(Boolean))].slice(0,maxItems)
  :[];
const safeUrl=value=>{
  if(!value)return null;
  try{
    const url=new URL(value);
    return ['http:','https:'].includes(url.protocol)?url.toString():null;
  }catch{return null}
};
const id=prefix=>prefix+'_'+crypto.randomUUID().replaceAll('-','');
const reference=()=>{
  const d=new Date();
  const stamp=d.getUTCFullYear()+String(d.getUTCMonth()+1).padStart(2,'0')+String(d.getUTCDate()).padStart(2,'0');
  return 'PAR-'+stamp+'-'+crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();
};
const contactHint=value=>{
  const v=String(value||'').trim();
  if(v.includes('@')){
    const [name,domain='']=v.split('@');
    return (name[0]||'*')+'***@'+domain;
  }
  const digits=v.replace(/\D/g,'');
  return digits.length>=4?'••••'+digits.slice(-4):'private';
};

function validate(input={}){
  let companyName,country,locality,website,type,registration,contactName,role,email,whatsapp,note,portfolio;
  try{
    companyName=clean(input.company_name,220);
    country=clean(input.country_code,2).toUpperCase()||'AO';
    locality=clean(input.locality,180);
    website=clean(input.website,600);
    type=clean(input.partner_type,40);
    registration=clean(input.registration_number,120);
    contactName=clean(input.contact_name,180);
    role=clean(input.contact_role,120);
    email=clean(input.email,180);
    whatsapp=clean(input.whatsapp,80);
    note=clean(input.note,1600);
    portfolio=clean(input.portfolio_url,600);
  }catch{return {ok:false,code:'field_too_long'}}
  if(companyName.length<2)return {ok:false,code:'company_required'};
  if(!COUNTRIES.has(country))return {ok:false,code:'country_invalid'};
  if(locality.length<2)return {ok:false,code:'locality_required'};
  if(!PARTNER_TYPES.has(type))return {ok:false,code:'type_invalid'};
  if(registration.length<3)return {ok:false,code:'registration_required'};
  if(contactName.length<2)return {ok:false,code:'contact_name_required'};
  if(!email&&!whatsapp)return {ok:false,code:'contact_required'};
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {ok:false,code:'email_invalid'};
  const web=safeUrl(website),port=safeUrl(portfolio);
  if(website&&!web)return {ok:false,code:'website_invalid'};
  if(portfolio&&!port)return {ok:false,code:'portfolio_invalid'};
  const capabilities=list(input.capabilities,30,100);
  const sectors=list(input.sectors,20,100);
  if(!capabilities.length)return {ok:false,code:'capabilities_required'};
  return {ok:true,value:{
    companyName,country,locality,website:web,type,registration,contactName,role,email,whatsapp,note,
    portfolio:port,capabilities,sectors
  }};
}

export async function createPartnerApplication(request,env){
  if(!(request.headers.get('content-type')||'').includes('application/json'))
    return fail(env,415,'json_required','JSON body required.');
  const raw=await request.text();
  if(enc.encode(raw).byteLength>30000)return fail(env,413,'payload_too_large','Application exceeds 30 KB.');
  let input;
  try{input=JSON.parse(raw)}catch{return fail(env,400,'invalid_json','Invalid JSON request.')}
  if(!input||typeof input!=='object'||Array.isArray(input))return fail(env,400,'invalid_request','Invalid application.');
  const valid=validate(input);
  if(!valid.ok){
    const messages={
      company_required:'Legal company name is required.',
      country_invalid:'Unsupported country.',
      locality_required:'Locality is required.',
      type_invalid:'Select a valid partnership type.',
      registration_required:'NIF or company registration number is required.',
      contact_name_required:'Contact person is required.',
      contact_required:'Provide at least an email or WhatsApp contact.',
      email_invalid:'Email address is invalid.',
      website_invalid:'Website must be a valid HTTP/HTTPS URL.',
      portfolio_invalid:'Portfolio/reference URL must be a valid HTTP/HTTPS URL.',
      capabilities_required:'Select at least one business capability.',
      field_too_long:'One or more fields exceed the allowed length.'
    };
    return fail(env,400,valid.code,messages[valid.code]||'Invalid partner application.');
  }
  if(!env.PII_ENCRYPTION_KEY)return fail(env,503,'privacy_key_unavailable','Secure application intake is not configured.');
  const v=valid.value;
  const normalized=normalizeSearch(v.companyName).replace(/\s+/g,' ').trim();
  const dedupeKey=await sha256Hex(normalized+'|'+normalizeSearch(v.registration));
  const existing=await env.SOURCE_AO_DB.prepare(
    "SELECT reference,status FROM partner_applications WHERE dedupe_key=? AND status IN ('pending_review','under_review','accepted') ORDER BY submitted_at DESC LIMIT 1"
  ).bind(dedupeKey).first();
  if(existing)return json(env,{ok:true,duplicate:true,reference:existing.reference,status:existing.status},200);

  const privateProfile=await encryptPrivateText(JSON.stringify({
    registration_number:v.registration,
    contact_name:v.contactName,
    contact_role:v.role||null,
    email:v.email||null,
    whatsapp:v.whatsapp||null,
    portfolio_url:v.portfolio||null,
    note:v.note||null
  }),env.PII_ENCRYPTION_KEY);

  const applicationId=id('pa');
  const ref=reference();
  const hint=contactHint(v.email||v.whatsapp);
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO partner_applications(
      id,reference,company_name,normalized_name,country_code,locality,website,partner_type,
      capabilities_json,sectors_json,private_profile_ciphertext,contact_hint,dedupe_key,status
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'pending_review')
  `).bind(
    applicationId,ref,v.companyName,normalized,v.country,v.locality,v.website,v.type,
    JSON.stringify(v.capabilities),JSON.stringify(v.sectors),privateProfile,hint,dedupeKey
  ).run();

  return json(env,{ok:true,reference:ref,status:'pending_review'},201);
}

const publicRow=row=>({
  id:row.id,
  reference:row.reference,
  company_name:row.company_name,
  country_code:row.country_code,
  locality:row.locality,
  website:row.website,
  partner_type:row.partner_type,
  capabilities:JSON.parse(row.capabilities_json||'[]'),
  sectors:JSON.parse(row.sectors_json||'[]'),
  contact_hint:row.contact_hint,
  status:row.status,
  commercial_partner_id:row.commercial_partner_id,
  submitted_at:row.submitted_at,
  reviewed_at:row.reviewed_at,
  reviewed_by:row.reviewed_by
});

export async function listPartnerApplications(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const status=clean(url.searchParams.get('status'),30)||'pending_review';
  if(status!=='all'&&!STATUSES.has(status))return fail(env,400,'invalid_status','Unsupported application status.');
  const rows=status==='all'
    ?await env.SOURCE_AO_DB.prepare('SELECT * FROM partner_applications ORDER BY submitted_at DESC LIMIT 200').all()
    :await env.SOURCE_AO_DB.prepare('SELECT * FROM partner_applications WHERE status=? ORDER BY submitted_at DESC LIMIT 200').bind(status).all();
  return json(env,{ok:true,applications:(rows.results||[]).map(publicRow)});
}

export async function getPartnerApplication(request,env,applicationId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM partner_applications WHERE id=?').bind(applicationId).first();
  if(!row)return fail(env,404,'application_not_found','Partner application not found.');
  if(!env.PII_ENCRYPTION_KEY)return fail(env,503,'privacy_key_unavailable','Secure application access is not configured.');
  const profile=JSON.parse(await decryptPrivateText(row.private_profile_ciphertext,env.PII_ENCRYPTION_KEY));
  return json(env,{ok:true,application:{...publicRow(row),private_profile:profile}});
}

export async function reviewPartnerApplication(request,env,applicationId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM partner_applications WHERE id=?').bind(applicationId).first();
  if(!row)return fail(env,404,'application_not_found','Partner application not found.');
  let input;
  try{input=await request.json()}catch{return fail(env,400,'invalid_json','A JSON body is required.')}
  const action=clean(input?.action,30);
  const reviewer=clean(input?.reviewed_by,120)||'HMATIAS review desk';
  if(!['review','accept','reject'].includes(action))return fail(env,400,'invalid_action','Use review, accept or reject.');
  if(['accepted','rejected'].includes(row.status))return fail(env,409,'application_resolved','Application has already been resolved.');

  if(action==='review'){
    await env.SOURCE_AO_DB.prepare(
      "UPDATE partner_applications SET status='under_review',reviewed_at=CURRENT_TIMESTAMP,reviewed_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(reviewer,applicationId).run();
    return json(env,{ok:true,status:'under_review'});
  }
  if(action==='reject'){
    await env.SOURCE_AO_DB.prepare(
      "UPDATE partner_applications SET status='rejected',reviewed_at=CURRENT_TIMESTAMP,reviewed_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(reviewer,applicationId).run();
    return json(env,{ok:true,status:'rejected'});
  }

  const partnerId='partner_'+crypto.randomUUID().replaceAll('-','').slice(0,24);
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO commercial_partners(
      id,name,country_code,partner_type,relationship_stage,source_channel,locality,website,
      capabilities_json,sectors_json,source_note,last_interaction_at,commercial_priority
    ) VALUES(?,?,?,?, 'under_review','manual',?,?,?,?,CURRENT_TIMESTAMP,3)
    ON CONFLICT(name) DO UPDATE SET
      country_code=excluded.country_code,partner_type=excluded.partner_type,
      locality=excluded.locality,website=excluded.website,
      capabilities_json=excluded.capabilities_json,sectors_json=excluded.sectors_json,
      source_note=excluded.source_note,updated_at=CURRENT_TIMESTAMP
  `).bind(
    partnerId,row.company_name,row.country_code,row.partner_type,row.locality,row.website,
    row.capabilities_json,row.sectors_json,'Source AO partner application '+row.reference
  ).run();
  const partner=await env.SOURCE_AO_DB.prepare('SELECT id FROM commercial_partners WHERE name=?').bind(row.company_name).first();
  await env.SOURCE_AO_DB.prepare(
    "UPDATE partner_applications SET status='accepted',commercial_partner_id=?,reviewed_at=CURRENT_TIMESTAMP,reviewed_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(partner?.id||partnerId,reviewer,applicationId).run();
  return json(env,{ok:true,status:'accepted',commercial_partner_id:partner?.id||partnerId});
}
