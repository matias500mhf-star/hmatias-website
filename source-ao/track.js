(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const stages=['received','triage','sourcing','verifying','verified','quoted','completed'];
  let requestId='';
  let token='';

  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');

  function readLink(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')||'');
    const query=new URLSearchParams(location.search);
    const id=hash.get('id')||query.get('id')||'';
    const access=hash.get('token')||query.get('token')||'';
    if(location.search&&id&&access){
      history.replaceState(null,'',location.pathname+'#id='+encodeURIComponent(id)+'&token='+encodeURIComponent(access));
    }
    return {id,access};
  }

  function fmtDate(value){
    if(!value) return '—';
    try{return new Intl.DateTimeFormat('pt-AO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return value;}
  }

  function showError(title,message){
    $('#loadingState').hidden=true;
    $('#requestPanel').hidden=true;
    $('#errorTitle').textContent=title;
    $('#errorMessage').textContent=message;
    $('#errorState').hidden=false;
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
    $('#publicRef').textContent=r.reference||'—';
    $('#requirement').textContent=r.requirement_text||'—';
    $('#statusBadge').textContent=(r.status||'received').replaceAll('_',' ');
    $('#updatedAt').textContent='Atualizado '+fmtDate(r.updated_at);
    $('#category').textContent=r.category||'A classificar';
    $('#specification').textContent=r.specification||'A confirmar';
    $('#quantity').textContent=r.quantity==null?'A confirmar':[r.quantity,r.unit].filter(Boolean).join(' ');
    $('#location').textContent=r.location||'—';
    $('#neededBy').textContent=r.needed_by||'Não indicada';
    $('#createdAt').textContent=fmtDate(r.created_at);
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
      showError('Link incompleto.','Use o link privado recebido quando o pedido foi registado.');
      return;
    }
    if(!/^https?:\/\//i.test(apiBase())){
      showError('Tracking ainda não disponível.','O ambiente Source AO ainda não está ligado ao backend.');
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
      if(error.status===403||error.status===401) showError('Link privado inválido.','A chave deste endereço não corresponde ao pedido.');
      else if(error.status===404) showError('Pedido não encontrado.','A referência não existe ou deixou de estar disponível.');
      else showError('Não foi possível carregar o pedido.','Verifique a ligação e tente novamente.');
    }finally{clearTimeout(timeout);}
  }

  window.addEventListener('pagehide',()=>{requestId='';token='';});
  document.addEventListener('DOMContentLoaded',load,{once:true});
})();
