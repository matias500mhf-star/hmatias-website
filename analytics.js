/* HMATIAS shared bootstrap + Google Analytics 4. */
(() => {
  'use strict';

  const ensureReviewStyles = () => {
    const existing = document.querySelector('link[href*="site-review.css"]');
    if (existing) {
      existing.dataset.hmatiasSiteReview = 'true';
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'site-review.css?v=20260914-stable1';
    link.dataset.hmatiasSiteReview = 'true';
    document.head.appendChild(link);
  };

  const loadSiteEnhancements = () => {
    if (document.querySelector('script[data-hmatias-site-enhancements]')) return;
    const script = document.createElement('script');
    script.src = 'site-enhancements.js?v=20260914';
    script.defer = true;
    script.dataset.hmatiasSiteEnhancements = 'true';
    document.head.appendChild(script);
  };

  const loadReleaseStyles = () => {
    if (document.querySelector('link[data-hmatias-site-release]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'site-release.css?v=20260914-5';
    link.dataset.hmatiasSiteRelease = 'true';
    document.head.appendChild(link);
  };

  const addInstagramLink = () => {
    document.querySelectorAll('.header-social').forEach(group => {
      if (group.querySelector('[data-hmatias-instagram]')) return;
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

  const normalizeLegacyCleanLinks = () => {
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
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
    if (document.querySelector('script[data-hmatias-portfolio]')) return;
    const script = document.createElement('script');
    script.src = 'portfolio.js?v=20260914-3';
    script.defer = true;
    script.dataset.hmatiasPortfolio = 'true';
    document.body.appendChild(script);
  };

  const bootstrapSharedUi = () => {
    ensureReviewStyles();
    loadSiteEnhancements();
    loadReleaseStyles();
    addInstagramLink();
    normalizeLegacyCleanLinks();
    loadPortfolioLayer();
  };

  ensureReviewStyles();
  loadSiteEnhancements();
  loadReleaseStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapSharedUi, { once: true });
  } else {
    bootstrapSharedUi();
  }

  const measurementId = 'G-JNJDL6LZFY';
  const productionHosts = ['comercialhmatiasps.com', 'www.comercialhmatiasps.com'];
  if (!productionHosts.includes(window.location.hostname)) return;
  if (document.querySelector('script[data-hmatias-analytics]')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  tag.dataset.hmatiasAnalytics = measurementId;
  document.head.appendChild(tag);

  const events = document.createElement('script');
  events.src = 'analytics-events.js?v=20260914b';
  events.defer = true;
  events.dataset.hmatiasAnalyticsEvents = 'true';
  document.head.appendChild(events);
})();
