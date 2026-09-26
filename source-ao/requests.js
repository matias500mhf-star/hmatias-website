(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  let adminToken='';
  let requests=[];
  let demand=[];

  const apiBase=()=>String(window.SOURCE_AO_RUNTIME?.apiBase||'').replace(/\/$/,'');

  function setApiStatus(text,state='ready'){
    const el=$('#apiStatus');el.textContent=text;el.dataset.state=state;
  }

  function configure(){
    const base=apiBase();
    $('#apiEndpoint').value=base||'Not configured';
    if(!base){$('#adminToken').disabled=true;$('#connectApi').disabled=true;setApiStatus('API not configured','error');}
  }

  async function api(path,options={}){
    if(!/^https?:\/\//i.test(apiBase())) throw new Error('api_not_configured');
    if(!adminToken) throw new Error('admin_token_required');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(apiBase()+path,{
        ...options,cache:'no-store',signal:controller.signal,
        headers:{accept:'application/json',authorization:`Bearer ${adminToken}`,...(options.headers||{})}
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok){const error=new Error(payload?.error?.code||`http_${response.status}`);error.status=response.status;throw error;}
      return payload;
    }finally{clearTimeout(timeout);}
  }

  function fmtDate(value){
    if(!value) return '—';
    try{return new Intl.DateTimeFormat('pt-AO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return value;}
  }

  function metrics(){
    const open=requests.filter(r=>r.status!=='closed').length;
    $('#openCount').textContent=String(open);
    $('#receivedCount').textContent=String(requests.filter(r=>r.status==='received').length);
    $('#sourcingCount').textContent=String(requests.filter(r=>['sourcing','verifying'].includes(r.status)).length);
    $('#demandCount').textContent=String(demand.length);
  }

  function setCardMessage(card,text,state=''){
    const el=card.querySelector('.request-message');
    el.textContent=text;el.className='request-message'+(state?' '+state:'');
  }

  function renderRequest(row){
    const card=$('#requestTemplate').content.firstElementChild.cloneNode(true);
    card.dataset.requestId=row.id;
    card.querySelector('.reference').textContent=row.reference||row.id;
    card.querySelector('.requirement').textContent=row.requirement_text||'—';
    card.querySelector('.request-status').textContent=(row.status||'received').replaceAll('_',' ');
    card.querySelector('.location').textContent=row.location||'—';
    card.querySelector('.quantity').textContent=row.quantity==null?'A confirmar':[row.quantity,row.unit].filter(Boolean).join(' ');
    card.querySelector('.needed-by').textContent=row.needed_by||'Não indicada';
    card.querySelector('.created-at').textContent=fmtDate(row.created_at);
    card.querySelector('.specification').textContent=row.specification||'A confirmar';
    card.querySelector('.contact').textContent=row.contact||row.contact_hint||'Unavailable';
    card.querySelector('.contact-channel').textContent=row.contact_channel||'private';
    card.querySelector('.status-select').value=row.status||'received';
    card.querySelector('.assigned-to').value=row.assigned_to||'';
    card.querySelector('.internal-notes').value=row.internal_notes||'';

    card.querySelector('.copy-contact').addEventListener('click',async()=>{
      const value=row.contact||'';
      if(!value){setCardMessage(card,'Private contact is not available in this session.','error');return;}
      const button=card.querySelector('.copy-contact');
      try{await navigator.clipboard.writeText(value);button.textContent='Copied';setTimeout(()=>button.textContent='Copy',1200);}catch{setCardMessage(card,'Could not copy contact.','error');}
    });

    card.querySelector('.save-request').addEventListener('click',async()=>{
      const button=card.querySelector('.save-request');
      const status=card.querySelector('.status-select').value;
      const assigned=card.querySelector('.assigned-to').value.trim();
      const notes=card.querySelector('.internal-notes').value.trim();
      button.disabled=true;
      setCardMessage(card,'Saving…');
      try{
        const payload=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/status',{
          method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({status,assigned_to:assigned||null,internal_notes:notes||null})
        });
        row.status=payload?.request?.status||status;
        row.assigned_to=assigned||row.assigned_to;
        row.internal_notes=notes||row.internal_notes;
        row.updated_at=payload?.request?.updated_at||row.updated_at;
        card.querySelector('.request-status').textContent=row.status.replaceAll('_',' ');
        setCardMessage(card,'Saved. Private tracking will show the updated status.','success');
        metrics();
      }catch(error){
        if(error.status===401){adminToken='';setApiStatus('Token rejected','error');$('#refreshRequests').disabled=true;$('#refreshDemand').disabled=true;}
        setCardMessage(card,'Update failed. No status change was recorded.','error');
      }finally{button.disabled=false;}
    });
    return card;
  }

  function renderRequests(){
    const filter=$('#statusFilter').value;
    const visible=filter?requests.filter(r=>r.status===filter):requests;
    const list=$('#requestList');list.innerHTML='';
    if(!visible.length){list.innerHTML='<div class="empty-state"><strong>No requests in this view.</strong><p>Change the filter or wait for a new Source AO request.</p></div>';return;}
    visible.forEach(row=>list.appendChild(renderRequest(row)));
  }

  function renderDemand(){
    const list=$('#demandList');list.innerHTML='';
    if(!demand.length){list.innerHTML='<div class="empty-state"><strong>No aggregated demand yet.</strong><p>Demand signals appear only after sourcing requests exist.</p></div>';return;}
    demand.forEach(row=>{
      const card=document.createElement('article');card.className='demand-card';
      const top=document.createElement('div');top.className='demand-top';
      const copy=document.createElement('div');
      const title=document.createElement('strong');title.textContent=row.normalized_search||'Unclassified demand';
      const category=document.createElement('p');category.textContent=[row.category,row.locations].filter(Boolean).join(' · ');
      copy.append(title,category);
      const count=document.createElement('span');count.className='count';count.textContent=String(row.request_count||0);
      top.append(copy,count);
      const last=document.createElement('small');last.textContent='Last request '+fmtDate(row.last_requested_at);
      card.append(top,last);list.appendChild(card);
    });
  }

  async function loadRequests(){
    if(!adminToken) return;
    $('#requestList').innerHTML='<div class="empty-state"><strong>Loading private request queue…</strong><p>Contacts remain inside the authenticated session only.</p></div>';
    try{
      const payload=await api('/api/admin/sourcing-requests?limit=100');
      requests=payload?.results||[];
      renderRequests();metrics();
      $('#refreshRequests').disabled=false;
    }catch(error){
      requests=[];renderRequests();
      if(error.status===401){adminToken='';setApiStatus('Token rejected','error');}
      else setApiStatus('Could not load requests','error');
    }
  }

  async function loadDemand(){
    if(!adminToken) return;
    try{
      const payload=await api('/api/admin/demand-radar');
      demand=payload?.results||[];
      renderDemand();metrics();
      $('#refreshDemand').disabled=false;
    }catch(error){
      demand=[];renderDemand();metrics();
      if(error.status===401){adminToken='';setApiStatus('Token rejected','error');}
    }
  }

  async function loadAll(){
    await Promise.all([loadRequests(),loadDemand()]);
    if(adminToken) setApiStatus('Connected · private operations loaded','connected');
  }

  $('#connectApi').addEventListener('click',async()=>{
    const candidate=$('#adminToken').value.trim();
    if(!candidate){setApiStatus('Enter an admin token','error');return;}
    adminToken=candidate;$('#adminToken').value='';await loadAll();
  });
  $('#refreshRequests').addEventListener('click',loadRequests);
  $('#refreshDemand').addEventListener('click',loadDemand);
  $('#statusFilter').addEventListener('change',renderRequests);
  window.addEventListener('pagehide',()=>{adminToken='';requests=[];demand=[];});
  document.addEventListener('DOMContentLoaded',configure,{once:true});
})();
