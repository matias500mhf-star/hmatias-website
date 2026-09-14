/* HMATIAS shared accessibility refinements. */
(() => {
  'use strict';
  const run = () => {
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    const nav = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      if (!nav.id) nav.id = 'main-navigation';
      if (toggle) toggle.setAttribute('aria-controls', nav.id);
    }
    document.querySelectorAll('[data-lang-switch]').forEach(link => {
      const text = (link.textContent || '').trim();
      if (/^EN$/i.test(text)) link.textContent = 'EN · English';
      if (/^PT$/i.test(text)) link.textContent = 'PT · Português';
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      link.title = isEn ? 'Opens your email application' : 'Abre a aplicação de e-mail';
    });
    document.querySelectorAll('a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (/\.pdf(?:$|[?#])/.test(href)) link.title = isEn ? 'Opens a PDF document in a new tab' : 'Abre um documento PDF numa nova aba';
    });
    document.querySelectorAll('[data-clean-product][aria-label], .whatsapp-float[aria-label], .mobile-whatsapp-link[aria-label]').forEach(link => {
      if ((link.textContent || '').trim()) link.removeAttribute('aria-label');
    });
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
