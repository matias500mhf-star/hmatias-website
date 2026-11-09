/* HMATIAS tag loaders — consent-gated by Cookiebot. */
(() => {
  'use strict';

  const containerId = 'GTM-MXT9VM65';
  /*
   * Meta Pixel is intentionally disabled until the real numeric Pixel ID from
   * Meta Events Manager is configured. Never replace this with a sample ID.
   */
  const metaPixelId = '';
  const metaPixelConfigured = /^\d{10,25}$/.test(metaPixelId);
  const productionHosts = ['comercialhmatiasps.com', 'www.comercialhmatiasps.com'];

  if (!productionHosts.includes(window.location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  let gtmLoaded = false;
  let metaPixelLoaded = false;
  let metaConsentGranted = false;

  function statisticsAllowed() {
    return Boolean(window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.statistics);
  }

  function marketingAllowed() {
    return Boolean(window.Cookiebot && window.Cookiebot.consent && window.Cookiebot.consent.marketing);
  }

  function updateGoogleConsent() {
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
    if (!updateGoogleConsent() || gtmLoaded || document.querySelector('script[data-hmatias-gtm]')) return;
    gtmLoaded = true;
    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
    tag.dataset.hmatiasGtm = containerId;
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(tag, firstScript);
    else document.head.appendChild(tag);
  }

  function ensureFbq() {
    if (typeof window.fbq === 'function') return;
    const n = window.fbq = function () {
      if (n.callMethod) n.callMethod.apply(n, arguments);
      else n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
  }

  function loadMetaPixel() {
    if (!metaPixelConfigured || metaPixelLoaded) return;
    ensureFbq();
    window.fbq('init', metaPixelId);

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://connect.facebook.net/en_US/fbevents.js';
    tag.dataset.hmatiasMetaPixel = 'true';
    document.head.appendChild(tag);
    metaPixelLoaded = true;
  }

  function syncMetaConsent() {
    const allowed = marketingAllowed();

    if (!metaPixelConfigured) return;

    if (!allowed) {
      if (metaPixelLoaded && typeof window.fbq === 'function') {
        window.fbq('consent', 'revoke');
      }
      metaConsentGranted = false;
      return;
    }

    loadMetaPixel();
    if (typeof window.fbq !== 'function') return;

    window.fbq('consent', 'grant');
    if (!metaConsentGranted) {
      window.fbq('track', 'PageView');
      metaConsentGranted = true;
    }
  }

  function syncConsent() {
    if (updateGoogleConsent()) loadTagManager();
    syncMetaConsent();
  }

  window.hmatiasMetaPixel = Object.freeze({
    configured: metaPixelConfigured,
    track(eventName, parameters = {}) {
      if (!metaPixelConfigured || !metaConsentGranted || typeof window.fbq !== 'function' || !eventName) return false;
      window.fbq('track', eventName, parameters);
      return true;
    }
  });

  window.addEventListener('CookiebotOnConsentReady', syncConsent);
  window.addEventListener('CookiebotOnAccept', syncConsent);
  window.addEventListener('CookiebotOnDecline', syncConsent);
  syncConsent();
})();
