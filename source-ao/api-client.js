(()=>{
  'use strict';
  const config=()=>window.SOURCE_AO_RUNTIME||{};
  const base=()=>String(config().apiBase||'').replace(/\/$/,'');
  const isConfigured=()=>/^https?:\/\//i.test(base());

  async function request(path){
    if(!isConfigured()) throw new Error('Source AO API is not configured');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),6000);
    try{
      const res=await fetch(base()+path,{headers:{accept:'application/json'},cache:'no-store',signal:controller.signal});
      if(!res.ok) throw new Error(`Source AO API HTTP ${res.status}`);
      return await res.json();
    }finally{
      clearTimeout(timeout);
    }
  }

  async function search(query,location='Luanda'){
    return request('/api/search?q='+encodeURIComponent(query)+'&location='+encodeURIComponent(location));
  }

  async function opportunities(){
    return request('/api/opportunities');
  }

  async function health(){
    return request('/health');
  }

  window.SourceAOAPI=Object.freeze({isConfigured,search,opportunities,health});
})();
