import {decryptPrivateText,isAdmin} from './sourcing.js';
import {buildCommercialCasePayload} from './commercial-case.js';

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

function clean(value){
  const text=String(value??'').trim();
  return text||null;
}

function moneyAOA(value){
  const number=Number(value);
  if(!Number.isFinite(number))return null;
  return new Intl.NumberFormat('pt-AO',{maximumFractionDigits:2}).format(number)+' Kz';
}

function itemLine(item,index){
  const parts=[];
  if(item.quantity!=null&&item.quantity!==''){
    parts.push('Quantidade: '+[item.quantity,item.unit].filter(Boolean).join(' '));
  }
  if(item.specification)parts.push('Especificação: '+item.specification);
  return (index+1)+'. '+item.description+(parts.length?' — '+parts.join(' · '):'');
}

async function privateRfq(env,requestId){
  const row=await env.SOURCE_AO_DB.prepare(
    'SELECT rfq_details_encrypted FROM sourcing_requests WHERE id=?'
  ).bind(requestId).first();
  const encrypted=row?.rfq_details_encrypted;
  if(!encrypted||encrypted==='PURGED'||!env.PII_ENCRYPTION_KEY)return null;
  try{
    return JSON.parse(await decryptPrivateText(encrypted,env.PII_ENCRYPTION_KEY));
  }catch{return null;}
}

export function buildProposalDraft({request={},commercial_case={},summary={},rfq=null}={}){
  const missing=Array.isArray(summary?.missing_requirements)?summary.missing_requirements:[];
  if(!summary?.proposal_ready){
    return {
      ready:false,
      missing_requirements:missing,
      draft:null
    };
  }

  const items=Array.isArray(rfq?.items)&&rfq.items.length
    ?rfq.items.map(item=>({
      description:clean(item.description)||clean(request.requirement_text)||'Item solicitado',
      specification:clean(item.specification),
      quantity:item.quantity==null?null:Number(item.quantity),
      unit:clean(item.unit)
    }))
    :[{
      description:clean(request.requirement_text)||'Item solicitado',
      specification:clean(request.specification),
      quantity:request.quantity==null?null:Number(request.quantity),
      unit:clean(request.unit)
    }];

  const buyer={
    name:clean(rfq?.requester_name),
    company:clean(rfq?.company),
    type:clean(rfq?.buyer_type)
  };

  const proposalReference=clean(commercial_case?.proposal_ref);
  const requestReference=clean(request.public_ref)||clean(request.id);
  const total=Number(summary.sale_price_aoa);
  const totalLabel=moneyAOA(total);
  const location=clean(request.location);
  const neededBy=clean(request.needed_by);
  const notes=clean(rfq?.notes);

  const lines=[
    'PROPOSTA COMERCIAL',
    proposalReference?'Referência da proposta: '+proposalReference:'Referência da proposta: A atribuir',
    requestReference?'Referência do pedido: '+requestReference:null,
    buyer.company?'Cliente: '+buyer.company:buyer.name?'Cliente: '+buyer.name:null,
    buyer.company&&buyer.name?'Contacto do pedido: '+buyer.name:null,
    '',
    'OBJETO',
    clean(request.requirement_text)||items[0].description,
    '',
    'ITENS / ESCOPO',
    ...items.map(itemLine),
    '',
    'VALOR TOTAL PROPOSTO',
    totalLabel,
    '',
    'CONDIÇÕES COMERCIAIS',
    location?'Local de entrega/execução solicitado: '+location:'Local de entrega/execução: A confirmar',
    neededBy?'Data/necessidade indicada pelo cliente: '+neededBy:'Data/necessidade do cliente: A confirmar',
    'Prazo de entrega/execução HMATIAS: A confirmar',
    'Validade da proposta: A confirmar',
    'Condições de pagamento: A confirmar',
    notes?'Observações do pedido: '+notes:null,
    '',
    'Nota: esta minuta utiliza apenas dados confirmados no pedido e no caso comercial. Condições ainda não definidas permanecem explicitamente por confirmar.'
  ].filter(value=>value!==null);

  return {
    ready:true,
    missing_requirements:[],
    draft:{
      proposal_reference:proposalReference,
      request_reference:requestReference,
      buyer,
      title:'Proposta Comercial',
      subject:clean(request.requirement_text)||items[0].description,
      items,
      total_price_aoa:total,
      total_price_label:totalLabel,
      location,
      needed_by:neededBy,
      payment_terms:null,
      validity:null,
      delivery_commitment:null,
      text:lines.join('\n')
    }
  };
}

export async function getProposalDraft(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const payload=await buildCommercialCasePayload(env,requestId);
  if(!payload)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const rfq=await privateRfq(env,requestId);
  const proposal=buildProposalDraft({
    request:payload.request,
    commercial_case:payload.commercial_case,
    summary:payload.summary,
    rfq
  });
  return json(env,{
    ok:true,
    confidential:true,
    customer_facing_only:true,
    ...proposal
  });
}
