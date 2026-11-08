/* HMATIAS shared site bootstrap. Keeps UI enhancements independent from analytics. */
(() => {
  'use strict';

  const stablePresentation = document.body?.classList.contains('site-stable');

  const reviewStylesheet = 'site-review.css?v=20260917-stable2';
  const premiumTypographyStylesheet = 'premium-typography.css?v=20260920-final2';
  const brandLockStylesheet = 'brand-lock.css?v=20260920-final1';
  const corporateCleanupStylesheet = 'corporate-cleanup.css?v=20260920-final1';
  const officialEmail = 'geral@comercialhmatiasps.com';
  const inactiveEmails = new Set([officialEmail]);

  const loadStylesheet = (selector, href, datasetName) => {
    if (document.querySelector(selector) || document.querySelector('link[href*="' + href.split('?')[0] + '"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (datasetName) link.dataset[datasetName] = 'true';
    document.head.appendChild(link);
  };

  const loadScript = (selector, src, datasetName, target = document.head) => {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (datasetName) script.dataset[datasetName] = 'true';
    target.appendChild(script);
  };

  const ensureReviewStylesheet = () => {
    const existing = document.querySelector('link[href*="site-review.css"]');
    if (existing) {
      existing.dataset.hmatiasSiteReview = 'true';
      return;
    }
    loadStylesheet('link[data-hmatias-site-review]', reviewStylesheet, 'hmatiasSiteReview');
  };

  const ensureSharedAssets = () => {
    if (!stablePresentation) ensureReviewStylesheet();
    if (!stablePresentation && document.body?.classList.contains('hmatias-home')) {
      loadStylesheet('link[data-hmatias-premium-typography]', premiumTypographyStylesheet, 'hmatiasPremiumTypography');
    }
    loadStylesheet('link[data-hmatias-brand-lock]', brandLockStylesheet, 'hmatiasBrandLock');
    loadStylesheet('link[data-hmatias-contact-system]', 'site-contact-system.css?v=20261108-contact-unified1', 'hmatiasContactSystem');
    loadStylesheet('link[data-hmatias-mobile-contact]', 'mobile-contact-layout.css?v=20261008-1', 'hmatiasMobileContact');
    if (!stablePresentation) loadStylesheet('link[data-hmatias-corporate-cleanup]', corporateCleanupStylesheet, 'hmatiasCorporateCleanup');
    // This is an opt-in integration: no request, storage or browser-side CRM calls
    // until the secure Worker endpoint and Turnstile site key are explicitly configured.
    const leadEndpoint=document.documentElement.dataset.hmatiasLeadsEndpoint||'';
    const leadSiteKey=document.documentElement.dataset.hmatiasTurnstileSiteKey||'';
    if(/^https:\/\/[^\s]+\/v1\/leads$/.test(leadEndpoint)&&leadSiteKey&&
       document.querySelector('#contactForm,#businessContactForm,#bookingRequestForm')){
      loadScript('script[data-hmatias-lead-intake]','lead-intake-client.js?v=20261008-1','hmatiasLeadIntake',document.body);
    }
    // Opt-in to persisted institutional leads after the Worker capability check.
    // Keep WhatsApp and email working if the backend remains disabled.
    if(!leadEndpoint && document.querySelector('#contactForm,#businessContactForm,#bookingRequestForm')){
      loadScript('script[data-hmatias-website-leads]','website-lead-client.js?v=20261014-lazy1','hmatiasWebsiteLeads',document.body);
    }
    loadScript('script[data-hmatias-site-enhancements]', 'site-enhancements.js?v=20261019-icons1', 'hmatiasSiteEnhancements');
    loadScript('script[data-hmatias-growth-intelligence]', 'growth-intelligence.js?v=20261009-email-cta1', 'hmatiasGrowthIntelligence');
  };

  const ensureCatalogueIdentity = () => {
    const path = window.location.pathname || '/';
    if (!/\/(?:catalogo-obras|work-catalogue)\.html$/.test(path)) return;
    document.body?.classList.add('hmatias-catalogue');
    loadStylesheet('link[data-hmatias-catalogue-typography]', premiumTypographyStylesheet, 'hmatiasCatalogueTypography');
  };

  const addInstagramLink = () => {
    document.querySelectorAll('.header-social').forEach(group => {
      if (group.querySelector('[data-hmatias-instagram], a[href*="instagram.com"]')) return;
      const link = document.createElement('a');
      link.href = 'https://www.instagram.com/hmatias_pslda/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Instagram — HMATIAS');
      link.dataset.hmatiasInstagram = 'true';
      const icon = document.createElement('img');
      icon.src = 'images/social-instagram.svg';
      icon.width = 18;
      icon.height = 18;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      link.appendChild(icon);
      group.appendChild(link);
    });
  };

  const normalizeOfficialEmail = () => {
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      const href = (link.getAttribute('href') || '').trim();
      const raw = href.slice(7);
      const [address, suffix = ''] = raw.split(/(?=[?])/);
      if (!inactiveEmails.has(address.toLowerCase())) return;
      link.setAttribute('href', 'mailto:' + officialEmail + suffix);
      if ((link.textContent || '').trim().toLowerCase() === address.toLowerCase()) {
        const textNodes = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        while (textNodes.nextNode()) {
          const textNode = textNodes.currentNode;
          const visibleText = textNode.textContent.trim();
          if (visibleText.toLowerCase() !== address.toLowerCase()) continue;
          const leadingWhitespace = (textNode.textContent.match(/^\s*/) || [''])[0];
          const trailingWhitespace = (textNode.textContent.match(/\s*$/) || [''])[0];
          textNode.textContent = leadingWhitespace + officialEmail + trailingWhitespace;
          break;
        }
      }
    });

    /* Earlier contact normalization can leave the same operational mailbox twice.
       Keep one visible email per shared header/footer contact group without changing layout. */
    document.querySelectorAll('.header-contact, footer .footer-contact, footer .footer-links, footer .footer-pro-contact, footer').forEach(group => {
      const seen = new Set();
      group.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        const address = ((link.getAttribute('href') || '').slice(7).split('?')[0] || '').trim().toLowerCase();
        if (!address) return;
        if (seen.has(address)) link.remove();
        else seen.add(address);
      });
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      let value = script.textContent || '';
      inactiveEmails.forEach(email => {
        value = value.replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), officialEmail);
      });
      script.textContent = value;
    });
  };

  const normaliseSharedLinks = () => {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').trim();
      if (href === 'hmatias-clean.html' || href === '/hmatias-clean.html') link.setAttribute('href', 'clean.html');
      if (href === 'hmatias-clean-en.html' || href === '/hmatias-clean-en.html') link.setAttribute('href', 'clean-en.html');
      if (link.target === '_blank') {
        const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.rel = [...rel].join(' ');
      }
    });

    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    document.querySelectorAll('.copyright').forEach(node => {
      node.innerHTML = node.innerHTML
        .replace(/HMATIAS SU, LDA\./g, 'HMATIAS – Prestação de Serviços SU, LDA.')
        .replace(/\s*·\s*Matrícula:\s*24094-23\/230713\.?/gi, '');
      if (isEn) {
        node.innerHTML = node.innerHTML
          .replace(/NIF:/g, 'Tax ID:')
          .replace(/Registo Comercial:/g, 'Commercial Registration:')
          .replace(/Matrícula:/g, 'Registration No.:');
      }
    });
  };

  // KARTA is an Alpha digital project, not a primary commercial service.
  // Its dedicated institutional project page remains reachable via
  // Informacao Institucional > Inovacao e Projetos Digitais.

  const ensureSourceAOAccess = () => {
    const footerBrand = document.querySelector('footer .footer-grid > div:first-child, footer .footer-pro-brand');
    if (!footerBrand || footerBrand.querySelector('[data-source-ao-footer]')) return;

    if (!document.querySelector('style[data-source-ao-footer-style]')) {
      const style = document.createElement('style');
      style.dataset.sourceAoFooterStyle = 'true';
      style.textContent = '.footer-source-ao-link{display:inline-flex;align-items:center;justify-content:center;margin-top:16px;padding:8px 11px;background:#fff;border:1px solid rgba(255,255,255,.20);text-decoration:none;max-width:max-content}.footer-source-ao-logo{display:block;width:170px;height:auto;max-height:84px;object-fit:contain;filter:none;opacity:1}.footer-source-ao-link:hover{border-color:rgba(255,255,255,.46)}.footer-karta-link{margin-right:14px!important}@media(max-width:600px){.footer-source-ao-logo{width:150px;max-height:74px}.footer-karta-link{margin-right:12px!important}}';
      document.head.appendChild(style);
    }

    const link = document.createElement('a');
    link.className = 'footer-source-ao-link';
    link.href = 'source-ao/';
    link.dataset.sourceAoFooter = 'true';
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    link.setAttribute('aria-label', isEn
      ? 'Open Source AO — materials research and supply requests'
      : 'Abrir Source AO — pesquisa de materiais e pedidos de fornecimento');
    const imageAlt = isEn
      ? 'SOURCE AO — technical research and HMATIAS supply'
      : 'SOURCE AO — pesquisa técnica e fornecimento HMATIAS';
    link.innerHTML = '<img class="footer-source-ao-logo" src="images/source-ao-logo.svg" alt="' + imageAlt + '" width="760" height="360">';
    footerBrand.appendChild(link);
  };

  const ensureSiteContactPanel = () => {
    const footer = document.querySelector('footer');
    if (!footer || document.querySelector('[data-hmatias-contact-panel]') || document.querySelector('main .contact-premium, main .contact-list')) return;

    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    const address = 'Bairro 1 de Maio, Casa n.º 31, Viana, Luanda, Angola';
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
    const section = document.createElement('section');
    section.className = 'hm-contact-panel';
    section.dataset.hmatiasContactPanel = 'true';
    section.setAttribute('aria-labelledby', 'hm-contact-panel-title');

    const inner = document.createElement('div');
    inner.className = 'hm-contact-panel-inner';

    const intro = document.createElement('div');
    intro.className = 'hm-contact-panel-intro';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'hm-contact-eyebrow';
    eyebrow.textContent = isEn ? 'DIRECT CONTACT' : 'CONTACTO DIRECTO';
    const heading = document.createElement('h2');
    heading.id = 'hm-contact-panel-title';
    heading.textContent = isEn ? 'Contact HMATIAS' : 'Fale com a HMATIAS';
    const description = document.createElement('p');
    description.textContent = isEn
      ? 'Choose the channel that best suits your enquiry. Our institutional base is in Viana, Luanda.'
      : 'Escolha o canal mais adequado ao seu pedido. A nossa base institucional fica em Viana, Luanda.';
    intro.append(eyebrow, heading, description);

    const grid = document.createElement('div');
    grid.className = 'hm-contact-actions';

    const makeAction = (kind, label, value, href, icon, external = false) => {
      const link = document.createElement('a');
      link.className = 'hm-contact-action hm-contact-action-' + kind;
      link.href = href;
      if (external) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      const image = document.createElement('img');
      image.src = icon;
      image.alt = '';
      image.width = 20;
      image.height = 20;
      image.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('span');
      copy.className = 'hm-contact-action-copy';
      const strong = document.createElement('strong');
      strong.textContent = label;
      const small = document.createElement('small');
      small.textContent = value;
      copy.append(strong, small);
      link.append(image, copy);
      return link;
    };

    grid.append(
      makeAction('whatsapp', 'WhatsApp', isEn ? 'Send a direct message' : 'Enviar mensagem directa', 'https://wa.me/244948806673', '/images/social-whatsapp.svg', true),
      makeAction('phone', isEn ? 'Call / Mobile' : 'Ligar / Telemóvel', '+244 948 806 673', 'tel:+244948806673', '/images/contact-phone.svg'),
      makeAction('email', isEn ? 'General email' : 'E-mail geral', 'geral@comercialhmatiasps.com', 'mailto:geral@comercialhmatiasps.com', '/images/contact-email.svg'),
      makeAction('institutional', isEn ? 'Institutional information' : 'Informação institucional', 'info@comercialhmatiasps.com', 'mailto:info@comercialhmatiasps.com', '/images/contact-email.svg')
    );

    const location = document.createElement('div');
    location.className = 'hm-contact-location';
    const addressCopy = document.createElement('div');
    addressCopy.className = 'hm-contact-location-copy';
    const addressLabel = document.createElement('strong');
    addressLabel.textContent = isEn ? 'Registered address' : 'Endereço institucional';
    const addressText = document.createElement('span');
    addressText.textContent = address;
    addressCopy.append(addressLabel, addressText);
    const mapLink = document.createElement('a');
    mapLink.href = mapUrl;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener noreferrer';
    mapLink.className = 'hm-contact-map-link';
    mapLink.textContent = isEn ? 'Open in Google Maps ↗' : 'Abrir no Google Maps ↗';
    location.append(addressCopy, mapLink);

    inner.append(intro, grid, location);
    section.appendChild(inner);
    footer.parentNode.insertBefore(section, footer);
  };

  const ensureWhatsAppShortcut = () => {
    const candidates = [...document.querySelectorAll('a.whatsapp-float, a.premium-whatsapp, a[data-hmatias-contact-whatsapp]')];
    let button = candidates.shift();
    candidates.forEach(node => node.remove());
    if (!button) button = document.createElement('a');

    button.classList.remove('whatsapp-float', 'premium-whatsapp');
    button.classList.add('hm-contact-whatsapp');
    button.dataset.hmatiasContactWhatsapp = 'true';
    button.href = 'https://wa.me/244948806673';
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.setAttribute('aria-label', 'Falar com a HMATIAS pelo WhatsApp');
    button.replaceChildren();

    const icon = document.createElement('img');
    icon.src = '/images/social-whatsapp.svg';
    icon.width = 22;
    icon.height = 22;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = 'WhatsApp';
    button.append(icon, label);
    if (!button.isConnected) document.body.appendChild(button);
  };

  const loadPortfolioLayer = () => {
    if (stablePresentation || !document.body.classList.contains('hmatias-home')) return;
    loadScript('script[data-hmatias-portfolio]', 'portfolio.js?v=20260920-premium2', 'hmatiasPortfolio', document.body);
  };

  const run = () => {
    ensureCatalogueIdentity();
    addInstagramLink();
    normalizeOfficialEmail();
    normaliseSharedLinks();
    ensureSourceAOAccess();
    ensureSiteContactPanel();
    ensureWhatsAppShortcut();
    loadPortfolioLayer();
  };

  ensureSharedAssets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
