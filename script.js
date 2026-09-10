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

  const clickStyle=document.createElement('style');
  clickStyle.textContent='.service-card[data-card-link],.division-card[data-card-link]{cursor:pointer}.service-card[data-card-link]:focus-visible,.division-card[data-card-link]:focus-visible{outline:2px solid #0065cc;outline-offset:2px;border-radius:8px}';
  document.head.appendChild(clickStyle);

  document.querySelectorAll('.service-card,.division-card').forEach(card=>{
    const primary=card.querySelector('a[href]');
    if(!primary)return;
    card.dataset.cardLink='true';
    card.tabIndex=0;
    card.setAttribute('role','link');
    card.setAttribute('aria-label',(card.querySelector('h3')?.textContent||primary.textContent||'').trim());
    card.addEventListener('click',e=>{
      if(e.target.closest('a,button,input,select,textarea,label'))return;
      if(primary.target==='_blank')window.open(primary.href,'_blank','noopener');
      else location.href=primary.href;
    });
    card.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      if(e.target.closest('a,button,input,select,textarea'))return;
      e.preventDefault();
      if(primary.target==='_blank')window.open(primary.href,'_blank','noopener');
      else location.href=primary.href;
    });
  });

  const navLinks=[...document.querySelectorAll('.nav-menu a[href^="#"]')];
  const sections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible)navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${visible.target.id}`));
    },{rootMargin:'-28% 0px -58% 0px',threshold:[.1,.5]});
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

  const projectPictures=document.querySelectorAll('.project picture');
  if(projectPictures.length){
    const lightbox=document.createElement('div');
    lightbox.className='hmatias-lightbox';
    lightbox.setAttribute('aria-hidden','true');
    lightbox.innerHTML=`<button class="hmatias-lightbox-close" type="button" aria-label="${pageEnglish?'Close image':'Fechar fotografia'}">×</button><div class="hmatias-lightbox-stage"><img alt="HMATIAS Project"><div class="hmatias-lightbox-caption"></div></div>`;
    const css=document.createElement('style');
    css.textContent='.hmatias-lightbox{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:30px;background:rgba(2,18,35,.94);backdrop-filter:blur(10px)}.hmatias-lightbox.open{display:flex}.hmatias-lightbox-stage{position:relative;max-width:90vw;max-height:90vh}.hmatias-lightbox img{max-width:100%;max-height:100%;border-radius:12px}.hmatias-lightbox-caption{margin-top:16px;color:#fff;font-size:14px;text-align:center}.hmatias-lightbox-close{position:absolute;top:-40px;right:0;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;padding:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center}@media(max-width:768px){.hmatias-lightbox-close{top:10px;right:10px}}';
    document.head.appendChild(css);
    document.body.appendChild(lightbox);
    const img=lightbox.querySelector('img');
    const cap=lightbox.querySelector('.hmatias-lightbox-caption');
    const close=()=>{lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.classList.remove('hmatias-lightbox-open');img.removeAttribute('src');};
    projectPictures.forEach(p=>p.addEventListener('click',()=>{
      const source=p.querySelector('img');
      if(!source)return;
      img.src=source.currentSrc||source.src;
      img.alt=source.alt||'HMATIAS';
      cap.textContent=source.alt||'HMATIAS';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden','false');
      document.body.classList.add('hmatias-lightbox-open');
    }));
    lightbox.querySelector('.hmatias-lightbox-close').addEventListener('click',close);
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lightbox.classList.contains('open'))close();});
  }

  const heroImg=document.querySelector('.hero-photo img');
  if(heroImg){heroImg.loading='eager';heroImg.fetchPriority='high';heroImg.decoding='async';}
})();
