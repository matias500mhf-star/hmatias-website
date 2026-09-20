/* HMATIAS growth intelligence: Smart RFQ routing and safe lead fallbacks.
   No visitor-entered values are transmitted by this script. */
(() => {
  'use strict';

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const path = window.location.pathname || '/';
  const commercialEmail = 'comercial@hmatiasps.ao';

  const addSmartRfqAccess = () => {
    const isHome = path === '/' || path === '/index.html' || path === '/en.html';
    const coreServicePages = new Set([
      '/construcao.html', '/construction.html',
      '/facilities.html', '/facilities-en.html',
      '/supply.html', '/supply-en.html'
    ]);
    const isCoreService = coreServicePages.has(path);
    if (!isHome && !isCoreService) return;

    const rfqHref = isEn ? 'rfq-en.html' : 'rfq.html';
    const actions = document.querySelector('.nav-actions');
    if (actions && !actions.querySelector('[data-rfq-nav]')) {
      const link = document.createElement('a');
      link.href = rfqHref;
      link.className = 'btn btn-secondary btn-small';
      link.dataset.rfqNav = 'true';
      link.dataset.smartRoute = 'smart_rfq';
      link.textContent = 'Smart RFQ';
      const quote = actions.querySelector('[data-quote-link], .btn-primary');
      actions.insertBefore(link, quote || null);
    }

    if (isCoreService) {
      const isSupply = path === '/supply.html' || path === '/supply-en.html';
      const heroActions = document.querySelector('.unit-hero .hero-actions');
      if (heroActions && !isSupply && !heroActions.querySelector('[data-rfq-service]')) {
        const link = document.createElement('a');
        link.href = rfqHref;
        link.className = 'btn btn-light';
        link.dataset.rfqService = 'true';
        link.dataset.smartRoute = 'smart_rfq';
        link.textContent = isEn ? 'Build Smart RFQ →' : 'Preparar Smart RFQ →';
        heroActions.insertBefore(link, heroActions.firstElementChild || null);
      }
      return;
    }

    if (document.querySelector('[data-hmatias-smart-router]')) return;
    const contact = document.querySelector('#contacto, #contact, .contact');
    if (!contact?.parentNode) return;

    const box = document.createElement('div');
    box.className = 'container';
    box.dataset.hmatiasSmartRouter = 'true';
    const inner = document.createElement('div');
    inner.className = 'smart-route-box';
    inner.innerHTML = isEn
      ? '<span class="eyebrow">HMATIAS · SMART RFQ</span><h3>Structure a commercial request before asking for a quotation.</h3><p>Construction, facilities or procurement: organise the essential requirement without creating an account or uploading documents.</p><div class="smart-route-actions"><a href="rfq-en.html" data-smart-route="smart_rfq">Build Smart RFQ →</a><a href="construction.html" data-smart-route="construction">Construction</a><a href="facilities-en.html" data-smart-route="facilities">Facilities</a><a href="supply-en.html" data-smart-route="supply">Supply</a></div>'
      : '<span class="eyebrow">HMATIAS · SMART RFQ</span><h3>Estruture o pedido comercial antes de solicitar a cotação.</h3><p>Construção, facilities ou procurement: organize a informação essencial sem criar conta nem carregar documentos.</p><div class="smart-route-actions"><a href="rfq.html" data-smart-route="smart_rfq">Preparar Smart RFQ →</a><a href="construcao.html" data-smart-route="construction">Construção</a><a href="facilities.html" data-smart-route="facilities">Facilities</a><a href="supply.html" data-smart-route="supply">Supply</a></div>';
    box.appendChild(inner);
    contact.parentNode.insertBefore(box, contact);
  };

  const safeField = el => {
    const key = `${el.name || ''} ${el.id || ''} ${el.autocomplete || ''}`.toLowerCase();
    return !/(password|passcode|bank|iban|card|passport|identity|identidade|document|documento|bilhete|\bbi\b|nif|tax)/i.test(key);
  };

  const buildMailto = form => {
    const subject = isEn ? 'HMATIAS website enquiry' : 'Pedido de contacto pelo site HMATIAS';
    const lines = [];
    for (const el of form.elements || []) {
      if (!(el instanceof HTMLElement) || !('value' in el) || !safeField(el)) continue;
      if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
      const value = String(el.value || '').trim();
      if (!value || value.length > 800) continue;
      let label = '';
      if (el.id) label = form.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent?.trim() || '';
      label ||= el.getAttribute('aria-label') || el.name || (isEn ? 'Field' : 'Campo');
      lines.push(`${label}: ${value}`);
    }
    lines.push('', isEn ? `Source page: ${location.href}` : `Página de origem: ${location.href}`);
    return `mailto:${commercialEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n').slice(0, 3500))}`;
  };

  const addEmailFallbacks = () => {
    [...document.querySelectorAll('form')]
      .filter(form => {
        const id = (form.id || '').toLowerCase();
        return form.classList.contains('contact-form') || /(contact|quote|request|booking|clean|supply|business)/i.test(id);
      })
      .forEach(form => {
        if (form.querySelector('[data-email-fallback]')) return;
        const submit = form.querySelector('button[type="submit"], input[type="submit"]');
        if (!submit) return;
        const link = document.createElement('a');
        link.href = `mailto:${commercialEmail}`;
        link.className = 'email-fallback-link';
        link.dataset.emailFallback = 'true';
        link.dataset.quoteLink = 'true';
        link.textContent = isEn
          ? 'Prefer email? Prepare this request by email →'
          : 'Prefere e-mail? Preparar este pedido por e-mail →';
        link.addEventListener('click', () => { link.href = buildMailto(form); });
        submit.insertAdjacentElement('afterend', link);
      });
  };

  const run = () => {
    addSmartRfqAccess();
    addEmailFallbacks();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
