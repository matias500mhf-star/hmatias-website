/* HMATIAS shared site bootstrap. Keeps UI enhancements independent from analytics. */
(() => {
  'use strict';

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

  const ensureSharedAssets = () => {
    loadStylesheet('link[href*="site-review.css"]', 'site-review.css?v=20260917-stable2', 'hmatiasSiteReview');
    loadScript('script[data-hmatias-site-enhancements]', 'site-enhancements.js?v=20260917-stable1', 'hmatiasSiteEnhancements');
    loadScript('script[data-hmatias-growth-intelligence]', 'growth-intelligence.js?v=20260917-stable1', 'hmatiasGrowthIntelligence');
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
    if (isEn) {
      document.querySelectorAll('.copyright').forEach(node => {
        node.innerHTML = node.innerHTML
          .replace(/NIF:/g, 'Tax ID:')
          .replace(/Registo Comercial:/g, 'Commercial Registration:')
          .replace(/Matrícula:/g, 'Registration No.:');
      });
    }
  };

  const loadPortfolioLayer = () => {
    if (!document.body.classList.contains('hmatias-home')) return;
    loadScript('script[data-hmatias-portfolio]', 'portfolio.js?v=20260917-stable1', 'hmatiasPortfolio', document.body);
  };

  const run = () => {
    ensureSharedAssets();
    addInstagramLink();
    normaliseSharedLinks();
    loadPortfolioLayer();
  };

  ensureSharedAssets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
