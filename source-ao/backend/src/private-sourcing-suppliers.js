import {
  isAdmin,
  encryptPrivateText,
  decryptPrivateText,
  normalizeRequirement
} from './sourcing.js';

const COUNTRIES=new Set(['AO','NA','ZA']);
const CHANNELS=new Set(['formal','informal','regional']);
const ROLES=new Set(['manufacturer','distributor','representative','supplier','trader','market_vendor','technical_supplier']);
const QUALITY=new Set(['unverified','source_checked','documented','sample_verified','approved']);
const AVAILABILITY=new Set(['unknown','on_request','confirmed','unavailable']);

const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
}});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);

const clean=(value,max=500)=>{
  if(value==null)return null;
  const valueText=String(value).trim();
  if(!valueText)return null;
  if(valueText.length>max)throw new Error('value_too_long');
  return valueText;
};

const array=(value,max=40)=>Array.isArray(value)
  ?[...new Set(value.map(v=>clean(v,120)).filter(Boolean))].slice(0,max)
  :[];

const safeUrl=value=>{
  if(!value)return null;
  try{
    const u=new URL(value);
    return ['http:','https:'].includes(u.protocol)?u.toString():null;
  }catch{return null}
};

function contactHint(data={}){
  if(data.contact_name)return 'named contact';
  const value=String(data.email||data.phone||data.whatsapp||'').trim();
  if(value.includes('@')){
    const parts=value.split('@');
    return parts[1]?'private@'+parts[1]:'private email';
  }
  const digits=value.replace(/\D/g,'');
  return digits.length>=4?'••••'+digits.slice(-4):'private';
}

function hydrate(row){
  return {
    id:row.id,
    name:row.name,
    country_code:row.country_code,
    market_channel:row.market_channel,
    supplier_role:row.supplier_role,
    location:row.location,
    website:row.website,
    capabilities:JSON.parse(row.capabilities_json||'[]'),
    brands:JSON.parse(row.brands_json||'[]'),
    quality_status:row.quality_status,
    quality_evidence:JSON.parse(row.quality_evidence_json||'[]'),
    availability_status:row.availability_status,
    contact_hint:row.contact_hint,
    internal_notes:row.internal_notes,
    confidentiality:'private',
    last_verified_at:row.last_verified_at,
    updated_at:row.updated_at
  };
}

export function supplierQualityRisk(supplier={}){
  const quality=String(supplier.quality_status||'unverified');
  const market=String(supplier.market_channel||'formal');
  let score={approved:90,sample_verified:80,documented:68,source_checked:52,unverified:25}[quality]||25;
  const flags=[];
  if(market==='informal'){
    score-=12;
    flags.push('informal_market_requires_material_verification');
  }
  if(String(supplier.availability_status||'unknown')==='confirmed')score+=5;
  if(String(supplier.availability_status||'unknown')==='unavailable')score-=35;
  if(!Array.isArray(supplier.quality_evidence)||supplier.quality_evidence.length===0){
    score-=8;
    flags.push('quality_evidence_missing');
  }
  return {score:Math.max(0,Math.min(100,score)),flags};
}

export function scorePrivateSupplierMatch(requirement='',supplier={}){
  const query=normalizeRequirement(requirement);
  const tokens=new Set(query.split(' ').filter(x=>x.length>=3));
  const hay=normalizeRequirement([
    supplier.name,
    supplier.supplier_role,
    ...(supplier.capabilities||[]),
    ...(supplier.brands||[])
  ].filter(Boolean).join(' '));
  let hits=0;
  for(const token of tokens)if(hay.includes(token))hits++;
  const quality=supplierQualityRisk(supplier);
  const capabilityScore=tokens.size?Math.min(60,Math.round((hits/tokens.size)*60)):0;
  const marketBonus=supplier.country_code==='AO'?8:5;
  return {
    match_score:Math.max(0,Math.min(100,capabilityScore+Math.round(quality.score*.32)+marketBonus)),
    quality_score:quality.score,
    risk_flags:quality.flags,
    matched_terms:hits
  };
}

export async function listPrivateSourcingSuppliers(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const q=clean(url.searchParams.get('q'),240);
  const country=String(url.searchParams.get('country')||'').toUpperCase();
  const where=[],params=[];
  if(country){
    if(!COUNTRIES.has(country))return fail(env,400,'invalid_country','Unsupported country.');
    where.push('country_code=?');params.push(country);
  }
  const rows=await env.SOURCE_AO_DB.prepare(
    'SELECT * FROM private_sourcing_suppliers'+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY quality_status DESC,updated_at DESC LIMIT 200'
  ).bind(...params).all();
  let suppliers=(rows.results||[]).map(hydrate);
  if(q){
    suppliers=suppliers
      .map(s=>({...s,...scorePrivateSupplierMatch(q,s)}))
      .filter(s=>s.match_score>=20)
      .sort((a,b)=>b.match_score-a.match_score||b.quality_score-a.quality_score);
  }
  return json(env,{ok:true,confidential:true,suppliers});
}

export async function getPrivateSourcingSupplierContact(request,env,id){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const row=await env.SOURCE_AO_DB.prepare(
    'SELECT id,name,private_contact_encrypted,contact_hint FROM private_sourcing_suppliers WHERE id=?'
  ).bind(id).first();
  if(!row)return fail(env,404,'supplier_not_found','Private supplier does not exist.');
  let contact=null;
  if(row.private_contact_encrypted){
    try{
      contact=JSON.parse(await decryptPrivateText(row.private_contact_encrypted,env.PII_ENCRYPTION_KEY));
    }catch{
      return fail(env,503,'private_contact_unavailable','Private supplier contact could not be decrypted.');
    }
  }
  return json(env,{ok:true,confidential:true,supplier:{id:row.id,name:row.name,contact_hint:row.contact_hint,contact}});
}

export async function upsertPrivateSourcingSupplier(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  if(!env.PII_ENCRYPTION_KEY)return fail(env,503,'privacy_key_unavailable','Secure supplier storage is not configured.');
  let input;
  try{input=await request.json()}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  let name,country,channel,role,location,website,quality,availability,notes,lastVerified;
  try{
    name=clean(input?.name,220);
    country=String(input?.country_code||'AO').toUpperCase();
    channel=clean(input?.market_channel,30)||'formal';
    role=clean(input?.supplier_role,40)||'supplier';
    location=clean(input?.location,180);
    website=clean(input?.website,600);
    quality=clean(input?.quality_status,30)||'unverified';
    availability=clean(input?.availability_status,30)||'unknown';
    notes=clean(input?.internal_notes,1200);
    lastVerified=clean(input?.last_verified_at,80);
  }catch{return fail(env,400,'invalid_fields','Supplier fields are invalid.');}
  if(!name||!COUNTRIES.has(country)||!CHANNELS.has(channel)||!ROLES.has(role)||!QUALITY.has(quality)||!AVAILABILITY.has(availability)){
    return fail(env,400,'invalid_fields','Supplier name, market, role, quality and availability are invalid.');
  }
  if(website&&!safeUrl(website))return fail(env,400,'invalid_website','Website must use HTTP or HTTPS.');
  const capabilities=array(input?.capabilities,50);
  const brands=array(input?.brands,30);
  const evidence=array(input?.quality_evidence,30);
  const contact=input?.private_contact&&typeof input.private_contact==='object'?input.private_contact:null;
  const encrypted=contact?await encryptPrivateText(JSON.stringify(contact),env.PII_ENCRYPTION_KEY):null;
  const hint=contact?contactHint(contact):null;
  const supplierId=clean(input?.id,120)||'ps_'+crypto.randomUUID().replaceAll('-','').slice(0,24);

  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO private_sourcing_suppliers(
      id,name,country_code,market_channel,supplier_role,location,website,capabilities_json,brands_json,
      quality_status,quality_evidence_json,availability_status,private_contact_encrypted,contact_hint,
      internal_notes,last_verified_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,country_code=excluded.country_code,market_channel=excluded.market_channel,
      supplier_role=excluded.supplier_role,location=excluded.location,website=excluded.website,
      capabilities_json=excluded.capabilities_json,brands_json=excluded.brands_json,
      quality_status=excluded.quality_status,quality_evidence_json=excluded.quality_evidence_json,
      availability_status=excluded.availability_status,
      private_contact_encrypted=COALESCE(excluded.private_contact_encrypted,private_sourcing_suppliers.private_contact_encrypted),
      contact_hint=COALESCE(excluded.contact_hint,private_sourcing_suppliers.contact_hint),
      internal_notes=excluded.internal_notes,last_verified_at=excluded.last_verified_at,updated_at=CURRENT_TIMESTAMP
  `).bind(
    supplierId,name,country,channel,role,location,safeUrl(website),JSON.stringify(capabilities),JSON.stringify(brands),
    quality,JSON.stringify(evidence),availability,encrypted,hint,notes,lastVerified
  ).run();

  const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM private_sourcing_suppliers WHERE id=?').bind(supplierId).first();
  return json(env,{ok:true,confidential:true,supplier:hydrate(row)},201);
}
