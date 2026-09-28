import {MAX_ITEMS,UNITS,CATEGORY_LABELS,categoryLabel,itemLabel,validateRfq,validContact} from './rfq-model.js';

const $=selector=>document.querySelector(selector);
const params=new URLSearchParams(location.search);
let en=params.get('lang')==='en';
let catalog={items:[]};
let step=0;
let rowNumber=0;
let busy=false;
let registered=false;
let lastBody='';
let clientToken='';
const copy=(pt,eng)=>en?eng:pt;
const track=(eventName,parameters={})=>window.hmatiasAnalytics?.track?.(eventName,parameters);
const value=id=>$('#'+id)?.value.trim()||'';
const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');
const today=()=>new Date(Date.now()+3600000).toISOString().slice(0,10);
const rows=()=>[...document.querySelectorAll('.rfq-item')];

function option(select,label,val){const node=new Option(label,val);select.add(node);}
function options(select,values){select.replaceChildren();values.forEach(([val,label])=>option(select,label,val));}
function error(message=''){const el=$('#rfqError');el.textContent=message;el.hidden=!message;}
function staticLanguage(){
  document.documentElement.lang=en?'en':'pt-AO';
  document.title=copy('Pedido de Cotação / RFQ · SOURCE AO','Quotation Request / RFQ · SOURCE AO');
  document.querySelectorAll('[data-en]').forEach(node=>{if(!node.dataset.pt)node.dataset.pt=node.textContent;node.textContent=en?node.dataset.en:node.dataset.pt;});
  $('#rfqLanguage').textContent=en?'PT':'EN';
}

function renderFields(){
  $('#deliveryFields').innerHTML=`
    <label class="full">${copy('Local de entrega em Angola *','Delivery location in Angola *')}<input id="rfqLocation" required maxlength="100" autocomplete="address-level2" placeholder="${copy('Ex.: Viana, Luanda','e.g. Viana, Luanda')}"></label>
    <label>${copy('Prioridade *','Priority *')}<select id="rfqUrgency"><option value="normal">${copy('Prazo normal','Standard')}</option><option value="urgent">${copy('Urgente','Urgent')}</option><option value="planned">${copy('Compra programada','Planned purchase')}</option></select></label>
    <label>${copy('Data pretendida (opcional)','Target date (optional)')}<input id="rfqDate" type="date" min="${today()}"></label>
    <label>${copy('Finalidade do pedido *','Purpose of request *')}<select id="rfqIntent"><option value="ready">${copy('Comprar após aprovação da proposta','Buy after proposal approval')}</option><option value="budgeting">${copy('Preparar orçamento / comparar opções','Budget / compare options')}</option><option value="recurring">${copy('Fornecimento recorrente','Recurring supply')}</option></select></label>
    <label>${copy('Aceita alternativas equivalentes?','Accept equivalent alternatives?')}<select id="rfqAlternatives"><option value="discuss">${copy('Consultar antes de substituir','Discuss before substituting')}</option><option value="yes">${copy('Sim, se cumprirem a especificação','Yes, if specifications are met')}</option><option value="no">${copy('Não, referência exata','No, exact reference only')}</option></select></label>
    <label class="full">${copy('Orçamento indicativo em Kz (opcional)','Indicative budget in Kz (optional)')}<input id="rfqBudget" type="number" min="0" max="1000000000000" step="0.01" inputmode="decimal" placeholder="${copy('Pode deixar por confirmar','Leave blank if not confirmed')}"></label>
    <label class="full">${copy('Condições de entrega / notas (opcional)','Delivery conditions / notes (optional)')}<textarea id="rfqNotes" rows="3" maxlength="1500" placeholder="${copy('Ex.: frequência mensal, acesso à obra, documentação técnica necessária.','e.g. monthly frequency, site access, required technical documents.')}"></textarea></label>`;
  $('#contactFields').innerHTML=`
    <label>${copy('Nome do contacto *','Contact name *')}<input id="rfqName" required maxlength="120" autocomplete="name"></label>
    <label>${copy('Tipo de cliente *','Customer type *')}<select id="rfqBuyer"><option value="company">${copy('Empresa','Company')}</option><option value="individual">${copy('Particular','Individual')}</option><option value="institution">${copy('Instituição','Institution')}</option></select></label>
    <label class="full">${copy('Empresa / instituição (opcional)','Company / institution (optional)')}<input id="rfqCompany" maxlength="160" autocomplete="organization"></label>
    <label>${copy('Contacto preferencial *','Preferred channel *')}<select id="rfqChannel"><option value="whatsapp">WhatsApp</option><option value="phone">${copy('Telefone','Phone')}</option><option value="email">E-mail</option></select></label>
    <label><span id="contactLabel">WhatsApp *</span><input id="rfqContact" required type="tel" maxlength="180" autocomplete="tel" placeholder="+244 …"></label>`;
  $('#rfqChannel').addEventListener('change',syncContact);
  $('#rfqContact').addEventListener('input',()=>$('#rfqContact').setCustomValidity(''));
}
function syncContact(){
  const email=value('rfqChannel')==='email';
  $('#contactLabel').textContent=email?'E-mail *':copy('Telefone / WhatsApp *','Phone / WhatsApp *');
  const input=$('#rfqContact');input.type=email?'email':'tel';input.autocomplete=email?'email':'tel';input.placeholder=email?'nome@empresa.com':'+244 …';input.setCustomValidity('');
}

function addItem(initial={}){
  if(rows().length>=MAX_ITEMS)return;
  const id=++rowNumber;
  const row=document.createElement('article');row.className='rfq-item';row.dataset.row=String(id);
  row.innerHTML=`<div class="item-heading"><h2></h2><button class="item-remove" type="button">${copy('Remover','Remove')}</button></div><div class="field-grid">
    <label>${copy('Categoria *','Category *')}<select class="item-category" required></select></label>
    <label>${copy('Família do catálogo','Catalogue family')}<select class="item-product"></select></label>
    <label class="full">${copy('Produto / material / serviço *','Product / material / service *')}<input class="item-description" required maxlength="200" placeholder="${copy('Ex.: luvas de proteção, tamanho L','e.g. protective gloves, size L')}"></label>
    <label>${copy('Quantidade *','Quantity *')}<input class="item-quantity" type="number" required min="0.000001" max="1000000000" step="any" inputmode="decimal"></label>
    <label>${copy('Unidade *','Unit *')}<select class="item-unit" required></select></label>
    <label class="full">${copy('Especificação / referência (opcional)','Specification / reference (optional)')}<textarea class="item-specification" rows="2" maxlength="600" placeholder="${copy('Marca, dimensão, norma, modelo ou certificação exigida.','Brand, dimensions, standard, model or required certification.')}"></textarea></label></div>`;
  const category=row.querySelector('.item-category');
  options(category,[['',copy('Selecionar categoria','Select category')],...Object.keys(CATEGORY_LABELS).map(key=>[key,categoryLabel(key,en)])]);
  options(row.querySelector('.item-unit'),UNITS.map(unit=>[unit,unit==='serviço'?copy('serviço','service'):unit]));
  function products(){
    options(row.querySelector('.item-product'),[['',copy('Descrever o produto','Describe the product')],...catalog.items.filter(item=>item.category===category.value).map(item=>[item.id,itemLabel(item,en)])]);
  }
  category.addEventListener('change',()=>{products();summary();});
  row.querySelector('.item-product').addEventListener('change',event=>{
    const product=catalog.items.find(item=>item.id===event.target.value);
    if(product)row.querySelector('.item-description').value=itemLabel(product,en);
    summary();
  });
  const product=catalog.items.find(item=>item.id===initial.catalog_item_id);
  category.value=product?.category||(CATEGORY_LABELS[initial.category]?initial.category:'');products();
  row.querySelector('.item-product').value=product?.id||'';
  row.querySelector('.item-description').value=initial.description||(product?itemLabel(product,en):'');
  row.querySelector('.item-quantity').value=initial.quantity||'';
  row.querySelector('.item-unit').value=UNITS.includes(initial.unit)?initial.unit:'un';
  row.querySelector('.item-specification').value=initial.specification||'';
  row.querySelector('.item-remove').addEventListener('click',()=>{
    if(rows().length>1){const next=row.nextElementSibling||row.previousElementSibling;row.remove();summary();next?.querySelector('select')?.focus();}
  });
  $('#rfqItems').append(row);summary();
}
function readItems(){return rows().map(row=>({
  catalog_item_id:row.querySelector('.item-product').value||null,category:row.querySelector('.item-category').value,
  description:row.querySelector('.item-description').value.trim(),quantity:row.querySelector('.item-quantity').value,
  unit:row.querySelector('.item-unit').value,specification:row.querySelector('.item-specification').value.trim()
}));}
function summary(){
  const items=readItems();
  $('#itemCount').textContent=items.length+' '+copy(items.length===1?'produto':'produtos',items.length===1?'product':'products');
  $('#categorySummary').textContent=[...new Set(items.map(item=>item.category).filter(Boolean))].map(id=>categoryLabel(id,en)).join(' · ')||copy('Escolha uma categoria para começar.','Choose a category to get started.');
  rows().forEach((row,index)=>{row.querySelector('h2').textContent=copy('Produto ','Product ')+(index+1);row.querySelector('.item-remove').hidden=items.length===1;});
  $('#addItem').disabled=items.length>=MAX_ITEMS;
}
function payload(){return {
  rfq_version:1,items:readItems(),location:value('rfqLocation'),needed_by:value('rfqDate'),urgency:value('rfqUrgency'),
  intent:value('rfqIntent'),alternatives:value('rfqAlternatives'),budget:value('rfqBudget'),notes:value('rfqNotes'),
  requester_name:value('rfqName'),company:value('rfqCompany'),buyer_type:value('rfqBuyer'),requester_contact:value('rfqContact'),
  contact_channel:value('rfqChannel'),consent:$('#rfqConsent').checked,website:$('#rfqForm [name="website"]').value,
  origin:['supply','catalog'].includes(params.get('from'))?params.get('from'):'source-ao',language:en?'en':'pt'
};}
function review(){
  const box=$('#rfqReview');box.replaceChildren();
  const title=document.createElement('h2');title.textContent=copy('Rever antes de enviar','Review before sending');box.append(title);
  const list=document.createElement('ul');
  readItems().forEach(item=>{const li=document.createElement('li');li.textContent=`${item.quantity} ${item.unit} · ${item.description} · ${categoryLabel(item.category,en)}${item.specification?' — '+item.specification:''}`;list.append(li);});
  box.append(list);
  const info=document.createElement('p');
  info.textContent=[value('rfqLocation'),value('rfqDate')||copy('Data a confirmar','Date to confirm'),$('#rfqUrgency option:checked').textContent,$('#rfqIntent option:checked').textContent,$('#rfqAlternatives option:checked').textContent,value('rfqBudget')?Number(value('rfqBudget')).toLocaleString(en?'en':'pt-AO')+' Kz':copy('Orçamento a confirmar','Budget to confirm')].join(' · ');box.append(info);
  if(value('rfqNotes')){const note=document.createElement('p');note.textContent=value('rfqNotes');box.append(note);}
}
function validateStep(index){
  if(index===2){const contact=$('#rfqContact');contact.setCustomValidity(validContact(contact.value.trim(),value('rfqChannel'))?'':copy('Introduza um contacto válido.','Enter a valid contact.'));}
  for(const field of document.querySelectorAll(`[data-step="${index}"] input,[data-step="${index}"] select,[data-step="${index}"] textarea`)){
    if(!field.checkValidity()){field.reportValidity();return false;}
  }
  return true;
}
function showStep(index,focus=true){
  step=index;document.querySelectorAll('[data-step]').forEach(fieldset=>fieldset.hidden=Number(fieldset.dataset.step)!==step);
  document.querySelectorAll('.rfq-progress li').forEach((li,i)=>{if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  $('#rfqBack').hidden=step===0;$('#rfqNext').hidden=step===2;$('#rfqSubmit').hidden=step!==2;
  $('#rfqNext').textContent=step===0?copy('Continuar para entrega','Continue to delivery'):copy('Continuar para contacto','Continue to contact');
  if(step===2)review();error();
  if(focus){const legend=$(`[data-step="${step}"] legend`);legend.tabIndex=-1;legend.focus();}
}
function token(){const bytes=crypto.getRandomValues(new Uint8Array(32));return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
function trackingUrl(path){
  const endpoint=new URL(path,apiBase()+'/');
  if(endpoint.origin!==new URL(apiBase()).origin || !/^\/api\/sourcing-requests\/sr_[a-f0-9-]+$/.test(endpoint.pathname))throw new Error('tracking_path');
  const access=endpoint.searchParams.get('token');if(access!==clientToken)throw new Error('tracking_token');
  const url=new URL('track.html',location.href);url.search='';url.hash=new URLSearchParams({id:endpoint.pathname.split('/').pop(),token:access}).toString();return url.href;
}
function link(label,href,primary=false){const a=document.createElement('a');a.textContent=label;a.href=href;a.className=primary?'primary':'secondary';return a;}
function paragraph(parent,text){const p=document.createElement('p');p.textContent=text;parent.append(p);return p;}
function whatsapp(message){return 'https://wa.me/244948806673?text='+encodeURIComponent(message);}
function message(data){
  return ['SOURCE AO · Pedido de cotação / RFQ',...data.items.map((item,i)=>`${i+1}. ${item.description} | ${item.quantity} ${item.unit}${item.specification?' | '+item.specification:''}`),`Local: ${data.location}`,`Prazo: ${data.needed_by||'A confirmar'} | ${data.urgency}`,`Finalidade: ${data.intent} | Alternativas: ${data.alternatives}`,`Orçamento: ${data.budget||'A confirmar'} Kz`,`Notas: ${data.notes||'—'}`,`Contacto: ${data.requester_name} | ${data.company||'—'} | ${data.requester_contact}`].join('\n');
}
function showSuccess(request,path){
  registered=true;$('#rfqForm').hidden=true;$('#catalogStatus').hidden=true;
  const box=$('#rfqResult');box.replaceChildren();box.hidden=false;
  const ref=document.createElement('span');ref.className='reference';ref.textContent=request.reference;box.append(ref);
  const h=document.createElement('h2');h.textContent=copy('Pedido registado.','Request registered.');box.append(h);
  paragraph(box,copy('A HMATIAS recebeu a sua lista para qualificação. Guarde o link privado para acompanhar o estado. A proposta depende da confirmação comercial dos produtos e da entrega.','HMATIAS has received your list for qualification. Keep the private link to track progress. The proposal depends on commercial confirmation of the products and delivery.'));
  const actions=document.createElement('div');actions.className='result-actions';actions.append(link(copy('Acompanhar pedido','Track request'),path,true));
  const save=document.createElement('button');save.type='button';save.className='secondary';save.textContent=copy('Copiar link privado','Copy private link');
  save.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(path);save.textContent=copy('Link copiado','Link copied');}catch{const input=document.createElement('textarea');input.readOnly=true;input.value=path;input.setAttribute('aria-label',copy('Link privado','Private link'));box.append(input);input.focus();input.select();}});actions.append(save);box.append(actions);
  const notify=link(copy('Continuar com a HMATIAS no WhatsApp','Continue with HMATIAS on WhatsApp'),whatsapp(`SOURCE AO · RFQ ${request.reference}\n${copy('Pedido registado. Gostaria de dar seguimento à cotação.','Request registered. I would like to follow up on the quotation.')}`));notify.target='_blank';notify.rel='noopener noreferrer';box.append(notify);
  paragraph(box,copy('Pode enviar fichas técnicas ou fotografias à HMATIAS no WhatsApp, indicando esta referência.','You can send technical sheets or photos to HMATIAS on WhatsApp, quoting this reference.'));
  box.append(link(copy('Criar outro pedido','Create another request'),'rfq.html'+(en?'?lang=en':'')));
  box.focus();
}
function showFailure(data,status){
  const box=$('#rfqResult');box.replaceChildren();box.hidden=false;
  paragraph(box,status===429?copy('Limite temporário de pedidos. Aguarde alguns minutos antes de tentar novamente.','Temporary request limit. Wait a few minutes before retrying.'):copy('Não conseguimos confirmar o registo. Os campos continuam preenchidos: tente novamente ou contacte a HMATIAS com a lista abaixo.','We could not confirm registration. Your fields are still filled in: retry or contact HMATIAS with the list below.'));
  const full=message(data);const text=document.createElement('textarea');text.readOnly=true;text.rows=5;text.value=full;text.setAttribute('aria-label',copy('Lista para enviar à HMATIAS','List to send to HMATIAS'));box.append(text);
  const a=link(copy('Abrir WhatsApp e enviar o pedido','Open WhatsApp and send the request'),whatsapp(full.length<6000?full:copy('Preciso de uma cotação no SOURCE AO. Vou enviar a minha lista de produtos nesta conversa.','I need a SOURCE AO quotation. I will send my product list in this conversation.')),true);a.target='_blank';a.rel='noopener noreferrer';
  box.append(a);if(full.length>=6000)paragraph(box,copy('Copie a lista acima e cole-a na conversa.','Copy the list above and paste it into the conversation.'));
  paragraph(box,copy('Abrir o WhatsApp não envia a mensagem. Confirme o envio na conversa.','Opening WhatsApp does not send the message. Confirm sending in the conversation.'));
}

async function submit(event){
  event.preventDefault();if(busy||registered)return;
  if(step<2){if(validateStep(step))showStep(step+1);return;}
  for(let i=0;i<3;i++){showStep(i,false);if(!validateStep(i))return;}showStep(2,false);
  const data=payload();const serialized=JSON.stringify(data);
  if(serialized!==lastBody||!clientToken){clientToken=token();lastBody=serialized;}
  data.client_token=clientToken;
  const validation=validateRfq(data,catalog,new Date(Date.now()+3600000));
  if(!validation.ok){error(copy('Verifique os campos e a data pretendida antes de enviar.','Check the fields and target date before sending.'));return;}
  track('source_rfq_submit_attempt',{
    item_count:data.items.length,
    buyer_type:data.buyer_type,
    urgency:data.urgency,
    purchase_intent:data.intent,
    contact_channel:data.contact_channel,
    source_origin:data.origin,
    source_language:data.language
  });
  busy=true;$('#rfqSubmit').disabled=true;$('#rfqBack').disabled=true;$('#rfqLanguage').disabled=true;$('#rfqSubmit').textContent=copy('A registar…','Registering…');$('#rfqResult').hidden=true;
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{
    if(!/^https:\/\//.test(apiBase()))throw new Error('unconfigured');
    const response=await fetch(apiBase()+'/api/sourcing-requests',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(data),cache:'no-store',signal:controller.signal});
    const result=await response.json().catch(()=>null);
    if(!response.ok)throw Object.assign(new Error('registration_failed'),{status:response.status});
    if(result?.ok!==true || result.request?.rfq_version!==1 || !result.request.reference || !result.request.status_path)throw new Error('unconfirmed');
    track('source_rfq_registered',{
      item_count:data.items.length,
      buyer_type:data.buyer_type,
      urgency:data.urgency,
      purchase_intent:data.intent,
      contact_channel:data.contact_channel,
      source_origin:data.origin,
      source_language:data.language
    });
    window.hmatiasAnalytics?.confirmLead?.('source_rfq','website');
    showSuccess(result.request,trackingUrl(result.request.status_path));
  }catch(failure){
    track('source_rfq_registration_failed',{status_code:Number(failure.status)||0,source_origin:data.origin,source_language:data.language});
    showFailure(data,failure.status);
  }
  finally{clearTimeout(timeout);busy=false;$('#rfqSubmit').disabled=false;$('#rfqBack').disabled=false;$('#rfqLanguage').disabled=registered;$('#rfqSubmit').textContent=copy('Enviar pedido de cotação','Send quotation request');}
}

$('#rfqNext').addEventListener('click',()=>{if(validateStep(step))showStep(step+1);});
$('#rfqBack').addEventListener('click',()=>showStep(step-1));
$('#rfqForm').addEventListener('submit',submit);
$('#addItem').addEventListener('click',()=>{addItem();rows().at(-1).querySelector('select').focus();});
$('#rfqLanguage').addEventListener('click',()=>{
  if(busy||registered)return;
  const items=readItems();const saved={};document.querySelectorAll('#deliveryFields input,#deliveryFields select,#deliveryFields textarea,#contactFields input,#contactFields select').forEach(input=>saved[input.id]=input.value);
  en=!en;staticLanguage();renderFields();Object.entries(saved).forEach(([id,val])=>{$('#'+id).value=val;});syncContact();$('#rfqItems').replaceChildren();items.forEach(addItem);showStep(step,false);updateCatalogNotice();
});
let catalogLoaded=false;
function updateCatalogNotice(){const node=$('#catalogStatus');node.hidden=catalogLoaded;node.textContent=copy('O catálogo não está disponível neste momento. Pode descrever os produtos e selecionar a categoria manualmente.','The catalogue is temporarily unavailable. Describe your products and select their categories manually.');}

staticLanguage();renderFields();
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
try{const response=await fetch('data/catalog.json',{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('catalog');const data=await response.json();if(!Array.isArray(data.items))throw new Error('catalog');catalog=data;catalogLoaded=true;}catch{}finally{clearTimeout(timeout);}
updateCatalogNotice();
const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const query=' '+normalize(params.get('request'))+' ';
const inferred=catalog.items.flatMap(item=>[item.name,item.name_pt,...(item.aliases||[])].filter(Boolean).map(alias=>({item,alias:normalize(alias)}))).filter(match=>match.alias.length>=3 && query.includes(' '+match.alias+' ')).sort((a,b)=>b.alias.length-a.alias.length)[0]?.item;
addItem({catalog_item_id:params.get('item')||inferred?.id,category:params.get('category'),description:(params.get('request')||'').slice(0,200),quantity:/^\d+(\.\d+)?$/.test(params.get('quantity')||'')?params.get('quantity'):'',specification:(params.get('specification')||'').slice(0,600)});
$('#rfqLocation').value=(params.get('location')||'Luanda').slice(0,100);
if(params.get('urgency')==='urgent')$('#rfqUrgency').value='urgent';
if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('needed_by')||''))$('#rfqDate').value=params.get('needed_by');
if(params.get('item')&&!catalog.items.some(item=>item.id===params.get('item'))){$('#catalogStatus').hidden=false;$('#catalogStatus').textContent=copy('A referência do catálogo já não está disponível. Selecione outra família ou descreva o produto.','This catalogue reference is no longer available. Select another family or describe the product.');}
showStep(0,false);
