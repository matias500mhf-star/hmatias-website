import {isAdmin} from './sourcing.js';

export const OUTREACH_STATUSES=new Set([
  'shortlisted','contacted','awaiting_response','needs_clarification',
  'out_of_scope','quote_received','declined','no_response'
]);
export const OUTREACH_CHANNELS=new Set(['email','whatsapp','phone','web','other']);

const headers=env=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
});
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(env)});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);
const nowIso=()=>new Date().toISOString();
const clean=(value,max)=>{
  if(value==null||value==='')return null;
  const text=String(value).trim();
  if(!text)return null;
  if(text.length>max)throw new Error('value_too_long');
  return text;
};
const iso=value=>{
  if(value==null||value==='')return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))throw new Error('invalid_date');
  return date.toISOString();
};

export function validateSupplierOutreachInput(input={}){
  let supplierId,status,channel,contactReference,contactedAt,respondedAt,nextFollowUpAt,quoteRef,responseSummary,internalNotes;
  try{
    supplierId=clean(input.supplier_id,120);
    status=clean(input.status,40)||'shortlisted';
    channel=clean(input.channel,30);
    contactReference=clean(input.contact_reference,240);
    contactedAt=iso(input.contacted_at);
    respondedAt=iso(input.responded_at);
    nextFollowUpAt=iso(input.next_follow_up_at);
    quoteRef=clean(input.supplier_quote_ref,160);
    responseSummary=clean(input.response_summary,1200);
    internalNotes=clean(input.internal_notes,1600);
  }catch(error){
    return {ok:false,code:error instanceof Error?error.message:'invalid_fields'};
  }
  if(!supplierId)return {ok:false,code:'supplier_required'};
  if(!OUTREACH_STATUSES.has(status))return {ok:false,code:'invalid_outreach_status'};
  if(channel&&!OUTREACH_CHANNELS.has(channel))return {ok:false,code:'invalid_outreach_channel'};

  const contactedStates=new Set(['contacted','awaiting_response','needs_clarification','out_of_scope','quote_received','declined','no_response']);
  const responseStates=new Set(['needs_clarification','out_of_scope','quote_received','declined']);
  if(contactedStates.has(status)){
    if(!channel)return {ok:false,code:'channel_required'};
    if(!contactedAt)return {ok:false,code:'contacted_at_required'};
  }
  if(responseStates.has(status)&&!respondedAt)return {ok:false,code:'responded_at_required'};
  if(status==='quote_received'&&!quoteRef&&!responseSummary)return {ok:false,code:'quote_evidence_required'};
  if(['out_of_scope','declined'].includes(status))nextFollowUpAt=null;

  return {ok:true,value:{
    supplier_id:supplierId,status,channel,contact_reference:contactReference,
    contacted_at:contactedAt,responded_at:respondedAt,next_follow_up_at:nextFollowUpAt,
    supplier_quote_ref:quoteRef,response_summary:responseSummary,internal_notes:internalNotes
  }};
}

export async function readSupplierOutreachRows(env,requestId){
  const rows=await env.SOURCE_AO_DB.prepare(`
    SELECT o.*,s.name supplier_name,s.country_code supplier_country_code
    FROM sourcing_supplier_outreach o
    LEFT JOIN private_sourcing_suppliers s ON s.id=o.supplier_id
    WHERE o.request_id=?
    ORDER BY
      CASE o.status
        WHEN 'needs_clarification' THEN 0
        WHEN 'awaiting_response' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'quote_received' THEN 3
        WHEN 'shortlisted' THEN 4
        ELSE 5
      END,
      COALESCE(o.next_follow_up_at,o.updated_at) ASC
  `).bind(requestId).all();
  return (rows.results||[]).map(row=>({
    request_id:row.request_id,
    supplier_id:row.supplier_id,
    supplier_name:row.supplier_name||row.supplier_id,
    supplier_country_code:row.supplier_country_code||null,
    status:row.status,
    channel:row.channel||null,
    contact_reference:row.contact_reference||null,
    contacted_at:row.contacted_at||null,
    responded_at:row.responded_at||null,
    next_follow_up_at:row.next_follow_up_at||null,
    supplier_quote_ref:row.supplier_quote_ref||null,
    response_summary:row.response_summary||null,
    internal_notes:row.internal_notes||null,
    created_at:row.created_at,
    updated_at:row.updated_at
  }));
}

export function summarizeSupplierOutreach(rows=[]){
  return {
    total:rows.length,
    awaiting_response:rows.filter(x=>['contacted','awaiting_response','no_response'].includes(x.status)).length,
    needs_clarification:rows.filter(x=>x.status==='needs_clarification').length,
    quote_received:rows.filter(x=>x.status==='quote_received').length,
    closed:rows.filter(x=>['out_of_scope','declined'].includes(x.status)).length
  };
}

async function requestExists(env,requestId){
  return Boolean(await env.SOURCE_AO_DB.prepare('SELECT id FROM sourcing_requests WHERE id=?').bind(requestId).first());
}

export async function getSupplierOutreach(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  if(!await requestExists(env,requestId))return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const outreach=await readSupplierOutreachRows(env,requestId);
  return json(env,{ok:true,confidential:true,summary:summarizeSupplierOutreach(outreach),outreach});
}

export async function upsertSupplierOutreach(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  if(!await requestExists(env,requestId))return fail(env,404,'request_not_found','Sourcing request does not exist.');
  let input;
  try{input=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  const validated=validateSupplierOutreachInput(input);
  if(!validated.ok)return fail(env,400,validated.code,'Check supplier outreach status, channel and timestamps.');
  const v=validated.value;
  const supplier=await env.SOURCE_AO_DB.prepare('SELECT id FROM private_sourcing_suppliers WHERE id=?').bind(v.supplier_id).first();
  if(!supplier)return fail(env,400,'supplier_not_found','Private supplier does not exist.');

  const timestamp=nowIso();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_supplier_outreach(
      request_id,supplier_id,status,channel,contact_reference,contacted_at,responded_at,
      next_follow_up_at,supplier_quote_ref,response_summary,internal_notes,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(request_id,supplier_id) DO UPDATE SET
      status=excluded.status,
      channel=excluded.channel,
      contact_reference=excluded.contact_reference,
      contacted_at=excluded.contacted_at,
      responded_at=excluded.responded_at,
      next_follow_up_at=excluded.next_follow_up_at,
      supplier_quote_ref=excluded.supplier_quote_ref,
      response_summary=excluded.response_summary,
      internal_notes=excluded.internal_notes,
      updated_at=excluded.updated_at
  `).bind(
    requestId,v.supplier_id,v.status,v.channel,v.contact_reference,v.contacted_at,v.responded_at,
    v.next_follow_up_at,v.supplier_quote_ref,v.response_summary,v.internal_notes,timestamp,timestamp
  ).run();

  const outreach=await readSupplierOutreachRows(env,requestId);
  return json(env,{ok:true,confidential:true,summary:summarizeSupplierOutreach(outreach),outreach});
}
