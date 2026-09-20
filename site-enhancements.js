/* HMATIAS shared SEO + accessibility refinements. No tracking and no user data collection. */
(() => {
  'use strict';
  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const path = window.location.pathname || '/';
  const isHome = path === '/' || path === '/index.html' || path === '/en.html';

  if (isHome && !document.querySelector('link[data-hmatias-premium-editorial]')) {
    const premium = document.createElement('link');
    premium.rel = 'stylesheet';
    premium.href = 'premium-editorial.css?v=20260920-v1';
    premium.dataset.hmatiasPremiumEditorial = 'true';
    document.head.appendChild(premium);
  }

  if (isHome && !document.querySelector('link[data-hmatias-premium-typography]')) {
    const typography = document.createElement('link');
    typography.rel = 'stylesheet';
    typography.href = 'premium-typography.css?v=20260920-v1';
    typography.dataset.hmatiasPremiumTypography = 'true';
    document.head.appendChild(typography);
  }

  if (isHome && !document.querySelector('link[data-hmatias-company-editorial]')) {
    const company = document.createElement('link');
    company.rel = 'stylesheet';
    company.href = 'company-editorial.css?v=20260920-v1';
    company.dataset.hmatiasCompanyEditorial = 'true';
    document.head.appendChild(company);
  }

  const setMetaDescription = () => {
    const descriptions = {
      '/': 'Construção civil, facilities, manutenção, procurement e fornecimento empresarial para empresas e instituições em Luanda e Angola.',
      '/index.html': 'Construção civil, facilities, manutenção, procurement e fornecimento empresarial para empresas e instituições em Luanda e Angola.',
      '/en.html': 'Construction, facilities, maintenance, procurement and business supply services for companies and institutions in Luanda and Angola.',
      '/servicos-administrativos.html': 'Apoio administrativo, documental e empresarial para profissionais, PME e empresas, com atendimento em Luanda e suporte remoto quando aplicável.',
      '/business-services.html': 'Administrative, document and business support for professionals, SMEs and companies, with service in Luanda and remote support where applicable.',
      '/clean-en.html': 'HMATIAS Clean supplies cleaning and hygiene products for professional and domestic use, with structured quotation requests in Angola.'
    };
    const meta = document.querySelector('meta[name="description"]');
    if (meta && descriptions[path]) meta.content = descriptions[path];
  };

  const improveNavigation = () => {
    const nav = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (!nav) return;
    nav.setAttribute('role', 'navigation');
    if (!nav.id) nav.id = 'main-navigation';
    if (toggle) toggle.setAttribute('aria-controls', nav.id);

    // Keep the desktop control compact while ensuring the visible label is part of the accessible name.
    document.querySelectorAll('.nav-actions [data-lang-switch]').forEach(link => {
      const shortLabel = isEn ? 'PT' : 'EN';
      const actionLabel = isEn ? 'Mudar para Português' : 'Switch to English';
      link.textContent = shortLabel;
      link.title = actionLabel;
      link.setAttribute('aria-label', `${shortLabel} — ${actionLabel}`);
    });

    const mq = window.matchMedia('(max-width: 850px)');
    const updateState = () => {
      const mobile = mq.matches;
      const open = toggle?.getAttribute('aria-expanded') === 'true' || nav.classList.contains('open');
      if (mobile && !open) {
        nav.setAttribute('aria-hidden', 'true');
        nav.querySelectorAll('a,button').forEach(el => {
          if (!el.hasAttribute('data-old-tabindex')) el.dataset.oldTabindex = el.getAttribute('tabindex') || '';
          el.setAttribute('tabindex', '-1');
        });
      } else {
        nav.removeAttribute('aria-hidden');
        nav.querySelectorAll('[data-old-tabindex]').forEach(el => {
          if (el.dataset.oldTabindex) el.setAttribute('tabindex', el.dataset.oldTabindex);
          else el.removeAttribute('tabindex');
          delete el.dataset.oldTabindex;
        });
      }
    };
    updateState();
    mq.addEventListener?.('change', updateState);
    if (toggle) new MutationObserver(updateState).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
  };

  const improveLinks = () => {
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      link.title = isEn ? 'Opens your email application' : 'Abre a aplicação de e-mail';
    });
    document.querySelectorAll('a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (/\.pdf(?:$|[?#])/.test(href)) link.title = isEn ? 'Opens a PDF document in a new tab' : 'Abre um documento PDF numa nova aba';
    });
    document.querySelectorAll('[data-clean-product][aria-label], .whatsapp-float[aria-label], .mobile-whatsapp-link[aria-label]').forEach(link => {
      if ((link.textContent || '').trim()) link.removeAttribute('aria-label');
    });
  };

  const improveAssistantAccessibility = () => {
    const apply = () => {
      const toggle = document.querySelector('.hmatias-assistant-toggle');
      if (!toggle) return false;
      if (!toggle.getAttribute('aria-label')) {
        toggle.setAttribute('aria-label', isEn ? 'Open HMATIAS Assistant' : 'Abrir Assistente HMATIAS');
      }
      return true;
    };
    if (apply()) return;
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const premiumiseHomepageIcons = () => {
    if (!isHome) return;
    const icons = [
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V7l8-3 8 3v13"/><path d="M8 20v-4h8v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17l7-7 3 3-7 7H4v-3Z"/><path d="M13 8l2-2 3 3-2 2M16 5l1-1 3 3-1 1"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.3 2.3-3-3L14.7 6.3Z"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z"/><path d="M4 7.5V16l8 4 8-4V7.5M12 11v9"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5M8 10.5h5M10.5 8v5"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l1 2h3v14H4V6h3l1-2Z"/><path d="M8 11h8M8 15h6"/></svg>'
    ];
    document.querySelectorAll('.service-grid .service-card .service-icon').forEach((icon, index) => {
      if (icons[index]) icon.innerHTML = icons[index];
    });
  };

  const premiumiseAboutLeadership = () => {
    if (!isHome) return;
    const section = document.getElementById('empresa');
    const container = section?.querySelector('.company-impact-grid') || section?.querySelector('.container');
    if (!section || !container || container.dataset.premiumCompany === 'true') return;
    container.dataset.premiumCompany = 'true';

    container.innerHTML = isEn ? `
      <div class="company-editorial">
        <div class="company-story">
          <span class="eyebrow">ABOUT HMATIAS</span>
          <h2>An Angolan company <span>built to execute.</span></h2>
          <p class="company-intro">HMATIAS – Prestação de Serviços, SU, LDA operates across construction, facilities, procurement and business supply. Each engagement starts with the client’s real requirement — from assessment and sourcing to execution and follow-up.</p>
          <p class="company-intro">Our approach combines practical field presence, specification-led sourcing and direct coordination. The objective is straightforward: turn operational requirements into executable solutions with clear scope and defined responsibility.</p>
        </div>
        <div class="company-facts" aria-label="HMATIAS institutional information">
          <div class="company-fact"><small>Established</small><strong>2023</strong></div>
          <div class="company-fact"><small>Commercial Registry</small><strong>24.094-23</strong></div>
          <div class="company-fact"><small>Tax ID</small><strong>5001578065</strong></div>
          <div class="company-fact"><small>Operational Base</small><strong>Viana · Luanda · Angola</strong></div>
        </div>
      </div>
      <div class="leadership-editorial" aria-labelledby="leadership-title">
        <div class="leadership-mark" aria-hidden="true"><span>HM</span></div>
        <div class="leadership-copy">
          <span class="eyebrow">LEADERSHIP</span>
          <h3 id="leadership-title">Henrique Matias</h3>
          <span class="leadership-role">Founder &amp; Managing Director</span>
          <p>Responsible for the strategic and operational direction of HMATIAS, with a focus on business development, construction, facilities, procurement and supply. The company’s management model prioritises direct follow-up, practical decisions and long-term commercial relationships.</p>
          <a class="leadership-link" href="https://www.linkedin.com/in/henrique-matias-8059891a0/" target="_blank" rel="noopener noreferrer">Professional profile →</a>
        </div>
      </div>` : `
      <div class="company-editorial">
        <div class="company-story">
          <span class="eyebrow">SOBRE A HMATIAS</span>
          <h2>Uma empresa angolana <span>construída para executar.</span></h2>
          <p class="company-intro">A HMATIAS – Prestação de Serviços, SU, LDA atua entre construção, facilities, procurement e fornecimento empresarial. Cada trabalho parte da necessidade real do cliente — do levantamento e sourcing à execução e ao acompanhamento.</p>
          <p class="company-intro">A nossa abordagem combina presença prática no terreno, pesquisa orientada por especificação e coordenação direta. O objetivo é simples: transformar necessidades operacionais em soluções executáveis, com escopo claro e responsabilidade definida.</p>
        </div>
        <div class="company-facts" aria-label="Informação institucional da HMATIAS">
          <div class="company-fact"><small>Fundação</small><strong>2023</strong></div>
          <div class="company-fact"><small>Registo Comercial</small><strong>24.094-23</strong></div>
          <div class="company-fact"><small>NIF</small><strong>5001578065</strong></div>
          <div class="company-fact"><small>Base Operacional</small><strong>Viana · Luanda · Angola</strong></div>
        </div>
      </div>
      <div class="leadership-editorial" aria-labelledby="leadership-title">
        <div class="leadership-mark" aria-hidden="true"><span>HM</span></div>
        <div class="leadership-copy">
          <span class="eyebrow">LIDERANÇA</span>
          <h3 id="leadership-title">Henrique Matias</h3>
          <span class="leadership-role">Fundador &amp; Gerente</span>
          <p>Responsável pela direção estratégica e operacional da HMATIAS, com foco no desenvolvimento de negócios, construção, facilities, procurement e supply. A gestão privilegia acompanhamento direto, decisões práticas e relações comerciais de longo prazo.</p>
          <a class="leadership-link" href="https://www.linkedin.com/in/henrique-matias-8059891a0/" target="_blank" rel="noopener noreferrer">Perfil profissional →</a>
        </div>
      </div>`;
  };

  const improveCleanPage = () => {
    if (!['/clean.html', '/clean-en.html'].includes(path)) return;

    document.querySelectorAll('article.clean-feature-card').forEach(card => {
      const replacement = document.createElement('div');
      [...card.attributes].forEach(attr => replacement.setAttribute(attr.name, attr.value));
      replacement.setAttribute('role', 'group');
      while (card.firstChild) replacement.appendChild(card.firstChild);
      card.replaceWith(replacement);
      const heading = replacement.querySelector('h3');
      if (heading) {
        if (!heading.id) heading.id = `${replacement.id || 'clean-product'}-title`;
        replacement.setAttribute('aria-labelledby', heading.id);
      }
    });

    if (path === '/clean-en.html') {
      const hasCatalog = [...document.querySelectorAll('script[type="application/ld+json"]')].some(s => /OfferCatalog/.test(s.textContent || ''));
      if (!hasCatalog) {
        const schema = document.createElement('script');
        schema.type = 'application/ld+json';
        schema.textContent = JSON.stringify({
          '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'HMATIAS Clean',
          url: 'https://comercialhmatiasps.com/clean-en.html',
          itemListElement: [
            { '@type': 'Offer', name: '123 Pine Gel 500 ml', availability: 'https://schema.org/PreOrder' },
            { '@type': 'Offer', name: 'Taurus Pine Gel T563P 1 kg', price: '8500', priceCurrency: 'AOA', availability: 'https://schema.org/PreOrder' },
            { '@type': 'Offer', name: 'Taurus Pine Gel T563P 5 kg', price: '26500', priceCurrency: 'AOA', availability: 'https://schema.org/PreOrder' },
            { '@type': 'Offer', name: 'Taurus Pine Gel T563P 20 kg', price: '94000', priceCurrency: 'AOA', availability: 'https://schema.org/PreOrder' }
          ]
        });
        document.head.appendChild(schema);
      }
    }

    if (!document.getElementById('clean-business-use')) {
      const quote = document.querySelector('.clean-quote-section');
      if (quote?.parentNode) {
        const section = document.createElement('section');
        section.className = 'unit-main soft';
        section.id = 'clean-business-use';
        section.innerHTML = isEn ? '<div class="container"><div class="unit-heading"><span class="eyebrow blue">CLEANING PRODUCTS IN LUANDA</span><h2>Cleaning and hygiene supply for homes, companies and professional operations.</h2><p>HMATIAS Clean organises product requests by reference, format, quantity and delivery location. This makes it easier to request a quotation while keeping price, stock and lead time subject to commercial confirmation.</p><p>Professional requirements may involve recurring quantities, specific pack sizes or catalogue references. Availability, price, lead time and delivery conditions are confirmed before an order is accepted.</p><p>For broader business procurement, use <a href="supply-en.html">HMATIAS Supply & Procurement</a>. For recurring facility requirements, see <a href="facilities-en.html">Facilities & Maintenance</a>.</p></div></div>' : '<div class="container"><div class="unit-heading"><span class="eyebrow blue">PRODUTOS DE LIMPEZA EM LUANDA</span><h2>Fornecimento de limpeza e higiene para casas, empresas e operações profissionais.</h2><p>A HMATIAS Clean organiza pedidos por produto, referência, formato, quantidade e localização de entrega. Isso permite solicitar cotação de forma objetiva, mantendo preço, stock e prazo sujeitos a confirmação comercial.</p><p>Necessidades profissionais podem envolver quantidades recorrentes, embalagens específicas ou referências de catálogo. A confirmação final considera disponibilidade, preço, prazo e condições de entrega.</p><p>Para procurement empresarial, consulte <a href="supply.html">HMATIAS Supply & Procurement</a>. Para necessidades recorrentes de instalações, consulte <a href="facilities.html">Facilities & Manutenção</a>.</p></div></div>';
        quote.parentNode.insertBefore(section, quote);
      }
    }
  };

  const normaliseImages = () => {
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
    });
  };

  const run = () => {
    setMetaDescription();
    improveNavigation();
    improveLinks();
    improveAssistantAccessibility();
    premiumiseHomepageIcons();
    premiumiseAboutLeadership();
    improveCleanPage();
    normaliseImages();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();