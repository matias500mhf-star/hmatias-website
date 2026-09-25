(()=>{
  'use strict';

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const state={lang:'en',query:'',location:'Luanda'};

  const dictionary={
    en:{
      eyebrow:'ANGOLA SOURCING, MADE CLEAR',heroTitle:'Find what you need in Angola.',heroLead:'Materials, equipment and services. Structured search, current data and commercial verification before you decide.',searchPlaceholder:'Search a material, equipment or service…',searchButton:'Search',popular:'Popular:',asideLabel:'SOURCE AO',asideLine1:'SEARCH',asideLine2:'VERIFY',asideLine3:'SOURCE',asideSmall:'A service by HMATIAS',searchRead:'SEARCH INTERPRETATION',category:'Category',market:'Market',freshness:'Freshness',notVerified:'Not yet verified',truthNote:'Source AO will never label stock, price or supplier availability as confirmed without a traceable source and verification timestamp.',publicSearch:'Search public sources',addRadar:'Add to Radar',confidence:'Data confidence',awaiting:'Awaiting verified source',confidenceText:'A result becomes verified only when Source AO stores the source, verification time and evidence.',browse:'BROWSE BY NEED',whatLooking:'What are you looking for?',cat1:'Construction materials',cat2:'HVAC & electrical',cat3:'Tools & equipment',cat4:'Cleaning & facilities',cat5:'Services & contractors',cat6:'Industrial supply',radarEyebrow:'SOURCE AO RADAR',radarTitle:"Don't find it once. Track it until it is verified.",radarLead:'Radar keeps a requirement active and separates discovered information from confirmed market availability.',r1t:'Found',r1s:'A possible match exists.',r2t:'Checked',r2s:'Source and date are recorded.',r3t:'Verified',r3s:'Availability is commercially confirmed.',myRadar:'My Radar',radarPlaceholder:'What should Radar watch for?',watch:'Watch',emptyTitle:'No active searches yet.',emptyText:'Add a material, service or specification. Radar will keep it organised until verified data is connected.',radarDisclaimer:'Current MVP stores your watch list on this device. Automated market monitoring will only be enabled when verified data sources are connected.',howEyebrow:'HOW IT WORKS',howTitle:'From search to a usable answer.',step1t:'Describe the need',step1p:'Material, specification, quantity and location.',step2t:'Source AO verifies',step2p:'Sources are separated by freshness and confidence.',step3t:'Act on real options',step3p:'Contact, compare or request HMATIAS sourcing support.',needSpecific:'NEED SOMETHING SPECIFIC?',requestTitle:'Let our team source it for you.',requestLead:'Send the exact requirement. No generic promise — the team validates the market before quoting.',itemPlaceholder:'Material / service',qtyPlaceholder:'Quantity / specification',prepareRequest:'Prepare sourcing request',footerLine:'Search. Verify. Source.',serviceBy:'A service by HMATIAS',footerTruth:'Verified data before commercial claims.'
    },
    pt:{
      eyebrow:'SOURCING EM ANGOLA, SEM CONFUSÃO',heroTitle:'Encontre o que precisa em Angola.',heroLead:'Materiais, equipamentos e serviços. Pesquisa estruturada, dados atuais e verificação comercial antes da decisão.',searchPlaceholder:'Pesquise material, equipamento ou serviço…',searchButton:'Pesquisar',popular:'Pesquisas:',asideLabel:'SOURCE AO',asideLine1:'PESQUISAR',asideLine2:'VERIFICAR',asideLine3:'ENCONTRAR',asideSmall:'Um serviço da HMATIAS',searchRead:'INTERPRETAÇÃO DA PESQUISA',category:'Categoria',market:'Mercado',freshness:'Atualização',notVerified:'Ainda não verificado',truthNote:'O Source AO nunca apresenta stock, preço ou disponibilidade de fornecedor como confirmado sem fonte rastreável e data de verificação.',publicSearch:'Pesquisar fontes públicas',addRadar:'Adicionar ao Radar',confidence:'Confiança dos dados',awaiting:'Aguardando fonte verificada',confidenceText:'Um resultado só passa a verificado quando o Source AO guarda a fonte, a hora da verificação e a evidência.',browse:'PESQUISAR POR NECESSIDADE',whatLooking:'O que procura?',cat1:'Materiais de construção',cat2:'Climatização e elétrica',cat3:'Ferramentas e equipamentos',cat4:'Limpeza e facilities',cat5:'Serviços e empreiteiros',cat6:'Fornecimento industrial',radarEyebrow:'RADAR SOURCE AO',radarTitle:'Não procure uma vez. Acompanhe até existir informação verificada.',radarLead:'O Radar mantém uma necessidade ativa e separa informação encontrada de disponibilidade realmente confirmada.',r1t:'Encontrado',r1s:'Existe uma possível correspondência.',r2t:'Verificado na fonte',r2s:'Fonte e data ficam registadas.',r3t:'Confirmado',r3s:'A disponibilidade foi confirmada comercialmente.',myRadar:'Meu Radar',radarPlaceholder:'O que o Radar deve acompanhar?',watch:'Acompanhar',emptyTitle:'Ainda não existem pesquisas ativas.',emptyText:'Adicione um material, serviço ou especificação. O Radar mantém tudo organizado até existirem dados verificados.',radarDisclaimer:'Neste MVP, a lista do Radar fica guardada neste dispositivo. A monitorização automática só será ativada quando existirem fontes de dados verificadas.',howEyebrow:'COMO FUNCIONA',howTitle:'Da pesquisa a uma resposta utilizável.',step1t:'Descreva a necessidade',step1p:'Material, especificação, quantidade e localização.',step2t:'Source AO verifica',step2p:'As fontes são separadas por atualização e nível de confiança.',step3t:'Avance com opções reais',step3p:'Contacte, compare ou peça apoio de sourcing à HMATIAS.',needSpecific:'PRECISA DE ALGO ESPECÍFICO?',requestTitle:'A nossa equipa procura por si.',requestLead:'Envie a necessidade exata. Sem promessas genéricas — a equipa valida o mercado antes de cotar.',itemPlaceholder:'Material / serviço',qtyPlaceholder:'Quantidade / especificação',prepareRequest:'Preparar pedido de sourcing',footerLine:'Pesquisar. Verificar. Encontrar.',serviceBy:'Um serviço da HMATIAS',footerTruth:'Dados verificados antes de qualquer afirmação comercial.'
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

  applyLanguage();
})();