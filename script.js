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
    const serviceSelect=form.querySelector('select[name="servico"]');
    if(serviceSelect&&!Array.from(serviceSelect.options).some(o=>/Business Services|Apoio administrativo/i.test(o.textContent||''))){
      const option=document.createElement('option');
      option.textContent=pageEnglish?'HMATIAS Business Services / Administrative & Visa Support':'HMATIAS Business Services / Apoio administrativo & Vistos';
      const other=Array.from(serviceSelect.options).find(o=>/^(Outro|Other)$/i.test((o.textContent||'').trim()));
      serviceSelect.insertBefore(option,other||null);
    }

    form.addEventListener('submit',e=>{
      e.preventDefault();
      const d=new FormData(form);
      const name=d.get('nome')||'';
      const company=d.get('empresa')||(pageEnglish?'Not provided':'Não indicada');
      const email=d.get('email')||(pageEnglish?'Not provided':'Não indicado');
      const phone=d.get('telefone')||(pageEnglish?'Not provided':'Não indicado');
      const service=d.get('servico')||(pageEnglish?'Not provided':'Não indicado');
      const message=d.get('mensagem')||'';
      const text=pageEnglish
        ?`Hello HMATIAS.\n\nName: ${name}\nCompany: ${company}\nE-mail: ${email}\nPhone/WhatsApp: ${phone}\nService: ${service}\n\nMessage:\n${message}`
        :`Olá HMATIAS.\n\nNome: ${name}\nEmpresa: ${company}\nE-mail: ${email}\nTelefone/WhatsApp: ${phone}\nServiço: ${service}\n\nMensagem:\n${message}`;
      window.open('https://wa.me/244948806673?text='+encodeURIComponent(text),'_blank','noopener');
    });
  }

  const servicesSection=document.querySelector('.services');
  if(servicesSection&&!document.getElementById(pageEnglish?'specialised-divisions':'divisoes')){
    const section=document.createElement('section');
    section.className='divisions';
    section.id=pageEnglish?'specialised-divisions':'divisoes';
    section.innerHTML=pageEnglish
      ?`<div class="container"><div class="section-heading center"><span class="eyebrow blue">SPECIALISED DIVISIONS</span><h2>Complementary solutions with dedicated catalogues.</h2><p>Specialised HMATIAS divisions remain separate from our core construction, facilities and supply offering, while staying easy to discover from the institutional website.</p></div><div class="division-grid"><article class="division-card"><div><span class="division-kicker">HMATIAS BUSINESS SERVICES</span><h3>Administrative, document & visa support</h3><p>Administrative and document support for professionals and companies, including administrative assistance with consular appointments and visa processes.</p><div class="division-actions"><a class="btn btn-primary" href="business-services.html">Explore Business Services →</a></div></div><div class="division-media"><span class="division-symbol">BS</span></div></article><article class="division-card"><div><span class="division-kicker">HMATIAS CLEAN</span><h3>Cleaning & hygiene products</h3><p>Cleaning and hygiene products for professional and domestic use, with a dedicated catalogue and quantity supply options.</p><div class="division-actions"><a class="btn btn-primary" href="hmatias-clean-en.html">Explore HMATIAS Clean →</a></div></div><div class="division-media"><span class="division-symbol">HC</span></div></article></div></div>`
      :`<div class="container"><div class="section-heading center"><span class="eyebrow blue">DIVISÕES ESPECIALIZADAS</span><h2>Soluções complementares com catálogos próprios.</h2><p>As divisões especializadas da HMATIAS permanecem separadas das áreas centrais de construção, facilities e supply, mas continuam facilmente identificáveis a partir do site institucional.</p></div><div class="division-grid"><article class="division-card"><div><span class="division-kicker">HMATIAS BUSINESS SERVICES</span><h3>Apoio administrativo, documental & vistos</h3><p>Apoio administrativo e documental para profissionais e empresas, incluindo assistência administrativa a agendamentos consulares e processos de visto.</p><div class="division-actions"><a class="btn btn-primary" href="servicos-administrativos.html">Conhecer Business Services →</a></div></div><div class="division-media"><span class="division-symbol">BS</span></div></article><article class="division-card"><div><span class="division-kicker">HMATIAS CLEAN</span><h3>Produtos de limpeza & higiene</h3><p>Produtos de limpeza e higiene para uso profissional e doméstico, com catálogo próprio e fornecimento por quantidade.</p><div class="division-actions"><a class="btn btn-primary" href="hmatias-clean.html">Conhecer HMATIAS Clean →</a></div></div><div class="division-media"><span class="division-symbol">HC</span></div></article></div></div>`;
    servicesSection.insertAdjacentElement('afterend',section);

    if(navMenu&&!navMenu.querySelector(`a[href="#${section.id}"]`)){
      const link=document.createElement('a');
      link.href=`#${section.id}`;
      link.textContent=pageEnglish?'Divisions':'Divisões';
      const projectsLink=Array.from(navMenu.querySelectorAll('a')).find(a=>a.getAttribute('href')===(pageEnglish?'#projects':'#projetos'));
      navMenu.insertBefore(link,projectsLink||null);
      link.addEventListener('click',()=>{
        navMenu.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded','false');
      });
    }
  }

  const clickStyle=document.createElement('style');
  clickStyle.textContent='.service-card[data-card-link],.division-card[data-card-link]{cursor:pointer}.service-card[data-card-link]:focus-visible,.division-card[data-card-link]:focus-visible{outline:3px solid #48baf5;outline-offset:4px}';
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
    },{rootMargin:'-28% 0px -58% 0px',threshold:[.05,.15,.3,.5]});
    sections.forEach(s=>io.observe(s));
  }

  const back=document.createElement('button');
  back.className='hmatias-backtop';
  back.type='button';
  back.setAttribute('aria-label',pageEnglish?'Back to top':'Voltar ao início');
  back.textContent='↑';
  back.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
  document.body.appendChild(back);
  addEventListener('scroll',()=>back.classList.toggle('show',scrollY>320),{passive:true});

  const projectPictures=document.querySelectorAll('.project picture');
  if(projectPictures.length){
    const lightbox=document.createElement('div');
    lightbox.className='hmatias-lightbox';
    lightbox.setAttribute('aria-hidden','true');
    lightbox.innerHTML=`<button class="hmatias-lightbox-close" type="button" aria-label="${pageEnglish?'Close image':'Fechar fotografia'}">×</button><div class="hmatias-lightbox-stage"><img alt=""><div class="hmatias-lightbox-caption"></div></div>`;
    const css=document.createElement('style');
    css.textContent='.hmatias-lightbox{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:30px;background:rgba(2,18,35,.94);backdrop-filter:blur(10px)}.hmatias-lightbox.open{display:flex}.hmatias-lightbox-stage{max-width:min(94vw,1400px);max-height:90vh;text-align:center}.hmatias-lightbox-stage img{display:block;max-width:94vw;max-height:82vh;width:auto;height:auto;object-fit:contain;border-radius:10px;box-shadow:0 28px 80px rgba(0,0,0,.45)}.hmatias-lightbox-caption{margin-top:12px;color:#fff;font-size:12px;font-weight:800}.hmatias-lightbox-close{position:fixed;top:18px;right:22px;width:46px;height:46px;border:1px solid rgba(255,255,255,.25);border-radius:50%;background:rgba(255,255,255,.1);color:#fff;font-size:30px;cursor:pointer}body.hmatias-lightbox-open{overflow:hidden}@media(max-width:850px){.hmatias-lightbox{padding:16px}.hmatias-lightbox-close{top:12px;right:12px}}';
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
