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

  function setInternalAccess(unlocked){
    document.body.classList.toggle('internal-locked',!unlocked);
  }

  function configure(){
    setInternalAccess(false);
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
    const open=requests.filter(r=>!['closed','completed'].includes(r.status)).length;
    $('#openCount').textContent=String(open);
    $('#receivedCount').textContent=String(requests.filter(r=>r.status==='received').length);
    $('#sourcingCount').textContent=String(requests.filter(r=>['sourcing','verifying'].includes(r.status)).length);
    $('#demandCount').textContent=String(demand.length);
  }

  function setCardMessage(card,text,state=''){
    const el=card.querySelector('.request-message');
    el.textContent=text;el.className='request-message'+(state?' '+state:'');
  }


  function fmtMoney(value){
    if(value==null||value==='') return '—';
    const n=Number(value);
    if(!Number.isFinite(n)) return '—';
    return n.toLocaleString('pt-AO',{maximumFractionDigits:2})+' Kz';
  }

  function addOption(select,value,label,selected=false){
    const option=document.createElement('option');
    option.value=value;option.textContent=label;option.selected=selected;
    select.appendChild(option);
  }

  function supplierMap(payload){
    const map=new Map();
    for(const supplier of payload?.supplier_candidates||[])map.set(supplier.id,supplier);
    for(const cost of payload?.cost_options||[]){
      if(!map.has(cost.supplier_id))map.set(cost.supplier_id,{
        id:cost.supplier_id,
        name:cost.supplier_name||cost.supplier_id,
        country_code:cost.supplier_country_code||'',
        match_score:null,
        quality_status:''
      });
    }
    return map;
  }

  function renderCommercialCase(card,row,payload){
    const panel=card.querySelector('.commercial-case-panel');
    panel.hidden=false;
    panel.innerHTML=`
      <div class="commercial-head">
        <div><small>CASO COMERCIAL HMATIAS</small><h4>Qualificação → custo → margem → proposta</h4></div>
        <span class="commercial-readiness"></span>
      </div>
      <div class="commercial-summary">
        <article><small>CUSTO LANDED</small><strong class="summary-landed">—</strong></article>
        <article><small>PREÇO VENDA</small><strong class="summary-sale">—</strong></article>
        <article><small>LUCRO BRUTO</small><strong class="summary-profit">—</strong></article>
        <article><small>MARGEM BRUTA</small><strong class="summary-margin">—</strong></article>
      </div>
      <div class="commercial-grid">
        <label>Qualificação<select class="case-qualification"><option value="pending">Pendente</option><option value="qualified">Qualificado</option><option value="needs_info">Falta informação</option><option value="declined">Não avançar</option></select></label>
        <label>Fornecedor selecionado<select class="case-supplier"><option value="">A confirmar</option></select></label>
        <label>Custo selecionado<select class="case-cost"><option value="">A confirmar</option></select></label>
        <label>Preço de venda (AOA)<input class="case-sale" type="number" min="0" step="0.01" placeholder="Introduzir preço real"></label>
        <label>Estado da proposta<select class="case-proposal-status"><option value="not_ready">Não pronta</option><option value="ready">Pronta</option><option value="sent">Enviada</option><option value="revised">Revista</option><option value="accepted">Aceite</option><option value="rejected">Rejeitada</option><option value="expired">Expirada</option></select></label>
        <label>Referência proposta<input class="case-proposal-ref" maxlength="160" placeholder="Ex.: PROP-2026-..."></label>
        <label class="commercial-notes">Notas internas<textarea class="case-notes" rows="2" maxlength="1600" placeholder="Decisões, riscos e próximos passos"></textarea></label>
      </div>
      <div class="commercial-actions">
        <button class="btn btn-primary btn-small save-commercial-case" type="button">Guardar caso comercial</button>
        <span class="commercial-message"></span>
      </div>
      <section class="proposal-builder">
        <div class="proposal-builder-head">
          <div><small>PROPOSTA COMERCIAL</small><h4>Rascunho seguro para cliente</h4><p>Usa apenas dados confirmados. Fornecedor, custo interno, lucro e margem não entram na proposta.</p></div>
          <button class="btn btn-outline btn-small generate-proposal" type="button">Gerar rascunho</button>
        </div>
        <div class="proposal-preview" hidden>
          <textarea class="proposal-text" rows="16" readonly aria-label="Rascunho da proposta comercial"></textarea>
          <div class="proposal-preview-actions">
            <button class="btn btn-primary btn-small copy-proposal" type="button">Copiar proposta</button>
            <small>Prazo, validade e pagamento permanecem “A confirmar” até serem definidos pela HMATIAS.</small>
          </div>
        </div>
      </section>
      <div class="cost-divider"></div>
      <div class="cost-head"><div><small>CUSTOS DE FORNECEDOR</small><h4>Opções privadas de custo</h4></div><button class="btn btn-outline btn-small new-cost-option" type="button">Novo custo</button></div>
      <form class="cost-form">
        <input class="cost-id" type="hidden">
        <label>Fornecedor<select class="cost-supplier" required><option value="">Selecionar fornecedor</option></select></label>
        <label>Ref. cotação<input class="cost-quote-ref" maxlength="160" placeholder="Cotação / e-mail / WhatsApp"></label>
        <label>Moeda<select class="cost-currency"><option value="AOA">AOA</option><option value="NAD">NAD</option><option value="ZAR">ZAR</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
        <label>Custo material total<input class="cost-material" type="number" min="0" step="0.01" required></label>
        <label>Transporte<input class="cost-transport" type="number" min="0" step="0.01" value="0"></label>
        <label>Alfândega<input class="cost-customs" type="number" min="0" step="0.01" value="0"></label>
        <label>Impostos/taxas<input class="cost-tax" type="number" min="0" step="0.01" value="0"></label>
        <label>Outros custos<input class="cost-other" type="number" min="0" step="0.01" value="0"></label>
        <label>Contingência<input class="cost-contingency" type="number" min="0" step="0.01" value="0"></label>
        <label>Câmbio → AOA<input class="cost-fx" type="number" min="0.0000001" step="0.0001" value="1"></label>
        <label>Estado<select class="cost-status"><option value="draft">Rascunho</option><option value="verified">Confirmado</option><option value="selected">Selecionado</option><option value="rejected">Rejeitado</option><option value="expired">Expirado</option></select></label>
        <label>Verificado em<input class="cost-verified-at" type="datetime-local"></label>
        <label class="commercial-notes">Notas custo<textarea class="cost-notes" rows="2" maxlength="1200" placeholder="Prazo, MOQ, condição, validade, logística"></textarea></label>
        <div class="cost-form-actions"><button class="btn btn-primary btn-small save-cost-option" type="submit">Guardar custo</button><small>Não são assumidos preços, câmbio, impostos ou transporte automaticamente.</small></div>
      </form>
      <div class="cost-option-list"></div>
    `;

    const commercial=payload?.commercial_case||{};
    const summary=payload?.summary||{};
    const suppliers=supplierMap(payload);
    const supplierSelect=panel.querySelector('.case-supplier');
    const costSupplier=panel.querySelector('.cost-supplier');
    for(const supplier of suppliers.values()){
      const suffix=[supplier.country_code,supplier.match_score==null?'':('match '+supplier.match_score+'/100')].filter(Boolean).join(' · ');
      const label=supplier.name+(suffix?' · '+suffix:'');
      addOption(supplierSelect,supplier.id,label,supplier.id===commercial.selected_supplier_id);
      addOption(costSupplier,supplier.id,label,false);
    }

    const costSelect=panel.querySelector('.case-cost');
    for(const cost of payload?.cost_options||[]){
      if(['rejected','expired'].includes(cost.status))continue;
      const label=[cost.supplier_name||cost.supplier_id,cost.status,cost.landed_cost_aoa==null?'FX/custo incompleto':fmtMoney(cost.landed_cost_aoa)].join(' · ');
      addOption(costSelect,cost.id,label,cost.id===commercial.selected_cost_option_id);
    }

    panel.querySelector('.case-qualification').value=commercial.qualification_status||'pending';
    panel.querySelector('.case-sale').value=commercial.sale_price_aoa??'';
    panel.querySelector('.case-proposal-status').value=commercial.proposal_status||'not_ready';
    panel.querySelector('.case-proposal-ref').value=commercial.proposal_ref||'';
    panel.querySelector('.case-notes').value=commercial.internal_notes||'';
    panel.querySelector('.summary-landed').textContent=fmtMoney(summary.landed_cost_aoa);
    panel.querySelector('.summary-sale').textContent=fmtMoney(summary.sale_price_aoa);
    panel.querySelector('.summary-profit').textContent=fmtMoney(summary.gross_profit_aoa);
    panel.querySelector('.summary-margin').textContent=summary.gross_margin_pct==null?'—':summary.gross_margin_pct.toLocaleString('pt-AO',{maximumFractionDigits:2})+'%';
    if(summary.margin_alert==='negative_margin')panel.querySelector('.summary-profit').classList.add('negative');

    const readiness=panel.querySelector('.commercial-readiness');
    const missingLabels={qualification_not_complete:'qualificação',selected_cost_required:'custo selecionado',verified_cost_required:'custo confirmado',fx_or_cost_required:'câmbio/custo',sale_price_required:'preço de venda'};
    readiness.textContent=summary.proposal_ready?'Pronto para proposta':'Falta: '+(summary.missing_requirements||[]).map(x=>missingLabels[x]||x).join(', ');
    readiness.dataset.ready=summary.proposal_ready?'true':'false';

    const proposalButton=panel.querySelector('.generate-proposal');
    proposalButton.disabled=!summary.proposal_ready;
    proposalButton.textContent=summary.proposal_ready?'Gerar rascunho':'Complete o caso primeiro';
    proposalButton.addEventListener('click',async()=>{
      const preview=panel.querySelector('.proposal-preview');
      const textarea=panel.querySelector('.proposal-text');
      proposalButton.disabled=true;
      proposalButton.textContent='A gerar…';
      try{
        const proposal=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/proposal-draft');
        if(!proposal?.ready||!proposal?.draft?.text){
          throw new Error('proposal_not_ready');
        }
        textarea.value=proposal.draft.text;
        preview.hidden=false;
        proposalButton.textContent='Atualizar rascunho';
      }catch(error){
        preview.hidden=false;
        textarea.value=error.message==='proposal_not_ready'
          ?'O caso comercial ainda não reúne os dados mínimos para gerar uma proposta.'
          :'Não foi possível gerar o rascunho da proposta.';
        proposalButton.textContent='Tentar novamente';
      }finally{
        proposalButton.disabled=false;
      }
    });

    panel.querySelector('.copy-proposal').addEventListener('click',async()=>{
      const button=panel.querySelector('.copy-proposal');
      const text=panel.querySelector('.proposal-text').value;
      if(!text)return;
      try{
        await navigator.clipboard.writeText(text);
        button.textContent='Copiada';
        setTimeout(()=>button.textContent='Copiar proposta',1200);
      }catch{
        const message=panel.querySelector('.commercial-message');
        message.textContent='Não foi possível copiar a proposta.';
        message.className='commercial-message error';
      }
    });

    const list=panel.querySelector('.cost-option-list');
    if(!(payload?.cost_options||[]).length){
      list.innerHTML='<div class="empty-state compact"><strong>Sem custos registados.</strong><p>Adicione uma cotação real de fornecedor para começar o cálculo.</p></div>';
    }else{
      for(const cost of payload.cost_options){
        const item=document.createElement('article');item.className='cost-option-card';
        const head=document.createElement('div');head.className='cost-option-top';
        const main=document.createElement('div');
        const name=document.createElement('strong');name.textContent=cost.supplier_name||cost.supplier_id;
        const meta=document.createElement('small');meta.textContent=[cost.currency,cost.status,cost.supplier_quote_ref].filter(Boolean).join(' · ');
        main.append(name,meta);
        const total=document.createElement('strong');total.textContent=cost.landed_cost_aoa==null?'FX em falta':fmtMoney(cost.landed_cost_aoa);
        head.append(main,total);
        const detail=document.createElement('p');detail.textContent='Base '+Number(cost.source_total||0).toLocaleString('pt-AO',{maximumFractionDigits:2})+' '+cost.currency+(cost.fx_rate_to_aoa?' · câmbio '+cost.fx_rate_to_aoa:'')+(cost.cost_verified_at?' · verificado '+fmtDate(cost.cost_verified_at):'');
        const edit=document.createElement('button');edit.type='button';edit.className='btn btn-outline btn-small';edit.textContent='Editar custo';
        edit.addEventListener('click',()=>{
          panel.querySelector('.cost-id').value=cost.id;
          panel.querySelector('.cost-supplier').value=cost.supplier_id;
          panel.querySelector('.cost-quote-ref').value=cost.supplier_quote_ref||'';
          panel.querySelector('.cost-currency').value=cost.currency||'AOA';
          panel.querySelector('.cost-material').value=cost.material_cost??0;
          panel.querySelector('.cost-transport').value=cost.transport_cost??0;
          panel.querySelector('.cost-customs').value=cost.customs_cost??0;
          panel.querySelector('.cost-tax').value=cost.tax_cost??0;
          panel.querySelector('.cost-other').value=cost.other_cost??0;
          panel.querySelector('.cost-contingency').value=cost.contingency_cost??0;
          panel.querySelector('.cost-fx').value=cost.fx_rate_to_aoa??'';
          panel.querySelector('.cost-status').value=cost.status||'draft';
          panel.querySelector('.cost-verified-at').value=cost.cost_verified_at?String(cost.cost_verified_at).slice(0,16):'';
          panel.querySelector('.cost-notes').value=cost.notes||'';
          panel.querySelector('.cost-form').scrollIntoView({behavior:'smooth',block:'nearest'});
        });
        item.append(head,detail,edit);list.appendChild(item);
      }
    }

    const syncFx=()=>{
      const aoa=panel.querySelector('.cost-currency').value==='AOA';
      const fx=panel.querySelector('.cost-fx');
      fx.disabled=aoa;
      if(aoa)fx.value='1';
      else if(fx.value==='1')fx.value='';
    };
    panel.querySelector('.cost-currency').addEventListener('change',syncFx);syncFx();

    panel.querySelector('.new-cost-option').addEventListener('click',()=>{
      const form=panel.querySelector('.cost-form');form.reset();
      panel.querySelector('.cost-id').value='';
      panel.querySelector('.cost-transport').value='0';
      panel.querySelector('.cost-customs').value='0';
      panel.querySelector('.cost-tax').value='0';
      panel.querySelector('.cost-other').value='0';
      panel.querySelector('.cost-contingency').value='0';
      panel.querySelector('.cost-currency').value='AOA';
      syncFx();
    });

    costSelect.addEventListener('change',()=>{
      const chosen=(payload?.cost_options||[]).find(cost=>cost.id===costSelect.value);
      if(chosen)supplierSelect.value=chosen.supplier_id;
    });

    panel.querySelector('.save-commercial-case').addEventListener('click',async()=>{
      const button=panel.querySelector('.save-commercial-case');
      const message=panel.querySelector('.commercial-message');
      button.disabled=true;message.textContent='A guardar…';message.className='commercial-message';
      try{
        const saved=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/commercial-case',{
          method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
            qualification_status:panel.querySelector('.case-qualification').value,
            selected_supplier_id:panel.querySelector('.case-supplier').value||null,
            selected_cost_option_id:panel.querySelector('.case-cost').value||null,
            sale_price_aoa:panel.querySelector('.case-sale').value===''?null:Number(panel.querySelector('.case-sale').value),
            proposal_status:panel.querySelector('.case-proposal-status').value,
            proposal_ref:panel.querySelector('.case-proposal-ref').value.trim()||null,
            internal_notes:panel.querySelector('.case-notes').value.trim()||null
          })
        });
        renderCommercialCase(card,row,saved);
      }catch(error){
        message.textContent=error.message==='proposal_not_ready'?'A proposta ainda não está pronta: confirme qualificação, custo e preço.':'Falha ao guardar o caso comercial.';
        message.className='commercial-message error';
      }finally{button.disabled=false;}
    });

    panel.querySelector('.cost-form').addEventListener('submit',async event=>{
      event.preventDefault();
      const button=panel.querySelector('.save-cost-option');
      button.disabled=true;
      try{
        const verifiedValue=panel.querySelector('.cost-verified-at').value;
        const saved=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/cost-options',{
          method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
            id:panel.querySelector('.cost-id').value||undefined,
            supplier_id:panel.querySelector('.cost-supplier').value,
            supplier_quote_ref:panel.querySelector('.cost-quote-ref').value.trim()||null,
            currency:panel.querySelector('.cost-currency').value,
            material_cost:Number(panel.querySelector('.cost-material').value||0),
            transport_cost:Number(panel.querySelector('.cost-transport').value||0),
            customs_cost:Number(panel.querySelector('.cost-customs').value||0),
            tax_cost:Number(panel.querySelector('.cost-tax').value||0),
            other_cost:Number(panel.querySelector('.cost-other').value||0),
            contingency_cost:Number(panel.querySelector('.cost-contingency').value||0),
            fx_rate_to_aoa:panel.querySelector('.cost-currency').value==='AOA'?1:(panel.querySelector('.cost-fx').value?Number(panel.querySelector('.cost-fx').value):null),
            status:panel.querySelector('.cost-status').value,
            cost_verified_at:verifiedValue?new Date(verifiedValue).toISOString():null,
            notes:panel.querySelector('.cost-notes').value.trim()||null
          })
        });
        renderCommercialCase(card,row,saved);
      }catch(error){
        const message=panel.querySelector('.commercial-message');
        message.textContent=error.message==='fx_rate_required'?'Indique o câmbio para AOA antes de confirmar este custo.':'Falha ao guardar o custo.';
        message.className='commercial-message error';
      }finally{button.disabled=false;}
    });
  }

  async function loadCommercialCase(card,row){
    const button=card.querySelector('.open-commercial-case');
    const panel=card.querySelector('.commercial-case-panel');
    button.disabled=true;button.textContent='A carregar…';
    try{
      const payload=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/commercial-case');
      renderCommercialCase(card,row,payload);
      button.textContent='Atualizar caso comercial';
    }catch(error){
      panel.hidden=false;
      panel.innerHTML='<div class="empty-state compact"><strong>Não foi possível carregar o caso comercial.</strong><p>Confirme a sessão privada e tente novamente.</p></div>';
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
    }finally{button.disabled=false;}
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
    if(row.rfq){
      const rfq=row.rfq;card.querySelector('.rfq-qualification').hidden=false;
      const labels={company:'Empresa',individual:'Particular',institution:'Instituição',ready:'Compra após aprovação',budgeting:'Consulta de orçamento',recurring:'Fornecimento recorrente',urgent:'Urgente',normal:'Prazo normal',planned:'Compra programada',yes:'Aceita equivalentes',no:'Referência exata',discuss:'Consultar antes de substituir'};
      card.querySelector('.rfq-buyer').textContent=[rfq.requester_name,rfq.company,labels[rfq.buyer_type]].filter(Boolean).join(' · ');
      for(const item of rfq.items||[]){const li=document.createElement('li');li.textContent=`${item.quantity} ${item.unit} · ${item.description}${item.specification?' — '+item.specification:''}`;card.querySelector('.rfq-lines').append(li);}
      card.querySelector('.rfq-conditions').textContent=[labels[rfq.intent],labels[rfq.urgency],labels[rfq.alternatives],rfq.budget==null?'Orçamento a confirmar':Number(rfq.budget).toLocaleString('pt-AO')+' Kz',rfq.origin].filter(Boolean).join(' · ');
      card.querySelector('.rfq-notes').textContent=rfq.notes||'';
    }

    card.querySelector('.open-commercial-case').addEventListener('click',()=>loadCommercialCase(card,row));

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
        if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');$('#refreshRequests').disabled=true;$('#refreshDemand').disabled=true;}
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
    if(!adminToken) return false;
    $('#requestList').innerHTML='<div class="empty-state"><strong>Loading private request queue…</strong><p>Contacts remain inside the authenticated session only.</p></div>';
    try{
      const payload=await api('/api/admin/sourcing-requests?limit=100');
      requests=payload?.results||[];
      renderRequests();metrics();
      $('#refreshRequests').disabled=false;
      return true;
    }catch(error){
      requests=[];renderRequests();
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      else setApiStatus('Could not load requests','error');
      return false;
    }
  }

  async function loadDemand(){
    if(!adminToken) return false;
    try{
      const payload=await api('/api/admin/demand-radar');
      demand=payload?.results||[];
      renderDemand();metrics();
      $('#refreshDemand').disabled=false;
      return true;
    }catch(error){
      demand=[];renderDemand();metrics();
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      return false;
    }
  }

  async function loadAll(){
    const [requestsOk,demandOk]=await Promise.all([loadRequests(),loadDemand()]);
    const authorized=Boolean(adminToken&&requestsOk&&demandOk);
    setInternalAccess(authorized);
    if(authorized)setApiStatus('Connected · private operations loaded','connected');
    return authorized;
  }

  $('#connectApi').addEventListener('click',async()=>{
    const candidate=$('#adminToken').value.trim();
    if(!candidate){setInternalAccess(false);setApiStatus('Enter an admin token','error');return;}
    adminToken=candidate;
    $('#adminToken').value='';
    setApiStatus('Checking admin access…','ready');
    await loadAll();
  });
  $('#refreshRequests').addEventListener('click',loadRequests);
  $('#refreshDemand').addEventListener('click',loadDemand);
  $('#statusFilter').addEventListener('change',renderRequests);
  window.addEventListener('pagehide',()=>{adminToken='';requests=[];demand=[];});
  document.addEventListener('DOMContentLoaded',configure,{once:true});
})();
