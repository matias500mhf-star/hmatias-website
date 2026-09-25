(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  let dataReady=false;
  let apiSequence=0;
  let smartSequence=0;

  const isPt=()=>document.documentElement.lang.toLowerCase().startsWith('pt');
  const labels={
    en:{discovered:'Verification required',supplier_candidate:'Potential supplier — product unconfirmed',recently_seen:'Recently seen',source_checked:'Source checked',supplier_confirmed:'Supplier confirmed',in_stock_confirmed:'In stock — confirmed',needs_reconfirmation:'Needs reconfirmation',unavailable:'Unavailable',none:'No verified indexed match',awaiting:'Awaiting verified source',verified:'Verified indexed result'},
    pt:{discovered:'Requer verificação',supplier_candidate:'Fornecedor potencial — produto não confirmado',recently_seen:'Informação recente',source_checked:'Fonte verificada',supplier_confirmed:'Fornecedor confirmou',in_stock_confirmed:'Stock confirmado',needs_reconfirmation:'Requer nova confirmação',unavailable:'Indisponível',none:'Sem resultado verificado na base',awaiting:'Aguardando fonte verificada',verified:'Resultado verificado na base'}
  };
  const L=key=>(isPt()?labels.pt:labels.en)[key]||key;
  const rank={in_stock_confirmed:6,supplier_confirmed:5,source_checked:4,recently_seen:3,supplier_candidate:2.5,needs_reconfirmation:2,discovered:1,unavailable:0};

  const formatDate=value=>{
    if(!value) return '';
    try{return new Intl.DateTimeFormat(isPt()?'pt-AO':'en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return value;}
  };

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${src}"]`);
      if(existing){
        if(existing.dataset.loaded==='true') return resolve();
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.dataset.loaded='false';
      script.addEventListener('load',()=>{script.dataset.loaded='true';resolve();},{once:true});
      script.addEventListener('error',reject,{once:true});
      document.head.appendChild(script);
    });
  }

  async function ensureRuntimeAPI(){
    try{
      if(!window.SOURCE_AO_RUNTIME) await loadScript('runtime-config.js');
      if(!window.SourceAOAPI) await loadScript('api-client.js');
    }catch(error){
      console.warn('[Source AO API bootstrap]',error);
    }
  }

  function ensureList(){
    let list=$('#verifiedMatches');
    if(list) return list;
    list=document.createElement('div');
    list.id='verifiedMatches';
    list.className='verified-matches';
    list.hidden=true;
    const note=$('.primary-result .result-note');
    note?.after(list);
    return list;
  }

  function ensureSmartPanel(){
    let panel=$('#smartSearchPlan');
    if(panel) return panel;
    panel=document.createElement('section');
    panel.id='smartSearchPlan';
    panel.className='smart-search-plan';
    panel.hidden=true;
    const list=ensureList();
    list.after(panel);
    return panel;
  }

  function renderSmartPlan(payload){
    const plan=payload?.plan;
    const panel=ensureSmartPanel();
    if(!plan){panel.hidden=true;panel.replaceChildren();return;}
    panel.hidden=false;
    panel.replaceChildren();

    const head=document.createElement('div');head.className='smart-search-head';
    const title=document.createElement('strong');title.textContent=isPt()?'Pesquisa inteligente':'Smart search';
    const badge=document.createElement('span');badge.className='data-badge data-source_checked';badge.textContent=plan.urgency==='urgent'?(isPt()?'URGENTE':'URGENT'):(isPt()?'PLANO':'PLAN');
    head.append(title,badge);

    const summary=document.createElement('p');
    const label=isPt()?plan.interpretation?.label_pt:plan.interpretation?.label_en;
    const specs=(plan.interpretation?.specifications||[]).join(', ');
    summary.textContent=[label,specs,plan.location].filter(Boolean).join(' · ');

    const terms=document.createElement('div');terms.className='smart-search-terms';
    (plan.query_variants||[]).slice(0,6).forEach(value=>{
      const chip=document.createElement('span');chip.textContent=value;terms.appendChild(chip);
    });

    const note=document.createElement('small');
    note.textContent=isPt()
      ?'A IA de pesquisa expande nomes e especificações. Stock, preço e prazo continuam a exigir confirmação rastreável.'
      :'Search intelligence expands names and specifications. Stock, price and delivery still require traceable confirmation.';

    panel.append(head,summary,terms,note);
  }

  function matchCopy(match){
    if(match.kind==='supplier_candidate'){
      return {
        title:match.supplier.name,
        detail:[isPt()?'Fornecedor potencial; produto exato por confirmar':'Potential supplier; exact product unconfirmed',match.supplier.location].filter(Boolean).join(' · '),
        time:match.supplier.last_verified_at
      };
    }
    if(match.kind==='service'){
      return {
        title:match.provider.name,
        detail:[match.provider.service_category,match.provider.location].filter(Boolean).join(' · '),
        time:match.provider.last_verified_at
      };
    }
    return {
      title:match.item.name,
      detail:[match.item.specification,match.supplier?.name,match.observation?.location||match.supplier?.location].filter(Boolean).join(' · '),
      time:match.observation?.verified_at||match.observation?.observed_at
    };
  }

  function renderMatches(result){
    const list=ensureList();
    const visible=(result.matches||[]).filter(m=>m.status!=='discovered').slice(0,3);
    list.innerHTML='';
    if(!visible.length){list.hidden=true;return;}
    list.hidden=false;
    visible.forEach(match=>{
      const copy=matchCopy(match);
      const row=document.createElement('div');
      row.className='verified-match';
      const main=document.createElement('div');
      const title=document.createElement('strong');title.textContent=copy.title;
      const detail=document.createElement('small');detail.textContent=copy.detail||L(match.status);
      main.append(title,detail);
      const meta=document.createElement('div');meta.className='verified-match-meta';
      const badge=document.createElement('span');badge.className='data-badge data-'+match.status;badge.textContent=L(match.status);
      meta.appendChild(badge);
      if(copy.time){const time=document.createElement('small');time.textContent=formatDate(copy.time);meta.appendChild(time);}
      row.append(main,meta);list.appendChild(row);
    });
  }

  function applyResult(result){
    const status=$('#resultStatus');
    const freshness=$('.result-meta>div:nth-child(3) strong');
    const confidence=$('.confidence-card strong');
    const dot=$('.confidence-dot');
    const best=result.best_status||'discovered';
    const hasIndexed=(result.matches||[]).length>0;

    if(status){
      status.textContent=L(best);
      status.classList.toggle('status-good',['supplier_confirmed','in_stock_confirmed'].includes(best));
      status.classList.toggle('status-review',!['supplier_confirmed','in_stock_confirmed'].includes(best));
    }
    if(freshness) freshness.textContent=hasIndexed?L(best):L('none');
    if(confidence) confidence.textContent=['supplier_confirmed','in_stock_confirmed','source_checked'].includes(best)?L('verified'):L('awaiting');
    if(dot) dot.dataset.state=best;
    renderMatches(result);
  }

  function refreshStaticSearch(){
    if(!dataReady||!window.SourceAOData?.isReady()) return;
    const query=$('#searchInput')?.value.trim();
    if(!query||$('#resultZone')?.hidden) return;
    const location=$('#locationInput')?.value||'Luanda';
    const result=window.SourceAOData.search(query,location);
    const category=$('#categoryValue');
    if(category) category.textContent=window.SourceAOData.classify(query,isPt()?'pt':'en');
    applyResult(result);
  }

  function fromApi(payload){
    const matches=(payload?.results||[]).map(row=>{
      if(row.type==='service'){
        return {kind:'service',provider:{name:row.name,service_category:row.category,location:row.location,last_verified_at:row.verified_at},status:row.status||'discovered'};
      }
      if(row.type==='supplier_candidate'){
        return {kind:'supplier_candidate',supplier:{name:row.name,location:row.location,website:row.website,last_verified_at:row.verified_at},status:'supplier_candidate'};
      }
      return {
        kind:'item',
        item:{name:row.name,specification:row.specification||'',category:row.category},
        supplier:row.supplier||null,
        observation:{verified_at:row.verified_at||null,observed_at:row.verified_at||null,location:row.supplier?.location||null},
        status:row.status||'discovered'
      };
    }).sort((a,b)=>(rank[b.status]||0)-(rank[a.status]||0));
    return {matches,best_status:matches[0]?.status||'discovered'};
  }

  async function refreshApiSearch(){
    if(!window.SourceAOAPI?.isConfigured?.()) return;
    const query=$('#searchInput')?.value.trim();
    if(!query||$('#resultZone')?.hidden) return;
    const location=$('#locationInput')?.value||'Luanda';
    const sequence=++apiSequence;
    try{
      const payload=await window.SourceAOAPI.search(query,location);
      if(sequence!==apiSequence) return;
      applyResult(fromApi(payload));
    }catch(error){
      console.warn('[Source AO API search fallback]',error);
    }
  }

  async function refreshSmartSearch(){
    if(!window.SourceAOAPI?.isConfigured?.()||!window.SourceAOAPI.searchIntelligence) return;
    const query=$('#searchInput')?.value.trim();
    if(!query||$('#resultZone')?.hidden) return;
    const location=$('#locationInput')?.value||'Luanda';
    const sequence=++smartSequence;
    try{
      const payload=await window.SourceAOAPI.searchIntelligence(query,location);
      if(sequence!==smartSequence) return;
      renderSmartPlan(payload);
    }catch(error){
      console.warn('[Source AO Smart Search fallback]',error);
    }
  }

  function refreshSearch(){
    refreshStaticSearch();
    void refreshApiSearch();
    void refreshSmartSearch();
  }

  function enrichRadar(){
    if(!dataReady) return;
    document.querySelectorAll('#radarList .radar-item').forEach(row=>{
      const q=row.querySelector('strong')?.textContent?.trim();
      const small=row.querySelector('small');
      if(!q||!small) return;
      const loc=(small.textContent.split(' · ')[0]||'Luanda').trim();
      const result=window.SourceAOData.search(q,loc);
      const best=result.best_status||'discovered';
      const next=loc+' · '+L(best==='discovered'?'awaiting':best);
      if(small.textContent!==next) small.textContent=next;
    });
  }

  async function enrichRadarApi(){
    if(!window.SourceAOAPI?.isConfigured?.()) return;
    const rows=[...document.querySelectorAll('#radarList .radar-item')];
    await Promise.all(rows.map(async row=>{
      const q=row.querySelector('strong')?.textContent?.trim();
      const small=row.querySelector('small');
      if(!q||!small) return;
      const loc=(small.textContent.split(' · ')[0]||'Luanda').trim();
      try{
        const result=fromApi(await window.SourceAOAPI.search(q,loc));
        const best=result.best_status||'discovered';
        small.textContent=loc+' · '+L(best==='discovered'?'awaiting':best);
      }catch(error){
        console.warn('[Source AO Radar API fallback]',error);
      }
    }));
  }

  function later(){setTimeout(()=>{refreshSearch();enrichRadar();void enrichRadarApi();},0);}

  document.addEventListener('DOMContentLoaded',async()=>{
    ensureList();
    await ensureRuntimeAPI();
    await window.SourceAOData?.init();
    dataReady=true;
    refreshSearch();
    enrichRadar();
    void enrichRadarApi();

    $('#searchForm')?.addEventListener('submit',later);
    document.querySelectorAll('[data-query]').forEach(btn=>btn.addEventListener('click',later));
    $('#langToggle')?.addEventListener('click',later);
    $('#locationInput')?.addEventListener('change',later);
    $('#radarForm')?.addEventListener('submit',later);
    $('#addRadar')?.addEventListener('click',later);

    const list=$('#radarList');
    if(list) new MutationObserver(()=>{enrichRadar();void enrichRadarApi();}).observe(list,{childList:true,subtree:true});
  });
})();
