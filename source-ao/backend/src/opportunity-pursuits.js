import {isAdmin} from './index.js';

export const PURSUIT_DECISIONS=new Set(['watch','go','no_go']);
export const PURSUIT_STAGES=new Set(['review','qualification','partnering','preparing_bid','submitted','clarification','won','lost','withdrawn']);

const clean=(value,max)=>{
  if(value==null||value==='')return null;
  const text=String(value).trim();
  if(!text)return null;
  if(text.length>max)throw new Error('value_too_long');
  return text;
};
const money=value=>{
  if(value==null||value==='')return null;
  const n=Number(value);
  if(!Number.isFinite(n)||n<0||n>1e15)throw new Error('invalid_estimated_value');
  return Math.round(n*100)/100;
};
const iso=value=>{
  if(value==null||value==='')return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))throw new Error('invalid_due_date');
  return date.toISOString();
};
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
}});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);

export function normalizePursuitInput(input={}){
  const decision=clean(input.decision,20)||'watch';
  const stage=clean(input.stage,30)||'review';
  if(!PURSUIT_DECISIONS.has(decision))throw new Error('invalid_decision');
  if(!PURSUIT_STAGES.has(stage))throw new Error('invalid_stage');
  if(decision==='no_go'&&!['lost','withdrawn','review'].includes(stage))throw new Error('no_go_stage_conflict');
  if(['won','lost','withdrawn'].includes(stage)&&decision==='watch')throw new Error('closed_stage_requires_decision');
  return {
    decision,
    stage,
    owner:clean(input.owner,120),
    estimated_value_aoa:money(input.estimated_value_aoa),
    next_action:clean(input.next_action,600),
    next_action_due_at:iso(input.next_action_due_at),
    partner_need:clean(input.partner_need,600),
    notes:clean(input.notes,1600),
    outcome_reason:clean(input.outcome_reason,1000)
  };
}

function hydrate(row){
  return {
    opportunity_id:row.opportunity_id||row.id,
    title:row.title,
    issuer:row.issuer,
    reference:row.reference,
    deadline:row.deadline,
    location:row.location,
    source_url:row.source_url,
    fit_score:row.fit_score==null?null:Number(row.fit_score),
    decision:row.decision||'watch',
    stage:row.stage||'review',
    owner:row.owner||null,
    estimated_value_aoa:row.estimated_value_aoa==null?null:Number(row.estimated_value_aoa),
    next_action:row.next_action||null,
    next_action_due_at:row.next_action_due_at||null,
    partner_need:row.partner_need||null,
    notes:row.notes||null,
    outcome_reason:row.outcome_reason||null,
    pursuit_created_at:row.pursuit_created_at||null,
    pursuit_updated_at:row.pursuit_updated_at||null
  };
}

export async function listOpportunityPursuits(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const includeClosed=url.searchParams.get('include_closed')==='1';
  const rows=await env.SOURCE_AO_DB.prepare(`
    SELECT
      o.id opportunity_id,o.title,o.issuer,o.reference,o.deadline,o.location,o.source_url,o.fit_score,
      p.decision,p.stage,p.owner,p.estimated_value_aoa,p.next_action,p.next_action_due_at,p.partner_need,
      p.notes,p.outcome_reason,p.created_at pursuit_created_at,p.updated_at pursuit_updated_at
    FROM opportunities o
    LEFT JOIN opportunity_pursuits p ON p.opportunity_id=o.id
    WHERE o.country_code='AO'
      AND (
        o.status='active'
        OR (?=1 AND p.stage IN ('won','lost','withdrawn'))
      )
    ORDER BY
      CASE COALESCE(p.decision,'watch') WHEN 'go' THEN 0 WHEN 'watch' THEN 1 ELSE 2 END,
      CASE COALESCE(p.stage,'review')
        WHEN 'submitted' THEN 0 WHEN 'clarification' THEN 1 WHEN 'preparing_bid' THEN 2
        WHEN 'partnering' THEN 3 WHEN 'qualification' THEN 4 WHEN 'review' THEN 5 ELSE 6 END,
      COALESCE(p.next_action_due_at,o.deadline) ASC,
      o.deadline ASC
    LIMIT 150
  `).bind(includeClosed?1:0).all();
  const pursuits=(rows.results||[]).map(hydrate);
  const active=pursuits.filter(p=>!['won','lost','withdrawn'].includes(p.stage));
  const pipeline=active.filter(p=>p.decision==='go').reduce((sum,p)=>sum+(p.estimated_value_aoa||0),0);
  return json(env,{
    ok:true,
    confidential:true,
    summary:{
      opportunities:pursuits.length,
      go_count:active.filter(p=>p.decision==='go').length,
      submitted_count:active.filter(p=>['submitted','clarification'].includes(p.stage)).length,
      won_count:pursuits.filter(p=>p.stage==='won').length,
      pipeline_value_aoa:Math.round(pipeline*100)/100
    },
    pursuits
  });
}

export async function upsertOpportunityPursuit(request,env,opportunityId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const opportunity=await env.SOURCE_AO_DB.prepare(
    "SELECT id,status,country_code,deadline FROM opportunities WHERE id=?"
  ).bind(opportunityId).first();
  if(!opportunity)return fail(env,404,'opportunity_not_found','Opportunity does not exist.');
  if(opportunity.country_code!=='AO')return fail(env,409,'market_not_supported','Commercial pursuits are Angola opportunities only.');

  let input;
  try{input=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  let value;
  try{value=normalizePursuitInput(input);}catch(error){
    const code=error instanceof Error?error.message:'invalid_fields';
    return fail(env,400,code,'Check decision, stage, value, dates and text fields.');
  }

  if(value.decision==='go'&&['review','qualification','partnering','preparing_bid','submitted','clarification'].includes(value.stage)){
    if(!value.owner)return fail(env,409,'owner_required','Assign an owner before an opportunity becomes an active pursuit.');
    if(!value.next_action)return fail(env,409,'next_action_required','Define the next commercial action for an active pursuit.');
  }
  if(['won','lost','withdrawn'].includes(value.stage)&&!value.outcome_reason){
    return fail(env,409,'outcome_reason_required','Record the commercial outcome before closing a pursuit.');
  }

  const timestamp=new Date().toISOString();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO opportunity_pursuits(
      opportunity_id,decision,stage,owner,estimated_value_aoa,next_action,next_action_due_at,
      partner_need,notes,outcome_reason,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(opportunity_id) DO UPDATE SET
      decision=excluded.decision,
      stage=excluded.stage,
      owner=excluded.owner,
      estimated_value_aoa=excluded.estimated_value_aoa,
      next_action=excluded.next_action,
      next_action_due_at=excluded.next_action_due_at,
      partner_need=excluded.partner_need,
      notes=excluded.notes,
      outcome_reason=excluded.outcome_reason,
      updated_at=excluded.updated_at
  `).bind(
    opportunityId,value.decision,value.stage,value.owner,value.estimated_value_aoa,
    value.next_action,value.next_action_due_at,value.partner_need,value.notes,value.outcome_reason,
    timestamp,timestamp
  ).run();

  return json(env,{ok:true,confidential:true,opportunity_id:opportunityId,...value,updated_at:timestamp});
}
