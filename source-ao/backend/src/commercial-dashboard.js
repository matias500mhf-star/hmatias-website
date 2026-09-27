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

export function buildCommercialDashboard({requestStatusRows=[],proposalStatusRows=[],fulfillmentRows=[],collectionRows=[],asOf=new Date()}={}){
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

  let invoiced=0;
  let received=0;
  let outstanding=0;
  let overdueAmount=0;
  let overdueCount=0;
  let paidCount=0;
  const now=asOf instanceof Date?asOf:new Date(asOf);
  for(const row of collectionRows){
    const amount=number(row.invoice_amount_aoa);
    const collected=number(row.received_aoa);
    const balance=Math.max(amount-collected,0);
    invoiced+=amount;
    received+=collected;
    outstanding+=balance;
    if(balance<=0&&amount>0)paidCount+=1;
    const due=row.due_date?new Date(row.due_date):null;
    if(balance>0&&due&&!Number.isNaN(due.getTime())&&due.getTime()<now.getTime()){
      overdueCount+=1;
      overdueAmount+=balance;
    }
  }
  invoiced=roundMoney(invoiced);
  received=roundMoney(received);
  outstanding=roundMoney(outstanding);
  overdueAmount=roundMoney(overdueAmount);

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
    },
    collections:{
      invoiced_aoa:invoiced,
      received_aoa:received,
      outstanding_aoa:outstanding,
      overdue_aoa:overdueAmount,
      overdue_count:overdueCount,
      paid_count:paidCount
    }
  };
}

export async function getCommercialDashboard(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const [requests,proposals,fulfillment,collections]=await Promise.all([
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
    `).all(),
    env.SOURCE_AO_DB.prepare(`
      SELECT i.request_id,i.invoice_amount_aoa,i.due_date,
        COALESCE(SUM(CASE WHEN p.voided_at IS NULL THEN p.amount_aoa ELSE 0 END),0) received_aoa
      FROM sourcing_invoices i
      LEFT JOIN sourcing_payments p ON p.request_id=i.request_id
      GROUP BY i.request_id,i.invoice_amount_aoa,i.due_date
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
      fulfillmentRows:fulfillment.results||[],
      collectionRows:collections.results||[]
    })
  });
}
