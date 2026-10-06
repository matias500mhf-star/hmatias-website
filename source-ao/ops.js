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

  function setInternalAccess(unlocked){
    document.body.classList.toggle('internal-locked',!unlocked);
  }

  function configureSessionUi(){
    setInternalAccess(false);
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
    const timeoutMs=Math.max(1000,Number(options.timeoutMs)||8000);
    const {timeoutMs:discardedTimeout,...fetchOptions}=options;
    void discardedTimeout;
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetch(base+path,{
        ...fetchOptions,
        cache:'no-store',
        signal:controller.signal,
        headers:{
          accept:'application/json',
          authorization:`Bearer ${adminToken}`,
          ...(fetchOptions.headers||{})
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

  function sourceHealthText(source){
    if(source.last_error) return `Error · ${source.last_error}`;
    if(source.last_success_at) return `Last success · ${new Date(source.last_success_at).toLocaleString()}`;
    return 'Awaiting first scan';
  }

  function renderOpportunitySources(sources=[]){
    const box=$('#opportunitySourceStatus');
    box.innerHTML='';
    if(!sources.length){
      box.innerHTML='<div class="empty-state"><strong>No opportunity sources configured.</strong><p>Add a source through the protected API before scanning.</p></div>';
      return;
    }
    sources.forEach(source=>{
      const row=document.createElement('div');row.className='op-source-row';
      const main=document.createElement('div');
      const title=document.createElement('strong');title.textContent=source.name;
      const meta=document.createElement('small');meta.textContent=`${source.country_code||'AO'} · ${source.source_kind} · ${source.currency_code||''} · every ${source.scan_interval_minutes} min · ${source.active?'active':'paused'}`;
      main.append(title,meta);
      const state=document.createElement('span');state.textContent=sourceHealthText(source);state.className=source.last_error?'op-source-error':'';
      row.append(main,state);box.appendChild(row);
    });
  }

  function renderOpportunityCandidates(candidates=[]){
    const list=$('#opportunityCandidateList');
    $('#opportunityCandidateCount').textContent=`${candidates.length} candidate${candidates.length===1?'':'s'}`;
    list.innerHTML='';
    if(!candidates.length){
      list.innerHTML='<div class="empty-state"><strong>No pending candidates.</strong><p>The queue is clear or the source scan has not found a reviewable opportunity yet.</p></div>';
      return;
    }
    candidates.forEach(candidate=>{
      const card=document.createElement('article');card.className='op-candidate';
      const top=document.createElement('div');top.className='op-candidate-top';
      const fit=document.createElement('span');fit.className='op-fit-score';fit.textContent=`Fit ${candidate.fit_score}/100`;
      const type=document.createElement('span');type.className='queue-badge';type.textContent=candidate.opportunity_type||'tender';
      top.append(fit,type);

      const title=document.createElement('h3');title.textContent=candidate.title;
      const meta=document.createElement('p');meta.className='op-candidate-meta';
      const deadline=candidate.deadline?new Date(candidate.deadline).toLocaleString():'Deadline to confirm';
      meta.textContent=`${candidate.country_code||'AO'} · ${candidate.issuer} · ${candidate.location} · ${candidate.currency_code||''} · ${deadline}`;

      const tags=document.createElement('div');tags.className='op-fit-tags';
      (candidate.fit_tags||[]).forEach(value=>{const tag=document.createElement('span');tag.textContent=value;tags.appendChild(tag);});

      const summary=document.createElement('p');summary.className='op-candidate-summary';
      summary.textContent=candidate.scope_summary||candidate.evidence_excerpt||'Source discovered; scope still requires review.';

      const actions=document.createElement('div');actions.className='ops-actions compact';
      const source=document.createElement('a');source.className='btn btn-outline btn-small';source.href=candidate.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Open source';
      const copilot=document.createElement('button');copilot.type='button';copilot.className='btn btn-outline btn-small';copilot.textContent='SOURCE Copilot';
      copilot.addEventListener('click',()=>analyseWithCopilot(candidate,copilot,card));
      const reject=document.createElement('button');reject.type='button';reject.className='btn btn-outline btn-small';reject.textContent='Reject';
      reject.addEventListener('click',()=>reviewOpportunity(candidate,'reject'));
      const approve=document.createElement('button');approve.type='button';approve.className='btn btn-primary btn-small';approve.textContent='Review & approve';
      approve.title='Confirm contracting entity, location and deadline before public promotion';
      approve.addEventListener('click',()=>reviewOpportunity(candidate,'promote'));
      actions.append(source,copilot,reject,approve);

      card.append(top,title,meta,tags,summary,actions);list.appendChild(card);
    });
  }


  function renderCopilotPanel(card,payload){
    card.querySelector('.op-copilot-panel')?.remove();
    const intelligence=payload?.intelligence||{};
    const copilot=payload?.copilot||{};
    const panel=document.createElement('section');panel.className='op-copilot-panel';

    const head=document.createElement('div');head.className='op-copilot-head';
    const brand=document.createElement('div');
    const eyebrow=document.createElement('small');eyebrow.textContent='SOURCE COPILOT';
    const action=document.createElement('strong');action.textContent=intelligence.recommended_action_label||'Opportunity intelligence';
    brand.append(eyebrow,action);
    const scores=document.createElement('div');scores.className='op-copilot-scores';
    const fit=document.createElement('span');fit.textContent=`Fit ${intelligence.fit_score??'—'}/100`;
    const confidence=document.createElement('span');confidence.textContent=`Confidence ${intelligence.confidence_score??'—'}/100`;
    scores.append(fit,confidence);head.append(brand,scores);

    const summary=document.createElement('p');summary.className='op-copilot-summary';summary.textContent=copilot.executive_summary||'Analysis unavailable.';

    const metrics=document.createElement('div');metrics.className='op-copilot-metrics';
    const labels={service_fit:'Service fit',location_fit:'Location',deadline_readiness:'Deadline',qualification_fit:'Qualification'};
    Object.entries(intelligence.breakdown||{}).forEach(([key,value])=>{
      const metric=document.createElement('div');
      const label=document.createElement('small');label.textContent=labels[key]||key;
      const number=document.createElement('strong');number.textContent=`${value}/100`;
      metric.append(label,number);metrics.appendChild(metric);
    });

    const groups=document.createElement('div');groups.className='op-copilot-groups';
    const addGroup=(title,items)=>{
      if(!Array.isArray(items)||!items.length)return;
      const group=document.createElement('div');const h=document.createElement('strong');h.textContent=title;
      const ul=document.createElement('ul');
      items.forEach(value=>{const li=document.createElement('li');li.textContent=value;ul.appendChild(li);});
      group.append(h,ul);groups.appendChild(group);
    };
    addGroup('Riscos a validar',copilot.risks);
    addGroup('Próximas ações',copilot.next_actions);
    addGroup('Rede HMATIAS compatível',(payload?.partner_matches||[]).map(match=>{
      const caps=(match.matched_capabilities||[]).slice(0,3).join(', ');
      return `${match.name} · match ${match.match_score}/100 · P${match.commercial_priority||3} · ${match.partner_type}${caps?' · '+caps:''}${match.next_action?' · próxima ação: '+match.next_action:''}`;
    }));

    const commands=document.createElement('div');commands.className='op-copilot-commands';
    (copilot.commands||[]).filter(command=>command.enabled).forEach(command=>{
      const chip=document.createElement('span');chip.textContent=command.label;commands.appendChild(chip);
    });

    panel.append(head,summary,metrics,groups,commands);card.appendChild(panel);
  }

  async function analyseWithCopilot(candidate,button,card){
    if(!adminToken)return alert('Load the admin API token for this session first.');
    const original=button.textContent;button.disabled=true;button.textContent='Analysing…';
    try{
      const payload=await api(`/api/admin/copilot/candidates/${encodeURIComponent(candidate.id)}`);
      renderCopilotPanel(card,payload);
    }catch(error){
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      alert('SOURCE Copilot analysis failed. Check the API session and try again.');
    }finally{
      button.disabled=false;button.textContent=original;
    }
  }

  function renderPartnerNetwork(partners=[]){
    const list=$('#partnerNetworkList');
    $('#partnerCount').textContent=`${partners.length} registo${partners.length===1?'':'s'}`;
    list.innerHTML='';
    if(!partners.length){
      list.innerHTML='<div class="empty-state"><strong>No commercial partners registered.</strong><p>Add reviewed companies through the protected API.</p></div>';
      return;
    }
    partners.forEach(partner=>{
      const card=document.createElement('article');card.className='partner-card';
      const head=document.createElement('div');head.className='partner-card-head';
      const main=document.createElement('div');
      const name=document.createElement('strong');name.textContent=partner.name;
      const meta=document.createElement('small');
      meta.textContent=`${partner.country_code||'AO'} · ${partner.partner_type.replaceAll('_',' ')} · ${partner.relationship_stage.replaceAll('_',' ')}${partner.locality?' · '+partner.locality:''}`;
      main.append(name,meta);
      const badges=document.createElement('div');badges.className='partner-badges';
      const priority=document.createElement('span');priority.className='partner-priority';priority.dataset.level=String(partner.commercial_priority||3);priority.textContent=`P${partner.commercial_priority||3}`;
      const stage=document.createElement('span');stage.className='queue-badge';stage.textContent=partner.relationship_stage.replaceAll('_',' ');
      badges.append(priority,stage);head.append(main,badges);

      const tags=document.createElement('div');tags.className='partner-tags';
      (partner.capabilities||[]).slice(0,8).forEach(value=>{
        const tag=document.createElement('span');tag.textContent=value.replaceAll('-',' ');tags.appendChild(tag);
      });

      const action=document.createElement('div');action.className='partner-action';
      const actionLabel=document.createElement('small');actionLabel.textContent='PRÓXIMA AÇÃO';
      const actionText=document.createElement('strong');actionText.textContent=partner.next_action||'Rever relação comercial e definir próximo passo.';
      action.append(actionLabel,actionText);
      if(partner.last_interaction_at){
        const last=document.createElement('span');last.textContent=`Última interação: ${new Date(partner.last_interaction_at).toLocaleDateString()}`;action.appendChild(last);
      }
      const note=document.createElement('p');note.className='partner-note';note.textContent=partner.source_note||'Internal commercial record.';
      card.append(head,tags,action,note);
      if(partner.website){
        const link=document.createElement('a');link.className='partner-link';link.href=partner.website;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open public website →';card.appendChild(link);
      }
      list.appendChild(card);
    });
  }

  async function loadPartnerNetwork(){
    if(!adminToken||!apiBase())return;
    $('#partnerCount').textContent='Loading…';
    try{
      const payload=await api('/api/admin/partner-network');
      renderPartnerNetwork(payload?.partners||[]);
    }catch(error){
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      $('#partnerNetworkList').innerHTML='<div class="empty-state"><strong>Partner network unavailable.</strong><p>Check the API session and try again.</p></div>';
    }
  }


  function fmtAoa(value){
    const n=Number(value);
    if(!Number.isFinite(n))return '—';
    return new Intl.NumberFormat('pt-AO',{style:'currency',currency:'AOA',maximumFractionDigits:0}).format(n);
  }

  function pursuitStageLabel(value){
    return ({
      review:'Revisão',qualification:'Qualificação',partnering:'Parceiros',
      preparing_bid:'Preparar proposta',submitted:'Submetida',clarification:'Clarificação',
      won:'Ganha',lost:'Perdida',withdrawn:'Retirada'
    })[value]||value||'Revisão';
  }

  function renderOpportunityPursuits(payload){
    const summary=payload?.summary||{};
    const items=payload?.pursuits||[];
    $('#pursuitGoCount').textContent=String(summary.go_count||0);
    $('#pursuitSubmittedCount').textContent=String(summary.submitted_count||0);
    $('#pursuitPipelineValue').textContent=fmtAoa(summary.pipeline_value_aoa);
    $('#pursuitWonCount').textContent=String(summary.won_count||0);
    $('#pursuitCount').textContent=`${items.length} oportunidade${items.length===1?'':'s'}`;
    const list=$('#pursuitList');list.innerHTML='';
    if(!items.length){
      list.innerHTML='<div class="empty-state"><strong>No promoted opportunities available.</strong><p>Approve a valid Radar candidate first, then decide whether HMATIAS should pursue it.</p></div>';
      return;
    }
    for(const item of items){
      const card=document.createElement('article');card.className='pursuit-card';card.dataset.decision=item.decision||'watch';card.dataset.stage=item.stage||'review';
      const top=document.createElement('div');top.className='pursuit-top';
      const main=document.createElement('div');
      const title=document.createElement('strong');title.textContent=item.title||item.opportunity_id;
      const meta=document.createElement('small');meta.textContent=[item.issuer,item.reference,item.deadline?'Prazo '+new Date(item.deadline).toLocaleDateString('pt-AO'):null].filter(Boolean).join(' · ');
      main.append(title,meta);
      const badges=document.createElement('div');badges.className='pursuit-badges';
      const decision=document.createElement('span');decision.className='pursuit-decision';decision.textContent=(item.decision||'watch').replace('_','-').toUpperCase();
      const stage=document.createElement('span');stage.className='queue-badge';stage.textContent=pursuitStageLabel(item.stage);
      badges.append(decision,stage);top.append(main,badges);

      const facts=document.createElement('div');facts.className='pursuit-facts';
      const fact=(label,value)=>{const el=document.createElement('div');const s=document.createElement('small');s.textContent=label;const b=document.createElement('strong');b.textContent=value||'—';el.append(s,b);facts.appendChild(el);};
      fact('VALOR POTENCIAL',fmtAoa(item.estimated_value_aoa));
      fact('RESPONSÁVEL',item.owner);
      fact('PRÓXIMA AÇÃO',item.next_action);
      fact('AÇÃO ATÉ',item.next_action_due_at?new Date(item.next_action_due_at).toLocaleDateString('pt-AO'):'—');

      const actions=document.createElement('div');actions.className='ops-actions compact pursuit-actions';
      if(item.source_url){const source=document.createElement('a');source.className='btn btn-outline btn-small';source.href=item.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Open source';actions.appendChild(source);}
      const manage=document.createElement('button');manage.type='button';manage.className='btn btn-primary btn-small';manage.textContent=item.pursuit_updated_at?'Atualizar':'Definir GO / NO-GO';manage.addEventListener('click',()=>editOpportunityPursuit(item));actions.appendChild(manage);

      if(item.partner_need){const partner=document.createElement('p');partner.className='pursuit-note';partner.textContent='Parceiros/capacidade: '+item.partner_need;card.append(top,facts,partner,actions);}
      else card.append(top,facts,actions);
      list.appendChild(card);
    }
  }

  async function loadOpportunityPursuits(){
    if(!adminToken||!apiBase())return false;
    $('#pursuitCount').textContent='Loading…';
    try{
      const payload=await api('/api/admin/opportunity-pursuits?include_closed=1');
      renderOpportunityPursuits(payload);
      return true;
    }catch(error){
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      $('#pursuitList').innerHTML='<div class="empty-state"><strong>Commercial pursuit pipeline unavailable.</strong><p>Check the API session and try again.</p></div>';
      return false;
    }
  }

  async function editOpportunityPursuit(item){
    const allowedDecisions=['watch','go','no_go'];
    const allowedStages=['review','qualification','partnering','preparing_bid','submitted','clarification','won','lost','withdrawn'];
    const decision=prompt('Decisão: watch, go ou no_go',item.decision||'watch');
    if(decision===null)return;
    const normalizedDecision=decision.trim().toLowerCase();
    if(!allowedDecisions.includes(normalizedDecision))return alert('Use watch, go ou no_go.');
    const defaultStage=normalizedDecision==='no_go'?'withdrawn':(item.stage||'review');
    const stage=prompt('Etapa: review, qualification, partnering, preparing_bid, submitted, clarification, won, lost ou withdrawn',defaultStage);
    if(stage===null)return;
    const normalizedStage=stage.trim().toLowerCase();
    if(!allowedStages.includes(normalizedStage))return alert('Etapa inválida.');

    const owner=prompt('Responsável interno:',item.owner||'Commercial');
    if(owner===null)return;
    const amount=prompt('Valor potencial em AOA (deixe vazio se ainda desconhecido):',item.estimated_value_aoa??'');
    if(amount===null)return;
    const parsedAmount=amount.trim()===''?null:Number(amount.replace(/\s/g,'').replace(',','.'));
    if(parsedAmount!=null&&(!Number.isFinite(parsedAmount)||parsedAmount<0))return alert('Valor potencial inválido.');
    const nextAction=prompt('Próxima ação comercial:',item.next_action||'');
    if(nextAction===null)return;
    const dueDefault=item.next_action_due_at?new Date(item.next_action_due_at).toISOString().slice(0,10):'';
    const due=prompt('Data da próxima ação (YYYY-MM-DD, opcional):',dueDefault);
    if(due===null)return;
    if(due.trim()&&!/^\d{4}-\d{2}-\d{2}$/.test(due.trim()))return alert('Use o formato YYYY-MM-DD.');
    const partnerNeed=prompt('Parceiro/capacidade necessária (opcional):',item.partner_need||'');
    if(partnerNeed===null)return;
    let outcome=item.outcome_reason||'';
    if(['won','lost','withdrawn'].includes(normalizedStage)){
      const result=prompt('Registe o resultado/motivo de encerramento:',outcome);
      if(result===null||!result.trim())return alert('O resultado é obrigatório para fechar a oportunidade.');
      outcome=result.trim();
    }
    const payload={
      decision:normalizedDecision,
      stage:normalizedStage,
      owner:owner.trim()||null,
      estimated_value_aoa:parsedAmount,
      next_action:nextAction.trim()||null,
      next_action_due_at:due.trim()?due.trim()+'T17:00:00+01:00':null,
      partner_need:partnerNeed.trim()||null,
      outcome_reason:outcome||null
    };
    try{
      await api(`/api/admin/opportunities/${encodeURIComponent(item.opportunity_id)}/pursuit`,{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)
      });
      await loadOpportunityPursuits();
      setApiStatus('Pursuit updated · commercial next action recorded','connected');
    }catch(error){
      alert('Could not update the pursuit: '+(error.message||'check the commercial fields.'));
    }
  }

  async function loadOpportunityPipeline(){
    if(!adminToken||!apiBase()) return false;
    $('#opportunityCandidateCount').textContent='Loading…';
    try{
      const [sources,candidates]=await Promise.all([
        api('/api/admin/opportunity-pipeline/sources'),
        api('/api/admin/opportunity-pipeline/candidates?status=pending&limit=50')
      ]);
      renderOpportunitySources(sources?.sources||[]);
      renderOpportunityCandidates(candidates?.candidates||[]);
      return true;
    }catch(error){
      if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected','error');}
      $('#opportunityCandidateList').innerHTML='<div class="empty-state"><strong>Opportunity queue unavailable.</strong><p>Check the API session and try again.</p></div>';
      return false;
    }
  }

  async function reviewOpportunity(candidate,action){
    let review={action,reviewed_by:'HMATIAS Verification Desk'};
    if(action==='promote'){
      const title=prompt('Confirm opportunity title:',candidate.title||'');
      if(title===null||!title.trim()) return;
      const issuerDefault=candidate.issuer===candidate.source_name?'':(candidate.issuer||'');
      const issuer=prompt('Confirm contracting entity / issuer:',issuerDefault);
      if(issuer===null||!issuer.trim()) return alert('Contracting entity is required before publication.');
      const locationValue=prompt('Confirm location:',candidate.location||'Angola');
      if(locationValue===null||!locationValue.trim()) return;
      const deadlineDefault=candidate.deadline?candidate.deadline.slice(0,10):'';
      const deadline=prompt('Confirm deadline (YYYY-MM-DD):',deadlineDefault);
      if(deadline===null||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(deadline.trim())) return alert('A valid deadline is required before publication.');
      const ok=confirm(`Publish to the public Radar?\n\n${title.trim()}\nIssuer: ${issuer.trim()}\nLocation: ${locationValue.trim()}\nDeadline: ${deadline.trim()}\nSource: ${candidate.source_url}`);
      if(!ok) return;
      const country=candidate.country_code||'AO';
      const offset={AO:'+01:00',NA:'+02:00',ZA:'+02:00'}[country]||'+00:00';
      const originalDate=candidate.deadline?new Date(candidate.deadline).toISOString().slice(0,10):'';
      const deadlineIso=candidate.deadline&&deadline.trim()===originalDate
        ?candidate.deadline
        :`${deadline.trim()}T23:59:59${offset}`;
      review={...review,title:title.trim(),issuer:issuer.trim(),location:locationValue.trim(),
        country_code:country,currency_code:candidate.currency_code||'AOA',deadline:deadlineIso};
    }else if(!confirm(`Reject this opportunity candidate?\n\n${candidate.title}`)) return;
    try{
      await api(`/api/admin/opportunity-pipeline/candidates/${encodeURIComponent(candidate.id)}/review`,{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(review)
      });
      await Promise.all([loadOpportunityPipeline(),loadOpportunityPursuits()]);
    }catch(error){
      alert(error.message==='deadline_expired'?'The deadline has expired. The candidate was not published.':'Review action failed. Check the candidate data and API session.');
    }
  }

  $('#connectApi').addEventListener('click',async()=>{
    const candidate=$('#adminToken').value.trim();
    if(!candidate){adminToken='';setInternalAccess(false);setApiStatus('API available · token required','ready');return;}
    adminToken=candidate;
    $('#adminToken').value='';
    setApiStatus('Checking admin access…','ready');
    const authorized=await loadOpportunityPipeline();
    if(!authorized){
      setInternalAccess(false);
      return;
    }
    setInternalAccess(true);
    setApiStatus('Connected · private operations loaded','connected');
    await Promise.all([loadPartnerNetwork(),loadOpportunityPursuits()]);
  });

  $('#refreshOpportunities').addEventListener('click',()=>loadOpportunityPipeline());
  $('#refreshPursuits').addEventListener('click',()=>loadOpportunityPursuits());
  $('#refreshPartners').addEventListener('click',()=>loadPartnerNetwork());

  $('#scanOpportunities').addEventListener('click',async()=>{
    if(!adminToken) return alert('Load the admin API token for this session first.');
    const button=$('#scanOpportunities');
    button.disabled=true;button.textContent='Scanning…';
    try{
      const result=await api('/api/admin/opportunity-pipeline/scan',{
        method:'POST',timeoutMs:25000,
        headers:{'content-type':'application/json'},
        body:JSON.stringify({limit_sources:3})
      });
      const processed=result?.sources_processed||0;
      setApiStatus(`Opportunity scan complete · ${processed} source${processed===1?'':'s'}`,'connected');
      await loadOpportunityPipeline();
    }catch(error){
      setApiStatus('Opportunity scan failed','error');
    }finally{
      button.disabled=false;button.textContent='Scan sources';
    }
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
        if(error.status===401){adminToken='';setInternalAccess(false);setApiStatus('Token rejected · local draft only','error');}
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
