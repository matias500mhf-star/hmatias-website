(()=>{
  const pageEnglish=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const menuToggle=document.querySelector('.menu-toggle');
  const navMenu=document.querySelector('.nav-menu');

  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reducedMotion&&'IntersectionObserver' in window){
    const motionItems=[...document.querySelectorAll([
      '.section-heading',
      '.service-card',
      '.sector-grid article',
      '.company-grid > *',
      '.why-us-grid article',
      '.project',
      '.supply-inner > *',
      '.cta-inner > *',
      '.contact-grid > *',
      '.business-service-card',
      '.business-contact-grid > *',
      '.booking-hero-grid > *',
      '.booking-layout > *',
      '.booking-scope-grid article'
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

  menuToggle?.addEventListener('click',()=>{
    const open=navMenu?.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded',String(Boolean(open)));
  });

  const desktopLang=document.querySelector('.nav-actions .lang-switch[data-lang-switch]');
  if(navMenu&&desktopLang&&!navMenu.querySelector('.mobile-lang-switch')){
    const mobileLang=desktopLang.cloneNode(true);
    mobileLang.classList.add('mobile-lang-switch');
    mobileLang.textContent=pageEnglish?'PT — Português':'EN — English';
    navMenu.appendChild(mobileLang);
  }

  const headerQuote=document.querySelector('.hmatias-header .nav-actions [data-quote-link]');
  if(navMenu&&headerQuote){
    const mobileQuote=headerQuote.cloneNode(true);
    mobileQuote.classList.add('mobile-quote-link');
    navMenu.appendChild(mobileQuote);
  }

  document.querySelectorAll('.nav-menu a').forEach(a=>a.addEventListener('click',()=>{
    navMenu?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded','false');
  }));

  const year=document.getElementById('year');
  if(year)year.textContent=String(new Date().getFullYear());

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
        ?`Hello HMATIAS.\n\nName: ${name}\nCompany: ${company}\nE-mail: ${email}\nPhone/WhatsApp: ${phone}\nService: ${service}\n\nMessage:\n${message}`
        :`Olá HMATIAS.\n\nNome: ${name}\nEmpresa: ${company}\nE-mail: ${email}\nTelefone/WhatsApp: ${phone}\nServiço: ${service}\n\nMensagem:\n${message}`;
      window.open('https://wa.me/244948806673?text='+encodeURIComponent(text),'_blank','noopener');
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
      bookingNav.addEventListener('click',()=>{
        navMenu.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded','false');
      });
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
      window.open('https://wa.me/244948806673?text='+encodeURIComponent(text),'_blank','noopener');
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
      window.open('https://wa.me/244948806673?text='+encodeURIComponent(text),'_blank','noopener');
    });
  }

  const utilityStyle=document.createElement('style');
  utilityStyle.textContent='.btn-outline{border:1px solid #cbd8e5;background:#fff;color:#062d56;box-shadow:none}.btn-outline:hover{border-color:#0065cc;color:#0065cc;background:#f7fbff}.mobile-lang-switch{display:none!important}@media(max-width:850px){.nav-menu .mobile-lang-switch{display:flex!important;align-items:center;justify-content:flex-start;margin-top:8px;padding-top:14px!important;border-top:1px solid #dce6f0!important;color:#0065cc!important;font-weight:900!important}}@media(max-width:620px){.business-contact-form .btn-outline{width:100%;justify-content:center}}';
  document.head.appendChild(utilityStyle);

  const navLinks=[...document.querySelectorAll('.nav-menu a[href^="#"]')];
  const sections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible)navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${visible.target.id}`));
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
  addEventListener('scroll',()=>back.classList.toggle('show',scrollY>320),{passive:true});

  const heroImg=document.querySelector('.hero-photo img');
  if(heroImg){heroImg.loading='eager';heroImg.fetchPriority='high';heroImg.decoding='async';}
})();
