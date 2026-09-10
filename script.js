(()=>{
  const pageEnglish=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const menuToggle=document.querySelector('.menu-toggle');
  const navMenu=document.querySelector('.nav-menu');

  menuToggle?.addEventListener('click',()=>{
    const open=navMenu?.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded',String(Boolean(open)));
  });
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

  const utilityStyle=document.createElement('style');
  utilityStyle.textContent='.btn-outline{border:1px solid #cbd8e5;background:#fff;color:#062d56;box-shadow:none}.btn-outline:hover{border-color:#0065cc;color:#0065cc;background:#f7fbff}@media(max-width:620px){.business-contact-form .btn-outline{width:100%;justify-content:center}}';
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
