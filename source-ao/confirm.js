(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const runtime=()=>window.SOURCE_AO_RUNTIME||{};
  const apiBase=()=>String(runtime().apiBase||'').replace(/\/$/,'');
  let requestId='';
  let token='';
  let lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'pt';
  let currentRequest=null;
  let currentError=null;
  let successKind='';
  const copy=(pt,en)=>lang==='en'?en:pt;

  function linkParams(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')||'');
    const query=new URLSearchParams(location.search);
    const id=hash.get('id')||query.get('id')||'';
    const signed=hash.get('token')||query.get('token')||'';
    if(location.search && id && signed){
      const keepLang=query.get('lang');
      history.replaceState(null,'',location.pathname+(keepLang?'?lang='+encodeURIComponent(keepLang):'')+'#id='+encodeURIComponent(id)+'&token='+encodeURIComponent(signed));
    }
    return {id,signed};
  }

  function showError(ptTitle,ptMessage,enTitle,enMessage){
    currentError={ptTitle,ptMessage,enTitle,enMessage};
    $('#loadingState').hidden=true;
    $('#requestPanel').hidden=true;
    $('#successState').hidden=true;
    $('#errorTitle').textContent=copy(ptTitle,enTitle);
    $('#errorMessage').textContent=copy(ptMessage,enMessage);
    $('#errorState').hidden=false;
  }

  function applyLanguage(){
    document.documentElement.lang=lang==='en'?'en':'pt-AO';
    document.title=copy('Source AO — Confirmação de fornecedor','Source AO — Supplier confirmation');
    document.querySelectorAll('[data-en]').forEach(node=>{
      if(!node.dataset.pt)node.dataset.pt=node.textContent;
      node.textContent=lang==='en'?node.dataset.en:node.dataset.pt;
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(node=>node.setAttribute('placeholder',lang==='en'?node.dataset.enPlaceholder:node.dataset.ptPlaceholder));
    $('#langToggle').textContent=lang==='en'?'PT':'EN';
    $('#langToggle').setAttribute('aria-label',lang==='en'?'Switch to Portuguese':'Mudar para EN — English');
    $('#homeLink').href=lang==='en'?'index.html?lang=en':'index.html?lang=pt';
    const url=new URL(location.href);url.searchParams.set('lang',lang==='en'?'en':'pt');
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    if(currentRequest)renderRequest(currentRequest);
    if(currentError)showError(currentError.ptTitle,currentError.ptMessage,currentError.enTitle,currentError.enMessage);
    if(successKind)showSuccess(successKind);
  }

  function showSuccess(kind){
    successKind=kind;
    $('#successState').hidden=false;
    $('#successState h2').textContent=kind==='approved'
      ?copy('Confirmação já revista.','Confirmation already reviewed.')
      :kind==='duplicate'
        ?copy('Resposta já registada.','Response already recorded.')
        :copy('Resposta recebida.','Response received.');
    $('#successState p').textContent=kind==='approved'
      ?copy('Este pedido já foi revisto pela HMATIAS.','HMATIAS has already reviewed this request.')
      :kind==='duplicate'
        ?copy('Este pedido já recebeu uma resposta ou foi revisto pela HMATIAS.','This request has already received a response or been reviewed by HMATIAS.')
        :copy('A HMATIAS irá rever a confirmação. Nenhum dado foi publicado automaticamente.','HMATIAS will review the confirmation. No data was published automatically.');
  }

  function fmtDate(value){
    if(!value) return '—';
    try{return new Intl.DateTimeFormat(lang==='en'?'en-GB':'pt-AO',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Luanda'}).format(new Date(value));}catch{return value;}
  }

  function requestPath(){
    return '/api/confirm/'+encodeURIComponent(requestId)+'?token='+encodeURIComponent(token);
  }

  async function api(path,options={}){
    if(!/^https?:\/\//i.test(apiBase())) throw new Error('api_not_configured');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(apiBase()+path,{
        ...options,
        cache:'no-store',
        signal:controller.signal,
        headers:{accept:'application/json',...(options.headers||{})}
      });
      let payload=null;
      try{payload=await response.json();}catch{payload=null;}
      if(!response.ok){
        const err=new Error(payload?.error?.code||`http_${response.status}`);
        err.status=response.status;
        err.payload=payload;
        throw err;
      }
      return payload;
    }finally{clearTimeout(timeout);}
  }

  function renderRequest(r){
    currentRequest=r;
    $('#requestId').textContent=r.id||'—';
    $('#supplierName').textContent=r.supplier_name||'—';
    $('#requirementText').textContent=r.item_name||r.requirement_text||copy('Necessidade comercial','Commercial requirement');
    $('#specification').textContent=r.specification||copy('A confirmar','To be confirmed');
    $('#quantity').textContent=r.quantity==null?copy('A confirmar','To be confirmed'):[r.quantity,r.unit].filter(Boolean).join(' ');
    $('#location').textContent=r.location||'—';
    $('#expiresAt').textContent=fmtDate(r.expires_at);
    const statusLabels=lang==='en'?{sent:'Sent',opened:'Opened',supplier_responded:'Supplier responded',approved:'Approved',expired:'Expired',closed:'Closed'}:{sent:'Enviado',opened:'Aberto',supplier_responded:'Fornecedor respondeu',approved:'Aprovado',expired:'Expirado',closed:'Encerrado'};
    $('#requestStatus').textContent=statusLabels[r.status]||(r.status||'sent').replaceAll('_',' ');
    $('#loadingState').hidden=true;
    $('#errorState').hidden=true;
    $('#requestPanel').hidden=false;
  }

  async function load(){
    ({id:requestId,signed:token}=linkParams());
    if(!requestId||!token){
      showError('Link incompleto.','Peça à HMATIAS um novo link de confirmação.','Incomplete link.','Ask HMATIAS for a new confirmation link.');
      return;
    }
    if(!/^https?:\/\//i.test(apiBase())){
      showError('Confirmação ainda não disponível.','O ambiente Source AO não está ligado à API de confirmação.','Confirmation is not available yet.','The Source AO environment is not connected to the confirmation API.');
      return;
    }
    try{
      const payload=await api(requestPath());
      const r=payload?.verification_request;
      if(!r) throw new Error('invalid_response');
      renderRequest(r);
      if(['approved','supplier_responded'].includes(r.status)){
        $('#confirmationForm').hidden=true;
        $('#successState').hidden=false;
        showSuccess(r.status==='approved'?'approved':'duplicate');
        $('#successState p').textContent=r.status==='approved'
          ?copy('Este pedido já foi revisto pela HMATIAS.','HMATIAS has already reviewed this request.')
          :copy('A resposta deste pedido já foi registada e aguarda revisão da HMATIAS.','This response has already been recorded and is awaiting HMATIAS review.');
      }
    }catch(error){
      if(error.message==='invalid_or_expired_link'||error.status===403){
        showError('Link expirado ou inválido.','Por segurança, os links de confirmação têm validade limitada. Peça um novo link à HMATIAS.','Expired or invalid link.','For security, confirmation links expire. Ask HMATIAS for a new link.');
      }else if(error.status===404){
        showError('Pedido não encontrado.','A referência não existe ou deixou de estar disponível.','Request not found.','The reference does not exist or is no longer available.');
      }else{
        showError('Não foi possível carregar o pedido.','Verifique a ligação e tente abrir novamente o link recebido.','Could not load the request.','Check your connection and try opening the link again.');
      }
    }
  }

  function numberOrNull(input){
    const value=input.value.trim();
    if(!value) return null;
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:null;
  }

  $('#confirmationForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const selected=document.querySelector('input[name="available"]:checked');
    if(!selected){$('#formMessage').textContent=copy('Selecione se a necessidade está disponível ou não.','Select whether the requirement is available.');return;}
    const price=numberOrNull($('#priceReported'));
    const currency=$('#currency').value.trim().toUpperCase();
    if(price!=null&&!/^[A-Z]{3}$/.test(currency)){
      $('#formMessage').textContent=copy('Indique uma moeda de 3 letras para o preço, por exemplo AOA.','Enter a 3-letter currency code for the price, for example AOA.');
      $('#currency').focus();
      return;
    }
    const payload={
      available:selected.value==='true',
      quantity_reported:numberOrNull($('#quantityReported')),
      price_reported:price,
      currency:price==null?null:currency,
      lead_time:$('#leadTime').value.trim()||null,
      responded_by:$('#respondedBy').value.trim()||null,
      note:$('#note').value.trim()||null
    };
    const button=$('#submitButton');
    button.disabled=true;
    $('#formMessage').textContent=copy('A enviar confirmação…','Sending confirmation…');
    try{
      await api(requestPath(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      $('#confirmationForm').hidden=true;
      showSuccess('submitted');
      $('#formMessage').textContent='';
      token='';
      history.replaceState(null,'',location.pathname+'?lang='+(lang==='en'?'en':'pt'));
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(error){
      button.disabled=false;
      if(error.status===409){
        $('#confirmationForm').hidden=true;
        $('#successState').hidden=false;
        showSuccess('duplicate');
      }else if(error.status===403){
        showError('Link expirado ou inválido.','Peça à HMATIAS um novo link de confirmação.','Expired or invalid link.','Ask HMATIAS for a new confirmation link.');
      }else{
        $('#formMessage').textContent=copy('Não foi possível enviar agora. A resposta não foi registada; tente novamente.','Could not send now. The response was not recorded; please try again.');
      }
    }
  });

  document.addEventListener('DOMContentLoaded',()=>{
    applyLanguage();
    $('#langToggle')?.addEventListener('click',()=>{lang=lang==='en'?'pt':'en';applyLanguage();});
    load();
  },{once:true});
})();
