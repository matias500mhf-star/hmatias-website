(()=>{
  'use strict';

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const state={lang:'pt',query:'',location:'Luanda'};

  const dictionary={
    en:{
      eyebrow:'PROCUREMENT INTELLIGENCE FOR ANGOLA',heroTitle:'Search. Verify. Act on evidence.',heroLead:'Turn a purchasing need into a procurement mission: technical interpretation, potential suppliers, public evidence and commercial confirmation.',searchPlaceholder:'E.g. PP strapping 9 mm, 1 roll, urgent…',searchButton:'Search',popular:'Try:',asideLabel:'SOURCE AO',asideLine1:'SEARCH',asideLine2:'VERIFY',asideLine3:'SOURCE',asideSmall:'A service by HMATIAS',searchRead:'INTERPRETED MISSION',category:'Category',market:'Market',freshness:'Evidence state',notVerified:'Not yet verified',truthNote:'Source AO separates discovery, source evidence and commercial confirmation. A potential supplier is not presented as available stock.',publicSearch:'View public search',addRadar:'Add to Radar',confidence:'Data confidence',awaiting:'Awaiting verified source',confidenceText:'The state only advances when there is a traceable source, date and confirmation level.',browse:'QUICK ENTRIES',whatLooking:'Start from the requirement.',cat1:'Construction materials',cat2:'HVAC & electrical',cat3:'Tools & equipment',cat4:'Cleaning & facilities',cat5:'Services & contractors',cat6:'Industrial supply',radarEyebrow:'SOURCE AO RADAR',radarTitle:"A requirement does not disappear because the first search failed.",radarLead:'Keep requirements organised and track the evidence state. Radar does not turn a public reference into confirmed availability.',r1t:'Found',r1s:'A possible match exists.',r2t:'Checked',r2s:'Source and date are recorded.',r3t:'Verified',r3s:'Availability is commercially confirmed.',myRadar:'My Radar',radarPlaceholder:'What should Radar watch for?',watch:'Watch',emptyTitle:'No missions being tracked.',emptyText:'Add a requirement to keep the search organised until usable evidence exists.',radarDisclaimer:'In this version, the Radar list stays on this device. Source AO does not promise continuous monitoring without an active data source.',howEyebrow:'OPERATIONAL FLOW',howTitle:'From requirement to commercial decision.',step1t:'Describe',step1p:'Product, specification, quantity, location and priority.',step2t:'Discover',step2p:'Search suppliers, catalogues and relevant sources.',step3t:'Verify',step3p:'Separate match, evidence and current confirmation.',needSpecific:'NEED HMATIAS TO EXECUTE?',requestTitle:'Turn the search into an operational request.',requestLead:'Register the requirement and track it through a private link. The team validates the market before assuming availability, price or delivery.',itemPlaceholder:'Material / service',qtyPlaceholder:'Quantity / specification',prepareRequest:'Register sourcing request',footerLine:'Search. Verify. Source.',serviceBy:'A service by HMATIAS',footerTruth:'Evidence before commercial claims.',
      navSearch:'Search',navRadar:'Radar',navOpportunities:'Opportunities',navHow:'How it works',angolaFirst:'Angola-first',navRequest:'Start sourcing',
      missionInputLabel:'WHAT DO YOU NEED?',missionInputTitle:'Create a sourcing mission',truthChip:'No invented stock or price',
      locationLabel:'Location',quantityLabel:'Quantity',urgencyLabel:'Priority',priorityNormal:'Normal',priorityUrgent:'Urgent',priorityWeek:'This week',tryLabel:'Try:',
      commandEyebrow:'OPERATION MODE',commandTitle:'Procurement Mission',
      cmd1t:'Interpret',cmd1s:'Product, aliases, specification, quantity and urgency.',
      cmd2t:'Discover',cmd2s:'Relevant public sources and suppliers in Angola.',
      cmd3t:'Verify',cmd3s:'Separate evidence, potential supplier and commercial confirmation.',
      cmd4t:'Act',cmd4s:'Contact, send RFQ, track and prepare quotation.',
      commandTruth:'Stock and price are only shown as confirmed when current commercial evidence exists.',
      cap1t:'Smart Search',cap1s:'PT/EN terms and specifications',cap2t:'Supplier Discovery',cap2s:'Angola and Luanda first',
      cap3t:'Evidence States',cap3s:'Source ≠ confirmed stock',cap4t:'Smart RFQ',cap4s:'Structured request for contact',
      workspaceLabel:'PROCUREMENT WORKSPACE',startSourcing:'Open sourcing request',
      legendFound:'Potential supplier',legendSource:'Source checked',legendConfirmed:'Commercial confirmation',
      browseNote:'Source AO expands the search by category without losing the original specification.',
      cat1s:'cement · steel · PVC · paint',cat2s:'AC · cables · protection · parts',cat3s:'machines · tools · workshop',
      cat4s:'consumables · hygiene · maintenance',cat5s:'installation · repair · execution',cat6s:'chemicals · packaging · components',
      howNote:'Technology accelerates discovery; commercial confirmation remains explicit.',
      step4t:'Execute',step4p:'Contact, send RFQ, compare and prepare the quotation.',
      requestTrust:'Protected contact · private tracking · no automatic publication'
    },
    pt:{
      eyebrow:'PROCUREMENT INTELLIGENCE PARA ANGOLA',heroTitle:'Procure. Verifique. Avance com evidência.',heroLead:'Transforme uma necessidade de compra numa missão de procurement: interpretação técnica, fornecedores potenciais, evidência pública e confirmação comercial.',searchPlaceholder:'Ex.: cinta PP 9 mm, 1 rolo, urgente…',searchButton:'Pesquisar',popular:'Pesquisas:',asideLabel:'SOURCE AO',asideLine1:'PESQUISAR',asideLine2:'VERIFICAR',asideLine3:'ENCONTRAR',asideSmall:'Um serviço da HMATIAS',searchRead:'MISSÃO INTERPRETADA',category:'Categoria',market:'Mercado',freshness:'Estado da evidência',notVerified:'Ainda não verificado',truthNote:'O Source AO separa descoberta, evidência em fonte e confirmação comercial. Um fornecedor potencial não é apresentado como stock disponível.',publicSearch:'Ver pesquisa pública',addRadar:'Adicionar ao Radar',confidence:'Confiança dos dados',awaiting:'Aguardando fonte verificada',confidenceText:'O estado sobe apenas quando existe fonte rastreável, data e nível de confirmação.',browse:'ENTRADAS RÁPIDAS',whatLooking:'Comece pela necessidade.',cat1:'Materiais de construção',cat2:'Climatização e elétrica',cat3:'Ferramentas e equipamentos',cat4:'Limpeza e facilities',cat5:'Serviços e empreiteiros',cat6:'Fornecimento industrial',radarEyebrow:'RADAR SOURCE AO',radarTitle:'Uma necessidade não desaparece porque a primeira pesquisa falhou.',radarLead:'Mantenha requisitos organizados e acompanhe o estado da evidência. O Radar não transforma uma referência pública em disponibilidade confirmada.',r1t:'Encontrado',r1s:'Existe uma possível correspondência.',r2t:'Verificado na fonte',r2s:'Fonte e data ficam registadas.',r3t:'Confirmado',r3s:'A disponibilidade foi confirmada comercialmente.',myRadar:'Fila de procura',radarPlaceholder:'Material, serviço ou especificação…',watch:'Adicionar',emptyTitle:'Nenhuma missão em acompanhamento.',emptyText:'Adicione uma necessidade para manter a pesquisa organizada até existir evidência utilizável.',radarDisclaimer:'Nesta versão, a lista do Radar fica neste dispositivo. O Source AO não promete monitorização contínua sem uma fonte de dados ativa.',howEyebrow:'FLUXO OPERACIONAL',howTitle:'Da necessidade à decisão comercial.',step1t:'Descrever',step1p:'Produto, especificação, quantidade, local e prioridade.',step2t:'Descobrir',step2p:'Pesquisar fornecedores, catálogos e fontes relevantes.',step3t:'Verificar',step3p:'Separar correspondência, evidência e confirmação atual.',needSpecific:'PRECISA QUE A HMATIAS EXECUTE?',requestTitle:'Transforme a pesquisa num pedido operacional.',requestLead:'Registe a necessidade e acompanhe o estado por ligação privada. A equipa valida o mercado antes de assumir disponibilidade, preço ou prazo.',itemPlaceholder:'Material / serviço',qtyPlaceholder:'Quantidade / especificação',prepareRequest:'Registar pedido de sourcing',footerLine:'Pesquisar. Verificar. Encontrar.',serviceBy:'Um serviço da HMATIAS',footerTruth:'Evidência antes de afirmações comerciais.',
      navSearch:'Pesquisa',navRadar:'Radar',navOpportunities:'Oportunidades',navHow:'Como funciona',angolaFirst:'Angola-first',navRequest:'Iniciar sourcing',
      missionInputLabel:'O QUE PRECISA?',missionInputTitle:'Criar uma missão de sourcing',truthChip:'Sem inventar stock ou preço',
      locationLabel:'Local',quantityLabel:'Quantidade',urgencyLabel:'Prioridade',priorityNormal:'Normal',priorityUrgent:'Urgente',priorityWeek:'Esta semana',tryLabel:'Experimentar:',
      commandEyebrow:'MODO OPERACIONAL',commandTitle:'Procurement Mission',
      cmd1t:'Interpretar',cmd1s:'Produto, aliases, especificação, quantidade e urgência.',
      cmd2t:'Descobrir',cmd2s:'Fontes públicas e fornecedores relevantes em Angola.',
      cmd3t:'Verificar',cmd3s:'Separar evidência, fornecedor potencial e confirmação comercial.',
      cmd4t:'Agir',cmd4s:'Contactar, enviar RFQ, acompanhar e preparar cotação.',
      commandTruth:'Stock e preço só são apresentados como confirmados quando existe evidência comercial atual.',
      cap1t:'Smart Search',cap1s:'Termos PT/EN e especificações',cap2t:'Supplier Discovery',cap2s:'Angola e Luanda primeiro',
      cap3t:'Estados de evidência',cap3s:'Fonte ≠ stock confirmado',cap4t:'Smart RFQ',cap4s:'Pedido estruturado para contacto',
      workspaceLabel:'PROCUREMENT WORKSPACE',startSourcing:'Abrir pedido de sourcing',
      legendFound:'Fornecedor potencial',legendSource:'Fonte verificada',legendConfirmed:'Confirmação comercial',
      browseNote:'O Source AO expande a pesquisa por categoria sem perder a especificação original.',
      cat1s:'cimento · aço · PVC · tintas',cat2s:'AC · cabos · proteção · peças',cat3s:'máquinas · ferramentas · oficina',
      cat4s:'consumíveis · higiene · manutenção',cat5s:'instalação · reparação · execução',cat6s:'químicos · embalagem · componentes',
      howNote:'A tecnologia acelera a procura; a confirmação comercial continua explícita.',
      step4t:'Executar',step4p:'Contactar, enviar RFQ, comparar e preparar a cotação.',
      requestTrust:'Contacto protegido · acompanhamento privado · sem publicação automática'
    }
  };

  const categories=[
    {name:'Construction materials',pt:'Materiais de construção',terms:['cement','cimento','concrete','betão','betao','block','bloco','brick','tijolo','sand','areia','steel','ferro','rebar','varão','varao','sheet','chapa','tile','telha','paint','tinta','mortar','argamassa','pvc','pipe','tubo']},
    {name:'HVAC & electrical',pt:'Climatização e elétrica',terms:['air conditioner','ar condicionado','btu','hvac','split','compressor','refrigerant','r410','r32','cable','cabo','breaker','disjuntor','electrical','elétrica','eletrica','generator','gerador']},
    {name:'Tools & equipment',pt:'Ferramentas e equipamentos',terms:['tool','ferramenta','drill','berbequim','machine','máquina','maquina','equipment','equipamento','welding','solda','grinder','rebarbadora']},
    {name:'Cleaning & facilities',pt:'Limpeza e facilities',terms:['cleaning','limpeza','detergent','detergente','disinfectant','desinfetante','facility','facilities','hygiene','higiene']},
    {name:'Services & contractors',pt:'Serviços e empreiteiros',terms:['service','serviço','servico','contractor','empreiteiro','maintenance','manutenção','manutencao','painting','pintura','installation','instalação','instalacao']},
    {name:'Industrial supply',pt:'Fornecimento industrial',terms:['industrial','valve','válvula','valvula','pump','bomba','bearing','rolamento','filter','filtro','chemical','químico','quimico','formaldehyde','formaldeído','formaldeido','cinta','cinta pp','cinta de arquear','cinta de arqueação','cinta de arqueacao','fita de arquear','fita de arqueação','fita de arqueacao','fita pp','polipropileno','polypropylene','pp strap','pp strapping','strapping','packaging','embalagem']}
  ];

  const classify=q=>{
    const value=q.toLowerCase();
    const match=categories.find(c=>c.terms.some(term=>value.includes(term)));
    if(!match) return state.lang==='pt'?'Sourcing geral':'General sourcing';
    return state.lang==='pt'?match.pt:match.name;
  };

  const t=key=>dictionary[state.lang][key]||key;

  function applyLanguage(){
    document.documentElement.lang=state.lang==='pt'?'pt-AO':'en';
    $$('[data-i18n]').forEach(node=>{const key=node.dataset.i18n;if(dictionary[state.lang][key]) node.textContent=dictionary[state.lang][key];});
    $$('[data-i18n-placeholder]').forEach(node=>{const key=node.dataset.i18nPlaceholder;if(dictionary[state.lang][key]) node.placeholder=dictionary[state.lang][key];});
    $('#langToggle').textContent=state.lang==='en'?'PT':'EN';
    if(state.query) renderSearch(state.query,state.location,false);
    renderRadar();
  }

  function renderSearch(query,location='Luanda',scroll=true){
    state.query=query.trim(); state.location=location;
    if(!state.query) return;
    $('#searchInput').value=state.query;
    $('#locationInput').value=location;
    $('#queryHeading').textContent='“'+state.query+'”';
    $('#categoryValue').textContent=classify(state.query);
    $('#marketValue').textContent=location;
    const suffix=state.lang==='pt'?' fornecedor Angola':' supplier Angola';
    $('#publicSearch').href='https://www.google.com/search?q='+encodeURIComponent(state.query+suffix);
    $('#resultZone').hidden=false;
    if(scroll) $('#resultZone').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function radarItems(){
    try{return JSON.parse(localStorage.getItem('sourceao_radar')||'[]')}catch{return[]}
  }
  function saveRadar(items){localStorage.setItem('sourceao_radar',JSON.stringify(items));renderRadar()}
  function addRadarItem(query,location){
    const q=(query||'').trim(); if(!q) return;
    const items=radarItems();
    const duplicate=items.some(i=>i.query.toLowerCase()===q.toLowerCase()&&i.location===location);
    if(!duplicate){items.unshift({id:Date.now(),query:q,location:location||'Luanda',createdAt:new Date().toISOString(),status:'awaiting_verified_source'});saveRadar(items)}
    $('#radar').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function removeRadarItem(id){saveRadar(radarItems().filter(i=>i.id!==id))}
  function renderRadar(){
    const items=radarItems(); const list=$('#radarList');
    $('#radarCount').textContent=items.length+' '+(state.lang==='pt'?(items.length===1?'ativo':'ativos'):(items.length===1?'active':'active'));
    list.innerHTML='';
    if(!items.length){
      const empty=document.createElement('div');empty.className='empty-state';empty.id='radarEmpty';
      empty.innerHTML='<span class="radar-symbol" aria-hidden="true"></span><strong>'+t('emptyTitle')+'</strong><p>'+t('emptyText')+'</p>';
      list.appendChild(empty);return;
    }
    items.forEach(item=>{
      const row=document.createElement('div');row.className='radar-item';
      const copy=document.createElement('div');
      const status=state.lang==='pt'?'Aguardando fonte verificada':'Awaiting verified source';
      copy.innerHTML='<strong></strong><small></small>';
      copy.querySelector('strong').textContent=item.query;
      copy.querySelector('small').textContent=item.location+' · '+status;
      const del=document.createElement('button');del.type='button';del.setAttribute('aria-label','Remove');del.textContent='×';del.addEventListener('click',()=>removeRadarItem(item.id));
      row.append(copy,del);list.appendChild(row);
    });
  }

  $('#searchForm').addEventListener('submit',e=>{e.preventDefault();renderSearch($('#searchInput').value,$('#locationInput').value)});
  $$('[data-query]').forEach(btn=>btn.addEventListener('click',()=>renderSearch(btn.dataset.query,$('#locationInput').value)));
  $('#addRadar').addEventListener('click',()=>addRadarItem(state.query,state.location));
  $('#startSourcing')?.addEventListener('click',()=>{
    const item=$('#requestItem');
    const qty=$('#requestQty');
    const loc=$('#requestLocation');
    if(item) item.value=state.query||$('#searchInput')?.value.trim()||'';
    const quantity=$('#quantityInput')?.value.trim()||'';
    if(qty&&quantity) qty.value=quantity;
    if(loc) loc.value=state.location||$('#locationInput')?.value||'Luanda';
    $('#request')?.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>item?.focus(),350);
  });
  $('#radarForm').addEventListener('submit',e=>{e.preventDefault();addRadarItem($('#radarInput').value,$('#locationInput').value);$('#radarInput').value=''});
  $('#langToggle').addEventListener('click',()=>{state.lang=state.lang==='en'?'pt':'en';applyLanguage()});
  $('#requestForm').addEventListener('submit',e=>{
    e.preventDefault();
    const item=$('#requestItem').value.trim();
    const qty=$('#requestQty').value.trim();
    const location=$('#requestLocation').value.trim()||'Luanda';
    if(!item) return;
    const message=state.lang==='pt'
      ?`Olá, HMATIAS. Vim pelo Source AO e preciso de sourcing.\nItem/serviço: ${item}\nQuantidade/especificação: ${qty||'A confirmar'}\nLocal: ${location}\nPretendo validação de fornecedor, disponibilidade e cotação.`
      :`Hello, HMATIAS. I came through Source AO and need sourcing support.\nItem/service: ${item}\nQuantity/specification: ${qty||'To confirm'}\nLocation: ${location}\nI need supplier, availability and quotation validation.`;
    window.open('https://wa.me/244948806673?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
  });

  function hydrateRequestFromUrl(){
    const params=new URLSearchParams(location.search);
    const request=params.get('request')?.trim()||'';
    if(!request) return;
    const ref=params.get('ref')?.trim()||'';
    const targetLocation=params.get('location')?.trim()||'Luanda';
    const item=$('#requestItem');
    const loc=$('#requestLocation');
    if(item) item.value=ref?request+' · Ref. '+ref:request;
    if(loc) loc.value=targetLocation;
  }

  hydrateRequestFromUrl();
  applyLanguage();
})();