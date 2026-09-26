import {isAdmin,normalizeSearch} from './index.js';
import {isSafeDiscoveryUrl,htmlToText} from './collector-discovery.js';

const TYPES=new Set(['rfq','tender','small-contract','maintenance','supply-request','subcontracting']);
const KINDS=new Set(['html_index','json_feed']);
const now=()=>new Date().toISOString();
const parse=(v,f=[])=>{try{return JSON.parse(v||'[]')}catch{return f}};
const clean=(v,n=800)=>{
  if(v==null)return null;
  const s=String(v).trim();
  if(!s)return null;
  if(s.length>n)throw new Error('value_too_long');
  return s;
};
const json=(env,data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'access-control-allow-origin':env.PUBLIC_ORIGIN||'https://comercialhmatiasps.com'
}});
const fail=(env,status,code,message)=>json(env,{ok:false,error:{code,message}},status);
const date=v=>{
  if(!v)return null;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d.toISOString();
};

export function normalizeOpportunityTitle(value=''){
  return normalizeSearch(value)
    .replace(/\b(angola|publico|publica|public|tender|concurso|rfq)\b/g,' ')
    .replace(/\s+/g,' ').trim();
}

export function classifyOpportunityText(value=''){
  const text=normalizeSearch(value);
  const tags=[];
  let type='tender',sector='general',score=20;
  const hit=(terms,tag,points)=>{
    if(!terms.some(term=>text.includes(normalizeSearch(term))))return false;
    tags.push(tag);score+=points;return true;
  };
  if(hit(['limpeza','cleaning','higiene','detergente','desinfetante'],'hmatias-clean',38)){
    sector='cleaning-supplies';type='supply-request';
  }
  if(hit(['manutencao','maintenance','facilities','reparacao','repair'],'facilities',34)){
    if(sector==='general')sector='facilities-maintenance';
    type='maintenance';
  }
  if(hit(['material','fornecimento','supply','aquisicao','procurement','equipment','equipamento'],'supply',28)){
    if(sector==='general')sector='supply-procurement';
    if(type==='tender')type='supply-request';
  }
  if(hit(['construcao','construction','obra','reabilitacao','rehabilitation','pintura','civil'],'construction',34)){
    if(sector==='general')sector='construction';
  }
  if(hit(['ar condicionado','hvac','electrica','eletrica','electrical','canalizacao','plumbing'],'technical-services',22)){
    if(sector==='general')sector='technical-maintenance';
  }
  if(/\brfq\b|request for quotation|pedido de cotacao/.test(text))type='rfq';
  if(/subcontrat|subcontract/.test(text))type='subcontracting';
  if(/pequeno contrato|small contract/.test(text))type='small-contract';
  if(/concurso|tender|licitacao|procedimento/.test(text)&&!['rfq','maintenance','supply-request'].includes(type))type='tender';
  return {type:TYPES.has(type)?type:'tender',sector,fit_score:Math.min(100,score),fit_tags:[...new Set(tags)]};
}

export function extractReference(text=''){
  for(const re of [
    /(?:refer[eê]ncia|ref\.?|processo|procedimento|concurso|rfq)\s*(?:n[.ºo°]*|#|:|-)?\s*([A-Z0-9][A-Z0-9./_-]{3,})/i,
    /\b([0-9]{2,}[A-Z]{0,3}\/[A-Z0-9./_-]{2,})\b/i
  ]){
    const m=String(text).match(re);
    if(m?.[1])return m[1].trim();
  }
  return null;
}

const dmy=(d,m,y)=>{
  d=Number(d);m=Number(m);y=Number(y);
  if(!d||!m||!y||d>31||m>12)return null;
  if(y<100)y+=2000;
  const x=new Date(Date.UTC(y,m-1,d,23,59,59));
  return Number.isNaN(x.getTime())?null:x.toISOString();
};

export function extractDeadline(text='',clock=Date.now()){
  const src=String(text).replace(/\s+/g,' ');
  const windows=[];
  const key=/(prazo|data limite|limite de submiss[aã]o|deadline|submission deadline|encerramento|closing date)/ig;
  let k;
  while((k=key.exec(src)))windows.push(src.slice(k.index,k.index+180));
  if(!windows.length)return null;
  const found=[];
  for(const window of windows){
    let m;
    const iso=/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.]([0-2]?\d|3[01])\b/g;
    while((m=iso.exec(window))){
      const x=new Date(`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}T23:59:59Z`);
      if(!Number.isNaN(x.getTime()))found.push(x.toISOString());
    }
    const eu=/\b([0-2]?\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})\b/g;
    while((m=eu.exec(window))){
      const x=dmy(m[1],m[2],m[3]);if(x)found.push(x);
    }
  }
  return found.filter(x=>new Date(x).getTime()>=clock-86400000).sort()[0]||null;
}

export function extractOpportunityLinks(html='',base=''){
  const out=[],seen=new Set();
  const re=/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while((m=re.exec(String(html)))){
    let url;
    try{url=new URL(m[1],base).toString()}catch{continue}
    if(!isSafeDiscoveryUrl(url)||seen.has(url))continue;
    const label=htmlToText(m[2]).slice(0,300);
    const hay=normalizeSearch(`${label} ${url}`);
    if(!/(concurso|tender|licitacao|procedimento|aquisicao|procurement|fornecimento|supply|rfq|manutencao|maintenance|reabilitacao|construction|obra|limpeza|cleaning)/.test(hay))continue;
    seen.add(url);out.push({url,label});
  }
  return out;
}

const pageTitle=html=>{
  const h1=String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if(h1)return htmlToText(h1[1]).slice(0,260);
  const title=String(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title?htmlToText(title[1]).slice(0,260):null;
};

async function sha(value){
  const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function readLimited(res,limit){
  if(!res.body)return '';
  const reader=res.body.getReader(),chunks=[];let total=0;
  while(true){
    const {done,value}=await reader.read();if(done)break;
    total+=value.byteLength;
    if(total>limit){await reader.cancel();throw new Error('source_too_large')}
    chunks.push(value);
  }
  const bytes=new Uint8Array(chunks.reduce((n,c)=>n+c.byteLength,0));
  let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength}
  return new TextDecoder().decode(bytes);
}

async function fetchText(url,limit=450000){
  let current=url;
  for(let i=0;i<=3;i++){
    if(!isSafeDiscoveryUrl(current))throw new Error('unsafe_source_url');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    let res;
    try{
      res=await fetch(current,{redirect:'manual',signal:controller.signal,headers:{accept:'text/html,application/json,text/plain;q=0.9,*/*;q=0.2'}});
    }finally{clearTimeout(timer)}
    if([301,302,303,307,308].includes(res.status)){
      const location=res.headers.get('location');
      if(!location)throw new Error('redirect_without_location');
      current=new URL(location,current).toString();continue;
    }
    if(!res.ok)throw new Error(`http_${res.status}`);
    return {url:current,type:(res.headers.get('content-type')||'').toLowerCase(),text:await readLimited(res,limit)};
  }
  throw new Error('too_many_redirects');
}

function normalizeCandidate(input,source){
  const title=clean(input.title||input.name,260);
  const sourceUrl=clean(input.source_url||input.url,1200);
  if(!title)throw new Error('title_required');
  if(!sourceUrl||!isSafeDiscoveryUrl(sourceUrl))throw new Error('source_url_invalid');
  const combined=[title,input.scope_summary,input.description,input.sector].filter(Boolean).join(' ');
  const fit=classifyOpportunityText(combined);
  return {
    title,normalized_title:normalizeOpportunityTitle(title),
    issuer:clean(input.issuer,220)||source.name,location:clean(input.location,180)||'Angola',
    reference:clean(input.reference,120)||extractReference(combined),
    published_at:date(input.published_at),deadline:date(input.deadline)||extractDeadline(combined),
    source_url:sourceUrl,scope_summary:clean(input.scope_summary||input.description,1200),
    evidence_excerpt:clean(input.evidence_excerpt||input.description,1800),
    opportunity_type:TYPES.has(input.type)?input.type:fit.type,sector:clean(input.sector,120)||fit.sector,
    fit_score:Number.isFinite(Number(input.fit_score))?Math.max(0,Math.min(100,Number(input.fit_score))):fit.fit_score,
    fit_tags:Array.isArray(input.fit_tags)?input.fit_tags.slice(0,12):fit.fit_tags,source_checked_at:now()
  };
}

async function upsert(env,source,c){
  const host=new URL(c.source_url).hostname.toLowerCase();
  const key=await sha([normalizeSearch(c.reference||''),c.normalized_title,c.deadline?.slice(0,10)||'',host].join('|'));
  const existing=await env.SOURCE_AO_DB.prepare(
    'SELECT id FROM opportunities WHERE source_url=? OR (? IS NOT NULL AND reference=?) LIMIT 1'
  ).bind(c.source_url,c.reference,c.reference).first();
  const id='opp_candidate_'+key.slice(0,24),status=existing?'duplicate':'pending';
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO opportunity_candidates(
      id,source_id,title,normalized_title,issuer,location,reference,published_at,deadline,source_url,
      scope_summary,evidence_excerpt,source_checked_at,opportunity_type,sector,fit_score,fit_tags_json,
      dedupe_key,status,promoted_opportunity_id,last_seen_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(dedupe_key) DO UPDATE SET
      title=excluded.title,issuer=excluded.issuer,location=excluded.location,
      reference=coalesce(excluded.reference,opportunity_candidates.reference),
      published_at=coalesce(excluded.published_at,opportunity_candidates.published_at),
      deadline=coalesce(excluded.deadline,opportunity_candidates.deadline),
      source_url=excluded.source_url,scope_summary=coalesce(excluded.scope_summary,opportunity_candidates.scope_summary),
      evidence_excerpt=coalesce(excluded.evidence_excerpt,opportunity_candidates.evidence_excerpt),
      source_checked_at=excluded.source_checked_at,opportunity_type=excluded.opportunity_type,
      sector=excluded.sector,fit_score=max(opportunity_candidates.fit_score,excluded.fit_score),
      fit_tags_json=excluded.fit_tags_json,last_seen_at=excluded.last_seen_at,
      status=CASE
        WHEN opportunity_candidates.status='pending' AND excluded.status='duplicate' THEN 'duplicate'
        ELSE opportunity_candidates.status
      END,
      promoted_opportunity_id=coalesce(opportunity_candidates.promoted_opportunity_id,excluded.promoted_opportunity_id)
  `).bind(
    id,source.id,c.title,c.normalized_title,c.issuer,c.location,c.reference,c.published_at,c.deadline,c.source_url,
    c.scope_summary,c.evidence_excerpt,c.source_checked_at,c.opportunity_type,c.sector,c.fit_score,JSON.stringify(c.fit_tags),
    key,status,existing?.id||null,now()
  ).run();
  return status;
}

async function scanHtml(env,source,raw){
  const sourceHost=new URL(raw.url).hostname.toLowerCase();
  const links=extractOpportunityLinks(raw.text,raw.url)
    .filter(link=>new URL(link.url).hostname.toLowerCase()===sourceHost)
    .slice(0,4);
  let seen=0;
  for(const link of links){
    try{
      const page=await fetchText(link.url,350000);
      if(!page.type.includes('text/html')&&!page.type.includes('text/plain'))continue;
      const text=htmlToText(page.text).slice(0,12000),title=pageTitle(page.text)||link.label||'Oportunidade pública';
      const summary=text.slice(0,1200);
      const c=normalizeCandidate({title,issuer:source.name,location:'Angola',reference:extractReference(text),
        deadline:extractDeadline(text),source_url:page.url,description:summary,evidence_excerpt:summary},source);
      await upsert(env,source,c);seen++;
    }catch{}
  }
  return {links_found:links.length,candidates_seen:seen};
}

async function scanJson(env,source,raw){
  const data=JSON.parse(raw.text);
  const rows=Array.isArray(data)?data:(data?.results||data?.opportunities||data?.items||[]);
  if(!Array.isArray(rows))throw new Error('json_feed_shape_invalid');
  let seen=0;
  for(const row of rows.slice(0,50)){
    try{await upsert(env,source,normalizeCandidate(row,source));seen++}catch{}
  }
  return {links_found:0,candidates_seen:seen};
}

async function dueSources(env,limit){
  const rows=await env.SOURCE_AO_DB.prepare(
    "SELECT * FROM opportunity_sources WHERE active=1 ORDER BY priority ASC,coalesce(last_checked_at,'1970-01-01') ASC LIMIT 20"
  ).all();
  const clock=Date.now();
  return (rows.results||[]).filter(s=>!s.last_checked_at||
    new Date(s.last_checked_at).getTime()+(Number(s.scan_interval_minutes)||60)*60000<=clock
  ).slice(0,Math.max(1,Math.min(5,Number(limit)||2)));
}

export async function scanOpportunitySources(env,{limitSources=2}={}){
  const sources=await dueSources(env,limitSources),results=[];
  for(const source of sources){
    const stamp=now();
    try{
      const raw=await fetchText(source.source_url);
      const result=source.source_kind==='json_feed'?await scanJson(env,source,raw):await scanHtml(env,source,raw);
      await env.SOURCE_AO_DB.prepare(
        'UPDATE opportunity_sources SET last_checked_at=?,last_success_at=?,last_error=NULL,updated_at=? WHERE id=?'
      ).bind(stamp,stamp,stamp,source.id).run();
      results.push({source_id:source.id,status:'completed',...result});
    }catch(error){
      const message=(error instanceof Error?error.message:'scan_failed').slice(0,300);
      await env.SOURCE_AO_DB.prepare(
        'UPDATE opportunity_sources SET last_checked_at=?,last_error=?,updated_at=? WHERE id=?'
      ).bind(stamp,message,stamp,source.id).run();
      results.push({source_id:source.id,status:'failed',error:message});
    }
  }
  return {sources_processed:results.length,results};
}

export async function listOpportunitySources(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const rows=await env.SOURCE_AO_DB.prepare(
    'SELECT id,name,source_url,source_kind,active,priority,scan_interval_minutes,last_checked_at,last_success_at,last_error FROM opportunity_sources ORDER BY priority ASC,name ASC'
  ).all();
  return json(env,{ok:true,sources:rows.results||[]});
}

export async function upsertOpportunitySource(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  let input;try{input=await request.json()}catch{return fail(env,400,'invalid_json','A JSON body is required.')}
  let name,url,kind;
  try{name=clean(input?.name,220);url=clean(input?.source_url,1200);kind=clean(input?.source_kind,40)||'html_index'}
  catch{return fail(env,400,'invalid_fields','Source fields are invalid.')}
  if(!name||!url||!isSafeDiscoveryUrl(url)||!KINDS.has(kind))return fail(env,400,'invalid_fields','name, source_url and a supported source_kind are required.');
  const id=clean(input?.id,120)||'opp_source_'+(await sha(url)).slice(0,18);
  const active=input?.active===false?0:1,priority=Math.max(1,Math.min(100,Number(input?.priority)||50));
  const interval=Math.max(15,Math.min(1440,Number(input?.scan_interval_minutes)||60));
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO opportunity_sources(id,name,source_url,source_kind,active,priority,scan_interval_minutes)
    VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(source_url) DO UPDATE SET name=excluded.name,source_kind=excluded.source_kind,
      active=excluded.active,priority=excluded.priority,scan_interval_minutes=excluded.scan_interval_minutes,
      updated_at=CURRENT_TIMESTAMP
  `).bind(id,name,url,kind,active,priority,interval).run();
  return json(env,{ok:true,id},201);
}

export async function runOpportunityScanResponse(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  let limitSources=2;
  try{
    if((request.headers.get('content-type')||'').includes('application/json')){
      const b=await request.json();if(b?.limit_sources!=null)limitSources=Number(b.limit_sources);
    }
  }catch{}
  return json(env,{ok:true,...await scanOpportunitySources(env,{limitSources})});
}

export async function listOpportunityCandidates(request,env){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const url=new URL(request.url),status=clean(url.searchParams.get('status'),30)||'pending';
  const limit=Math.max(1,Math.min(100,Number(url.searchParams.get('limit'))||50));
  if(!new Set(['pending','reviewed','rejected','promoted','duplicate','all']).has(status))return fail(env,400,'invalid_status','Unsupported candidate status.');
  const q=status==='all'
    ?env.SOURCE_AO_DB.prepare('SELECT c.*,s.name source_name FROM opportunity_candidates c LEFT JOIN opportunity_sources s ON s.id=c.source_id ORDER BY c.fit_score DESC,c.discovered_at DESC LIMIT ?').bind(limit)
    :env.SOURCE_AO_DB.prepare('SELECT c.*,s.name source_name FROM opportunity_candidates c LEFT JOIN opportunity_sources s ON s.id=c.source_id WHERE c.status=? ORDER BY c.fit_score DESC,c.discovered_at DESC LIMIT ?').bind(status,limit);
  const rows=await q.all();
  return json(env,{ok:true,candidates:(rows.results||[]).map(r=>({...r,fit_tags:parse(r.fit_tags_json,[])}))});
}

export async function reviewOpportunityCandidate(request,env,id){
  if(!isAdmin(request,env))return fail(env,401,'unauthorized','Admin authorization required.');
  const c=await env.SOURCE_AO_DB.prepare('SELECT * FROM opportunity_candidates WHERE id=?').bind(id).first();
  if(!c)return fail(env,404,'candidate_not_found','Opportunity candidate not found.');
  let input;try{input=await request.json()}catch{return fail(env,400,'invalid_json','A JSON body is required.')}
  const action=String(input?.action||'').trim(),reviewer=clean(input?.reviewed_by,120)||'HMATIAS review desk';
  if(!['pending','reviewed'].includes(c.status))return fail(env,409,'candidate_not_reviewable','Candidate has already been resolved.');
  if(action==='reject'){
    await env.SOURCE_AO_DB.prepare("UPDATE opportunity_candidates SET status='rejected',reviewed_at=?,reviewed_by=? WHERE id=?")
      .bind(now(),reviewer,id).run();
    return json(env,{ok:true,status:'rejected'});
  }
  if(action!=='promote')return fail(env,400,'invalid_action','Use promote or reject.');
  const title=clean(input?.title,260)||c.title,issuer=clean(input?.issuer,220)||c.issuer;
  const location=clean(input?.location,180)||c.location||'Angola',sourceUrl=clean(input?.source_url,1200)||c.source_url;
  const reference=clean(input?.reference,120)||c.reference,deadline=date(input?.deadline)||c.deadline;
  const published=date(input?.published_at)||c.published_at,type=TYPES.has(input?.type)?input.type:c.opportunity_type;
  const sector=clean(input?.sector,120)||c.sector,scope=clean(input?.scope_summary,1200)||c.scope_summary;
  const sourceFit=clean(input?.source_fit,1200)||`HMATIAS fit ${c.fit_score}/100 · ${parse(c.fit_tags_json,[]).join(', ')||'general'}. Human review completed before public promotion.`;
  if(!title||!issuer||!location||!sourceUrl||!isSafeDiscoveryUrl(sourceUrl)||!deadline)return fail(env,400,'promotion_incomplete','Promotion requires title, issuer, location, source URL and deadline.');
  if(new Date(deadline).getTime()<=Date.now())return fail(env,400,'deadline_expired','Cannot promote an expired opportunity.');
  const opp=c.promoted_opportunity_id||'opp_auto_'+c.dedupe_key.slice(0,22);
  await env.SOURCE_AO_DB.prepare(`
    INSERT INTO opportunities(
      id,title,type,sector,location,issuer,reference,published_at,deadline,status,source_url,
      source_checked_at,scope_summary,source_fit,fit_score,fit_tags_json,discovery_source_id
    ) VALUES(?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title,type=excluded.type,sector=excluded.sector,
      location=excluded.location,issuer=excluded.issuer,reference=excluded.reference,
      published_at=excluded.published_at,deadline=excluded.deadline,status='active',
      source_url=excluded.source_url,source_checked_at=excluded.source_checked_at,
      scope_summary=excluded.scope_summary,source_fit=excluded.source_fit,fit_score=excluded.fit_score,
      fit_tags_json=excluded.fit_tags_json,discovery_source_id=excluded.discovery_source_id,
      updated_at=CURRENT_TIMESTAMP
  `).bind(opp,title,type||'tender',sector||'general',location,issuer,reference,published,deadline,
    sourceUrl,c.source_checked_at||now(),scope,sourceFit,Number(c.fit_score)||0,c.fit_tags_json||'[]',c.source_id).run();
  await env.SOURCE_AO_DB.prepare(
    "UPDATE opportunity_candidates SET status='promoted',reviewed_at=?,reviewed_by=?,promoted_opportunity_id=? WHERE id=?"
  ).bind(now(),reviewer,opp,id).run();
  return json(env,{ok:true,status:'promoted',opportunity_id:opp});
}
