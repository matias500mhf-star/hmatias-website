const enc = new TextEncoder();
const dec = new TextDecoder();

const ALLOWED_STATUSES = new Set([
  'received','triage','sourcing','verifying','verified','quoted','completed','closed'
]);

function headers(env){
  return {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization'
  };
}

function json(env,data,status=200){return new Response(JSON.stringify(data),{status,headers:headers(env)});}
function fail(env,status,code,message){return json(env,{ok:false,error:{code,message}},status);}
function iso(date=new Date()){return date.toISOString();}
function id(prefix){return `${prefix}_${crypto.randomUUID()}`;}

function secureEqual(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

export function isAdmin(request,env){
  const auth=request.headers.get('authorization')||'';
  const expected=env.ADMIN_API_TOKEN;
  if(expected&&secureEqual(auth,`Bearer ${expected}`)) return true;
  const pilot=env.SOURCE_AO_ENV==='staging'?env.PILOT_ADMIN_API_TOKEN:null;
  return Boolean(pilot)&&secureEqual(auth,`Bearer ${pilot}`);
}

async function bodyJson(request){
  if (!(request.headers.get('content-type')||'').includes('application/json')) throw new Error('JSON body required');
  return request.json();
}

export function normalizeRequirement(value=''){
  return value.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/(\d)\s+(mm|cm|m|kg|g|l|kw|kva|btu)\b/g,'$1$2')
    .replace(/[^a-z0-9]+/g,' ').trim();
}

function strictText(value,max,{required=false,min=0,defaultValue=''}={}){
  const source=value==null?defaultValue:value;
  if(typeof source!=='string'&&typeof source!=='number') return {ok:false,value:''};
  const clean=String(source).trim();
  if(required&&clean.length<Math.max(1,min)) return {ok:false,value:clean};
  if(clean.length>max) return {ok:false,value:clean};
  return {ok:true,value:clean};
}

export function validateSourcingRequestInput(data={}){
  const requirement=strictText(data.requirement_text??data.item,240,{required:true,min:2});
  if(!requirement.ok) return {ok:false,code:'invalid_requirement'};
  const location=strictText(data.location,100,{required:true,min:1,defaultValue:'Luanda'});
  if(!location.ok) return {ok:false,code:'invalid_location'};
  const contact=strictText(data.requester_contact??data.contact,180,{required:true,min:5});
  if(!contact.ok) return {ok:false,code:'invalid_contact'};
  const category=strictText(data.category,100);
  const specification=strictText(data.specification,300);
  const unit=strictText(data.unit,40);
  const neededBy=strictText(data.needed_by,40);
  const requestedChannel=strictText(data.contact_channel,20);
  if(!category.ok||!specification.ok||!unit.ok||!neededBy.ok||!requestedChannel.ok) return {ok:false,code:'field_too_long'};
  const quantity=data.quantity==null||data.quantity===''?null:Number(data.quantity);
  if(quantity!=null&&(!Number.isFinite(quantity)||quantity<0)) return {ok:false,code:'invalid_quantity'};
  return {ok:true,value:{
    requirement:requirement.value,
    location:location.value,
    contact:contact.value,
    category:category.value||null,
    specification:specification.value||null,
    unit:unit.value||null,
    neededBy:neededBy.value||null,
    requestedChannel:requestedChannel.value.toLowerCase(),
    quantity
  }};
}

function bytesToB64Url(bytes){
  let binary='';
  for(const b of bytes) binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function b64UrlToBytes(value){
  const base=value.replace(/-/g,'+').replace(/_/g,'/');
  const padded=base+'='.repeat((4-base.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}

export async function sha256Hex(value){
  const digest=await crypto.subtle.digest('SHA-256',enc.encode(String(value)));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function piiKey(secret){
  if(!secret) throw new Error('PII encryption secret is not configured');
  const material=await crypto.subtle.digest('SHA-256',enc.encode(secret));
  return crypto.subtle.importKey('raw',material,{name:'AES-GCM'},false,['encrypt','decrypt']);
}

export async function encryptPrivateText(value,secret){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await piiKey(secret);
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(String(value)));
  return `${bytesToB64Url(iv)}.${bytesToB64Url(new Uint8Array(cipher))}`;
}

export async function decryptPrivateText(payload,secret){
  const [ivPart,cipherPart]=String(payload||'').split('.');
  if(!ivPart||!cipherPart) throw new Error('Invalid encrypted payload');
  const key=await piiKey(secret);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64UrlToBytes(ivPart)},key,b64UrlToBytes(cipherPart));
  return dec.decode(plain);
}

function contactHint(contact){
  const value=String(contact||'').trim();
  if(value.includes('@')){
    const [name,domain='']=value.split('@');
    return `${(name[0]||'*')}***@${domain}`;
  }
  const digits=value.replace(/\D/g,'');
  if(digits.length>=4) return `••••${digits.slice(-4)}`;
  return 'private';
}

function inferChannel(contact,requested){
  if(['whatsapp','phone','email'].includes(requested)) return requested;
  return String(contact||'').includes('@')?'email':'whatsapp';
}

function publicRef(){
  const d=new Date();
  const stamp=`${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
  const suffix=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase();
  return `SAO-${stamp}-${suffix}`;
}

export async function createSourcingRequest(request,env){
  const data=await bodyJson(request);
  const validated=validateSourcingRequestInput(data);
  if(!validated.ok){
    const messages={
      invalid_requirement:'Describe the material, equipment or service required (max 240 characters).',
      invalid_location:'Location is required and must be under 100 characters.',
      invalid_contact:'A valid WhatsApp, phone or email contact is required (max 180 characters).',
      field_too_long:'One or more optional fields exceed the allowed length.',
      invalid_quantity:'Quantity must be zero or a positive number.'
    };
    return fail(env,400,validated.code,messages[validated.code]||'Invalid sourcing request.');
  }
  if(!env.PII_ENCRYPTION_KEY) return fail(env,503,'privacy_key_unavailable','Secure request intake is not configured.');

  const v=validated.value;
  const requestId=id('sr');
  const reference=publicRef();
  const accessToken=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
  const tokenHash=await sha256Hex(accessToken);
  const encryptedContact=await encryptPrivateText(v.contact,env.PII_ENCRYPTION_KEY);
  const channel=inferChannel(v.contact,v.requestedChannel);
  const normalized=normalizeRequirement([v.requirement,v.specification||''].join(' '));
  const now=iso();

  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_requests(
      id,public_ref,access_token_hash,requirement_text,normalized_search,category,specification,
      quantity,unit,location,needed_by,contact_channel,contact_encrypted,contact_hint,status,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    requestId,reference,tokenHash,v.requirement,normalized,v.category,v.specification,v.quantity,v.unit,v.location,
    v.neededBy,channel,encryptedContact,contactHint(v.contact),'received',now,now
  ).run();

  return json(env,{ok:true,request:{
    id:requestId,reference,status:'received',location:v.location,category:v.category,created_at:now,
    access_token:accessToken,status_path:`/api/sourcing-requests/${requestId}?token=${accessToken}`
  }},201);
}

export async function getSourcingRequest(request,env,requestId){
  const url=new URL(request.url);
  const token=url.searchParams.get('token')||'';
  if(!token) return fail(env,401,'access_token_required','Private request token is required.');
  const row=await env.SOURCE_AO_DB.prepare(`
    SELECT id,public_ref,access_token_hash,requirement_text,category,specification,quantity,unit,location,needed_by,status,created_at,updated_at
    FROM sourcing_requests WHERE id=?
  `).bind(requestId).first();
  if(!row) return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const suppliedHash=await sha256Hex(token);
  if(!secureEqual(suppliedHash,row.access_token_hash)) return fail(env,403,'invalid_access_token','Private request token is invalid.');
  return json(env,{ok:true,request:{
    id:row.id,reference:row.public_ref,requirement_text:row.requirement_text,category:row.category,
    specification:row.specification,quantity:row.quantity,unit:row.unit,location:row.location,
    needed_by:row.needed_by,status:row.status,created_at:row.created_at,updated_at:row.updated_at
  }});
}

export async function listSourcingRequests(request,env){
  if(!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const requestedStatus=String(url.searchParams.get('status')||'').trim();
  if(requestedStatus&&!ALLOWED_STATUSES.has(requestedStatus)) return fail(env,400,'invalid_status','Unsupported sourcing request status.');
  const rawLimit=Number(url.searchParams.get('limit')||50);
  const limit=Number.isFinite(rawLimit)?Math.min(Math.max(Math.trunc(rawLimit),1),100):50;
  const stmt=requestedStatus
    ? env.SOURCE_AO_DB.prepare(`SELECT * FROM sourcing_requests WHERE status=? ORDER BY created_at DESC LIMIT ?`).bind(requestedStatus,limit)
    : env.SOURCE_AO_DB.prepare(`SELECT * FROM sourcing_requests ORDER BY created_at DESC LIMIT ?`).bind(limit);
  const rows=await stmt.all();
  const results=[];
  for(const row of rows.results||[]){
    let contact=null;
    try{contact=await decryptPrivateText(row.contact_encrypted,env.PII_ENCRYPTION_KEY);}catch{contact=null;}
    results.push({
      id:row.id,reference:row.public_ref,requirement_text:row.requirement_text,normalized_search:row.normalized_search,
      category:row.category,specification:row.specification,quantity:row.quantity,unit:row.unit,location:row.location,
      needed_by:row.needed_by,contact_channel:row.contact_channel,contact,contact_hint:row.contact_hint,status:row.status,
      assigned_to:row.assigned_to,internal_notes:row.internal_notes,contact_purged_at:row.contact_purged_at||null,
      created_at:row.created_at,updated_at:row.updated_at
    });
  }
  return json(env,{ok:true,results});
}

export async function updateSourcingRequestStatus(request,env,requestId){
  if(!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const data=await bodyJson(request);
  if(typeof data.status!=='string') return fail(env,400,'invalid_status','Unsupported sourcing request status.');
  const status=data.status.trim();
  if(!ALLOWED_STATUSES.has(status)) return fail(env,400,'invalid_status','Unsupported sourcing request status.');
  const assigned=strictText(data.assigned_to,100);
  const notes=strictText(data.internal_notes,1000);
  if(!assigned.ok||!notes.ok) return fail(env,400,'field_too_long','Assignment or notes exceed the allowed length.');
  const existing=await env.SOURCE_AO_DB.prepare('SELECT id FROM sourcing_requests WHERE id=?').bind(requestId).first();
  if(!existing) return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const now=iso();
  await env.SOURCE_AO_DB.prepare(`
    UPDATE sourcing_requests
    SET status=?,assigned_to=COALESCE(?,assigned_to),internal_notes=COALESCE(?,internal_notes),updated_at=?
    WHERE id=?
  `).bind(status,assigned.value||null,notes.value||null,now,requestId).run();
  return json(env,{ok:true,request:{id:requestId,status,updated_at:now}});
}

export async function demandRadar(request,env){
  if(!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const rows=await env.SOURCE_AO_DB.prepare(`
    SELECT normalized_search,COALESCE(category,'Unclassified') category,
           COUNT(*) request_count,MAX(created_at) last_requested_at,
           GROUP_CONCAT(DISTINCT location) locations
    FROM sourcing_requests
    WHERE created_at>=datetime('now','-30 days') AND status!='closed'
    GROUP BY normalized_search,COALESCE(category,'Unclassified')
    ORDER BY request_count DESC,last_requested_at DESC
    LIMIT 50
  `).all();
  return json(env,{ok:true,window_days:30,results:rows.results||[]});
}
