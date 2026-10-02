(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let area='all';
  let format='all';
  let query='';
  let market='AO';
  let opportunities=[];
  let lang='pt';
  let localById=new Map();
  let syncState='idle';
  let lastSyncAt=null;
  let refreshing=false;
  const AUTO_REFRESH_MS=5*60*1000;

  const copy={
    pt:{
      live:'Intelligence live',
      liveUpdating:'A sincronizar',
      liveFallback:'Dados disponíveis',
      back:'← Source AO',
      eyebrow:'SOURCE AO · INTELLIGENCE RADAR',
      title:'Não veja apenas oportunidades.\nEntenda quais merecem ação.',
      lead:'O Radar cruza prazo, fonte, setor, localização e compatibilidade comercial para transformar anúncios dispersos em prioridades de negócio verificáveis.',
      engineState:'Motor ativo',
      statActive:'Oportunidades ativas',statActiveNote:'com prazo válido',
      statHighFit:'Fit elevado',statHighFitNote:'score ≥ 80',
      statUrgent:'Ação urgente',statUrgentNote:'≤ 5 dias',
      statMarkets:'Mercado',statMarketsNote:'Angola',
      currentEyebrow:'PRIORIDADE COMERCIAL',currentTitle:'Opportunity Intelligence',
      currentLead:'Ordenado por prazo e enriquecido com sinais de fit e confiança. A decisão final continua dependente da análise das peças do procedimento.',
      marketLabel:'MERCADO',areaLabel:'ÁREA',formatLabel:'FORMATO',marketAll:'Todos',
      searchLabel:'PESQUISAR',searchPlaceholder:'Ex.: canalização, pintura, manutenção…',
      filterAll:'Todas',areaConstruction:'Construção',areaFacilities:'Facilities',areaPlumbing:'Canalização',areaElectrical:'Elétrica / HVAC',areaSupply:'Fornecimento',areaSubcontracting:'Subcontratação',
      formatAll:'Todos',filterTender:'Concurso',
      nextAction:'PRÓXIMA AÇÃO',actionPrepare:'Rever requisitos e preparar candidatura',actionSupply:'Confirmar custo e fornecedor',actionPartner:'Validar capacidade e parceiro',actionVerify:'Abrir fonte e validar elegibilidade',actionMonitor:'Monitorizar e reconfirmar',
      workspaceTitle:'Fila inteligente de oportunidades',
      loading:'A carregar inteligência de oportunidades…',empty:'Nenhuma oportunidade ativa neste filtro.',
      refreshNow:'Atualizar agora',refreshing:'A atualizar…',
      syncing:'A sincronizar oportunidades com a API live…',
      liveSynced:'Sincronizado com a API live',
      liveUnavailable:'Ligação live temporariamente indisponível',
      autoRefresh:'Atualização automática a cada 5 min',
      fallbackNote:'A mostrar os últimos dados disponíveis; nova tentativa automática em até 5 min',
      sourcesChecked:'fontes verificadas',
      fit:'Fit',confidence:'Confiança',sourceChecked:'Fonte verificada',deadline:'Prazo',
      priorityHigh:'Prioridade alta',priorityMedium:'Avaliar',priorityLow:'Monitorizar',
      openSource:'Abrir fonte →',analyse:'Analisar oportunidade',map:'Ver no Google Maps ↗',
      signalFresh:'Fonte recente',signalRef:'Referência',signalDeadline:'Prazo confirmado',details:'Detalhes da análise',
      serviceBy:'Um serviço da HMATIAS',
      disclaimer:'Fit e confiança são sinais de triagem, não garantias de elegibilidade ou adjudicação. Confirme sempre a fonte original, os documentos do procedimento e os requisitos de qualificação.'
    },
    en:{
      live:'Intelligence live',
      liveUpdating:'Syncing',
      liveFallback:'Available data',
      back:'← Source AO',
      eyebrow:'SOURCE AO · INTELLIGENCE RADAR',
      title:'Do not just see opportunities.\nKnow which ones deserve action.',
      lead:'The Radar combines deadline, source, sector, location and commercial fit to turn scattered notices into verifiable business priorities.',
      engineState:'Engine active',
      statActive:'Active opportunities',statActiveNote:'valid deadline',
      statHighFit:'High fit',statHighFitNote:'score ≥ 80',
      statUrgent:'Urgent action',statUrgentNote:'≤ 5 days',
      statMarkets:'Market',statMarketsNote:'Angola',
      currentEyebrow:'COMMERCIAL PRIORITY',currentTitle:'Opportunity Intelligence',
      currentLead:'Sorted by deadline and enriched with fit and confidence signals. Final decisions still require review of the procurement documents.',
      marketLabel:'MARKET',areaLabel:'AREA',formatLabel:'FORMAT',marketAll:'All',
      searchLabel:'SEARCH',searchPlaceholder:'E.g. plumbing, painting, maintenance…',
      filterAll:'All',areaConstruction:'Construction',areaFacilities:'Facilities',areaPlumbing:'Plumbing',areaElectrical:'Electrical / HVAC',areaSupply:'Supply',areaSubcontracting:'Subcontracting',
      formatAll:'All',filterTender:'Tender',
      nextAction:'NEXT ACTION',actionPrepare:'Review requirements and prepare bid',actionSupply:'Confirm cost and supplier',actionPartner:'Validate capacity and partner',actionVerify:'Open source and validate eligibility',actionMonitor:'Monitor and reconfirm',
      workspaceTitle:'Intelligent opportunity queue',
      loading:'Loading opportunity intelligence…',empty:'No active opportunity in this filter.',
      refreshNow:'Refresh now',refreshing:'Refreshing…',
      syncing:'Syncing opportunities with the live API…',
      liveSynced:'Synced with the live API',
      liveUnavailable:'Live connection temporarily unavailable',
      autoRefresh:'Automatic refresh every 5 min',
      fallbackNote:'Showing the latest available data; automatic retry within 5 min',
      sourcesChecked:'sources checked',
      fit:'Fit',confidence:'Confidence',sourceChecked:'Source checked',deadline:'Deadline',
      priorityHigh:'High priority',priorityMedium:'Assess',priorityLow:'Monitor',
      openSource:'Open source →',analyse:'Analyse opportunity',map:'Open in Google Maps ↗',
      signalFresh:'Recent source',signalRef:'Reference',signalDeadline:'Deadline confirmed',details:'Analysis details',
      serviceBy:'A service by HMATIAS',
      disclaimer:'Fit and confidence are triage signals, not guarantees of eligibility or award. Always verify the original source, procurement documents and qualification requirements.'
    }
  };

  const t=key=>copy[lang][key]||key;
  const fmt=value=>new Intl.DateTimeFormat(lang==='pt'?'pt-PT':'en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
  const clock=value=>new Intl.DateTimeFormat(lang==='pt'?'pt-PT':'en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));
  const daysLeft=value=>Math.ceil((new Date(value).getTime()-Date.now())/86400000);

  function latestSourceCheckedAt(){
    const times=opportunities
      .map(o=>new Date(o.source_checked_at||'').getTime())
      .filter(Number.isFinite);
    return times.length?new Date(Math.max(...times)):null;
  }

  function updateSyncUI(){
    const status=$('#syncStatus');
    const meta=$('#syncMeta');
    const button=$('#refreshRadar');
    const buttonLabel=$('#refreshRadarLabel');
    const liveLabel=$('#liveStateLabel');
    if(!status||!meta)return;

    const sourceAt=latestSourceCheckedAt();
    const sourceMeta=sourceAt?t('sourcesChecked')+' '+clock(sourceAt):'';
    document.body.classList.toggle('op-live-unavailable',syncState==='fallback');
    document.body.classList.toggle('op-live-syncing',syncState==='syncing');

    if(syncState==='syncing'){
      status.textContent=t('syncing');
      meta.textContent=t('autoRefresh');
      if(liveLabel)liveLabel.textContent=t('liveUpdating');
    }else if(syncState==='live'){
      status.textContent=t('liveSynced')+(lastSyncAt?' · '+clock(lastSyncAt):'');
      meta.textContent=[t('autoRefresh'),sourceMeta].filter(Boolean).join(' · ');
      if(liveLabel)liveLabel.textContent=t('live');
    }else if(syncState==='fallback'){
      status.textContent=t('liveUnavailable');
      meta.textContent=[t('fallbackNote'),sourceMeta].filter(Boolean).join(' · ');
      if(liveLabel)liveLabel.textContent=t('liveFallback');
    }else{
      status.textContent=t('syncing');
      meta.textContent=t('autoRefresh');
      if(liveLabel)liveLabel.textContent=t('liveUpdating');
    }

    if(button){
      button.disabled=refreshing;
      button.setAttribute('aria-busy',refreshing?'true':'false');
    }
    if(buttonLabel)buttonLabel.textContent=refreshing?t('refreshing'):t('refreshNow');
  }

  async function refreshLiveData(){
    if(refreshing)return;
    refreshing=true;
    syncState='syncing';
    updateSyncUI();
    try{
      if(!window.SourceAOAPI?.isConfigured?.())throw new Error('live_api_not_configured');
      const payload=await window.SourceAOAPI.opportunities();
      const live=Array.isArray(payload)?payload:(payload?.results||payload?.opportunities||[]);
      if(!Array.isArray(live))throw new Error('invalid_opportunity_payload');
      opportunities=live.filter(row=>inferredCountry(row)==='AO').map(row=>({...localById.get(row.id),...row}));
      lastSyncAt=new Date();
      syncState='live';
    }catch(error){
      syncState='fallback';
      if(!opportunities.length)opportunities=[...localById.values()].filter(row=>inferredCountry(row)==='AO');
      console.warn('[Source AO Radar] live refresh unavailable; keeping latest available data',error);
    }finally{
      refreshing=false;
      render();
      updateSyncUI();
    }
  }

  function inferredCountry(o){
    if(o.country_code)return o.country_code;
    const location=String(o.location||'').toLowerCase();
    if(location.includes('namibia'))return 'NA';
    if(location.includes('south africa'))return 'ZA';
    return 'AO';
  }

  function normalizeText(value=''){
    return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function opportunityText(o){
    const tags=Array.isArray(o.fit_tags)?o.fit_tags.join(' '):'';
    return normalizeText([
      o.title,o.title_pt,o.scope_summary,o.scope_summary_pt,o.source_fit,o.source_fit_pt,
      o.sector,o.issuer,o.location,o.type,tags
    ].filter(Boolean).join(' '));
  }

  function areaTags(o){
    const text=opportunityText(o);
    const tags=new Set();
    if(/construc|obra|civil|edific|building|rehabilit|reabilit|renovat|remodel|infraestrut/.test(text))tags.add('construction');
    if(/facilit|manutenc|maintenance|limpeza|cleaning|higien|reparac|repair/.test(text))tags.add('facilities');
    if(/canaliz|plumbing|hidraul|hydraulic|abastecimento de agua|water supply|borehole|furo/.test(text))tags.add('plumbing');
    if(/electric|eletric|hvac|climatiz|ar condicionado|air condition/.test(text))tags.add('electrical-hvac');
    if(o.type==='supply-request'||/fornec|supply|aquisic|procurement|material|equipament|equipment|ferrament/.test(text))tags.add('supply');
    if(o.type==='subcontracting'||/subcontrat|subcontract/.test(text))tags.add('subcontracting');
    if(!tags.size&&['maintenance','small-contract'].includes(o.type))tags.add('facilities');
    return [...tags];
  }

  function matchesFilter(o){
    if(market!=='all'&&inferredCountry(o)!==market)return false;
    if(area!=='all'&&!areaTags(o).includes(area))return false;
    if(format!=='all'&&o.type!==format)return false;
    if(query){
      const terms=normalizeText(query).split(/\s+/).filter(Boolean);
      const haystack=opportunityText(o);
      if(!terms.every(term=>haystack.includes(term)))return false;
    }
    return true;
  }

  function marketLabel(o){
    const code=inferredCountry(o);
    const labels=lang==='pt'?{AO:'Angola',NA:'Namíbia',ZA:'África do Sul'}:{AO:'Angola',NA:'Namibia',ZA:'South Africa'};
    return labels[code]||code;
  }

  function typeLabel(type){
    const pt={rfq:'RFQ',tender:'Concurso','supply-request':'Fornecimento',maintenance:'Manutenção','small-contract':'Pequeno contrato',subcontracting:'Subcontratação'};
    const en={rfq:'RFQ',tender:'Tender','supply-request':'Supply',maintenance:'Maintenance','small-contract':'Small contract',subcontracting:'Subcontracting'};
    return (lang==='pt'?pt:en)[type]||type||'Opportunity';
  }

  function areaLabelValue(value){
    const pt={construction:'Construção',facilities:'Facilities',plumbing:'Canalização / Hidráulica','electrical-hvac':'Elétrica / HVAC',supply:'Fornecimento',subcontracting:'Subcontratação'};
    const en={construction:'Construction',facilities:'Facilities',plumbing:'Plumbing / Hydraulic','electrical-hvac':'Electrical / HVAC',supply:'Supply',subcontracting:'Subcontracting'};
    return (lang==='pt'?pt:en)[value]||value;
  }

  function recommendedAction(o){
    const fit=Number(o.fit_score)||0;
    const days=daysLeft(o.deadline);
    if(fit>=80&&days>=0&&days<=14)return t('actionPrepare');
    if(o.type==='supply-request'||areaTags(o).includes('supply'))return t('actionSupply');
    if(['maintenance','small-contract','subcontracting'].includes(o.type))return t('actionPartner');
    if(fit>=60)return t('actionVerify');
    return t('actionMonitor');
  }

  function confidenceScore(o){
    let score=0;
    if(/^https:\/\//i.test(String(o.source_url||'')))score+=20;
    if(o.deadline)score+=20;
    if(o.reference)score+=15;
    if(o.issuer)score+=15;
    if(o.scope_summary||o.source_fit)score+=10;
    if(o.source_checked_at){
      const age=(Date.now()-new Date(o.source_checked_at).getTime())/86400000;
      score+=Number.isFinite(age)&&age<=7?20:Number.isFinite(age)&&age<=30?12:5;
    }
    return Math.min(100,score);
  }

  function priority(o){
    const fit=Number(o.fit_score)||0;
    const days=daysLeft(o.deadline);
    if(fit>=80&&days>=0&&days<=14)return {key:'priorityHigh',cls:'high'};
    if(fit>=65||days<=7)return {key:'priorityMedium',cls:'medium'};
    return {key:'priorityLow',cls:'low'};
  }

  function deadlineLabel(value){
    const days=Math.max(0,daysLeft(value));
    if(lang==='pt'){
      if(days===0)return 'Encerra hoje';
      if(days===1)return '1 dia restante';
      return days+' dias restantes';
    }
    if(days===0)return 'Closes today';
    if(days===1)return '1 day left';
    return days+' days left';
  }

  function mapHref(o){
    const query=[o.location,o.issuer].filter(Boolean).join(', ')||marketLabel(o);
    return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
  }

  function requestHref(o){
    const params=new URLSearchParams({request:o.title||'',ref:o.reference||'',location:o.location||'Angola'});
    return 'index.html?'+params.toString()+'#request';
  }

  function updateStats(){
    const active=opportunities.filter(o=>daysLeft(o.deadline)>=0);
    $('#activeCount').textContent=active.length;
    $('#highFitCount').textContent=active.filter(o=>(Number(o.fit_score)||0)>=80).length;
    $('#urgentCount').textContent=active.filter(o=>{const d=daysLeft(o.deadline);return d>=0&&d<=5;}).length;
    $('#marketCount').textContent='AO';
  }

  function applyLanguage(){
    document.documentElement.lang=lang==='pt'?'pt-AO':'en';
    $$('[data-i18n]').forEach(node=>{
      const value=copy[lang][node.dataset.i18n];
      if(!value)return;
      if(node.tagName==='H1')node.innerHTML=value.replace('\n','<br>');
      else node.textContent=value;
    });
    $$('[data-i18n-placeholder]').forEach(node=>{
      const value=copy[lang][node.dataset.i18nPlaceholder];
      if(value)node.setAttribute('placeholder',value);
    });
    $('#langToggle').textContent=lang==='pt'?'EN':'PT';
    render();
    updateSyncUI();
  }

  function render(){
    const list=$('#opList');
    const visible=opportunities.filter(matchesFilter).sort((a,b)=>{
      const pA=priority(a).cls==='high'?0:priority(a).cls==='medium'?1:2;
      const pB=priority(b).cls==='high'?0:priority(b).cls==='medium'?1:2;
      return pA-pB||new Date(a.deadline)-new Date(b.deadline);
    });
    updateStats();
    $('#visibleCount').textContent=lang==='pt'?visible.length+' visíveis':visible.length+' visible';
    list.innerHTML='';

    if(!visible.length){
      const p=document.createElement('p');p.className='op-loading';p.textContent=t('empty');list.appendChild(p);return;
    }

    visible.forEach(o=>{
      const fitScore=Math.max(0,Math.min(100,Number(o.fit_score)||0));
      const confidence=confidenceScore(o);
      const p=priority(o);
      const card=document.createElement('article');card.className='op-card';

      const scoreCol=document.createElement('div');scoreCol.className='op-score-column';
      const score=document.createElement('div');score.className='op-score';
      const scoreNum=document.createElement('strong');scoreNum.textContent=fitScore||'—';
      const scoreLabel=document.createElement('small');scoreLabel.textContent=t('fit')+' / 100';
      score.append(scoreNum,scoreLabel);
      const conf=document.createElement('div');conf.className='op-confidence';conf.textContent=t('confidence')+' '+confidence;
      scoreCol.append(score,conf);

      const main=document.createElement('div');
      const kicker=document.createElement('div');kicker.className='op-kicker';
      const dot=document.createElement('i');
      const kickerText=document.createElement('span');kickerText.textContent=marketLabel(o)+' · '+typeLabel(o.type)+(o.reference?' · '+o.reference:'');
      kicker.append(dot,kickerText);
      const title=document.createElement('h3');title.textContent=lang==='pt'?(o.title_pt||o.title):o.title;
      const areaRow=document.createElement('div');areaRow.className='op-area-row';
      areaTags(o).slice(0,3).forEach(value=>{const s=document.createElement('span');s.textContent=areaLabelValue(value);areaRow.appendChild(s);});
      const meta=document.createElement('div');meta.className='op-meta';
      [o.issuer,o.location,o.currency_code,o.sector].filter(Boolean).forEach(v=>{const s=document.createElement('span');s.textContent=v;meta.appendChild(s);});
      const fitText=lang==='pt'?(o.source_fit_pt||o.scope_summary_pt||o.source_fit||o.scope_summary||''):(o.source_fit||o.scope_summary||'');
      const fit=document.createElement('p');fit.className='op-fit op-fit-desktop';fit.textContent=fitText;
      const fitDetails=document.createElement('details');fitDetails.className='op-fit-mobile';
      const fitSummary=document.createElement('summary');fitSummary.textContent=t('details');
      const fitMobile=document.createElement('p');fitMobile.className='op-fit';fitMobile.textContent=fitText;
      fitDetails.append(fitSummary,fitMobile);

      const signals=document.createElement('div');signals.className='op-signal-row';
      if(o.reference){const s=document.createElement('span');s.className='op-signal good';s.textContent=t('signalRef');signals.appendChild(s);}
      if(o.deadline){const s=document.createElement('span');s.className='op-signal good';s.textContent=t('signalDeadline');signals.appendChild(s);}
      if(o.source_checked_at){
        const age=(Date.now()-new Date(o.source_checked_at).getTime())/86400000;
        const s=document.createElement('span');s.className='op-signal '+(age<=7?'good':'warn');s.textContent=t('signalFresh');signals.appendChild(s);
      }
      main.append(kicker,title);
      if(areaRow.childElementCount)main.append(areaRow);
      main.append(meta);
      if(fitText)main.append(fit,fitDetails);
      main.append(signals);

      const side=document.createElement('div');side.className='op-side';
      const priorityEl=document.createElement('span');priorityEl.className='op-priority '+p.cls;priorityEl.textContent=t(p.key);
      const next=document.createElement('div');next.className='op-next-action';
      const nextLabel=document.createElement('small');nextLabel.textContent=t('nextAction');
      const nextValue=document.createElement('strong');nextValue.textContent=recommendedAction(o);
      next.append(nextLabel,nextValue);
      const deadline=document.createElement('div');deadline.className='op-deadline';deadline.textContent=t('deadline');
      const strong=document.createElement('strong');strong.textContent=fmt(o.deadline);deadline.appendChild(strong);
      const remaining=document.createElement('small');remaining.className='op-remaining';remaining.textContent=deadlineLabel(o.deadline);deadline.appendChild(remaining);
      const actions=document.createElement('div');actions.className='op-actions';
      const analyse=document.createElement('a');analyse.className='btn btn-primary btn-small op-analyse';analyse.href=requestHref(o);analyse.textContent=t('analyse');
      const source=document.createElement('a');source.className='op-source';source.href=o.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent=t('openSource');
      const map=document.createElement('a');map.className='op-map';map.href=mapHref(o);map.target='_blank';map.rel='noopener noreferrer';map.textContent=t('map');
      actions.append(analyse,source,map);
      side.append(priorityEl,next,deadline,actions);

      card.append(scoreCol,main,side);
      list.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    await window.SourceAOData?.init();
    const local=window.SourceAOData?.activeOpportunities?.()||[];
    localById=new Map(local.map(row=>[row.id,row]));
    opportunities=local.filter(row=>inferredCountry(row)==='AO');
    syncState='syncing';
    applyLanguage();
    await refreshLiveData();

    $$('[data-market]').forEach(btn=>btn.addEventListener('click',()=>{
      market=btn.dataset.market;
      $$('[data-market]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
    $$('[data-area]').forEach(btn=>btn.addEventListener('click',()=>{
      area=btn.dataset.area;
      $$('[data-area]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
    $$('[data-format]').forEach(btn=>btn.addEventListener('click',()=>{
      format=btn.dataset.format;
      $$('[data-format]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
    $('#opportunitySearch')?.addEventListener('input',event=>{
      query=event.target.value.trim();
      render();
    });
    $('#langToggle')?.addEventListener('click',()=>{lang=lang==='pt'?'en':'pt';applyLanguage();});
    $('#refreshRadar')?.addEventListener('click',()=>refreshLiveData());

    setInterval(()=>{
      if(document.visibilityState==='visible')refreshLiveData();
    },AUTO_REFRESH_MS);

    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState!=='visible')return;
      if(!lastSyncAt||Date.now()-lastSyncAt.getTime()>=AUTO_REFRESH_MS)refreshLiveData();
    });
  });
})();