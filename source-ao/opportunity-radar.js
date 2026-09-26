(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let filter='all';
  let opportunities=[];
  let lang='pt';

  const copy={
    pt:{
      back:'← Source AO',
      eyebrow:'SOURCE AO · RADAR DE OPORTUNIDADES',
      title:'Oportunidades públicas.\nPrazos claros.',
      lead:'RFQs, concursos e oportunidades comerciais encontradas em fontes rastreáveis. O Source AO mostra o que foi encontrado e quando a fonte foi verificada; a qualificação continua a exigir análise documental.',
      activeLabel:'oportunidades ativas com fonte verificada',
      currentTitle:'Radar atual',
      currentLead:'Só aparecem oportunidades com fonte rastreável e prazo ainda válido.',
      filterAll:'Todas',
      filterSupply:'Fornecimento',
      filterMaintenance:'Manutenção',
      filterTender:'Concurso',
      loading:'A carregar oportunidades verificadas…',
      empty:'Nenhuma oportunidade ativa neste filtro.',
      sourceChecked:'Fonte verificada',
      deadline:'Prazo',
      openSource:'Abrir fonte →',
      analyse:'Pedir análise HMATIAS',
      serviceBy:'Um serviço da HMATIAS',
      disclaimer:'O Source AO não prevê adjudicações nem presume elegibilidade. Reveja sempre o anúncio original, as peças do procedimento e os requisitos de qualificação antes de participar.'
    },
    en:{
      back:'← Source AO',
      eyebrow:'SOURCE AO · OPPORTUNITY RADAR',
      title:'Public opportunities.\nClear deadlines.',
      lead:'RFQs, tenders and commercial opportunities discovered from traceable sources. Source AO shows what was found and when the source was checked; qualification still requires document review.',
      activeLabel:'active source-checked opportunities',
      currentTitle:'Current radar',
      currentLead:'Only opportunities with a traceable source and a still-valid deadline appear here.',
      filterAll:'All',
      filterSupply:'Supply',
      filterMaintenance:'Maintenance',
      filterTender:'Tender',
      loading:'Loading verified opportunity data…',
      empty:'No active opportunities in this filter.',
      sourceChecked:'Source checked',
      deadline:'Deadline',
      openSource:'Open source →',
      analyse:'Ask HMATIAS to assess',
      serviceBy:'A service by HMATIAS',
      disclaimer:'Source AO does not predict awards or assume bidder eligibility. Always review the original notice, procurement documents and qualification requirements before participating.'
    }
  };

  const t=key=>copy[lang][key]||key;
  const fmt=value=>new Intl.DateTimeFormat(lang==='pt'?'pt-PT':'en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));

  function matchesFilter(o){
    if(filter==='all') return true;
    if(filter==='supply') return o.type==='supply-request';
    if(filter==='maintenance') return ['maintenance','small-contract','subcontracting'].includes(o.type);
    return o.type===filter;
  }

  function typeLabel(type){
    const pt={rfq:'RFQ',tender:'Concurso','supply-request':'Fornecimento',maintenance:'Manutenção','small-contract':'Pequeno contrato',subcontracting:'Subcontratação'};
    const en={rfq:'RFQ',tender:'Tender','supply-request':'Supply',maintenance:'Maintenance','small-contract':'Small contract',subcontracting:'Subcontracting'};
    return (lang==='pt'?pt:en)[type]||type||'Oportunidade';
  }

  function deadlineLabel(value){
    const diff=new Date(value).getTime()-Date.now();
    const days=Math.max(0,Math.ceil(diff/86400000));
    if(lang==='pt'){
      if(days===0) return 'Encerra hoje';
      if(days===1) return '1 dia restante';
      return days+' dias restantes';
    }
    if(days===0) return 'Closes today';
    if(days===1) return '1 day left';
    return days+' days left';
  }

  function requestHref(o){
    const params=new URLSearchParams({
      request:o.title||'',
      ref:o.reference||'',
      location:o.location||'Angola'
    });
    return 'index.html?'+params.toString()+'#request';
  }

  function applyLanguage(){
    document.documentElement.lang=lang==='pt'?'pt-AO':'en';
    $$('[data-i18n]').forEach(node=>{
      const value=copy[lang][node.dataset.i18n];
      if(!value) return;
      if(node.tagName==='H1') node.innerHTML=value.replace('\n','<br>');
      else node.textContent=value;
    });
    $('#langToggle').textContent=lang==='pt'?'EN':'PT';
    render();
  }

  function render(){
    const list=$('#opList');
    const visible=opportunities.filter(matchesFilter).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
    $('#activeCount').textContent=opportunities.length;
    list.innerHTML='';
    if(!visible.length){
      const p=document.createElement('p');p.className='op-loading';p.textContent=t('empty');list.appendChild(p);return;
    }
    visible.forEach(o=>{
      const card=document.createElement('article');card.className='op-card';
      const main=document.createElement('div');
      const kicker=document.createElement('span');kicker.className='op-kicker';kicker.textContent=typeLabel(o.type)+' · '+(o.reference||'');
      const title=document.createElement('h3');title.textContent=o.title;
      const meta=document.createElement('div');meta.className='op-meta';
      [o.issuer,o.location,o.sector].filter(Boolean).forEach(v=>{const s=document.createElement('span');s.textContent=v;meta.appendChild(s);});
      const fit=document.createElement('p');fit.className='op-fit';fit.textContent=o.source_fit||o.scope_summary||'';
      main.append(kicker,title,meta,fit);

      const side=document.createElement('div');side.className='op-side';
      const status=document.createElement('span');status.className='op-status';status.textContent=t('sourceChecked');
      const deadline=document.createElement('div');deadline.className='op-deadline';deadline.textContent=t('deadline');
      const strong=document.createElement('strong');strong.textContent=fmt(o.deadline);deadline.appendChild(strong);
      const remaining=document.createElement('small');remaining.className='op-remaining';remaining.textContent=deadlineLabel(o.deadline);deadline.appendChild(remaining);
      const actions=document.createElement('div');actions.className='op-actions';
      const source=document.createElement('a');source.className='op-source';source.href=o.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent=t('openSource');
      const analyse=document.createElement('a');analyse.className='btn btn-primary btn-small op-analyse';analyse.href=requestHref(o);analyse.textContent=t('analyse');
      actions.append(source,analyse);
      side.append(status,deadline,actions);
      card.append(main,side);list.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    await window.SourceAOData?.init();
    opportunities=window.SourceAOData?.activeOpportunities?.()||[];
    applyLanguage();
    $$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
      filter=btn.dataset.filter;
      $$('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
    $('#langToggle')?.addEventListener('click',()=>{lang=lang==='pt'?'en':'pt';applyLanguage();});
  });
})();
