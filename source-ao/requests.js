(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  let adminToken='';
  let requests=[];
  let demand=[];
  let commercialDashboard=null;

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

  function renderCommercialDashboard(){
    const d=commercialDashboard;
    if(!d){
      $('#proposalPipelineValue').textContent='—';
      $('#acceptedValue').textContent='—';
      $('#realizedRevenue').textContent='—';
      $('#realizedProfit').textContent='—';
      $('#proposalCounts').textContent='—';
      $('#acceptedCount').textContent='—';
      $('#realizedMargin').textContent='—';
      $('#cockpitInvoiced').textContent='—';
      $('#cockpitReceived').textContent='—';
      $('#cockpitOutstanding').textContent='—';
      $('#cockpitOverdue').textContent='—';
      $('#cockpitOverdueCount').textContent='—';
      $('#cockpitAsOf').textContent='Unavailable';
      for(const id of ['cockpitActive','cockpitTriage','cockpitAwarded','cockpitPurchased','cockpitDelivered','cockpitCompleted'])$('#'+id).textContent='—';
      return;
    }
    $('#proposalPipelineValue').textContent=fmtMoney(d.proposals?.pipeline_value_aoa);
    $('#acceptedValue').textContent=fmtMoney(d.proposals?.accepted_value_aoa);
    $('#realizedRevenue').textContent=fmtMoney(d.execution?.completed_revenue_aoa);
    $('#realizedProfit').textContent=fmtMoney(d.execution?.realized_gross_profit_aoa);
    $('#proposalCounts').textContent=(d.proposals?.ready_count||0)+' ready/revised · '+(d.proposals?.sent_count||0)+' sent';
    $('#acceptedCount').textContent=(d.proposals?.accepted_count||0)+' propostas aceites';
    $('#realizedMargin').textContent=d.execution?.realized_gross_margin_pct==null?'Margem: —':'Margem: '+d.execution.realized_gross_margin_pct.toLocaleString('pt-AO',{maximumFractionDigits:2})+'%';
    $('#cockpitActive').textContent=String(d.requests?.active||0);
    $('#cockpitTriage').textContent=String(d.requests?.awaiting_triage||0);
    $('#cockpitAwarded').textContent=String(d.execution?.by_stage?.awarded||0);
    $('#cockpitPurchased').textContent=String(d.execution?.by_stage?.purchased||0);
    $('#cockpitDelivered').textContent=String(d.execution?.by_stage?.delivered||0);
    $('#cockpitCompleted').textContent=String(d.execution?.by_stage?.completed||0);
    $('#cockpitInvoiced').textContent=fmtMoney(d.collections?.invoiced_aoa);
    $('#cockpitReceived').textContent=fmtMoney(d.collections?.received_aoa);
    $('#cockpitOutstanding').textContent=fmtMoney(d.collections?.outstanding_aoa);
    $('#cockpitOverdue').textContent=fmtMoney(d.collections?.overdue_aoa);
    $('#cockpitOverdueCount').textContent=(d.collections?.overdue_count||0)+' vencida(s) · '+(d.collections?.paid_count||0)+' paga(s)';
    $('#cockpitAsOf').textContent=d.as_of?'Atualizado '+fmtDate(d.as_of):'Atualizado';
    $('#realizedProfit').classList.toggle('negative',Number(d.execution?.realized_gross_profit_aoa)<0);
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
        <label>Validade (dias)<input class="case-validity" type="number" min="1" max="365" step="1" placeholder="Ex.: 15"></label>
        <label>Condições de pagamento<input class="case-payment-terms" maxlength="500" placeholder="Ex.: 50% adjudicação, 50% entrega"></label>
        <label>Condições de entrega<input class="case-delivery-terms" maxlength="500" placeholder="Prazo/local/condições confirmadas"></label>
        <label>Tratamento fiscal<input class="case-tax-treatment" maxlength="500" placeholder="Indicar IVA/impostos conforme proposta"></label>
        <label class="commercial-notes">Notas visíveis ao cliente<textarea class="case-customer-notes" rows="2" maxlength="1200" placeholder="Observações comerciais que podem constar da proposta"></textarea></label>
        <label class="commercial-notes">Notas internas<textarea class="case-notes" rows="2" maxlength="1600" placeholder="Decisões, riscos e próximos passos"></textarea></label>
      </div>
      <div class="commercial-actions">
        <button class="btn btn-primary btn-small save-commercial-case" type="button">Guardar caso comercial</button>
        <button class="btn btn-outline btn-small generate-proposal-draft" type="button">Preparar resumo de proposta</button>
        <span class="commercial-message"></span>
      </div>
      <section class="proposal-preview" hidden></section>
      <section class="fulfillment-block">
        <div class="fulfillment-head">
          <div>
            <small>EXECUÇÃO COMERCIAL</small>
            <h4>Adjudicação → compra → entrega → lucro realizado</h4>
            <p>Registe apenas valores reais confirmados. Um campo de custo vazio significa desconhecido; introduza 0 quando o custo real não existir.</p>
          </div>
          <button class="btn btn-outline btn-small open-fulfillment" type="button">Abrir execução</button>
        </div>
        <section class="fulfillment-panel" hidden aria-live="polite"></section>
      </section>
      <section class="collections-block">
        <div class="collections-head">
          <div>
            <small>COBRANÇA & CAIXA</small>
            <h4>Fatura → pagamentos → saldo → atraso</h4>
            <p>Receita final não é tratada como dinheiro recebido. Cada pagamento exige referência, valor e data confirmados.</p>
          </div>
          <button class="btn btn-outline btn-small open-collections" type="button">Abrir cobrança</button>
        </div>
        <section class="collections-panel" hidden aria-live="polite"></section>
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
    panel.querySelector('.case-validity').value=commercial.proposal_validity_days??'';
    panel.querySelector('.case-payment-terms').value=commercial.proposal_payment_terms||'';
    panel.querySelector('.case-delivery-terms').value=commercial.proposal_delivery_terms||'';
    panel.querySelector('.case-tax-treatment').value=commercial.proposal_tax_treatment||'';
    panel.querySelector('.case-customer-notes').value=commercial.proposal_customer_notes||'';
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
            proposal_validity_days:panel.querySelector('.case-validity').value===''?null:Number(panel.querySelector('.case-validity').value),
            proposal_payment_terms:panel.querySelector('.case-payment-terms').value.trim()||null,
            proposal_delivery_terms:panel.querySelector('.case-delivery-terms').value.trim()||null,
            proposal_tax_treatment:panel.querySelector('.case-tax-treatment').value.trim()||null,
            proposal_customer_notes:panel.querySelector('.case-customer-notes').value.trim()||null,
            internal_notes:panel.querySelector('.case-notes').value.trim()||null
          })
        });
        renderCommercialCase(card,row,saved);
      }catch(error){
        message.textContent=error.message==='proposal_not_ready'?'A proposta ainda não está pronta: confirme qualificação, custo e preço.':'Falha ao guardar o caso comercial.';
        message.className='commercial-message error';
      }finally{button.disabled=false;}
    });

    panel.querySelector('.open-fulfillment').addEventListener('click',()=>loadFulfillment(card,row,panel));
    panel.querySelector('.open-collections').addEventListener('click',()=>loadCollections(card,row,panel));

    panel.querySelector('.generate-proposal-draft').addEventListener('click',async()=>{
      const button=panel.querySelector('.generate-proposal-draft');
      const preview=panel.querySelector('.proposal-preview');
      button.disabled=true;button.textContent='A preparar…';
      try{
        const proposal=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/proposal-draft');
        preview.hidden=false;preview.innerHTML='';
        const head=document.createElement('div');head.className='proposal-preview-head';
        const title=document.createElement('div');
        const eyebrow=document.createElement('small');eyebrow.textContent='RESUMO DE PROPOSTA · CLIENTE';
        const strong=document.createElement('strong');strong.textContent=proposal?.draft?.proposal_reference||'Referência por definir';
        title.append(eyebrow,strong);
        const state=document.createElement('span');state.dataset.ready=proposal?.issuance_ready?'true':'false';
        state.textContent=proposal?.issuance_ready?'Pronto para emissão':'Incompleto';head.append(title,state);
        const body=document.createElement('div');body.className='proposal-preview-body';
        const line=(label,value)=>{const wrap=document.createElement('div');const l=document.createElement('small');l.textContent=label;const v=document.createElement('strong');v.textContent=value||'A confirmar';wrap.append(l,v);return wrap;};
        const draft=proposal?.draft||{};
        body.append(
          line('Cliente',[draft.customer_name,draft.company].filter(Boolean).join(' · ')),
          line('Pedido',draft.source_request_reference),
          line('Entrega',draft.delivery_location),
          line('Preço total',fmtMoney(draft.total_price_aoa)),
          line('Validade',draft.terms?.validity_days?draft.terms.validity_days+' dias':null),
          line('Pagamento',draft.terms?.payment_terms),
          line('Condições de entrega',draft.terms?.delivery_terms),
          line('Tratamento fiscal',draft.terms?.tax_treatment)
        );
        const items=document.createElement('ol');items.className='proposal-preview-items';
        for(const item of draft.items||[]){
          const li=document.createElement('li');
          li.textContent=[item.quantity,item.unit,item.description,item.specification].filter(v=>v!==null&&v!==undefined&&v!=='').join(' · ');
          items.appendChild(li);
        }
        const notes=document.createElement('p');notes.className='proposal-preview-notes';notes.textContent=draft.customer_notes||'';
        const missing=document.createElement('p');missing.className='proposal-preview-missing';
        const labels={commercial_case_not_ready:'caso comercial',proposal_reference_required:'referência',validity_required:'validade',payment_terms_required:'pagamento',delivery_terms_required:'entrega',tax_treatment_required:'fiscalidade'};
        if(!proposal?.issuance_ready)missing.textContent='Falta confirmar: '+(proposal?.missing_requirements||[]).map(x=>labels[x]||x).join(', ')+'.';
        const copy=document.createElement('button');copy.type='button';copy.className='btn btn-outline btn-small';copy.textContent='Copiar resumo';copy.disabled=!proposal?.issuance_ready;
        copy.addEventListener('click',async()=>{
          const summaryText=[
            draft.proposal_reference,
            [draft.customer_name,draft.company].filter(Boolean).join(' · '),
            'Ref. pedido: '+(draft.source_request_reference||'—'),
            ...(draft.items||[]).map(item=>[item.quantity,item.unit,item.description,item.specification].filter(v=>v!==null&&v!==undefined&&v!=='').join(' · ')),
            'Entrega: '+(draft.delivery_location||'A confirmar'),
            'Preço total: '+fmtMoney(draft.total_price_aoa),
            'Validade: '+(draft.terms?.validity_days?draft.terms.validity_days+' dias':'A confirmar'),
            'Pagamento: '+(draft.terms?.payment_terms||'A confirmar'),
            'Condições de entrega: '+(draft.terms?.delivery_terms||'A confirmar'),
            'Tratamento fiscal: '+(draft.terms?.tax_treatment||'A confirmar'),
            draft.customer_notes||''
          ].filter(Boolean).join('\n');
          try{await navigator.clipboard.writeText(summaryText);copy.textContent='Copiado';setTimeout(()=>copy.textContent='Copiar resumo',1200);}catch{copy.textContent='Falha ao copiar';}
        });
        preview.append(head,body,items,notes,missing,copy);
      }catch(error){
        preview.hidden=false;preview.innerHTML='<div class="empty-state compact"><strong>Resumo de proposta indisponível.</strong><p>Guarde primeiro os dados comerciais e tente novamente.</p></div>';
      }finally{button.disabled=false;button.textContent='Preparar resumo de proposta';}
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


  function toLocalDateTime(value){
    if(!value)return '';
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return '';
    const pad=n=>String(n).padStart(2,'0');
    return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes());
  }

  function fulfillmentDate(value){
    if(!value)return null;
    const date=new Date(value);
    return Number.isNaN(date.getTime())?null:date.toISOString();
  }

  function renderFulfillment(card,row,commercialPanel,payload){
    const panel=commercialPanel.querySelector('.fulfillment-panel');
    panel.hidden=false;
    const f=payload?.fulfillment||{};
    const s=payload?.summary||{};
    panel.innerHTML=`
      <div class="fulfillment-statusbar">
        <span>Proposta: <strong class="fulfillment-proposal-state"></strong></span>
        <span>Execução: <strong class="fulfillment-stage-state"></strong></span>
      </div>
      <div class="fulfillment-summary">
        <article><small>CUSTO REAL TOTAL</small><strong class="fulfillment-total-cost">—</strong></article>
        <article><small>RECEITA FINAL</small><strong class="fulfillment-revenue">—</strong></article>
        <article><small>LUCRO REALIZADO</small><strong class="fulfillment-profit">—</strong></article>
        <article><small>MARGEM REALIZADA</small><strong class="fulfillment-margin">—</strong></article>
      </div>
      <div class="fulfillment-grid">
        <label>Etapa<select class="fulfillment-stage"><option value="pending">Pendente</option><option value="awarded">Adjudicado</option><option value="purchased">Comprado</option><option value="delivered">Entregue</option><option value="completed">Concluído</option></select></label>
        <label>Ref. adjudicação<input class="fulfillment-award-ref" maxlength="160" placeholder="Contrato / PO cliente / adjudicação"></label>
        <label>Data adjudicação<input class="fulfillment-awarded-at" type="datetime-local"></label>
        <label>Ref. compra<input class="fulfillment-purchase-ref" maxlength="160" placeholder="PO fornecedor / compra"></label>
        <label>Data compra<input class="fulfillment-purchased-at" type="datetime-local"></label>
        <label>Custo real material (AOA)<input class="fulfillment-material" type="number" min="0" step="0.01" placeholder="0 ou valor real"></label>
        <label>Transporte real (AOA)<input class="fulfillment-transport" type="number" min="0" step="0.01" placeholder="0 ou valor real"></label>
        <label>Alfândega real (AOA)<input class="fulfillment-customs" type="number" min="0" step="0.01" placeholder="0 ou valor real"></label>
        <label>Impostos/taxas reais (AOA)<input class="fulfillment-tax" type="number" min="0" step="0.01" placeholder="0 ou valor real"></label>
        <label>Outros custos reais (AOA)<input class="fulfillment-other" type="number" min="0" step="0.01" placeholder="0 ou valor real"></label>
        <label>Ref. entrega<input class="fulfillment-delivery-ref" maxlength="160" placeholder="Guia / receção / entrega"></label>
        <label>Data entrega<input class="fulfillment-delivered-at" type="datetime-local"></label>
        <label>Receita final (AOA)<input class="fulfillment-final-revenue" type="number" min="0" step="0.01" placeholder="Valor final faturado/aceite"></label>
        <label class="commercial-notes">Notas internas<textarea class="fulfillment-notes" rows="2" maxlength="1600" placeholder="Ocorrências, confirmação de entrega, desvios e fecho"></textarea></label>
      </div>
      <div class="fulfillment-actions">
        <button class="btn btn-primary btn-small save-fulfillment" type="button">Guardar execução</button>
        <span class="fulfillment-message"></span>
      </div>
      <p class="fulfillment-truth-note">O lucro realizado não usa estimativas. Só é calculado após custos reais completos, receita final explícita e entrega registada.</p>
    `;

    panel.querySelector('.fulfillment-proposal-state').textContent=(payload?.proposal_status||'not_ready').replaceAll('_',' ');
    panel.querySelector('.fulfillment-stage-state').textContent=f.stage||'pending';
    panel.querySelector('.fulfillment-total-cost').textContent=fmtMoney(s.actual_total_cost_aoa);
    panel.querySelector('.fulfillment-revenue').textContent=fmtMoney(s.final_revenue_aoa);
    panel.querySelector('.fulfillment-profit').textContent=fmtMoney(s.realized_gross_profit_aoa);
    panel.querySelector('.fulfillment-margin').textContent=s.realized_gross_margin_pct==null?'—':s.realized_gross_margin_pct.toLocaleString('pt-AO',{maximumFractionDigits:2})+'%';
    if(s.profit_alert==='negative_realized_profit')panel.querySelector('.fulfillment-profit').classList.add('negative');

    panel.querySelector('.fulfillment-stage').value=f.stage||'pending';
    panel.querySelector('.fulfillment-award-ref').value=f.award_ref||'';
    panel.querySelector('.fulfillment-awarded-at').value=toLocalDateTime(f.awarded_at);
    panel.querySelector('.fulfillment-purchase-ref').value=f.purchase_ref||'';
    panel.querySelector('.fulfillment-purchased-at').value=toLocalDateTime(f.purchased_at);
    panel.querySelector('.fulfillment-material').value=f.actual_material_cost_aoa??'';
    panel.querySelector('.fulfillment-transport').value=f.actual_transport_cost_aoa??'';
    panel.querySelector('.fulfillment-customs').value=f.actual_customs_cost_aoa??'';
    panel.querySelector('.fulfillment-tax').value=f.actual_tax_cost_aoa??'';
    panel.querySelector('.fulfillment-other').value=f.actual_other_cost_aoa??'';
    panel.querySelector('.fulfillment-delivery-ref').value=f.delivery_ref||'';
    panel.querySelector('.fulfillment-delivered-at').value=toLocalDateTime(f.delivered_at);
    panel.querySelector('.fulfillment-final-revenue').value=f.final_revenue_aoa??'';
    panel.querySelector('.fulfillment-notes').value=f.internal_notes||'';

    panel.querySelector('.save-fulfillment').addEventListener('click',async()=>{
      const button=panel.querySelector('.save-fulfillment');
      const message=panel.querySelector('.fulfillment-message');
      const numberOrNull=selector=>{
        const value=panel.querySelector(selector).value;
        return value===''?null:Number(value);
      };
      button.disabled=true;message.textContent='A guardar…';message.className='fulfillment-message';
      try{
        const saved=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/fulfillment',{
          method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
            stage:panel.querySelector('.fulfillment-stage').value,
            award_ref:panel.querySelector('.fulfillment-award-ref').value.trim()||null,
            awarded_at:fulfillmentDate(panel.querySelector('.fulfillment-awarded-at').value),
            purchase_ref:panel.querySelector('.fulfillment-purchase-ref').value.trim()||null,
            purchased_at:fulfillmentDate(panel.querySelector('.fulfillment-purchased-at').value),
            actual_material_cost_aoa:numberOrNull('.fulfillment-material'),
            actual_transport_cost_aoa:numberOrNull('.fulfillment-transport'),
            actual_customs_cost_aoa:numberOrNull('.fulfillment-customs'),
            actual_tax_cost_aoa:numberOrNull('.fulfillment-tax'),
            actual_other_cost_aoa:numberOrNull('.fulfillment-other'),
            delivery_ref:panel.querySelector('.fulfillment-delivery-ref').value.trim()||null,
            delivered_at:fulfillmentDate(panel.querySelector('.fulfillment-delivered-at').value),
            final_revenue_aoa:numberOrNull('.fulfillment-final-revenue'),
            internal_notes:panel.querySelector('.fulfillment-notes').value.trim()||null
          })
        });
        if(saved?.request?.status){
          row.status=saved.request.status;
          card.querySelector('.request-status').textContent=row.status.replaceAll('_',' ');
          card.querySelector('.status-select').value=row.status;
        }
        renderFulfillment(card,row,commercialPanel,saved);
      }catch(error){
        const labels={
          accepted_proposal_required:'A proposta precisa estar marcada como aceite antes de iniciar a adjudicação.',
          award_required:'Registe a referência e a data de adjudicação.',
          purchase_required:'Registe a referência e a data da compra.',
          actual_costs_required:'Preencha todos os custos reais. Use 0 quando um custo não existir.',
          delivery_required:'Registe a referência e a data da entrega.',
          realized_profit_required:'Para concluir, confirme todos os custos reais, a entrega e a receita final.'
        };
        message.textContent=labels[error.message]||'Não foi possível guardar a execução comercial.';
        message.className='fulfillment-message error';
      }finally{button.disabled=false;}
    });
  }

  async function loadFulfillment(card,row,commercialPanel){
    const button=commercialPanel.querySelector('.open-fulfillment');
    const panel=commercialPanel.querySelector('.fulfillment-panel');
    button.disabled=true;button.textContent='A carregar…';
    try{
      const payload=await api('/api/admin/sourcing-requests/'+encodeURIComponent(row.id)+'/fulfillment');
      renderFulfillment(card,row,commercialPanel,payload);
      button.textContent='Atualizar execução';
    }catch(error){
      panel.hidden=false;
      panel.innerHTML='<div class="empty-state compact"><strong>Não foi possível carregar a execução.</strong><p>Confirme a sessão privada e tente novamente.</p></div>';
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      button.textContent='Tentar novamente';
    }finally{button.disabled=false;}
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

  async function loadCommercialDashboard(){
    if(!adminToken)return false;
    try{
      commercialDashboard=await api('/api/admin/commercial-dashboard');
      renderCommercialDashboard();
      return true;
    }catch(error){
      commercialDashboard=null;
      renderCommercialDashboard();
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      return false;
    }
  }

  async function loadAll(){
    const [requestsOk,demandOk]=await Promise.all([loadRequests(),loadDemand(),loadCommercialDashboard()]);
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
  $('#refreshRequests').addEventListener('click',async()=>{await Promise.all([loadRequests(),loadCommercialDashboard()]);});
  $('#refreshDemand').addEventListener('click',loadDemand);
  $('#statusFilter').addEventListener('change',renderRequests);
  window.addEventListener('pagehide',()=>{adminToken='';requests=[];demand=[];commercialDashboard=null;});
  document.addEventListener('DOMContentLoaded',configure,{once:true});
})();
