/* HMATIAS shared SEO + accessibility refinements. No tracking and no user data collection. */
(() => {
  'use strict';
  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const path = window.location.pathname || '/';

  const setMetaDescription = () => {
    const descriptions = {
      '/': 'Construção civil, facilities, manutenção, procurement e fornecimento empresarial para empresas e instituições em Luanda e Angola.',
      '/index.html': 'Construção civil, facilities, manutenção, procurement e fornecimento empresarial para empresas e instituições em Luanda e Angola.',
      '/en.html': 'Construction, facilities, maintenance, procurement and business supply services for companies and institutions in Luanda and Angola.',
      '/servicos-administrativos.html': 'Apoio administrativo, documental e empresarial para profissionais, PME e empresas, com atendimento em Luanda e suporte remoto quando aplicável.',
      '/business-services.html': 'Administrative, document and business support for professionals, SMEs and companies, with service in Luanda and remote support where applicable.',
      '/clean-en.html': 'HMATIAS Clean supplies cleaning and hygiene products for professional and domestic use, with structured quotation requests in Angola.'
    };
    const meta = document.querySelector('meta[name="description"]');
    if (meta && descriptions[path]) meta.content = descriptions[path];
  };

  const improveNavigation = () => {
    const nav = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (!nav) return;
    nav.setAttribute('role', 'navigation');
    if (!nav.id) nav.id = 'main-navigation';
    if (toggle) toggle.setAttribute('aria-controls', nav.id);

    // Keep the desktop control compact while ensuring the visible label is part of the accessible name.
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
      if (/\.pdf(?:$|[?#])/.test(href)) link.title = isEn ? 'Opens a PDF document in a new tab' : 'Abre um documento PDF numa nova aba';
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

    if (path === '/clean-en.html') {
      const hasCatalog = [...document.querySelectorAll('script[type="application/ld+json"]')].some(s => /OfferCatalog/.test(s.textContent || ''));
      if (!hasCatalog) {
        const schema = document.createElement('script');
        schema.type = 'application/ld+json';
        schema.textContent = JSON.stringify({
          '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'HMATIAS Clean',
          url: 'https://comercialhmatiasps.com/clean-en.html',
          itemListElement: [
            { '@type': 'Offer', name: '123 Pine Gel 500 ml', availability: 'https://schema.org/PreOrder' },
            { '@type': 'Offer', name: 'Taurus Pine Gel T563P 1 kg', price: '8500', priceCurrency: 'AOA', availability: 'https://schema.org/PreOrder' },
            { '@type': 'Offer', name: 'Taurus Pine Gel T563P 5 kg', price: '26500', priceCurrency: 'AOA', availability: 'https://schema.org/PreOrder' },
            { '@type': 'Offer', name: 'Taurus Pine Gel T563P 20 kg', price: '94000', priceCurrency: 'AOA', availability: 'https://schema.org/PreOrder' }
          ]
        });
        document.head.appendChild(schema);
      }
    }

    if (!document.getElementById('clean-business-use')) {
      const quote = document.querySelector('.clean-quote-section');
      if (quote?.parentNode) {
        const section = document.createElement('section');
        section.className = 'unit-main soft';
        section.id = 'clean-business-use';
        section.innerHTML = isEn ? '<div class="container"><div class="unit-heading"><span class="eyebrow blue">CLEANING PRODUCTS IN LUANDA</span><h2>Cleaning and hygiene supply for homes, companies and professional operations.</h2><p>HMATIAS Clean organises product requests by reference, format, quantity and delivery location. This makes it easier to request a quotation while keeping price, stock and lead time subject to commercial confirmation.</p><p>Professional requirements may involve recurring quantities, specific pack sizes or catalogue references. Availability, price, lead time and delivery conditions are confirmed before an order is accepted.</p><p>For broader business procurement, use <a href="supply-en.html">HMATIAS Supply & Procurement</a>. For recurring facility requirements, see <a href="facilities-en.html">Facilities & Maintenance</a>.</p></div></div>' : '<div class="container"><div class="unit-heading"><span class="eyebrow blue">PRODUTOS DE LIMPEZA EM LUANDA</span><h2>Fornecimento de limpeza e higiene para casas, empresas e operações profissionais.</h2><p>A HMATIAS Clean organiza pedidos por produto, referência, formato, quantidade e localização de entrega. Isso permite solicitar cotação de forma objetiva, mantendo preço, stock e prazo sujeitos a confirmação comercial.</p><p>Necessidades profissionais podem envolver quantidades recorrentes, embalagens específicas ou referências de catálogo. A confirmação final considera disponibilidade, preço, prazo e condições de entrega.</p><p>Para procurement empresarial, consulte <a href="supply.html">HMATIAS Supply & Procurement</a>. Para necessidades recorrentes de instalações, consulte <a href="facilities.html">Facilities & Manutenção</a>.</p></div></div>';
        quote.parentNode.insertBefore(section, quote);
      }
    }
  };

  const normaliseImages = () => {
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
    });
  };

  const run = () => {
    setMetaDescription();
    improveNavigation();
    improveLinks();
    improveAssistantAccessibility();
    improveCleanPage();
    normaliseImages();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();