(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let filter='all';
  let market='all';
  let opportunities=[];
  let lang='pt';

  const copy={
    pt:{
      live:'Intelligence live',
      back:'← Source AO',
      eyebrow:'SOURCE AO · INTELLIGENCE RADAR',
      title:'Não veja apenas oportunidades.\nEntenda quais merecem ação.',
      lead:'O Radar cruza prazo, fonte, setor, localização e compatibilidade comercial para transformar anúncios dispersos em prioridades de negócio verificáveis.',
      engineState:'Motor ativo',
      statActive:'Oportunidades ativas',statActiveNote:'com prazo válido',
      statHighFit:'Fit elevado',statHighFitNote:'score ≥ 80',
      statUrgent:'Ação urgente',statUrgentNote:'≤ 5 dias',
      statMarkets:'Mercados',statMarketsNote:'África Austral',
      currentEyebrow:'PRIORIDADE COMERCIAL',currentTitle:'Opportunity Intelligence',
      currentLead:'Ordenado por prazo e enriquecido com sinais de fit e confiança. A decisão final continua dependente da análise das peças do procedimento.',
      marketLabel:'MERCADO',typeLabel:'TIPO',marketAll:'Todos',
      filterAll:'Todas',filterSupply:'Supply',filterMaintenance:'Facilities',filterTender:'Concurso',
      workspaceTitle:'Fila inteligente de oportunidades',
      loading:'A carregar inteligência de oportunidades…',empty:'Nenhuma oportunidade ativa neste filtro.',
      fit:'Fit',confidence:'Confiança',sourceChecked:'Fonte verificada',deadline:'Prazo',
      priorityHigh:'Prioridade alta',priorityMedium:'Avaliar',priorityLow:'Monitorizar',
      openSource:'Abrir fonte →',analyse:'Analisar oportunidade',map:'Ver no Google Maps ↗',
      signalFresh:'Fonte recente',signalRef:'Referência',signalDeadline:'Prazo confirmado',
      serviceBy:'Um serviço da HMATIAS',
      disclaimer:'Fit e confiança são sinais de triagem, não garantias de elegibilidade ou adjudicação. Confirme sempre a fonte original, os documentos do procedimento e os requisitos de qualificação.'
    },
    en:{
      live:'Intelligence live',
      back:'← Source AO',
      eyebrow:'SOURCE AO · INTELLIGENCE RADAR',
      title:'Do not just see opportunities.\nKnow which ones deserve action.',
      lead:'The Radar combines deadline, source, sector, location and commercial fit to turn scattered notices into verifiable business priorities.',
      engineState:'Engine active',
      statActive:'Active opportunities',statActiveNote:'valid deadline',
      statHighFit:'High fit',statHighFitNote:'score ≥ 80',
      statUrgent:'Urgent action',statUrgentNote:'≤ 5 days',
      statMarkets:'Markets',statMarketsNote:'Southern Africa',
      currentEyebrow:'COMMERCIAL PRIORITY',currentTitle:'Opportunity Intelligence',
      currentLead:'Sorted by deadline and enriched with fit and confidence signals. Final decisions still require review of the procurement documents.',
      marketLabel:'MARKET',typeLabel:'TYPE',marketAll:'All',
      filterAll:'All',filterSupply:'Supply',filterMaintenance:'Facilities',filterTender:'Tender',
      workspaceTitle:'Intelligent opportunity queue',
      loading:'Loading opportunity intelligence…',empty:'No active opportunity in this filter.',
      fit:'Fit',confidence:'Confidence',sourceChecked:'Source checked',deadline:'Deadline',
      priorityHigh:'High priority',priorityMedium:'Assess',priorityLow:'Monitor',
      openSource:'Open source →',analyse:'Analyse opportunity',map:'Open in Google Maps ↗',
      signalFresh:'Recent source',signalRef:'Reference',signalDeadline:'Deadline confirmed',
      serviceBy:'A service by HMATIAS',
      disclaimer:'Fit and confidence are triage signals, not guarantees of eligibility or award. Always verify the original source, procurement documents and qualification requirements.'
    }
  };

  const t=key=>copy[lang][key]||key;
  const fmt=value=>new Intl.DateTimeFormat(lang==='pt'?'pt-PT':'en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
  const daysLeft=value=>Math.ceil((new Date(value).getTime()-Date.now())/86400000);

  function inferredCountry(o){
    if(o.country_code)return o.country_code;
    const location=String(o.location||'').toLowerCase();
    if(location.includes('namibia'))return 'NA';
    if(location.includes('south africa'))return 'ZA';
    return 'AO';
  }

  function matchesFilter(o){
    if(market!=='all'&&inferredCountry(o)!==market)return false;
    if(filter==='all')return true;
    if(filter==='supply')return o.type==='supply-request';
    if(filter==='maintenance')return ['maintenance','small-contract','subcontracting'].includes(o.type);
    return o.type===filter;
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
    $('#marketCount').textContent=new Set(active.map(inferredCountry)).size;
  }

  function applyLanguage(){
    document.documentElement.lang=lang==='pt'?'pt-AO':'en';
    $$('[data-i18n]').forEach(node=>{
      const value=copy[lang][node.dataset.i18n];
      if(!value)return;
      if(node.tagName==='H1')node.innerHTML=value.replace('\n','<br>');
      else node.textContent=value;
    });
    $('#langToggle').textContent=lang==='pt'?'EN':'PT';
    render();
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
      const meta=document.createElement('div');meta.className='op-meta';
      [o.issuer,o.location,o.currency_code,o.sector].filter(Boolean).forEach(v=>{const s=document.createElement('span');s.textContent=v;meta.appendChild(s);});
      const fit=document.createElement('p');fit.className='op-fit';fit.textContent=lang==='pt'?(o.source_fit_pt||o.scope_summary_pt||o.source_fit||o.scope_summary||''):(o.source_fit||o.scope_summary||'');

      const signals=document.createElement('div');signals.className='op-signal-row';
      if(o.reference){const s=document.createElement('span');s.className='op-signal good';s.textContent=t('signalRef');signals.appendChild(s);}
      if(o.deadline){const s=document.createElement('span');s.className='op-signal good';s.textContent=t('signalDeadline');signals.appendChild(s);}
      if(o.source_checked_at){
        const age=(Date.now()-new Date(o.source_checked_at).getTime())/86400000;
        const s=document.createElement('span');s.className='op-signal '+(age<=7?'good':'warn');s.textContent=t('signalFresh');signals.appendChild(s);
      }
      main.append(kicker,title,meta,fit,signals);

      const side=document.createElement('div');side.className='op-side';
      const priorityEl=document.createElement('span');priorityEl.className='op-priority '+p.cls;priorityEl.textContent=t(p.key);
      const deadline=document.createElement('div');deadline.className='op-deadline';deadline.textContent=t('deadline');
      const strong=document.createElement('strong');strong.textContent=fmt(o.deadline);deadline.appendChild(strong);
      const remaining=document.createElement('small');remaining.className='op-remaining';remaining.textContent=deadlineLabel(o.deadline);deadline.appendChild(remaining);
      const actions=document.createElement('div');actions.className='op-actions';
      const analyse=document.createElement('a');analyse.className='btn btn-primary btn-small op-analyse';analyse.href=requestHref(o);analyse.textContent=t('analyse');
      const source=document.createElement('a');source.className='op-source';source.href=o.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent=t('openSource');
      const map=document.createElement('a');map.className='op-map';map.href=mapHref(o);map.target='_blank';map.rel='noopener noreferrer';map.textContent=t('map');
      actions.append(analyse,source,map);
      side.append(priorityEl,deadline,actions);

      card.append(scoreCol,main,side);
      list.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    await window.SourceAOData?.init();
    const local=window.SourceAOData?.activeOpportunities?.()||[];
    const localById=new Map(local.map(row=>[row.id,row]));
    opportunities=local;

    if(window.SourceAOAPI?.isConfigured?.()){
      try{
        const payload=await window.SourceAOAPI.opportunities();
        const live=Array.isArray(payload)?payload:(payload?.results||payload?.opportunities||[]);
        if(Array.isArray(live))opportunities=live.map(row=>({...localById.get(row.id),...row}));
      }catch(error){
        console.warn('[Source AO Radar] live API unavailable; using bundled opportunity data');
      }
    }

    applyLanguage();

    $$('[data-market]').forEach(btn=>btn.addEventListener('click',()=>{
      market=btn.dataset.market;
      $$('[data-market]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
    $$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
      filter=btn.dataset.filter;
      $$('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
    $('#langToggle')?.addEventListener('click',()=>{lang=lang==='pt'?'en':'pt';applyLanguage();});
  });
})();