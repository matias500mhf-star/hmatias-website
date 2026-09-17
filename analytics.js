/* HMATIAS Google Analytics 4 loader only. Site UI is intentionally handled elsewhere. */
(() => {
  'use strict';

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

  if (!document.querySelector('script[data-hmatias-analytics-events]')) {
    const events = document.createElement('script');
    events.src = 'analytics-events.js?v=20260917-stable1';
    events.defer = true;
    events.dataset.hmatiasAnalyticsEvents = 'true';
    document.head.appendChild(events);
  }
})();
