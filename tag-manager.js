/* HMATIAS Google Tag Manager loader — basic consent mode, coordinated with Cookiebot. */
(() => {
  'use strict';

  const containerId = 'GTM-MXT9VM65';
  const productionHosts = ['comercialhmatiasps.com', 'www.comercialhmatiasps.com'];

  if (!productionHosts.includes(window.location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Privacy-first defaults. GTM is not loaded until statistics consent is granted.
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

  let loaded = false;

  function statisticsAllowed() {
    return Boolean(window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics);
  }

  function updateConsent() {
    const granted = statisticsAllowed();
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted'
    });
    return granted;
  }

  function loadTagManager() {
    if (!updateConsent() || loaded || document.querySelector('script[data-hmatias-gtm]')) return;

    loaded = true;
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js'
    });

    const firstScript = document.getElementsByTagName('script')[0];
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
    tag.dataset.hmatiasGtm = containerId;

    if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(tag, firstScript);
    else document.head.appendChild(tag);
  }

  function syncConsent() {
    if (updateConsent()) loadTagManager();
  }

  window.addEventListener('CookiebotOnConsentReady', syncConsent);
  window.addEventListener('CookiebotOnAccept', syncConsent);
  window.addEventListener('CookiebotOnDecline', syncConsent);

  // Covers returning visitors whose stored consent is already available.
  syncConsent();
})();
