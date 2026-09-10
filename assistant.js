(()=>{
  const API_URLS=['https://api.comercialhmatiasps.com/api/ai','/api/ai'];
  const WA='https://wa.me/244948806673';
  const pageEnglish=(document.documentElement.lang||'').toLowerCase().startsWith('en');

  const add=(box,text,kind)=>{
    const el=document.createElement('div');
    el.className=`hmatias-assistant-msg ${kind}`;
    el.textContent=text;
    box.appendChild(el);
    box.scrollTop=box.scrollHeight;
    return el;
  };

  const prefersEnglish=raw=>pageEnglish||/\b(hello|hi|price|service|visa|appointment|cleaning|construction|facilities|supply|contact|document|quote|business|product)\b/i.test(raw);

  function localAnswer(raw){
    const m=raw.toLowerCase();
    const en=prefersEnglish(raw);
    if(/agendamento|consular|visto|visa|appointment/.test(m))return en
      ?'HMATIAS Business Services provides administrative support for consular appointments and visa processes. Pricing is on request because scope varies by destination, visa type, documentation and level of assistance. HMATIAS does not sell appointment slots, guarantee availability or guarantee visa approval. Official consular/VFS fees are separate unless expressly included in a quotation.'
      :'A HMATIAS Business Services presta apoio administrativo para agendamentos consulares e processos de visto. O preço é sob consulta porque varia conforme destino, tipo de visto, documentação e nível de acompanhamento. A HMATIAS não vende vagas, não garante disponibilidade de agendamento nem aprovação do visto. Taxas consulares/VFS são separadas, salvo indicação expressa na cotação.';
    if(/123.*pine|pine.*500|500\s*ml/.test(m))return en
      ?'HMATIAS Clean presents 123 Pine Gel in the 500 ml format. Price, stock and delivery conditions are confirmed by the commercial team before purchase.'
      :'A HMATIAS Clean apresenta o 123 Pine Gel no formato de 500 ml. O preço, stock e condições de entrega são confirmados pela equipa comercial antes da compra.';
    if(/t563p|taurus.*pine|pine.*5\s*kg|5\s*kg.*pine/.test(m))return en
      ?'Taurus Pine Gel T563P 5 kg has a reference unit price of 26,500 Kz and 24,500 Kz per unit for 4 or more units. Stock, transport and delivery must be confirmed before purchase.'
      :'O Taurus Pine Gel T563P de 5 kg tem preço unitário de referência de 26.500 Kz e, para 4 ou mais unidades, 24.500 Kz por unidade. Stock, transporte e entrega devem ser confirmados antes da compra.';
    if(/hmatias clean|produto[s]? de limpeza|cleaning|detergent|detergente|disinfect|desinfetante|higiene|consum/.test(m))return en
      ?'HMATIAS Clean is a dedicated HMATIAS division for cleaning and hygiene products. Its catalogue is available at hmatias-clean-en.html. Unpriced items are quoted after confirming stock, format, quantity and delivery.'
      :'A HMATIAS Clean é uma divisão dedicada a produtos de limpeza e higiene. O catálogo próprio está em hmatias-clean.html. Produtos sem preço publicado são cotados após confirmação de stock, formato, quantidade e entrega.';
    if(/administrativ|documental|document|business support|apoio empresarial|pm[e]?|carta|declaraç|formataç|digitalizaç|proposta|quotation|cotação|presentation|apresentaç/.test(m))return en
      ?'HMATIAS Business Services provides administrative and document support. Administrative & Document Support starts at 5,000 Kz, Business Support starts at 15,000 Kz, and SME Administrative Support starts at 75,000 Kz/month. Visa and consular appointment support is priced on request.'
      :'A HMATIAS Business Services presta apoio administrativo e documental. Administrativo & Documental: desde 5.000 Kz. Business Support: desde 15.000 Kz. Apoio Administrativo PME: desde 75.000 Kz/mês. Agendamentos consulares e apoio a vistos: sob consulta.';
    if(/constru|obra|betão|betao|paviment|infraestrutura|construction|infrastructure|paving|concrete/.test(m))return en
      ?'HMATIAS works in civil construction, infrastructure, concrete, paving and remodelling. The dedicated Construction & Infrastructure page explains capabilities and the assessment process.'
      :'A HMATIAS atua em construção civil, infraestrutura, betonagem, pavimentação e remodelação. A página Construção & Infraestrutura apresenta as capacidades e o processo de avaliação.';
    if(/facilities|manuten|maintenance|instalaç|instalac|limpeza empresarial/.test(m))return en
      ?'HMATIAS Facilities Services covers maintenance, cleaning and operational support for business premises under an agreed scope and frequency.'
      :'A HMATIAS Facilities Services cobre manutenção, limpeza e apoio operacional para instalações empresariais, com escopo e frequência definidos.';
    if(/supply|procurement|sourcing|fornecimento|equipamento|material|fornecedor|supplier/.test(m))return en
      ?'HMATIAS Supply supports national, regional and international sourcing, procurement and business supply. Send the reference, specification, quantity and target timing for assessment.'
      :'A HMATIAS Supply apoia sourcing, procurement e fornecimento nacional, regional e internacional. Envie referência, especificação, quantidade e prazo pretendido para avaliação.';
    if(/preço|preco|valor|quanto custa|orçamento|orcamento|price|cost|quote/.test(m))return en
      ?'Reference prices are published only where they are sufficiently defined. Variable products and services are quoted after confirming stock, quantity, transport, complexity and deadline. Tell me which item you need.'
      :'Os preços de referência são publicados apenas quando estão suficientemente definidos. Produtos e serviços variáveis são cotados após confirmação de stock, quantidade, transporte, complexidade e prazo. Diga-me o que pretende.';
    if(/contact|telefone|whatsapp|email|e-mail/.test(m))return en
      ?'Contact HMATIAS on WhatsApp +244 948 806 673, geral@hmatiasps.ao or comercial@hmatiasps.ao.'
      :'Pode contactar a HMATIAS pelo WhatsApp +244 948 806 673, geral@hmatiasps.ao ou comercial@hmatiasps.ao.';
    if(/onde|morada|endereço|endereco|localiza|where|address|location/.test(m))return en
      ?'HMATIAS is based in Viana, Bairro 1 de Maio, House No. 31, Luanda, Angola.'
      :'A HMATIAS está sediada em Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola.';
    return en
      ?'I can help with Construction & Infrastructure, Facilities, HMATIAS Supply, HMATIAS Clean, Business Services, visa/consular administrative support, reference pricing and quotations.'
      :'Posso orientar sobre Construção & Infraestrutura, Facilities, HMATIAS Supply, HMATIAS Clean, Business Services, apoio administrativo a vistos/agendamentos consulares, preços de referência e pedidos de orçamento.';
  }

  async function askAPI(message,history){
    for(const url of API_URLS){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),5000);
      try{
        const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history}),signal:controller.signal});
        clearTimeout(timer);
        if(!res.ok)continue;
        const data=await res.json();
        const answer=(data.answer||data.reply||data.response||'').trim();
        if(answer)return answer;
      }catch(_){clearTimeout(timer);}
    }
    throw new Error('AI unavailable');
  }

  function init(){
    if(document.querySelector('.hmatias-assistant'))return;
    const t=pageEnglish
      ?{label:'HMATIAS Assistant',sub:'Core services, divisions and quotations.',close:'Close assistant',msg:'Message',placeholder:'What do you need?',send:'Send',toggle:'Assistant',hello:'Hello. I can guide you through HMATIAS Construction, Facilities, Supply, HMATIAS Clean, Business Services and quotation requests.',loading:'Preparing response…'}
      :{label:'Assistente HMATIAS',sub:'Serviços principais, divisões e cotações.',close:'Fechar assistente',msg:'Mensagem',placeholder:'O que precisa?',send:'Enviar',toggle:'Assistente',hello:'Olá. Posso orientar sobre Construção, Facilities, Supply, HMATIAS Clean, Business Services e pedidos de cotação.',loading:'A preparar resposta…'};
    const root=document.createElement('aside');
    root.className='hmatias-assistant';
    root.setAttribute('aria-label',t.label);
    root.innerHTML=`<div class="hmatias-assistant-panel"><div class="hmatias-assistant-head"><div><strong>${t.label}</strong><small>${t.sub}</small></div><button class="hmatias-assistant-close" type="button" aria-label="${t.close}">×</button></div><div class="hmatias-assistant-messages" aria-live="polite"></div><div class="hmatias-assistant-links"><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:comercial@hmatiasps.ao">E-mail</a></div><form class="hmatias-assistant-form"><input aria-label="${t.msg}" maxlength="1000" autocomplete="off" placeholder="${t.placeholder}"><button type="submit" aria-label="${t.send}">${t.send}</button></form></div><button class="hmatias-assistant-toggle" type="button" aria-expanded="false"><span aria-hidden="true">✦</span> ${t.toggle}</button>`;
    document.body.appendChild(root);
    const toggle=root.querySelector('.hmatias-assistant-toggle');
    const close=root.querySelector('.hmatias-assistant-close');
    const box=root.querySelector('.hmatias-assistant-messages');
    const form=root.querySelector('form');
    const input=form.querySelector('input');
    let history=[];

    const setOpen=open=>{
      root.classList.toggle('open',open);
      toggle.setAttribute('aria-expanded',String(open));
      if(open&&!box.children.length)add(box,t.hello,'bot');
      if(open)requestAnimationFrame(()=>input.focus());
    };
    toggle.addEventListener('click',()=>setOpen(!root.classList.contains('open')));
    close.addEventListener('click',()=>setOpen(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))setOpen(false);});

    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const message=input.value.trim();
      if(!message)return;
      input.value='';
      add(box,message,'user');
      const loading=add(box,t.loading,'bot');
      loading.classList.add('hmatias-assistant-loading');
      let answer;
      try{answer=await askAPI(message,history);}
      catch(_){answer=localAnswer(message);}
      loading.remove();
      add(box,answer,'bot');
      history=[...history,{role:'user',content:message},{role:'assistant',content:answer}].slice(-8);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
