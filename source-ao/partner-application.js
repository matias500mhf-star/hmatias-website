(()=>{
  'use strict';
  const form=document.getElementById('partnerForm');
  const status=document.getElementById('formStatus');
  const button=document.getElementById('submitPartner');
  const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const values=()=>[...document.querySelectorAll('#capabilities input:checked')].map(x=>x.value);
  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');
  const message=(text,type='')=>{status.textContent=text;status.className='status '+type};
  const track=(eventName,parameters={})=>window.hmatiasAnalytics?.track?.(eventName,parameters);

  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    const capabilities=values();
    if(!capabilities.length){message(en?'Select at least one commercial capability.':'Selecione pelo menos uma capacidade comercial.','error');return}
    const data=new FormData(form);
    if(!data.get('email')&&!data.get('whatsapp')){message(en?'Provide an email address or WhatsApp number for contact.':'Indique um email ou WhatsApp para contacto.','error');return}
    if(!apiBase()){message(en?'The application service is temporarily unavailable.':'O serviço de candidatura está temporariamente indisponível.','error');return}
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
      capabilities,
      sectors:[]
    };
    button.disabled=true;
    message(en?'Submitting application…':'A submeter candidatura…');
    try{
      const res=await fetch(apiBase()+'/api/partner-applications',{
        method:'POST',
        headers:{'content-type':'application/json','accept':'application/json'},
        body:JSON.stringify(payload)
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(en?'The application could not be submitted. Please try again later.':'Não foi possível submeter a candidatura. Tente novamente mais tarde.');
      const ref=body.reference||'';
      message((body.duplicate?(en?'This application is already registered. ':'A candidatura já se encontra registada. '):(en?'Application registered on the platform. ':'Candidatura registada na plataforma. '))+(ref?(en?'Reference: ':'Referência: ')+ref+'. ':'')+(en?'Assessment and contact confirmation depend on follow-up by the commercial team. This application does not constitute partnership approval.':'A avaliação e a confirmação de contacto dependem de acompanhamento pela equipa comercial. A candidatura não constitui aprovação da parceria.'),'ok');
      track(body.duplicate?'partner_application_duplicate':'partner_application_registered',{
        partner_type:String(data.get('partner_type')||'unknown'),
        country_code:String(data.get('country_code')||'unknown'),
        capability_count:capabilities.length
      });
      if(!body.duplicate)form.reset();
    }catch(error){
      message(error instanceof Error?error.message:(en?'The application could not be submitted.':'Não foi possível submeter a candidatura.'),'error');
    }finally{button.disabled=false}
  });
})();
