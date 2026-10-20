(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const stages=['received','triage','sourcing','verifying','verified','quoted','awarded','purchased','delivered','completed'];
  let requestId='';
  let token='';
  let lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'pt';
  let currentRequest=null;
  let currentError=null;
  const copy=(pt,en)=>lang==='en'?en:pt;

  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');

  function readLink(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')||'');
    const query=new URLSearchParams(location.search);
    const id=hash.get('id')||query.get('id')||'';
    const access=hash.get('token')||query.get('token')||'';
    if(location.search&&id&&access){
      const keepLang=query.get('lang');
      history.replaceState(null,'',location.pathname+(keepLang?'?lang='+encodeURIComponent(keepLang):'')+'#id='+encodeURIComponent(id)+'&token='+encodeURIComponent(access));
    }
    return {id,access};
  }

  function fmtDate(value){
    if(!value) return '—';
    try{return new Intl.DateTimeFormat(lang==='en'?'en-GB':'pt-AO',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Luanda'}).format(new Date(value));}catch{return value;}
  }

  function showError(ptTitle,ptMessage,enTitle, enMessage){
    currentError={ptTitle,ptMessage,enTitle,enMessage};
    $('#loadingState').hidden=true;
    $('#requestPanel').hidden=true;
    $('#errorTitle').textContent=copy(ptTitle,enTitle);
    $('#errorMessage').textContent=copy(ptMessage,enMessage);
    $('#errorState').hidden=false;
  }

  function applyLanguage(){
    document.documentElement.lang=lang==='en'?'en':'pt-AO';
    document.title=copy('Source AO — Acompanhar pedido','Source AO — Track request');
    document.querySelectorAll('[data-en]').forEach(node=>{
      if(!node.dataset.pt)node.dataset.pt=node.textContent;
      node.textContent=lang==='en'?node.dataset.en:node.dataset.pt;
    });
    $('#langToggle').textContent=lang==='en'?'PT':'EN';
    $('#langToggle').setAttribute('aria-label',lang==='en'?'Switch to Portuguese':'Mudar para EN — English');
    $('#homeLink').href=lang==='en'?'index.html?lang=en':'index.html?lang=pt';
    const url=new URL(location.href);url.searchParams.set('lang',lang==='en'?'en':'pt');
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    if(currentRequest)render(currentRequest);
    if(currentError)showError(currentError.ptTitle,currentError.ptMessage,currentError.enTitle,currentError.enMessage);
  }

  function renderTimeline(status){
    const currentIndex=stages.indexOf(status);
    document.querySelectorAll('#timeline li').forEach((li,index)=>{
      li.classList.toggle('complete',currentIndex>=0&&index<currentIndex);
      li.classList.toggle('current',currentIndex>=0&&index===currentIndex);
    });
    if(status==='closed'){
      document.querySelectorAll('#timeline li').forEach(li=>li.classList.remove('current'));
    }
  }

  function render(r){
    currentRequest=r;
    $('#publicRef').textContent=r.reference||'—';
    $('#requirement').textContent=r.requirement_text||'—';
    const labels=lang==='en'?{received:'Received',triage:'Under review',sourcing:'Sourcing',verifying:'Verifying',verified:'Verified',quoted:'Quotation prepared',awarded:'Awarded',purchased:'Being purchased',delivered:'Delivered',completed:'Completed',closed:'Closed'}:{received:'Recebido',triage:'Em qualificação',sourcing:'Em sourcing',verifying:'Em verificação',verified:'Verificado',quoted:'Proposta preparada',awarded:'Adjudicado',purchased:'Em aquisição',delivered:'Entregue',completed:'Concluído',closed:'Encerrado'};
    $('#statusBadge').textContent=labels[r.status]||r.status||copy('Recebido','Received');
    $('#updatedAt').textContent=copy('Atualizado ','Updated ')+fmtDate(r.updated_at);
    $('#category').textContent=r.category||copy('A classificar','Unclassified');
    $('#specification').textContent=r.specification||copy('A confirmar','To be confirmed');
    $('#quantity').textContent=r.quantity==null?copy('A confirmar','To be confirmed'):[r.quantity,r.unit].filter(Boolean).join(' ');
    $('#location').textContent=r.location||'—';
    $('#neededBy').textContent=r.needed_by||copy('Não indicada','Not specified');
    $('#createdAt').textContent=fmtDate(r.created_at);
    $('#trackedItemList').replaceChildren();
    $('#trackedItems').hidden=!r.items?.length;
    for(const item of r.items||[]){const li=document.createElement('li');li.textContent=`${item.quantity} ${item.unit} · ${item.description}${item.specification?' — '+item.specification:''}`;$('#trackedItemList').append(li);}
    renderTimeline(r.status||'received');
    $('#loadingState').hidden=true;
    $('#errorState').hidden=true;
    $('#requestPanel').hidden=false;
  }

  async function load(){
    const link=readLink();
    requestId=link.id;
    token=link.access;
    if(!requestId||!token){
      showError('Link incompleto.','Use o link privado recebido quando o pedido foi registado.','Incomplete link.','Use the private link supplied when the request was registered.');
      return;
    }
    if(!/^https?:\/\//i.test(apiBase())){
      showError('Tracking ainda não disponível.','O ambiente Source AO ainda não está ligado ao backend.','Tracking is not available yet.','The Source AO environment is not connected to the backend.');
      return;
    }
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(apiBase()+'/api/sourcing-requests/'+encodeURIComponent(requestId)+'?token='+encodeURIComponent(token),{
        cache:'no-store',signal:controller.signal,headers:{accept:'application/json'}
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok){
        if(response.status===403||response.status===401) throw Object.assign(new Error('invalid_token'),{status:response.status});
        if(response.status===404) throw Object.assign(new Error('not_found'),{status:404});
        throw Object.assign(new Error('request_failed'),{status:response.status});
      }
      if(!payload?.request) throw new Error('invalid_response');
      render(payload.request);
    }catch(error){
      if(error.status===403||error.status===401) showError('Link privado inválido.','A chave deste endereço não corresponde ao pedido.','Invalid private link.','The key in this address does not match the request.');
      else if(error.status===404) showError('Pedido não encontrado.','A referência não existe ou deixou de estar disponível.','Request not found.','The reference does not exist or is no longer available.');
      else showError('Não foi possível carregar o pedido.','Verifique a ligação e tente novamente.','Could not load the request.','Check your connection and try again.');
    }finally{clearTimeout(timeout);}
  }

  window.addEventListener('pagehide',()=>{requestId='';token='';});
  document.addEventListener('DOMContentLoaded',()=>{
    applyLanguage();
    $('#langToggle')?.addEventListener('click',()=>{lang=lang==='en'?'pt':'en';applyLanguage();});
    load();
  },{once:true});
})();
