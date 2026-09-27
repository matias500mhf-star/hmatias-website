import {isAdmin} from './sourcing.js';

const STAGES=new Set(['pending','awarded','purchased','delivered','completed']);
const STAGE_RANK={pending:0,awarded:1,purchased:2,delivered:3,completed:4};
const COST_FIELDS=[
  'actual_material_cost_aoa',
  'actual_transport_cost_aoa',
  'actual_customs_cost_aoa',
  'actual_tax_cost_aoa',
  'actual_other_cost_aoa'
];

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
function nowIso(){return new Date().toISOString();}
function roundMoney(value){return Math.round((Number(value)+Number.EPSILON)*100)/100;}

function clean(value,max=800){
  if(value==null)return null;
  if(typeof value!=='string'&&typeof value!=='number')throw new Error('invalid_text');
  const out=String(value).trim();
  if(out.length>max)throw new Error('text_too_long');
  return out||null;
}

function nullableMoney(value){
  if(value==null||value==='')return null;
  const n=Number(value);
  if(!Number.isFinite(n)||n<0||n>1e15)throw new Error('invalid_money');
  return roundMoney(n);
}

function nullableIso(value){
  if(value==null||value==='')return null;
  const raw=clean(value,80);
  const date=new Date(raw);
  if(!raw||Number.isNaN(date.getTime()))throw new Error('invalid_date');
  return date.toISOString();
}

function hydrate(row){
  if(!row)return {
    stage:'pending',
    award_ref:null,awarded_at:null,purchase_ref:null,purchased_at:null,
    actual_material_cost_aoa:null,actual_transport_cost_aoa:null,actual_customs_cost_aoa:null,
    actual_tax_cost_aoa:null,actual_other_cost_aoa:null,
    delivery_ref:null,delivered_at:null,final_revenue_aoa:null,internal_notes:null
  };
  return {
    request_id:row.request_id,
    stage:row.stage,
    award_ref:row.award_ref,
    awarded_at:row.awarded_at,
    purchase_ref:row.purchase_ref,
    purchased_at:row.purchased_at,
    actual_material_cost_aoa:row.actual_material_cost_aoa==null?null:Number(row.actual_material_cost_aoa),
    actual_transport_cost_aoa:row.actual_transport_cost_aoa==null?null:Number(row.actual_transport_cost_aoa),
    actual_customs_cost_aoa:row.actual_customs_cost_aoa==null?null:Number(row.actual_customs_cost_aoa),
    actual_tax_cost_aoa:row.actual_tax_cost_aoa==null?null:Number(row.actual_tax_cost_aoa),
    actual_other_cost_aoa:row.actual_other_cost_aoa==null?null:Number(row.actual_other_cost_aoa),
    delivery_ref:row.delivery_ref,
    delivered_at:row.delivered_at,
    final_revenue_aoa:row.final_revenue_aoa==null?null:Number(row.final_revenue_aoa),
    internal_notes:row.internal_notes,
    created_at:row.created_at,
    updated_at:row.updated_at
  };
}

export function calculateFulfillmentSummary(fulfillment={}){
  const missingCosts=COST_FIELDS.filter(field=>fulfillment?.[field]==null||fulfillment?.[field]==='');
  const actualTotalCost=missingCosts.length?null:roundMoney(COST_FIELDS.reduce((sum,field)=>sum+Number(fulfillment[field]),0));
  const revenue=fulfillment?.final_revenue_aoa==null||fulfillment?.final_revenue_aoa===''?null:Number(fulfillment.final_revenue_aoa);
  const delivered=Boolean(fulfillment?.delivered_at);
  const profit=delivered&&actualTotalCost!=null&&Number.isFinite(revenue)&&revenue>0
    ?roundMoney(revenue-actualTotalCost):null;
  const margin=profit!=null&&revenue>0?Math.round((profit/revenue)*10000)/100:null;
  const missing=[];
  if(!fulfillment?.award_ref||!fulfillment?.awarded_at)missing.push('award_required');
  if(!fulfillment?.purchase_ref||!fulfillment?.purchased_at)missing.push('purchase_required');
  if(missingCosts.length)missing.push(...missingCosts.map(field=>'missing_'+field));
  if(!fulfillment?.delivery_ref||!fulfillment?.delivered_at)missing.push('delivery_required');
  if(!(Number.isFinite(revenue)&&revenue>0))missing.push('final_revenue_required');
  return {
    actual_total_cost_aoa:actualTotalCost,
    final_revenue_aoa:Number.isFinite(revenue)?revenue:null,
    realized_gross_profit_aoa:profit,
    realized_gross_margin_pct:margin,
    realized_profit_ready:profit!=null,
    missing_requirements:missing,
    profit_alert:profit!=null&&profit<0?'negative_realized_profit':null
  };
}

export function validateFulfillmentInput(data={},existing={}){
  let stage,awardRef,awardedAt,purchaseRef,purchasedAt,deliveryRef,deliveredAt,notes;
  const costs={};
  let revenue;
  try{
    stage=data.stage===undefined?(existing.stage||'pending'):clean(data.stage,30);
    awardRef=data.award_ref===undefined?existing.award_ref:clean(data.award_ref,160);
    awardedAt=data.awarded_at===undefined?existing.awarded_at:nullableIso(data.awarded_at);
    purchaseRef=data.purchase_ref===undefined?existing.purchase_ref:clean(data.purchase_ref,160);
    purchasedAt=data.purchased_at===undefined?existing.purchased_at:nullableIso(data.purchased_at);
    deliveryRef=data.delivery_ref===undefined?existing.delivery_ref:clean(data.delivery_ref,160);
    deliveredAt=data.delivered_at===undefined?existing.delivered_at:nullableIso(data.delivered_at);
    notes=data.internal_notes===undefined?existing.internal_notes:clean(data.internal_notes,1600);
    for(const field of COST_FIELDS){
      costs[field]=data[field]===undefined?existing[field]:nullableMoney(data[field]);
    }
    revenue=data.final_revenue_aoa===undefined?existing.final_revenue_aoa:nullableMoney(data.final_revenue_aoa);
  }catch{return {ok:false,code:'invalid_fields'};}
  if(!STAGES.has(stage))return {ok:false,code:'invalid_fulfillment_stage'};
  return {ok:true,value:{
    stage,award_ref:awardRef,awarded_at:awardedAt,purchase_ref:purchaseRef,purchased_at:purchasedAt,
    ...costs,delivery_ref:deliveryRef,delivered_at:deliveredAt,final_revenue_aoa:revenue,internal_notes:notes
  }};
}

async function buildPayload(env,requestId){
  const requestRow=await env.SOURCE_AO_DB.prepare(
    'SELECT id,public_ref,status,requirement_text FROM sourcing_requests WHERE id=?'
  ).bind(requestId).first();
  if(!requestRow)return null;
  const [fulfillmentRow,commercialCase]=await Promise.all([
    env.SOURCE_AO_DB.prepare('SELECT * FROM sourcing_fulfillment_cases WHERE request_id=?').bind(requestId).first(),
    env.SOURCE_AO_DB.prepare('SELECT proposal_status,proposal_ref FROM sourcing_commercial_cases WHERE request_id=?').bind(requestId).first()
  ]);
  const fulfillment={request_id:requestId,...hydrate(fulfillmentRow)};
  return {
    ok:true,
    confidential:true,
    request:{id:requestRow.id,reference:requestRow.public_ref,status:requestRow.status,requirement_text:requestRow.requirement_text},
    proposal_status:commercialCase?.proposal_status||'not_ready',
    proposal_ref:commercialCase?.proposal_ref||null,
    fulfillment,
    summary:calculateFulfillmentSummary(fulfillment)
  };
}

function gateStage(stage,value,proposalStatus){
  if(stage==='pending')return null;
  if(proposalStatus!=='accepted')return 'accepted_proposal_required';
  if(!value.award_ref||!value.awarded_at)return 'award_required';
  if(stage==='awarded')return null;
  if(!value.purchase_ref||!value.purchased_at)return 'purchase_required';
  if(stage==='purchased')return null;
  if(!value.delivery_ref||!value.delivered_at)return 'delivery_required';
  if(stage==='delivered')return null;
  const missingCosts=COST_FIELDS.filter(field=>value[field]==null);
  if(missingCosts.length)return 'actual_costs_required';
  const summary=calculateFulfillmentSummary(value);
  if(!summary.realized_profit_ready)return 'realized_profit_required';
  return null;
}

function requestStatusForStage(stage){
  return {pending:null,awarded:'awarded',purchased:'purchased',delivered:'delivered',completed:'completed'}[stage]||null;
}

export async function getFulfillmentCase(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const payload=await buildPayload(env,requestId);
  if(!payload)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  return json(env,payload);
}

export async function updateFulfillmentCase(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const current=await buildPayload(env,requestId);
  if(!current)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  const validated=validateFulfillmentInput(data,current.fulfillment);
  if(!validated.ok)return fail(env,400,validated.code,'Check fulfillment stage, references, dates and actual values.');
  const value=validated.value;
  const currentStage=current.fulfillment?.stage||'pending';
  if(STAGE_RANK[value.stage]<STAGE_RANK[currentStage]){
    return fail(env,409,'stage_regression_not_allowed','Fulfillment stages cannot move backwards. Correct fields without regressing the stage.');
  }
  const gate=gateStage(value.stage,value,current.proposal_status);
  if(gate)return fail(env,409,gate,'The requested commercial stage is missing required confirmed evidence.');

  const timestamp=nowIso();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_fulfillment_cases(
      request_id,stage,award_ref,awarded_at,purchase_ref,purchased_at,
      actual_material_cost_aoa,actual_transport_cost_aoa,actual_customs_cost_aoa,actual_tax_cost_aoa,actual_other_cost_aoa,
      delivery_ref,delivered_at,final_revenue_aoa,internal_notes,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(request_id) DO UPDATE SET
      stage=excluded.stage,award_ref=excluded.award_ref,awarded_at=excluded.awarded_at,
      purchase_ref=excluded.purchase_ref,purchased_at=excluded.purchased_at,
      actual_material_cost_aoa=excluded.actual_material_cost_aoa,
      actual_transport_cost_aoa=excluded.actual_transport_cost_aoa,
      actual_customs_cost_aoa=excluded.actual_customs_cost_aoa,
      actual_tax_cost_aoa=excluded.actual_tax_cost_aoa,
      actual_other_cost_aoa=excluded.actual_other_cost_aoa,
      delivery_ref=excluded.delivery_ref,delivered_at=excluded.delivered_at,
      final_revenue_aoa=excluded.final_revenue_aoa,internal_notes=excluded.internal_notes,
      updated_at=excluded.updated_at
  `).bind(
    requestId,value.stage,value.award_ref,value.awarded_at,value.purchase_ref,value.purchased_at,
    value.actual_material_cost_aoa,value.actual_transport_cost_aoa,value.actual_customs_cost_aoa,value.actual_tax_cost_aoa,value.actual_other_cost_aoa,
    value.delivery_ref,value.delivered_at,value.final_revenue_aoa,value.internal_notes,timestamp,timestamp
  ).run();

  const requestStatus=requestStatusForStage(value.stage);
  if(requestStatus){
    await env.SOURCE_AO_DB.prepare(
      'UPDATE sourcing_requests SET status=?,updated_at=? WHERE id=?'
    ).bind(requestStatus,timestamp,requestId).run();
  }

  return json(env,await buildPayload(env,requestId));
}
