/* Optional CRM-ready lead intake for existing HMATIAS forms.
 * Not loaded until html[data-hmatias-leads-endpoint][data-hmatias-turnstile-site-key]
 * are configured after Worker/D1 production testing. Existing WhatsApp flows stay unchanged.
 */
(()=>{
'use strict';
const endpoint=document.documentElement.dataset.hmatiasLeadsEndpoint||'';
const siteKey=document.documentElement.dataset.hmatiasTurnstileSiteKey||'';
if(!/^https:\/\//.test(endpoint)||!siteKey)return;
const en=(document.documentElement.lang||'').startsWith('en');
const forms=['contactForm','businessContactForm','bookingRequestForm'];
function msg(form,text){let node=form.querySelector('[data-hmatias-lead-status]');if(!node){node=document.createElement('p');node.dataset.hmatiasLeadStatus='true';node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.className='form-status';form.appendChild(node)}node.textContent=text;return node;}
function get(d,k){return String(d.get(k)||'').trim();}
function encodeForm(form){
 const d=new FormData(form);const id=form.id;
 const base={nonce:form.dataset.leadNonce||(form.dataset.leadNonce=crypto.randomUUID().replaceAll('-','')),consent:true};
 if(id==='contactForm')return {...base,kind:'contact',name:get(d,'nome'),company:get(d,'empresa'),email:get(d,'email'),phone:get(d,'telefone'),service:get(d,'servico')||'Contacto comercial',location:'',details:get(d,'mensagem')};
 if(id==='businessContactForm')return {...base,kind:'business',name:get(d,'client_name'),company:'',email:get(d,'email'),phone:get(d,'contact'),service:get(d,'service_type'),location:get(d,'location'),details:get(d,'details')};
 const details=[get(d,'notes'),get(d,'preferred_date')&&'Data: '+get(d,'preferred_date'),get(d,'time_window')&&'Período: '+get(d,'time_window'),get(d,'meeting_mode')&&'Modalidade: '+get(d,'meeting_mode')].filter(Boolean).join('\n');
 return {...base,kind:'appointment',name:get(d,'client_name'),company:'',email:get(d,'email'),phone:get(d,'contact'),service:get(d,'service_type')||'Atendimento',location:get(d,'location'),details:'Pedido de atendimento. '+details};
}
function manualLink(node,payload,reference=''){
 const old=node.parentNode?.querySelector('[data-hmatias-fallback]');if(old)old.remove();
 const text=(reference?'Referência: '+reference+'\n':'')+
  'HMATIAS - Pedido '+payload.kind+'\nNome: '+payload.name+'\nTelefone: '+payload.phone+'\nEmail: '+payload.email+
  '\nServiço: '+payload.service+'\nDetalhes: '+payload.details;
 const a=document.createElement('a');a.href='https://wa.me/244948806673?text='+encodeURIComponent(text.slice(0,3400));
 a.target='_blank';a.rel='noopener noreferrer';
 a.textContent=en?'Continue via WhatsApp':'Continuar pelo WhatsApp';
 a.className='btn btn-outline';a.dataset.hmatiasFallback='true';a.style.marginTop='12px';node.insertAdjacentElement('afterend',a);
}
function addConsent(form){
 if(form.querySelector('input[name="privacy_consent"]'))return;
 const div=document.createElement('label');div.className='hmatias-lead-privacy';div.style.display='flex';div.style.gridColumn='1/-1';div.style.gap='10px';div.style.alignItems='flex-start';div.style.margin='14px 0';div.style.fontSize='.84rem';div.style.lineHeight='1.6';
 const input=document.createElement('input');input.type='checkbox';input.name='privacy_consent';input.required=true;input.style.marginTop='4px';input.style.flexShrink='0';
 const span=document.createElement('span');
 const a=document.createElement('a');a.href=en?'privacy.html':'privacidade.html';a.textContent=en?'Privacy Policy':'Política de Privacidade';
 span.append(document.createTextNode(en?'I authorise HMATIAS to store my request and contact me, as described in the ':'Autorizo a HMATIAS a registar o pedido e contactar-me, nos termos da '),a,document.createTextNode(' *'));
 div.append(input,span);
 const submit=form.querySelector('button[type="submit"]');
 if(submit)submit.parentNode.insertBefore(div,submit);else form.appendChild(div);
}
function turnstileLoad(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 return new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
  s.onload=()=>window.turnstile?resolve(window.turnstile):reject(new Error('unavailable'));
  s.onerror=()=>reject(new Error('unavailable'));document.head.appendChild(s);
 });
}
for(const id of forms){
 const form=document.getElementById(id);if(!form)continue;
 addConsent(form);
 const emailField=form.querySelector('input[name="email"]');
 if(emailField)emailField.required=true; // mandatory to create CRM contact and send receipt when enabled
 const oldNote=form.querySelector('.form-note,.form-privacy-note,.booking-smallprint');
 if(oldNote)oldNote.textContent=en?'When enabled, the request is first registered in HMATIAS systems. WhatsApp remains an optional additional contact channel.':'Quando ativado, o pedido é primeiro registado nos sistemas da HMATIAS. O WhatsApp mantém-se como canal complementar.';

 const root=document.createElement('div');root.className='hmatias-lead-verification';root.style.margin='12px 0';root.style.gridColumn='1/-1';
 const submit=form.querySelector('button[type="submit"]');
 const actionGroup=submit?.closest('.form-actions,.booking-actions');
 if(actionGroup)actionGroup.parentNode.insertBefore(root,actionGroup);
 else if(submit)submit.parentNode.insertBefore(root,submit);
 else form.appendChild(root);
 let token='',widget=null;
 turnstileLoad().then(t=>{widget=t.render(root,{sitekey:siteKey,callback:value=>{token=value},'expired-callback':()=>{token=''},'error-callback':()=>{token=''}})}).catch(()=>msg(form,en?'Verification could not load. Please use WhatsApp.':'Não foi possível carregar a verificação. Utilize o WhatsApp.'));
 form.addEventListener('submit',async event=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(!form.reportValidity())return;
  if(!token){msg(form,en?'Complete the security check before sending.':'Conclua a verificação de segurança antes de enviar.');return;}
  const payload={...encodeForm(form),turnstileToken:token};
  if(payload.details.length>2400){msg(form,en?'Request details are too long.':'A descrição do pedido é demasiado longa.');return;}
  if(submit)submit.disabled=true;
  msg(form,en?'Registering your request securely…':'A registar o pedido em segurança…');
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);let response;
    try{response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:ctl.signal})}
    finally{clearTimeout(timer)}
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.saved!==true||!/^HM-[0-9]{8}-[A-Z0-9]+$/.test(String(data.reference||'')))throw new Error('not_saved');
    const box=msg(form,(en?'Request registered. Reference: ':'Pedido registado. Referência: ')+data.reference+(en?'. HMATIAS will review and contact you.':'. A equipa HMATIAS irá analisar e responder pelo contacto indicado.'));
    manualLink(box,payload,data.reference);
    form.dataset.leadNonce='';
  }catch(_){
    const box=msg(form,en?'Automatic registration could not be confirmed. Your request has not been confirmed as received. Please send it via WhatsApp.':'Não foi possível confirmar o registo automático. O pedido não está confirmado como recebido. Envie pelo WhatsApp.');
    manualLink(box,payload);
  }finally{
    token='';if(window.turnstile&&widget!==null)window.turnstile.reset(widget);
    if(submit)submit.disabled=false;
  }
 },true);
}
})();
