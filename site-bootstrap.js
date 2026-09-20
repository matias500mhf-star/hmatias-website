/* HMATIAS shared site bootstrap. Keeps UI enhancements independent from analytics. */
(() => {
  'use strict';

  const reviewStylesheet = 'site-review.css?v=20260917-stable2';
  const kartaStylesheet = 'karta-access.css?v=20260917-stable1';
  const premiumTypographyStylesheet = 'premium-typography.css?v=20260920-final2';

  const loadStylesheet = (selector, href, datasetName) => {
    if (document.querySelector(selector)) return;
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
      if (!existing.getAttribute('href')?.includes('v=20260917-stable2')) existing.href = reviewStylesheet;
      existing.dataset.hmatiasSiteReview = 'true';
      return;
    }
    loadStylesheet('link[data-hmatias-site-review]', reviewStylesheet, 'hmatiasSiteReview');
  };

  const ensureSharedAssets = () => {
    ensureReviewStylesheet();
    loadStylesheet('link[data-hmatias-karta-access]', kartaStylesheet, 'hmatiasKartaAccess');
    if (document.body?.classList.contains('hmatias-home')) {
      loadStylesheet('link[data-hmatias-premium-typography]', premiumTypographyStylesheet, 'hmatiasPremiumTypography');
    }
    loadScript('script[data-hmatias-site-enhancements]', 'site-enhancements.js?v=20260920-premium2', 'hmatiasSiteEnhancements');
    loadScript('script[data-hmatias-growth-intelligence]', 'growth-intelligence.js?v=20260917-stable1', 'hmatiasGrowthIntelligence');
  };

  const ensureCatalogueIdentity = () => {
    const path = window.location.pathname || '/';
    if (!/\/(?:catalogo-obras|work-catalogue)\.html$/.test(path)) return;
    document.body?.classList.add('hmatias-catalogue');
    loadStylesheet('link[data-hmatias-catalogue-typography]', premiumTypographyStylesheet, 'hmatiasCatalogueTypography');
    const showcase = document.querySelector('link[href*="final-showcase.css"]');
    if (showcase && !showcase.getAttribute('href')?.includes('v=20260920-final1')) {
      showcase.href = 'final-showcase.css?v=20260920-final1';
    }
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

  const ensureKartaAccess = () => {
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    const path = window.location.pathname || '/';
    if (/\/karta(?:-en)?\.html$/.test(path)) return;

    const kartaHref = isEn ? 'karta-en.html' : 'karta.html';
    const allowedPositions = new Set(['left-center', 'right-center', 'bottom-left', 'bottom-right']);
    const requestedPosition = document.body?.dataset.kartaPosition || 'left-center';
    const position = allowedPositions.has(requestedPosition) ? requestedPosition : 'left-center';

    if (!document.querySelector('[data-karta-float]')) {
      const link = document.createElement('a');
      link.className = 'karta-float';
      link.href = kartaHref;
      link.dataset.kartaFloat = 'true';
      link.dataset.position = position;
      link.setAttribute('aria-label', 'KARTA Identity Wallet');
      link.title = isEn ? 'Open KARTA Identity Wallet' : 'Conhecer KARTA Identity Wallet';
      link.innerHTML = '<span class="karta-float-mark" aria-hidden="true">K</span><span class="karta-float-copy"><strong>KARTA</strong><small>Identity Wallet</small></span>';
      document.body.appendChild(link);
    }

    const navMenu = document.querySelector('.hmatias-header .nav-menu');
    if (navMenu && !navMenu.querySelector('[data-karta-mobile]')) {
      const link = document.createElement('a');
      link.className = 'mobile-karta-link';
      link.href = kartaHref;
      link.dataset.kartaMobile = 'true';
      link.innerHTML = '<span class="mobile-karta-mark" aria-hidden="true">K</span><span>KARTA Identity Wallet</span>';
      const quote = navMenu.querySelector('.mobile-quote-link');
      const language = navMenu.querySelector('.mobile-lang-switch');
      navMenu.insertBefore(link, quote || language || null);
    }

    const footerBrand = document.querySelector('footer .footer-grid > div:first-child');
    if (footerBrand && !footerBrand.querySelector('[data-karta-footer]')) {
      const link = document.createElement('a');
      link.className = 'footer-karta-link';
      link.href = kartaHref;
      link.dataset.kartaFooter = 'true';
      link.setAttribute('aria-label', 'KARTA Identity Wallet');
      link.innerHTML = '<span class="footer-karta-mark" aria-hidden="true">K</span><span class="footer-karta-copy"><small>' + (isEn ? 'HMATIAS digital product' : 'Produto digital HMATIAS') + '</small><strong>KARTA Identity Wallet</strong></span>';
      footerBrand.appendChild(link);
    }
  };

  const removeLegacyHomeLeadership = () => {
    if (!document.body.classList.contains('hmatias-home')) return;
    document.querySelectorAll('main > section.leadership').forEach(section => section.remove());
  };

  const loadPortfolioLayer = () => {
    if (!document.body.classList.contains('hmatias-home')) return;
    loadScript('script[data-hmatias-portfolio]', 'portfolio.js?v=20260920-premium2', 'hmatiasPortfolio', document.body);
  };

  const run = () => {
    ensureSharedAssets();
    ensureCatalogueIdentity();
    addInstagramLink();
    normaliseSharedLinks();
    removeLegacyHomeLeadership();
    ensureKartaAccess();
    loadPortfolioLayer();
  };

  ensureSharedAssets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();