/* HMATIAS growth intelligence: trust, service routing, machine-readable context and lead fallbacks.
   No visitor-entered values are transmitted by this script. */
(() => {
  'use strict';

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const path = window.location.pathname || '/';
  const trustPath = isEn ? 'credibility.html' : 'credibilidade.html';
  const commercialEmail = 'comercial@hmatiasps.ao';

  const ensureTrustStyles = () => {
    if (document.querySelector('link[data-hmatias-trust-styles], link[href*="trust.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'trust.css?v=20260915';
    link.dataset.hmatiasTrustStyles = 'true';
    document.head.appendChild(link);
  };

  const addEntityGraph = () => {
    if (document.querySelector('script[data-hmatias-entity-graph]')) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.hmatiasEntityGraph = 'true';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://comercialhmatiasps.com/#organization',
          name: 'HMATIAS – Prestação de Serviços SU, LDA',
          alternateName: 'HMATIAS',
          url: 'https://comercialhmatiasps.com/',
          logo: 'https://comercialhmatiasps.com/logo-hmatias.png',
          image: 'https://comercialhmatiasps.com/og-hmatias.jpg',
          telephone: '+244948806673',
          email: ['geral@hmatiasps.ao', 'comercial@hmatiasps.ao'],
          taxID: '5001578065',
          foundingDate: '2023-07-12',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Bairro 1 de Maio, Casa n.º 31',
            addressLocality: 'Viana',
            addressRegion: 'Luanda',
            addressCountry: 'AO'
          },
          areaServed: { '@type': 'Country', name: 'Angola' },
          sameAs: ['https://www.instagram.com/hmatias_pslda/']
        },
        {
          '@type': 'WebSite',
          '@id': 'https://comercialhmatiasps.com/#website',
          url: 'https://comercialhmatiasps.com/',
          name: 'HMATIAS',
          publisher: { '@id': 'https://comercialhmatiasps.com/#organization' },
          inLanguage: ['pt-AO', 'en']
        }
      ]
    });
    document.head.appendChild(script);
  };

  const addTrustFooterLink = () => {
    const footer = document.querySelector('footer');
    if (!footer || footer.querySelector('[data-trust-link]') || footer.querySelector(`a[href="${trustPath}"]`)) return;
    const legalHeading = [...footer.querySelectorAll('strong')].find(node => /legal/i.test(node.textContent || ''));
    const column = legalHeading?.parentElement;
    if (!column) return;
    const link = document.createElement('a');
    link.href = trustPath;
    link.textContent = isEn ? 'Trust Center & Credentials' : 'Centro de Confiança & Credenciais';
    link.dataset.trustLink = 'footer';
    column.insertBefore(link, legalHeading.nextSibling);
  };

  const addTrustStrip = () => {
    const footer = document.querySelector('footer');
    if (!footer || document.querySelector('.hmatias-trust-strip')) return;
    const strip = document.createElement('section');
    strip.className = 'hmatias-trust-strip';
    strip.setAttribute('aria-label', isEn ? 'HMATIAS company verification' : 'Verificação empresarial HMATIAS');
    strip.innerHTML = isEn
      ? '<div class="container"><div><strong>Published company identity</strong> <span>Tax ID 5001578065 · Commercial Registration 24.094-23 · Viana, Luanda</span></div><a href="credibility.html" data-trust-link="strip">Verify HMATIAS →</a></div>'
      : '<div class="container"><div><strong>Identidade empresarial publicada</strong> <span>NIF 5001578065 · Registo Comercial 24.094-23 · Viana, Luanda</span></div><a href="credibilidade.html" data-trust-link="strip">Verificar HMATIAS →</a></div>';
    footer.parentNode.insertBefore(strip, footer);
  };

  const addSmartServiceRouter = () => {
    if (document.querySelector('[data-hmatias-smart-router]')) return;
    const isHome = path === '/' || path === '/index.html' || path === '/en.html';
    if (!isHome) return;

    const contact = document.querySelector('#contacto, #contact, .contact');
    if (!contact?.parentNode) return;

    const box = document.createElement('div');
    box.className = 'container';
    box.dataset.hmatiasSmartRouter = 'true';
    const inner = document.createElement('div');
    inner.className = 'smart-route-box';
    inner.innerHTML = isEn
      ? '<h3>Not sure which HMATIAS service fits your requirement?</h3><p>Choose the closest need. Each page tells you what information helps us prepare a more objective commercial response.</p><div class="smart-route-actions"><a href="construction.html" data-smart-route="construction">Construction & remodeling</a><a href="facilities-en.html" data-smart-route="facilities">Maintenance & facilities</a><a href="supply-en.html" data-smart-route="supply">Supply & procurement</a><a href="business-services.html" data-smart-route="business_services">Business support</a></div>'
      : '<h3>Não sabe qual área da HMATIAS corresponde à sua necessidade?</h3><p>Escolha o tipo de necessidade mais próximo. Cada página indica a informação que ajuda a preparar uma resposta comercial mais objetiva.</p><div class="smart-route-actions"><a href="construcao.html" data-smart-route="construction">Construção & remodelação</a><a href="facilities.html" data-smart-route="facilities">Manutenção & facilities</a><a href="supply.html" data-smart-route="supply">Supply & procurement</a><a href="servicos-administrativos.html" data-smart-route="business_services">Apoio empresarial</a></div>';
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
    const body = lines.join('\n').slice(0, 3500);
    return `mailto:${commercialEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const addEmailFallbacks = () => {
    const forms = [...document.querySelectorAll('form')].filter(form => {
      const id = (form.id || '').toLowerCase();
      return form.classList.contains('contact-form') || /(contact|quote|request|booking|clean|supply|business)/i.test(id);
    });

    forms.forEach(form => {
      if (form.querySelector('[data-email-fallback]')) return;
      const submit = form.querySelector('button[type="submit"], input[type="submit"]');
      if (!submit) return;
      const link = document.createElement('a');
      link.href = `mailto:${commercialEmail}`;
      link.className = 'email-fallback-link';
      link.dataset.emailFallback = 'true';
      link.dataset.quoteLink = 'true';
      link.textContent = isEn ? 'Prefer email? Prepare this request by email →' : 'Prefere e-mail? Preparar este pedido por e-mail →';
      link.addEventListener('click', () => { link.href = buildMailto(form); });
      submit.insertAdjacentElement('afterend', link);
    });
  };

  const run = () => {
    ensureTrustStyles();
    addEntityGraph();
    addTrustFooterLink();
    addTrustStrip();
    addSmartServiceRouter();
    addEmailFallbacks();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
