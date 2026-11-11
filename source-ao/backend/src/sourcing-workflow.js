import {isAdmin} from './index.js';
import {decryptPrivateText,encryptPrivateText} from './sourcing.js';
import {interpretSourcingRequest} from './ai-procurement-assistant.js';
import {buildProcurementMission} from './procurement-mission.js';

const headers=env=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
  'access-control-allow-methods':'GET,POST,OPTIONS',
  'access-control-allow-headers':'content-type,authorization'
});
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:headers(env)});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);
const iso=()=>new Date().toISOString();
const newId=prefix=>`${prefix}_${crypto.randomUUID()}`;

function actorLabel(request){
  // Never persist an authorization token or other credential as an audit actor.
  return request.headers.get('x-source-ao-actor')?.trim().slice(0,100)||'admin';
}

async function loadRequest(env,id){
  return env.SOURCE_AO_DB.prepare(`
    SELECT id,public_ref,requirement_text,category,specification,quantity,unit,location,needed_by,status,
           rfq_details_encrypted,contact_purged_at
    FROM sourcing_requests WHERE id=?
  `).bind(id).first();
}

async function requestItems(row,env){
  if(row.rfq_details_encrypted==='PURGED')return {error:'request_details_purged'};
  if(row.rfq_details_encrypted){
    const rfq=JSON.parse(await decryptPrivateText(row.rfq_details_encrypted,env.PII_ENCRYPTION_KEY));
    if(Array.isArray(rfq.items)&&rfq.items.length)return {items:rfq.items};
  }
  return {items:[{
    description:row.requirement_text,
    specification:row.specification||'',
    quantity:row.quantity,
    unit:row.unit,
    category:row.category||''
  }]};
}

async function recordStatus(env,requestId,from,to,actor,note=''){
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_status_events(id,sourcing_request_id,from_status,to_status,actor,note,created_at)
    VALUES(?,?,?,?,?,?,?)
  `).bind(newId('sse'),requestId,from,to,actor,note,iso()).run();
}

export async function processSourcingRequest(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  if(!env.SOURCE_AO_DB||!env.PII_ENCRYPTION_KEY)return fail(env,503,'workflow_not_configured','Secure workflow storage is not configured.');
  const row=await loadRequest(env,requestId);
  if(!row)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  if(!['received','triage'].includes(row.status)){
    return fail(env,409,'invalid_workflow_state','Only received or triage requests can be processed. Current status: '+row.status+'.');
  }

  const actor=actorLabel(request);
  const runId=newId('swr');
  const started=iso();
  const previous=row.status;
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_workflow_runs(id,sourcing_request_id,status,requested_by,started_at)
    VALUES(?,?,?,?,?)
  `).bind(runId,requestId,'running',actor,started).run();
  if(previous!=='triage'){
    await env.SOURCE_AO_DB.prepare('UPDATE sourcing_requests SET status=?,updated_at=? WHERE id=? AND status=?')
      .bind('triage',started,requestId,previous).run();
    await recordStatus(env,requestId,previous,'triage',actor,'Automatic workflow processing started.');
  }

  let items;
  try{
    const loaded=await requestItems(row,env);
    if(loaded.error)throw new Error(loaded.error);
    items=loaded.items;
  }catch{
    const completed=iso();
    await env.SOURCE_AO_DB.prepare('UPDATE sourcing_workflow_runs SET status=?,error_code=?,completed_at=? WHERE id=?')
      .bind('failed','request_details_unavailable',completed,runId).run();
    return fail(env,409,'request_details_unavailable','The private request details could not be read; no supplier search was run.');
  }

  const results=[];
  for(const item of items){
    const query=[item.description||'',item.specification||''].filter(Boolean).join(' ').trim();
    const interpreted=await interpretSourcingRequest(env,{
      query,
      location:row.location||'Luanda',
      needed_by:row.needed_by||'',
      quantity:item.quantity==null?'':item.quantity
    });
    if(interpreted.error){
      const completed=iso();
      await env.SOURCE_AO_DB.prepare('UPDATE sourcing_workflow_runs SET status=?,error_code=?,completed_at=? WHERE id=?')
        .bind('failed',interpreted.error,completed,runId).run();
      return fail(env,interpreted.error==='ai_not_configured'||interpreted.error==='ai_configuration_invalid'?503:502,
        interpreted.error,'AI triage failed. The request remains in triage and can be retried after the issue is resolved.');
    }
    const value=interpreted.value;
    let mission;
    try{
      mission=await buildProcurementMission(env,{
        query:value.search_query,
        location:value.location,
        neededBy:value.needed_by,
        quantity:value.quantity
      });
    }catch{
      const completed=iso();
      await env.SOURCE_AO_DB.prepare('UPDATE sourcing_workflow_runs SET status=?,error_code=?,completed_at=? WHERE id=?')
        .bind('failed','procurement_search_failed',completed,runId).run();
      return fail(env,500,'procurement_search_failed','The interpreted request could not be searched. The request remains in triage.');
    }
    results.push({
      requested_item:{description:item.description||row.requirement_text,specification:item.specification||'',quantity:item.quantity??row.quantity,unit:item.unit??row.unit??null},
      interpretation:value,
      mission
    });
  }

  const encrypted=await encryptPrivateText(JSON.stringify({reference:row.public_ref,results}),env.PII_ENCRYPTION_KEY);
  const completed=iso();
  await env.SOURCE_AO_DB.prepare('UPDATE sourcing_workflow_runs SET status=?,result_encrypted=?,completed_at=? WHERE id=?')
    .bind('completed',encrypted,completed,runId).run();
  await env.SOURCE_AO_DB.prepare('UPDATE sourcing_requests SET status=?,updated_at=? WHERE id=? AND status=?')
    .bind('sourcing',completed,requestId,'triage').run();
  await recordStatus(env,requestId,'triage','sourcing',actor,'AI interpretation and SOURCE AO supplier search completed; supplier availability still requires verification.');
  return json(env,{
    ok:true,
    run:{id:runId,status:'completed',started_at:started,completed_at:completed},
    request:{id:row.id,reference:row.public_ref,status:'sourcing'},
    results,
    next_step:'Verify supplier, exact product, current stock, price and delivery terms before marking the request verified.'
  });
}

export async function getSourcingWorkflow(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  if(!env.SOURCE_AO_DB||!env.PII_ENCRYPTION_KEY)return fail(env,503,'workflow_not_configured','Secure workflow storage is not configured.');
  const row=await env.SOURCE_AO_DB.prepare(`
    SELECT id,public_ref,status,started_at,completed_at,error_code,result_encrypted
    FROM sourcing_workflow_runs WHERE sourcing_request_id=? ORDER BY started_at DESC LIMIT 1
  `).bind(requestId).first();
  if(!row)return fail(env,404,'workflow_not_found','No workflow run exists for this sourcing request.');
  let result=null;
  if(row.result_encrypted){
    try{result=JSON.parse(await decryptPrivateText(row.result_encrypted,env.PII_ENCRYPTION_KEY));}
    catch{return fail(env,503,'workflow_result_unavailable','The stored workflow result could not be decrypted.');}
  }
  return json(env,{ok:true,run:{id:row.id,reference:row.public_ref,status:row.status,started_at:row.started_at,completed_at:row.completed_at,error_code:row.error_code},result});
}
