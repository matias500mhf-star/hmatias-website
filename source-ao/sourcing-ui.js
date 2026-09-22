(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  let privateTrackingUrl='';

  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');
  const isPt=()=>document.documentElement.lang.toLowerCase().startsWith('pt');

  function injectFields(){
    const form=$('#requestForm');
    if(!form||$('#requestContact')) return;
    const contact=document.createElement('input');
    contact.id='requestContact';
    contact.type='text';
    contact.autocomplete='email';
    contact.required=true;
    contact.maxLength=180;
    contact.placeholder=isPt()?'WhatsApp, telefone ou e-mail':'WhatsApp, phone or email';
    contact.setAttribute('aria-label','Contact');
    const button=form.querySelector('button[type="submit"]');
    form.insertBefore(contact,button);

    const feedback=document.createElement('div');
    feedback.id='requestFeedback';
    feedback.className='request-feedback';
    feedback.hidden=true;
    form.after(feedback);
  }

  function syncLanguage(){
    const contact=$('#requestContact');
    if(contact) contact.placeholder=isPt()?'WhatsApp, telefone ou e-mail':'WhatsApp, phone or email';
  }

  function whatsappFallback(item,detail,location){
    const message=isPt()
      ?`Olá, HMATIAS. Vim pelo Source AO e preciso de sourcing.\nItem/serviço: ${item}\nQuantidade/especificação: ${detail||'A confirmar'}\nLocal: ${location}\nPretendo validação de fornecedor, disponibilidade e cotação.`
      :`Hello, HMATIAS. I came through Source AO and need sourcing support.\nItem/service: ${item}\nQuantity/specification: ${detail||'To confirm'}\nLocation: ${location}\nI need supplier, availability and quotation validation.`;
    window.open('https://wa.me/244948806673?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
  }

  function trackingUrl(statusPath){
    if(!statusPath) return '';
    const endpoint=new URL(statusPath,apiBase()+'/');
    const requestId=endpoint.pathname.split('/').filter(Boolean).pop()||'';
    const token=endpoint.searchParams.get('token')||'';
    if(!requestId||!token) return '';
    const url=new URL('track.html',location.href);
    url.search='';
    url.hash=`id=${encodeURIComponent(requestId)}&token=${encodeURIComponent(token)}`;
    return url.toString();
  }

  function showRegistered(reference,url){
    const box=$('#requestFeedback');
    box.hidden=false;
    box.innerHTML='';
    const strong=document.createElement('strong');
    strong.textContent=isPt()?`Pedido registado · ${reference}`:`Request registered · ${reference}`;
    const text=document.createElement('p');
    text.textContent=isPt()
      ?'Guarde o link privado para acompanhar o estado. O contacto enviado fica protegido no backend.'
      :'Keep the private link to track progress. Your submitted contact is protected in the backend.';
    const actions=document.createElement('div');
    actions.className='request-feedback-actions';
    const copy=document.createElement('button');
    copy.type='button';
    copy.className='btn btn-outline btn-small';
    copy.textContent=isPt()?'Copiar link privado':'Copy private link';
    copy.addEventListener('click',async()=>{
      if(!privateTrackingUrl) return;
      try{await navigator.clipboard.writeText(privateTrackingUrl);copy.textContent=isPt()?'Copiado':'Copied';setTimeout(()=>copy.textContent=isPt()?'Copiar link privado':'Copy private link',1300);}catch{location.href=privateTrackingUrl;}
    });
    const open=document.createElement('a');
    open.className='btn btn-light btn-small';
    open.href=url;
    open.textContent=isPt()?'Acompanhar pedido':'Track request';
    actions.append(copy,open);
    box.append(strong,text,actions);
  }

  function showFallback(){
    const box=$('#requestFeedback');
    box.hidden=false;
    box.innerHTML='';
    const strong=document.createElement('strong');
    strong.textContent=isPt()?'Backend indisponível — abriu o WhatsApp':'Backend unavailable — WhatsApp opened';
    const p=document.createElement('p');
    p.textContent=isPt()
      ?'O pedido não foi gravado na base do Source AO. Envie a mensagem no WhatsApp para a HMATIAS dar seguimento.'
      :'The request was not stored in Source AO. Send the WhatsApp message so HMATIAS can continue the sourcing process.';
    box.append(strong,p);
  }

  async function submitPersistent(event){
    event.preventDefault();
    event.stopImmediatePropagation();
    const item=$('#requestItem')?.value.trim()||'';
    const detail=$('#requestQty')?.value.trim()||'';
    const locationValue=$('#requestLocation')?.value.trim()||'Luanda';
    const contact=$('#requestContact')?.value.trim()||'';
    if(!item||contact.length<5) return;
    const button=$('#requestForm button[type="submit"]');
    button.disabled=true;
    const old=button.textContent;
    button.textContent=isPt()?'A registar…':'Registering…';
    privateTrackingUrl='';

    if(/^https?:\/\//i.test(apiBase())){
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),9000);
      try{
        const response=await fetch(apiBase()+'/api/sourcing-requests',{
          method:'POST',
          cache:'no-store',
          signal:controller.signal,
          headers:{'content-type':'application/json','accept':'application/json'},
          body:JSON.stringify({
            requirement_text:item,
            specification:detail||null,
            location:locationValue,
            requester_contact:contact
          })
        });
        const payload=await response.json().catch(()=>null);
        if(!response.ok||!payload?.request?.reference) throw new Error(payload?.error?.code||`http_${response.status}`);
        privateTrackingUrl=trackingUrl(payload.request.status_path);
        if(!privateTrackingUrl) throw new Error('invalid_tracking_path');
        showRegistered(payload.request.reference,privateTrackingUrl);
        $('#requestForm').reset();
        $('#requestLocation').value=locationValue;
        clearTimeout(timeout);
        button.disabled=false;
        button.textContent=old;
        return;
      }catch(error){
        clearTimeout(timeout);
      }
    }

    whatsappFallback(item,detail,locationValue);
    showFallback();
    button.disabled=false;
    button.textContent=old;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectFields();
    const form=$('#requestForm');
    form?.addEventListener('submit',submitPersistent,true);
    $('#langToggle')?.addEventListener('click',()=>setTimeout(syncLanguage,0));
  },{once:true});

  window.addEventListener('pagehide',()=>{privateTrackingUrl='';});
})();
