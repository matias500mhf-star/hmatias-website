(()=>{
  'use strict';

  // Shared UI/bootstrap must remain independent from analytics/ad-blocking rules.
  if(!document.querySelector('script[data-hmatias-site-bootstrap]')){
    const bootstrap=document.createElement('script');
    bootstrap.src='site-bootstrap.js?v=20261009-website-intake1';
    bootstrap.defer=true;
    bootstrap.dataset.hmatiasSiteBootstrap='true';
    document.head.appendChild(bootstrap);
  }

  const pageEnglish=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const menuToggle=document.querySelector('.menu-toggle');
  const navMenu=document.querySelector('.nav-menu');
  const homePage=document.body.classList.contains('hmatias-home');
  const homeContactHref=pageEnglish
    ?(homePage?'#contact':'en.html#contact')
    :(homePage?'#contacto':'/#contacto');

  // Route legacy HMATIAS Clean links to the current canonical pages.
  document.querySelectorAll('a[href]').forEach(a=>{
    const href=a.getAttribute('href')||'';
    if(href==='hmatias-clean.html'||href==='/hmatias-clean.html')a.setAttribute('href','clean.html');
    if(href==='hmatias-clean-en.html'||href==='/hmatias-clean-en.html')a.setAttribute('href','clean-en.html');
  });

  // Keep quotation CTAs direct: homepage requests go straight to the contact form,
  // while service-page header CTAs return directly to the corresponding home contact form.
  document.querySelectorAll('[data-quote-link]').forEach(a=>a.setAttribute('href',homeContactHref));
  if(homePage){
    const legacyQuoteAnchor=pageEnglish?'#quote':'#orcamento';
    document.querySelectorAll(`a[href="${legacyQuoteAnchor}"]`).forEach(a=>a.setAttribute('href',homeContactHref));
  }

  // Service-card symbols are decorative; the adjacent heading and link provide the context.
  document.querySelectorAll('.service-icon').forEach(icon=>icon.setAttribute('aria-hidden','true'));

  if(menuToggle&&navMenu){
    if(!navMenu.id)navMenu.id='main-navigation';
    menuToggle.setAttribute('aria-controls',navMenu.id);
  }

  const setMenuState=open=>{
    navMenu?.classList.toggle('open',Boolean(open));
    menuToggle?.setAttribute('aria-expanded',String(Boolean(open)));
    menuToggle?.setAttribute('aria-label',pageEnglish
      ?(open?'Close menu':'Open menu')
      :(open?'Fechar menu':'Abrir menu'));
  };
  setMenuState(false);

  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!document.body.classList.contains('site-stable')&&!reducedMotion&&'IntersectionObserver' in window){
    const motionItems=[...document.querySelectorAll([
      '.section-heading',
      '.service-card',
      '.sector-grid article',
      '.company-grid > *',
      '.company-impact-grid > *',
      '.why-us-grid article',
      '.project',
      '.supply-inner > *',
      '.cta-inner > *',
      '.contact-grid > *',
      '.business-service-card',
      '.business-contact-grid > *',
      '.business-process-card',
      '.booking-hero-grid > *',
      '.booking-layout > *',
      '.booking-scope-grid article',
      '.unit-card',
      '.unit-proof > *',
      '.unit-step'
    ].join(','))];

    motionItems.forEach((item,index)=>{
      item.classList.add('motion-reveal');
      item.style.setProperty('--motion-delay',`${Math.min(index%4,3)*55}ms`);
    });

    const motionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        motionObserver.unobserve(entry.target);
      });
    },{rootMargin:'0px 0px -7% 0px',threshold:.08});

    motionItems.forEach(item=>motionObserver.observe(item));
  }

  menuToggle?.addEventListener('click',()=>setMenuState(!navMenu?.classList.contains('open')));

  const desktopLang=document.querySelector('.nav-actions .lang-switch[data-lang-switch]');
  if(navMenu&&desktopLang&&!navMenu.querySelector('.mobile-lang-switch')){
    const mobileLang=desktopLang.cloneNode(true);
    mobileLang.classList.add('mobile-lang-switch');
    mobileLang.textContent=pageEnglish?'PT — Português':'EN — English';
    navMenu.appendChild(mobileLang);
  }

  const headerQuote=document.querySelector('.hmatias-header .nav-actions [data-quote-link],.hmatias-header .nav-actions a.btn[href]');
  if(navMenu&&headerQuote&&!navMenu.querySelector('.mobile-quote-link')){
    const mobileQuote=headerQuote.cloneNode(true);
    mobileQuote.classList.add('mobile-quote-link');
    navMenu.appendChild(mobileQuote);
  }

  // A dedicated WhatsApp action remains visible inside the mobile menu.
  if(navMenu&&!navMenu.querySelector('.mobile-whatsapp-link')){
    const mobileWhatsApp=document.createElement('a');
    mobileWhatsApp.className='mobile-whatsapp-link';
    mobileWhatsApp.href='https://wa.me/244948806673';
    mobileWhatsApp.target='_blank';
    mobileWhatsApp.rel='noopener noreferrer';
    mobileWhatsApp.textContent=pageEnglish?'WhatsApp — Contact HMATIAS':'WhatsApp — Falar com a HMATIAS';
    mobileWhatsApp.setAttribute('aria-label',mobileWhatsApp.textContent);
    navMenu.appendChild(mobileWhatsApp);
  }

  // Keep the single working mailbox available alongside WhatsApp on mobile.
  if(navMenu&&!navMenu.querySelector('.mobile-email-link')){
    const mobileEmail=document.createElement('a');
    mobileEmail.className='mobile-email-link';
    mobileEmail.href='mailto:geral@comercialhmatiasps.com';
    mobileEmail.textContent='geral@comercialhmatiasps.com';
    mobileEmail.setAttribute('aria-label',pageEnglish?'Email HMATIAS':'Enviar e-mail à HMATIAS');
    navMenu.appendChild(mobileEmail);
  }

  document.querySelectorAll('.nav-menu a').forEach(a=>a.addEventListener('click',()=>setMenuState(false)));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&navMenu?.classList.contains('open')){
      setMenuState(false);
      menuToggle?.focus();
    }
  });
  document.addEventListener('click',event=>{
    if(!navMenu?.classList.contains('open'))return;
    if(navMenu.contains(event.target)||menuToggle?.contains(event.target))return;
    setMenuState(false);
  });

  const year=document.getElementById('year');
  if(year)year.textContent=String(new Date().getFullYear());

  // Explicit, in-page handoff: browser popup blockers must never make a request disappear.
  // No backend storage is implied; visitors must choose and complete a sending channel.
  const presentManualHandoff=(form,body,subject,statusNode=null)=>{
    let panel=form.querySelector('[data-hmatias-send-actions]');
    if(!panel){
      panel=document.createElement('section');
      panel.dataset.hmatiasSendActions='true';
      panel.setAttribute('aria-label',pageEnglish?'Review and send your request':'Rever e enviar o pedido');
      panel.style.cssText='grid-column:1/-1;display:block;margin:18px 0;padding:20px;border:1px solid #d8e1e6;border-radius:12px;background:#f6f9fb;color:#182c3a';
      const heading=document.createElement('strong');
      heading.textContent=pageEnglish?'Request ready for delivery':'Pedido preparado para envio';
      heading.style.cssText='display:block;font-size:1.1rem;margin-bottom:8px';
      const guidance=document.createElement('p');
      guidance.textContent=pageEnglish
        ?'Select WhatsApp or email below and complete the send in that application. This website has not registered your request yet.'
        :'Escolha WhatsApp ou e-mail e conclua o envio na aplicação correspondente. O website ainda não registou este pedido.';
      guidance.style.cssText='font-size:.91rem;line-height:1.55;margin:0 0 12px';
      const actions=document.createElement('div');
      actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px';
      const wa=document.createElement('a');wa.className='btn btn-primary';wa.dataset.hmatiasSendWhatsapp='true';
      wa.target='_blank';wa.rel='noopener noreferrer';
      wa.textContent=pageEnglish?'Send via WhatsApp':'Enviar pelo WhatsApp';
      const mail=document.createElement('a');mail.className='btn btn-outline';mail.dataset.hmatiasSendEmail='true';
      mail.textContent=pageEnglish?'Send via email':'Enviar por e-mail';
      const copy=document.createElement('button');copy.type='button';copy.className='btn btn-outline';
      copy.dataset.hmatiasCopyRequest='true';
      copy.textContent=pageEnglish?'Copy request':'Copiar pedido';
      const details=document.createElement('details');
      const summary=document.createElement('summary');
      summary.textContent=pageEnglish?'Review request text':'Rever texto do pedido';
      const preview=document.createElement('pre');
      preview.dataset.hmatiasRequestPreview='true';
      preview.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.85rem;line-height:1.6;margin:10px 0 0';
      details.append(summary,preview);
      const feedback=document.createElement('p');feedback.dataset.hmatiasHandoffFeedback='true';
      feedback.setAttribute('role','status');feedback.style.cssText='font-size:.85rem;margin:5px 0';
      copy.addEventListener('click',async()=>{
        try{await navigator.clipboard.writeText(panel.querySelector('[data-hmatias-request-preview]').textContent);
          feedback.textContent=pageEnglish?'Copied. Paste it into your chosen channel.':'Copiado. Cole no canal de envio pretendido.';}
        catch{feedback.textContent=pageEnglish?'Select the text above to copy it.':'Selecione o texto acima para o copiar.';details.open=true;}
      });
      actions.append(wa,mail,copy);
      panel.append(heading,guidance,actions,details,feedback);
      form.appendChild(panel);
    }
    panel.querySelector('[data-hmatias-send-whatsapp]').href='https://wa.me/244948806673?text='+encodeURIComponent(body.slice(0,3400));
    panel.querySelector('[data-hmatias-send-email]').href='mailto:geral@comercialhmatiasps.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body.slice(0,3500));
    panel.querySelector('[data-hmatias-request-preview]').textContent=body;
    panel.querySelector('[data-hmatias-handoff-feedback]').textContent='';
    if(statusNode)statusNode.textContent=pageEnglish?'Request prepared. Select a sending channel below.':'Pedido preparado. Escolha abaixo um canal para o enviar.';
    panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  };

  const form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const d=new FormData(form);
      const name=String(d.get('nome')||'').trim();
      const company=String(d.get('empresa')||(pageEnglish?'Not provided':'Não indicada')).trim();
      const email=String(d.get('email')||(pageEnglish?'Not provided':'Não indicado')).trim();
      const phone=String(d.get('telefone')||(pageEnglish?'Not provided':'Não indicado')).trim();
      const service=String(d.get('servico')||(pageEnglish?'Not provided':'Não indicado')).trim();
      const message=String(d.get('mensagem')||'').trim();
      const text=pageEnglish
        ?`Hello HMATIAS.\n\nName: ${name}\nCompany: ${company}\nE-mail: ${email}\nPhone / WhatsApp: ${phone}\nService: ${service}\n\nRequest:\n${message}`
        :`Olá HMATIAS.\n\nNome: ${name}\nEmpresa: ${company}\nE-mail: ${email}\nTelefone / WhatsApp: ${phone}\nServiço: ${service}\n\nPedido:\n${message}`;
      presentManualHandoff(form,text,pageEnglish?'HMATIAS business enquiry':'Pedido comercial HMATIAS');
    });
  }

  const businessForm=document.getElementById('businessContactForm');
  if(businessForm){
    const status=document.getElementById('businessFormStatus');
    const bookingHref=pageEnglish?'booking.html':'agendamento.html';

    if(navMenu&&!navMenu.querySelector('[data-booking-nav]')){
      const bookingNav=document.createElement('a');
      bookingNav.href=bookingHref;
      bookingNav.dataset.bookingNav='true';
      bookingNav.textContent=pageEnglish?'Book':'Agendar';
      const contactNav=[...navMenu.querySelectorAll('a')].find(a=>/#(?:business-contact|contacto-business)$/.test(a.getAttribute('href')||''));
      navMenu.insertBefore(bookingNav,contactNav||navMenu.querySelector('.mobile-lang-switch'));
      bookingNav.addEventListener('click',()=>setMenuState(false));
    }

    const formActions=businessForm.querySelector('.form-actions');
    if(formActions&&!formActions.querySelector('[data-booking-cta]')){
      const bookingCta=document.createElement('a');
      bookingCta.className='btn btn-outline';
      bookingCta.href=bookingHref;
      bookingCta.dataset.bookingCta='true';
      bookingCta.textContent=pageEnglish?'Book an appointment':'Agendar atendimento';
      formActions.appendChild(bookingCta);
    }

    businessForm.addEventListener('submit',e=>{
      e.preventDefault();
      if(!businessForm.reportValidity()){
        if(status)status.textContent=pageEnglish?'Please complete the required fields.':'Preencha os campos obrigatórios.';
        return;
      }
      const d=new FormData(businessForm);
      const clean=value=>String(value||'').trim().replace(/\s+/g,' ');
      const name=clean(d.get('client_name'));
      const contact=clean(d.get('contact'));
      const email=clean(d.get('email'))||(pageEnglish?'Not provided':'Não indicado');
      const location=clean(d.get('location'))||(pageEnglish?'Not provided':'Não indicada');
      const service=clean(d.get('service_type'));
      const details=String(d.get('details')||'').trim().slice(0,1000);
      const text=pageEnglish
        ?`Hello HMATIAS Business Services.\n\nName / Entity: ${name}\nPhone / WhatsApp: ${contact}\nE-mail: ${email}\nLocation: ${location}\nService: ${service}\n\nRequest:\n${details}`
        :`Olá HMATIAS Business Services.\n\nNome / Entidade: ${name}\nTelefone / WhatsApp: ${contact}\nE-mail: ${email}\nLocalização: ${location}\nServiço: ${service}\n\nPedido:\n${details}`;
      if(status)status.textContent=pageEnglish?'Request prepared. WhatsApp will open for your review and final sending.':'Pedido preparado. O WhatsApp será aberto para revisão e envio final.';
      presentManualHandoff(businessForm,text,pageEnglish?'HMATIAS Business Services enquiry':'Pedido HMATIAS Business Services',status);
    });
  }

  const bookingForm=document.getElementById('bookingRequestForm');
  if(bookingForm){
    const status=document.getElementById('bookingFormStatus');
    const dateInput=bookingForm.querySelector('input[name="preferred_date"]');
    if(dateInput){
      const now=new Date();
      const localDate=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
      dateInput.min=localDate;
    }
    bookingForm.addEventListener('submit',e=>{
      e.preventDefault();
      if(!bookingForm.reportValidity()){
        if(status)status.textContent=pageEnglish?'Please complete the required fields.':'Preencha os campos obrigatórios.';
        return;
      }
      const d=new FormData(bookingForm);
      const clean=value=>String(value||'').trim().replace(/\s+/g,' ');
      const name=clean(d.get('client_name'));
      const contact=clean(d.get('contact'));
      const email=clean(d.get('email'))||(pageEnglish?'Not provided':'Não indicado');
      const service=clean(d.get('service_type'));
      const mode=clean(d.get('meeting_mode'));
      const date=clean(d.get('preferred_date'));
      const windowName=clean(d.get('time_window'));
      const location=clean(d.get('location'))||(pageEnglish?'Not provided':'Não indicada');
      const notes=String(d.get('notes')||'').trim().slice(0,800)||(pageEnglish?'No additional notes.':'Sem observações adicionais.');
      const text=pageEnglish
        ?`Hello HMATIAS. I would like to request an appointment.\n\nName / Entity: ${name}\nPhone / WhatsApp: ${contact}\nE-mail: ${email}\nService: ${service}\nMeeting format: ${mode}\nPreferred date: ${date}\nTime window: ${windowName}\nLocation: ${location}\n\nBrief context:\n${notes}\n\nI understand that this is an appointment request and the time is only confirmed after an express response from HMATIAS.`
        :`Olá HMATIAS. Pretendo solicitar um agendamento.\n\nNome / Entidade: ${name}\nTelefone / WhatsApp: ${contact}\nE-mail: ${email}\nServiço: ${service}\nModalidade: ${mode}\nData preferida: ${date}\nPeríodo: ${windowName}\nLocalização: ${location}\n\nContexto breve:\n${notes}\n\nCompreendo que este é um pedido de agendamento e que o horário só fica confirmado após resposta expressa da HMATIAS.`;
      if(status)status.textContent=pageEnglish?'Appointment request prepared. WhatsApp will open for review and sending.':'Pedido de agendamento preparado. O WhatsApp será aberto para revisão e envio.';
      presentManualHandoff(bookingForm,text,pageEnglish?'HMATIAS appointment request':'Pedido de atendimento HMATIAS',status);
    });
  }

  // Manual email alternative for users without WhatsApp. This opens the visitor's
  // email application; no lead is saved or claimed as received by clicking this link.
  const emailAlternativeConfigs=[
    {id:'contactForm',subject:'Pedido comercial HMATIAS',fields:[
      ['Nome','nome'],['Empresa','empresa'],['E-mail','email'],
      ['Telefone','telefone'],['Serviço','servico'],['Pedido','mensagem']
    ]},
    {id:'businessContactForm',subject:'Pedido HMATIAS Business Services',fields:[
      ['Nome / Entidade','client_name'],['Telefone / WhatsApp','contact'],
      ['E-mail','email'],['Localização','location'],
      ['Serviço','service_type'],['Pedido','details']
    ]},
    {id:'bookingRequestForm',subject:'Pedido de atendimento HMATIAS',fields:[
      ['Nome / Entidade','client_name'],['Telefone / WhatsApp','contact'],
      ['E-mail','email'],['Serviço','service_type'],['Modalidade','meeting_mode'],
      ['Data preferida','preferred_date'],['Período','time_window'],
      ['Localização','location'],['Observações','notes']
    ]}
  ];
  emailAlternativeConfigs.forEach(config=>{
    const target=document.getElementById(config.id);
    const send=target?.querySelector('button[type="submit"]');
    if(!target||!send||target.querySelector('[data-hmatias-email-alternative]'))return;
    // Reuse existing mailto links rather than adding duplicate email CTAs.
    const existing=target.querySelector('a[href^="mailto:"],a[data-email-fallback]');
    const link=existing||document.createElement('a');
    link.classList.add('hmatias-email-alternative');
    link.dataset.hmatiasEmailAlternative='true';
    if(!existing){
      link.classList.add('btn','btn-outline');
      link.href='mailto:geral@comercialhmatiasps.com';
      link.textContent=pageEnglish?'Prepare email instead':'Preparar por e-mail';
      link.style.margin='8px 0 0 10px';
    }
    link.setAttribute('aria-label',link.textContent.trim()+(pageEnglish?' (opens your email application)':' (abre a aplicação de e-mail)'));
    link.addEventListener('click',event=>{
      if(!target.reportValidity()){event.preventDefault();return;}
      const data=new FormData(target);
      const rows=config.fields.map(([label,name])=>{
        const value=String(data.get(name)||'').trim();
        return value?label+': '+value:'';
      }).filter(Boolean);
      const body=rows.join('\n').slice(0,2300)+'\n\n'+
        (pageEnglish?'Please confirm receipt and advise the next steps.':'Agradeço confirmação de receção e indicação dos próximos passos.');
      const subject=pageEnglish
        ?({contactForm:'HMATIAS business enquiry',businessContactForm:'HMATIAS Business Services enquiry',bookingRequestForm:'HMATIAS appointment request'}[config.id])
        :config.subject;
      link.href='mailto:geral@comercialhmatiasps.com?subject='+
        encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      const status=target.querySelector('[data-hmatias-manual-email-status]')||document.createElement('p');
      if(!status.dataset.hmatiasManualEmailStatus){
        status.dataset.hmatiasManualEmailStatus='true';
        status.setAttribute('role','status');
        status.style.gridColumn='1 / -1';
        status.style.fontSize='.875rem';
        link.insertAdjacentElement('afterend',status);
      }
      status.textContent=pageEnglish
        ?'Email prepared. Review and send it in your email app; it has not been submitted automatically.'
        :'E-mail preparado. Reveja e envie na sua aplicação; o pedido não foi submetido automaticamente.';
    });
    if(!existing)send.insertAdjacentElement('afterend',link);
  });

  const navLinks=[...document.querySelectorAll('.nav-menu a[href^="#"]')];
  const sections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible)navLinks.forEach(a=>{
        const active=a.getAttribute('href')===`#${visible.target.id}`;
        a.classList.toggle('active',active);
        if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
      });
    },{rootMargin:'-28% 0px -58% 0px',threshold:[.05,.15,.3,.5]});
    sections.forEach(s=>io.observe(s));
  }

  const back=document.createElement('button');
  back.className='hmatias-backtop';
  back.type='button';
  back.setAttribute('aria-label',pageEnglish?'Back to top':'Voltar ao início');
  back.textContent='↑';
  back.addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  document.body.appendChild(back);
  const updateBackToTop=()=>back.classList.toggle('show',scrollY>320);
  addEventListener('scroll',updateBackToTop,{passive:true});
  updateBackToTop();

  // Keep floating shortcuts clear of the homepage contact form.
  const homeContact=document.querySelector('.hmatias-home .contact');
  if(homeContact&&'IntersectionObserver' in window){
    const contactObserver=new IntersectionObserver(entries=>{
      document.body.classList.toggle('contact-in-view',entries[0].isIntersecting);
    });
    contactObserver.observe(homeContact);
  }

  const heroImg=document.querySelector('.hero-photo img');
  if(heroImg){heroImg.loading='eager';heroImg.fetchPriority='high';heroImg.decoding='async';}

  // Supply pages receive the structured multi-item sourcing request builder.
  const canonical=document.querySelector('link[rel="canonical"]')?.href||location.href;
  if(/\/supply(?:-en)?\.html(?:$|[?#])/.test(canonical)&&!document.querySelector('script[data-hmatias-supply-request]')){
    const supplyScript=document.createElement('script');
    supplyScript.src='supply-request.js?v=20260917-stable1';
    supplyScript.defer=true;
    supplyScript.dataset.hmatiasSupplyRequest='true';
    document.body.appendChild(supplyScript);
  }
})();
