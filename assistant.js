(()=>{
  const API_URLS=['https://api.comercialhmatiasps.com/api/ai','/api/ai'];
  const WA='https://wa.me/244948806673';
  const pageEnglish=(document.documentElement.lang||'').toLowerCase().startsWith('en');

  const add=(box,text,kind)=>{const el=document.createElement('div');el.className=`hmatias-assistant-msg ${kind}`;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;return el;};
  const prefersEnglish=raw=>pageEnglish||/\b(hello|hi|price|service|visa|appointment|cleaning|construction|facilities|supply|contact|document|quote|business|product|stock|catalogue)\b/i.test(raw);
  const currentPageContext=()=>{const main=document.querySelector('main');const raw=(main?.innerText||document.body.innerText||'').replace(/\s+/g,' ').trim();return [`URL: ${location.href}`,`TITLE: ${document.title}`,`PAGE: ${raw.slice(0,18000)}`].join('\n');};

  function catalogueLocalAnswer(raw,en){
    const rows=Array.isArray(window.HMATIAS_CLEAN_PRODUCTS)?window.HMATIAS_CLEAN_PRODUCTS:[];
    const m=raw.toLowerCase();
    const found=rows.find(x=>m.includes(String(x.code).toLowerCase())||m.includes(String(x.name).toLowerCase()));
    if(!found)return '';
    return en
      ?`${found.name} (${found.code}) is listed in the HMATIAS Clean 2026 catalogue. ${found.en} Available formats: ${found.sizes}. Supply is on order; stock, lead time, price and delivery are confirmed by the commercial team.`
      :`${found.name} (${found.code}) consta do catálogo HMATIAS Clean 2026. ${found.pt} Formatos disponíveis: ${found.sizes}. O fornecimento é sob encomenda; stock, prazo, preço e entrega são confirmados pela equipa comercial.`;
  }

  function localAnswer(raw){
    const m=raw.toLowerCase();const en=prefersEnglish(raw);const catalogue=catalogueLocalAnswer(raw,en);if(catalogue)return catalogue;
    if(/agendamento|consular|visto|visa|appointment/.test(m))return en
      ?'HMATIAS Business Services provides administrative support for consular appointments and visa processes. Pricing is on request because scope varies by destination, visa type, documentation and level of assistance. HMATIAS does not sell appointment slots, guarantee availability or guarantee visa approval. Official consular/VFS fees are separate unless expressly included in a quotation.'
      :'A HMATIAS Business Services presta apoio administrativo para agendamentos consulares e processos de visto. O preço é sob consulta porque varia conforme destino, tipo de visto, documentação e nível de acompanhamento. A HMATIAS não vende vagas, não garante disponibilidade de agendamento nem aprovação do visto. Taxas consulares/VFS são separadas, salvo indicação expressa na cotação.';
    if(/123.*pine|pine.*500\s*ml|500\s*ml.*pine/.test(m))return en
      ?'HMATIAS Clean presents 123 Pine Gel in the 500 ml format. It is supplied on order. Price, stock, lead time and delivery are confirmed by the commercial team before purchase.'
      :'A HMATIAS Clean apresenta o 123 Pine Gel no formato de 500 ml. O produto é fornecido sob encomenda. Preço, stock, prazo e entrega são confirmados pela equipa comercial antes da compra.';
    if(/t563p|taurus.*pine|pine gel/.test(m))return en
      ?'Taurus Pine Gel T563P is an all-purpose cleaning gel with pine odour, pH 7, complete solubility and biodegradable specification. Formats are 500 g, 1 kg, 5 kg and 20 kg. HMATIAS prices: 1 kg 8,500 Kz; 5 kg 26,500 Kz; 20 kg 94,000 Kz; 500 g price on request. One price applies per pack, with no volume tier. Supply is on order and stock, lead time and delivery are confirmed before purchase. The manufacturer advises against use on food-contact surfaces.'
      :'O Taurus Pine Gel T563P é um gel de limpeza multiuso, odor a pinho, pH 7, completamente solúvel e biodegradável. Formatos: 500 g, 1 kg, 5 kg e 20 kg. Preços HMATIAS: 1 kg 8.500 Kz; 5 kg 26.500 Kz; 20 kg 94.000 Kz; 500 g sob consulta. Existe um único preço por embalagem, sem escalões por quantidade. O fornecimento é sob encomenda e stock, prazo e entrega são confirmados antes da compra. O fabricante desaconselha o uso em superfícies de contacto com alimentos.';
    if(/hmatias clean|produto[s]? de limpeza|cleaning|detergent|detergente|disinfect|desinfetante|higiene|consum|catalogo|catálogo|catalogue/.test(m))return en
      ?'HMATIAS Clean supplies cleaning and hygiene products for domestic and professional use. The 2026 professional catalogue covers Kitchen Care, General Purpose, Washroom Care, Fabric & Air Care, Vehicle Care, Maintenance/Pool/Drain and Floor Care. Catalogue products are supplied on order; stock and lead time are confirmed on request. Products without a published HMATIAS price are quoted by the commercial team.'
      :'A HMATIAS Clean fornece produtos de limpeza e higiene para uso doméstico e profissional. O catálogo profissional 2026 está organizado em Cozinha, Multiuso e Desinfeção, Casas de Banho e Higiene, Lavandaria/Tecidos/Ambiente, Automóvel, Manutenção/Piscinas/Drenagem e Pisos/Carpetes. Os produtos são fornecidos sob encomenda, com stock e prazo sob consulta. Produtos sem preço HMATIAS publicado são cotados pela equipa comercial.';
    if(/administrativ|documental|document|business support|apoio empresarial|pm[e]?|carta|declaraç|formataç|digitalizaç|proposta|quotation|cotação|presentation|apresentaç/.test(m))return en
      ?'HMATIAS Business Services provides administrative and document support. Administrative & Document Support starts at 5,000 Kz, Business Support starts at 15,000 Kz, and SME Administrative Support starts at 75,000 Kz/month. Visa and consular appointment support is priced on request.'
      :'A HMATIAS Business Services presta apoio administrativo e documental. Administrativo & Documental: desde 5.000 Kz. Business Support: desde 15.000 Kz. Apoio Administrativo PME: desde 75.000 Kz/mês. Agendamentos consulares e apoio a vistos: sob consulta.';
    if(/constru|obra|betão|betao|paviment|infraestrutura|construction|infrastructure|paving|concrete|remodel/.test(m))return en
      ?'HMATIAS works in civil construction, infrastructure, concrete, paving and remodelling. The dedicated Construction & Infrastructure page explains capabilities, project examples and the assessment process.'
      :'A HMATIAS atua em construção civil, infraestrutura, betonagem, pavimentação e remodelação. A página Construção & Infraestrutura apresenta capacidades, projetos e o processo de avaliação.';
    if(/facilities|manuten|maintenance|instalaç|instalac|limpeza empresarial/.test(m))return en
      ?'HMATIAS Facilities Services covers maintenance, cleaning and operational support for business premises under an agreed scope and frequency.'
      :'A HMATIAS Facilities Services cobre manutenção, limpeza e apoio operacional para instalações empresariais, com escopo e frequência definidos.';
    if(/supply|procurement|sourcing|fornecimento|equipamento|material|fornecedor|supplier/.test(m))return en
      ?'HMATIAS Supply supports national, regional and international sourcing, procurement and business supply. Send the reference, specification, quantity and target timing for assessment.'
      :'A HMATIAS Supply apoia sourcing, procurement e fornecimento nacional, regional e internacional. Envie referência, especificação, quantidade e prazo pretendido para avaliação.';
    if(/preço|preco|valor|quanto custa|orçamento|orcamento|price|cost|quote/.test(m))return en
      ?'Published HMATIAS prices apply only where the product or service is sufficiently defined. Other products and variable services are quoted after confirming format, stock, quantity, transport, complexity and deadline. Tell me the exact item you need.'
      :'Os preços HMATIAS são publicados apenas quando o produto ou serviço está suficientemente definido. Outros produtos e serviços variáveis são cotados após confirmação de formato, stock, quantidade, transporte, complexidade e prazo. Indique o item exato que pretende.';
    if(/contact|telefone|whatsapp|email|e-mail/.test(m))return en
      ?'Contact HMATIAS on WhatsApp +244 948 806 673, geral@hmatiasps.ao or comercial@hmatiasps.ao.'
      :'Pode contactar a HMATIAS pelo WhatsApp +244 948 806 673, geral@hmatiasps.ao ou comercial@hmatiasps.ao.';
    if(/onde|morada|endereço|endereco|localiza|where|address|location/.test(m))return en
      ?'HMATIAS is based in Viana, Bairro 1 de Maio, House No. 31, Luanda, Angola.'
      :'A HMATIAS está sediada em Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola.';
    return en
      ?'I can guide you through HMATIAS Construction & Infrastructure, Facilities, Supply, HMATIAS Clean, Business Services, the products and information shown on this page, and quotation requests.'
      :'Posso orientar sobre Construção & Infraestrutura, Facilities, Supply, HMATIAS Clean, Business Services, os produtos e informações apresentados nesta página e pedidos de cotação.';
  }

  async function askAPI(message,history){
    for(const url of API_URLS){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,pageContext:currentPageContext(),pageUrl:location.href,pageTitle:document.title}),signal:controller.signal});clearTimeout(timer);if(!res.ok)continue;const data=await res.json();const answer=(data.answer||data.reply||data.response||'').trim();if(answer)return answer;}catch(_){clearTimeout(timer);}}
    throw new Error('AI unavailable');
  }

  function init(){
    if(document.querySelector('.hmatias-assistant'))return;
    const t=pageEnglish?{label:'HMATIAS Assistant',sub:'Services, products, page information and quotations.',close:'Close assistant',msg:'Message',placeholder:'What do you need?',send:'Send',toggle:'Assistant',hello:'Hello. I can guide you through HMATIAS services, divisions, the products and information on this page, and quotation requests.',loading:'Preparing response…'}:{label:'Assistente HMATIAS',sub:'Serviços, produtos, informação da página e cotações.',close:'Fechar assistente',msg:'Mensagem',placeholder:'O que precisa?',send:'Enviar',toggle:'Assistente',hello:'Olá. Posso orientar sobre os serviços e divisões HMATIAS, os produtos e informações desta página e pedidos de cotação.',loading:'A preparar resposta…'};
    const root=document.createElement('aside');root.className='hmatias-assistant';root.setAttribute('aria-label',t.label);root.innerHTML=`<div class="hmatias-assistant-panel"><div class="hmatias-assistant-head"><div><strong>${t.label}</strong><small>${t.sub}</small></div><button class="hmatias-assistant-close" type="button" aria-label="${t.close}">×</button></div><div class="hmatias-assistant-messages" aria-live="polite"></div><div class="hmatias-assistant-links"><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:comercial@hmatiasps.ao">E-mail</a></div><form class="hmatias-assistant-form"><input aria-label="${t.msg}" maxlength="1000" autocomplete="off" placeholder="${t.placeholder}"><button type="submit" aria-label="${t.send}">${t.send}</button></form></div><button class="hmatias-assistant-toggle" type="button" aria-expanded="false" aria-label="${t.toggle}"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 2V11.5a8.5 8.5 0 0 1 17 0Z"/><path d="M7 9h9M7 13h6"/></svg><span>${t.toggle}</span></button>`;document.body.appendChild(root);
    const toggle=root.querySelector('.hmatias-assistant-toggle');const close=root.querySelector('.hmatias-assistant-close');const box=root.querySelector('.hmatias-assistant-messages');const form=root.querySelector('form');const input=form.querySelector('input');let history=[];
    const setOpen=open=>{root.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));if(open&&!box.children.length)add(box,t.hello,'bot');if(open)requestAnimationFrame(()=>input.focus());};
    toggle.addEventListener('click',()=>setOpen(!root.classList.contains('open')));close.addEventListener('click',()=>setOpen(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))setOpen(false);});
    form.addEventListener('submit',async e=>{e.preventDefault();const message=input.value.trim();if(!message)return;input.value='';add(box,message,'user');const loading=add(box,t.loading,'bot');loading.classList.add('hmatias-assistant-loading');let answer;try{answer=await askAPI(message,history);}catch(_){answer=localAnswer(message);}loading.remove();add(box,answer,'bot');history=[...history,{role:'user',content:message},{role:'assistant',content:answer}].slice(-8);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();