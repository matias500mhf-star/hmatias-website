const PUBLIC_STATUSES = new Set(['source_checked','recently_seen','supplier_confirmed','in_stock_confirmed','needs_reconfirmation','unavailable']);

export function normalizeSearch(value='') {
  return value.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/(\d)\s+(mm|cm|m|kg|g|l|kw|kva|btu)\b/g,'$1$2')
    .replace(/[^a-z0-9]+/g,' ').trim();
}

export function effectiveObservationStatus(row, now=Date.now()) {
  if (!row) return 'discovered';
  if (row.verification_status === 'unavailable') return 'unavailable';
  if (!row.expires_at || new Date(row.expires_at).getTime() <= now) return 'needs_reconfirmation';
  return PUBLIC_STATUSES.has(row.verification_status) ? row.verification_status : 'discovered';
}

export function canAcceptSupplierResponse(row) {
  return Boolean(row && row.status === 'sent' && !row.supplier_response_json);
}

function optionalText(value,max) {
  if (value==null || value==='') return {ok:true,value:null};
  if (typeof value!=='string') return {ok:false};
  const clean=value.trim();
  if (!clean) return {ok:true,value:null};
  if (clean.length>max) return {ok:false};
  return {ok:true,value:clean};
}

function optionalNonNegativeNumber(value) {
  if (value==null) return {ok:true,value:null};
  if (typeof value!=='number' || !Number.isFinite(value) || value<0) return {ok:false};
  return {ok:true,value};
}

export function normalizeSupplierResponse(data={}) {
  if (typeof data.available!=='boolean') return {ok:false,code:'missing_availability'};
  const quantity=optionalNonNegativeNumber(data.quantity_reported);
  if (!quantity.ok) return {ok:false,code:'invalid_quantity'};
  const price=optionalNonNegativeNumber(data.price_reported);
  if (!price.ok) return {ok:false,code:'invalid_price'};
  const lead=optionalText(data.lead_time,120);
  if (!lead.ok) return {ok:false,code:'invalid_lead_time'};
  const note=optionalText(data.note,600);
  if (!note.ok) return {ok:false,code:'invalid_note'};
  const respondedBy=optionalText(data.responded_by,120);
  if (!respondedBy.ok) return {ok:false,code:'invalid_responded_by'};
  let currency=null;
  if (price.value!=null) {
    if (typeof data.currency!=='string' || !/^[A-Za-z]{3}$/.test(data.currency.trim())) return {ok:false,code:'currency_required'};
    currency=data.currency.trim().toUpperCase();
  }
  return {ok:true,value:{
    available:data.available,
    quantity_reported:quantity.value,
    price_reported:price.value,
    currency,
    lead_time:lead.value,
    note:note.value,
    responded_by:respondedBy.value
  }};
}

const enc = new TextEncoder();

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(signature)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export async function createConfirmationToken(id, expiresAt, secret) {
  if (!id || !expiresAt || !secret) throw new Error('Missing confirmation token input');
  return hmacHex(secret, `${id}.${expiresAt}`);
}

export async function verifyConfirmationToken(id, expiresAt, token, secret) {
  if (!id || !expiresAt || !token || !secret) return false;
  if (new Date(expiresAt).getTime() <= Date.now()) return false;
  const expected = await createConfirmationToken(id,expiresAt,secret);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i=0;i<expected.length;i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

function secureEqual(a,b) {
  if (typeof a!=='string' || typeof b!=='string' || a.length!==b.length) return false;
  let diff=0;
  for (let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

function responseHeaders(env) {
  return {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin': env.PUBLIC_ORIGIN || 'https://comercialhmatiasps.com',
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type,authorization'
  };
}

function json(env, data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:responseHeaders(env)});
}

function fail(env, status, code, message) {
  return json(env, {ok:false,error:{code,message}}, status);
}

async function bodyJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('JSON body required');
  return request.json();
}

export function isAdmin(request, env) {
  const auth = request.headers.get('authorization') || '';
  const expected = env.ADMIN_API_TOKEN;
  if (expected && secureEqual(auth,`Bearer ${expected}`)) return true;
  const pilot = env.SOURCE_AO_ENV === 'staging' ? env.PILOT_ADMIN_API_TOKEN : null;
  return Boolean(pilot) && secureEqual(auth,`Bearer ${pilot}`);
}

const id = prefix => `${prefix}_${crypto.randomUUID()}`;
const iso = (date=new Date()) => date.toISOString();
const plusHours = hours => iso(new Date(Date.now()+hours*3600000));

async function publicSearch(request, env) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('q') || '').trim();
  const location = (url.searchParams.get('location') || 'Luanda').trim();
  if (raw.length < 2 || raw.length>180) return fail(env,400,'invalid_query','Search query must contain 2 to 180 characters.');
  if (location.length>120) return fail(env,400,'invalid_location','Location is too long.');
  const q = normalizeSearch(raw);
  const like = `%${q}%`;
  const now = iso();
  const locationLike = `%${normalizeSearch(location)}%`;

  const itemRows = await env.SOURCE_AO_DB.prepare(`
    SELECT i.id item_id,i.name item_name,i.category,i.specification,i.unit,
           s.id supplier_id,s.name supplier_name,s.location supplier_location,s.website supplier_website,
           o.id observation_id,o.verification_status,o.quantity_reported,o.price_reported,o.currency,
           o.location observation_location,o.verified_at,o.expires_at
    FROM items i
    LEFT JOIN observations o ON o.item_id=i.id AND o.approved_at IS NOT NULL AND o.expires_at>?
    LEFT JOIN suppliers s ON s.id=o.supplier_id
    WHERE i.search_text LIKE ?
      AND (?='angola' OR o.id IS NULL OR lower(coalesce(o.location,s.location,'')) LIKE ?)
    ORDER BY CASE o.verification_status WHEN 'in_stock_confirmed' THEN 1 WHEN 'supplier_confirmed' THEN 2 WHEN 'source_checked' THEN 3 ELSE 9 END,
             o.verified_at DESC
    LIMIT 12
  `).bind(now,like,normalizeSearch(location),locationLike).all();

  const serviceRows = await env.SOURCE_AO_DB.prepare(`
    SELECT id,name,service_category,specialties_json,location,website,verification_status,last_verified_at
    FROM service_providers
    WHERE search_text LIKE ? AND (?='angola' OR lower(location) LIKE ?)
    ORDER BY last_verified_at DESC LIMIT 8
  `).bind(like,normalizeSearch(location),locationLike).all();

  const items = (itemRows.results || []).map(r=>({
    type:'item',id:r.item_id,name:r.item_name,category:r.category,specification:r.specification,unit:r.unit,
    supplier:r.supplier_id?{id:r.supplier_id,name:r.supplier_name,location:r.supplier_location,website:r.supplier_website}:null,
    status:r.observation_id?effectiveObservationStatus(r):'discovered',
    verified_at:r.verified_at||null,expires_at:r.expires_at||null,
    quantity_reported:r.quantity_reported??null,
    price:r.price_reported==null?null:{amount:r.price_reported,currency:r.currency}
  }));

  const services = (serviceRows.results || []).map(r=>{
    const ageHours=(Date.now()-new Date(r.last_verified_at).getTime())/36e5;
    return {type:'service',id:r.id,name:r.name,category:r.service_category,location:r.location,website:r.website,
      specialties:JSON.parse(r.specialties_json||'[]'),status:ageHours<=168?r.verification_status:'needs_reconfirmation',verified_at:r.last_verified_at};
  });

  return json(env,{ok:true,query:raw,normalized_query:q,location,results:[...items,...services]});
}

async function publicOpportunities(request, env) {
  const rows = await env.SOURCE_AO_DB.prepare(`
    SELECT id,title,type,sector,location,issuer,reference,published_at,deadline,source_url,source_checked_at,scope_summary,source_fit,fit_score,fit_tags_json
    FROM opportunities WHERE status='active' AND deadline>? ORDER BY deadline ASC LIMIT 30
  `).bind(iso()).all();
  return json(env,{ok:true,results:rows.results||[]});
}

async function createVerificationRequest(request, env) {
  if (!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const data = await bodyJson(request);
  if (typeof data.supplier_id!=='string' || typeof data.requirement_text!=='string' || typeof data.location!=='string') return fail(env,400,'missing_fields','supplier_id, requirement_text and location are required.');
  const supplierId=data.supplier_id.trim();
  const requirement=data.requirement_text.trim();
  const location=data.location.trim();
  if (!supplierId || !requirement || !location || requirement.length>240 || location.length>120) return fail(env,400,'invalid_fields','Verification request fields are invalid or too long.');
  const specification=optionalText(data.specification,500);
  const unit=optionalText(data.unit,40);
  const quantity=optionalNonNegativeNumber(data.quantity);
  if (!specification.ok || !unit.ok || !quantity.ok) return fail(env,400,'invalid_fields','Specification, quantity or unit is invalid.');
  const supplier = await env.SOURCE_AO_DB.prepare('SELECT id,name FROM suppliers WHERE id=?').bind(supplierId).first();
  if (!supplier) return fail(env,404,'supplier_not_found','Supplier does not exist.');
  if (data.item_id) {
    const item = await env.SOURCE_AO_DB.prepare('SELECT id FROM items WHERE id=?').bind(data.item_id).first();
    if (!item) return fail(env,404,'item_not_found','Item does not exist.');
  }
  const requestId=id('vr');
  const expiresAt=plusHours(48);
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO verification_requests(id,supplier_id,item_id,requirement_text,specification,quantity,unit,location,status,requested_at,expires_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)
  `).bind(requestId,supplierId,data.item_id||null,requirement,specification.value,quantity.value,unit.value,location,'sent',iso(),expiresAt).run();
  const token=await createConfirmationToken(requestId,expiresAt,env.CONFIRMATION_SECRET);
  return json(env,{ok:true,verification_request:{id:requestId,supplier_name:supplier.name,status:'sent',expires_at:expiresAt,confirmation_path:`/api/confirm/${requestId}?token=${token}`}},201);
}

async function listVerificationRequests(request, env) {
  if (!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const status=url.searchParams.get('status');
  const allowed=new Set(['draft','sent','supplier_responded','approved','expired','rejected']);
  if (status && !allowed.has(status)) return fail(env,400,'invalid_status','Unsupported verification status.');
  const stmt=status
    ? env.SOURCE_AO_DB.prepare(`SELECT vr.*,s.name supplier_name FROM verification_requests vr JOIN suppliers s ON s.id=vr.supplier_id WHERE vr.status=? ORDER BY vr.created_at DESC LIMIT 100`).bind(status)
    : env.SOURCE_AO_DB.prepare(`SELECT vr.*,s.name supplier_name FROM verification_requests vr JOIN suppliers s ON s.id=vr.supplier_id ORDER BY vr.created_at DESC LIMIT 100`);
  const rows=await stmt.all();
  return json(env,{ok:true,results:rows.results||[]});
}

async function listCatalogItems(request, env) {
  if (!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const raw=(url.searchParams.get('q')||'').trim();
  if (raw.length>180) return fail(env,400,'invalid_query','Catalog query is too long.');
  const q=normalizeSearch(raw);
  const stmt=q
    ? env.SOURCE_AO_DB.prepare(`SELECT id,name,category,specification,unit FROM items WHERE search_text LIKE ? ORDER BY name ASC LIMIT 50`).bind(`%${q}%`)
    : env.SOURCE_AO_DB.prepare(`SELECT id,name,category,specification,unit FROM items ORDER BY name ASC LIMIT 50`);
  const rows=await stmt.all();
  return json(env,{ok:true,results:rows.results||[]});
}

async function supplierConfirmation(request, env, requestId) {
  const url=new URL(request.url);
  const token=url.searchParams.get('token')||'';
  const row=await env.SOURCE_AO_DB.prepare(`
    SELECT vr.*,s.name supplier_name,i.name item_name
    FROM verification_requests vr JOIN suppliers s ON s.id=vr.supplier_id
    LEFT JOIN items i ON i.id=vr.item_id WHERE vr.id=?
  `).bind(requestId).first();
  if (!row) return fail(env,404,'request_not_found','Verification request does not exist.');
  if (!await verifyConfirmationToken(requestId,row.expires_at,token,env.CONFIRMATION_SECRET)) return fail(env,403,'invalid_or_expired_link','Confirmation link is invalid or expired.');

  if (request.method==='GET') {
    return json(env,{ok:true,verification_request:{id:row.id,supplier_name:row.supplier_name,item_name:row.item_name,requirement_text:row.requirement_text,specification:row.specification,quantity:row.quantity,unit:row.unit,location:row.location,expires_at:row.expires_at,status:row.status}});
  }

  if (!canAcceptSupplierResponse(row)) return fail(env,409,'response_already_recorded','This verification request already has a supplier response or has been reviewed.');
  const data=await bodyJson(request);
  const normalized=normalizeSupplierResponse(data);
  if (!normalized.ok) return fail(env,400,normalized.code,'Supplier response failed server-side validation.');
  const response=normalized.value;
  const written=await env.SOURCE_AO_DB.prepare(`
    UPDATE verification_requests
    SET supplier_response_json=?,responded_at=?,status='supplier_responded',updated_at=?
    WHERE id=? AND status='sent' AND supplier_response_json IS NULL
  `).bind(JSON.stringify(response),iso(),iso(),requestId).run();
  if ((written.meta?.changes ?? 0) !== 1) return fail(env,409,'response_already_recorded','This verification request was already answered.');
  return json(env,{ok:true,status:'supplier_responded',message:'Response recorded for HMATIAS review.'});
}

async function approveVerification(request, env, requestId) {
  if (!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const data=await bodyJson(request);
  const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM verification_requests WHERE id=?').bind(requestId).first();
  if (!row) return fail(env,404,'request_not_found','Verification request does not exist.');
  if (row.status==='approved') return fail(env,409,'already_approved','Verification request is already approved.');
  if (!row.supplier_response_json || row.status!=='supplier_responded') return fail(env,409,'no_supplier_response','A pending supplier response must exist before approval.');
  const itemId=data.item_id||row.item_id;
  if (!itemId || typeof itemId!=='string') return fail(env,400,'item_required','A normalized item_id is required before approval.');
  const reviewer=typeof data.reviewer==='string'&&data.reviewer.trim()?data.reviewer.trim():'HMATIAS review';
  if (reviewer.length>80) return fail(env,400,'invalid_reviewer','Reviewer name is too long.');
  const item=await env.SOURCE_AO_DB.prepare('SELECT id FROM items WHERE id=?').bind(itemId).first();
  if (!item) return fail(env,404,'item_not_found','Normalized item does not exist.');
  const sr=JSON.parse(row.supplier_response_json);
  let status='unavailable';
  let expiryHours=24;
  if (sr.available===true && sr.quantity_reported!=null) status='in_stock_confirmed';
  else if (sr.available===true) {status='supplier_confirmed';expiryHours=72;}
  const observationId=id('obs');
  const now=iso();
  const expires=plusHours(expiryHours);
  await env.SOURCE_AO_DB.batch([
    env.SOURCE_AO_DB.prepare(`INSERT INTO observations(id,supplier_id,item_id,verification_request_id,observed_at,verified_at,source_type,verification_status,quantity_reported,price_reported,currency,location,evidence_reference,expires_at,approved_at,approved_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(observationId,row.supplier_id,itemId,row.id,row.responded_at||now,now,'direct_supplier_confirmation',status,sr.quantity_reported,sr.price_reported,sr.currency,row.location,`verification_request:${row.id}`,expires,now,reviewer),
    env.SOURCE_AO_DB.prepare(`UPDATE verification_requests SET status='approved',reviewed_at=?,reviewed_by=?,updated_at=? WHERE id=? AND status='supplier_responded'`).bind(now,reviewer,now,row.id)
  ]);
  return json(env,{ok:true,observation:{id:observationId,verification_status:status,verified_at:now,expires_at:expires}});
}

async function createCatalogItem(request, env) {
  if (!isAdmin(request,env)) return fail(env,401,'unauthorized','Admin authorization required.');
  const data=await bodyJson(request);
  if (typeof data.name!=='string' || typeof data.category!=='string') return fail(env,400,'missing_fields','name and category are required.');
  const name=data.name.trim();
  const category=data.category.trim();
  if (!name || !category || name.length>160 || category.length>100) return fail(env,400,'invalid_fields','Catalog name or category is invalid.');
  const specification=optionalText(data.specification,240);
  const unit=optionalText(data.unit,40);
  if (!specification.ok || !unit.ok) return fail(env,400,'invalid_fields','Catalog specification or unit is invalid.');
  const aliases=Array.isArray(data.aliases)?data.aliases.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean).slice(0,20):[];
  if (aliases.some(x=>x.length>120)) return fail(env,400,'invalid_alias','Catalog alias is too long.');
  const itemId=data.id||id('item');
  const searchText=normalizeSearch([name,specification.value||'',...aliases].join(' '));
  await env.SOURCE_AO_DB.prepare(`INSERT INTO items(id,name,category,specification,unit,aliases_json,search_text) VALUES(?,?,?,?,?,?,?)`)
    .bind(itemId,name,category,specification.value,unit.value,JSON.stringify(aliases),searchText).run();
  return json(env,{ok:true,item:{id:itemId,name,category}},201);
}

export default {
  async fetch(request, env) {
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers:responseHeaders(env)});
    const url=new URL(request.url);
    try {
      if (request.method==='GET' && url.pathname==='/health') return json(env,{ok:true,service:'source-ao-api',time:iso()});
      if (request.method==='GET' && url.pathname==='/api/search') return publicSearch(request,env);
      if (request.method==='GET' && url.pathname==='/api/opportunities') return publicOpportunities(request,env);
      if (url.pathname==='/api/admin/verification-requests' && request.method==='POST') return createVerificationRequest(request,env);
      if (url.pathname==='/api/admin/verification-requests' && request.method==='GET') return listVerificationRequests(request,env);
      if (url.pathname==='/api/admin/items' && request.method==='GET') return listCatalogItems(request,env);
      if (url.pathname==='/api/admin/items' && request.method==='POST') return createCatalogItem(request,env);
      const confirm=url.pathname.match(/^\/api\/confirm\/([^/]+)$/);
      if (confirm && ['GET','POST'].includes(request.method)) return supplierConfirmation(request,env,confirm[1]);
      const approve=url.pathname.match(/^\/api\/admin\/verification\/([^/]+)\/approve$/);
      if (approve && request.method==='POST') return approveVerification(request,env,approve[1]);
      return fail(env,404,'not_found','Route not found.');
    } catch (error) {
      console.error('Source AO API error',error);
      return fail(env,500,'internal_error','Unexpected server error.');
    }
  }
};