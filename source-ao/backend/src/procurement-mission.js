import {buildSmartSearchPlan} from './smart-search.js';
import {effectiveObservationStatus,normalizeSearch} from './index.js';

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

const parseJson=(value,fallback=[])=>{
  try{return JSON.parse(value||'[]')}catch{return fallback}
};

const unique=values=>[...new Set(values.filter(Boolean))];

function tokenSet(value){
  return new Set(normalizeSearch(value).split(/\s+/).filter(token=>token.length>2));
}

export function scoreSupplierCandidate(plan,supplier){
  const capabilities=parseJson(supplier.capabilities_json,[]);
  const source=[supplier.name,...capabilities].join(' ');
  const supplierTokens=tokenSet(source);
  const intentTokens=tokenSet([plan.query,...plan.query_variants].join(' '));
  let hits=0;
  for(const token of intentTokens) if(supplierTokens.has(token)) hits++;
  const categoryMatch=parseJson(supplier.categories_json,[]).includes(plan.interpretation.category);
  const contactBonus=(supplier.whatsapp||supplier.phone||supplier.email)?3:0;
  return (categoryMatch?10:0)+Math.min(hits*4,40)+contactBonus;
}

export function buildRfq(plan,{neededBy='',quantity=null}={}){
  const qty=quantity??plan.interpretation.quantity;
  const specs=plan.interpretation.specifications||[];
  const quantityLine=qty!=null?String(qty):'a confirmar';
  const specLine=specs.length?specs.join(', '):'conforme descrição';
  const deadline=neededBy|| (plan.urgency==='urgent'?'urgente / disponibilidade imediata':'a confirmar');

  const pt=[
    'Boa tarde.',
    'Solicitamos confirmação de disponibilidade e cotação para o seguinte material:',
    `Produto: ${plan.query}`,
    `Especificação: ${specLine}`,
    `Quantidade: ${quantityLine}`,
    `Destino: ${plan.location}`,
    `Necessidade: ${deadline}`,
    '',
    'Por favor confirme: stock atual, preço, unidade/embalagem, localização do levantamento e prazo de entrega.',
    'Caso não tenham a referência exata, agradecemos indicação de alternativa compatível.'
  ].join('\n');

  const en=[
    'Good afternoon.',
    'Please confirm availability and quotation for the following requirement:',
    `Product: ${plan.query}`,
    `Specification: ${specLine}`,
    `Quantity: ${quantityLine}`,
    `Destination: ${plan.location}`,
    `Required: ${deadline}`,
    '',
    'Please confirm: current stock, price, unit/packaging, pickup location and delivery lead time.',
    'If the exact reference is unavailable, please indicate a compatible alternative.'
  ].join('\n');

  return {pt,en};
}

function mapObservation(row,now=Date.now()){
  const status=effectiveObservationStatus(row,now);
  return {
    item:{
      id:row.item_id,
      name:row.item_name,
      specification:row.item_specification
    },
    supplier:{
      id:row.supplier_id,
      name:row.supplier_name,
      location:row.supplier_location,
      website:row.supplier_website,
      phone:row.supplier_phone||null,
      whatsapp:row.supplier_whatsapp||null,
      email:row.supplier_email||null
    },
    status,
    source_type:row.source_type,
    verified_at:row.verified_at,
    expires_at:row.expires_at,
    quantity_reported:row.quantity_reported??null,
    price:row.price_reported==null?null:{amount:row.price_reported,currency:row.currency}
  };
}

export async function buildProcurementMission(env,{query,location='Luanda',neededBy='',quantity=null}={}){
  const plan=buildSmartSearchPlan({query,location,neededBy,quantity});
  const normalizedLocation=normalizeSearch(plan.location);
  const locationLike=`%${normalizedLocation}%`;
  const exact=[];

  if(plan.interpretation.item_id){
    const rows=await env.SOURCE_AO_DB.prepare(`
      SELECT i.id item_id,i.name item_name,i.specification item_specification,
             s.id supplier_id,s.name supplier_name,s.location supplier_location,s.website supplier_website,
             s.phone supplier_phone,s.whatsapp supplier_whatsapp,s.email supplier_email,
             o.verification_status,o.quantity_reported,o.price_reported,o.currency,o.verified_at,o.expires_at,o.source_type
      FROM observations o
      JOIN items i ON i.id=o.item_id
      JOIN suppliers s ON s.id=o.supplier_id
      WHERE o.item_id=?
        AND o.approved_at IS NOT NULL
        AND (?='angola' OR lower(coalesce(o.location,s.location,'')) LIKE ?)
      ORDER BY o.verified_at DESC
      LIMIT 8
    `).bind(plan.interpretation.item_id,normalizedLocation,locationLike).all();
    exact.push(...(rows.results||[]).map(row=>mapObservation(row)));
  }

  const exactSupplierIds=new Set(exact.map(row=>row.supplier.id));
  const categoryLike=`%"${plan.interpretation.category}"%`;
  const candidates=[];

  if(plan.interpretation.category&&plan.interpretation.category!=='general'){
    const rows=await env.SOURCE_AO_DB.prepare(`
      SELECT id,name,location,website,public_status,last_verified_at,categories_json,capabilities_json,phone,whatsapp,email
      FROM suppliers
      WHERE categories_json LIKE ?
        AND (?='angola' OR lower(location) LIKE ?)
      ORDER BY last_verified_at DESC
      LIMIT 40
    `).bind(categoryLike,normalizedLocation,locationLike).all();

    for(const supplier of rows.results||[]){
      if(exactSupplierIds.has(supplier.id)) continue;
      const score=scoreSupplierCandidate(plan,supplier);
      if(score<10) continue;
      candidates.push({
        id:supplier.id,
        name:supplier.name,
        location:supplier.location,
        website:supplier.website,
        phone:supplier.phone||null,
        whatsapp:supplier.whatsapp||null,
        email:supplier.email||null,
        capabilities:parseJson(supplier.capabilities_json,[]),
        status:'supplier_candidate',
        exact_product_confirmed:false,
        candidate_score:score,
        source_checked_at:supplier.last_verified_at
      });
    }
  }

  candidates.sort((a,b)=>b.candidate_score-a.candidate_score||String(a.name).localeCompare(String(b.name)));
  const shortlist=candidates.slice(0,8);
  const contactable=shortlist.filter(s=>s.whatsapp||s.phone||s.email||s.website);
  const exactCommercial=exact.some(row=>['in_stock_confirmed','supplier_confirmed'].includes(row.status));
  const exactSource=exact.length>0;
  const missionStatus=exactCommercial
    ?'commercial_confirmation_available'
    : exactSource
      ?'exact_source_found_confirmation_needed'
      : shortlist.length
        ?'supplier_shortlist_ready'
        :'broader_discovery_needed';

  const rfq=buildRfq(plan,{neededBy,quantity});
  return {
    mission_id:`mission_${crypto.randomUUID()}`,
    created_at:new Date().toISOString(),
    status:missionStatus,
    urgency:plan.urgency,
    interpretation:plan.interpretation,
    requirement:{
      query:plan.query,
      location:plan.location,
      needed_by:neededBy||null,
      quantity:quantity??plan.interpretation.quantity??null,
      specifications:plan.interpretation.specifications
    },
    exact_matches:exact,
    supplier_candidates:shortlist,
    contactable_candidates:contactable.length,
    rfq,
    verification_required:unique(plan.verification_required),
    fast_path:contactable[0]?{
      supplier_id:contactable[0].id,
      supplier_name:contactable[0].name,
      preferred_channel:contactable[0].whatsapp?'whatsapp':contactable[0].phone?'phone':contactable[0].email?'email':'website'
    }:null,
    truth_rule:'Supplier candidate does not mean exact product or stock is confirmed. Commercial claims require current traceable confirmation.'
  };
}

export async function procurementMission(request,env){
  const url=new URL(request.url);
  const query=(url.searchParams.get('q')||'').trim();
  const location=(url.searchParams.get('location')||'Luanda').trim();
  const neededBy=(url.searchParams.get('needed_by')||'').trim();
  const rawQuantity=url.searchParams.get('quantity');
  const quantity=rawQuantity==null||rawQuantity===''?null:Number(rawQuantity);
  if(quantity!=null&&(!Number.isFinite(quantity)||quantity<0)){
    return fail(env,400,'invalid_quantity','Quantity must be a positive number.');
  }
  try{
    const mission=await buildProcurementMission(env,{query,location,neededBy,quantity});
    return json(env,{ok:true,engine:'source-ao-procurement-mission-v1',mission});
  }catch(error){
    const code=error instanceof Error?error.message:'mission_failed';
    if(code==='invalid_query') return fail(env,400,code,'Search query must contain 2 to 180 characters.');
    if(code==='invalid_location') return fail(env,400,code,'Location is too long.');
    throw error;
  }
}
