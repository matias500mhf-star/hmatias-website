/* HMATIAS shared site bootstrap. Keeps UI enhancements independent from analytics. */
(() => {
  'use strict';

  const stablePresentation = document.body?.classList.contains('site-stable');

  const reviewStylesheet = 'site-review.css?v=20260917-stable2';
  const premiumTypographyStylesheet = 'premium-typography.css?v=20260920-final2';
  const brandLockStylesheet = 'brand-lock.css?v=20260920-final1';
  const corporateCleanupStylesheet = 'corporate-cleanup.css?v=20260920-final1';
  const officialEmail = 'geral@comercialhmatiasps.com';
  const inactiveEmails = new Set([officialEmail]);

  const loadStylesheet = (selector, href, datasetName) => {
    if (document.querySelector(selector) || document.querySelector('link[href*="' + href.split('?')[0] + '"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (datasetName) link.dataset[datasetName] = 'true';
    document.head.appendChild(link);
  };

  const loadScript = (selector, src, datasetName, target = document.head) => {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (datasetName) script.dataset[datasetName] = 'true';
    target.appendChild(script);
  };

  const ensureReviewStylesheet = () => {
    const existing = document.querySelector('link[href*="site-review.css"]');
    if (existing) {
      existing.dataset.hmatiasSiteReview = 'true';
      return;
    }
    loadStylesheet('link[data-hmatias-site-review]', reviewStylesheet, 'hmatiasSiteReview');
  };

  const ensureFooterContactForm = () => {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('footerContactForm')) return;
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    const copy = isEn ? {
      eyebrow:'DIRECT CONTACT',title:'Send a message to HMATIAS.',
      intro:'Tell us what you need. Our team will review your request and reply using the contact details provided.',
      name:'Full name',company:'Company',email:'Business e-mail',phone:'Phone / WhatsApp',
      service:'Service required',choose:'Select a service',location:'Location',
      message:'How can we help?',messageHint:'Briefly describe your request, quantities or technical requirements.',
      consent:'I authorise HMATIAS to use these details to respond to this request, as described in the',
      privacy:'Privacy Policy',submit:'Send message →',note:'When automatic intake is enabled, a receipt confirmation will be requested to the e-mail address provided.',
      honeypot:'Leave this field empty'
    } : {
      eyebrow:'CONTACTO DIRECTO',title:'Envie uma mensagem à HMATIAS.',
      intro:'Explique brevemente o que pretende. A nossa equipa analisará o pedido e responderá através dos contactos indicados.',
      name:'Nome completo',company:'Empresa',email:'E-mail',phone:'Telefone / WhatsApp',
      service:'Serviço pretendido',choose:'Seleccione um serviço',location:'Localização',
      message:'Como podemos ajudar?',messageHint:'Descreva brevemente o pedido, quantidades ou requisitos técnicos.',
      consent:'Autorizo a HMATIAS a utilizar estes dados para responder ao pedido, nos termos da',
      privacy:'Política de Privacidade',submit:'Enviar mensagem →',note:'Quando a recepção automática estiver activa, será solicitada uma confirmação para o e-mail indicado.',
      honeypot:'Deixe este campo vazio'
    };
    const panel=document.createElement('section');
    panel.className='footer-contact-panel';
    panel.id='footer-contacto';
    panel.setAttribute('aria-labelledby','footer-contact-title');
    panel.innerHTML=[
      '<div class="footer-contact-heading"><span class="eyebrow">',copy.eyebrow,
      '</span><h2 id="footer-contact-title">',copy.title,'</h2><p>',copy.intro,'</p></div>',
      '<form class="footer-contact-form" id="footerContactForm">',
      '<div class="footer-contact-field"><label for="footer-contact-name">',copy.name,
      ' *</label><input id="footer-contact-name" name="nome" type="text" autocomplete="name" maxlength="120" required></div>',
      '<div class="footer-contact-field"><label for="footer-contact-email">',copy.email,
      ' *</label><input id="footer-contact-email" name="email" type="email" autocomplete="email" maxlength="180" required></div>',
      '<div class="footer-contact-field"><label for="footer-contact-company">',copy.company,
      '</label><input id="footer-contact-company" name="empresa" type="text" autocomplete="organization" maxlength="160"></div>',
      '<div class="footer-contact-field"><label for="footer-contact-phone">',copy.phone,
      '</label><input id="footer-contact-phone" name="telefone" type="tel" autocomplete="tel" maxlength="60"></div>',
      '<div class="footer-contact-field footer-contact-field--wide"><label for="footer-contact-service">',copy.service,
      ' *</label><select id="footer-contact-service" name="servico" required><option value="">',copy.choose,
      '</option><option>Construção Civil / Infraestrutura</option><option>Remodelação</option><option>Facilities / Manutenção</option><option>HMATIAS Supply / Procurement</option><option>Business Services</option><option>Outro</option></select></div>',
      '<div class="footer-contact-field footer-contact-field--wide"><label for="footer-contact-location">',copy.location,
      '</label><input id="footer-contact-location" name="location" type="text" autocomplete="address-level2" maxlength="160"></div>',
      '<div class="footer-contact-field footer-contact-field--message"><label for="footer-contact-message">',copy.message,
      ' *</label><textarea id="footer-contact-message" name="mensagem" rows="4" minlength="5" maxlength="2400" placeholder="',copy.messageHint,'" required></textarea></div>',
      '<label class="footer-contact-consent" for="footer-contact-privacy"><input id="footer-contact-privacy" name="privacy_consent" type="checkbox" required><span>',
      copy.consent,' <a href="',isEn?'privacy.html':'privacidade.html','">',copy.privacy,'</a>. *</span></label>',
      '<label class="footer-contact-honeypot" aria-hidden="true">',copy.honeypot,
      '<input name="website" type="text" tabindex="-1" autocomplete="off"></label>',
      '<div class="footer-contact-actions"><button class="btn btn-primary" type="submit">',copy.submit,
      '</button><small>',copy.note,'</small></div>',
      '<p class="footer-contact-status" role="status" aria-live="polite"></p></form>'
    ].join('');
    const bottom=footer.querySelector('.footer-pro-bottom,.copyright,.footer-bottom');
    footer.insertBefore(panel,bottom||null);
    const form=panel.querySelector('#footerContactForm');
    const status=form?.querySelector('.footer-contact-status');
    if(form&&status){
      form.dataset.hmatiasManualContactReady='true';
      form.addEventListener('submit',event=>{
        event.preventDefault();
        if(!form.reportValidity())return;
        const data=new FormData(form);
        const get=key=>String(data.get(key)||'').trim();
        const rows=isEn?[
          ['Name','nome'],['Company','empresa'],['E-mail','email'],['Phone / WhatsApp','telefone'],
          ['Service','servico'],['Location','location'],['Request','mensagem']
        ]:[
          ['Nome','nome'],['Empresa','empresa'],['E-mail','email'],['Telefone / WhatsApp','telefone'],
          ['Serviço','servico'],['Localização','location'],['Pedido','mensagem']
        ];
        const message=rows.map(([label,key])=>{const value=get(key);return value?label+': '+value:'';}).filter(Boolean).join('\n');
        const subject=isEn?'HMATIAS contact request':'Pedido de contacto HMATIAS';
        let actions=form.querySelector('[data-footer-contact-fallback]');
        if(!actions){
          actions=document.createElement('div');
          actions.className='footer-contact-fallback-actions';
          actions.dataset.footerContactFallback='true';
          status.insertAdjacentElement('beforebegin',actions);
        }
        actions.replaceChildren();
        const whatsapp=document.createElement('a');
        whatsapp.className='footer-contact-fallback-link';
        whatsapp.href='https://wa.me/244948806673?text='+encodeURIComponent((isEn?'Hello HMATIAS.\n\n':'Olá HMATIAS.\n\n')+message.slice(0,3400));
        whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';
        whatsapp.textContent=isEn?'Continue via WhatsApp':'Enviar pelo WhatsApp';
        const email=document.createElement('a');
        email.className='footer-contact-fallback-link';
        email.href='mailto:geral@comercialhmatiasps.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(message.slice(0,3400));
        email.textContent=isEn?'Prepare e-mail':'Preparar e-mail';
        actions.append(whatsapp,email);
        status.textContent=isEn
          ?'Automatic submission is unavailable now. Your request has not been sent; use one of the options below.'
          :'A submissão automática não está disponível neste momento. O pedido ainda não foi enviado; utilize uma das opções abaixo.';
      });
    }
    document.dispatchEvent(new CustomEvent('hmatias:footer-contact-ready'));
  };

  const ensureSharedAssets = () => {
    ensureFooterContactForm();
    if(document.querySelector('footer')) loadStylesheet('link[data-hmatias-footer-contact]','footer-contact-form.css?v=20261108-1','hmatiasFooterContact');
    if (!stablePresentation) ensureReviewStylesheet();
    if (!stablePresentation && document.body?.classList.contains('hmatias-home')) {
      loadStylesheet('link[data-hmatias-premium-typography]', premiumTypographyStylesheet, 'hmatiasPremiumTypography');
    }
    loadStylesheet('link[data-hmatias-brand-lock]', brandLockStylesheet, 'hmatiasBrandLock');
    loadStylesheet('link[data-hmatias-mobile-contact]', 'mobile-contact-layout.css?v=20261008-1', 'hmatiasMobileContact');
    if (!stablePresentation) loadStylesheet('link[data-hmatias-corporate-cleanup]', corporateCleanupStylesheet, 'hmatiasCorporateCleanup');
    // This is an opt-in integration: no request, storage or browser-side CRM calls
    // until the secure Worker endpoint and Turnstile site key are explicitly configured.
    const leadEndpoint=document.documentElement.dataset.hmatiasLeadsEndpoint||'';
    const leadSiteKey=document.documentElement.dataset.hmatiasTurnstileSiteKey||'';
    if(/^https:\/\/[^\s]+\/v1\/leads$/.test(leadEndpoint)&&leadSiteKey&&
       (document.querySelector('#contactForm,#businessContactForm,#bookingRequestForm,#footerContactForm')||document.querySelector('footer'))){
      loadScript('script[data-hmatias-lead-intake]','lead-intake-client.js?v=20261008-1','hmatiasLeadIntake',document.body);
    }
    // Opt-in to persisted institutional leads after the Worker capability check.
    // Keep WhatsApp and email working if the backend remains disabled.
    if(!leadEndpoint && (document.querySelector('#contactForm,#businessContactForm,#bookingRequestForm,#footerContactForm')||document.querySelector('footer'))){
      loadScript('script[data-hmatias-website-leads]','website-lead-client.js?v=20261108-contactreceipt1','hmatiasWebsiteLeads',document.body);
    }
    loadScript('script[data-hmatias-site-enhancements]', 'site-enhancements.js?v=20261019-icons1', 'hmatiasSiteEnhancements');
    loadScript('script[data-hmatias-growth-intelligence]', 'growth-intelligence.js?v=20261009-email-cta1', 'hmatiasGrowthIntelligence');
  };

  const ensureCatalogueIdentity = () => {
    const path = window.location.pathname || '/';
    if (!/\/(?:catalogo-obras|work-catalogue)\.html$/.test(path)) return;
    document.body?.classList.add('hmatias-catalogue');
    loadStylesheet('link[data-hmatias-catalogue-typography]', premiumTypographyStylesheet, 'hmatiasCatalogueTypography');
  };

  const addInstagramLink = () => {
    document.querySelectorAll('.header-social').forEach(group => {
      if (group.querySelector('[data-hmatias-instagram], a[href*="instagram.com"]')) return;
      const link = document.createElement('a');
      link.href = 'https://www.instagram.com/hmatias_pslda/';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Instagram — HMATIAS');
      link.dataset.hmatiasInstagram = 'true';
      const icon = document.createElement('img');
      icon.src = 'images/social-instagram.svg';
      icon.width = 18;
      icon.height = 18;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      link.appendChild(icon);
      group.appendChild(link);
    });
  };

  const normalizeOfficialEmail = () => {
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      const href = (link.getAttribute('href') || '').trim();
      const raw = href.slice(7);
      const [address, suffix = ''] = raw.split(/(?=[?])/);
      if (!inactiveEmails.has(address.toLowerCase())) return;
      link.setAttribute('href', 'mailto:' + officialEmail + suffix);
      if ((link.textContent || '').trim().toLowerCase() === address.toLowerCase()) {
        const textNodes = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        while (textNodes.nextNode()) {
          const textNode = textNodes.currentNode;
          const visibleText = textNode.textContent.trim();
          if (visibleText.toLowerCase() !== address.toLowerCase()) continue;
          const leadingWhitespace = (textNode.textContent.match(/^\s*/) || [''])[0];
          const trailingWhitespace = (textNode.textContent.match(/\s*$/) || [''])[0];
          textNode.textContent = leadingWhitespace + officialEmail + trailingWhitespace;
          break;
        }
      }
    });

    /* Earlier contact normalization can leave the same operational mailbox twice.
       Keep one visible email per shared header/footer contact group without changing layout. */
    document.querySelectorAll('.header-contact, footer .footer-contact, footer .footer-links, footer .footer-pro-contact, footer').forEach(group => {
      const seen = new Set();
      group.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        const address = ((link.getAttribute('href') || '').slice(7).split('?')[0] || '').trim().toLowerCase();
        if (!address) return;
        if (seen.has(address)) link.remove();
        else seen.add(address);
      });
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      let value = script.textContent || '';
      inactiveEmails.forEach(email => {
        value = value.replace(new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), officialEmail);
      });
      script.textContent = value;
    });
  };

  const normaliseSharedLinks = () => {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = (link.getAttribute('href') || '').trim();
      if (href === 'hmatias-clean.html' || href === '/hmatias-clean.html') link.setAttribute('href', 'clean.html');
      if (href === 'hmatias-clean-en.html' || href === '/hmatias-clean-en.html') link.setAttribute('href', 'clean-en.html');
      if (link.target === '_blank') {
        const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.rel = [...rel].join(' ');
      }
    });

    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    document.querySelectorAll('.copyright').forEach(node => {
      node.innerHTML = node.innerHTML
        .replace(/HMATIAS SU, LDA\./g, 'HMATIAS – Prestação de Serviços SU, LDA.')
        .replace(/\s*·\s*Matrícula:\s*24094-23\/230713\.?/gi, '');
      if (isEn) {
        node.innerHTML = node.innerHTML
          .replace(/NIF:/g, 'Tax ID:')
          .replace(/Registo Comercial:/g, 'Commercial Registration:')
          .replace(/Matrícula:/g, 'Registration No.:');
      }
    });
  };

  // KARTA is an Alpha digital project, not a primary commercial service.
  // Its dedicated institutional project page remains reachable via
  // Informacao Institucional > Inovacao e Projetos Digitais.

  const ensureSourceAOAccess = () => {
    const footerBrand = document.querySelector('footer .footer-grid > div:first-child, footer .footer-pro-brand');
    if (!footerBrand || footerBrand.querySelector('[data-source-ao-footer]')) return;

    if (!document.querySelector('style[data-source-ao-footer-style]')) {
      const style = document.createElement('style');
      style.dataset.sourceAoFooterStyle = 'true';
      style.textContent = '.footer-source-ao-link{display:inline-flex;align-items:center;justify-content:center;margin-top:16px;padding:8px 11px;background:#fff;border:1px solid rgba(255,255,255,.20);text-decoration:none;max-width:max-content}.footer-source-ao-logo{display:block;width:170px;height:auto;max-height:84px;object-fit:contain;filter:none;opacity:1}.footer-source-ao-link:hover{border-color:rgba(255,255,255,.46)}.footer-karta-link{margin-right:14px!important}@media(max-width:600px){.footer-source-ao-logo{width:150px;max-height:74px}.footer-karta-link{margin-right:12px!important}}';
      document.head.appendChild(style);
    }

    const link = document.createElement('a');
    link.className = 'footer-source-ao-link';
    link.href = 'source-ao/';
    link.dataset.sourceAoFooter = 'true';
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    link.setAttribute('aria-label', isEn
      ? 'Open Source AO — materials research and supply requests'
      : 'Abrir Source AO — pesquisa de materiais e pedidos de fornecimento');
    const imageAlt = isEn
      ? 'SOURCE AO — technical research and HMATIAS supply'
      : 'SOURCE AO — pesquisa técnica e fornecimento HMATIAS';
    link.innerHTML = '<img class="footer-source-ao-logo" src="images/source-ao-logo.svg" alt="' + imageAlt + '" width="760" height="360">';
    footerBrand.appendChild(link);
  };

  const loadPortfolioLayer = () => {
    if (stablePresentation || !document.body.classList.contains('hmatias-home')) return;
    loadScript('script[data-hmatias-portfolio]', 'portfolio.js?v=20260920-premium2', 'hmatiasPortfolio', document.body);
  };

  const run = () => {
    ensureCatalogueIdentity();
    addInstagramLink();
    normalizeOfficialEmail();
    normaliseSharedLinks();
    ensureSourceAOAccess();
    loadPortfolioLayer();
  };

  ensureSharedAssets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
})();
