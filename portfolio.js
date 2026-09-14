/* HMATIAS homepage portfolio + final information architecture consolidation. */
(() => {
  'use strict';

  const home = document.querySelector('.hmatias-home');
  if (!home) return;
  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const contactHref = isEn ? '#contact' : '#contacto';

  // Load only the small stylesheet needed by the new catalogue/KARTA blocks.
  if (!document.querySelector('link[data-hmatias-final-showcase]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'final-showcase.css?v=20260914-final';
    link.dataset.hmatiasFinalShowcase = 'true';
    document.head.appendChild(link);
  }

  // Keep the four homepage highlights factual and stable.
  const grid = document.querySelector('.hmatias-home .project-grid');
  const projects = isEn ? [
    { id:'project-01', webp:'projeto-01.webp', fallback:'projeto-01.jpg', alt:'Concrete and paving work delivered by HMATIAS', label:'Civil Construction · Real project', title:'Concrete & Paving', description:'Area preparation, concrete application and pavement finishing.' },
    { id:'project-02', webp:'projeto-02.webp', fallback:'projeto-02.jpg', alt:'Real HMATIAS poultry infrastructure project', label:'Agriculture · Real project', title:'Poultry Infrastructure', description:'Execution and preparation of infrastructure supporting poultry production.' },
    { id:'project-03', webp:'projeto-03.webp', fallback:'projeto-03.jpg', alt:'Roofing and maintenance work delivered by HMATIAS', label:'Construction · Maintenance · Real project', title:'Roofing & Maintenance', description:'Intervention and maintenance work on a roof structure.' },
    { id:'project-04', webp:'projeto-04.webp', fallback:'projeto-04.jpg', alt:'Real HMATIAS poultry production record', label:'Agriculture · Real project', title:'Poultry Operations', description:'Operational record related to broiler production activity.' }
  ] : [
    { id:'projeto-01', webp:'projeto-01.webp', fallback:'projeto-01.jpg', alt:'Betonagem e pavimentação executadas pela HMATIAS', label:'Construção Civil · Projeto real', title:'Betonagem & Pavimentação', description:'Preparação da área, aplicação de betão e acabamento de pavimento.' },
    { id:'projeto-02', webp:'projeto-02.webp', fallback:'projeto-02.jpg', alt:'Infraestrutura avícola real executada pela HMATIAS', label:'Agropecuária · Projeto real', title:'Infraestrutura Avícola', description:'Execução e preparação de infraestrutura destinada ao apoio da produção avícola.' },
    { id:'projeto-03', webp:'projeto-03.webp', fallback:'projeto-03.jpg', alt:'Trabalho de cobertura e manutenção executado pela HMATIAS', label:'Construção · Manutenção · Projeto real', title:'Cobertura & Manutenção', description:'Trabalho de intervenção e manutenção em estrutura de cobertura.' },
    { id:'projeto-04', webp:'projeto-04.webp', fallback:'projeto-04.jpg', alt:'Produção de frangos de corte em registo real da HMATIAS', label:'Agropecuária · Projeto real', title:'Operação Avícola', description:'Registo real de atividade operacional relacionada com a produção de frangos de corte.' }
  ];

  if (grid) {
    const cards = [...grid.querySelectorAll('.project')];
    projects.forEach((project, index) => {
      const card = cards[index];
      if (!card) return;
      card.dataset.projectId = project.id;
      const source = card.querySelector('source[type="image/webp"]');
      const image = card.querySelector('.project-image');
      if (source) source.srcset = project.webp;
      if (image) { image.src = project.fallback; image.alt = project.alt; image.loading = 'lazy'; image.decoding = 'async'; }
      const label = card.querySelector('.project-caption small');
      const title = card.querySelector('.project-caption h3');
      const description = card.querySelector('.project-caption p');
      const action = card.querySelector('.project-caption a');
      if (label) label.textContent = project.label;
      if (title) title.textContent = project.title;
      if (description) description.textContent = project.description;
      if (action) action.href = contactHref;
    });
  }

  // Merge the duplicated “Fornecimento Empresarial” + “HMATIAS Supply” cards.
  const serviceCards = [...document.querySelectorAll('#servicos .service-card, #services .service-card')];
  const supplyPrimary = serviceCards.find(card => /Fornecimento Empresarial|Business Supply/i.test(card.querySelector('h3')?.textContent || ''));
  const supplyDuplicate = serviceCards.find(card => /^HMATIAS Supply$/i.test((card.querySelector('h3')?.textContent || '').trim()));
  if (supplyPrimary) {
    const h3 = supplyPrimary.querySelector('h3');
    const p = supplyPrimary.querySelector('p');
    const a = supplyPrimary.querySelector('a');
    if (h3) h3.textContent = isEn ? 'Supply & Procurement' : 'Supply & Procurement';
    if (p) p.textContent = isEn
      ? 'Procurement, sourcing and business supply of materials, consumables, products and equipment according to specification, quantity and operational need.'
      : 'Procurement, sourcing e fornecimento empresarial de materiais, consumíveis, produtos e equipamentos conforme especificação, quantidade e necessidade operacional.';
    if (a) { a.href = isEn ? 'supply-en.html' : 'supply.html'; a.textContent = isEn ? 'Explore Supply & Procurement →' : 'Conhecer Supply & Procurement →'; }
  }
  if (supplyDuplicate && supplyDuplicate !== supplyPrimary) supplyDuplicate.remove();

  // Add a dedicated works-catalogue CTA after the four homepage highlights.
  const projectsSection = document.querySelector('#projetos, #projects');
  if (projectsSection && !document.querySelector('.works-catalogue-cta')) {
    const catalogue = document.createElement('section');
    catalogue.className = 'works-catalogue-cta';
    catalogue.setAttribute('aria-labelledby', 'works-catalogue-title');
    catalogue.innerHTML = isEn ? `
      <div class="container works-catalogue-inner"><div><span class="eyebrow">HMATIAS WORKS CATALOGUE</span><h2 id="works-catalogue-title">A broader visual record of delivered work.</h2><p>The homepage keeps only selected highlights. The catalogue groups the wider visual archive by type of intervention without making the homepage heavier.</p></div><a class="btn btn-light" href="work-catalogue.html">Open works catalogue →</a></div>` : `
      <div class="container works-catalogue-inner"><div><span class="eyebrow">CATÁLOGO DE OBRAS HMATIAS</span><h2 id="works-catalogue-title">Um registo visual mais amplo dos trabalhos executados.</h2><p>A página principal mantém apenas projetos em destaque. O catálogo reúne o arquivo visual por tipologia de intervenção sem tornar a página inicial mais pesada.</p></div><a class="btn btn-light" href="catalogo-obras.html">Abrir catálogo de obras →</a></div>`;
    projectsSection.insertAdjacentElement('afterend', catalogue);
  }

  // Clarify the divisions area and add KARTA as a digital product, not as a construction service.
  const divisions = document.querySelector('#divisoes, #divisions');
  if (divisions) {
    const eyebrow = divisions.querySelector('.section-heading .eyebrow');
    const title = divisions.querySelector('.section-heading h2');
    const intro = divisions.querySelector('.section-heading p');
    if (eyebrow) eyebrow.textContent = isEn ? 'HMATIAS DIVISIONS & PRODUCTS' : 'DIVISÕES & PRODUTOS HMATIAS';
    if (title) title.textContent = isEn ? 'Specialised services and digital products under one institutional structure.' : 'Serviços especializados e produtos digitais sob a mesma estrutura institucional.';
    if (intro) intro.textContent = isEn ? 'HMATIAS keeps construction, facilities and supply as core operational areas, with specialised divisions and digital products presented separately.' : 'A HMATIAS mantém construção, facilities e supply como áreas operacionais principais, apresentando separadamente as divisões especializadas e os produtos digitais.';
    const cards = divisions.querySelector('.division-cards');
    if (cards && !cards.querySelector('[data-karta-card]')) {
      const karta = document.createElement('article');
      karta.className = 'division-card karta';
      karta.dataset.kartaCard = 'true';
      karta.innerHTML = isEn
        ? '<span class="division-card-kicker">Digital Product · Alpha</span><h3>KARTA Wallet Mobile</h3><p>A mobile-first digital identity wallet in development, focused on secure access, identity profile, document storage architecture and audit trail.</p><a href="karta-en.html">Discover KARTA <span>→</span></a>'
        : '<span class="division-card-kicker">Produto Digital · Alpha</span><h3>KARTA Wallet Mobile</h3><p>Carteira digital de identidade mobile-first em desenvolvimento, focada em acesso seguro, perfil de identidade, arquitetura de armazenamento de documentos e registo de atividade.</p><a href="karta.html">Conhecer KARTA <span>→</span></a>';
      cards.appendChild(karta);
    }
    if (!document.querySelector('.karta-teaser')) {
      const teaser = document.createElement('section');
      teaser.className = 'karta-teaser';
      teaser.setAttribute('aria-labelledby', 'karta-teaser-title');
      teaser.innerHTML = isEn ? `
        <div class="container karta-teaser-grid"><div class="karta-copy"><span class="karta-badge">HMATIAS DIGITAL · ALPHA</span><h2 id="karta-teaser-title">KARTA Wallet Mobile</h2><p>Your identity. Your documents. Your control. KARTA is being developed as a secure digital identity wallet with a mobile-first experience.</p><div class="karta-points"><span>Secure wallet access</span><span>Identity profile</span><span>Document storage architecture</span><span>Audit trail</span></div><a class="btn btn-primary" href="karta-en.html">View product page →</a></div><div class="karta-device" aria-hidden="true"><div class="karta-notch"></div><div class="karta-screen"><small>KARTA</small><strong>Identity Wallet</strong><span>ALPHA</span><i></i><i></i><i></i></div></div></div>` : `
        <div class="container karta-teaser-grid"><div class="karta-copy"><span class="karta-badge">HMATIAS DIGITAL · ALPHA</span><h2 id="karta-teaser-title">KARTA Wallet Mobile</h2><p>A sua identidade. Os seus documentos. O seu controlo. A KARTA está em desenvolvimento como carteira digital de identidade com experiência mobile-first.</p><div class="karta-points"><span>Acesso seguro à carteira</span><span>Perfil de identidade</span><span>Arquitetura de armazenamento de documentos</span><span>Registo de atividade</span></div><a class="btn btn-primary" href="karta.html">Ver página do produto →</a></div><div class="karta-device" aria-hidden="true"><div class="karta-notch"></div><div class="karta-screen"><small>KARTA</small><strong>Identity Wallet</strong><span>ALPHA</span><i></i><i></i><i></i></div></div></div>`;
      divisions.insertAdjacentElement('afterend', teaser);
    }
  }
})();
