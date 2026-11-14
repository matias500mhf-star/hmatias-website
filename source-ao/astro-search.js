(()=>{
  'use strict';
  const form=document.getElementById('sourceAoSearchForm');
  const queryInput=document.getElementById('sourceAoSearchQuery');
  const locationInput=document.getElementById('sourceAoSearchLocation');
  const statusNode=document.getElementById('sourceAoSearchStatus');
  const resultsNode=document.getElementById('sourceAoSearchResults');
  if(!form||!queryInput||!locationInput||!statusNode||!resultsNode)return;

  const isEn=String(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const categoryNames={
    construction:isEn?'Construction & interiors':'Construção e interiores',
    'hvac-electrical':isEn?'HVAC & electrical':'Climatização e eletricidade',
    'tools-equipment':isEn?'Tools & equipment':'Ferramentas e equipamentos',
    'cleaning-facilities':isEn?'Cleaning & facilities':'Limpeza e facilities',
    'services-contractors':isEn?'Services & contractors':'Serviços e empreiteiros',
    'industrial-supply':isEn?'Industrial, PPE & consumables':'Indústria, EPI e consumíveis',
    'diamond-tools':isEn?'Diamond tools':'Ferramentas diamantadas',
    'measurement-instruments':isEn?'Measurement instruments':'Instrumentos de medição',
    other:isEn?'Other requirement':'Outra necessidade'
  };
  const statusNames={
    discovered:isEn?'Verification required':'Requer verificação',
    supplier_candidate:isEn?'Potential supplier — unconfirmed':'Fornecedor potencial — por confirmar',
    recently_seen:isEn?'Recently seen':'Informação recente',
    source_checked:isEn?'Source checked':'Fonte verificada',
    supplier_confirmed:isEn?'Supplier confirmed':'Fornecedor confirmado',
    in_stock_confirmed:isEn?'Stock confirmed':'Stock confirmado',
    needs_reconfirmation:isEn?'Needs reconfirmation':'Requer nova confirmação',
    unavailable:isEn?'Unavailable':'Indisponível'
  };
  const safeText=value=>String(value||'').trim();
  const make=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!=null)node.textContent=text;
    return node;
  };
  let sequence=0;

  function quotationUrl(row){
    const destination=new URL(isEn?'/en/source-ao/smart-rfq/':'/source-ao/smart-rfq/',window.location.origin);
    destination.searchParams.set('request',safeText(row.name));
    destination.searchParams.set('location',safeText(locationInput.value)||'Luanda');
    destination.searchParams.set('lang',isEn?'en':'pt');
    if(row.type==='item'&&row.id){
      destination.searchParams.set('item',row.id);
      if(row.category)destination.searchParams.set('category',row.category);
      if(row.specification)destination.searchParams.set('specification',row.specification);
      if(row.unit)destination.searchParams.set('unit',row.unit);
    }else{
      destination.searchParams.set('category','services-contractors');
    }
    return destination.pathname+destination.search;
  }

  function render(rows){
    resultsNode.replaceChildren();
    if(!rows.length){
      resultsNode.hidden=false;
      resultsNode.appendChild(make('p','source-live-search-empty',isEn?'No matching public catalogue references were found. Try another description or submit the exact requirement to HMATIAS.':'Não foram encontradas referências no catálogo público. Experimente outra descrição ou envie a necessidade exacta à HMATIAS.'));
      return;
    }
    resultsNode.hidden=false;
    rows.slice(0,12).forEach(row=>{
      const card=make('article','source-search-result');
      const copy=make('div','source-search-result-copy');
      const category=categoryNames[row.category]||safeText(row.category)||(isEn?'Supply reference':'Referência de fornecimento');
      copy.appendChild(make('small','',category));
      copy.appendChild(make('h3','',safeText(row.name)));
      const details=[safeText(row.specification),safeText(row.unit)].filter(Boolean).join(' · ');
      if(details)copy.appendChild(make('p','',details));
      copy.appendChild(make('span','source-search-result-status',statusNames[row.status]||statusNames.discovered));
      const link=make('a','source-search-result-action',isEn?'Request quotation ↗':'Pedir cotação ↗');
      link.href=quotationUrl(row);
      card.append(copy,link);
      resultsNode.appendChild(card);
    });
  }

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const query=safeText(queryInput.value);
    const locationValue=safeText(locationInput.value)||'Luanda';
    if(query.length<2)return;
    const current=++sequence;
    statusNode.textContent=isEn?'Searching the published catalogue…':'A pesquisar no catálogo publicado…';
    resultsNode.hidden=true;
    try{
      const payload=await window.SourceAOAPI.search(query,locationValue);
      if(current!==sequence)return;
      if(!payload?.ok||!Array.isArray(payload.results))throw new Error('invalid_search_response');
      render(payload.results);
      const count=payload.results.length;
      if(payload.source==='static-preview'){
        statusNode.textContent=isEn
          ?`${count} references from the static preview catalogue (not a D1 search). Supplier, stock, prices and delivery require commercial confirmation.`
          :`${count} referências do catálogo estático de pré-visualização (não consulta a D1). Fornecedor, stock, preço e entrega exigem confirmação comercial.`;
      }else{
        statusNode.textContent=isEn
          ?`${count} public references from the staging API. Supplier, stock and prices require commercial confirmation.`
          :`${count} referências públicas da API de staging. Fornecedor, stock e preço dependem de confirmação comercial.`;
      }
    }catch{
      if(current!==sequence)return;
      resultsNode.hidden=true;
      statusNode.textContent=isEn
        ?'The catalogue search is temporarily unavailable. Submit the exact requirement through Smart RFQ.'
        :'A pesquisa do catálogo está temporariamente indisponível. Envie a necessidade exacta através do Smart RFQ.';
    }
  });
})();
