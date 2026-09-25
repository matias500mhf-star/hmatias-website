import {normalizeSearch} from './index.js';

const PRODUCT_FAMILIES = [
  {
    id:'packaging-strapping',
    category:'industrial-supply',
    name_en:'Packaging strapping',
    name_pt:'Cintas e fitas de arqueação',
    triggers:[
      'cinta','cinta pp','cinta de arquear','cinta de arqueacao','cinta de arqueação',
      'fita de arquear','fita de arqueacao','fita de arqueação','fita pp','polipropileno',
      'pp strap','pp strapping','polypropylene strap','polypropylene strapping','strapping'
    ],
    variants:[
      'cinta de arquear em polipropileno',
      'cinta de arqueação PP',
      'fita de arquear PP',
      'fita de arqueação em polipropileno',
      'PP strapping',
      'polypropylene strapping',
      'PP strap'
    ],
    supplier_terms:[
      'embalagens industriais','packaging','plásticos industriais','plasticos industriais',
      'consumíveis de embalagem','consumiveis de embalagem','fornecedor industrial'
    ]
  },
  {
    id:'formaldehyde-chemical',
    category:'industrial-supply',
    name_en:'Formaldehyde / formalin',
    name_pt:'Formaldeído / formol',
    triggers:[
      'formaldehyde','formaldeido','formaldeído','formol','formalin','formaldehyde 37',
      'formaldeido 37','formaldeído 37','formol 37','cas 50 00 0','50-00-0'
    ],
    variants:[
      'formaldeído 30-35%',
      'formaldeído 37%',
      'formol 37%',
      'formalin 37%',
      'formaldehyde solution',
      'formaldehyde 37%',
      'CAS 50-00-0'
    ],
    supplier_terms:[
      'produtos químicos laboratoriais','produtos quimicos laboratoriais','químicos industriais',
      'quimicos industriais','reagentes laboratório','reagentes laboratorio','chemical supplier'
    ]
  },
  {
    id:'construction-materials',
    category:'construction',
    name_en:'Construction materials',
    name_pt:'Materiais de construção',
    triggers:['cimento','cement','bloco','block','argamassa','mortar','tinta','paint','tubo','pipe','chapa','sheet','varao','varão','rebar'],
    variants:['materiais de construção','construction materials','fornecedor de materiais de construção'],
    supplier_terms:['materiais de construção','construction supplier','ferragens','distribuidor']
  },
  {
    id:'hvac-electrical',
    category:'hvac-electrical',
    name_en:'HVAC & electrical',
    name_pt:'Climatização e elétrica',
    triggers:['ar condicionado','air conditioner','hvac','split','btu','cabo','cable','disjuntor','breaker','gerador','generator'],
    variants:['HVAC Angola','material elétrico','electrical supplies'],
    supplier_terms:['climatização','AVAC','material elétrico','electrical supplier']
  },
  {
    id:'tools-equipment',
    category:'tools-equipment',
    name_en:'Tools & equipment',
    name_pt:'Ferramentas e equipamentos',
    triggers:['ferramenta','tool','berbequim','drill','maquina','máquina','machine','equipamento','equipment','rebarbadora','grinder'],
    variants:['ferramentas industriais','industrial tools','equipamentos'],
    supplier_terms:['ferramentas','equipamentos industriais','industrial supplier']
  }
];

const URGENCY_TERMS = ['urgente','hoje','imediato','imediata','asap','today','same day','agora'];

function unique(values){
  return [...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))];
}

function normalized(value){
  return normalizeSearch(String(value||''));
}

function detectFamily(query){
  const q=normalized(query);
  let best=null;
  let score=0;
  for(const family of PRODUCT_FAMILIES){
    const hits=family.triggers.filter(term=>q.includes(normalized(term))).length;
    if(hits>score){score=hits;best=family;}
  }
  return best?{family:best,score}:null;
}

function extractSpecs(query){
  const source=String(query||'');
  const dimensions=unique((source.match(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|ml|l|g|kg|kw|kva|btu)\b/gi)||[])
    .map(v=>v.replace(/\s+/g,'').toLowerCase()));
  const quantityMatch=source.match(/\b(\d+(?:[.,]\d+)?)\s*(rolos?|rolls?|unidades?|units?|pcs?|peças?|pecas?)\b/i);
  return {
    dimensions,
    quantity:quantityMatch?{
      value:Number(quantityMatch[1].replace(',','.')),
      unit:quantityMatch[2].toLowerCase()
    }:null
  };
}

function detectUrgency(query,neededBy=''){
  const q=normalized([query,neededBy].filter(Boolean).join(' '));
  return URGENCY_TERMS.some(term=>q.includes(normalized(term)))?'urgent':'standard';
}

function buildVariants(query,location,family,specs){
  const clean=String(query||'').trim();
  const loc=String(location||'Luanda').trim()||'Luanda';
  const specsText=specs.dimensions.join(' ');
  const base=[
    clean,
    `${clean} ${loc}`,
    `${clean} Angola`,
    `${clean} fornecedor ${loc}`,
    `${clean} supplier Angola`
  ];
  if(family){
    for(const alias of family.variants){
      base.push([alias,specsText,loc].filter(Boolean).join(' '));
      base.push([alias,specsText,'Angola'].filter(Boolean).join(' '));
    }
    for(const term of family.supplier_terms){
      base.push([term,loc].filter(Boolean).join(' '));
    }
  }
  return unique(base).slice(0,24);
}

export function buildSmartSearchPlan({query,location='Luanda',neededBy='',quantity=null}={}){
  const clean=String(query||'').trim();
  if(clean.length<2||clean.length>180) throw new Error('invalid_query');
  const loc=String(location||'Luanda').trim();
  if(loc.length>120) throw new Error('invalid_location');

  const detected=detectFamily(clean);
  const family=detected?.family||null;
  const specs=extractSpecs(clean);
  const urgency=detectUrgency(clean,neededBy);
  const suppliedQuantity=quantity==null||quantity===''?null:Number(quantity);
  const effectiveQuantity=Number.isFinite(suppliedQuantity)?suppliedQuantity:specs.quantity?.value??null;
  const variants=buildVariants(clean,loc,family,specs);

  return {
    query:clean,
    normalized_query:normalized(clean),
    location:loc,
    intent:'source_product_or_service',
    urgency,
    interpretation:{
      family_id:family?.id||'general-sourcing',
      category:family?.category||'general',
      label_en:family?.name_en||'General sourcing',
      label_pt:family?.name_pt||'Sourcing geral',
      semantic_match:family?(detected.score>=2?'high':'medium'):'general',
      specifications:specs.dimensions,
      quantity:effectiveQuantity
    },
    query_variants:variants,
    search_lanes:[
      {
        id:'verified-index',
        priority:1,
        action:'search_verified_index',
        purpose:'Check Source AO verified observations first.'
      },
      {
        id:'local-supplier-discovery',
        priority:2,
        action:'discover_local_suppliers',
        purpose:'Search company sites, business directories and public supplier pages using semantic variants.'
      },
      {
        id:'direct-verification',
        priority:3,
        action:'request_supplier_confirmation',
        purpose:urgency==='urgent'
          ?'Confirm stock, price, location and same-day availability directly with likely suppliers.'
          :'Confirm stock, price, location and delivery timing directly with likely suppliers.'
      },
      {
        id:'regional-fallback',
        priority:4,
        action:'expand_region_if_needed',
        purpose:'Only after Angola is exhausted, expand to nearby/import markets and label the result as import sourcing.'
      }
    ],
    verification_required:['stock','price','commercial_availability','delivery_time'],
    claims:{
      stock_confirmed:false,
      price_confirmed:false,
      supplier_availability_confirmed:false
    },
    next_action:urgency==='urgent'
      ?'Run local supplier discovery immediately and send a concise RFQ to the strongest candidates.'
      :'Run verified search, then supplier discovery and direct confirmation where required.'
  };
}

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

export async function smartSearchPlan(request,env){
  const url=new URL(request.url);
  const query=(url.searchParams.get('q')||'').trim();
  const location=(url.searchParams.get('location')||'Luanda').trim();
  const neededBy=(url.searchParams.get('needed_by')||'').trim();
  const quantity=url.searchParams.get('quantity');
  try{
    const plan=buildSmartSearchPlan({query,location,neededBy,quantity});
    return json(env,{ok:true,engine:'source-ao-smart-search-v2',plan});
  }catch(error){
    const code=error instanceof Error?error.message:'invalid_query';
    return json(env,{ok:false,error:{code,message:code==='invalid_location'?'Location is too long.':'Search query must contain 2 to 180 characters.'}},400);
  }
}
