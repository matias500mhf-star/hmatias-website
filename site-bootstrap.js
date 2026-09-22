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
      link.innerHTML = '<span class="mobile-karta-mark" aria-hidden="true">K</span><span>KARTA Identity Wallet</span>';
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
      link.innerHTML = '<span class="footer-karta-mark" aria-hidden="true">K</span><span class="footer-karta-copy"><small>' + (isEn ? 'HMATIAS digital product' : 'Produto digital HMATIAS') + '</small><strong>KARTA Identity Wallet</strong></span>';
      footerBrand.appendChild(link);
    }
  };

  const ensureProcuraAccess = () => {
    const footerBrand = document.querySelector('footer .footer-grid > div:first-child, footer .footer-pro-brand');
    if (!footerBrand || footerBrand.querySelector('[data-procura-footer]')) return;

    if (!document.querySelector('style[data-procura-footer-style]')) {
      const style = document.createElement('style');
      style.dataset.procuraFooterStyle = 'true';
      style.textContent = '.footer-procura-link{display:inline-flex;align-items:center;gap:10px;margin-top:12px;text-decoration:none;color:inherit;max-width:max-content}.footer-procura-mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.22);border-radius:10px;background:linear-gradient(145deg,#062d56,#0b65a4);color:#fff;font-size:12px;font-weight:900;box-shadow:0 8px 20px rgba(0,0,0,.12)}.footer-procura-copy{display:flex;flex-direction:column;line-height:1.15}.footer-procura-copy small{font-size:10px;opacity:.68;text-transform:uppercase;letter-spacing:.08em}.footer-procura-copy strong{font-size:13px;letter-spacing:-.01em}.footer-procura-link:hover .footer-procura-mark{transform:translateY(-1px)}';
      document.head.appendChild(style);
    }

    const link = document.createElement('a');
    link.className = 'footer-procura-link';
    link.href = 'procura.html';
    link.dataset.procuraFooter = 'true';
    link.setAttribute('aria-label', 'Abrir Procura — pesquisa de materiais e fornecedores');
    link.innerHTML = '<span class="footer-procura-mark" aria-hidden="true">P</span><span class="footer-procura-copy"><small>Pesquisa comercial</small><strong>Procura</strong></span>';
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
