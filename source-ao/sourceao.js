(()=>{
  'use strict';

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const state={lang:new URLSearchParams(window.location?.search||'').get('lang')==='en'?'en':'pt',query:'',location:'Luanda'};
  const track=(eventName,parameters={})=>window.hmatiasAnalytics?.track?.(eventName,parameters);

  const dictionary={
    en:{
      eyebrow:'COMMERCIAL RESEARCH AND SOURCING FOR ANGOLA',heroTitle:'Technical research for materials and suppliers.',heroLead:'Organise specifications, consult available indexed references and submit supply requests. Suppliers, pricing, stock and delivery require commercial confirmation.',searchPlaceholder:'E.g. PP strapping 9 mm, 1 roll, urgent…',searchButton:'Search',popular:'Try:',asideLabel:'SOURCE AO',asideLine1:'SEARCH',asideLine2:'VERIFY',asideLine3:'SOURCE',asideSmall:'A service by HMATIAS',searchRead:'STRUCTURED REQUIREMENT',category:'Category',market:'Market',freshness:'Evidence state',notVerified:'Not yet verified',truthNote:'Source AO separates discovery, source evidence and commercial confirmation. A potential supplier is not presented as available stock.',publicSearch:'View public search',addRadar:'Add to Radar',confidence:'Data confidence',awaiting:'Awaiting verified source',confidenceText:'The state only advances when there is a traceable source, date and confirmation level.',browse:'QUICK ENTRIES',whatLooking:'Start from the requirement.',cat1:'Construction materials',cat2:'HVAC & electrical',cat3:'Tools & equipment',cat4:'Cleaning & facilities',cat5:'Services & contractors',cat6:'Industrial supply',radarEyebrow:'SOURCE AO RADAR',radarTitle:"A requirement does not disappear because the first search failed.",radarLead:'Keep requirements organised and track the evidence state. Radar does not turn a public reference into confirmed availability.',r1t:'Found',r1s:'A possible match exists.',r2t:'Checked',r2s:'Source and date are recorded.',r3t:'Verified',r3s:'Availability is commercially confirmed.',myRadar:'My Radar',radarPlaceholder:'What should Radar watch for?',watch:'Watch',emptyTitle:'No requirements being tracked.',emptyText:'Add a requirement to keep the search organised until usable evidence exists.',radarDisclaimer:'In this version, the Radar list stays on this device. Source AO does not promise continuous monitoring without an active data source.',howEyebrow:'OPERATIONAL FLOW',howTitle:'From requirement to commercial decision.',step1t:'Describe',step1p:'Product, specification, quantity, location and priority.',step2t:'Discover',step2p:'Search suppliers, catalogues and relevant sources.',step3t:'Verify',step3p:'Separate match, evidence and current confirmation.',needSpecific:'NEED HMATIAS TO EXECUTE?',requestTitle:'Turn the search into an operational request.',requestLead:'Register the requirement and track it through a private link. The team validates the market before assuming availability, price or delivery.',itemPlaceholder:'Material / service',qtyPlaceholder:'Quantity / specification',prepareRequest:'Register sourcing request',footerLine:'Search. Verify. Source.',serviceBy:'A service by HMATIAS',footerTruth:'Evidence before commercial claims.',
      navSearch:'Search',navRadar:'Radar',navOpportunities:'Opportunities',navHow:'How it works',angolaFirst:'Angola focus',navRequest:'Request quotation',fullRfq:'Quotation request with catalogue products →',
      missionInputLabel:'WHAT DO YOU NEED?',missionInputTitle:'Structure a sourcing search',truthChip:'Commercial terms require confirmation',
      locationLabel:'Location',quantityLabel:'Quantity',urgencyLabel:'Priority',priorityNormal:'Normal',priorityUrgent:'Urgent',priorityWeek:'This week',tryLabel:'Try:',
      commandEyebrow:'OPERATION MODE',commandTitle:'Structured search',
      cmd1t:'Interpret',cmd1s:'Product, aliases, specification, quantity and urgency.',
      cmd2t:'Discover',cmd2s:'Indexed references and identified sources for commercial research.',
      cmd3t:'Verify',cmd3s:'Separate evidence, potential supplier and commercial confirmation.',
      cmd4t:'Act',cmd4s:'Contact, send RFQ, track and prepare quotation.',
      commandTruth:'Stock and price are only shown as confirmed when current commercial evidence exists.',
      cap1t:'Technical Search',cap1s:'PT/EN terms and specifications',cap2t:'Supplier Research',cap2s:'Angola and Luanda first',
      cap3t:'Evidence States',cap3s:'Source ≠ confirmed stock',cap4t:'Smart RFQ',cap4s:'Structured request for contact',
      workspaceLabel:'PROCUREMENT WORKSPACE',startSourcing:'Open sourcing request',
      legendFound:'Potential supplier',legendSource:'Source checked',legendConfirmed:'Commercial confirmation',
      browseNote:'Source AO expands the search by category without losing the original specification.',
      cat1s:'cement · steel · PVC · paint',cat2s:'AC · cables · protection · parts',cat3s:'machines · tools · workshop',
      cat4s:'consumables · hygiene · maintenance',cat5s:'installation · repair · execution',cat6s:'chemicals · packaging · components',
      howNote:'Technology accelerates discovery; commercial confirmation remains explicit.',
      step4t:'Execute',step4p:'Contact, send RFQ, compare and prepare the quotation.',
      requestTrust:'Protected contact · private tracking · no automatic publication',
      mainNavigation:'Main navigation',officialSite:'Open the official HMATIAS website',sourceLogo:'SOURCE AO — technical research for materials and suppliers by HMATIAS',
      exampleSearches:'Example searches',sourceRules:'Source AO rules',capabilities:'Capabilities',commercialNetwork:'Source AO commercial network',
      exampleStrapping:'PP strapping 9 mm',exampleFormalin:'Formalin 37% 1 L',exampleAC:'AC 24,000 BTU',
      intelligenceEyebrow:'COMMERCIAL ANALYSIS',intelligenceTitle:'More than listing opportunities.',intelligenceLink:'Open Intelligence Radar →',
      intelligence1Label:'IDENTIFY',intelligence1Title:'Traceable source',intelligence1Text:'Collects RFQs, tenders and commercial signals in Angola, preserving the source link for validation.',
      intelligence2Label:'ASSESS',intelligence2Title:'Commercial fit',intelligence2Text:'Organises business area, fit, evidence confidence, urgency and location before a decision.',
      intelligence3Label:'ACT',intelligence3Title:'Operational action',intelligence3Text:'Turns an opportunity into a next step: validate requirements, find a partner or supplier, and prepare costs, margin and an application.',
      networkEyebrow:'HMATIAS COMMERCIAL NETWORK',networkTitle:'Suppliers and subcontractors are assessed before joining.',networkLink:'Introduce your company →',
      network1Label:'IDENTIFY',network1Title:'Company identity',network1Text:'Legal name, registration, location, business contact and digital presence when available.',
      network2Label:'QUALIFY',network2Title:'Proven capability',network2Text:'Construction, facilities, plumbing, electrical work, HVAC, supply and other verifiable capabilities.',
      network3Label:'REVIEW',network3Title:'Controlled activation',network3Text:'Applications enter private review. No company is automatically presented as an approved partner.',
      partners:'Partners',privacy:'Privacy',terms:'Terms',privacyPolicy:'privacy policy',
      unitConfirm:'To confirm',unitEach:'Unit (ea)',unitLitres:'Litres (L)',unitRoll:'Roll',unitBox:'Box',unitPallet:'Pallet',
      requestItemPlaceholder:'E.g. safety helmet, PVC pipe',requestQtyPlaceholder:'E.g. 15',requestSpecPlaceholder:'Standard, dimension, brand or technical code'
    },
    pt:{
      eyebrow:'PESQUISA COMERCIAL E SOURCING PARA ANGOLA',heroTitle:'Pesquisa técnica de materiais e fornecedores.',heroLead:'Organize especificações, consulte referências disponíveis no índice e registe pedidos de cotação. Fornecedores, preço, stock e entrega dependem de confirmação comercial.',searchPlaceholder:'Ex.: cinta PP 9 mm, 1 rolo, urgente…',searchButton:'Pesquisar',popular:'Pesquisas:',asideLabel:'SOURCE AO',asideLine1:'PESQUISAR',asideLine2:'VERIFICAR',asideLine3:'ENCONTRAR',asideSmall:'Um serviço da HMATIAS',searchRead:'NECESSIDADE ESTRUTURADA',category:'Categoria',market:'Mercado',freshness:'Estado da evidência',notVerified:'Ainda não verificado',truthNote:'O Source AO separa descoberta, evidência em fonte e confirmação comercial. Um fornecedor potencial não é apresentado como stock disponível.',publicSearch:'Ver pesquisa pública',addRadar:'Adicionar ao Radar',confidence:'Confiança dos dados',awaiting:'Aguardando fonte verificada',confidenceText:'O estado sobe apenas quando existe fonte rastreável, data e nível de confirmação.',browse:'ENTRADAS RÁPIDAS',whatLooking:'Comece pela necessidade.',cat1:'Materiais de construção',cat2:'Climatização e elétrica',cat3:'Ferramentas e equipamentos',cat4:'Limpeza e facilities',cat5:'Serviços e empreiteiros',cat6:'Fornecimento industrial',radarEyebrow:'RADAR SOURCE AO',radarTitle:'Uma necessidade não desaparece porque a primeira pesquisa falhou.',radarLead:'Mantenha requisitos organizados e acompanhe o estado da evidência. O Radar não transforma uma referência pública em disponibilidade confirmada.',r1t:'Encontrado',r1s:'Existe uma possível correspondência.',r2t:'Verificado na fonte',r2s:'Fonte e data ficam registadas.',r3t:'Confirmado',r3s:'A disponibilidade foi confirmada comercialmente.',myRadar:'Fila de procura',radarPlaceholder:'Material, serviço ou especificação…',watch:'Adicionar',emptyTitle:'Nenhuma necessidade em acompanhamento.',emptyText:'Adicione uma necessidade para manter a pesquisa organizada até existir evidência utilizável.',radarDisclaimer:'Nesta versão, a lista do Radar fica neste dispositivo. O Source AO não promete monitorização contínua sem uma fonte de dados ativa.',howEyebrow:'FLUXO OPERACIONAL',howTitle:'Da necessidade à decisão comercial.',step1t:'Descrever',step1p:'Produto, especificação, quantidade, local e prioridade.',step2t:'Descobrir',step2p:'Pesquisar fornecedores, catálogos e fontes relevantes.',step3t:'Verificar',step3p:'Separar correspondência, evidência e confirmação atual.',needSpecific:'PRECISA QUE A HMATIAS EXECUTE?',requestTitle:'Transforme a pesquisa num pedido operacional.',requestLead:'Registe a necessidade e acompanhe o estado por ligação privada. A equipa valida o mercado antes de assumir disponibilidade, preço ou prazo.',itemPlaceholder:'Material / serviço',qtyPlaceholder:'Quantidade / especificação',prepareRequest:'Registar pedido de sourcing',footerLine:'Pesquisar. Verificar. Encontrar.',serviceBy:'Um serviço da HMATIAS',footerTruth:'Evidência antes de afirmações comerciais.',
      navSearch:'Pesquisa',navRadar:'Radar',navOpportunities:'Oportunidades',navHow:'Como funciona',angolaFirst:'Foco: Angola',navRequest:'Pedir cotação',fullRfq:'Pedido de cotação com produtos do catálogo →',
      missionInputLabel:'O QUE PRECISA?',missionInputTitle:'Estruturar uma pesquisa de sourcing',truthChip:'Condições sujeitas a confirmação',
      locationLabel:'Local',quantityLabel:'Quantidade',urgencyLabel:'Prioridade',priorityNormal:'Normal',priorityUrgent:'Urgente',priorityWeek:'Esta semana',tryLabel:'Experimentar:',
      commandEyebrow:'MODO OPERACIONAL',commandTitle:'Pesquisa estruturada',
      cmd1t:'Interpretar',cmd1s:'Produto, aliases, especificação, quantidade e urgência.',
      cmd2t:'Descobrir',cmd2s:'Referências indexadas e fontes identificadas para pesquisa comercial.',
      cmd3t:'Verificar',cmd3s:'Separar evidência, fornecedor potencial e confirmação comercial.',
      cmd4t:'Agir',cmd4s:'Contactar, enviar RFQ, acompanhar e preparar cotação.',
      commandTruth:'Stock e preço só são apresentados como confirmados quando existe evidência comercial atual.',
      cap1t:'Pesquisa técnica',cap1s:'Termos PT/EN e especificações',cap2t:'Pesquisa de fornecedores',cap2s:'Angola e Luanda primeiro',
      cap3t:'Estados de evidência',cap3s:'Fonte ≠ stock confirmado',cap4t:'Smart RFQ',cap4s:'Pedido estruturado para contacto',
      workspaceLabel:'ÁREA DE PESQUISA',startSourcing:'Abrir pedido de sourcing',
      legendFound:'Fornecedor potencial',legendSource:'Fonte identificada',legendConfirmed:'Confirmação comercial',
      browseNote:'O Source AO expande a pesquisa por categoria sem perder a especificação original.',
      cat1s:'cimento · aço · PVC · tintas',cat2s:'AC · cabos · proteção · peças',cat3s:'máquinas · ferramentas · oficina',
      cat4s:'consumíveis · higiene · manutenção',cat5s:'instalação · reparação · execução',cat6s:'químicos · embalagem · componentes',
      howNote:'A tecnologia acelera a procura; a confirmação comercial continua explícita.',
      step4t:'Executar',step4p:'Contactar, enviar RFQ, comparar e preparar a cotação.',
      requestTrust:'Contacto protegido · acompanhamento privado · sem publicação automática',
      mainNavigation:'Navegação principal',officialSite:'Abrir site oficial HMATIAS',sourceLogo:'SOURCE AO — pesquisa técnica de materiais e fornecedores da HMATIAS',
      exampleSearches:'Pesquisas de exemplo',sourceRules:'Regras do Source AO',capabilities:'Capacidades',commercialNetwork:'Rede comercial Source AO',
      exampleStrapping:'Cinta PP 9 mm',exampleFormalin:'Formol 37% 1 L',exampleAC:'AC 24.000 BTU',
      intelligenceEyebrow:'ANÁLISE COMERCIAL',intelligenceTitle:'Mais do que listar oportunidades.',intelligenceLink:'Abrir Intelligence Radar →',
      intelligence1Label:'IDENTIFICAR',intelligence1Title:'Fonte rastreável',intelligence1Text:'Capta RFQs, concursos e sinais comerciais em Angola mantendo a ligação à origem para validação.',
      intelligence2Label:'AVALIAR',intelligence2Title:'Adequação comercial',intelligence2Text:'Organiza área de negócio, adequação, confiança da evidência, urgência e localização antes da decisão.',
      intelligence3Label:'AGIR',intelligence3Title:'Ação operacional',intelligence3Text:'Transforma a oportunidade em próxima ação: validar requisitos, localizar parceiro ou fornecedor, preparar custo, margem e candidatura.',
      networkEyebrow:'REDE COMERCIAL HMATIAS',networkTitle:'Fornecedores e subempreiteiros entram por avaliação.',networkLink:'Apresentar empresa →',
      network1Label:'IDENTIFICAR',network1Title:'Identidade empresarial',network1Text:'Nome legal, registo, localização, contacto profissional e presença digital quando disponível.',
      network2Label:'QUALIFICAR',network2Title:'Capacidade real',network2Text:'Construção, facilities, canalização, eletricidade, HVAC, fornecimento e outras capacidades comprováveis.',
      network3Label:'REVER',network3Title:'Ativação controlada',network3Text:'A candidatura entra em revisão privada. Nenhuma empresa é apresentada como parceira aprovada automaticamente.',
      partners:'Parceiros',privacy:'Privacidade',terms:'Termos',privacyPolicy:'política de privacidade',
      unitConfirm:'A confirmar',unitEach:'Unidade (un)',unitLitres:'Litros (L)',unitRoll:'Rolo',unitBox:'Caixa',unitPallet:'Palete',
      requestItemPlaceholder:'Ex.: capacete de segurança, tubo PVC',requestQtyPlaceholder:'Ex.: 15',requestSpecPlaceholder:'Norma, dimensão, marca ou código técnico'
    }
  };

  const categories=[
    {name:'Construction materials',pt:'Materiais de construção',terms:['cement','cimento','concrete','betão','betao','block','bloco','brick','tijolo','sand','areia','steel','ferro','rebar','varão','varao','sheet','chapa','tile','telha','paint','tinta','mortar','argamassa','pvc','pipe','tubo']},
    {name:'HVAC & electrical',pt:'Climatização e elétrica',terms:['air conditioner','ar condicionado','btu','hvac','split','compressor','refrigerant','r410','r32','cable','cabo','breaker','disjuntor','electrical','elétrica','eletrica','generator','gerador']},
    {name:'Tools & equipment',pt:'Ferramentas e equipamentos',terms:['tool','ferramenta','drill','berbequim','machine','máquina','maquina','equipment','equipamento','welding','solda','grinder','rebarbadora']},
    {name:'Cleaning & facilities',pt:'Limpeza e facilities',terms:['cleaning','limpeza','detergent','detergente','disinfectant','desinfetante','facility','facilities','hygiene','higiene']},
    {name:'Services & contractors',pt:'Serviços e empreiteiros',terms:['service','serviço','servico','contractor','empreiteiro','maintenance','manutenção','manutencao','painting','pintura','installation','instalação','instalacao']},
    {name:'Industrial supply',pt:'Fornecimento industrial',terms:['industrial','valve','válvula','valvula','pump','bomba','bearing','rolamento','filter','filtro','chemical','químico','quimico','formaldehyde','formaldeído','formaldeido','helmet','safety helmet','hard hat','capacete','EPI','ppe','cinta','cinta pp','cinta de arquear','cinta de arqueação','cinta de arqueacao','fita de arquear','fita de arqueação','fita de arqueacao','fita pp','polipropileno','polypropylene','pp strap','pp strapping','strapping','packaging','embalagem']}
  ];

  const classify=q=>{
    const value=q.toLowerCase();
    const match=categories.find(c=>c.terms.some(term=>value.includes(term)));
    if(!match) return state.lang==='pt'?'Sourcing geral':'General sourcing';
    return state.lang==='pt'?match.pt:match.name;
  };
  const categoryCode=q=>{
    const value=String(q||'').toLowerCase();
    const match=categories.find(c=>c.terms.some(term=>value.includes(term)));
    return match?match.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''):'general';
  };

  const t=key=>dictionary[state.lang][key]||key;

  function applyLanguage(){
    document.documentElement.lang=state.lang==='pt'?'pt-AO':'en';
    if(window.location?.href && window.history?.replaceState){
      const localizedUrl=new URL(window.location.href);
      if(state.lang==='en')localizedUrl.searchParams.set('lang','en');else localizedUrl.searchParams.delete('lang');
      window.history.replaceState(null,'',localizedUrl.pathname+localizedUrl.search+localizedUrl.hash);
    }
    const pageTitle=state.lang==='en'?'SOURCE AO | Technical Sourcing and RFQs in Angola':'SOURCE AO | Sourcing, Fornecedores e RFQ em Angola';
    const pageDescription=state.lang==='en'
      ?'Source AO by HMATIAS: technical research for materials and suppliers in Angola, with structured RFQ requests. Pricing, stock and delivery subject to confirmation.'
      :'Source AO da HMATIAS: pesquisa técnica de materiais e fornecedores em Angola, com pedidos RFQ estruturados. Preço, stock e entrega sujeitos a confirmação.';
    document.title=pageTitle;
    const setMeta=(selector,value)=>{const element=document.querySelector(selector);if(element)element.setAttribute('content',value);};
    setMeta('meta[name="description"]',pageDescription);
    setMeta('meta[property="og:title"]',pageTitle);
    setMeta('meta[property="og:description"]',pageDescription);
    setMeta('meta[name="twitter:title"]',pageTitle);
    setMeta('meta[name="twitter:description"]',pageDescription);
    setMeta('meta[property="og:locale"]',state.lang==='en'?'en_GB':'pt_AO');
    setMeta('meta[property="og:image:alt"]',state.lang==='en'?'SOURCE AO by HMATIAS — technical sourcing in Angola':'SOURCE AO by HMATIAS — sourcing e oportunidades em Angola');
    setMeta('meta[name="twitter:image:alt"]',state.lang==='en'?'SOURCE AO by HMATIAS — technical sourcing in Angola':'SOURCE AO by HMATIAS — sourcing e oportunidades em Angola');
    if(window.location?.origin && window.location?.pathname)setMeta('meta[property="og:url"]',window.location.origin+window.location.pathname+(state.lang==='en'?'?lang=en':''));
    $$('[data-i18n]').forEach(node=>{const key=node.dataset.i18n;if(dictionary[state.lang][key]) node.textContent=dictionary[state.lang][key];});
    $$('[data-i18n-placeholder]').forEach(node=>{const key=node.dataset.i18nPlaceholder;if(dictionary[state.lang][key]) node.placeholder=dictionary[state.lang][key];});
    $$('[data-i18n-aria-label]').forEach(node=>{const value=dictionary[state.lang][node.dataset.i18nAriaLabel];if(value) node.setAttribute('aria-label',value);});
    $$('[data-i18n-alt]').forEach(node=>{const value=dictionary[state.lang][node.dataset.i18nAlt];if(value) node.setAttribute('alt',value);});
    $$('[data-href-pt][data-href-en]').forEach(node=>{node.setAttribute('href',state.lang==='en'?node.dataset.hrefEn:node.dataset.hrefPt);});
    $('#langToggle').textContent=state.lang==='en'?'PT':'EN';
    $('#langToggle').setAttribute('aria-label',state.lang==='en'?'Switch to Portuguese':'Mudar para EN — English');
    $$('a[href^="rfq.html"]').forEach(link=>link.href='rfq.html?lang='+state.lang);
    $$('a[href^="opportunity-radar.html"]').forEach(link=>link.href='opportunity-radar.html?lang='+state.lang);
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
    if(scroll){
      track('source_search',{source_category:categoryCode(state.query),source_language:state.lang});
      $('#resultZone').scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  function radarItems(){
    try{return JSON.parse(localStorage.getItem('sourceao_radar')||'[]')}catch{return[]}
  }
  function saveRadar(items){localStorage.setItem('sourceao_radar',JSON.stringify(items));renderRadar()}
  function addRadarItem(query,location){
    const q=(query||'').trim(); if(!q) return;
    const items=radarItems();
    const duplicate=items.some(i=>i.query.toLowerCase()===q.toLowerCase()&&i.location===location);
    if(!duplicate){
      items.unshift({id:Date.now(),query:q,location:location||'Luanda',createdAt:new Date().toISOString(),status:'awaiting_verified_source'});
      saveRadar(items);
      track('source_radar_add',{source_category:categoryCode(q),source_language:state.lang});
    }
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
  $('#startSourcing')?.addEventListener('click',event=>{
    event.preventDefault();
    const url=new URL('rfq.html',location.href);
    const requestValue=state.query||$('#searchInput')?.value.trim()||'';
    url.search=new URLSearchParams({request:requestValue,location:state.location||'Luanda',quantity:$('#quantityInput')?.value.trim()||'',urgency:$('#neededByInput')?.value||'',lang:state.lang}).toString();
    track('source_rfq_open',{source_category:categoryCode(requestValue),source_language:state.lang,source_origin:'search'});
    location.href=url.href;
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
    track('source_whatsapp_handoff',{source_category:categoryCode(item),source_language:state.lang});
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
