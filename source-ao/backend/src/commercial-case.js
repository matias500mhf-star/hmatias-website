import {isAdmin,normalizeRequirement,decryptPrivateText} from './sourcing.js';
import {scorePrivateSupplierMatch} from './private-sourcing-suppliers.js';
import {readSupplierOutreachRows,summarizeSupplierOutreach} from './supplier-outreach.js';

const QUALIFICATION_STATUSES=new Set(['pending','qualified','needs_info','declined']);
const PROPOSAL_STATUSES=new Set(['not_ready','ready','sent','revised','accepted','rejected','expired']);
const COST_STATUSES=new Set(['draft','verified','selected','rejected','expired']);

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
function id(prefix){return prefix+'_'+crypto.randomUUID().replaceAll('-','').slice(0,24);}

function clean(value,max=500,{allowNull=true}={}){
  if(value==null)return allowNull?null:'';
  if(typeof value!=='string'&&typeof value!=='number')throw new Error('invalid_text');
  const out=String(value).trim();
  if(out.length>max)throw new Error('text_too_long');
  return out||null;
}

function numeric(value,{allowNull=false,min=0,max=1e15}={}){
  if(value==null||value==='')return allowNull?null:0;
  const number=Number(value);
  if(!Number.isFinite(number)||number<min||number>max)throw new Error('invalid_number');
  return number;
}

function roundMoney(value){
  return Math.round((Number(value)+Number.EPSILON)*100)/100;
}

function parseJsonArray(value){
  try{
    const parsed=JSON.parse(value||'[]');
    return Array.isArray(parsed)?parsed:[];
  }catch{return [];}
}

export function calculateLandedCost(input={}){
  let currency;
  try{currency=String(input.currency||'AOA').trim().toUpperCase();}catch{return {ok:false,code:'invalid_currency'};}
  if(!/^[A-Z]{3}$/.test(currency))return {ok:false,code:'invalid_currency'};
  let material,transport,customs,tax,other,contingency,fx;
  try{
    material=numeric(input.material_cost,{min:0});
    transport=numeric(input.transport_cost,{min:0});
    customs=numeric(input.customs_cost,{min:0});
    tax=numeric(input.tax_cost,{min:0});
    other=numeric(input.other_cost,{min:0});
    contingency=numeric(input.contingency_cost,{min:0});
    fx=currency==='AOA'?1:numeric(input.fx_rate_to_aoa,{allowNull:true,min:0.0000001,max:1e12});
  }catch{return {ok:false,code:'invalid_cost'};}
  const sourceTotal=roundMoney(material+transport+customs+tax+other+contingency);
  const landed=fx==null?null:roundMoney(sourceTotal*fx);
  return {
    ok:true,
    currency,
    material_cost:material,
    transport_cost:transport,
    customs_cost:customs,
    tax_cost:tax,
    other_cost:other,
    contingency_cost:contingency,
    source_total:sourceTotal,
    fx_rate_to_aoa:fx,
    landed_cost_aoa:landed
  };
}

export function validateCostOptionInput(data={}){
  let supplierId,quoteRef,status,notes,verifiedAt;
  try{
    supplierId=clean(data.supplier_id,120,{allowNull:false});
    quoteRef=clean(data.supplier_quote_ref,160);
    status=clean(data.status,30)||'draft';
    notes=clean(data.notes,1200);
    verifiedAt=clean(data.cost_verified_at,80);
  }catch{return {ok:false,code:'invalid_fields'};}
  if(!supplierId)return {ok:false,code:'supplier_required'};
  if(!COST_STATUSES.has(status))return {ok:false,code:'invalid_cost_status'};
  const costs=calculateLandedCost(data);
  if(!costs.ok)return costs;
  if(['verified','selected'].includes(status)){
    if(costs.source_total<=0)return {ok:false,code:'verified_cost_required'};
    if(costs.currency!=='AOA'&&costs.fx_rate_to_aoa==null)return {ok:false,code:'fx_rate_required'};
  }
  return {ok:true,value:{
    supplier_id:supplierId,
    supplier_quote_ref:quoteRef,
    status,
    notes,
    cost_verified_at:verifiedAt,
    ...costs
  }};
}

export function calculateCommercialSummary(commercialCase={},costOptions=[]){
  const selectedId=commercialCase?.selected_cost_option_id||null;
  const selected=costOptions.find(option=>option.id===selectedId)||null;
  const saleRaw=commercialCase?.sale_price_aoa;
  const sale=saleRaw==null||saleRaw===''?null:Number(saleRaw);
  const landed=selected?.landed_cost_aoa==null?null:Number(selected.landed_cost_aoa);
  const profit=sale!=null&&Number.isFinite(sale)&&landed!=null&&Number.isFinite(landed)
    ?roundMoney(sale-landed):null;
  const margin=sale!=null&&sale>0&&profit!=null?Math.round((profit/sale)*10000)/100:null;
  const missing=[];
  if((commercialCase?.qualification_status||'pending')!=='qualified')missing.push('qualification_not_complete');
  if(!selected)missing.push('selected_cost_required');
  else if(!['verified','selected'].includes(selected.status))missing.push('verified_cost_required');
  if(selected&&landed==null)missing.push('fx_or_cost_required');
  if(sale==null||!Number.isFinite(sale)||sale<=0)missing.push('sale_price_required');
  return {
    selected_cost_option_id:selected?.id||null,
    selected_supplier_id:selected?.supplier_id||commercialCase?.selected_supplier_id||null,
    landed_cost_aoa:landed,
    sale_price_aoa:sale,
    gross_profit_aoa:profit,
    gross_margin_pct:margin,
    proposal_ready:missing.length===0,
    missing_requirements:missing,
    margin_alert:profit!=null&&profit<0?'negative_margin':null
  };
}


export function buildProposalDraft({request={},commercialCase={},summary={},rfq=null}={}){
  const commercialReady=summary?.proposal_ready===true;
  const validity=Number(commercialCase?.proposal_validity_days);
  const terms={
    validity_days:Number.isFinite(validity)&&validity>0?validity:null,
    payment_terms:commercialCase?.proposal_payment_terms||null,
    delivery_terms:commercialCase?.proposal_delivery_terms||null,
    tax_treatment:commercialCase?.proposal_tax_treatment||null
  };
  const missing=[];
  if(!commercialReady)missing.push('commercial_case_not_ready');
  if(!commercialCase?.proposal_ref)missing.push('proposal_reference_required');
  if(!terms.validity_days)missing.push('validity_required');
  if(!terms.payment_terms)missing.push('payment_terms_required');
  if(!terms.delivery_terms)missing.push('delivery_terms_required');
  if(!terms.tax_treatment)missing.push('tax_treatment_required');
  const items=Array.isArray(rfq?.items)&&rfq.items.length
    ?rfq.items.map(item=>({
      description:item.description,
      specification:item.specification||null,
      quantity:item.quantity,
      unit:item.unit
    }))
    :[{description:request.requirement_text||'Requirement',specification:request.specification||null,quantity:null,unit:null}];
  return {
    issuance_ready:missing.length===0,
    missing_requirements:missing,
    draft:{
      proposal_reference:commercialCase?.proposal_ref||null,
      source_request_reference:request.public_ref||request.id||null,
      customer_name:rfq?.requester_name||null,
      company:rfq?.company||null,
      buyer_type:rfq?.buyer_type||null,
      items,
      delivery_location:request.location||rfq?.location||null,
      requested_by:request.needed_by||rfq?.needed_by||null,
      currency:'AOA',
      total_price_aoa:summary?.sale_price_aoa??null,
      terms,
      customer_notes:commercialCase?.proposal_customer_notes||null
    }
  };
}

function hydrateCost(row){
  const calculated=calculateLandedCost(row);
  return {
    id:row.id,
    request_id:row.request_id,
    supplier_id:row.supplier_id,
    supplier_name:row.supplier_name||null,
    supplier_country_code:row.supplier_country_code||null,
    supplier_quote_ref:row.supplier_quote_ref,
    currency:row.currency,
    material_cost:Number(row.material_cost||0),
    transport_cost:Number(row.transport_cost||0),
    customs_cost:Number(row.customs_cost||0),
    tax_cost:Number(row.tax_cost||0),
    other_cost:Number(row.other_cost||0),
    contingency_cost:Number(row.contingency_cost||0),
    fx_rate_to_aoa:row.fx_rate_to_aoa==null?null:Number(row.fx_rate_to_aoa),
    source_total:calculated.ok?calculated.source_total:null,
    landed_cost_aoa:calculated.ok?calculated.landed_cost_aoa:null,
    status:row.status,
    cost_verified_at:row.cost_verified_at,
    notes:row.notes,
    created_at:row.created_at,
    updated_at:row.updated_at
  };
}

function hydrateCase(row){
  return row?{
    request_id:row.request_id,
    qualification_status:row.qualification_status,
    selected_supplier_id:row.selected_supplier_id,
    selected_cost_option_id:row.selected_cost_option_id,
    sale_price_aoa:row.sale_price_aoa==null?null:Number(row.sale_price_aoa),
    proposal_status:row.proposal_status,
    proposal_ref:row.proposal_ref,
    proposal_validity_days:row.proposal_validity_days==null?null:Number(row.proposal_validity_days),
    proposal_payment_terms:row.proposal_payment_terms,
    proposal_delivery_terms:row.proposal_delivery_terms,
    proposal_tax_treatment:row.proposal_tax_treatment,
    proposal_customer_notes:row.proposal_customer_notes,
    internal_notes:row.internal_notes,
    created_at:row.created_at,
    updated_at:row.updated_at
  }:{
    qualification_status:'pending',
    selected_supplier_id:null,
    selected_cost_option_id:null,
    sale_price_aoa:null,
    proposal_status:'not_ready',
    proposal_ref:null,
    proposal_validity_days:null,
    proposal_payment_terms:null,
    proposal_delivery_terms:null,
    proposal_tax_treatment:null,
    proposal_customer_notes:null,
    internal_notes:null
  };
}

async function requestRow(env,requestId){
  return env.SOURCE_AO_DB.prepare(
    'SELECT id,public_ref,requirement_text,normalized_search,category,specification,location,needed_by,status,created_at,updated_at FROM sourcing_requests WHERE id=?'
  ).bind(requestId).first();
}

async function candidateSuppliers(env,requirement){
  const rows=await env.SOURCE_AO_DB.prepare(
    'SELECT id,name,country_code,market_channel,supplier_role,location,capabilities_json,brands_json,quality_status,quality_evidence_json,availability_status,contact_hint,last_verified_at,updated_at FROM private_sourcing_suppliers ORDER BY updated_at DESC LIMIT 200'
  ).all();
  return (rows.results||[]).map(row=>{
    const supplier={
      id:row.id,
      name:row.name,
      country_code:row.country_code,
      market_channel:row.market_channel,
      supplier_role:row.supplier_role,
      location:row.location,
      capabilities:parseJsonArray(row.capabilities_json),
      brands:parseJsonArray(row.brands_json),
      quality_status:row.quality_status,
      quality_evidence:parseJsonArray(row.quality_evidence_json),
      availability_status:row.availability_status,
      contact_hint:row.contact_hint,
      last_verified_at:row.last_verified_at,
      updated_at:row.updated_at
    };
    return {...supplier,...scorePrivateSupplierMatch(requirement,supplier)};
  }).filter(s=>s.match_score>=20)
    .sort((a,b)=>b.match_score-a.match_score||b.quality_score-a.quality_score)
    .slice(0,10);
}

async function readCostOptions(env,requestId){
  const rows=await env.SOURCE_AO_DB.prepare(`
    SELECT c.*,s.name supplier_name,s.country_code supplier_country_code
    FROM sourcing_cost_options c
    LEFT JOIN private_sourcing_suppliers s ON s.id=c.supplier_id
    WHERE c.request_id=?
    ORDER BY
      CASE c.status WHEN 'selected' THEN 0 WHEN 'verified' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END,
      c.updated_at DESC
  `).bind(requestId).all();
  return (rows.results||[]).map(hydrateCost);
}

async function buildPayload(env,requestId){
  const request=await requestRow(env,requestId);
  if(!request)return null;
  const [caseRow,costOptions,matchedSuppliers,supplierOutreach]=await Promise.all([
    env.SOURCE_AO_DB.prepare('SELECT * FROM sourcing_commercial_cases WHERE request_id=?').bind(requestId).first(),
    readCostOptions(env,requestId),
    candidateSuppliers(env,normalizeRequirement([request.requirement_text,request.category,request.specification].filter(Boolean).join(' '))),
    readSupplierOutreachRows(env,requestId)
  ]);
  const suppliers=[...matchedSuppliers];
  for(const outreach of supplierOutreach){
    if(!suppliers.some(s=>s.id===outreach.supplier_id))suppliers.push({
      id:outreach.supplier_id,name:outreach.supplier_name,country_code:outreach.supplier_country_code,
      match_score:null,quality_status:'',availability_status:'',supplier_role:'outreach'
    });
  }
  if(caseRow?.selected_supplier_id&&!suppliers.some(s=>s.id===caseRow.selected_supplier_id)){
    const row=await env.SOURCE_AO_DB.prepare(
      'SELECT id,name,country_code,market_channel,supplier_role,location,capabilities_json,brands_json,quality_status,quality_evidence_json,availability_status,contact_hint,last_verified_at,updated_at FROM private_sourcing_suppliers WHERE id=?'
    ).bind(caseRow.selected_supplier_id).first();
    if(row){
      const supplier={
        id:row.id,name:row.name,country_code:row.country_code,market_channel:row.market_channel,
        supplier_role:row.supplier_role,location:row.location,capabilities:parseJsonArray(row.capabilities_json),
        brands:parseJsonArray(row.brands_json),quality_status:row.quality_status,
        quality_evidence:parseJsonArray(row.quality_evidence_json),availability_status:row.availability_status,
        contact_hint:row.contact_hint,last_verified_at:row.last_verified_at,updated_at:row.updated_at
      };
      suppliers.push({...supplier,...scorePrivateSupplierMatch(request.requirement_text,supplier)});
    }
  }
  const commercialCase={request_id:requestId,...hydrateCase(caseRow)};
  return {
    ok:true,
    confidential:true,
    request,
    commercial_case:commercialCase,
    summary:calculateCommercialSummary(commercialCase,costOptions),
    cost_options:costOptions,
    supplier_outreach:supplierOutreach,
    supplier_outreach_summary:summarizeSupplierOutreach(supplierOutreach),
    supplier_candidates:suppliers
  };
}

export async function getCommercialCase(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const payload=await buildPayload(env,requestId);
  if(!payload)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  return json(env,payload);
}

export async function upsertCostOption(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  if(!await requestRow(env,requestId))return fail(env,404,'request_not_found','Sourcing request does not exist.');
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  const validated=validateCostOptionInput(data);
  if(!validated.ok)return fail(env,400,validated.code,'Check supplier, currency and cost fields.');
  const v=validated.value;
  const supplier=await env.SOURCE_AO_DB.prepare('SELECT id FROM private_sourcing_suppliers WHERE id=?').bind(v.supplier_id).first();
  if(!supplier)return fail(env,400,'supplier_not_found','Selected private supplier does not exist.');
  let optionId;
  try{optionId=clean(data.id,120)||id('cost');}catch{return fail(env,400,'invalid_cost_option_id','Cost option ID is invalid.');}
  const existing=await env.SOURCE_AO_DB.prepare('SELECT id,request_id FROM sourcing_cost_options WHERE id=?').bind(optionId).first();
  if(existing&&existing.request_id!==requestId)return fail(env,409,'cost_option_conflict','Cost option belongs to another request.');
  const verifiedAt=['verified','selected'].includes(v.status)?(v.cost_verified_at||nowIso()):v.cost_verified_at;
  const timestamp=nowIso();
  const statements=[
    env.SOURCE_AO_DB.prepare(`
      INSERT INTO sourcing_cost_options(
        id,request_id,supplier_id,supplier_quote_ref,currency,material_cost,transport_cost,customs_cost,tax_cost,
        other_cost,contingency_cost,fx_rate_to_aoa,status,cost_verified_at,notes,created_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        supplier_id=excluded.supplier_id,supplier_quote_ref=excluded.supplier_quote_ref,currency=excluded.currency,
        material_cost=excluded.material_cost,transport_cost=excluded.transport_cost,customs_cost=excluded.customs_cost,
        tax_cost=excluded.tax_cost,other_cost=excluded.other_cost,contingency_cost=excluded.contingency_cost,
        fx_rate_to_aoa=excluded.fx_rate_to_aoa,status=excluded.status,cost_verified_at=excluded.cost_verified_at,
        notes=excluded.notes,updated_at=excluded.updated_at
    `).bind(
      optionId,requestId,v.supplier_id,v.supplier_quote_ref,v.currency,v.material_cost,v.transport_cost,v.customs_cost,
      v.tax_cost,v.other_cost,v.contingency_cost,v.fx_rate_to_aoa,v.status,verifiedAt,v.notes,timestamp,timestamp
    )
  ];
  if(v.status==='selected'){
    statements.push(env.SOURCE_AO_DB.prepare(
      "UPDATE sourcing_cost_options SET status='verified',updated_at=? WHERE request_id=? AND id<>? AND status='selected'"
    ).bind(timestamp,requestId,optionId));
    statements.push(env.SOURCE_AO_DB.prepare(`
      INSERT INTO sourcing_commercial_cases(request_id,selected_supplier_id,selected_cost_option_id,updated_at)
      VALUES(?,?,?,?)
      ON CONFLICT(request_id) DO UPDATE SET
        selected_supplier_id=excluded.selected_supplier_id,
        selected_cost_option_id=excluded.selected_cost_option_id,
        updated_at=excluded.updated_at
    `).bind(requestId,v.supplier_id,optionId,timestamp));
  }
  await env.SOURCE_AO_DB.batch(statements);
  return json(env,await buildPayload(env,requestId),existing?200:201);
}

export async function updateCommercialCase(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const sourceRequest=await requestRow(env,requestId);
  if(!sourceRequest)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  let data;
  try{data=await request.json();}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  const existing=hydrateCase(await env.SOURCE_AO_DB.prepare('SELECT * FROM sourcing_commercial_cases WHERE request_id=?').bind(requestId).first());
  let qualification,proposalStatus,selectedSupplier,selectedCost,salePrice,proposalRef,validityDays,paymentTerms,deliveryTerms,taxTreatment,customerNotes,notes;
  try{
    qualification=data.qualification_status===undefined?existing.qualification_status:clean(data.qualification_status,30);
    proposalStatus=data.proposal_status===undefined?existing.proposal_status:clean(data.proposal_status,30);
    selectedSupplier=data.selected_supplier_id===undefined?existing.selected_supplier_id:clean(data.selected_supplier_id,120);
    selectedCost=data.selected_cost_option_id===undefined?existing.selected_cost_option_id:clean(data.selected_cost_option_id,120);
    salePrice=data.sale_price_aoa===undefined?existing.sale_price_aoa:numeric(data.sale_price_aoa,{allowNull:true,min:0});
    proposalRef=data.proposal_ref===undefined?existing.proposal_ref:clean(data.proposal_ref,160);
    validityDays=data.proposal_validity_days===undefined?existing.proposal_validity_days:numeric(data.proposal_validity_days,{allowNull:true,min:1,max:365});
    paymentTerms=data.proposal_payment_terms===undefined?existing.proposal_payment_terms:clean(data.proposal_payment_terms,500);
    deliveryTerms=data.proposal_delivery_terms===undefined?existing.proposal_delivery_terms:clean(data.proposal_delivery_terms,500);
    taxTreatment=data.proposal_tax_treatment===undefined?existing.proposal_tax_treatment:clean(data.proposal_tax_treatment,500);
    customerNotes=data.proposal_customer_notes===undefined?existing.proposal_customer_notes:clean(data.proposal_customer_notes,1200);
    notes=data.internal_notes===undefined?existing.internal_notes:clean(data.internal_notes,1600);
  }catch{return fail(env,400,'invalid_fields','Commercial case fields are invalid.');}
  if(!QUALIFICATION_STATUSES.has(qualification))return fail(env,400,'invalid_qualification_status','Unsupported qualification status.');
  if(!PROPOSAL_STATUSES.has(proposalStatus))return fail(env,400,'invalid_proposal_status','Unsupported proposal status.');
  if(validityDays!=null&&!Number.isInteger(validityDays))return fail(env,400,'invalid_validity_days','Proposal validity must be a whole number of days.');

  if(selectedSupplier){
    const supplier=await env.SOURCE_AO_DB.prepare('SELECT id FROM private_sourcing_suppliers WHERE id=?').bind(selectedSupplier).first();
    if(!supplier)return fail(env,400,'supplier_not_found','Selected private supplier does not exist.');
  }

  let selectedCostStatus=null;
  if(selectedCost){
    const cost=await env.SOURCE_AO_DB.prepare('SELECT id,supplier_id,status FROM sourcing_cost_options WHERE id=? AND request_id=?').bind(selectedCost,requestId).first();
    if(!cost)return fail(env,400,'cost_option_not_found','Selected cost option does not exist for this request.');
    if(selectedSupplier&&selectedSupplier!==cost.supplier_id)return fail(env,400,'supplier_cost_mismatch','Selected supplier does not match selected cost option.');
    selectedSupplier=cost.supplier_id;
    selectedCostStatus=cost.status;
  }

  const previewCase={
    request_id:requestId,
    qualification_status:qualification,
    selected_supplier_id:selectedSupplier,
    selected_cost_option_id:selectedCost,
    sale_price_aoa:salePrice,
    proposal_status:proposalStatus,
    proposal_ref:proposalRef,
    proposal_validity_days:validityDays,
    proposal_payment_terms:paymentTerms,
    proposal_delivery_terms:deliveryTerms,
    proposal_tax_treatment:taxTreatment,
    proposal_customer_notes:customerNotes,
    internal_notes:notes
  };
  const costs=await readCostOptions(env,requestId);
  const summary=calculateCommercialSummary(previewCase,costs);
  const proposalPack=buildProposalDraft({request:sourceRequest,commercialCase:previewCase,summary});
  if(['ready','sent','revised','accepted'].includes(proposalStatus)&&!proposalPack.issuance_ready){
    return fail(env,409,'proposal_not_ready','Qualification, verified cost, sale price and complete proposal terms are required before proposal progression.');
  }

  const timestamp=nowIso();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO sourcing_commercial_cases(
      request_id,qualification_status,selected_supplier_id,selected_cost_option_id,sale_price_aoa,
      proposal_status,proposal_ref,proposal_validity_days,proposal_payment_terms,proposal_delivery_terms,
      proposal_tax_treatment,proposal_customer_notes,internal_notes,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(request_id) DO UPDATE SET
      qualification_status=excluded.qualification_status,
      selected_supplier_id=excluded.selected_supplier_id,
      selected_cost_option_id=excluded.selected_cost_option_id,
      sale_price_aoa=excluded.sale_price_aoa,
      proposal_status=excluded.proposal_status,
      proposal_ref=excluded.proposal_ref,
      proposal_validity_days=excluded.proposal_validity_days,
      proposal_payment_terms=excluded.proposal_payment_terms,
      proposal_delivery_terms=excluded.proposal_delivery_terms,
      proposal_tax_treatment=excluded.proposal_tax_treatment,
      proposal_customer_notes=excluded.proposal_customer_notes,
      internal_notes=excluded.internal_notes,
      updated_at=excluded.updated_at
  `).bind(
    requestId,qualification,selectedSupplier,selectedCost,salePrice,proposalStatus,proposalRef,validityDays,
    paymentTerms,deliveryTerms,taxTreatment,customerNotes,notes,timestamp,timestamp
  ).run();

  if(selectedCost&&['verified','selected'].includes(selectedCostStatus)){
    await env.SOURCE_AO_DB.prepare(
      "UPDATE sourcing_cost_options SET status=CASE WHEN id=? THEN 'selected' WHEN status='selected' THEN 'verified' ELSE status END,updated_at=? WHERE request_id=?"
    ).bind(selectedCost,timestamp,requestId).run();
  }

  return json(env,await buildPayload(env,requestId));
}

export async function getProposalDraft(request,env,requestId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const payload=await buildPayload(env,requestId);
  if(!payload)return fail(env,404,'request_not_found','Sourcing request does not exist.');
  const privateRow=await env.SOURCE_AO_DB.prepare(
    'SELECT rfq_details_encrypted FROM sourcing_requests WHERE id=?'
  ).bind(requestId).first();
  let rfq=null;
  if(privateRow?.rfq_details_encrypted&&privateRow.rfq_details_encrypted!=='PURGED'){
    try{rfq=JSON.parse(await decryptPrivateText(privateRow.rfq_details_encrypted,env.PII_ENCRYPTION_KEY));}catch{rfq=null;}
  }
  const proposal=buildProposalDraft({
    request:payload.request,
    commercialCase:payload.commercial_case,
    summary:payload.summary,
    rfq
  });
  return json(env,{ok:true,confidential:true,...proposal});
}
