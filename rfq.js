/* HMATIAS Smart RFQ builder. Data remains in the browser until the visitor chooses email, WhatsApp or copy. */
(() => {
  'use strict';

  const form = document.getElementById('smartRfqForm');
  if (!form) return;

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const service = form.querySelector('#rfqService');
  const preview = document.getElementById('rfqSummary');
  const referenceEl = document.getElementById('rfqReference');
  const emailLink = document.getElementById('rfqEmail');
  const whatsappLink = document.getElementById('rfqWhatsapp');
  const copyButton = document.getElementById('rfqCopy');
  const copyStatus = document.getElementById('rfqCopyStatus');
  const progress = [...document.querySelectorAll('.rfq-progress span')];

  const generateReference = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    let suffix = '';
    try {
      const bytes = new Uint8Array(2);
      crypto.getRandomValues(bytes);
      suffix = [...bytes].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    } catch (_) {
      suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    }
    return `HM-RFQ-${stamp}-${suffix}`;
  };

  const reference = generateReference();
  if (referenceEl) referenceEl.textContent = reference;

  const setProgress = step => {
    progress.forEach((item, index) => item.classList.toggle('active', index < step));
  };

  const resetOutput = () => {
    const placeholder = preview?.dataset.placeholder || '';
    if (preview && placeholder) preview.textContent = placeholder;
    if (emailLink) {
      emailLink.href = 'mailto:geral@comercialhmatiasps.com';
      emailLink.setAttribute('aria-disabled', 'true');
    }
    if (whatsappLink) {
      whatsappLink.href = 'https://wa.me/244948806673';
      whatsappLink.setAttribute('aria-disabled', 'true');
    }
    if (copyStatus) copyStatus.textContent = '';
  };

  const updateContext = () => {
    const selected = service?.value || '';
    document.querySelectorAll('.rfq-context').forEach(section => {
      const active = section.dataset.service === selected;
      section.classList.toggle('active', active);
      section.querySelectorAll('input, select, textarea').forEach(input => { input.disabled = !active; });
    });
    resetOutput();
    setProgress(selected ? 2 : 1);
    if (selected && window.hmatiasAnalytics?.track) {
      window.hmatiasAnalytics.track('rfq_service_selected', { service_name: selected });
    }
  };

  const cleanLabel = text => String(text || '').replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ').trim();

  const fieldLabel = element => {
    if (element.id) {
      const label = form.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (label) return cleanLabel(label.textContent);
    }
    return cleanLabel(element.getAttribute('aria-label') || element.name || (isEn ? 'Field' : 'Campo'));
  };

  const fieldValue = element => {
    if (element.tagName === 'SELECT') return cleanLabel(element.selectedOptions?.[0]?.textContent || '');
    if ((element.type === 'checkbox' || element.type === 'radio')) return element.checked ? (isEn ? 'Yes' : 'Sim') : '';
    return String(element.value || '').trim();
  };

  const safeForSummary = element => {
    const key = `${element.name || ''} ${element.id || ''} ${element.autocomplete || ''}`.toLowerCase();
    return !/(password|passcode|bank|iban|card|passport|identity|identidade|document|documento|bilhete|\bbi\b)/i.test(key);
  };

  const buildSummary = () => {
    const title = isEn ? 'HMATIAS — STRUCTURED RFQ REQUEST' : 'HMATIAS — PEDIDO DE COTAÇÃO ESTRUTURADO';
    const notice = isEn
      ? 'This is a client-prepared request brief, not a quotation, contract or confirmation of price, stock or delivery.'
      : 'Este é um briefing de pedido preparado pelo cliente, não constitui cotação, contrato nem confirmação de preço, stock ou entrega.';
    const lines = [title, `Reference: ${reference}`, notice, ''];

    const fields = [...form.querySelectorAll('input, select, textarea')]
      .filter(el => !el.disabled && el.type !== 'submit' && el.type !== 'button' && safeForSummary(el));

    let lastGroup = '';
    fields.forEach(el => {
      const value = fieldValue(el);
      if (!value || (el.tagName === 'SELECT' && !el.value)) return;
      const section = el.closest('fieldset');
      const legend = cleanLabel(section?.querySelector('legend')?.textContent || '');
      if (legend && legend !== lastGroup) {
        if (lines.at(-1) !== '') lines.push('');
        lines.push(legend.toUpperCase());
        lastGroup = legend;
      }
      lines.push(`${fieldLabel(el)}: ${value}`);
    });

    lines.push('', isEn ? `Source: ${location.href}` : `Origem: ${location.href}`);
    return lines.join('\n').slice(0, 6000);
  };

  const updateChannels = summary => {
    const subject = isEn ? `${reference} — HMATIAS RFQ request` : `${reference} — Pedido de cotação HMATIAS`;
    if (emailLink) {
      emailLink.href = `mailto:geral@comercialhmatiasps.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
      emailLink.removeAttribute('aria-disabled');
    }
    if (whatsappLink) {
      whatsappLink.href = `https://wa.me/244948806673?text=${encodeURIComponent(summary)}`;
      whatsappLink.removeAttribute('aria-disabled');
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const summary = buildSummary();
    if (preview) preview.textContent = summary;
    updateChannels(summary);
    setProgress(3);
    if (window.hmatiasAnalytics?.track) {
      window.hmatiasAnalytics.track('rfq_built', { service_name: service?.value || 'general' });
    }
    preview?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  form.addEventListener('input', event => {
    if (event.target === service) return;
    const placeholder = preview?.dataset.placeholder || '';
    if (preview && preview.textContent.trim() !== placeholder.trim()) {
      resetOutput();
      setProgress(service?.value ? 2 : 1);
    }
  });

  emailLink?.addEventListener('click', event => {
    if (emailLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
    else if (window.hmatiasAnalytics?.track) window.hmatiasAnalytics.track('rfq_handoff', { method: 'email', service_name: service?.value || 'general' });
  });

  whatsappLink?.addEventListener('click', event => {
    if (whatsappLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
    else if (window.hmatiasAnalytics?.track) window.hmatiasAnalytics.track('rfq_handoff', { method: 'whatsapp', service_name: service?.value || 'general' });
  });

  copyButton?.addEventListener('click', async () => {
    const summary = preview?.textContent?.trim() || '';
    const placeholder = preview?.dataset.placeholder || '';
    if (!summary || summary === placeholder) {
      if (copyStatus) copyStatus.textContent = isEn ? 'Build the request first.' : 'Prepare primeiro o pedido.';
      return;
    }
    try {
      await navigator.clipboard.writeText(summary);
      if (copyStatus) copyStatus.textContent = isEn ? 'Request copied.' : 'Pedido copiado.';
      if (window.hmatiasAnalytics?.track) window.hmatiasAnalytics.track('rfq_copy', { service_name: service?.value || 'general' });
    } catch (_) {
      if (copyStatus) copyStatus.textContent = isEn ? 'Copy was not available in this browser.' : 'A cópia não ficou disponível neste navegador.';
    }
  });

  service?.addEventListener('change', updateContext);
  updateContext();
})();
