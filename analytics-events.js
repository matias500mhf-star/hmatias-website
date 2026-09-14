/* HMATIAS GA4 commercial interaction tracking. Never send visitor-entered values. */
(() => {
  'use strict';

  if (typeof window.gtag !== 'function') return;

  const pageLanguage = (document.documentElement.lang || 'pt-AO').toLowerCase();
  const pageName = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const pagePath = window.location.pathname || '/';

  const servicePages = {
    'construcao.html': 'construction',
    'construction.html': 'construction',
    'facilities.html': 'facilities',
    'facilities-en.html': 'facilities',
    'supply.html': 'supply',
    'supply-en.html': 'supply',
    'clean.html': 'clean',
    'clean-en.html': 'clean',
    'business-services.html': 'business_services',
    'servicos-administrativos.html': 'business_services',
    'agendamento.html': 'appointment',
    'booking.html': 'appointment'
  };

  const leadForms = {
    cleanQuoteForm: 'clean_quote',
    supplyRequestForm: 'supply_quote',
    bookingRequestForm: 'appointment_request',
    businessContactForm: 'business_services_request',
    contactForm: 'general_quote'
  };

  const track = (eventName, parameters = {}) => {
    if (!eventName) return;
    window.gtag('event', eventName, {
      page_path: pagePath,
      page_language: pageLanguage,
      ...parameters
    });
  };

  const serviceFromHref = href => {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return null;
      const file = (url.pathname.split('/').pop() || 'index.html').toLowerCase();
      return servicePages[file] || null;
    } catch (_) {
      return null;
    }
  };

  const serviceName = servicePages[pageName];
  if (serviceName) track('service_view', { service_name: serviceName });

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;

    const rawHref = (anchor.getAttribute('href') || '').trim();
    const hrefLower = rawHref.toLowerCase();
    const text = (anchor.textContent || anchor.getAttribute('aria-label') || '').trim().toLowerCase();

    let contactMethod = null;
    if (hrefLower.startsWith('tel:')) contactMethod = 'phone';
    else if (hrefLower.startsWith('mailto:')) contactMethod = 'email';
    else {
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.hostname === 'wa.me' || url.hostname === 'whatsapp.com' || url.hostname.endsWith('.whatsapp.com')) {
          contactMethod = 'whatsapp';
        }
      } catch (_) {}
    }

    if (contactMethod) {
      track('contact_click', { contact_method: contactMethod });
      track(`${contactMethod}_click`, { contact_method: contactMethod });
    }

    const quoteIntent = anchor.hasAttribute('data-quote-link') ||
      /(orçamento|orcamento|cotação|cotacao|quotation|quote|proposal|proposta)/i.test(text);
    if (quoteIntent) {
      track('quote_cta_click', {
        contact_method: contactMethod || 'website',
        service_name: serviceName || 'general'
      });
    }

    const targetService = serviceFromHref(anchor.href);
    if (targetService && targetService !== serviceName) {
      track('service_click', { service_name: targetService });
    }

    const projectCard = anchor.closest('[data-project-id]');
    if (projectCard && projectCard.dataset.projectId) {
      track('project_engagement', { project_id: projectCard.dataset.projectId });
    }
  }, { passive: true });

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.checkValidity()) return;

    const formId = form.id || '';
    let leadType = leadForms[formId] || null;
    if (!leadType && form.classList.contains('contact-form')) leadType = 'general_quote';
    if (!leadType) return;

    if (form.dataset.hmatiasAnalyticsSubmitting === 'true') return;
    form.dataset.hmatiasAnalyticsSubmitting = 'true';
    window.setTimeout(() => delete form.dataset.hmatiasAnalyticsSubmitting, 1500);

    track('form_submit', {
      form_id: formId || 'unnamed_lead_form',
      lead_type: leadType
    });
    track('generate_lead', {
      method: 'website_form',
      lead_type: leadType
    });
  }, true);

  window.hmatiasAnalytics = Object.freeze({ track });
})();
