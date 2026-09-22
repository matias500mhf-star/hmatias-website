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
function isAdmin(request,env){
  const expected=env.ADMIN_API_TOKEN;
  return Boolean(expected && (request.headers.get('authorization')||'')===`Bearer ${expected}`);
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

function sanitizeString(value,max=300){return String(value??'').trim().slice(0,max);}

export async function createSourcingRequest(request,env){
  const data=await bodyJson(request);
  const requirement=sanitizeString(data.requirement_text||data.item,240);
  const location=sanitizeString(data.location||'Luanda',100);
  const contact=sanitizeString(data.requester_contact||data.contact,180);
  if(requirement.length<2) return fail(env,400,'invalid_requirement','Describe the material, equipment or service required.');
  if(!location) return fail(env,400,'location_required','Location is required.');
  if(contact.length<5) return fail(env,400,'contact_required','A valid WhatsApp, phone or email contact is required.');
  if(!env.PII_ENCRYPTION_KEY) return fail(env,503,'privacy_key_unavailable','Secure request intake is not configured.');

  const requestId=id('sr');
  const reference=publicRef();
  const accessToken=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
  const tokenHash=await sha256Hex(accessToken);
  const encryptedContact=await encryptPrivateText(contact,env.PII_ENCRYPTION_KEY);
  const channel=inferChannel(contact,sanitizeString(data.contact_channel,20).toLowerCase());
  const category=sanitizeString(data.category,100)||null;
  const specification=sanitizeString(data.specification,300)||null;
  const unit=sanitizeString(data.unit,40)||null;
  const neededBy=sanitizeString(data.needed_by,40)||null;
  const quantity=data.quantity==null||data.quantity===''?null:Number(data.quantity);
  if(quantity!=null && (!Number.isFinite(quantity)||quantity<0)) return fail(env,400,'invalid_quantity','Quantity must be a positive number.');
  const normalized=normalizeRequirement([requirement,specification||''].join(' '));
  const now=iso();

  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_requests(
      id,public_ref,access_token_hash,requirement_text,normalized_search,category,specification,
      quantity,unit,location,needed_by,contact_channel,contact_encrypted,contact_hint,status,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    requestId,reference,tokenHash,requirement,normalized,category,specification,quantity,unit,location,
    neededBy,channel,encryptedContact,contactHint(contact),'received',now,now
  ).run();

  return json(env,{ok:true,request:{
    id:requestId,reference,status:'received',location,category,created_at:now,
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
  if((await sha256Hex(token))!==row.access_token_hash) return fail(env,403,'invalid_access_token','Private request token is invalid.');
  return json(env,{ok:true,request:{
    id:row.id,reference:row.public_ref,requirement_text:row.requirement_text,category:row.category,
    specification:row.specification,quantity:row.quantity,unit:row.unit,location:row.location,
    needed_by:row.needed_by,status:row.status,created_at:row.created_at,updated_at:row.updated_at
  }});
}

export async function listSourcingRequests(request,env){
  if(!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const requestedStatus=sanitizeString(url.searchParams.get('status'),30);
  const limit=Math.min(Math.max(Number(url.searchParams.get('limit')||50),1),100);
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
      assigned_to:row.assigned_to,internal_notes:row.internal_notes,created_at:row.created_at,updated_at:row.updated_at
    });
  }
  return json(env,{ok:true,results});
}

export async function updateSourcingRequestStatus(request,env,requestId){
  if(!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const data=await bodyJson(request);
  const status=sanitizeString(data.status,30);
  if(!ALLOWED_STATUSES.has(status)) return fail(env,400,'invalid_status','Unsupported sourcing request status.');
  const existing=await env.SOURCE_AO_DB.prepare('SELECT id FROM sourcing_requests WHERE id=?').bind(requestId).first();
  if(!existing) return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const assigned=sanitizeString(data.assigned_to,100)||null;
  const notes=sanitizeString(data.internal_notes,1000)||null;
  const now=iso();
  await env.SOURCE_AO_DB.prepare(`
    UPDATE sourcing_requests
    SET status=?,assigned_to=COALESCE(?,assigned_to),internal_notes=COALESCE(?,internal_notes),updated_at=?
    WHERE id=?
  `).bind(status,assigned,notes,now,requestId).run();
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
