import {buildSmartSearchPlan} from './smart-search.js';
import {isAdmin,normalizeSearch} from './index.js';

const SOURCE_TYPES=new Set(['supplier_website','catalog','directory','marketplace','social','search_result','other']);

const h=env=>({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
});
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:h(env)});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);
const parse=(v,f=[])=>{try{return JSON.parse(v||'[]')}catch{return f}};
const clean=(v,n=500)=>{
  if(v==null)return null;
  const s=String(v).trim();
  if(!s)return null;
  if(s.length>n)throw new Error('value_too_long');
  return s;
};
const body=async request=>{
  if(!(request.headers.get('content-type')||'').includes('application/json')) throw new Error('json_required');
  return request.json();
};
const validUrl=value=>{
  try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'}catch{return false}
};
const words=value=>normalizeSearch(value).split(/\s+/).filter(x=>x.length>2);

export function normalizeCollectorCandidate(input={}){
  const supplier_name=clean(input.supplier_name,180);
  const source_url=clean(input.source_url,1200);
  const source_type=clean(input.source_type,40)||'other';
  if(!supplier_name)throw new Error('supplier_name_required');
  if(!source_url||!validUrl(source_url))throw new Error('source_url_invalid');
  if(!SOURCE_TYPES.has(source_type))throw new Error('source_type_invalid');
  return {
    supplier_name,
    normalized_supplier_name:normalizeSearch(supplier_name),
    source_url,
    source_type,
    location:clean(input.location,180),
    phone:clean(input.phone,80),
    whatsapp:clean(input.whatsapp,80),
    email:clean(input.email,180),
    website:clean(input.website,1200),
    matched_variant:clean(input.matched_variant,300),
    evidence_text:clean(input.evidence_text,1000)
  };
}

export function scoreCollectorCandidate(run,candidate){
  const wanted=new Set(words([run.query,...parse(run.query_variants_json,[])].join(' ')));
  const hay=new Set(words([
    candidate.supplier_name,candidate.matched_variant,candidate.evidence_text,candidate.location
  ].filter(Boolean).join(' ')));
  let hits=0;
  for(const token of wanted)if(hay.has(token))hits++;
  let score=Math.min(40,hits*8);
  if(['supplier_website','catalog'].includes(candidate.source_type))score+=20;
  else if(candidate.source_type==='directory')score+=10;
  else if(['marketplace','social'].includes(candidate.source_type))score+=5;
  if(candidate.whatsapp||candidate.phone||candidate.email||candidate.website)score+=10;
  const a=normalizeSearch(run.location||''),b=normalizeSearch(candidate.location||'');
  if(a&&b&&(a.includes(b)||b.includes(a)))score+=10;
  else if(b.includes('angola'))score+=5;
  return Math.min(100,score);
}

async function runById(env,id){
  return env.SOURCE_AO_DB.prepare('SELECT * FROM search_runs WHERE id=?').bind(id).first();
}

export async function createCollectorRun(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  let input;
  try{input=await body(request)}catch{return fail(env,400,'invalid_json','A JSON body is required.');}
  let plan;
  try{
    plan=buildSmartSearchPlan({
      query:String(input?.query||'').trim(),
      location:String(input?.location||'Luanda').trim(),
      neededBy:String(input?.needed_by||'').trim(),
      quantity:input?.quantity==null?null:Number(input.quantity)
    });
  }catch(error){
    return fail(env,400,error instanceof Error?error.message:'invalid_request','Invalid sourcing requirement.');
  }
  const id='search_'+crypto.randomUUID();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO search_runs(
      id,query,normalized_query,family_id,item_id,category,location,urgency,status,query_variants_json
    ) VALUES(?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id,plan.query,normalizeSearch(plan.query),plan.interpretation.family_id||null,
    plan.interpretation.item_id||null,plan.interpretation.category||'general',
    plan.location,plan.urgency,'running',JSON.stringify(plan.query_variants||[])
  ).run();
  return json(env,{
    ok:true,
    collector:'source-ao-collector-v1',
    run:await runById(env,id),
    search_plan:{lanes:plan.search_lanes,query_variants:plan.query_variants},
    truth_rule:'Discovery candidates are leads only; exact product, stock and price remain unconfirmed.'
  },201);
}

export async function addCollectorCandidate(request,env,runId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const run=await runById(env,runId);
  if(!run)return fail(env,404,'search_run_not_found','Collector search run not found.');
  if(run.status!=='running')return fail(env,409,'search_run_closed','Collector search run is closed.');
  let input,candidate;
  try{input=await body(request);candidate=normalizeCollectorCandidate(input)}
  catch(error){return fail(env,400,error instanceof Error?error.message:'invalid_candidate','Invalid collector candidate.');}
  const score=scoreCollectorCandidate(run,candidate);
  const id='candidate_'+crypto.randomUUID();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO search_candidates(
      id,search_run_id,supplier_name,normalized_supplier_name,source_url,source_type,location,
      phone,whatsapp,email,website,matched_variant,evidence_text,relevance_score
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(search_run_id,source_url,normalized_supplier_name)
    DO UPDATE SET
      location=excluded.location,
      phone=coalesce(excluded.phone,search_candidates.phone),
      whatsapp=coalesce(excluded.whatsapp,search_candidates.whatsapp),
      email=coalesce(excluded.email,search_candidates.email),
      website=coalesce(excluded.website,search_candidates.website),
      matched_variant=coalesce(excluded.matched_variant,search_candidates.matched_variant),
      evidence_text=coalesce(excluded.evidence_text,search_candidates.evidence_text),
      relevance_score=max(search_candidates.relevance_score,excluded.relevance_score)
  `).bind(
    id,runId,candidate.supplier_name,candidate.normalized_supplier_name,candidate.source_url,candidate.source_type,
    candidate.location,candidate.phone,candidate.whatsapp,candidate.email,candidate.website,
    candidate.matched_variant,candidate.evidence_text,score
  ).run();
  const count=await env.SOURCE_AO_DB.prepare(
    'SELECT count(*) total FROM search_candidates WHERE search_run_id=?'
  ).bind(runId).first();
  await env.SOURCE_AO_DB.prepare('UPDATE search_runs SET candidate_count=? WHERE id=?')
    .bind(Number(count?.total||0),runId).run();
  return json(env,{ok:true,relevance_score:score,commercial_confirmation:false},201);
}

export async function finishCollectorRun(request,env,runId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const run=await runById(env,runId);
  if(!run)return fail(env,404,'search_run_not_found','Collector search run not found.');
  const count=Number(run.candidate_count||0);
  await env.SOURCE_AO_DB.prepare(
    "UPDATE search_runs SET status='completed',completed_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(runId).run();
  if(count===0){
    await env.SOURCE_AO_DB.prepare(`
      INSERT INTO search_gaps(id,search_run_id,query,normalized_query,location,category,family_id)
      VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(search_run_id) DO NOTHING
    `).bind('gap_'+crypto.randomUUID(),runId,run.query,run.normalized_query,run.location,run.category,run.family_id).run();
  }
  return json(env,{ok:true,run:await runById(env,runId),search_gap_recorded:count===0});
}

export async function getCollectorRun(request,env,runId){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const run=await runById(env,runId);
  if(!run)return fail(env,404,'search_run_not_found','Collector search run not found.');
  const candidates=await env.SOURCE_AO_DB.prepare(
    'SELECT * FROM search_candidates WHERE search_run_id=? ORDER BY relevance_score DESC,discovered_at ASC LIMIT 100'
  ).bind(runId).all();
  return json(env,{
    ok:true,
    run:{...run,query_variants:parse(run.query_variants_json,[])},
    candidates:candidates.results||[],
    truth_rule:'Candidates remain unverified until supplier/product availability is confirmed.'
  });
}
