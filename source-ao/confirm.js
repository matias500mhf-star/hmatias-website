(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const runtime=()=>window.SOURCE_AO_RUNTIME||{};
  const apiBase=()=>String(runtime().apiBase||'').replace(/\/$/,'');
  let requestId='';
  let token='';

  function linkParams(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')||'');
    const query=new URLSearchParams(location.search);
    const id=hash.get('id')||query.get('id')||'';
    const signed=hash.get('token')||query.get('token')||'';
    if(location.search && id && signed){
      history.replaceState(null,'',location.pathname+'#id='+encodeURIComponent(id)+'&token='+encodeURIComponent(signed));
    }
    return {id,signed};
  }

  function showError(title,message){
    $('#loadingState').hidden=true;
    $('#requestPanel').hidden=true;
    $('#successState').hidden=true;
    $('#errorTitle').textContent=title;
    $('#errorMessage').textContent=message;
    $('#errorState').hidden=false;
  }

  function fmtDate(value){
    if(!value) return '—';
    try{return new Intl.DateTimeFormat('pt-AO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return value;}
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
    $('#requestId').textContent=r.id||'—';
    $('#supplierName').textContent=r.supplier_name||'—';
    $('#requirementText').textContent=r.item_name||r.requirement_text||'Necessidade comercial';
    $('#specification').textContent=r.specification||'A confirmar';
    $('#quantity').textContent=r.quantity==null?'A confirmar':[r.quantity,r.unit].filter(Boolean).join(' ');
    $('#location').textContent=r.location||'—';
    $('#expiresAt').textContent=fmtDate(r.expires_at);
    $('#requestStatus').textContent=(r.status||'sent').replaceAll('_',' ');
    $('#loadingState').hidden=true;
    $('#errorState').hidden=true;
    $('#requestPanel').hidden=false;
  }

  async function load(){
    ({id:requestId,signed:token}=linkParams());
    if(!requestId||!token){
      showError('Link incompleto.','Peça à HMATIAS um novo link de confirmação.');
      return;
    }
    if(!/^https?:\/\//i.test(apiBase())){
      showError('Confirmação ainda não disponível.','O ambiente Source AO não está ligado à API de confirmação.');
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
        $('#successState h2').textContent=r.status==='approved'?'Confirmação já revista.':'Resposta já recebida.';
        $('#successState p').textContent=r.status==='approved'
          ?'Este pedido já foi revisto pela HMATIAS.'
          :'A resposta deste pedido já foi registada e aguarda revisão da HMATIAS.';
      }
    }catch(error){
      if(error.message==='invalid_or_expired_link'||error.status===403){
        showError('Link expirado ou inválido.','Por segurança, os links de confirmação têm validade limitada. Peça um novo link à HMATIAS.');
      }else if(error.status===404){
        showError('Pedido não encontrado.','A referência não existe ou deixou de estar disponível.');
      }else{
        showError('Não foi possível carregar o pedido.','Verifique a ligação e tente abrir novamente o link recebido.');
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
    if(!selected){$('#formMessage').textContent='Selecione se a necessidade está disponível ou não.';return;}
    const price=numberOrNull($('#priceReported'));
    const currency=$('#currency').value.trim().toUpperCase();
    if(price!=null&&!/^[A-Z]{3}$/.test(currency)){
      $('#formMessage').textContent='Indique uma moeda de 3 letras para o preço, por exemplo AOA.';
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
    $('#formMessage').textContent='A enviar confirmação…';
    try{
      await api(requestPath(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      $('#confirmationForm').hidden=true;
      $('#successState').hidden=false;
      $('#formMessage').textContent='';
      token='';
      history.replaceState(null,'',location.pathname);
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(error){
      button.disabled=false;
      if(error.status===409){
        $('#confirmationForm').hidden=true;
        $('#successState').hidden=false;
        $('#successState h2').textContent='Resposta já registada.';
        $('#successState p').textContent='Este pedido já recebeu uma resposta ou foi revisto pela HMATIAS.';
      }else if(error.status===403){
        showError('Link expirado ou inválido.','Peça à HMATIAS um novo link de confirmação.');
      }else{
        $('#formMessage').textContent='Não foi possível enviar agora. A resposta não foi registada; tente novamente.';
      }
    }
  });

  document.addEventListener('DOMContentLoaded',load,{once:true});
})();
