/* HMATIAS shared accessibility and UI refinements. No tracking or user data collection. */
(() => {
  'use strict';

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const path = window.location.pathname || '/';
  const isHome = path === '/' || path === '/index.html' || path === '/en.html';

  const loadStylesheet = (selector, href, datasetName) => {
    if (document.querySelector(selector)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (datasetName) link.dataset[datasetName] = 'true';
    document.head.appendChild(link);
  };

  if (isHome && !document.body.classList.contains('site-stable')) {
    loadStylesheet('link[data-hmatias-premium-editorial]', 'premium-editorial.css?v=20260920-v1', 'hmatiasPremiumEditorial');
  }

  const improveNavigation = () => {
    const nav = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (!nav) return;

    nav.setAttribute('role', 'navigation');
    if (!nav.id) nav.id = 'main-navigation';
    if (toggle) toggle.setAttribute('aria-controls', nav.id);

    document.querySelectorAll('.nav-actions [data-lang-switch]').forEach(link => {
      const shortLabel = isEn ? 'PT' : 'EN';
      const actionLabel = isEn ? 'Mudar para Português' : 'Switch to English';
      link.textContent = shortLabel;
      link.title = actionLabel;
      link.setAttribute('aria-label', `${shortLabel} — ${actionLabel}`);
    });

    const mq = window.matchMedia('(max-width: 850px)');
    const updateState = () => {
      const mobile = mq.matches;
      const open = toggle?.getAttribute('aria-expanded') === 'true' || nav.classList.contains('open');
      if (mobile && !open) {
        nav.setAttribute('aria-hidden', 'true');
        nav.querySelectorAll('a,button').forEach(el => {
          if (!el.hasAttribute('data-old-tabindex')) el.dataset.oldTabindex = el.getAttribute('tabindex') || '';
          el.setAttribute('tabindex', '-1');
        });
      } else {
        nav.removeAttribute('aria-hidden');
        nav.querySelectorAll('[data-old-tabindex]').forEach(el => {
          if (el.dataset.oldTabindex) el.setAttribute('tabindex', el.dataset.oldTabindex);
          else el.removeAttribute('tabindex');
          delete el.dataset.oldTabindex;
        });
      }
    };

    updateState();
    mq.addEventListener?.('change', updateState);
    if (toggle) new MutationObserver(updateState).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
  };

  const improveLinks = () => {
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      link.title = isEn ? 'Opens your email application' : 'Abre a aplicação de e-mail';
    });

    document.querySelectorAll('a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (/\.pdf(?:$|[?#])/.test(href)) {
        link.title = isEn ? 'Opens a PDF document in a new tab' : 'Abre um documento PDF numa nova aba';
      }
    });

    document.querySelectorAll('[data-clean-product][aria-label], .whatsapp-float[aria-label], .mobile-whatsapp-link[aria-label]').forEach(link => {
      if ((link.textContent || '').trim()) link.removeAttribute('aria-label');
    });
  };

  const improveAssistantAccessibility = () => {
    const apply = () => {
      const toggle = document.querySelector('.hmatias-assistant-toggle');
      if (!toggle) return false;
      if (!toggle.getAttribute('aria-label')) {
        toggle.setAttribute('aria-label', isEn ? 'Open HMATIAS Assistant' : 'Abrir Assistente HMATIAS');
      }
      return true;
    };

    if (apply()) return;
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const premiumiseHomepageIcons = () => {
    if (!isHome) return;
    const icons = [
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V7l8-3 8 3v13"/><path d="M8 20v-4h8v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.3 2.3-3-3L14.7 6.3Z"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z"/><path d="M4 7.5V16l8 4 8-4V7.5M12 11v9"/></svg>'
    ];

    document.querySelectorAll('.service-grid .service-card .service-icon').forEach((icon, index) => {
      if (icons[index]) icon.innerHTML = icons[index];
    });
  };

  const improveCleanPage = () => {
    if (!['/clean.html', '/clean-en.html'].includes(path)) return;

    document.querySelectorAll('article.clean-feature-card').forEach(card => {
      const replacement = document.createElement('div');
      [...card.attributes].forEach(attr => replacement.setAttribute(attr.name, attr.value));
      replacement.setAttribute('role', 'group');
      while (card.firstChild) replacement.appendChild(card.firstChild);
      card.replaceWith(replacement);
      const heading = replacement.querySelector('h3');
      if (heading) {
        if (!heading.id) heading.id = `${replacement.id || 'clean-product'}-title`;
        replacement.setAttribute('aria-labelledby', heading.id);
      }
    });
  };

  const normaliseImages = () => {
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
    });
  };

  const run = () => {
    improveNavigation();
    improveLinks();
    improveAssistantAccessibility();
    premiumiseHomepageIcons();
    improveCleanPage();
    normaliseImages();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
