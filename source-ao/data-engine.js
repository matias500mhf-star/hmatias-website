(()=>{
  'use strict';

  const paths={
    catalog:'data/catalog.json',
    opportunities:'data/opportunities.json',
    registry:'data/source-registry.json'
  };

  const db={catalog:{items:[],taxonomy:[]},opportunities:{opportunities:[]},registry:{source_types:[],verification_rules:{}}};
  let ready=false;

  const normalize=value=>(value||'')
    .toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/(\d)\s+(mm|cm|m|kg|g|l|kw|kva|btu)\b/g,'$1$2')
    .replace(/[^a-z0-9]+/g,' ').trim();

  const tokens=value=>new Set(normalize(value).split(/\s+/).filter(Boolean));

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

  function search(query,location='Luanda'){
    // Offline fallback describes catalogue families only. Supplier evidence is
    // obtained through the API's public projection, never raw browser data.
    const matches=(db.catalog.items||[])
      .map(item=>({kind:'item',item,score:textScore(query,item),status:'discovered'}))
      .filter(row=>row.score>=35)
      .sort((a,b)=>b.score-a.score)
      .slice(0,8);
    const best=matches[0]||null;
    return {query,location,category:taxonomyMatch(query),matches,best,best_status:'discovered'};
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
