(()=>{
  'use strict';

  const paths={
    catalog:'data/catalog.json',
    suppliers:'data/suppliers.json',
    services:'data/services.json',
    opportunities:'data/opportunities.json',
    observations:'data/observations.json',
    registry:'data/source-registry.json'
  };

  const db={catalog:{items:[],taxonomy:[]},suppliers:{suppliers:[]},services:{providers:[]},opportunities:{opportunities:[]},observations:{observations:[]},registry:{source_types:[],verification_rules:{}}};
  let ready=false;

  const normalize=value=>(value||'')
    .toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/(\d)\s+(mm|cm|m|kg|g|l|kw|kva|btu)\b/g,'$1$2')
    .replace(/[^a-z0-9]+/g,' ').trim();

  const tokens=value=>new Set(normalize(value).split(/\s+/).filter(Boolean));
  const hoursBetween=(a,b)=>Math.abs(new Date(a).getTime()-new Date(b).getTime())/36e5;

  async function load(name,path){
    try{
      const res=await fetch(path,{cache:'no-store'});
      if(!res.ok) throw new Error(`${path}: ${res.status}`);
      db[name]=await res.json();
    }catch(err){
      console.warn('[Source AO data]',err.message);
    }
  }

  async function init(){
    if(ready) return db;
    await Promise.all(Object.entries(paths).map(([name,path])=>load(name,path)));
    ready=true;
    return db;
  }

  function taxonomyMatch(query){
    const q=normalize(query);
    let best=null;
    let bestScore=0;
    for(const row of db.catalog.taxonomy||[]){
      let score=0;
      for(const alias of row.aliases||[]){
        const a=normalize(alias);
        if(!a) continue;
        if(q===a) score=Math.max(score,100);
        else if(q.includes(a)) score=Math.max(score,70+Math.min(a.length,20));
      }
      if(score>bestScore){best=row;bestScore=score;}
    }
    return best;
  }

  function classify(query,lang='en'){
    const row=taxonomyMatch(query);
    if(!row) return lang==='pt'?'Sourcing geral':'General sourcing';
    return lang==='pt'?row.name_pt:row.name_en;
  }

  function textScore(query,record){
    const q=normalize(query);
    const fields=[record.name,record.legal_name,record.specification,record.brand,record.model,...(record.aliases||[]),...(record.keywords||[]),...(record.specialties||[])].map(normalize).filter(Boolean);
    if(fields.some(v=>v===q)) return 100;
    if(fields.some(v=>v.includes(q)||q.includes(v))) return 80;
    const qTokens=tokens(q);
    if(!qTokens.size) return 0;
    let best=0;
    for(const field of fields){
      const fTokens=tokens(field);
      let hit=0;
      qTokens.forEach(token=>{if(fTokens.has(token)) hit++;});
      best=Math.max(best,Math.round((hit/qTokens.size)*60));
    }
    return best;
  }

  function sourceType(id){return (db.registry.source_types||[]).find(s=>s.id===id)||null;}

  function effectiveStatus(observation){
    if(!observation) return 'discovered';
    const status=observation.verification_status||'discovered';
    if(['unavailable','needs_reconfirmation','discovered'].includes(status)) return status;
    const verified=observation.verified_at||observation.observed_at;
    if(!verified) return 'needs_reconfirmation';
    if(observation.expires_at && new Date(observation.expires_at).getTime()<Date.now()) return 'needs_reconfirmation';
    const rule=(db.registry.verification_rules||{})[status];
    const source=sourceType(observation.source_type);
    const maxHours=rule?.expires_hours||source?.default_freshness_hours||72;
    return hoursBetween(verified,new Date())>maxHours?'needs_reconfirmation':status;
  }

  const statusRank={in_stock_confirmed:6,supplier_confirmed:5,source_checked:4,recently_seen:3,needs_reconfirmation:2,discovered:1,unavailable:0};

  function itemMatches(query,location){
    const suppliers=new Map((db.suppliers.suppliers||[]).map(x=>[x.id,x]));
    const observations=db.observations.observations||[];
    const out=[];
    for(const item of db.catalog.items||[]){
      const score=textScore(query,item);
      if(score<35) continue;
      const itemObs=observations.filter(o=>o.item_id===item.id);
      if(!itemObs.length){out.push({kind:'item',item,score,status:'discovered'});continue;}
      for(const obs of itemObs){
        const supplier=suppliers.get(obs.supplier_id)||null;
        const loc=normalize(obs.location||supplier?.location||'');
        if(location&&normalize(location)!=='angola'&&loc&&!loc.includes(normalize(location))) continue;
        out.push({kind:'item',item,supplier,observation:obs,score,status:effectiveStatus(obs)});
      }
    }
    return out;
  }

  function serviceMatches(query,location){
    const out=[];
    for(const provider of db.services.providers||[]){
      const score=textScore(query,provider);
      if(score<35) continue;
      const loc=normalize(provider.location||'');
      if(location&&normalize(location)!=='angola'&&loc&&!loc.includes(normalize(location))) continue;
      let status=provider.verification_status||'discovered';
      if(provider.last_verified_at&&['supplier_confirmed','source_checked','recently_seen'].includes(status)){
        const limit=status==='source_checked'?168:72;
        if(hoursBetween(provider.last_verified_at,new Date())>limit) status='needs_reconfirmation';
      }
      out.push({kind:'service',provider,score,status});
    }
    return out;
  }

  function search(query,location='Luanda'){
    const matches=[...itemMatches(query,location),...serviceMatches(query,location)]
      .sort((a,b)=>(statusRank[b.status]||0)-(statusRank[a.status]||0)||b.score-a.score)
      .slice(0,8);
    const best=matches[0]||null;
    return {query,location,category:taxonomyMatch(query),matches,best,best_status:best?.status||'discovered'};
  }

  function activeOpportunities(){
    const now=Date.now();
    return (db.opportunities.opportunities||[]).filter(o=>{
      if(o.status&&o.status!=='active') return false;
      if(!o.source_url) return false;
      if(o.deadline&&new Date(o.deadline).getTime()<now) return false;
      return true;
    });
  }

  window.SourceAOData={init,search,classify,activeOpportunities,isReady:()=>ready,db:()=>db,normalize};
})();
