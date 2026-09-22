(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const storageKey='sourceao_verification_queue';
  let suppliers=[];
  let currentDraft=null;

  const nowIso=()=>new Date().toISOString();
  const ref=()=>`SAO-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const queue=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return[]}};
  const save=list=>{localStorage.setItem(storageKey,JSON.stringify(list));renderQueue();};

  async function loadSuppliers(){
    try{
      const res=await fetch('data/suppliers.json',{cache:'no-store'});
      if(!res.ok) throw new Error(String(res.status));
      const data=await res.json();
      suppliers=data.suppliers||[];
    }catch(err){
      console.warn('[Source AO Ops] supplier load failed',err);
      suppliers=[];
    }
    const select=$('#supplierSelect');
    suppliers.forEach(s=>{
      const o=document.createElement('option');o.value=s.id;o.textContent=`${s.name} — ${s.location}`;select.appendChild(o);
    });
    $('#supplierCount').textContent=`${suppliers.length} supplier${suppliers.length===1?'':'s'}`;
  }

  function buildMessage(d){
    if(d.language==='pt'){
      return `Boa tarde. O Source AO by HMATIAS está a validar uma necessidade de um cliente.\n\nReferência: ${d.request_id}\nMaterial/serviço: ${d.item}\nEspecificação: ${d.specification||'A confirmar'}\nQuantidade: ${d.quantity||'A confirmar'} ${d.unit||''}\nLocal: ${d.location}\n\nPedimos, por favor, a confirmação de:\n1. se fornecem atualmente esta especificação exata;\n2. quantidade/capacidade disponível;\n3. preço e moeda, caso possam cotar;\n4. prazo ou local de levantamento;\n5. até quando esta informação se mantém válida.\n\nO Source AO regista a hora da confirmação para distinguir informação atual de anúncios antigos.`;
    }
    return `Hello. Source AO by HMATIAS is validating a customer requirement.\n\nReference: ${d.request_id}\nItem/service: ${d.item}\nSpecification: ${d.specification||'To confirm'}\nQuantity: ${d.quantity||'To confirm'} ${d.unit||''}\nLocation: ${d.location}\n\nPlease confirm:\n1. whether you currently supply this exact requirement;\n2. available quantity/capacity;\n3. price and currency, if quoted;\n4. lead time or collection location;\n5. how long this information remains valid.\n\nSource AO records the confirmation time so customers can distinguish current information from old listings.`;
  }

  function renderQueue(){
    const list=$('#queueList');
    const items=queue();
    list.innerHTML='';
    if(!items.length){
      list.innerHTML='<div class="empty-state"><strong>No local verification requests.</strong><p>Create a request above to test the operational flow.</p></div>';
      return;
    }
    items.forEach(item=>{
      const row=document.createElement('div');row.className='queue-row';
      const main=document.createElement('div');
      const title=document.createElement('strong');title.textContent=`${item.item} · ${item.supplier_name}`;
      const meta=document.createElement('small');meta.textContent=`${item.request_id} · ${item.location} · ${new Date(item.created_at).toLocaleString()}`;
      main.append(title,meta);
      const badge=document.createElement('span');badge.className='queue-badge';badge.textContent=item.status;
      row.append(main,badge);list.appendChild(row);
    });
  }

  $('#verifyForm').addEventListener('submit',e=>{
    e.preventDefault();
    const supplier=suppliers.find(s=>s.id===$('#supplierSelect').value);
    if(!supplier) return;
    currentDraft={
      request_id:ref(),
      supplier_id:supplier.id,
      supplier_name:supplier.name,
      item:$('#verifyItem').value.trim(),
      specification:$('#verifySpec').value.trim(),
      quantity:$('#verifyQty').value.trim(),
      unit:$('#verifyUnit').value.trim(),
      location:$('#verifyLocation').value.trim()||'Luanda',
      language:$('#verifyLang').value,
      status:'draft',
      created_at:nowIso(),
      source_status:supplier.verification_status,
      supplier_source_urls:supplier.source_urls||[]
    };
    $('#requestRef').textContent=currentDraft.request_id;
    $('#messageOutput').value=buildMessage(currentDraft);
    $('#saveDraft').disabled=false;
  });

  $('#copyMessage').addEventListener('click',async()=>{
    const text=$('#messageOutput').value;
    if(!text) return;
    try{await navigator.clipboard.writeText(text);$('#copyMessage').textContent='Copied';setTimeout(()=>$('#copyMessage').textContent='Copy message',1300);}catch{alert('Copy failed. Select the text manually.');}
  });

  $('#saveDraft').addEventListener('click',()=>{
    if(!currentDraft) return;
    const items=queue();
    if(!items.some(i=>i.request_id===currentDraft.request_id)) items.unshift(currentDraft);
    save(items);
    $('#saveDraft').textContent='Saved';
    setTimeout(()=>$('#saveDraft').textContent='Save draft locally',1300);
  });

  $('#clearQueue').addEventListener('click',()=>{if(confirm('Clear the local verification queue on this device?')) save([]);});

  $('#exportQueue').addEventListener('click',()=>{
    const payload={exported_at:nowIso(),source:'Source AO Verification Desk',requests:queue()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`sourceao-verification-queue-${new Date().toISOString().slice(0,10)}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  });

  document.addEventListener('DOMContentLoaded',async()=>{await loadSuppliers();renderQueue();});
})();
