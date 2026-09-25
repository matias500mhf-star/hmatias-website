import {normalizeSearch} from './index.js';
import {scoreCollectorCandidate} from './collector.js';

const parse=(v,f=[])=>{try{return JSON.parse(v||'[]')}catch{return f}};
const words=value=>normalizeSearch(value).split(/\s+/).filter(x=>x.length>2);
const enc=new TextEncoder();

export function isSafeDiscoveryUrl(value){
  try{
    const u=new URL(value);
    if(!['http:','https:'].includes(u.protocol)) return false;
    if(u.username||u.password) return false;
    const h=u.hostname.toLowerCase().replace(/^\[|\]$/g,'');
    if(h==='localhost'||h.endsWith('.local')||h==='0.0.0.0'||h==='::1') return false;
    if(/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)) return false;
    const m=h.match(/^172\.(\d+)\./);
    if(m&&Number(m[1])>=16&&Number(m[1])<=31) return false;
    return true;
  }catch{return false}
}

export function htmlToText(html=''){
  return String(html)
    .replace(/<!--[\s\S]*?-->/g,' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/\s+/g,' ')
    .trim();
}

function titleFromHtml(html=''){
  const m=String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?htmlToText(m[1]).slice(0,220):null;
}

function evidenceExcerpt(text,query,variants=[]){
  const normalizedText=normalizeSearch(text);
  const needles=[query,...variants].flatMap(words);
  let best=-1;
  for(const token of needles){
    const idx=normalizedText.indexOf(token);
    if(idx>=0&&(best<0||idx<best)) best=idx;
  }
  if(best<0) return text.slice(0,700);
  const start=Math.max(0,best-180);
  return text.slice(start,start+900).trim();
}

export function scoreDiscoveryEvidence(run,supplier,text){
  const queryTokens=new Set(words([run.query,...parse(run.query_variants_json,[])].join(' ')));
  const pageTokens=new Set(words(text));
  let overlap=0;
  for(const t of queryTokens) if(pageTokens.has(t)) overlap++;
  const capabilities=parse(supplier.capabilities_json,[]);
  const capabilityTokens=new Set(words(capabilities.join(' ')));
  let capabilityHits=0;
  for(const t of queryTokens) if(capabilityTokens.has(t)) capabilityHits++;
  return Math.min(100,overlap*9+capabilityHits*7+(supplier.website?8:0));
}

async function sha256Hex(value){
  const digest=await crypto.subtle.digest('SHA-256',enc.encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function readLimitedText(response,limit=350000){
  if(!response.body) return '';
  const reader=response.body.getReader();
  const chunks=[];
  let total=0;
  while(true){
    const {done,value}=await reader.read();
    if(done) break;
    total+=value.byteLength;
    if(total>limit){
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const size=chunks.reduce((n,c)=>n+c.byteLength,0);
  const joined=new Uint8Array(size);
  let offset=0;
  for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength}
  return new TextDecoder().decode(joined);
}

async function fetchSafe(url,maxRedirects=3){
  let current=url;
  for(let i=0;i<=maxRedirects;i++){
    if(!isSafeDiscoveryUrl(current)) throw new Error('unsafe_source_url');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),6500);
    let res;
    try{
      res=await fetch(current,{
        redirect:'manual',
        signal:controller.signal,
        headers:{accept:'text/html,text/plain;q=0.9,*/*;q=0.2'}
      });
    }finally{clearTimeout(timer)}
    if([301,302,303,307,308].includes(res.status)){
      const location=res.headers.get('location');
      if(!location) return {response:res,url:current,redirected:i>0};
      current=new URL(location,current).toString();
      continue;
    }
    return {response:res,url:current,redirected:i>0};
  }
  throw new Error('too_many_redirects');
}

async function getRun(env,runId){
  return env.SOURCE_AO_DB.prepare('SELECT * FROM search_runs WHERE id=?').bind(runId).first();
}

async function getSupplier(env,supplierId){
  return env.SOURCE_AO_DB.prepare('SELECT * FROM suppliers WHERE id=?').bind(supplierId).first();
}

async function refreshCandidateCount(env,runId){
  const row=await env.SOURCE_AO_DB.prepare('SELECT count(*) total FROM search_candidates WHERE search_run_id=?').bind(runId).first();
  const count=Number(row?.total||0);
  await env.SOURCE_AO_DB.prepare('UPDATE search_runs SET candidate_count=? WHERE id=?').bind(count,runId).run();
  return count;
}

async function upsertDiscoveredCandidate(env,run,supplier,sourceUrl,evidenceText,matchScore){
  const candidate={
    supplier_name:supplier.name,
    normalized_supplier_name:normalizeSearch(supplier.name),
    source_url:sourceUrl,
    source_type:'supplier_website',
    location:supplier.location,
    phone:supplier.phone||null,
    whatsapp:supplier.whatsapp||null,
    email:supplier.email||null,
    website:supplier.website||null,
    matched_variant:run.query,
    evidence_text:evidenceText
  };
  const score=Math.max(matchScore,scoreCollectorCandidate(run,candidate));
  const id='candidate_'+crypto.randomUUID();
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO search_candidates(
      id,search_run_id,supplier_name,normalized_supplier_name,source_url,source_type,location,
      phone,whatsapp,email,website,matched_variant,evidence_text,relevance_score
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(search_run_id,source_url,normalized_supplier_name)
    DO UPDATE SET
      phone=coalesce(excluded.phone,search_candidates.phone),
      whatsapp=coalesce(excluded.whatsapp,search_candidates.whatsapp),
      email=coalesce(excluded.email,search_candidates.email),
      website=coalesce(excluded.website,search_candidates.website),
      evidence_text=excluded.evidence_text,
      relevance_score=max(search_candidates.relevance_score,excluded.relevance_score)
  `).bind(
    id,run.id,candidate.supplier_name,candidate.normalized_supplier_name,candidate.source_url,candidate.source_type,
    candidate.location,candidate.phone,candidate.whatsapp,candidate.email,candidate.website,
    candidate.matched_variant,candidate.evidence_text,score
  ).run();
}

export async function queueKnownSourceDiscovery(env,runId){
  const run=await getRun(env,runId);
  if(!run) throw new Error('search_run_not_found');
  const categoryLike=`%"${run.category}"%`;
  const rows=await env.SOURCE_AO_DB.prepare(`
    SELECT s.id supplier_id,s.name,s.location,s.website,s.categories_json,s.capabilities_json,
           ss.source_url,ss.source_type
    FROM suppliers s
    LEFT JOIN supplier_sources ss ON ss.supplier_id=s.id
    WHERE (?='general' OR s.categories_json LIKE ?)
      AND (ss.source_url IS NOT NULL OR s.website IS NOT NULL)
    ORDER BY s.last_verified_at DESC
    LIMIT 80
  `).bind(run.category||'general',categoryLike).all();

  let queued=0;
  for(const row of rows.results||[]){
    const sourceUrl=row.source_url||row.website;
    if(!sourceUrl||!isSafeDiscoveryUrl(sourceUrl)) continue;
    if(row.source_type==='directory') continue;
    const id='discover_'+crypto.randomUUID();
    const result=await env.SOURCE_AO_DB.prepare(`
      INSERT OR IGNORE INTO discovery_jobs(
        id,search_run_id,supplier_id,provider,query,source_url,priority,status
      ) VALUES(?,?,?,?,?,?,?,?)
    `).bind(id,runId,row.supplier_id,'known_supplier_web',run.query,sourceUrl,20,'pending').run();
    if(Number(result.meta?.changes||0)>0) queued++;
  }
  return {run,queued};
}

async function processJob(env,job){
  const run=await getRun(env,job.search_run_id);
  const supplier=await getSupplier(env,job.supplier_id);
  if(!run||!supplier) throw new Error('discovery_context_missing');

  await env.SOURCE_AO_DB.prepare(
    "UPDATE discovery_jobs SET status='running',attempts=attempts+1,started_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?"
  ).bind(job.id).run();

  try{
    const fetched=await fetchSafe(job.source_url);
    const contentType=(fetched.response.headers.get('content-type')||'').toLowerCase();
    const status=fetched.response.status;
    let fetchStatus='fetched',text='',title=null,matchScore=0,excerpt=null,hash=null;

    if(!fetched.response.ok){
      fetchStatus='failed';
    }else if(!contentType.includes('text/html')&&!contentType.includes('text/plain')){
      fetchStatus='unsupported';
    }else{
      const raw=await readLimitedText(fetched.response);
      text=contentType.includes('text/html')?htmlToText(raw):raw.replace(/\s+/g,' ').trim();
      title=contentType.includes('text/html')?titleFromHtml(raw):null;
      matchScore=scoreDiscoveryEvidence(run,supplier,text);
      excerpt=evidenceExcerpt(text,run.query,parse(run.query_variants_json,[]));
      hash=await sha256Hex(text.slice(0,250000));
      if(matchScore>=14){
        await upsertDiscoveredCandidate(env,run,supplier,fetched.url,excerpt,matchScore);
      }
    }

    await env.SOURCE_AO_DB.prepare(`
      INSERT INTO discovery_evidence(
        id,discovery_job_id,search_run_id,supplier_id,source_url,fetch_status,http_status,
        content_type,title,evidence_excerpt,match_score,content_hash
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      'evidence_'+crypto.randomUUID(),job.id,run.id,supplier.id,fetched.url,
      fetchStatus,status,contentType||null,title,excerpt,matchScore,hash
    ).run();

    await env.SOURCE_AO_DB.prepare(
      "UPDATE discovery_jobs SET status=?,completed_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?"
    ).bind(fetchStatus==='failed'?'failed':'completed',job.id).run();

    return {job_id:job.id,status:fetchStatus,http_status:status,match_score:matchScore,candidate_created:matchScore>=14};
  }catch(error){
    const message=(error instanceof Error?error.message:'discovery_failed').slice(0,300);
    await env.SOURCE_AO_DB.prepare(
      "UPDATE discovery_jobs SET status='failed',completed_at=CURRENT_TIMESTAMP,last_error=? WHERE id=?"
    ).bind(message,job.id).run();
    return {job_id:job.id,status:'failed',error:message};
  }
}

export async function processPendingDiscoveryJobs(env,{runId=null,limit=4}={}){
  const safeLimit=Math.max(1,Math.min(8,Number(limit)||4));
  const stmt=runId
    ? env.SOURCE_AO_DB.prepare("SELECT * FROM discovery_jobs WHERE status='pending' AND search_run_id=? ORDER BY priority ASC,created_at ASC LIMIT ?").bind(runId,safeLimit)
    : env.SOURCE_AO_DB.prepare("SELECT * FROM discovery_jobs WHERE status='pending' ORDER BY priority ASC,created_at ASC LIMIT ?").bind(safeLimit);
  const rows=await stmt.all();
  const results=[];
  for(const job of rows.results||[]) results.push(await processJob(env,job));
  const runIds=[...new Set((rows.results||[]).map(x=>x.search_run_id))];
  for(const id of runIds) await refreshCandidateCount(env,id);
  return {processed:results.length,results};
}

export async function discoveryStatus(env,runId){
  const jobs=await env.SOURCE_AO_DB.prepare(`
    SELECT id,supplier_id,provider,source_url,status,attempts,last_error,created_at,completed_at
    FROM discovery_jobs WHERE search_run_id=?
    ORDER BY priority ASC,created_at ASC
  `).bind(runId).all();
  const evidence=await env.SOURCE_AO_DB.prepare(`
    SELECT supplier_id,source_url,fetch_status,http_status,title,evidence_excerpt,match_score,fetched_at
    FROM discovery_evidence WHERE search_run_id=?
    ORDER BY match_score DESC,fetched_at DESC LIMIT 60
  `).bind(runId).all();
  return {jobs:jobs.results||[],evidence:evidence.results||[]};
}
