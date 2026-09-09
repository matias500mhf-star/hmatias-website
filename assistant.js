(()=>{
  const APIS=['https://api.comercialhmatiasps.com/api/ai','/api/ai'];
  const WA='https://wa.me/244948806673';

  function addMessage(box,text,kind){
    const el=document.createElement('div');
    el.className=`hmatias-assistant-msg ${kind}`;
    el.textContent=text;
    box.appendChild(el);
    box.scrollTop=box.scrollHeight;
    return el;
  }

  function localAnswer(raw){
    const m=raw.toLowerCase();

    if(/pine\s*gel|t563p/.test(m)){
      return 'O Pine Gel T563P de 5 kg é um dos produtos em destaque da HMATIAS Clean. O preço unitário de referência é 26.500 Kz e, para 4 ou mais unidades, 24.500 Kz por unidade. Stock, transporte e condições de entrega são confirmados antes da compra. Pode pedir disponibilidade ou cotação pelo WhatsApp.';
    }

    if(/hmatias clean|produto[s]? de limpeza|detergente|desinfetante|higiene|consumíveis|consumiveis|limpeza de piso/.test(m)){
      return 'A HMATIAS Clean comercializa e fornece produtos de limpeza e higiene para uso doméstico e profissional, incluindo detergentes, desinfetantes, produtos para pisos e consumíveis. Para compras por quantidade, a equipa confirma stock, preço e entrega antes do fecho.';
    }

    if(/administrativ|documental|business support|apoio empresarial|pm[e]?|carta|declaraç|declarac|formataç|formatac|digitalizaç|digitalizac|proposta comercial|cotação|cotacao|apresentaç|apresentac/.test(m)){
      return 'A HMATIAS Business Services presta apoio administrativo e documental. Administrativo & Documental: desde 5.000 Kz. Business Support: desde 15.000 Kz. Apoio Administrativo PME: 75.000 Kz/mês. Os valores são indicativos e variam conforme volume, complexidade e prazo. Não incluímos atos jurídicos, contabilísticos ou outros atos profissionais legalmente reservados.';
    }

    if(/preço|preco|valor|quanto custa|orçamento|orcamento/.test(m)){
      return 'Os preços variam conforme o serviço, produto, quantidade, local e especificações. A HMATIAS publica alguns valores de referência, mas a equipa comercial confirma sempre stock, escopo, transporte e condições antes do fecho. Envie os detalhes pelo WhatsApp para uma cotação.';
    }

    if(/constru|obra|betão|betao|paviment|infraestrutura/.test(m)){
      return 'A HMATIAS atua em construção civil, infraestrutura, pavimentação, betonagem e trabalhos de apoio. Para avaliar o projeto, envie localização, tipo de trabalho e uma breve descrição.';
    }

    if(/remodel|reabilita|casa de banho|cozinha|acabamento/.test(m)){
      return 'A HMATIAS executa remodelação e renovação de espaços, incluindo acabamentos e trabalhos associados. Envie fotos, medidas aproximadas e o objetivo da intervenção para uma análise inicial.';
    }

    if(/facilities|manuten|instalaç|instalac/.test(m)){
      return 'A HMATIAS presta serviços de facilities, manutenção e apoio operacional para instalações e espaços empresariais. A equipa pode confirmar o escopo após receber a necessidade e a frequência pretendida.';
    }

    if(/supply|procurement|fornecimento|equipamento|material/.test(m)){
      return 'A HMATIAS Supply apoia sourcing, procurement e fornecimento de produtos, materiais e equipamentos. Envie referência, especificação e quantidade para a equipa comercial verificar disponibilidade e condições.';
    }

    if(/contact|telefone|whatsapp|email|e-mail/.test(m)){
      return 'Pode contactar a HMATIAS pelo WhatsApp +244 948 806 673, pelo e-mail geral@hmatiasps.ao ou comercial@hmatiasps.ao.';
    }

    if(/onde|morada|endereço|endereco|localiza/.test(m)){
      return 'A HMATIAS está sediada em Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola.';
    }

    return 'Posso orientar sobre construção, remodelação, facilities, HMATIAS Clean, produtos de limpeza, HMATIAS Business Services, HMATIAS Supply, procurement, preços de referência e pedidos de orçamento. Para uma resposta comercial específica, diga o produto ou serviço, quantidade e localização.';
  }

  async function askAPI(message,history){
    for(const url of APIS){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),5500);
      try{
        const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history}),signal:controller.signal});
        clearTimeout(timer);
        if(!res.ok)continue;
        const data=await res.json();
        const answer=(data.answer||data.reply||data.response||'').trim();
        if(answer)return answer;
      }catch(e){clearTimeout(timer)}
    }
    throw new Error('AI unavailable');
  }

  function init(){
    if(document.querySelector('.hmatias-assistant'))return;
    const root=document.createElement('aside');
    root.className='hmatias-assistant';
    root.setAttribute('aria-label','Assistente HMATIAS');
    root.innerHTML=`<div class="hmatias-assistant-panel"><div class="hmatias-assistant-head"><div><strong>Assistente HMATIAS</strong><small>Serviços, produtos, preços e orçamento.</small></div><button class="hmatias-assistant-close" type="button" aria-label="Fechar assistente">×</button></div><div class="hmatias-assistant-messages" aria-live="polite"></div><div class="hmatias-assistant-links"><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:comercial@hmatiasps.ao">E-mail</a></div><form class="hmatias-assistant-form"><input aria-label="Mensagem" maxlength="1000" autocomplete="off" placeholder="Produto, serviço ou orçamento?"><button type="submit" aria-label="Enviar">Enviar</button></form></div><button class="hmatias-assistant-toggle" type="button" aria-expanded="false"><span aria-hidden="true">✦</span> Assistente</button>`;
    document.body.appendChild(root);

    const toggle=root.querySelector('.hmatias-assistant-toggle'),close=root.querySelector('.hmatias-assistant-close'),box=root.querySelector('.hmatias-assistant-messages'),form=root.querySelector('form'),input=form.querySelector('input');
    let history=[];

    function setOpen(open){
      root.classList.toggle('open',open);
      toggle.setAttribute('aria-expanded',String(open));
      if(open&&!box.children.length)addMessage(box,'Olá. Sou o assistente virtual da HMATIAS. Posso orientar sobre construção, produtos HMATIAS Clean, serviços administrativos, Supply, preços de referência e pedidos de orçamento.','bot');
      if(open)requestAnimationFrame(()=>input.focus());
    }

    toggle.addEventListener('click',()=>setOpen(!root.classList.contains('open')));
    close.addEventListener('click',()=>setOpen(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))setOpen(false)});

    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const message=input.value.trim();
      if(!message)return;
      input.value='';
      addMessage(box,message,'user');
      const loading=addMessage(box,'A preparar resposta…','bot');
      loading.classList.add('hmatias-assistant-loading');
      let answer='';
      try{answer=await askAPI(message,history)}catch(err){answer=localAnswer(message)}
      loading.remove();
      addMessage(box,answer,'bot');
      history=[...history,{role:'user',content:message},{role:'assistant',content:answer}].slice(-8);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
