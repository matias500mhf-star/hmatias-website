/* HMATIAS Google Analytics 4 loader — consent-gated by Cookiebot CMP. */
(() => {
  'use strict';

  const measurementId = 'G-JNJDL6LZFY';
  const productionHosts = ['comercialhmatiasps.com', 'www.comercialhmatiasps.com'];

  if (!productionHosts.includes(window.location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  let loaded = false;

  function statisticsAllowed() {
    return Boolean(window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics);
  }

  function setConsent(granted) {
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted'
    });
  }

  function loadAnalytics() {
    const allowed = statisticsAllowed();
    setConsent(allowed);
    if (!allowed || loaded || document.querySelector('script[data-hmatias-analytics]')) return;

    loaded = true;
    const pageUrl = new URL(window.location.href);
    if (pageUrl.pathname.startsWith('/source-ao/')) {
      const allowedCampaignParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'];
      const cleanUrl = new URL(pageUrl.origin + pageUrl.pathname);
      allowedCampaignParams.forEach(key => {
        const value = pageUrl.searchParams.get(key);
        if (value) cleanUrl.searchParams.set(key, value);
      });
      pageUrl.search = cleanUrl.search;
    }
    pageUrl.hash = '';

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: pageUrl.toString()
    });

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    tag.dataset.hmatiasAnalytics = measurementId;
    document.head.appendChild(tag);

    if (!document.querySelector('script[data-hmatias-analytics-events]')) {
      const events = document.createElement('script');
      events.src = '/analytics-events.js?v=20261009-confirmed-leads1';
      events.defer = true;
      events.dataset.hmatiasAnalyticsEvents = 'true';
      document.head.appendChild(events);
    }
  }

  function syncConsent() {
    const allowed = statisticsAllowed();
    setConsent(allowed);
    if (allowed) loadAnalytics();
  }

  window.addEventListener('CookiebotOnConsentReady', syncConsent);
  window.addEventListener('CookiebotOnAccept', syncConsent);
  window.addEventListener('CookiebotOnDecline', syncConsent);
  syncConsent();
})();
