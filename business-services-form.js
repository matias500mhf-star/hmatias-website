/* HMATIAS Business Services — manual handoff fallback when secure lead intake is unavailable. */
(() => {
  'use strict';
  const form = document.getElementById('businessContactForm');
  if (!form) return;

  const en = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const copy = en ? {
    title: 'HMATIAS BUSINESS SERVICES — REQUEST',
    intro: 'The request has been prepared but has not been registered by HMATIAS. Choose a channel below and complete sending in your application.',
    whatsapp: 'Continue via WhatsApp',
    email: 'Continue by e-mail',
    review: 'Review request details',
    missing: 'Complete the required fields before preparing the request.',
    consent: 'Accept the privacy policy before continuing.',
    service: 'Required service',
    details: 'Description',
    location: 'Location',
    name: 'Name / Entity',
    phone: 'Phone / WhatsApp',
    emailLabel: 'E-mail'
  } : {
    title: 'HMATIAS BUSINESS SERVICES — PEDIDO',
    intro: 'O pedido foi preparado, mas ainda não foi registado pela HMATIAS. Escolha um canal abaixo e conclua o envio na aplicação correspondente.',
    whatsapp: 'Continuar pelo WhatsApp',
    email: 'Continuar por e-mail',
    review: 'Rever os dados do pedido',
    missing: 'Preencha os campos obrigatórios antes de preparar o pedido.',
    consent: 'Aceite a política de privacidade antes de continuar.',
    service: 'Serviço pretendido',
    details: 'Descrição',
    location: 'Localização',
    name: 'Nome / Entidade',
    phone: 'Telefone / WhatsApp',
    emailLabel: 'E-mail'
  };

  form.addEventListener('submit', event => {
    // The secure intake takes precedence whenever it has been activated.
    if (form.dataset.hmatiasWebsiteIntake === 'true') return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const consent = form.querySelector('[name="privacy_consent"]');
    const status = form.querySelector('#businessFormStatus');
    if (!consent?.checked) {
      if (status) status.textContent = copy.consent;
      consent?.focus();
      return;
    }

    const data = new FormData(form);
    const get = name => String(data.get(name) || '').trim();
    const message = [
      copy.title,
      '',
      copy.name + ': ' + get('client_name'),
      copy.phone + ': ' + get('contact'),
      copy.emailLabel + ': ' + (get('email') || (en ? 'Not provided' : 'Não indicado')),
      copy.location + ': ' + (get('location') || (en ? 'Not provided' : 'Não indicada')),
      copy.service + ': ' + get('service_type'),
      copy.details + ': ' + get('details')
    ].join('\n');

    let panel = form.querySelector('[data-business-manual-handoff]');
    if (!panel) {
      panel = document.createElement('section');
      panel.dataset.businessManualHandoff = 'true';
      panel.setAttribute('aria-label', en ? 'Prepared request handoff' : 'Envio do pedido preparado');
      panel.style.cssText = 'grid-column:1/-1;margin-top:18px;padding:20px;border:1px solid #d8e1e6;border-radius:10px;background:#f5f8fa';
      const intro = document.createElement('p');
      intro.textContent = copy.intro;
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin:14px 0';
      const wa = document.createElement('a');
      wa.className = 'btn btn-primary';
      wa.target = '_blank';
      wa.rel = 'noopener noreferrer';
      wa.textContent = copy.whatsapp;
      wa.dataset.businessWhatsapp = 'true';
      const mail = document.createElement('a');
      mail.className = 'btn btn-outline';
      mail.textContent = copy.email;
      mail.dataset.businessEmail = 'true';
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = copy.review;
      const pre = document.createElement('pre');
      pre.dataset.businessPreview = 'true';
      pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.88rem;line-height:1.6';
      details.append(summary, pre);
      actions.append(wa, mail);
      panel.append(intro, actions, details);
      form.appendChild(panel);
    }
    panel.querySelector('[data-business-whatsapp]').href = 'https://wa.me/244948806673?text=' + encodeURIComponent(message);
    panel.querySelector('[data-business-email]').href = 'mailto:geral@comercialhmatiasps.com?subject=' + encodeURIComponent(copy.title) + '&body=' + encodeURIComponent(message);
    panel.querySelector('[data-business-preview]').textContent = message;
    if (status) status.textContent = en ? 'Request prepared. Complete sending using one of the channels below.' : 'Pedido preparado. Conclua o envio através de um dos canais abaixo.';
    panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
})();