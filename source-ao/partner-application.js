(()=>{
  'use strict';
  const form=document.getElementById('partnerForm');
  const status=document.getElementById('formStatus');
  const button=document.getElementById('submitPartner');
  if(!form||!status||!button)return;

  const english=document.documentElement.lang==='en';
  const copy={
    pt:{
      capabilities:'Selecione pelo menos uma capacidade comercial.',
      contact:'Indique um email ou WhatsApp para contacto.',
      offline:'A submissão online está indisponível nesta pré-visualização.',
      submitting:'A submeter candidatura…',
      duplicate:'Esta candidatura já se encontra registada.',
      registered:'Candidatura registada na plataforma.',
      followup:'A avaliação e a confirmação de contacto dependem de acompanhamento pela equipa comercial. O registo não representa aprovação da parceria.',
      failed:'Não foi possível submeter a candidatura. Tente novamente mais tarde ou contacte a HMATIAS.',
      reference:'Referência'
    },
    en:{
      capabilities:'Select at least one business capability.',
      contact:'Provide an email address or WhatsApp number.',
      offline:'Online submission is disabled in this preview.',
      submitting:'Submitting application…',
      duplicate:'This application is already registered.',
      registered:'Application registered on the platform.',
      followup:'Assessment and contact confirmation require follow-up by the commercial team. Registration is not partnership approval.',
      failed:'The application could not be submitted. Please try again later or contact HMATIAS.',
      reference:'Reference'
    }
  }[english?'en':'pt'];

  const values=()=>[...document.querySelectorAll('#capabilities input:checked')].map(x=>x.value);
  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');
  const message=(text,type='')=>{status.textContent=text;status.className='status '+type};
  const track=(eventName,parameters={})=>window.hmatiasAnalytics?.track?.(eventName,parameters);

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const capabilities=values();
    if(!capabilities.length){message(copy.capabilities,'error');return}
    const data=new FormData(form);
    if(!String(data.get('email')||'').trim()&&!String(data.get('whatsapp')||'').trim()){
      message(copy.contact,'error');return;
    }
    if(!apiBase()){message(copy.offline,'error');return}
    const consent=document.getElementById('confirmAccuracy')?.checked===true;
    if(!consent){message(english?'Privacy consent is required.':'É necessário aceitar a Política de Privacidade.','error');return}

    const payload={
      company_name:data.get('company_name'),
      registration_number:data.get('registration_number'),
      partner_type:data.get('partner_type'),
      country_code:data.get('country_code'),
      locality:data.get('locality'),
      website:data.get('website'),
      contact_name:data.get('contact_name'),
      contact_role:data.get('contact_role'),
      email:data.get('email'),
      whatsapp:data.get('whatsapp'),
      portfolio_url:data.get('portfolio_url'),
      note:data.get('note'),
      privacy_consent:consent,
      capabilities,
      sectors:[]
    };
    button.disabled=true;
    message(copy.submitting);
    try{
      const res=await fetch(apiBase()+'/api/partner-applications',{
        method:'POST',
        headers:{'content-type':'application/json','accept':'application/json'},
        body:JSON.stringify(payload),
        cache:'no-store'
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok){
        const error=new Error(body?.error?.message||copy.failed);
        error.code=body?.error?.code||'submission_failed';
        throw error;
      }
      if(body?.ok!==true||!body.reference)throw new Error(copy.failed);
      const ref=body.reference;
      const prefix=body.duplicate?copy.duplicate:copy.registered;
      message(prefix+' '+copy.reference+': '+ref+'. '+copy.followup,'ok');
      track(body.duplicate?'partner_application_duplicate':'partner_application_registered',{
        partner_type:String(data.get('partner_type')||'unknown'),
        country_code:String(data.get('country_code')||'unknown'),
        capability_count:capabilities.length
      });
      if(!body.duplicate)form.reset();
    }catch(error){
      const validation={
        registration_required:english?'Company registration number is required.':'O NIF ou registo comercial é obrigatório.',
        contact_required:copy.contact,
        capabilities_required:copy.capabilities,
        privacy_consent_required:english?'Privacy consent is required.':'É necessário aceitar a Política de Privacidade.',
        email_invalid:english?'Enter a valid email address.':'Indique um email válido.',
        privacy_key_unavailable:english?'Secure application intake is temporarily unavailable.':'O registo seguro de candidaturas está temporariamente indisponível.'
      };
      message(validation[error?.code]||(error instanceof TypeError?copy.failed:(error?.message||copy.failed)),'error');
    }finally{
      button.disabled=false;
    }
  });
})();
