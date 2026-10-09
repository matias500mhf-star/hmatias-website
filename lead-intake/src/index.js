/* HMATIAS private lead intake. Deploy separately as a Cloudflare Worker (not GitHub Pages).
 * Requires D1, Turnstile, and a private rate-limit salt. Never put tokens in browser code.
 */
const ORIGINS=new Set(['https://comercialhmatiasps.com','https://www.comercialhmatiasps.com']);
const TYPES=new Set(['contact','business','appointment']);
const max=(value,length)=>String(value??'').trim().slice(0,length);
function json(body,status=200,origin=''){
  const h={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','vary':'Origin'};
  if(ORIGINS.has(origin))h['access-control-allow-origin']=origin;
  return new Response(JSON.stringify(body),{status,headers:h});
}
function cleanInput(data){
  const d=Object(data)===data?data:{};
  const output={
    nonce:max(d.nonce,90),kind:max(d.kind,25),name:max(d.name,120),
    company:max(d.company,160),email:max(d.email,200).toLowerCase(),
    phone:max(d.phone,60),service:max(d.service,180),
    location:max(d.location,160),details:max(d.details,2400),
    consent:d.consent===true,token:max(d.turnstileToken,2048)
  };
  if(!TYPES.has(output.kind)||output.name.length<2||output.phone.length<6||
     output.service.length<2||output.details.length<5||!output.consent||
     !/^[a-zA-Z0-9_-]{18,90}$/.test(output.nonce)||
     (output.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email))){
    return null;
  }
  return output;
}
async function sha256(str){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function turnstileVerify(token,secret,ip){
  if(!token||!secret)return false;
  const payload=new URLSearchParams({secret,response:token});
  if(ip)payload.set('remoteip',ip);
  const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'POST',body:payload,headers:{'content-type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(8000)
  });
  if(!r.ok)return false;
  const j=await r.json();
  return j.success===true&&(!j.hostname||['comercialhmatiasps.com','www.comercialhmatiasps.com'].includes(j.hostname));
}
async function limit(db,ip,salt){
  const hour=new Date().toISOString().slice(0,13);
  const key=await sha256(hour+'|'+ip+'|'+salt);
  await db.prepare("INSERT INTO hourly_rate(rate_key,count,created_at) VALUES(?,1,datetime('now')) ON CONFLICT(rate_key) DO UPDATE SET count=count+1").bind(key).run();
  const row=await db.prepare('SELECT count FROM hourly_rate WHERE rate_key=?').bind(key).first();
  return Number(row?.count||0)<=12;
}
async function hubspotSync(env,lead){
  if(!env.HUBSPOT_PORTAL_ID||!env.HUBSPOT_FORM_GUID||!lead.email)return 'skipped';
  const chunks=lead.name.trim().split(/\s+/),first=chunks.shift(),last=chunks.join(' ')||'-';
  const fields=[
    {name:'email',value:lead.email},{name:'firstname',value:first},{name:'lastname',value:last},
    {name:'phone',value:lead.phone},{name:'company',value:lead.company||''}
  ];
  if(env.HUBSPOT_MESSAGE_FIELD)fields.push({name:String(env.HUBSPOT_MESSAGE_FIELD),value:'['+lead.reference+'] '+lead.service+' - '+lead.details});
  const url='https://api.hsforms.com/submissions/v3/integration/submit/'+encodeURIComponent(env.HUBSPOT_PORTAL_ID)+'/'+encodeURIComponent(env.HUBSPOT_FORM_GUID);
  const r=await fetch(url,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({fields,context:{pageUri:'https://comercialhmatiasps.com/',pageName:'HMATIAS website lead'},
      legalConsentOptions:{consent:{consentToProcess:true,text:'Autorizo o tratamento dos dados do pedido para contacto e prestação de informação comercial.',communications:[]}}}),
    signal:AbortSignal.timeout(9000)
  });
  if(!r.ok)throw new Error('CRM form submission not accepted');
  return 'synced';
}
async function emailSend(env,to,subject,body){
  if(!env.RESEND_API_KEY||!env.RESEND_FROM||!to)return 'skipped';
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},
    body:JSON.stringify({from:env.RESEND_FROM,to:[to],subject,text:body}),
    signal:AbortSignal.timeout(9000)
  });
  if(!r.ok)throw new Error('Email service did not accept the message');
  return 'sent';
}
async function deliver(env,lead){
  const db=env.LEADS_DB;
  let crm=lead.crm_status,alert=lead.alert_status,receipt=lead.receipt_status;
  if(crm==='pending'&&env.HUBSPOT_PORTAL_ID&&env.HUBSPOT_FORM_GUID&&lead.email){
    try{crm=await hubspotSync(env,lead);await db.prepare('UPDATE leads SET crm_status=? WHERE reference=?').bind(crm,lead.reference).run();}catch(_){}
  }
  if(alert==='pending'&&env.LEADS_NOTIFY_TO&&env.RESEND_FROM&&env.RESEND_API_KEY){
    try{
      alert=await emailSend(env,env.LEADS_NOTIFY_TO,'Novo pedido HMATIAS '+lead.reference,
        'Referência: '+lead.reference+'\nTipo: '+lead.kind+'\nNome: '+lead.name+'\nEmpresa: '+lead.company+'\nTelefone: '+lead.phone+'\nE-mail: '+lead.email+'\nServiço: '+lead.service+'\nLocalização: '+lead.location+'\n\nPedido:\n'+lead.details);
      await db.prepare('UPDATE leads SET alert_status=? WHERE reference=?').bind(alert,lead.reference).run();
    }catch(_){}
  }
  if(receipt==='pending'&&lead.email&&env.RESEND_FROM&&env.RESEND_API_KEY){
    try{
      receipt=await emailSend(env,lead.email,'HMATIAS - receção do pedido '+lead.reference,
        'Confirmamos o registo do seu pedido na HMATIAS.\nReferência: '+lead.reference+'\nServiço: '+lead.service+'\n\nEste comprovativo não constitui uma cotação, confirmação de stock, adjudicação ou marcação. A equipa analisará a necessidade e responderá pelo contacto indicado.\n\nHMATIAS - Prestação de Serviços, SU, Lda.\ngeral@comercialhmatiasps.com');
      await db.prepare('UPDATE leads SET receipt_status=? WHERE reference=?').bind(receipt,lead.reference).run();
    }catch(_){}
  }
}
async function lookupByNonce(db,nonce){
  return db.prepare('SELECT * FROM leads WHERE nonce=?').bind(nonce).first();
}
async function insertLead(db,lead){
  await db.prepare('INSERT INTO leads(reference,nonce,created_at,kind,full_name,company,email,phone,service,location,details,consent_at) VALUES(?,?,?, ?,?,?,?,?, ?,?,?,?)').bind(
    lead.reference,lead.nonce,lead.created_at,lead.kind,lead.name,lead.company,lead.email,
    lead.phone,lead.service,lead.location,lead.details,lead.created_at
  ).run();
}
function fromRow(row){return {...row,name:row.full_name};}
async function handleRequest(request,env,ctx){
  const origin=request.headers.get('origin')||'';
  if(!ORIGINS.has(origin))return json({error:'origin_not_allowed'},403,origin);
  if(!env.LEADS_DB||!env.TURNSTILE_SECRET||!env.RATE_LIMIT_SALT||!env.LEADS_NOTIFY_TO||!env.RESEND_API_KEY||!env.RESEND_FROM||!env.HUBSPOT_PORTAL_ID||!env.HUBSPOT_FORM_GUID)return json({error:'service_not_configured'},503,origin);
  if(Number(request.headers.get('content-length')||0)>16000)return json({error:'payload_too_large'},413,origin);
  let d;
  try{d=cleanInput(await request.json())}catch(_){return json({error:'invalid_json'},400,origin)}
  if(!d)return json({error:'invalid_fields_or_consent'},422,origin);
  const existing=await lookupByNonce(env.LEADS_DB,d.nonce);
  if(existing){
    const same=['kind','company','email','phone','service','location','details'].every(key=>existing[key]===d[key])
      &&existing.full_name===d.name;
    if(!same)return json({error:'submission_nonce_conflict'},409,origin);
    return json({saved:true,reference:existing.reference,receiptSent:existing.receipt_status==='sent'},200,origin);
  }
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  if(!(await limit(env.LEADS_DB,ip,env.RATE_LIMIT_SALT)))return json({error:'rate_limited'},429,origin);
  let verified=false;
  try{verified=await turnstileVerify(d.token,env.TURNSTILE_SECRET,ip)}catch(_){}
  if(!verified)return json({error:'verification_failed'},403,origin);
  const created_at=new Date().toISOString();
  const suffix=crypto.randomUUID().split('-')[0].toUpperCase();
  const record={...d,created_at,reference:'HM-'+created_at.slice(0,10).replaceAll('-','')+'-'+suffix};
  try{await insertLead(env.LEADS_DB,record)}
  catch(_){return json({error:'storage_unavailable'},503,origin)}
  ctx.waitUntil(deliver(env,{...record,crm_status:'pending',alert_status:'pending',receipt_status:'pending'}));
  return json({saved:true,reference:record.reference,receiptSent:false,notice:'receipt_may_arrive_after_submission'},201,origin);
}
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url),origin=request.headers.get('origin')||'';
    if(url.pathname==='/health'&&request.method==='GET')return json({status:env.LEADS_DB&&env.TURNSTILE_SECRET&&env.RATE_LIMIT_SALT&&env.LEADS_NOTIFY_TO&&env.RESEND_API_KEY&&env.RESEND_FROM&&env.HUBSPOT_PORTAL_ID&&env.HUBSPOT_FORM_GUID?'ready':'not_configured'},200,origin);
    if(url.pathname==='/v1/leads'&&request.method==='OPTIONS'){
      if(!ORIGINS.has(origin))return json({error:'origin_not_allowed'},403,origin);
      return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'Content-Type','access-control-max-age':'600','vary':'Origin'}});
    }
    if(url.pathname==='/v1/leads'&&request.method==='POST'){
      try{return await handleRequest(request,env,ctx)}
      catch(_){return json({error:'temporarily_unavailable'},503,origin)}
    }
    return json({error:'not_found'},404,origin);
  },
  async scheduled(_event,env,ctx){
    if(!env.LEADS_DB)return;
    ctx.waitUntil((async()=>{
      const rows=await env.LEADS_DB.prepare("SELECT * FROM leads WHERE (crm_status='pending' OR alert_status='pending' OR receipt_status='pending') AND created_at > datetime('now','-7 days') ORDER BY created_at ASC LIMIT 25").all();
      for(const row of rows.results||[])await deliver(env,fromRow(row));
      await env.LEADS_DB.prepare("DELETE FROM leads WHERE created_at < datetime('now','-180 days')").run();
      await env.LEADS_DB.prepare("DELETE FROM hourly_rate WHERE created_at < datetime('now','-2 days')").run();
    })());
  }
};
