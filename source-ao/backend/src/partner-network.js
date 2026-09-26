import {isAdmin,normalizeSearch} from './index.js';

const PARTNER_TYPES=new Set(['strategic_partner','supplier','subcontractor','service_provider','technical_partner','commercial_intermediary']);
const STAGES=new Set(['introduced','under_review','approved','active','paused','archived']);
const CHANNELS=new Set(['whatsapp','email','document','manual']);
const COUNTRIES=new Set(['AO','NA','ZA']);

const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
}});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);
const parse=(v,f=[])=>{try{return JSON.parse(v||'[]')}catch{return f}};
const clean=(v,n=500)=>{
  if(v==null)return null;
  const s=String(v).trim();
  if(!s)return null;
  if(s.length>n)throw new Error('value_too_long');
  return s;
};
const uniq=list=>[...new Set(list.filter(Boolean))];
const normal=value=>normalizeSearch(String(value||'')).replace(/\s+/g,' ').trim();
const safeUrl=value=>{
  if(!value)return null;
  try{
    const u=new URL(value);
    return ['http:','https:'].includes(u.protocol)?u.toString():null;
  }catch{return null}
};
const arrayInput=(value,max=30)=>Array.isArray(value)
  ?uniq(value.map(x=>clean(x,100)).filter(Boolean)).slice(0,max)
  :[];

const buckets=[
  {
    id:'cleaning',
    patterns:['cleaning','limpeza','higiene','sanitation','hygiene','detergent','desinfetante'],
    capabilities:['cleaning','hygiene','sanitation','facility-cleaning','maintenance-support']
  },
  {
    id:'construction',
    patterns:['construction','construcao','obra','civil works','reabilitacao','rehabilitation','painting','pintura','remodelling','remodelacao'],
    capabilities:['construction','painting','remodelling','site-labour','drywall','plasterboard','false-ceilings','plastering','interior-finishes','wooden-doors','wooden-windows','joinery','installation']
  },
  {
    id:'interiors',
    patterns:['furniture','mobiliario','interior','divisoria','partition','flooring','pavimento','ceiling','tecto','acoustic','acustic','kitchen','cozinha','curtain','cortinado','blind','estore'],
    capabilities:['interiors','furniture','office-furniture','partitions','vinyl-flooring','technical-flooring','metal-ceilings','acoustic-solutions','decorative-surfaces','custom-kitchens','blinds-curtains']
  },
  {
    id:'uniforms',
    patterns:['uniform','fardamento','workwear','vestuario'],
    capabilities:['uniforms','workwear','corporate-uniforms','construction-workwear','security-uniforms','hospitality-uniforms','healthcare-uniforms','sportswear']
  },
  {
    id:'ppe',
    patterns:['ppe','epi','protective equipment','equipamento de protecao','safety equipment'],
    capabilities:['ppe','epi','consumables','materials','equipment','sourcing','rfq-response']
  },
  {
    id:'chemicals',
    patterns:['chemical','quimic','reagent','reagente','formaldehyde','formaldeido'],
    capabilities:['chemical-supply','industrial-chemicals','formaldehyde','reagents','stock-supply']
  },
  {
    id:'hr',
    patterns:['recruitment','recrutamento','manpower','payroll','immigration','imigracao','work permit','expatriate','local content','recursos humanos'],
    capabilities:['recruitment','manpower','hr-outsourcing','payroll','immigration','work-permits','expatriate-mobilization','local-content','business-representation']
  }
];

function hydrate(row){
  return {
    id:row.id,
    name:row.name,
    country_code:row.country_code,
    partner_type:row.partner_type,
    relationship_stage:row.relationship_stage,
    source_channel:row.source_channel,
    locality:row.locality,
    website:row.website,
    capabilities:parse(row.capabilities_json,[]),
    sectors:parse(row.sectors_json,[]),
    source_note:row.source_note,
    last_interaction_at:row.last_interaction_at,
    updated_at:row.updated_at
  };
}

function stageScore(stage){
  return {active:18,approved:14,under_review:8,introduced:4,paused:-15,archived:-100}[stage]||0;
}

export function scoreCommercialPartner(record,partner){
  const hay=normal([
    record?.title,record?.sector,record?.scope_summary,record?.evidence_excerpt,
    ...(Array.isArray(record?.fit_tags)?record.fit_tags:[])
  ].filter(Boolean).join(' '));
  const caps=(partner.capabilities||[]).map(normal);
  const sectors=(partner.sectors||[]).map(normal);
  let score=stageScore(partner.relationship_stage);
  const reasons=[];
  const matched=[];

  for(const bucket of buckets){
    if(!bucket.patterns.some(pattern=>hay.includes(normal(pattern))))continue;
    const hits=bucket.capabilities.filter(cap=>caps.includes(normal(cap)));
    if(hits.length){
      score+=Math.min(52,26+hits.length*7);
      matched.push(...hits);
      reasons.push(bucket.id);
    }
  }

  const recordSector=normal(record?.sector);
  if(recordSector&&sectors.some(s=>s===recordSector||recordSector.includes(s)||s.includes(recordSector))){
    score+=22;
    reasons.push('sector');
  }

  const type=normal(record?.opportunity_type||record?.type);
  if((type.includes('supply')||type.includes('rfq'))&&partner.partner_type==='supplier'){
    score+=14;reasons.push('supplier');
  }
  if((type.includes('subcontract')||type.includes('maintenance')||type.includes('small contract'))&&['subcontractor','service_provider'].includes(partner.partner_type)){
    score+=12;reasons.push('execution');
  }

  const opportunityCountry=String(record?.country_code||'AO').toUpperCase();
  if(partner.country_code===opportunityCountry){score+=8;reasons.push('same-market');}
  else if(opportunityCountry!=='AO'){reasons.push('cross-border-review');}

  return {
    score:Math.max(0,Math.min(100,Math.round(score))),
    matched_capabilities:uniq(matched),
    reasons:uniq(reasons)
  };
}

export async function matchCommercialPartners(env,record,{limit=6}={}){
  const rows=await env.SOURCE_AO_DB.prepare(
    "SELECT * FROM commercial_partners WHERE relationship_stage NOT IN ('paused','archived') ORDER BY name ASC"
  ).all();
  return (rows.results||[])
    .map(hydrate)
    .map(partner=>({partner,...scoreCommercialPartner(record,partner)}))
    .filter(x=>x.score>=24)
    .sort((a,b)=>b.score-a.score||a.partner.name.localeCompare(b.partner.name))
    .slice(0,Math.max(1,Math.min(12,Number(limit)||6)))
    .map(x=>({
      id:x.partner.id,
      name:x.partner.name,
      partner_type:x.partner.partner_type,
      relationship_stage:x.partner.relationship_stage,
      country_code:x.partner.country_code,
      locality:x.partner.locality,
      website:x.partner.website,
      match_score:x.score,
      matched_capabilities:x.matched_capabilities,
      reasons:x.reasons
    }));
}

export async function listCommercialPartners(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url);
  const stage=clean(url.searchParams.get('stage'),30);
  const type=clean(url.searchParams.get('type'),40);
  const params=[];
  const where=[];
  if(stage){
    if(!STAGES.has(stage))return fail(env,400,'invalid_stage','Unsupported relationship stage.');
    where.push('relationship_stage=?');params.push(stage);
  }
  if(type){
    if(!PARTNER_TYPES.has(type))return fail(env,400,'invalid_partner_type','Unsupported partner type.');
    where.push('partner_type=?');params.push(type);
  }
  const sql='SELECT * FROM commercial_partners'+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY relationship_stage,name ASC LIMIT 200';
  const rows=await env.SOURCE_AO_DB.prepare(sql).bind(...params).all();
  return json(env,{ok:true,partners:(rows.results||[]).map(hydrate)});
}

export async function upsertCommercialPartner(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  let input;try{input=await request.json()}catch{return fail(env,400,'invalid_json','A JSON body is required.')}
  let id,name,type,stage,channel,country,locality,website,sourceNote;
  try{
    id=clean(input?.id,120);
    name=clean(input?.name,220);
    type=clean(input?.partner_type,40);
    stage=clean(input?.relationship_stage,30)||'introduced';
    channel=clean(input?.source_channel,20)||'manual';
    country=String(input?.country_code||'AO').toUpperCase();
    locality=clean(input?.locality,180);
    website=clean(input?.website,600);
    sourceNote=clean(input?.source_note,800);
  }catch{return fail(env,400,'invalid_fields','Partner fields are invalid.')}
  if(!name||!type||!PARTNER_TYPES.has(type)||!STAGES.has(stage)||!CHANNELS.has(channel)||!COUNTRIES.has(country)){
    return fail(env,400,'invalid_fields','name, partner_type, stage, channel and country are required.');
  }
  if(website&&!safeUrl(website))return fail(env,400,'invalid_website','Website must be HTTP or HTTPS.');
  const capabilities=arrayInput(input?.capabilities,30),sectors=arrayInput(input?.sectors,20);
  id=id||'partner_'+crypto.randomUUID().replaceAll('-','').slice(0,24);
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO commercial_partners(
      id,name,country_code,partner_type,relationship_stage,source_channel,locality,website,
      capabilities_json,sectors_json,source_note,last_interaction_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(name) DO UPDATE SET
      country_code=excluded.country_code,partner_type=excluded.partner_type,
      relationship_stage=excluded.relationship_stage,source_channel=excluded.source_channel,
      locality=excluded.locality,website=excluded.website,
      capabilities_json=excluded.capabilities_json,sectors_json=excluded.sectors_json,
      source_note=excluded.source_note,last_interaction_at=excluded.last_interaction_at,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    id,name,country,type,stage,channel,locality,safeUrl(website),
    JSON.stringify(capabilities),JSON.stringify(sectors),sourceNote,
    clean(input?.last_interaction_at,80)
  ).run();
  const row=await env.SOURCE_AO_DB.prepare('SELECT * FROM commercial_partners WHERE name=?').bind(name).first();
  return json(env,{ok:true,partner:hydrate(row)},201);
}
