/* HMATIAS 2026-09-14 — final structure and interaction stabiliser. */
(() => {
  'use strict';

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const kartaHref = isEn ? 'karta-en.html' : 'karta.html';

  const removeHomepageKartaPromotion = () => {
    if (!document.body.classList.contains('hmatias-home')) return;

    document.querySelectorAll('.karta-teaser,[data-karta-card]').forEach(node => node.remove());

    const divisions = document.querySelector('#divisoes,#divisions');
    if (!divisions) return;
    const eyebrow = divisions.querySelector('.section-heading .eyebrow');
    const title = divisions.querySelector('.section-heading h2');
    const intro = divisions.querySelector('.section-heading p');

    if (eyebrow) eyebrow.textContent = isEn ? 'HMATIAS DIVISIONS' : 'DIVISÕES HMATIAS';
    if (title) title.textContent = isEn
      ? 'Specialised solutions under the same institutional structure.'
      : 'Soluções especializadas sob a mesma estrutura institucional.';
    if (intro) intro.textContent = isEn
      ? 'Alongside the core construction, facilities and supply areas, HMATIAS maintains specialised divisions with their own pages for detailed commercial information.'
      : 'Além das áreas principais de execução, facilities e supply, a HMATIAS mantém divisões especializadas com páginas próprias para informação comercial detalhada.';
  };

  const addKartaAccess = () => {
    document.querySelectorAll('.hmatias-header .nav-actions').forEach(actions => {
      if (actions.querySelector('[data-karta-nav]')) return;
      const link = document.createElement('a');
      link.className = 'karta-nav-mark';
      link.href = kartaHref;
      link.dataset.kartaNav = 'true';
      link.setAttribute('aria-label', 'KARTA Identity Wallet');
      link.title = 'KARTA Identity Wallet';
      link.textContent = 'K';
      const language = actions.querySelector('[data-lang-switch],.lang-switch');
      actions.insertBefore(link, language || actions.firstChild);
    });

    document.querySelectorAll('.hmatias-header .nav-menu').forEach(menu => {
      if (menu.querySelector('[data-karta-mobile]')) return;
      const link = document.createElement('a');
      link.className = 'mobile-karta-link';
      link.href = kartaHref;
      link.dataset.kartaMobile = 'true';
      link.innerHTML = `<span class="mobile-karta-mark" aria-hidden="true">K</span><span>KARTA Identity Wallet</span>`;
      const quote = menu.querySelector('.mobile-quote-link');
      menu.insertBefore(link, quote || null);
    });

    document.querySelectorAll('footer .footer-grid > div:first-child').forEach(brandBlock => {
      if (brandBlock.querySelector('[data-karta-footer]')) return;
      const link = document.createElement('a');
      link.className = 'footer-karta-link';
      link.href = kartaHref;
      link.dataset.kartaFooter = 'true';
      link.setAttribute('aria-label', 'KARTA Identity Wallet');
      link.innerHTML = `<span class="footer-karta-mark" aria-hidden="true">K</span><span class="footer-karta-copy"><small>${isEn ? 'HMATIAS digital product' : 'Produto digital HMATIAS'}</small><strong>KARTA Identity Wallet</strong></span>`;
      brandBlock.appendChild(link);
    });
  };

  const normalizeAssistantProductAliases = event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.classList.contains('hmatias-assistant-form')) return;
    const input = form.querySelector('input');
    if (!(input instanceof HTMLInputElement)) return;

    const raw = input.value;
    if (!raw) return;

    const hasAlias = /\b(?:pingel|pinegel|pin\s*gel|pinho\s*gel)\b/i.test(raw);
    if (!hasAlias) return;

    if (/\b(?:taurus|t563p)\b/i.test(raw)) {
      input.value = raw.replace(/\b(?:pingel|pinegel|pin\s*gel|pinho\s*gel)\b/gi, 'Taurus Pine Gel T563P');
    } else {
      input.value = raw.replace(/\b(?:pingel|pinegel|pin\s*gel|pinho\s*gel)\b/gi, '123 Pine Gel 500 ml');
    }
  };

  const syncAssistantOpenState = () => {
    const root = document.querySelector('.hmatias-assistant');
    const open = Boolean(root && (root.classList.contains('is-open') || root.classList.contains('open')));
    document.body.classList.toggle('hmatias-assistant-open', open);
  };

  const watchAssistant = () => {
    const attach = () => {
      const root = document.querySelector('.hmatias-assistant');
      if (!root || root.dataset.releaseObserver === 'true') return Boolean(root);
      root.dataset.releaseObserver = 'true';
      new MutationObserver(syncAssistantOpenState).observe(root, { attributes: true, attributeFilter: ['class'] });
      syncAssistantOpenState();
      return true;
    };
    if (attach()) return;
    const bodyObserver = new MutationObserver(() => {
      if (attach()) bodyObserver.disconnect();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  };

  const watchHomepageStructure = () => {
    if (!document.body.classList.contains('hmatias-home')) return;
    removeHomepageKartaPromotion();
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        removeHomepageKartaPromotion();
        addKartaAccess();
      });
    }).observe(document.body, { childList: true, subtree: true });
  };

  const run = () => {
    removeHomepageKartaPromotion();
    addKartaAccess();
    watchAssistant();
    watchHomepageStructure();
    document.addEventListener('submit', normalizeAssistantProductAliases, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
