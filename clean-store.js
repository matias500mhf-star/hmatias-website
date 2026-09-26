/* HMATIAS Clean — multi-item quotation workflow with WhatsApp handoff. */
(() => {
  'use strict';

  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const form = q('#cleanQuoteForm');
  if (!form) return;

  const product = q('#clean-product');
  const qty = q('#clean-quantity');
  const request = q('#clean-request');
  const name = q('#clean-name');
  const client = q('#clean-client-type');
  const locationField = q('#clean-location');
  const phone = q('#clean-phone');
  const note = q('#clean-note');
  const status = q('#clean-form-status');
  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const wa = '244948806673';
  const storageKey = 'hmatiasCleanQuoteCartV1';

  const copy = isEn ? {
    eyebrow: 'QUOTE REQUEST',
    title: 'Items selected for quotation',
    empty: 'No item has been added yet. Choose a product above or use the quotation form for a single item.',
    format: 'Format / reference',
    quantity: 'Quantity',
    formatPlaceholder: 'e.g. professional pack, catalogue code',
    remove: 'Remove item',
    clear: 'Clear request',
    helper: 'Add all required products before completing your contact details.',
    selected: 'selected item(s)',
    add: 'Add to quote request →',
    added: 'Added to request',
    summary: 'Your quotation request contains',
    submit: 'Prepare quotation request →',
    status: 'Request prepared. WhatsApp will open for review and final sending.',
    requestOrder: 'Order request — subject to commercial confirmation',
    messageTitle: 'HMATIAS CLEAN — QUOTATION REQUEST',
    name: 'Name / Entity',
    client: 'Client type',
    request: 'Request',
    location: 'Location',
    phone: 'Phone / WhatsApp',
    items: 'ITEMS',
    formatLine: 'Format / reference',
    quantityLine: 'Quantity',
    note: 'Additional information',
    singleProduct: 'Product',
    notProvided: 'Not provided'
  } : {
    eyebrow: 'PEDIDO DE COTAÇÃO',
    title: 'Itens selecionados para cotação',
    empty: 'Ainda não foi adicionado nenhum item. Escolha um produto acima ou utilize o formulário para um único item.',
    format: 'Formato / referência',
    quantity: 'Quantidade',
    formatPlaceholder: 'Ex.: formato profissional, código do catálogo',
    remove: 'Remover item',
    clear: 'Limpar pedido',
    helper: 'Adicione todos os produtos pretendidos antes de preencher os seus dados de contacto.',
    selected: 'item(ns) selecionado(s)',
    add: 'Adicionar ao pedido →',
    added: 'Adicionado ao pedido',
    summary: 'O pedido de cotação contém',
    submit: 'Preparar pedido de cotação →',
    status: 'Pedido preparado. O WhatsApp será aberto para revisão e envio final.',
    requestOrder: 'Pedido de encomenda — sujeito a confirmação comercial',
    messageTitle: 'HMATIAS CLEAN — PEDIDO DE COTAÇÃO',
    name: 'Nome / Entidade',
    client: 'Tipo de cliente',
    request: 'Pedido',
    location: 'Localização',
    phone: 'Telefone / WhatsApp',
    items: 'ITENS',
    formatLine: 'Formato / referência',
    quantityLine: 'Quantidade',
    note: 'Informação adicional',
    singleProduct: 'Produto',
    notProvided: 'Não indicado'
  };

  if (!q('link[data-hmatias-clean-cart]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'clean-cart.css?v=20260913';
    link.dataset.hmatiasCleanCart = 'true';
    document.head.appendChild(link);
  }

  qa('[data-product-image]').forEach(img => {
    img.addEventListener('error', () => img.closest('.product-media,.clean-intro-image')?.classList.add('image-failed'));
  });

  const safeParse = value => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const readStoredCart = () => {
    try { return sessionStorage.getItem(storageKey) || '[]'; }
    catch { return '[]'; }
  };

  let cart = safeParse(readStoredCart())
    .filter(item => item && typeof item.name === 'string')
    .slice(0, 20)
    .map(item => ({
      id: String(item.id || `${Date.now()}-${Math.random()}`),
      name: String(item.name || '').slice(0, 180),
      format: String(item.format || '').slice(0, 120),
      quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1)
    }));

  const save = () => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(cart)); } catch {}
  };

  const productsSection = q('.commerce-products');
  const pdfSection = q('.clean-pdf-section');
  const cartSection = document.createElement('section');
  cartSection.className = 'clean-cart-section';
  cartSection.id = isEn ? 'quote-cart' : 'pedido-cotacao';
  cartSection.innerHTML = `
    <div class="container">
      <div class="clean-cart-card">
        <div class="clean-cart-head">
          <div><span class="eyebrow blue">${copy.eyebrow}</span><h3>${copy.title}</h3></div>
          <span class="clean-cart-count" id="cleanCartCount" aria-live="polite">0</span>
        </div>
        <div class="clean-cart-list" id="cleanCartList"></div>
        <p class="clean-cart-empty" id="cleanCartEmpty">${copy.empty}</p>
        <div class="clean-cart-actions" id="cleanCartActions" hidden><p>${copy.helper}</p><button class="clean-cart-clear" id="cleanCartClear" type="button">${copy.clear}</button></div>
      </div>
    </div>`;

  if (productsSection?.parentNode) {
    productsSection.parentNode.insertBefore(cartSection, pdfSection || productsSection.nextSibling);
  }

  const cartList = q('#cleanCartList');
  const cartEmpty = q('#cleanCartEmpty');
  const cartCount = q('#cleanCartCount');
  const cartActions = q('#cleanCartActions');
  const cartClear = q('#cleanCartClear');

  const singleProductLabel = product?.closest('label');
  const singleQtyLabel = qty?.closest('label');
  singleProductLabel?.setAttribute('data-single-item-field', 'true');
  singleQtyLabel?.setAttribute('data-single-item-field', 'true');

  const summary = document.createElement('div');
  summary.className = 'clean-cart-summary';
  summary.hidden = true;
  const firstField = form.querySelector('label');
  if (firstField) form.insertBefore(summary, firstField);

  if (request) {
    const orderOption = [...request.options].find(option => /comprar|buy/i.test(option.textContent || ''));
    if (orderOption) orderOption.textContent = copy.requestOrder;
  }

  const defaultFormatFor = productName => {
    if (/123\s+pine\s+gel/i.test(productName)) return '500 ml';
    return '';
  };

  const render = () => {
    cartList.innerHTML = '';
    cartCount.textContent = String(cart.length);
    cartEmpty.hidden = cart.length > 0;
    cartActions.hidden = cart.length === 0;
    form.classList.toggle('cart-active', cart.length > 0);
    summary.hidden = cart.length === 0;

    if (product) product.required = cart.length === 0;
    if (qty) qty.required = cart.length === 0;

    if (cart.length) {
      summary.innerHTML = `<strong>${copy.summary} ${cart.length} ${copy.selected}.</strong> ${copy.helper}`;
    } else {
      summary.textContent = '';
    }

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'clean-cart-item';
      row.dataset.cartId = item.id;

      const main = document.createElement('div');
      main.className = 'clean-cart-item-main';
      const title = document.createElement('strong');
      title.textContent = item.name;
      const helper = document.createElement('small');
      helper.textContent = isEn ? 'Quotation item' : 'Item para cotação';
      main.append(title, helper);

      const formatLabel = document.createElement('label');
      formatLabel.textContent = copy.format;
      const formatInput = document.createElement('input');
      formatInput.type = 'text';
      formatInput.maxLength = 120;
      formatInput.placeholder = copy.formatPlaceholder;
      formatInput.value = item.format;
      formatInput.addEventListener('input', () => {
        item.format = formatInput.value.slice(0, 120);
        save();
      });
      formatLabel.appendChild(formatInput);

      const qtyLabel = document.createElement('label');
      qtyLabel.textContent = copy.quantity;
      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.step = '1';
      qtyInput.value = String(item.quantity);
      qtyInput.addEventListener('input', () => {
        item.quantity = Math.max(1, Number.parseInt(qtyInput.value, 10) || 1);
        save();
      });
      qtyLabel.appendChild(qtyInput);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'clean-cart-remove';
      remove.textContent = '×';
      remove.title = copy.remove;
      remove.setAttribute('aria-label', copy.remove);
      remove.addEventListener('click', () => {
        cart = cart.filter(entry => entry.id !== item.id);
        save();
        render();
      });

      row.append(main, formatLabel, qtyLabel, remove);
      cartList.appendChild(row);
    });
  };

  const addToCart = value => {
    const productName = String(value || '').trim();
    if (!productName) return;
    const existing = cart.find(item => item.name === productName && item.format === defaultFormatFor(productName));
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: productName,
        format: defaultFormatFor(productName),
        quantity: 1
      });
    }
    save();
    render();
    cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  qa('[data-clean-product]').forEach(button => {
    button.textContent = copy.add;
    button.setAttribute('aria-label', `${copy.add.replace(/\s*→$/, '')}: ${button.dataset.cleanProduct || ''}`);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-clean-product]');
    if (!button) return;
    event.preventDefault();
    addToCart(button.dataset.cleanProduct || '');
    const previous = button.textContent;
    button.textContent = copy.added;
    setTimeout(() => { button.textContent = previous; }, 1200);
  });

  cartClear?.addEventListener('click', () => {
    cart = [];
    save();
    render();
  });

  render();

  form.querySelector('button[type="submit"]')?.replaceChildren(document.createTextNode(copy.submit));

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
    const lines = [
      copy.messageTitle,
      '',
      `${copy.name}: ${clean(name?.value)}`,
      `${copy.client}: ${clean(client?.value)}`,
      `${copy.request}: ${clean(request?.value)}`,
      `${copy.location}: ${clean(locationField?.value)}`,
      `${copy.phone}: ${clean(phone?.value)}`,
      ''
    ];

    if (cart.length) {
      lines.push(copy.items);
      cart.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.name}`);
        lines.push(`   ${copy.formatLine}: ${clean(item.format) || copy.notProvided}`);
        lines.push(`   ${copy.quantityLine}: ${Math.max(1, Number.parseInt(item.quantity, 10) || 1)}`);
      });
    } else {
      lines.push(`${copy.singleProduct}: ${clean(product?.value)}`);
      lines.push(`${copy.quantityLine}: ${clean(qty?.value)}`);
    }

    const extra = clean(note?.value);
    if (extra) {
      lines.push('', `${copy.note}: ${extra}`);
    }

    lines.push('', isEn
      ? 'Price, availability, lead time and delivery conditions are subject to HMATIAS commercial confirmation.'
      : 'Preço, disponibilidade, prazo e condições de entrega ficam sujeitos a confirmação comercial da HMATIAS.');

    if (status) status.textContent = copy.status;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  });
})();
