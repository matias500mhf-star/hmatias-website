import {isAdmin} from './sourcing.js';

function headers(env){
  return {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com',
    'access-control-allow-methods':'GET,OPTIONS',
    'access-control-allow-headers':'content-type,authorization'
  };
}
function json(env,data,status=200){return new Response(JSON.stringify(data),{status,headers:headers(env)});}
function fail(env,status,code,message){return json(env,{ok:false,error:{code,message}},status);}
function number(value){const n=Number(value);return Number.isFinite(n)?n:0;}
function roundMoney(value){return Math.round((number(value)+Number.EPSILON)*100)/100;}

function mapCounts(rows=[]){
  const out={};
  for(const row of rows)out[String(row.status||row.stage||'unknown')]=number(row.count);
  return out;
}

export function buildCommercialDashboard({requestStatusRows=[],proposalStatusRows=[],fulfillmentRows=[]}={}){
  const requestByStatus=mapCounts(requestStatusRows);
  const proposalByStatus={};
  const proposalValueByStatus={};
  for(const row of proposalStatusRows){
    const key=String(row.proposal_status||'not_ready');
    proposalByStatus[key]=number(row.count);
    proposalValueByStatus[key]=roundMoney(row.total_value_aoa);
  }
  const executionByStage=mapCounts(fulfillmentRows);

  const requestTotal=Object.values(requestByStatus).reduce((sum,value)=>sum+value,0);
  const activeRequests=requestTotal-number(requestByStatus.closed)-number(requestByStatus.completed);
  const acceptedValue=roundMoney(proposalValueByStatus.accepted||0);
  const proposalPipelineValue=roundMoney(
    ['ready','sent','revised','accepted'].reduce((sum,key)=>sum+number(proposalValueByStatus[key]),0)
  );

  let completedRevenue=0;
  let completedActualCost=0;
  for(const row of fulfillmentRows){
    if(String(row.stage)!=='completed')continue;
    completedRevenue+=number(row.final_revenue_aoa);
    completedActualCost+=number(row.actual_cost_aoa);
  }
  completedRevenue=roundMoney(completedRevenue);
  completedActualCost=roundMoney(completedActualCost);
  const realizedProfit=roundMoney(completedRevenue-completedActualCost);
  const realizedMargin=completedRevenue>0?Math.round((realizedProfit/completedRevenue)*10000)/100:null;

  return {
    requests:{
      total:requestTotal,
      active:Math.max(0,activeRequests),
      awaiting_triage:number(requestByStatus.received)+number(requestByStatus.triage),
      by_status:requestByStatus
    },
    proposals:{
      pipeline_value_aoa:proposalPipelineValue,
      accepted_value_aoa:acceptedValue,
      ready_count:number(proposalByStatus.ready)+number(proposalByStatus.revised),
      sent_count:number(proposalByStatus.sent),
      accepted_count:number(proposalByStatus.accepted),
      by_status:proposalByStatus
    },
    execution:{
      by_stage:executionByStage,
      completed_revenue_aoa:completedRevenue,
      completed_actual_cost_aoa:completedActualCost,
      realized_gross_profit_aoa:realizedProfit,
      realized_gross_margin_pct:realizedMargin
    }
  };
}

export async function getCommercialDashboard(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const [requests,proposals,fulfillment]=await Promise.all([
    env.SOURCE_AO_DB.prepare(
      'SELECT status,COUNT(*) count FROM sourcing_requests GROUP BY status'
    ).all(),
    env.SOURCE_AO_DB.prepare(`
      SELECT proposal_status,COUNT(*) count,
        COALESCE(SUM(CASE WHEN sale_price_aoa IS NOT NULL AND sale_price_aoa>0 THEN sale_price_aoa ELSE 0 END),0) total_value_aoa
      FROM sourcing_commercial_cases
      GROUP BY proposal_status
    `).all(),
    env.SOURCE_AO_DB.prepare(`
      SELECT stage,COUNT(*) count,
        COALESCE(SUM(CASE WHEN stage='completed' THEN final_revenue_aoa ELSE 0 END),0) final_revenue_aoa,
        COALESCE(SUM(CASE WHEN stage='completed' THEN
          COALESCE(actual_material_cost_aoa,0)+COALESCE(actual_transport_cost_aoa,0)+
          COALESCE(actual_customs_cost_aoa,0)+COALESCE(actual_tax_cost_aoa,0)+COALESCE(actual_other_cost_aoa,0)
        ELSE 0 END),0) actual_cost_aoa
      FROM sourcing_fulfillment_cases
      GROUP BY stage
    `).all()
  ]);
  return json(env,{
    ok:true,
    confidential:true,
    aggregated_only:true,
    as_of:new Date().toISOString(),
    ...buildCommercialDashboard({
      requestStatusRows:requests.results||[],
      proposalStatusRows:proposals.results||[],
      fulfillmentRows:fulfillment.results||[]
    })
  });
}
