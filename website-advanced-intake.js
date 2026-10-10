/* HMATIAS verified intake for Clean and Smart RFQ.
 * Runs only when the production backend explicitly advertises Turnstile-protected
 * storage. Otherwise existing WhatsApp/email handoffs remain unchanged.
 */
(()=>{
  'use strict';
  const form=document.getElementById('cleanQuoteForm')||document.getElementById('smartRfqForm');
  if(!form)return;
  const clean=form.id==='cleanQuoteForm';
  const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const say=(pt,english)=>en?english:pt;
  const api='https://source-ao-api.matias500-mhf.workers.dev/api/website-leads';
  const submit=form.querySelector('button[type="submit"]');
  if(!submit)return;
  const status=document.createElement('p');
  status.className='form-status';
  status.dataset.hmatiasAdvancedLeadStatus='true';
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.style.gridColumn='1/-1';
  status.style.margin='14px 0';
  let nonce=crypto.randomUUID(),widget=null,token='',busy=false;
  const cleanStatus=document.getElementById('clean-form-status');
  const rfqStatus=document.getElementById('rfqCopyStatus');
  function display(message){
    status.textContent=message;
    if(cleanStatus)cleanStatus.textContent='';
    status.hidden=!message;
  }
  function sourceAttribution(){
    // Non-personal campaign codes only; no full URLs or click IDs.
    const params=new URLSearchParams(location.search);
    const code=(key,max)=>{
      const value=String(params.get(key)||'').toLowerCase().trim();
      return value.length<=max&&/^[a-z0-9][a-z0-9_.-]*$/.test(value)?value:'';
    };
    return {
      source:code('utm_source',60),medium:code('utm_medium',60),
      campaign:code('utm_campaign',80),
      landing_path:location.pathname.length<=90?location.pathname:'',
      referrer_host:''
    };
  }
  function preparedPayload(message){
    const formData=new FormData(form);
    const field=name=>String(formData.get(name)||'').trim();
    const name=clean?field('name'):field('requester_name');
    const company=clean?field('clientType'):field('company');
    const phone=clean?field('phone'):field('phone');
    const email=clean?'':field('email');
    const locationField=clean?field('location'):field('location');
    const service=clean?'HMATIAS Clean':('Smart RFQ / '+field('service'));
    return {
      kind:'contact',nonce,consent:clean
        ?Boolean(form.querySelector('label.consent input[type="checkbox"]')?.checked)
        :Boolean(form.querySelector('[data-hmatias-advanced-consent] input')?.checked),
      website:'',turnstileToken:token,name,company,phone,email,
      service,location:locationField,details:message,
      attribution:sourceAttribution()
    };
  }
  function putFollowUp(reference){
    const previous=form.querySelector('[data-hmatias-server-followup]');
    previous?.remove();
    const link=document.createElement('a');
    link.dataset.hmatiasServerFollowup='true';
    link.className='btn btn-outline';
    link.textContent=say('Dar seguimento pelo WhatsApp','Follow up via WhatsApp');
    link.href='https://wa.me/244948806673?text='+encodeURIComponent(
      'HMATIAS '+(clean?'Clean':'Smart RFQ')+' — '+reference+
      '\n'+say('Pedido registado. Solicito acompanhamento comercial.','Request registered. I would like a commercial follow-up.')
    );
    link.target='_blank';link.rel='noopener noreferrer';
    status.insertAdjacentElement('afterend',link);
  }
  async function register(message){
    if(busy)return;
    const payload=preparedPayload(message);
    if(!token){
      display(say('Conclua primeiro a verificação de segurança. Pode utilizar WhatsApp ou e-mail como alternativa.',
        'Complete the security verification first, or use WhatsApp/email instead.'));
      if(clean)window.HMATIASFormOutcome?.present(form,message,say('Pedido HMATIAS Clean','HMATIAS Clean enquiry'));
      return;
    }
    if(!payload.consent){
      display(say('Autorize o tratamento dos dados antes de registar o pedido.','Please provide consent before registering the request.'));
      return;
    }
    if(message.length>2400){
      display(say('O pedido ultrapassa o limite do registo seguro. Envie o resumo completo pelo WhatsApp ou e-mail.',
        'This brief exceeds the secure intake limit. Send the full request using WhatsApp or email.'));
      if(clean)window.HMATIASFormOutcome?.present(form,message,say('Pedido HMATIAS Clean','HMATIAS Clean enquiry'));
      return;
    }
    busy=true;submit.disabled=true;
    display(say('A registar o pedido na HMATIAS…','Registering the request with HMATIAS…'));
    try{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      let response,body;
      try{
        response=await fetch(api,{
          method:'POST',headers:{'content-type':'application/json',accept:'application/json'},
          body:JSON.stringify(payload),cache:'no-store',signal:controller.signal
        });
        body=await response.json().catch(()=>null);
      }finally{clearTimeout(timer);}
      if(!response.ok||body?.saved!==true||!/^HM-\d{8}-[A-Z0-9]{8}$/.test(body.reference||''))
        throw Error('registration_not_confirmed');
      form.querySelector('[data-hmatias-form-outcome]')?.remove();
      display(say('Pedido registado na HMATIAS. Referência: '+body.reference+
        '. Guarde a referência. A notificação interna por e-mail poderá ainda estar pendente.',
        'Request saved with HMATIAS. Reference: '+body.reference+
        '. Keep this reference. Internal email notification may still be pending.'));
      putFollowUp(body.reference);
      nonce=crypto.randomUUID();
      window.hmatiasAnalytics?.confirmLead?.(clean?'clean_quote':'smart_rfq','website');
    }catch{
      display(say('Não foi possível confirmar o registo. O pedido NÃO está confirmado. Utilize um dos canais manuais abaixo.',
        'Registration could not be confirmed. The request is NOT confirmed. Please use a manual channel below.'));
      if(clean)window.HMATIASFormOutcome?.present(form,message,say('Pedido HMATIAS Clean','HMATIAS Clean enquiry'));
    }finally{
      token='';busy=false;submit.disabled=false;
      try{window.turnstile?.reset(widget);}catch{}
    }
  }
  async function start(){
    let config;
    try{
      const response=await fetch(api+'/config',{
        headers:{accept:'application/json'},cache:'no-store',
        signal:AbortSignal.timeout(7000)
      });
      if(!response.ok)return;
      config=await response.json();
      if(config?.enabled!==true||typeof config.turnstileSiteKey!=='string'||
         !/^[0-9A-Za-z_-]{8,180}$/.test(config.turnstileSiteKey))return;
    }catch{return;}
    let turnstile;
    try{
      if(!window.turnstile){
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async=true;script.onload=resolve;script.onerror=reject;
          document.head.appendChild(script);
        });
      }
      turnstile=window.turnstile;
      if(!turnstile)return;
    }catch{return;}

    if(!clean){
      const label=document.createElement('label');
      label.dataset.hmatiasAdvancedConsent='true';
      label.className='hmatias-lead-consent';
      label.style.display='flex';label.style.gap='10px';label.style.margin='12px 0';
      label.style.gridColumn='1/-1';
      const check=document.createElement('input');
      check.type='checkbox';check.required=true;
      const span=document.createElement('span');
      span.append(document.createTextNode(say(
        'Autorizo a HMATIAS a registar e tratar o meu pedido nos termos da ',
        'I authorise HMATIAS to register my request under the '
      )));
      const link=document.createElement('a');
      link.href=en?'privacy.html':'privacidade.html';
      link.textContent=say('Política de Privacidade','Privacy Policy');
      span.append(link,document.createTextNode(' *'));
      label.append(check,span);
      submit.insertAdjacentElement('beforebegin',label);
    }
    const challenge=document.createElement('div');
    challenge.className='hmatias-turnstile';
    challenge.style.gridColumn='1/-1';
    submit.insertAdjacentElement('beforebegin',challenge);
    try{
      widget=turnstile.render(challenge,{
        sitekey:config.turnstileSiteKey,
        callback:value=>{token=value;},
        'expired-callback':()=>{token='';},
        'error-callback':()=>{token='';}
      });
    }catch{challenge.remove();form.querySelector('[data-hmatias-advanced-consent]')?.remove();return;}

    // Only activate automatic registration after a successful capability check.
    submit.textContent=clean
      ?say('Registar pedido de cotação','Register quotation request')
      :say('Gerar e registar pedido RFQ','Build and register RFQ');
    status.hidden=true;
    if(clean){
      form.appendChild(status);
      form.addEventListener('hmatias:clean-quote-prepared',event=>{
        event.preventDefault();
        register(event.detail.message);
      });
    }else{
      rfqStatus?.insertAdjacentElement('afterend',status);
      form.addEventListener('hmatias:rfq-brief-ready',event=>register(event.detail.message));
      form.addEventListener('input',()=>{
        if(!busy){
          display('');
          form.querySelector('[data-hmatias-server-followup]')?.remove();
        }
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
