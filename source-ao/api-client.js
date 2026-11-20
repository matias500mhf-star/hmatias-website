(()=>{
  'use strict';
  const config=()=>window.SOURCE_AO_RUNTIME||{};
  const base=()=>String(config().apiBase||'').replace(/\/$/,'');
  const isConfigured=()=>/^https:\/\//i.test(base());
  let publicCatalogPromise=null;

  async function request(path,timeoutMs=12000){
    if(!isConfigured()) throw new Error('Source AO API is not configured');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const res=await fetch(base()+path,{headers:{accept:'application/json'},cache:'no-store',signal:controller.signal});
      if(!res.ok) throw new Error(`Source AO API HTTP ${res.status}`);
      return await res.json();
    }finally{
      clearTimeout(timeout);
    }
  }

  function normalizeSearch(value=''){
    return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/(\d)\s+(mm|cm|m|kg|g|l|kw|kva|btu)\b/g,'$1$2')
      .replace(/[^a-z0-9]+/g,' ').trim();
  }

  function tokenMatches(text,token){
    const variants=token.length>4&&token.endsWith('s')?[token,token.slice(0,-1)]:[token];
    return variants.some(variant=>text.includes(variant));
  }

  async function loadPublicCatalog(){
    if(!publicCatalogPromise){
      const url=String(config().catalogUrl||'/api/source-ao/catalog.json');
      publicCatalogPromise=fetch(url,{headers:{accept:'application/json'},cache:'no-store'})
        .then(async response=>{
          if(!response.ok) throw new Error(`Public preview catalogue HTTP ${response.status}`);
          const catalogue=await response.json();
          if(!catalogue||!Array.isArray(catalogue.items)||!Array.isArray(catalogue.taxonomy)){
            throw new Error('Invalid public preview catalogue');
          }
          return catalogue;
        })
        .catch(error=>{
          publicCatalogPromise=null;
          throw error;
        });
    }
    return publicCatalogPromise;
  }

  async function searchStaticCatalog(query,location='Luanda'){
    const catalogue=await loadPublicCatalog();
    const normalized=normalizeSearch(query);
    const tokens=[...new Set(normalized.split(/\s+/).filter(Boolean))];
    if(tokens.length===0||tokens.length>8) throw new Error('Invalid preview catalogue search query');
    const english=String(config().language||'pt-AO').toLowerCase().startsWith('en');
    const results=catalogue.items.map(item=>{
      const fields=[
        item.name,item.name_pt,item.category,item.subcategory,item.specification,
        ...(Array.isArray(item.aliases)?item.aliases:[]),
        ...(Array.isArray(item.keywords)?item.keywords:[])
      ].filter(Boolean);
      const searchText=normalizeSearch(fields.join(' '));
      if(!tokens.every(token=>tokenMatches(searchText,token))) return null;
      const displayName=english?(item.name||item.name_pt):(item.name_pt||item.name);
      const normalizedNames=normalizeSearch([item.name,item.name_pt,...(item.aliases||[])].filter(Boolean).join(' '));
      const phraseMatch=normalizedNames.includes(normalized)?2:0;
      const leadingMatch=normalizeSearch(displayName).startsWith(normalized)?1:0;
      return {
        type:'item',
        id:item.id,
        name:displayName,
        category:item.category,
        specification:item.specification,
        status:'discovered',
        score:phraseMatch+leadingMatch
      };
    }).filter(Boolean).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,english?'en':'pt'));
    return {
      ok:true,
      source:'static-preview',
      query:String(query),
      normalized_query:normalized,
      location:String(location||'Luanda'),
      catalogue_version:catalogue.version,
      catalogue_updated_at:catalogue.updated_at,
      results:results.slice(0,12).map(({score,...item})=>item)
    };
  }

  async function search(query,location='Luanda'){
    if(isConfigured()){
      const payload=await request('/api/search?q='+encodeURIComponent(query)+'&location='+encodeURIComponent(location));
      return {...payload,source:'staging-api'};
    }
    return searchStaticCatalog(query,location);
  }

  async function searchIntelligence(query,location='Luanda',options={}){
    const params=new URLSearchParams({q:query,location});
    if(options.neededBy) params.set('needed_by',options.neededBy);
    if(options.quantity!=null&&options.quantity!=='') params.set('quantity',String(options.quantity));
    return request('/api/search-intelligence?'+params.toString(),12000);
  }

  async function procurementMission(query,location='Luanda',options={}){
    const params=new URLSearchParams({q:query,location});
    if(options.neededBy) params.set('needed_by',options.neededBy);
    if(options.quantity!=null&&options.quantity!=='') params.set('quantity',String(options.quantity));
    return request('/api/procurement-mission?'+params.toString());
  }

  async function opportunities(){
    return request('/api/opportunities');
  }

  async function health(){
    return request('/health');
  }

  async function automationStatus(){
    return request('/api/automation/status',8000);
  }

  window.SourceAOAPI=Object.freeze({isConfigured,search,searchIntelligence,procurementMission,opportunities,health,automationStatus});
})();
