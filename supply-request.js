/* HMATIAS Supply — structured multi-item quotation request builder. */
(() => {
  'use strict';

  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const isSupply = /\/supply(?:-en)?\.html(?:$|[?#])/.test(canonical);
  if (!isSupply) return;

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const existing = document.querySelector('.supply-request-section');
  if (existing) return;

  if (!document.querySelector('link[data-hmatias-supply-request]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'supply-request.css?v=20260913';
    link.dataset.hmatiasSupplyRequest = 'true';
    document.head.appendChild(link);
  }

  const copy = isEn ? {
    eyebrow: 'STRUCTURED REQUEST',
    title: 'Structure the requirement with technical and commercial detail.',
    intro: 'List the material, product or equipment required, including references, specifications and quantities. This gives the commercial team a clear basis for sourcing, comparison and quotation.',
    points: ['Multiple items in one request', 'Reference and specification captured per item', 'Price, availability, lead time and logistics confirmed before commitment'],
    entity: 'Name / Company *',
    phone: 'Phone / WhatsApp *',
    email: 'E-mail',
    location: 'Delivery / project location *',
    target: 'Target date',
    items: 'Items requested',
    add: '+ Add item',
    item: 'Material / product / equipment *',
    spec: 'Reference / specification',
    qty: 'Quantity / unit *',
    remove: 'Remove item',
    notes: 'Logistics or additional notes',
    consent: 'I confirm that HMATIAS may use the information above to assess and respond to this commercial request.',
    submit: 'Prepare sourcing request →',
    status: 'Request prepared. WhatsApp will open for review and final sending.',
    required: 'Please complete the required fields before preparing the request.',
    itemPlaceholder: 'e.g. industrial pump, cable, anti-corrosion coating',
    specPlaceholder: 'Brand, model, standard, dimensions or technical reference',
    qtyPlaceholder: 'e.g. 20 units',
    notesPlaceholder: 'Origin preference, delivery constraints, attached-reference note, etc.',
    namePlaceholder: 'Client or company name',
    phonePlaceholder: '+244 ...',
    emailPlaceholder: 'name@company.com',
    locationPlaceholder: 'e.g. Viana, Luanda',
    messageTitle: 'HMATIAS SUPPLY — SOURCING / QUOTATION REQUEST',
    notProvided: 'Not provided'
  } : {
    eyebrow: 'PEDIDO ESTRUTURADO',
    title: 'Estruture a necessidade com detalhe técnico e comercial.',
    intro: 'Liste o material, produto ou equipamento pretendido, incluindo referências, especificações e quantidades. A equipa comercial terá assim uma base clara para pesquisa, comparação e cotação.',
    points: ['Vários itens no mesmo pedido', 'Referência e especificação registadas por item', 'Preço, disponibilidade, prazo e logística confirmados antes do compromisso'],
    entity: 'Nome / Empresa *',
    phone: 'Telefone / WhatsApp *',
    email: 'E-mail',
    location: 'Local de entrega / projeto *',
    target: 'Prazo pretendido',
    items: 'Itens solicitados',
    add: '+ Adicionar item',
    item: 'Material / produto / equipamento *',
    spec: 'Referência / especificação',
    qty: 'Quantidade / unidade *',
    remove: 'Remover item',
    notes: 'Logística ou observações adicionais',
    consent: 'Confirmo que a HMATIAS pode utilizar as informações acima para avaliar e responder a este pedido comercial.',
    submit: 'Preparar pedido de sourcing →',
    status: 'Pedido preparado. O WhatsApp será aberto para revisão e envio final.',
    required: 'Preencha os campos obrigatórios antes de preparar o pedido.',
    itemPlaceholder: 'Ex.: bomba industrial, cabo, revestimento anticorrosivo',
    specPlaceholder: 'Marca, modelo, norma, dimensão ou referência técnica',
    qtyPlaceholder: 'Ex.: 20 unidades',
    notesPlaceholder: 'Preferência de origem, condicionantes de entrega, nota sobre referência anexa, etc.',
    namePlaceholder: 'Nome do cliente ou empresa',
    phonePlaceholder: '+244 ...',
    emailPlaceholder: 'nome@empresa.com',
    locationPlaceholder: 'Ex.: Viana, Luanda',
    messageTitle: 'HMATIAS SUPPLY — PEDIDO DE SOURCING / COTAÇÃO',
    notProvided: 'Não indicado'
  };

  const target = document.querySelector('.unit-cta');
  if (!target) return;

  const section = document.createElement('section');
  section.className = 'supply-request-section';
  section.id = isEn ? 'supply-request' : 'pedido-supply';
  section.innerHTML = `
    <div class="container supply-request-layout">
      <div class="supply-request-copy">
        <span class="eyebrow blue">${copy.eyebrow}</span>
        <h2>${copy.title}</h2>
        <p>${copy.intro}</p>
        <div class="supply-request-points">${copy.points.map(x => `<span>${x}</span>`).join('')}</div>
      </div>
      <form class="supply-request-form" id="supplyRequestForm" novalidate>
        <div class="supply-request-grid">
          <div class="supply-request-field"><label for="supply-name">${copy.entity}</label><input id="supply-name" name="client_name" type="text" autocomplete="name" maxlength="120" placeholder="${copy.namePlaceholder}" required></div>
          <div class="supply-request-field"><label for="supply-phone">${copy.phone}</label><input id="supply-phone" name="phone" type="tel" autocomplete="tel" maxlength="50" placeholder="${copy.phonePlaceholder}" required></div>
          <div class="supply-request-field"><label for="supply-email">${copy.email}</label><input id="supply-email" name="email" type="email" autocomplete="email" maxlength="120" placeholder="${copy.emailPlaceholder}"></div>
          <div class="supply-request-field"><label for="supply-location">${copy.location}</label><input id="supply-location" name="location" type="text" autocomplete="address-level2" maxlength="120" placeholder="${copy.locationPlaceholder}" required></div>
          <div class="supply-request-field full"><label for="supply-target-date">${copy.target}</label><input id="supply-target-date" name="target_date" type="text" maxlength="100" placeholder="${isEn ? 'e.g. within 30 days' : 'Ex.: entrega pretendida em 30 dias'}"></div>
          <div class="supply-items" id="supplyItems">
            <div class="supply-items-head"><strong>${copy.items}</strong><button class="supply-add-item" type="button" id="supplyAddItem">${copy.add}</button></div>
          </div>
          <div class="supply-request-field full"><label for="supply-notes">${copy.notes}</label><textarea id="supply-notes" name="notes" maxlength="1200" placeholder="${copy.notesPlaceholder}"></textarea></div>
          <label class="supply-request-consent"><input type="checkbox" id="supply-consent" required><span>${copy.consent}</span></label>
          <div class="supply-request-actions"><button class="btn btn-primary" type="submit">${copy.submit}</button><p class="supply-request-status" id="supplyRequestStatus" aria-live="polite"></p></div>
        </div>
      </form>
    </div>`;

  target.parentNode.insertBefore(section, target);

  const itemsWrap = section.querySelector('#supplyItems');
  const addButton = section.querySelector('#supplyAddItem');
  const form = section.querySelector('#supplyRequestForm');
  const status = section.querySelector('#supplyRequestStatus');
  let sequence = 0;

  const addItem = (preset = {}) => {
    sequence += 1;
    const row = document.createElement('div');
    row.className = 'supply-item';
    row.dataset.supplyItem = String(sequence);
    row.innerHTML = `
      <label>${copy.item}<input type="text" name="item_${sequence}" maxlength="180" placeholder="${copy.itemPlaceholder}" value="${String(preset.item || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" required></label>
      <label>${copy.spec}<input type="text" name="spec_${sequence}" maxlength="220" placeholder="${copy.specPlaceholder}" value="${String(preset.spec || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></label>
      <label>${copy.qty}<input type="text" name="qty_${sequence}" maxlength="80" placeholder="${copy.qtyPlaceholder}" value="${String(preset.qty || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" required></label>
      <button class="supply-remove-item" type="button" aria-label="${copy.remove}" title="${copy.remove}">×</button>`;
    row.querySelector('.supply-remove-item').addEventListener('click', () => {
      if (itemsWrap.querySelectorAll('.supply-item').length === 1) {
        row.querySelectorAll('input').forEach(input => input.value = '');
        row.querySelector('input')?.focus();
        return;
      }
      row.remove();
    });
    itemsWrap.appendChild(row);
  };

  addItem();
  addButton.addEventListener('click', () => {
    addItem();
    const rows = itemsWrap.querySelectorAll('.supply-item');
    rows[rows.length - 1]?.querySelector('input')?.focus();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) {
      status.textContent = copy.required;
      return;
    }

    const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
    const rows = [...itemsWrap.querySelectorAll('.supply-item')].map((row, index) => {
      const fields = row.querySelectorAll('input');
      return {
        index: index + 1,
        item: clean(fields[0]?.value),
        spec: clean(fields[1]?.value),
        qty: clean(fields[2]?.value)
      };
    }).filter(row => row.item && row.qty);

    if (!rows.length) {
      status.textContent = copy.required;
      return;
    }

    const name = clean(form.elements.client_name.value);
    const phone = clean(form.elements.phone.value);
    const email = clean(form.elements.email.value) || copy.notProvided;
    const locationValue = clean(form.elements.location.value);
    const targetDate = clean(form.elements.target_date.value) || copy.notProvided;
    const notes = clean(form.elements.notes.value) || copy.notProvided;

    const itemLines = rows.map(row => {
      if (isEn) return `${row.index}. ${row.item}\n   Reference / specification: ${row.spec || copy.notProvided}\n   Quantity / unit: ${row.qty}`;
      return `${row.index}. ${row.item}\n   Referência / especificação: ${row.spec || copy.notProvided}\n   Quantidade / unidade: ${row.qty}`;
    }).join('\n\n');

    const message = isEn
      ? `${copy.messageTitle}\n\nName / Company: ${name}\nPhone / WhatsApp: ${phone}\nE-mail: ${email}\nDelivery / project location: ${locationValue}\nTarget date: ${targetDate}\n\nITEMS\n${itemLines}\n\nLogistics / additional notes: ${notes}\n\nI understand that price, availability, lead time, origin and logistics are subject to HMATIAS commercial confirmation.`
      : `${copy.messageTitle}\n\nNome / Empresa: ${name}\nTelefone / WhatsApp: ${phone}\nE-mail: ${email}\nLocal de entrega / projeto: ${locationValue}\nPrazo pretendido: ${targetDate}\n\nITENS\n${itemLines}\n\nLogística / observações adicionais: ${notes}\n\nCompreendo que preço, disponibilidade, prazo, origem e logística ficam sujeitos a confirmação comercial da HMATIAS.`;

    status.textContent = copy.status;
    window.open(`https://wa.me/244948806673?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });
})();
