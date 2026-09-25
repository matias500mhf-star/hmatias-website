/* HMATIAS shared site bootstrap. Keeps UI enhancements independent from analytics. */
(() => {
  'use strict';

  const stablePresentation = document.body?.classList.contains('site-stable');

  const reviewStylesheet = 'site-review.css?v=20260917-stable2';
  const kartaStylesheet = 'karta-access.css?v=20260917-stable1';
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
    loadStylesheet('link[data-hmatias-karta-access]', kartaStylesheet, 'hmatiasKartaAccess');
    if (!stablePresentation && document.body?.classList.contains('hmatias-home')) {
      loadStylesheet('link[data-hmatias-premium-typography]', premiumTypographyStylesheet, 'hmatiasPremiumTypography');
    }
    loadStylesheet('link[data-hmatias-brand-lock]', brandLockStylesheet, 'hmatiasBrandLock');
    if (!stablePresentation) loadStylesheet('link[data-hmatias-corporate-cleanup]', corporateCleanupStylesheet, 'hmatiasCorporateCleanup');
    loadScript('script[data-hmatias-site-enhancements]', 'site-enhancements.js?v=20260920-stable3', 'hmatiasSiteEnhancements');
    loadScript('script[data-hmatias-growth-intelligence]', 'growth-intelligence.js?v=20260920-stable3', 'hmatiasGrowthIntelligence');
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
      if ((link.textContent || '').trim().toLowerCase() === address.toLowerCase()) link.textContent = officialEmail;
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
      link.setAttribute('aria-label', 'KARTA Identity Wallet');
      link.innerHTML = '<span class="mobile-karta-mark" aria-hidden="true">K</span><span>KARTA</span>';
      const quote = navMenu.querySelector('.mobile-quote-link');
      const language = navMenu.querySelector('.mobile-lang-switch');
      navMenu.insertBefore(link, quote || language || null);
    }

    const footerBrand = document.querySelector('footer .footer-grid > div:first-child, footer .footer-pro-brand');
    if (footerBrand && !footerBrand.querySelector('[data-karta-footer]')) {
      const link = document.createElement('a');
      link.className = 'footer-karta-link';
      link.href = kartaHref;
      link.dataset.kartaFooter = 'true';
      link.setAttribute('aria-label', 'KARTA Identity Wallet');
      link.innerHTML = '<span class="footer-karta-mark" aria-hidden="true">K</span><span class="footer-karta-copy"><small>HMATIAS</small><strong>KARTA</strong></span>';
      footerBrand.appendChild(link);
    }
  };

  const ensureProcuraAccess = () => {
    const footerBrand = document.querySelector('footer .footer-grid > div:first-child, footer .footer-pro-brand');
    if (!footerBrand || footerBrand.querySelector('[data-procura-footer]')) return;

    if (!document.querySelector('style[data-procura-footer-style]')) {
      const style = document.createElement('style');
      style.dataset.procuraFooterStyle = 'true';
      style.textContent = '.footer-procura-link{display:inline-flex;align-items:center;margin-top:16px;text-decoration:none;max-width:max-content}.footer-procura-logo{display:block;width:138px;height:auto;filter:brightness(0) invert(1);opacity:.92}.footer-procura-link:hover .footer-procura-logo{opacity:1}.footer-karta-link{margin-right:14px!important}@media(max-width:600px){.footer-procura-logo{width:122px}.footer-karta-link{margin-right:12px!important}}';
      document.head.appendChild(style);
    }

    const link = document.createElement('a');
    link.className = 'footer-procura-link';
    link.href = 'procura.html';
    link.dataset.procuraFooter = 'true';
    link.setAttribute('aria-label', 'Abrir Source AO — sourcing e pesquisa comercial');
    link.innerHTML = '<img class="footer-procura-logo" src="images/source-ao-logo.svg" alt="Source AO by HMATIAS" width="720" height="180">';
    footerBrand.appendChild(link);
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
    ensureKartaAccess();
    ensureProcuraAccess();
    loadPortfolioLayer();
  };

  ensureSharedAssets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
