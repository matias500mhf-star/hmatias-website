(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  let adminToken='';
  let pending=[];

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
      setApiStatus('API not configured','error');
    }else{
      setApiStatus('API available · token required','ready');
    }
  }

  async function api(path,options={}){
    const base=apiBase();
    if(!/^https?:\/\//i.test(base)) throw new Error('api_not_configured');
    if(!adminToken) throw new Error('admin_token_required');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),9000);
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
        const error=new Error(payload?.error?.code||`http_${response.status}`);
        error.status=response.status;
        error.payload=payload;
        throw error;
      }
      return payload;
    }finally{clearTimeout(timeout);}
  }

  function fmtDate(value){
    if(!value) return '—';
    try{return new Intl.DateTimeFormat('pt-AO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return value;}
  }

  function safeResponse(value){
    if(!value) return null;
    if(typeof value==='object') return value;
    try{return JSON.parse(value);}catch{return null;}
  }

  function setMessage(card,text,state=''){
    const el=card.querySelector('.card-message');
    el.textContent=text;
    el.className='card-message'+(state?' '+state:'');
  }

  function updateApprovalState(card){
    const selected=card.querySelector('.catalog-select').value;
    const accepted=card.querySelector('.truth-checkbox').checked;
    card.querySelector('.approve-button').disabled=!(selected&&accepted);
  }

  function fillCatalogSelect(select,items,selectedId=''){
    const previous=selectedId||select.value;
    select.innerHTML='<option value="">Select catalog item</option>';
    items.forEach(item=>{
      const option=document.createElement('option');
      option.value=item.id;
      option.textContent=[item.name,item.specification,item.unit].filter(Boolean).join(' · ');
      select.appendChild(option);
    });
    if(previous&&items.some(item=>item.id===previous)) select.value=previous;
  }

  async function searchCatalog(card,query,preferredId=''){
    const select=card.querySelector('.catalog-select');
    setMessage(card,'Searching catalog…');
    try{
      const payload=await api('/api/admin/items?q='+encodeURIComponent(query||''));
      const items=payload?.results||[];
      fillCatalogSelect(select,items,preferredId);
      setMessage(card,items.length?`${items.length} catalog item${items.length===1?'':'s'} found.`:'No catalog item found. Create one below if needed.');
      updateApprovalState(card);
    }catch(error){
      if(error.status===401){
        adminToken='';
        setApiStatus('Session expired or token rejected','error');
      }
      setMessage(card,'Could not load catalog items.','error');
    }
  }

  function renderCard(row){
    const template=$('#reviewCardTemplate');
    const card=template.content.firstElementChild.cloneNode(true);
    card.dataset.requestId=row.id;
    card.querySelector('.request-id').textContent=row.id;
    card.querySelector('.requirement').textContent=row.requirement_text||'Supplier requirement';
    card.querySelector('.supplier').textContent=row.supplier_name||row.supplier_id||'—';
    card.querySelector('.requested-qty').textContent=row.quantity==null?'A confirmar':[row.quantity,row.unit].filter(Boolean).join(' ');
    card.querySelector('.request-location').textContent=row.location||'—';
    card.querySelector('.responded-at').textContent=fmtDate(row.responded_at);

    const answer=safeResponse(row.supplier_response_json);
    const answerBox=card.querySelector('.supplier-answer');
    if(!answer){
      answerBox.dataset.available='unknown';
      card.querySelector('.availability').textContent='Response payload could not be read';
      setMessage(card,'This response requires technical inspection before approval.','error');
    }else{
      answerBox.dataset.available=String(answer.available===true);
      card.querySelector('.availability').textContent=answer.available===true?'Supplier reports availability':'Supplier reports unavailable';
      card.querySelector('.answer-qty').textContent=answer.quantity_reported==null?'Not reported':String(answer.quantity_reported);
      card.querySelector('.answer-price').textContent=answer.price_reported==null?'Not reported':[answer.price_reported,answer.currency].filter(Boolean).join(' ');
      card.querySelector('.answer-lead').textContent=answer.lead_time||'Not reported';
      card.querySelector('.answer-by').textContent=answer.responded_by||'Not reported';
      card.querySelector('.answer-note').textContent=answer.note||'No supplier note.';
    }

    const catalogQuery=card.querySelector('.catalog-query');
    catalogQuery.value=[row.requirement_text,row.specification].filter(Boolean).join(' ');
    card.querySelector('.new-item-name').value=row.requirement_text||'';
    card.querySelector('.new-item-spec').value=row.specification||'';
    card.querySelector('.new-item-unit').value=row.unit||'';

    card.querySelector('.catalog-search-button').addEventListener('click',()=>searchCatalog(card,catalogQuery.value.trim(),row.item_id||''));
    catalogQuery.addEventListener('keydown',event=>{
      if(event.key==='Enter'){
        event.preventDefault();
        searchCatalog(card,catalogQuery.value.trim(),row.item_id||'');
      }
    });
    card.querySelector('.catalog-select').addEventListener('change',()=>updateApprovalState(card));
    card.querySelector('.truth-checkbox').addEventListener('change',()=>updateApprovalState(card));

    card.querySelector('.create-item-button').addEventListener('click',async()=>{
      const name=card.querySelector('.new-item-name').value.trim();
      const category=card.querySelector('.new-item-category').value.trim();
      const specification=card.querySelector('.new-item-spec').value.trim();
      const unit=card.querySelector('.new-item-unit').value.trim();
      if(!name||!category){setMessage(card,'Name and category are required to create a catalog item.','error');return;}
      const button=card.querySelector('.create-item-button');
      button.disabled=true;
      setMessage(card,'Creating normalized catalog item…');
      try{
        const payload=await api('/api/admin/items',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({name,category,specification:specification||null,unit:unit||null,aliases:[]})
        });
        const item=payload?.item;
        if(!item?.id) throw new Error('invalid_item_response');
        const select=card.querySelector('.catalog-select');
        const option=document.createElement('option');
        option.value=item.id;
        option.textContent=[item.name,specification,unit].filter(Boolean).join(' · ');
        select.appendChild(option);
        select.value=item.id;
        card.querySelector('.create-item-panel').open=false;
        setMessage(card,'Catalog item created and selected. Review once more before approval.','success');
        updateApprovalState(card);
      }catch(error){
        if(error.status===401){adminToken='';setApiStatus('Session expired or token rejected','error');}
        setMessage(card,'Could not create the catalog item.','error');
      }finally{button.disabled=false;}
    });

    card.querySelector('.approve-button').addEventListener('click',async()=>{
      const itemId=card.querySelector('.catalog-select').value;
      const checked=card.querySelector('.truth-checkbox').checked;
      if(!itemId||!checked){updateApprovalState(card);return;}
      const reviewer=$('#reviewerName').value.trim()||'HMATIAS review';
      const button=card.querySelector('.approve-button');
      button.disabled=true;
      setMessage(card,'Approving verified observation…');
      try{
        const payload=await api('/api/admin/verification/'+encodeURIComponent(row.id)+'/approve',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({item_id:itemId,reviewer})
        });
        const observation=payload?.observation;
        card.classList.add('approved');
        card.querySelector('.response-status').textContent=observation?.verification_status?.replaceAll('_',' ')||'approved';
        setMessage(card,`Approved. Expires ${fmtDate(observation?.expires_at)}.`,'success');
        pending=pending.filter(item=>item.id!==row.id);
        $('#pendingCount').textContent=String(pending.length);
      }catch(error){
        button.disabled=false;
        if(error.status===409){setMessage(card,'This response was already approved or is no longer pending. Refresh the list.','error');}
        else if(error.status===401){adminToken='';setApiStatus('Session expired or token rejected','error');setMessage(card,'Admin session rejected. Reconnect before approving.','error');}
        else setMessage(card,'Approval failed. No public observation was created.','error');
      }
    });

    if(answer) searchCatalog(card,catalogQuery.value.trim(),row.item_id||'');
    else card.querySelector('.approve-button').disabled=true;
    return card;
  }

  function renderPending(){
    const list=$('#reviewList');
    $('#pendingCount').textContent=String(pending.length);
    list.innerHTML='';
    if(!pending.length){
      list.innerHTML='<div class="empty-state"><strong>No supplier responses awaiting review.</strong><p>Nothing can become verified until a new supplier response arrives.</p></div>';
      return;
    }
    pending.forEach(row=>list.appendChild(renderCard(row)));
  }

  async function loadPending(){
    if(!adminToken) return;
    $('#reviewList').innerHTML='<div class="empty-state"><strong>Loading pending responses…</strong><p>Reading only supplier responses that still require HMATIAS review.</p></div>';
    try{
      const payload=await api('/api/admin/verification-requests?status=supplier_responded');
      pending=payload?.results||[];
      renderPending();
      $('#refreshPending').disabled=false;
      setApiStatus('Connected · review queue loaded','connected');
    }catch(error){
      pending=[];
      $('#pendingCount').textContent='0';
      $('#reviewList').innerHTML='<div class="empty-state"><strong>Could not load review queue.</strong><p>No approval action was performed.</p></div>';
      if(error.status===401){adminToken='';setApiStatus('Token rejected','error');}
      else setApiStatus('API unavailable','error');
    }
  }

  $('#connectApi').addEventListener('click',async()=>{
    const candidate=$('#adminToken').value.trim();
    if(!candidate){setApiStatus('Enter an admin token for this session','error');return;}
    adminToken=candidate;
    $('#adminToken').value='';
    await loadPending();
  });

  $('#refreshPending').addEventListener('click',loadPending);
  window.addEventListener('pagehide',()=>{adminToken='';pending=[];});
  document.addEventListener('DOMContentLoaded',configureSessionUi,{once:true});
})();
