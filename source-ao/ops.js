(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const storageKey='sourceao_verification_queue';
  let suppliers=[];
  let currentDraft=null;
  let currentConfirmationUrl='';
  let adminToken='';

  const nowIso=()=>new Date().toISOString();
  const localRef=()=>`SAO-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const queue=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return[]}};
  const save=list=>{localStorage.setItem(storageKey,JSON.stringify(list));renderQueue();};
  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');

  function setApiStatus(text,state='local'){
    const el=$('#apiStatus');
    el.textContent=text;
    el.dataset.state=state;
  }

  function configureSessionUi(){
    const base=apiBase();
    $('#apiEndpoint').value=base||'Not configured';
    if(!base){
      $('#adminToken').disabled=true;
      $('#connectApi').disabled=true;
      setApiStatus('Local mode','local');
    }else{
      setApiStatus('API available · token required','ready');
    }
  }

  async function api(path,options={}){
    const base=apiBase();
    if(!/^https?:\/\//i.test(base)) throw new Error('api_not_configured');
    if(!adminToken) throw new Error('admin_token_required');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(base+path,{
        ...options,
        cache:'no-store',
        signal:controller.signal,
        headers:{
          accept:'application/json',
          authorization:`Bearer ${adminToken}`,
          ...(options.headers||{})
        }
      });
      let payload=null;
      try{payload=await response.json();}catch{payload=null;}
      if(!response.ok){
        const err=new Error(payload?.error?.code||`http_${response.status}`);
        err.status=response.status;
        throw err;
      }
      return payload;
    }finally{clearTimeout(timeout);}
  }

  function confirmationPortalUrl(confirmationPath){
    if(!confirmationPath) return '';
    const apiUrl=new URL(confirmationPath,apiBase()+'/');
    const requestId=apiUrl.pathname.split('/').filter(Boolean).pop()||'';
    const token=apiUrl.searchParams.get('token')||'';
    if(!requestId||!token) return '';
    const portal=new URL('confirm.html',location.href);
    portal.search='';
    portal.hash=`id=${encodeURIComponent(requestId)}&token=${encodeURIComponent(token)}`;
    return portal.toString();
  }

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
    const linkLine=d.confirmation_url
      ? (d.language==='pt'?`\nConfirme através deste link seguro:\n${d.confirmation_url}\n`:`\nPlease confirm through this secure link:\n${d.confirmation_url}\n`)
      : '';
    if(d.language==='pt'){
      return `Boa tarde. O Source AO by HMATIAS está a validar uma necessidade de um cliente.\n\nReferência: ${d.request_id}\nMaterial/serviço: ${d.item}\nEspecificação: ${d.specification||'A confirmar'}\nQuantidade: ${d.quantity||'A confirmar'} ${d.unit||''}\nLocal: ${d.location}\n${linkLine}\nPedimos, por favor, a confirmação de:\n1. se fornecem atualmente esta especificação exata;\n2. quantidade/capacidade disponível;\n3. preço e moeda, caso possam cotar;\n4. prazo ou local de levantamento.\n\nA resposta será revista pela HMATIAS antes de qualquer informação ser apresentada como confirmada.`;
    }
    return `Hello. Source AO by HMATIAS is validating a customer requirement.\n\nReference: ${d.request_id}\nItem/service: ${d.item}\nSpecification: ${d.specification||'To confirm'}\nQuantity: ${d.quantity||'To confirm'} ${d.unit||''}\nLocation: ${d.location}\n${linkLine}\nPlease confirm:\n1. whether you currently supply this exact requirement;\n2. available quantity/capacity;\n3. price and currency, if quoted;\n4. lead time or collection location.\n\nHMATIAS reviews the response before any information is presented as confirmed.`;
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

  async function createRemoteRequest(d){
    const qty=d.quantity===''?null:Number(d.quantity);
    const payload=await api('/api/admin/verification-requests',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        supplier_id:d.supplier_id,
        requirement_text:d.item,
        specification:d.specification||null,
        quantity:Number.isFinite(qty)?qty:null,
        unit:d.unit||null,
        location:d.location
      })
    });
    const remote=payload?.verification_request;
    if(!remote?.id) throw new Error('invalid_api_response');
    return {
      id:remote.id,
      status:remote.status||'sent',
      expires_at:remote.expires_at||null,
      confirmation_url:confirmationPortalUrl(remote.confirmation_path)
    };
  }

  $('#connectApi').addEventListener('click',()=>{
    const candidate=$('#adminToken').value.trim();
    if(!candidate){adminToken='';setApiStatus('API available · token required','ready');return;}
    adminToken=candidate;
    $('#adminToken').value='';
    setApiStatus('Session token loaded','connected');
  });

  $('#verifyForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const supplier=suppliers.find(s=>s.id===$('#supplierSelect').value);
    if(!supplier) return;
    const button=$('#prepareRequest');
    button.disabled=true;
    button.textContent=adminToken&&apiBase()?'Creating request…':'Preparing…';
    currentConfirmationUrl='';
    $('#copyLink').disabled=true;
    currentDraft={
      request_id:localRef(),
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

    if(adminToken&&apiBase()){
      try{
        const remote=await createRemoteRequest(currentDraft);
        currentDraft.request_id=remote.id;
        currentDraft.status=remote.status;
        currentDraft.expires_at=remote.expires_at;
        currentDraft.confirmation_url=remote.confirmation_url;
        currentConfirmationUrl=remote.confirmation_url;
        $('#copyLink').disabled=!currentConfirmationUrl;
        setApiStatus('Connected · request created','connected');
      }catch(error){
        currentDraft.status='draft_api_failed';
        if(error.status===401){adminToken='';setApiStatus('Token rejected · local draft only','error');}
        else setApiStatus('API request failed · local draft only','error');
      }
    }

    $('#requestRef').textContent=currentDraft.request_id;
    $('#messageOutput').value=buildMessage(currentDraft);
    $('#saveDraft').disabled=false;
    button.disabled=false;
    button.textContent='Prepare confirmation';
  });

  $('#copyMessage').addEventListener('click',async()=>{
    const text=$('#messageOutput').value;
    if(!text) return;
    try{await navigator.clipboard.writeText(text);$('#copyMessage').textContent='Copied';setTimeout(()=>$('#copyMessage').textContent='Copy message',1300);}catch{alert('Copy failed. Select the text manually.');}
  });

  $('#copyLink').addEventListener('click',async()=>{
    if(!currentConfirmationUrl) return;
    try{await navigator.clipboard.writeText(currentConfirmationUrl);$('#copyLink').textContent='Copied';setTimeout(()=>$('#copyLink').textContent='Copy confirmation link',1300);}catch{alert('Copy failed. Copy the link from the supplier message.');}
  });

  $('#saveDraft').addEventListener('click',()=>{
    if(!currentDraft) return;
    const {confirmation_url:discardedConfirmationUrl,...safeDraft}=currentDraft;
    void discardedConfirmationUrl;
    const items=queue();
    if(!items.some(i=>i.request_id===safeDraft.request_id)) items.unshift(safeDraft);
    save(items);
    $('#saveDraft').textContent='Saved';
    setTimeout(()=>$('#saveDraft').textContent='Save request locally',1300);
  });

  $('#clearQueue').addEventListener('click',()=>{if(confirm('Clear the local verification queue on this device?')) save([]);});

  $('#exportQueue').addEventListener('click',()=>{
    const payload={exported_at:nowIso(),source:'Source AO Verification Desk',requests:queue()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`sourceao-verification-queue-${new Date().toISOString().slice(0,10)}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  });

  window.addEventListener('pagehide',()=>{adminToken='';currentConfirmationUrl='';});
  document.addEventListener('DOMContentLoaded',async()=>{configureSessionUi();await loadSuppliers();renderQueue();});
})();
