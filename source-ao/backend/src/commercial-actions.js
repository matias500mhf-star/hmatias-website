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
function roundMoney(value){return Math.round((Number(value)+Number.EPSILON)*100)/100;}
function dayDiff(now,value){
  if(!value)return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return null;
  return Math.floor((now.getTime()-date.getTime())/86400000);
}
function daysUntil(now,value){
  if(!value)return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return null;
  return Math.ceil((date.getTime()-now.getTime())/86400000);
}
function priorityLabel(score){
  if(score>=95)return 'critical';
  if(score>=85)return 'high';
  if(score>=75)return 'medium';
  return 'normal';
}

export function deriveCommercialAction(row={},asOf=new Date()){
  const now=asOf instanceof Date?asOf:new Date(asOf);
  const proposalStatus=String(row.proposal_status||'not_ready');
  const stage=String(row.fulfillment_stage||'pending');
  const requestStatus=String(row.request_status||'received');
  const invoiceAmount=row.invoice_amount_aoa==null?null:Number(row.invoice_amount_aoa);
  const received=Number(row.received_aoa||0);
  const outstanding=invoiceAmount==null?null:roundMoney(Math.max(invoiceAmount-received,0));
  const overdueDays=row.due_date?Math.max(0,dayDiff(now,row.due_date)||0):0;
  const dueIn=row.due_date?daysUntil(now,row.due_date):null;
  const commercialAge=Math.max(0,dayDiff(now,row.commercial_updated_at||row.request_updated_at||row.created_at)||0);
  const supplierFollowUpIn=row.supplier_follow_up_at?daysUntil(now,row.supplier_follow_up_at):null;
  const outreachOpen=Number(row.outreach_open_count||0);
  const outreachClarification=Number(row.outreach_clarification_count||0);
  const outreachQuotes=Number(row.outreach_quote_received_count||0);

  let action=null;
  if(invoiceAmount!=null&&outstanding>0&&row.due_date&&new Date(row.due_date).getTime()<now.getTime()){
    action={
      type:'collect_overdue',
      score:Math.min(120,100+overdueDays),
      title:'Cobrança vencida',
      recommended_action:'Contactar o cliente e confirmar data de pagamento.',
      why:'Existe saldo por cobrar após a data de vencimento.',
      amount_aoa:outstanding,
      deadline:row.due_date,
      age_days:overdueDays
    };
  }else if(invoiceAmount!=null&&outstanding>0&&dueIn!=null&&dueIn>=0&&dueIn<=3){
    action={
      type:'collect_due_soon',
      score:95,
      title:'Cobrança vence em breve',
      recommended_action:'Confirmar receção da fatura e previsão de pagamento.',
      why:'O saldo em aberto vence nos próximos 3 dias.',
      amount_aoa:outstanding,
      deadline:row.due_date,
      age_days:null
    };
  }else if(['delivered','completed'].includes(stage)&&invoiceAmount==null){
    action={
      type:'issue_invoice',
      score:92,
      title:'Entrega sem fatura registada',
      recommended_action:'Emitir/registar a fatura confirmada.',
      why:'A entrega está registada, mas ainda não existe faturação no SOURCE AO.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.fulfillment_updated_at||row.request_updated_at)||0)
    };
  }else if(proposalStatus==='accepted'&&stage==='pending'){
    action={
      type:'record_award',
      score:90,
      title:'Proposta aceite sem adjudicação',
      recommended_action:'Registar referência e data de adjudicação.',
      why:'A proposta está aceite, mas a execução ainda não iniciou.',
      amount_aoa:row.sale_price_aoa==null?null:Number(row.sale_price_aoa),
      deadline:null,
      age_days:commercialAge
    };
  }else if(stage==='awarded'){
    action={
      type:'record_purchase',
      score:86,
      title:'Adjudicado — compra por registar',
      recommended_action:'Registar a compra/PO ao fornecedor quando confirmada.',
      why:'A adjudicação está registada e a aquisição ainda não avançou no fluxo.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.fulfillment_updated_at)||0)
    };
  }else if(stage==='purchased'){
    action={
      type:'confirm_delivery',
      score:84,
      title:'Compra feita — entrega por confirmar',
      recommended_action:'Registar a entrega assim que houver evidência.',
      why:'A compra está registada e ainda falta confirmação de entrega.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.fulfillment_updated_at)||0)
    };
  }else if(proposalStatus==='sent'){
    action={
      type:'follow_up_proposal',
      score:commercialAge>=3?83:76,
      title:'Proposta enviada — follow-up',
      recommended_action:'Contactar o cliente para obter decisão ou próximos passos.',
      why:commercialAge>=3?'A proposta está enviada há pelo menos 3 dias.':'A proposta foi enviada e aguarda resposta.',
      amount_aoa:row.sale_price_aoa==null?null:Number(row.sale_price_aoa),
      deadline:null,
      age_days:commercialAge
    };
  }else if(['ready','revised'].includes(proposalStatus)){
    action={
      type:'send_proposal',
      score:81,
      title:'Proposta pronta para envio',
      recommended_action:'Validar o resumo final e enviar ao cliente.',
      why:'O caso comercial indica que a proposta está pronta/revista.',
      amount_aoa:row.sale_price_aoa==null?null:Number(row.sale_price_aoa),
      deadline:null,
      age_days:commercialAge
    };
  }else if(['sourcing','verifying'].includes(requestStatus)&&outreachClarification>0){
    action={
      type:'supplier_clarification',
      score:82,
      title:'Fornecedor pediu esclarecimento',
      recommended_action:'Responder ao pedido técnico/comercial do fornecedor e registar a atualização.',
      why:'Existe pelo menos uma consulta de fornecedor a aguardar esclarecimento da HMATIAS.',
      amount_aoa:null,
      deadline:row.supplier_follow_up_at||null,
      age_days:Math.max(0,dayDiff(now,row.outreach_updated_at||row.request_updated_at)||0)
    };
  }else if(['sourcing','verifying'].includes(requestStatus)&&outreachQuotes>0){
    action={
      type:'validate_supplier_quote',
      score:80,
      title:'Cotação de fornecedor por validar',
      recommended_action:'Validar especificação, validade, prazo, logística e custo antes de criar/confirmar a opção de custo.',
      why:'Foi registada uma cotação de fornecedor e o pedido ainda não chegou à proposta.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.outreach_updated_at||row.request_updated_at)||0)
    };
  }else if(['sourcing','verifying'].includes(requestStatus)&&supplierFollowUpIn!=null&&supplierFollowUpIn<=0&&outreachOpen>0){
    action={
      type:'supplier_follow_up',
      score:79,
      title:'Follow-up de fornecedor vencido',
      recommended_action:'Contactar o fornecedor e atualizar o estado da consulta.',
      why:'O próximo follow-up registado já venceu.',
      amount_aoa:null,
      deadline:row.supplier_follow_up_at,
      age_days:Math.max(0,-supplierFollowUpIn)
    };
  }else if(requestStatus==='received'){
    action={
      type:'qualify_request',
      score:79,
      title:'Novo pedido por qualificar',
      recommended_action:'Confirmar necessidade, especificação, quantidade, prazo e intenção de compra.',
      why:'O pedido ainda está no estado recebido.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.created_at)||0)
    };
  }else if(requestStatus==='triage'){
    action={
      type:'complete_triage',
      score:75,
      title:'Qualificação por concluir',
      recommended_action:'Fechar a qualificação comercial e decidir se avança para sourcing.',
      why:'O pedido continua em triagem.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.request_updated_at||row.created_at)||0)
    };
  }else if(['sourcing','verifying'].includes(requestStatus)&&outreachOpen>0){
    action={
      type:'await_supplier_response',
      score:73,
      title:'Consultas a fornecedores em aberto',
      recommended_action:'Acompanhar respostas e confirmar se alguma opção já pode avançar para custo.',
      why:'Existem fornecedores contactados ainda sem resultado comercial concluído.',
      amount_aoa:null,
      deadline:row.supplier_follow_up_at||null,
      age_days:Math.max(0,dayDiff(now,row.outreach_updated_at||row.request_updated_at||row.created_at)||0)
    };
  }else if(['sourcing','verifying'].includes(requestStatus)){
    action={
      type:'progress_sourcing',
      score:72,
      title:'Sourcing/verificação em curso',
      recommended_action:'Fechar fornecedor, custo e evidência pendentes.',
      why:'O pedido ainda não chegou a proposta.',
      amount_aoa:null,
      deadline:null,
      age_days:Math.max(0,dayDiff(now,row.request_updated_at||row.created_at)||0)
    };
  }

  if(!action)return null;
  return {
    request_id:row.id,
    reference:row.public_ref||row.id,
    requirement_text:row.requirement_text||'Pedido sem descrição',
    request_status:requestStatus,
    proposal_status:proposalStatus,
    fulfillment_stage:stage,
    ...action,
    priority:priorityLabel(action.score)
  };
}

export function buildCommercialActionQueue(rows=[],asOf=new Date(),limit=20){
  return rows.map(row=>deriveCommercialAction(row,asOf))
    .filter(Boolean)
    .sort((a,b)=>b.score-a.score||(b.amount_aoa||0)-(a.amount_aoa||0)||String(a.reference).localeCompare(String(b.reference)))
    .slice(0,Math.max(1,Math.min(Number(limit)||20,50)));
}

export async function getCommercialActions(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const limit=Math.max(1,Math.min(Number(url.searchParams.get('limit')||20),50));
  const rows=await env.SOURCE_AO_DB.prepare(`
    SELECT
      r.id,r.public_ref,r.status request_status,r.requirement_text,r.created_at,r.updated_at request_updated_at,
      c.proposal_status,c.sale_price_aoa,c.updated_at commercial_updated_at,
      f.stage fulfillment_stage,f.updated_at fulfillment_updated_at,
      i.invoice_amount_aoa,i.due_date,
      o.supplier_follow_up_at,o.outreach_open_count,o.outreach_clarification_count,o.outreach_quote_received_count,o.outreach_updated_at,
      COALESCE(SUM(CASE WHEN p.voided_at IS NULL THEN p.amount_aoa ELSE 0 END),0) received_aoa
    FROM sourcing_requests r
    LEFT JOIN sourcing_commercial_cases c ON c.request_id=r.id
    LEFT JOIN sourcing_fulfillment_cases f ON f.request_id=r.id
    LEFT JOIN sourcing_invoices i ON i.request_id=r.id
    LEFT JOIN sourcing_payments p ON p.request_id=r.id
    LEFT JOIN (
      SELECT
        request_id,
        MIN(CASE
          WHEN status IN ('contacted','awaiting_response','needs_clarification','no_response')
          THEN next_follow_up_at END) supplier_follow_up_at,
        SUM(CASE WHEN status IN ('contacted','awaiting_response','needs_clarification','no_response') THEN 1 ELSE 0 END) outreach_open_count,
        SUM(CASE WHEN status='needs_clarification' THEN 1 ELSE 0 END) outreach_clarification_count,
        SUM(CASE WHEN status='quote_received' THEN 1 ELSE 0 END) outreach_quote_received_count,
        MAX(updated_at) outreach_updated_at
      FROM sourcing_supplier_outreach
      GROUP BY request_id
    ) o ON o.request_id=r.id
    WHERE r.status!='closed'
    GROUP BY
      r.id,r.public_ref,r.status,r.requirement_text,r.created_at,r.updated_at,
      c.proposal_status,c.sale_price_aoa,c.updated_at,
      f.stage,f.updated_at,
      i.invoice_amount_aoa,i.due_date,
      o.supplier_follow_up_at,o.outreach_open_count,o.outreach_clarification_count,o.outreach_quote_received_count,o.outreach_updated_at
    ORDER BY r.updated_at DESC
    LIMIT 200
  `).all();
  const asOf=new Date();
  const actions=buildCommercialActionQueue(rows.results||[],asOf,limit);
  return json(env,{
    ok:true,
    confidential:true,
    identity_minimized:true,
    as_of:asOf.toISOString(),
    count:actions.length,
    results:actions
  });
}
