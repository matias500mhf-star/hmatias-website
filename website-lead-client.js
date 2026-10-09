/* HMATIAS website lead capture: opt-in via healthy backend capability.
 * Existing WhatsApp + manual email actions remain available when disabled.
 */
(()=>{
  'use strict';
  const base='https://source-ao-api.matias500-mhf.workers.dev';
  const endpoint=base+'/api/website-leads';
  const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  if(document.documentElement.dataset.hmatiasLeadsEndpoint)return; // legacy integration is separately gated
  const configs=[
    {id:'contactForm',kind:'contact',name:'nome',company:'empresa',phone:'telefone',
      email:'email',service:'servico',details:'mensagem'},
    {id:'businessContactForm',kind:'business',name:'client_name',phone:'contact',
      email:'email',service:'service_type',details:'details',location:'location'},
    {id:'bookingRequestForm',kind:'appointment',name:'client_name',phone:'contact',
      email:'email',service:'service_type',details:'notes',location:'location',
      date:'preferred_date',channel:'meeting_mode',window:'time_window'}
  ];
  const text=(pt,english)=>en?english:pt;
  // Campaign information is read only when the visitor submits a lead form.
  // No persistent tracking, ad click IDs, full URLs or search terms.
  function campaignAttribution(){
    const params=new URLSearchParams(window.location.search);
    const code=(key,max)=>{
      const value=String(params.get(key)||'').trim().toLowerCase();
      return value.length<=max&&/^[a-z0-9][a-z0-9_.-]*$/.test(value)?value:'';
    };
    const path=window.location.pathname||'/';
    const landing_path=new RegExp('^/(?:[a-z0-9-]+[.]html|source-ao/(?:index[.]html|rfq[.]html|opportunity-radar[.]html)?)?$').test(path)?path:'';
    let referrer_host='';
    try{
      const host=new URL(document.referrer).hostname.toLowerCase();
      if(host!=='comercialhmatiasps.com'&&host!=='www.comercialhmatiasps.com'&&
        host.length<=100&&/^[a-z0-9][a-z0-9_.-]*$/.test(host))referrer_host=host;
    }catch{}
    return {source:code('utm_source',60),medium:code('utm_medium',60),
      campaign:code('utm_campaign',80),landing_path,referrer_host};
  }
  function detail(form,config,fd){
    const get=key=>String(fd.get(key)||'').trim();
    const baseDetails=get(config.details);
    if(config.kind!=='appointment')return baseDetails;
    return [
      text('Pedido de atendimento.','Appointment request.'),
      get(config.date)&&text('Data preferida: ','Preferred date: ')+get(config.date),
      get(config.window)&&text('Período: ','Time window: ')+get(config.window),
      get(config.channel)&&text('Modalidade: ','Meeting format: ')+get(config.channel),
      baseDetails
    ].filter(Boolean).join('\n').slice(0,2400);
  }
  function notice(form){
    let p=form.querySelector('[data-hmatias-website-lead-status]');
    if(!p){
      p=document.createElement('p');
      p.dataset.hmatiasWebsiteLeadStatus='true';
      p.setAttribute('role','status');
      p.setAttribute('aria-live','polite');
      p.style.gridColumn='1 / -1';
      p.style.margin='10px 0';
      p.style.fontSize='.9rem';
      form.appendChild(p);
    }
    return p;
  }
  let turnstilePromise;
  function turnstileApi(){
    if(window.turnstile)return Promise.resolve(window.turnstile);
    if(!turnstilePromise)turnstilePromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;
      script.onload=()=>window.turnstile?resolve(window.turnstile):reject(Error('turnstile_unavailable'));
      script.onerror=()=>reject(Error('turnstile_unavailable'));
      document.head.appendChild(script);
    });
    return turnstilePromise;
  }
  function setup(form,config,siteKey,turnstile){
    if(form.dataset.hmatiasWebsiteIntake)return;
    form.dataset.hmatiasWebsiteIntake='true';
    const submit=form.querySelector('button[type="submit"]');
    if(!submit)return;
    const parent=submit.closest('.form-actions,.booking-actions')||submit.parentElement;
    const consent=document.createElement('label');
    consent.className='hmatias-lead-consent';
    consent.style.display='flex';
    consent.style.gap='10px';
    consent.style.alignItems='flex-start';
    consent.style.gridColumn='1 / -1';
    consent.style.fontSize='.86rem';
    consent.style.lineHeight='1.5';
    consent.style.margin='12px 0';
    const input=document.createElement('input');
    input.type='checkbox';input.required=true;input.name='website_lead_consent';
    input.style.marginTop='4px';
    const wording=document.createElement('span');
    wording.append(document.createTextNode(text(
      'Autorizo a HMATIAS a registar este pedido e a contactar-me, conforme a ',
      'I authorise HMATIAS to register this request and contact me as described in the '
    )));
    const policy=document.createElement('a');
    policy.href=en?'privacy.html':'privacidade.html';
    policy.textContent=text('Política de Privacidade','Privacy Policy');
    wording.append(policy,document.createTextNode(' *'));
    consent.append(input,wording);
    parent.insertAdjacentElement('beforebegin',consent);
    const status=notice(form);
    const verification=document.createElement('div');
    verification.className='hmatias-turnstile';
    verification.style.gridColumn='1 / -1';
    verification.style.margin='10px 0';
    parent.insertAdjacentElement('beforebegin',verification);
    let challengeToken='';
    const widget=turnstile.render(verification,{
      sitekey:siteKey,
      callback:value=>{challengeToken=value;},
      'expired-callback':()=>{challengeToken='';},
      'error-callback':()=>{challengeToken='';}
    });
    let nonce=crypto.randomUUID();
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      if(!form.reportValidity())return;
      if(!challengeToken){
        status.textContent=text('Conclua a verificação de segurança antes de enviar.','Complete the security check before submitting.');
        return;
      }
      const fd=new FormData(form);
      const get=key=>key?String(fd.get(key)||'').trim():'';
      const payload={
        kind:config.kind,nonce,consent:input.checked,website:'',turnstileToken:challengeToken,
        attribution:campaignAttribution(),
        name:get(config.name),company:get(config.company),phone:get(config.phone),
        email:get(config.email),service:get(config.service)||text('Contacto comercial','Business enquiry'),
        location:get(config.location)||'Luanda',
        details:detail(form,config,fd)
      };
      if(config.kind==='appointment')payload.preferred_date=get(config.date);
      submit.disabled=true;
      status.textContent=text('A registar o seu pedido…','Registering your request…');
      try{
        const abort=new AbortController();
        const timer=setTimeout(()=>abort.abort(),12000);
        let response;
        try{response=await fetch(endpoint,{
          method:'POST',headers:{'content-type':'application/json'},
          body:JSON.stringify(payload),cache:'no-store',signal:abort.signal
        });}finally{clearTimeout(timer);}
        const result=await response.json().catch(()=>null);
        if(!response.ok||result?.saved!==true||!/^HM-\d{8}-[A-Z0-9]{8}$/.test(result.reference||''))
          throw Error('save_not_confirmed');
        status.textContent=text(
          'Pedido registado na HMATIAS. Referência: '+result.reference+
          '. A equipa irá analisar o pedido. A notificação por e-mail pode ainda estar pendente.',
          'Request securely registered. Reference: '+result.reference+
          '. Our team will review it. Internal email notification may still be pending.'
        );
        nonce=crypto.randomUUID();
        // Consent-gated GA4 tracking receives no contact details or lead references.
        const leadTypes={contact:'general_quote',business:'business_services_request',appointment:'appointment_request'};
        window.hmatiasAnalytics?.confirmLead?.(leadTypes[config.kind]||'general_quote','website');
      }catch{
        status.textContent=text(
          'Não foi possível confirmar o registo. Envie o pedido pelo WhatsApp ou pela alternativa de e-mail disponível nesta página.',
          'Registration could not be confirmed. Please use WhatsApp or the manual email alternative on this page.'
        );
      }finally{
        challengeToken='';
        try{turnstile.reset(widget);}catch{}
        submit.disabled=false;
      }
    },true);
  }
  async function boot(){
    const available=configs.map(x=>({config:x,form:document.getElementById(x.id)}))
      .filter(x=>Boolean(x.form));
    if(!available.length)return;
    try{
      const response=await fetch(endpoint+'/config',{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(6500)});
      if(!response.ok)return;
      const data=await response.json();
      if(data?.enabled!==true||
        typeof data.turnstileSiteKey!=='string'||
        !/^[0-9A-Za-z_-]{8,180}$/.test(data.turnstileSiteKey))return;
      let verifier;
      try{verifier=await turnstileApi();}catch{return;}
      for(const item of available)setup(item.form,item.config,data.turnstileSiteKey,verifier);
    }catch{
      // The original WhatsApp/email flows are unaffected when the API is unavailable.
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
