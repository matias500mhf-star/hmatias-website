/* HMATIAS shared bootstrap + Google Analytics 4. */
(() => {
  'use strict';

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addInstagramLink, { once: true });
  } else {
    addInstagramLink();
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
})();
