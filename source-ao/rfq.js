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
  $('#rfqLanguage').setAttribute('aria-label',en?'Switch to PT — Português':'Mudar para EN — English');
}

function setAccessibleLabel(input, labelText) {
  if (!input || !labelText) return input;
  input.setAttribute('aria-label', labelText);
  return input;
}

function renderFields(){
  $('#deliveryFields').innerHTML=`
    <label class="full">${copy('Local de entrega em Angola *','Delivery location in Angola *')}<input id="rfqLocation" required maxlength="100" autocomplete="address-level2" placeholder="${copy('Ex.: Luanda, Talatona','Ex.: Luanda, Talatona')}" aria-label="${copy('Local de entrega em Angola','Delivery location in Angola')}" /></label>
    <label>${copy('Prioridade *','Priority *')}<select id="rfqUrgency" aria-label="${copy('Prioridade','Priority')}"><option value="normal">${copy('Prazo normal','Standard')}</option><option value="urgent">${copy('Urgente','Urgent')}</option><option value="flexible">${copy('Flexível','Flexible')}</option></select></label>
    <label>${copy('Data pretendida (opcional)','Target date (optional)')}<input id="rfqDate" type="date" min="${today()}" aria-label="${copy('Data pretendida','Target date')}" /></label>
    <label>${copy('Finalidade do pedido *','Purpose of request *')}<select id="rfqIntent" aria-label="${copy('Finalidade do pedido','Purpose of request')}"><option value="ready">${copy('Comprar após aprovação da proposta','Buy after proposal approval')}</option><option value="project">${copy('Para projecto / instalação','For project / installation')}</option><option value="stock">${copy('Reabastecimento regular','Regular restocking')}</option></select></label>
    <label>${copy('Aceita alternativas equivalentes?','Accept equivalent alternatives?')}<select id="rfqAlternatives" aria-label="${copy('Aceita alternativas equivalentes','Accept equivalent alternatives')}"><option value="discuss">${copy('Consultar antes de substituir','Discuss before replacing')}</option><option value="yes">${copy('Sim, aceito alternativas equivalentes','Yes, equivalent alternatives are fine')}</option><option value="no">${copy('Não, preciso do mesmo produto','No, I need the same product')}</option></select></label>
    <label class="full">${copy('Orçamento indicativo em Kz (opcional)','Indicative budget in Kz (optional)')}<input id="rfqBudget" type="number" min="0" max="1000000000000" step="0.01" inputmode="decimal" aria-label="${copy('Orçamento indicativo em Kz','Indicative budget in Kz')}" /></label>
    <label class="full">${copy('Condições de entrega / notas (opcional)','Delivery conditions / notes (optional)')}<textarea id="rfqNotes" rows="3" maxlength="1500" placeholder="${copy('Ex.: entrega em Luanda, requisitos técnicos, embalagem, documentos','Ex.: delivery in Luanda, technical requirements, packaging, documents')}" aria-label="${copy('Condições de entrega e notas','Delivery conditions and notes')}"></textarea></label>
  `;
  $('#contactFields').innerHTML=`
    <label>${copy('Nome do contacto *','Contact name *')}<input id="rfqName" required maxlength="120" autocomplete="name" aria-label="${copy('Nome do contacto','Contact name')}" /></label>
    <label>${copy('Tipo de cliente *','Customer type *')}<select id="rfqBuyer" aria-label="${copy('Tipo de cliente','Customer type')}" ><option value="company">${copy('Empresa','Company')}</option><option value="individual">${copy('Particular','Individual')}</option><option value="public">${copy('Entidade pública / estatal','Public entity')}</option></select></label>
    <label class="full">${copy('Empresa / instituição (opcional)','Company / institution (optional)')}<input id="rfqCompany" maxlength="160" autocomplete="organization" aria-label="${copy('Empresa ou instituição','Company or institution')}" /></label>
    <label>${copy('Contacto preferencial *','Preferred channel *')}<select id="rfqChannel" aria-label="${copy('Contacto preferencial','Preferred channel')}"><option value="whatsapp">WhatsApp</option><option value="phone">${copy('Telefone','Phone')}</option><option value="email">${copy('E-mail','Email')}</option></select></label>
    <label><span id="contactLabel">WhatsApp *</span><input id="rfqContact" required type="tel" maxlength="180" autocomplete="tel" placeholder="+244 …" aria-label="${copy('Contacto telefónico ou WhatsApp','Phone or WhatsApp contact')}" /></label>`;
  $('#rfqChannel').addEventListener('change',syncContact);
  $('#rfqContact').addEventListener('input',()=>$('#rfqContact').setCustomValidity(''));
}
function syncContact(){
  const email=value('rfqChannel')==='email';
  $('#contactLabel').textContent=email?'E-mail *':copy('Telefone / WhatsApp *','Phone / WhatsApp *');
  const input=$('#rfqContact');input.type=email?'email':'tel';input.autocomplete=email?'email':'tel';input.placeholder=email?'nome@empresa.com':'+244 …';input.setCustomValidity('');
  input.setAttribute('aria-label', email ? copy('E-mail do contacto','Contact email') : copy('Telefone ou WhatsApp do contacto','Phone or WhatsApp contact'));
}

function addItem(initial={}){
  if(rows().length>=MAX_ITEMS)return;
  const id=++rowNumber;
  const row=document.createElement('article');row.className='rfq-item';row.dataset.row=String(id);
  row.innerHTML=`<div class="item-heading"><h2></h2><button class="item-remove" type="button" aria-label="${copy('Remover produto','Remove product')}">${copy('Remover','Remove')}</button></div><div class="field-grid">
    <label>${copy('Categoria *','Category *')}<select class="item-category" required aria-label="${copy('Categoria do produto','Product category')}"></select></label>
    <label>${copy('Família do catálogo','Catalogue family')}<select class="item-product" aria-label="${copy('Família do catálogo','Catalogue family')}"></select></label>
    <label class="full">${copy('Produto / material / serviço *','Product / material / service *')}<input class="item-description" required maxlength="200" placeholder="${copy('Ex.: luvas de proteção, cimento, tinta','Ex.: protective gloves, cement, paint')}" aria-label="${copy('Descrição do produto','Product description')}" /></label>
    <label>${copy('Quantidade *','Quantity *')}<input class="item-quantity" type="number" required min="0.000001" max="1000000000" step="any" inputmode="decimal" aria-label="${copy('Quantidade','Quantity')}" /></label>
    <label>${copy('Unidade *','Unit *')}<select class="item-unit" required aria-label="${copy('Unidade','Unit')}"></select></label>
    <label class="full">${copy('Especificação / referência (opcional)','Specification / reference (optional)')}<textarea class="item-specification" rows="2" maxlength="600" placeholder="${copy('Ex.: referência, norma, cor, dimensão','Ex.: reference, standard, colour, size')}" aria-label="${copy('Especificação ou referência','Specification or reference')}"></textarea></label>
  </div>`;
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
  $('#categorySummary').textContent=[...new Set(items.map(item=>item.category).filter(Boolean))].map(id=>categoryLabel(id,en)).join(' · ')||copy('Escolha uma categoria para começar.','Choose a category to begin.');
  rows().forEach((row,index)=>{row.querySelector('h2').textContent=copy('Produto ','Product ')+(index+1);row.querySelector('.item-remove').hidden=items.length===1; row.querySelector('.item-remove').setAttribute('aria-label', `${copy('Remover produto','Remove product')} ${index + 1}`);});
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
  readItems().forEach(item=>{const li=document.createElement('li');li.textContent=`${item.quantity} ${item.unit} · ${item.description} · ${categoryLabel(item.category,en)}${item.specification?' · '+item.specification:''}`;list.append(li);});
  box.append(list);
  const info=document.createElement('p');
  info.textContent=[value('rfqLocation'),value('rfqDate')||copy('Data a confirmar','Date to confirm'),$('#rfqUrgency option:checked').textContent,$('#rfqIntent option:checked').textContent,$('#rfqAlternatives option:checked').textContent].join(' · ');
  box.append(info);
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
  return ['SOURCE AO · Pedido de cotação / RFQ',...data.items.map((item,i)=>`${i+1}. ${item.description} | ${item.quantity} ${item.unit}${item.specification?' | '+item.specification:''}`),`Local: ${data.location}`,`Necessário até: ${data.needed_by||copy('a confirmar','to confirm')}`].join('\n');
}
function showSuccess(request,path){
  registered=true;$('#rfqForm').hidden=true;$('#catalogStatus').hidden=true;
  const box=$('#rfqResult');box.replaceChildren();box.hidden=false;
  const ref=document.createElement('span');ref.className='reference';ref.textContent=request.reference;box.append(ref);
  const h=document.createElement('h2');h.textContent=copy('Pedido registado.','Request registered.');box.append(h);
  paragraph(box,copy('O pedido ficou registado na plataforma Source AO. Guarde o link privado e utilize o WhatsApp para dar conhecimento imediato à equipa comercial. A gravação não confirma stock ou disponibilidade até revisão da HMATIAS.','The request was registered on the Source AO platform. Save the private link and use WhatsApp to notify the commercial team immediately. Registration does not confirm stock or availability until HMATIAS review.'));
  const actions=document.createElement('div');actions.className='result-actions';actions.append(link(copy('Acompanhar pedido','Track request'),path,true));
  const save=document.createElement('button');save.type='button';save.className='secondary';save.textContent=copy('Copiar link privado','Copy private link');
  save.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(path);save.textContent=copy('Link copiado','Link copied');}catch{const input=document.createElement('textarea');input.value=path;document.body.append(input);input.select();document.execCommand('copy');input.remove();save.textContent=copy('Link copiado','Link copied');}});
  actions.append(save);
  const notify=link(copy('Continuar com a HMATIAS no WhatsApp','Continue with HMATIAS on WhatsApp'),whatsapp(`SOURCE AO · RFQ ${request.reference}\n${copy('Pedido registado. Gostaria de dar seguimento ao pedido.','Request registered. I would like to continue with the request.')}`));
  actions.append(notify);
  box.append(actions);
  paragraph(box,copy('Pode enviar fichas técnicas ou fotografias à HMATIAS no WhatsApp, indicando esta referência.','You can send technical sheets or photos to HMATIAS on WhatsApp, quoting this reference.'));
  box.append(link(copy('Criar outro pedido','Create another request'),'rfq.html'+(en?'?lang=en':'')));
  box.focus();
}
function showFailure(data,status){
  const box=$('#rfqResult');box.replaceChildren();box.hidden=false;
  paragraph(box,status===429?copy('Limite temporário de pedidos. Aguarde alguns minutos antes de tentar novamente.','Temporary request limit. Wait a few minutes before retrying.'):copy('Não foi possível registar o seu pedido no momento. Pode continuar pela conversa no WhatsApp e enviar a lista abaixo.','The request could not be registered at the moment. You can continue via WhatsApp and send the list below.'));
  const full=message(data);const text=document.createElement('textarea');text.readOnly=true;text.rows=5;text.value=full;text.setAttribute('aria-label',copy('Lista para enviar à HMATIAS','List to send to HMATIAS'));
  const a=link(copy('Abrir WhatsApp e enviar o pedido','Open WhatsApp and send the request'),whatsapp(full.length<6000?full:copy('Preciso de uma cotação no SOURCE AO. Vou enviar a minha lista de produtos abaixo.','I need a quote in SOURCE AO. I will send my product list below.')));
  box.append(text,a);if(full.length>=6000)paragraph(box,copy('Copie a lista acima e cole-a na conversa.','Copy the list above and paste it into the conversation.'));
  paragraph(box,copy('Abrir o WhatsApp não envia a mensagem. Confirme o envio na conversa.','Opening WhatsApp does not send the message. Confirm the send in the conversation.'));
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
  track('source_rfq_submit_attempt',{item_count:data.items.length,buyer_type:data.buyer_type,urgency:data.urgency,purchase_intent:data.intent,contact_channel:data.contact_channel,source_origin:data.origin,source_language:data.language});
  busy=true;$('#rfqSubmit').disabled=true;$('#rfqBack').disabled=true;$('#rfqLanguage').disabled=true;$('#rfqSubmit').textContent=copy('A registar…','Registering…');$('#rfqResult').hidden=true;error();
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{
    if(!/^https:\/\//.test(apiBase()))throw new Error('unconfigured');
    const response=await fetch(apiBase()+'/api/sourcing-requests',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(data),cache:'no-store',signal:controller.signal});
    const result=await response.json().catch(()=>null);
    if(!response.ok)throw Object.assign(new Error('registration_failed'),{status:response.status});
    if(result?.ok!==true || result.request?.rfq_version!==1 || !result.request.reference || !result.request.status_path)throw new Error('unconfirmed');
    track('source_rfq_registered',{item_count:data.items.length,buyer_type:data.buyer_type,urgency:data.urgency,purchase_intent:data.intent,contact_channel:data.contact_channel,source_origin:data.origin,source_language:data.language});
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
  const items=readItems();const saved={};document.querySelectorAll('#deliveryFields input,#deliveryFields select,#deliveryFields textarea,#contactFields input,#contactFields select').forEach(input=>{saved[input.id]=input.value;});
  en=!en;staticLanguage();renderFields();Object.entries(saved).forEach(([id,val])=>{$('#'+id).value=val;});syncContact();$('#rfqItems').replaceChildren();items.forEach(addItem);showStep(step,false);updateCatalogNotice();
});
let catalogLoaded=false;
function updateCatalogNotice(){
  const node=$('#catalogStatus');
  node.hidden=false;
  node.textContent=catalogLoaded?
    copy('Categorias disponíveis. Se não encontrar a referência, descreva o produto no campo abaixo.','Categories available. If the reference is not listed, describe the product below.'):
    copy('O catálogo não está disponível neste momento. Pode descrever os produtos e selecionar a categoria manualmente.','The catalogue is temporarily unavailable. Describe your products and choose the category manually.');
}

staticLanguage();
renderFields();
addItem({category:params.get('category'),description:(params.get('request')||'').slice(0,200),quantity:/^\d+(\.\d+)?$/.test(params.get('quantity')||'')?params.get('quantity'):'',specification:(params.get('specification')||'').slice(0,600),unit:UNITS.includes(params.get('unit'))?params.get('unit'):'un'});
$('#rfqLocation').value=(params.get('location')||'Luanda').slice(0,100);
if(params.get('alternatives')==='no')$('#rfqAlternatives').value='no';
if(params.get('urgency')==='urgent')$('#rfqUrgency').value='urgent';
if(/^\d{4}-\d{2}-\d{2}$/.test(params.get('needed_by')||''))$('#rfqDate').value=params.get('needed_by');
showStep(0,false);

const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),8000);
try{
  const response=await fetch('data/catalog.json',{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw new Error('catalog');
  const data=await response.json();
  if(!Array.isArray(data.items))throw new Error('catalog');
  catalog=data;
  catalogLoaded=true;
}catch{}finally{clearTimeout(timeout);}

if(catalogLoaded){
  const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const query=' '+normalize(params.get('request'))+' ';
  const inferred=catalog.items.flatMap(item=>
    [item.name,item.name_pt,...(item.aliases||[])].filter(Boolean)
      .map(alias=>({item,alias:normalize(alias)}))
  ).filter(match=>match.alias.length>=3 && query.includes(' '+match.alias+' '))
    .sort((a,b)=>b.alias.length-a.alias.length)[0]?.item;
  const matched=catalog.items.find(item=>item.id===params.get('item'))||inferred;
  const first=rows()[0];
  const firstCategory=first?.querySelector('.item-category');
  if(matched && firstCategory && !firstCategory.value){
    firstCategory.value=matched.category;
  }
  rows().forEach(row=>{
    const selected=row.querySelector('.item-product');
    const formerSelection=selected.value;
    row.querySelector('.item-category').dispatchEvent(new Event('change'));
    if(formerSelection)selected.value=formerSelection;
    if(row===first && matched && row.querySelector('.item-category').value===matched.category){
      selected.value=matched.id;
      const desc=row.querySelector('.item-description');
      if(!desc.value.trim())desc.value=itemLabel(matched,en);
    }
  });
  summary();
}
updateCatalogNotice();
if(params.get('item')&&!catalog.items.some(item=>item.id===params.get('item'))){
  $('#catalogStatus').textContent=copy(
    'A referência do catálogo já não está disponível. Selecione outra família ou descreva o produto.',
    'This catalogue reference is no longer available. Select another family or describe the product.'
  );
}
