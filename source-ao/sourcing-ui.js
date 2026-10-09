/* Source AO — structured quick RFQ with confirmed storage and explicit manual handoff. */
(()=>{
'use strict';
const $=selector=>document.querySelector(selector);
const isPt=()=>document.documentElement.lang.toLowerCase().startsWith('pt');
const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');
const copy=(pt,en)=>isPt()?pt:en;
let trackingUrl='';
function syncLanguage(){
  document.querySelectorAll('[data-request-pt][data-request-en]').forEach(node=>{
    node.textContent=isPt()?node.dataset.requestPt:node.dataset.requestEn;
  });
  const note=$('#requestDisclosure');
  if(note)note.textContent=copy(
    'O pedido só fica registado quando aparece uma referência. O registo não confirma stock, preço, notificação à equipa ou proposta.',
    'The request is stored only when a reference appears. This does not confirm stock, pricing, team notification or a quotation.');
  const contact=$('#requestContact');
  if(contact)contact.placeholder=copy('+244 … ou email@empresa.com','+244 … or company@email.com');
}
function showResult(title,body){
  let box=$('#requestFeedback');
  if(!box){
    box=document.createElement('div');box.id='requestFeedback';box.className='request-feedback';
    box.setAttribute('role','status');box.setAttribute('aria-live','polite');
    $('#requestForm')?.after(box);
  }
  box.hidden=false;box.replaceChildren();
  const strong=document.createElement('strong');strong.textContent=title;
  const p=document.createElement('p');p.textContent=body;
  box.append(strong,p);return box;
}
function addAction(box,label,url,asButton=false){
  const link=document.createElement('a');link.href=url;link.target=url.startsWith('https://wa.me/')?'_blank':'_self';
  link.rel='noopener noreferrer';link.textContent=label;
  link.className=asButton?'btn btn-primary btn-small':'btn btn-outline btn-small';
  link.style.margin='8px 9px 0 0';box.append(link);
}
function message(item,quantity,unit,spec,location,urgency,ref=''){
  return [
    copy('Boa tarde. Solicito sourcing via Source AO / HMATIAS.','Hello. I would like to request sourcing from Source AO / HMATIAS.'),
    ref?'Referência / Reference: '+ref:'',
    copy('Material / serviço: ','Material / service: ')+item,
    copy('Quantidade: ','Quantity: ')+(quantity||copy('A confirmar','To confirm')),
    copy('Unidade: ','Unit: ')+(unit||copy('A confirmar','To confirm')),
    copy('Local: ','Location: ')+location,
    copy('Prioridade: ','Priority: ')+(urgency||copy('Normal','Normal')),
    copy('Especificação: ','Specification: ')+(spec||copy('A confirmar','To confirm')),
    copy('Peço validação de fornecedor, disponibilidade e condições comerciais.','Please confirm a suitable supplier, availability and commercial terms.')
  ].filter(Boolean).join('\n');
}
function privateUrl(statusPath){
  if(!statusPath||!/^https:\/\//i.test(apiBase()))return '';
  const endpoint=new URL(statusPath,apiBase()+'/');
  if(endpoint.origin!==new URL(apiBase()).origin)return '';
  const id=endpoint.pathname.match(/^\/api\/sourcing-requests\/(sr_[a-z0-9-]+)$/i)?.[1];
  const token=endpoint.searchParams.get('token')||'';
  if(!id||!token)return '';
  const result=new URL('track.html',location.href);
  result.hash=new URLSearchParams({id,token}).toString();return result.href;
}
async function onSubmit(event){
  event.preventDefault();event.stopImmediatePropagation();
  const form=$('#requestForm');if(!form?.reportValidity())return;
  const item=$('#requestItem').value.trim(),qtyText=$('#requestQty').value.trim();
  const quantity=qtyText===''?null:Number(qtyText);
  const unit=$('#requestUnit').value||'',spec=$('#requestSpec').value.trim();
  const loc=$('#requestLocation').value.trim(),urgency=$('#requestUrgency').value||'';
  const contact=$('#requestContact').value.trim();
  if(!item||!loc||contact.length<5||!$('#requestConsent').checked){
    showResult(copy('Preencha o pedido.','Please complete the form.'),copy('Contacto válido e consentimento são necessários.','A valid contact and consent are required.'));return;
  }
  if(quantity!==null&&(!Number.isFinite(quantity)||quantity<=0)){
    showResult(copy('Quantidade inválida.','Invalid quantity.'),copy('Introduza uma quantidade positiva ou deixe em branco.','Enter a positive quantity or leave this blank.'));return;
  }
  const button=form.querySelector('button[type="submit"]'),original=button.textContent;
  button.disabled=true;button.textContent=copy('A registar…','Registering…');
  const data={requirement_text:item,quantity,unit:unit||null,specification:spec||null,
    needed_by:urgency||null,location:loc,requester_contact:contact,
    contact_channel:contact.includes('@')?'email':'whatsapp',consent:true};
  const handoff=(ref='')=>'https://wa.me/244948806673?text='+encodeURIComponent(message(item,qtyText,unit,spec,loc,urgency,ref));
  try{
    if(!/^https:\/\//i.test(apiBase()))throw new Error('api_unavailable');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),11000);
    let response,body;
    try{
      response=await fetch(apiBase()+'/api/sourcing-requests',{method:'POST',cache:'no-store',
        signal:controller.signal,headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(data)});
      body=await response.json();
    }finally{clearTimeout(timeout)}
    if(!response.ok||body?.ok!==true||!body.request?.reference)throw new Error(body?.error?.code||'not_saved');
    trackingUrl=privateUrl(body.request.status_path);
    const box=showResult(copy('Pedido guardado na plataforma: ','Request stored on the platform: ')+body.request.reference,
      copy('O registo não comprova que a equipa foi notificada. Guarde o acompanhamento e envie uma mensagem adicional à HMATIAS quando o pedido for urgente.',
        'Storage does not prove that the commercial team was notified. Keep the tracking link and send an additional message for urgent requests.'));
    if(trackingUrl)addAction(box,copy('Acompanhar pedido','Track request'),trackingUrl);
    addAction(box,copy('Avisar HMATIAS no WhatsApp','Notify HMATIAS on WhatsApp'),handoff(body.request.reference),true);
    form.reset();$('#requestLocation').value=loc;syncLanguage();
  }catch(_){
    const box=showResult(copy('Registo não confirmado','Registration unconfirmed'),
      copy('O pedido pode não ter sido guardado. Abra o WhatsApp abaixo e confirme o envio da mensagem. O simples clique não envia o pedido.',
        'The request may not have been stored. Open WhatsApp below and send the message. Opening WhatsApp is not a submission.'));
    addAction(box,copy('Enviar pelo WhatsApp','Send via WhatsApp'),handoff(),true);
  }finally{button.disabled=false;button.textContent=original;}
}
document.addEventListener('DOMContentLoaded',()=>{
  syncLanguage();
  const form=$('#requestForm');form?.addEventListener('submit',onSubmit,true);
  $('#langToggle')?.addEventListener('click',()=>setTimeout(syncLanguage,0));
},{once:true});
})();
