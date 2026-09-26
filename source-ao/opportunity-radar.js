(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  let filter='all';
  let opportunities=[];

  const fmt=value=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));

  function render(){
    const list=$('#opList');
    const visible=opportunities.filter(o=>filter==='all'||o.type===filter);
    $('#activeCount').textContent=opportunities.length;
    list.innerHTML='';
    if(!visible.length){
      const p=document.createElement('p');p.className='op-loading';p.textContent='No active source-checked opportunities in this filter.';list.appendChild(p);return;
    }
    visible.forEach(o=>{
      const card=document.createElement('article');card.className='op-card';
      const main=document.createElement('div');
      const kicker=document.createElement('span');kicker.className='op-kicker';kicker.textContent=(o.type||'opportunity')+' · '+(o.reference||'');
      const title=document.createElement('h3');title.textContent=o.title;
      const meta=document.createElement('div');meta.className='op-meta';
      [o.issuer,o.location,o.sector].filter(Boolean).forEach(v=>{const s=document.createElement('span');s.textContent=v;meta.appendChild(s);});
      const fit=document.createElement('p');fit.className='op-fit';fit.textContent=o.source_fit||o.scope_summary||'';
      main.append(kicker,title,meta,fit);

      const side=document.createElement('div');side.className='op-side';
      const status=document.createElement('span');status.className='op-status';status.textContent='Source checked';
      const deadline=document.createElement('div');deadline.className='op-deadline';deadline.textContent='Deadline';
      const strong=document.createElement('strong');strong.textContent=fmt(o.deadline);deadline.appendChild(strong);
      const source=document.createElement('a');source.className='op-source';source.href=o.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Open source →';
      side.append(status,deadline,source);
      card.append(main,side);list.appendChild(card);
    });
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    await window.SourceAOData?.init();
    opportunities=window.SourceAOData?.activeOpportunities?.()||[];
    render();
    document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
      filter=btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));
      render();
    }));
  });
})();
