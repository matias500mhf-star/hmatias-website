const clamp=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));
const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const uniq=list=>[...new Set(list.filter(Boolean))];

export const HMATIAS_PROFILE={
  id:'hmatias',
  name:'HMATIAS — Prestação de Serviços, (SU), Lda.',
  country:'Angola',
  primary_location:'Luanda',
  sectors:[
    'construction',
    'facilities-maintenance',
    'technical-maintenance',
    'supply-procurement',
    'cleaning-supplies'
  ],
  capabilities:[
    'construction','civil works','rehabilitation','maintenance','facilities',
    'supply','procurement','cleaning','hvac','electrical','plumbing','painting'
  ],
  participation_modes:['direct_bid','partnership','subcontracting','supplier']
};

function daysUntil(value,clock){
  if(!value)return null;
  const t=new Date(value).getTime();
  if(Number.isNaN(t))return null;
  return Math.ceil((t-clock)/86400000);
}

function serviceScore(record,profile){
  const sector=norm(record.sector);
  const hay=norm([record.title,record.scope_summary,record.evidence_excerpt,record.sector,(record.fit_tags||[]).join(' ')].join(' '));
  let score=Number(record.fit_score)||0;
  if(profile.sectors.some(value=>sector===norm(value)))score=Math.max(score,88);
  const matched=profile.capabilities.filter(value=>hay.includes(norm(value)));
  score=Math.max(score,Math.min(100,42+matched.length*9));
  if(/maintenance|manutencao|facilities/.test(hay))score=Math.max(score,90);
  if(/cleaning|limpeza|higiene/.test(hay))score=Math.max(score,92);
  if(/supply|fornecimento|aquisicao|procurement/.test(hay))score=Math.max(score,86);
  if(/construction|construcao|reabilitacao|obra|pintura/.test(hay))score=Math.max(score,84);
  return {score:clamp(score||35),matched:uniq(matched)};
}

function marketCode(record){
  const explicit=String(record.country_code||'').toUpperCase();
  if(['AO','NA','ZA'].includes(explicit))return explicit;
  const value=norm(record.location);
  if(value.includes('namibia'))return 'NA';
  if(value.includes('south africa'))return 'ZA';
  return 'AO';
}

function locationScore(record,profile){
  const value=norm(record.location);
  if(!value)return 55;
  if(value.includes(norm(profile.primary_location)))return 100;
  if(value.includes('luanda'))return 100;
  if(value.includes('angola'))return 90;
  return 55;
}

function deadlineScore(record,clock){
  const days=daysUntil(record.deadline,clock);
  if(days==null)return {score:35,days:null};
  if(days<0)return {score:0,days};
  if(days<=2)return {score:20,days};
  if(days<=5)return {score:45,days};
  if(days<=10)return {score:70,days};
  if(days<=21)return {score:88,days};
  return {score:95,days};
}

function complexity(record){
  const hay=norm([record.title,record.scope_summary,record.evidence_excerpt].join(' '));
  const large=[
    'design and build','design build','concepcao e construcao','infraestruturas basicas',
    'plataforma logistica','epc','turnkey','empreitada de grande porte','barragem'
  ].some(value=>hay.includes(norm(value)));
  const technical=[
    'electrical','eletrica','electrica','hydraulic','hidraulica','ict','tic','hvac',
    'plumbing','canalizacao'
  ].filter(value=>hay.includes(norm(value))).length;
  return {large,technical_disciplines:technical};
}

function qualificationScore(record,service,complex){
  const type=norm(record.opportunity_type||record.type);
  let score=55;
  if(service.score>=85)score+=18;
  if(['rfq','small contract','maintenance','supply request','subcontracting'].some(v=>type.includes(v)))score+=12;
  if(type.includes('tender'))score-=4;
  if(complex.large)score-=22;
  if(complex.technical_disciplines>=3)score-=8;
  if(marketCode(record)!=='AO')score-=12;
  return clamp(score);
}

function confidenceScore(record,clock){
  let score=0;
  const signals=[];
  if(/^https:\/\//i.test(String(record.source_url||''))){score+=20;signals.push('https_source');}
  if(record.deadline){score+=20;signals.push('deadline_present');}
  if(record.reference){score+=15;signals.push('reference_present');}
  if(record.issuer && norm(record.issuer)!==norm(record.source_name)){score+=15;signals.push('issuer_identified');}
  if(record.scope_summary||record.evidence_excerpt){score+=10;signals.push('scope_evidence');}
  if(record.source_checked_at){
    const age=(clock-new Date(record.source_checked_at).getTime())/86400000;
    if(Number.isFinite(age)&&age<=7){score+=20;signals.push('recent_source_check');}
    else if(Number.isFinite(age)&&age<=30){score+=12;signals.push('source_checked');}
    else {score+=5;signals.push('stale_source_check');}
  }
  return {score:clamp(score),signals};
}

function recommendation({fit,confidence,deadline,complex,crossBorder}){
  if(deadline.days!=null&&deadline.days<0)return 'reject_expired';
  if(confidence.score<55)return 'verify_source';
  if(crossBorder&&fit>=60)return 'cross_border_review';
  if(complex.large&&fit>=60)return 'partnership';
  if(fit>=80&&deadline.score>=45)return 'direct_bid';
  if(fit>=65)return 'assess_bid';
  return 'monitor';
}

function actionLabel(action){
  return {
    reject_expired:'Não avançar — prazo expirado',
    verify_source:'Verificar a fonte antes de decidir',
    partnership:'Avaliar parceria / subcontratação',
    cross_border_review:'Validar elegibilidade e parceiro local',
    direct_bid:'Preparar participação direta',
    assess_bid:'Fazer qualificação comercial antes de concorrer',
    monitor:'Monitorizar e recolher mais informação'
  }[action]||'Rever oportunidade';
}

function risksFor(record,confidence,deadline,complex){
  const risks=[];
  if(!record.reference)risks.push('Referência do procedimento ainda não confirmada.');
  if(!record.deadline)risks.push('Prazo de submissão ainda não confirmado.');
  if(!record.issuer||norm(record.issuer)===norm(record.source_name))risks.push('Entidade contratante precisa de confirmação humana.');
  if(confidence.score<70)risks.push('Nível de evidência ainda insuficiente para decisão final.');
  if(deadline.days!=null&&deadline.days>=0&&deadline.days<=5)risks.push('Prazo curto para preparar documentação, preços e submissão.');
  if(complex.large)risks.push('Escopo indica projeto de maior dimensão; validar capacidade, consórcio ou subcontratação.');
  if(complex.technical_disciplines>=3)risks.push('Oportunidade multidisciplinar; confirmar especialistas e parceiros técnicos.');
  if(marketCode(record)!=='AO')risks.push('Mercado externo: confirmar elegibilidade, registo de fornecedor, requisitos locais, fiscalidade, logística e regras de preferência antes de concorrer.');
  return uniq(risks);
}

function nextActions(action,record){
  const common=['Abrir e validar a fonte original.','Confirmar requisitos de qualificação e documentos obrigatórios.'];
  const map={
    reject_expired:['Arquivar a oportunidade e procurar eventual republicação.'],
    verify_source:['Confirmar entidade, referência, prazo e peças do procedimento antes de qualquer abordagem.'],
    partnership:['Identificar parceiro principal ou especialista complementar.','Separar o escopo que a empresa pode executar ou fornecer.','Preparar abordagem de parceria antes do prazo.'],
    cross_border_review:['Confirmar se empresa estrangeira pode participar e quais registos locais são exigidos.','Avaliar parceiro, representante ou fornecedor local.','Validar moeda, impostos, transporte, garantias e condições de pagamento.'],
    direct_bid:['Criar checklist de candidatura.','Levantar preços e fornecedores necessários.','Construir orçamento, margem e cronograma de submissão.'],
    assess_bid:['Rever peças do procedimento e mapa de quantidades.','Confirmar capacidade técnica, financeira e documental.','Decidir participação direta, parceria ou fornecimento.'],
    monitor:['Recolher informação adicional e aguardar um sinal comercial mais forte.']
  };
  const actions=[...common,...(map[action]||[])];
  if(record.deadline)actions.push('Trabalhar com o prazo confirmado como data-limite operacional.');
  return uniq(actions);
}

export function buildOpportunityIntelligence(record,options={}){
  const clock=Number(options.clock)||Date.now();
  const profile=options.companyProfile||HMATIAS_PROFILE;
  const fitService=serviceScore(record,profile);
  const loc=locationScore(record,profile);
  const deadline=deadlineScore(record,clock);
  const complex=complexity(record);
  const qualification=qualificationScore(record,fitService,complex);
  const fit=clamp(fitService.score*.45+loc*.20+deadline.score*.20+qualification*.15);
  const confidence=confidenceScore(record,clock);
  const crossBorder=marketCode(record)!=='AO';
  const action=recommendation({fit,confidence,deadline,complex,crossBorder});
  const risks=risksFor(record,confidence,deadline,complex);
  const actions=nextActions(action,record);
  return {
    version:'source-intelligence-v1',
    company:{id:profile.id,name:profile.name},
    fit_score:fit,
    confidence_score:confidence.score,
    recommended_action:action,
    recommended_action_label:actionLabel(action),
    deadline_days:deadline.days,
    complexity:complex,
    market:{country_code:marketCode(record),cross_border:crossBorder},
    breakdown:{
      service_fit:fitService.score,
      location_fit:loc,
      deadline_readiness:deadline.score,
      qualification_fit:qualification
    },
    matched_capabilities:fitService.matched,
    confidence_signals:confidence.signals,
    risks,
    next_actions:actions
  };
}

export function buildCopilotBrief(record,intelligence){
  const fit=intelligence.fit_score,confidence=intelligence.confidence_score;
  const deadline=intelligence.deadline_days==null?'prazo por confirmar':
    intelligence.deadline_days<0?'prazo expirado':
    intelligence.deadline_days===0?'encerra hoje':
    `${intelligence.deadline_days} dia${intelligence.deadline_days===1?'':'s'} restante${intelligence.deadline_days===1?'':'s'}`;
  const summary=`${intelligence.recommended_action_label}. Fit ${fit}/100, confiança ${confidence}/100 e ${deadline}.`;
  const rationale=[
    `Compatibilidade de serviço: ${intelligence.breakdown.service_fit}/100.`,
    `Compatibilidade geográfica: ${intelligence.breakdown.location_fit}/100.`,
    `Prontidão face ao prazo: ${intelligence.breakdown.deadline_readiness}/100.`,
    `Compatibilidade preliminar de qualificação: ${intelligence.breakdown.qualification_fit}/100.`
  ];
  return {
    title:'SOURCE Copilot',
    executive_summary:summary,
    rationale,
    risks:intelligence.risks,
    next_actions:intelligence.next_actions,
    commands:[
      {id:'prepare_bid',label:'Preparar candidatura',enabled:['direct_bid','assess_bid'].includes(intelligence.recommended_action)},
      {id:'find_suppliers',label:'Encontrar fornecedores',enabled:fit>=65},
      {id:'calculate_margin',label:'Calcular margem',enabled:fit>=65},
      {id:'partner_search',label:'Procurar parceiro',enabled:['partnership','cross_border_review'].includes(intelligence.recommended_action)},
      {id:'verify_source',label:'Verificar fonte',enabled:confidence<80}
    ],
    context:{
      opportunity_id:record.id||null,
      title:record.title||null,
      issuer:record.issuer||null,
      location:record.location||null,
      country_code:record.country_code||null,
      currency_code:record.currency_code||null,
      deadline:record.deadline||null,
      source_url:record.source_url||null
    }
  };
}
