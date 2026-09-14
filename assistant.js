/* HMATIAS Virtual Assistant — central knowledge + page context + AI API. */
(() => {
  'use strict';

  const API_URLS = ['https://api.comercialhmatiasps.com/api/ai', '/api/ai'];
  const WA = 'https://wa.me/244948806673';
  const KNOWLEDGE_SRC = 'assistant-knowledge.js?v=20260914-1';
  const pageEnglish = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  window.HMATIAS_ASSISTANT_VERSION = '2026-09-14-kb1';

  const loadKnowledge = () => new Promise(resolve => {
    if (window.HMATIAS_KNOWLEDGE) return resolve(window.HMATIAS_KNOWLEDGE);
    let script = document.querySelector('script[data-hmatias-knowledge]');
    if (!script) {
      script = document.createElement('script');
      script.src = KNOWLEDGE_SRC;
      script.defer = true;
      script.dataset.hmatiasKnowledge = 'true';
      document.head.appendChild(script);
    }
    const done = () => resolve(window.HMATIAS_KNOWLEDGE || null);
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', done, { once: true });
    setTimeout(done, 3500);
  });

  const addMessage = (box, text, kind) => {
    const el = document.createElement('div');
    el.className = `hmatias-assistant-msg ${kind}`;
    el.textContent = text;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  };

  const prefersEnglish = raw => pageEnglish || /\b(hello|hi|price|service|visa|appointment|cleaning|construction|facilities|supply|contact|document|quote|business|product|stock|catalogue|catalog)\b/i.test(raw);
  const kb = () => window.HMATIAS_KNOWLEDGE || null;

  const catalogueMatch = raw => {
    const data = kb();
    if (!data?.clean?.cleanCatalog) return null;
    const m = raw.toLowerCase();
    return data.clean.cleanCatalog.find(([code, name]) => m.includes(code.toLowerCase()) || m.includes(name.toLowerCase())) || null;
  };

  const currentPageContext = () => {
    const main = document.querySelector('main');
    const page = (main?.innerText || document.body.innerText || '').replace(/\s+/g, ' ').trim();
    const official = kb()?.toAssistantContext?.() || 'Official HMATIAS knowledge base unavailable; use only PAGE content and do not invent missing facts.';
    return [
      'OFFICIAL_HMATIAS_KNOWLEDGE:', official,
      `CURRENT_URL: ${location.href}`,
      `CURRENT_TITLE: ${document.title}`,
      `CURRENT_PAGE: ${page.slice(0, 18000)}`
    ].join('\n');
  };

  function authoritativeAnswer(raw) {
    const data = kb();
    if (!data) return null;
    const m = raw.toLowerCase();
    const en = prefersEnglish(raw);
    const item = catalogueMatch(raw);

    if (/t563p|taurus\s*pine|pine\s*gel/.test(m) && !/123\s*pine/.test(m)) {
      return en
        ? 'Taurus Pine Gel T563P is a multipurpose germicidal cleaning gel. It is green, pine-scented, pH 7, completely soluble and biodegradable. HMATIAS formats/prices: 500 g on request; 1 kg 8,500 Kz; 5 kg 26,500 Kz; 20 kg 94,000 Kz. It is supplied on order; stock, lead time and delivery are confirmed before purchase. Reference uses include bathroom ceramics, toilets, basins, sinks, floors, carpets and upholstery. The manufacturer does not advise use on food-contact surfaces.'
        : 'O Taurus Pine Gel T563P é um gel multiuso com ação germicida. É verde, com odor a pinho, pH 7, completamente solúvel e biodegradável. Formatos/preços HMATIAS: 500 g sob consulta; 1 kg 8.500 Kz; 5 kg 26.500 Kz; 20 kg 94.000 Kz. É fornecido sob encomenda; stock, prazo e entrega são confirmados antes da compra. Aplicações de referência: cerâmica de banho, sanitas, lavatórios, pias, pisos, carpetes e estofos. O fabricante não aconselha utilização em superfícies em contacto com alimentos.';
    }

    if (/123\s*pine|pine.*500\s*ml|500\s*ml.*pine/.test(m)) {
      return en
        ? '123 Pine Gel 500 ml is a featured HMATIAS Clean multipurpose cleaning product for domestic and professional use. It is supplied on order; price, current stock, lead time and delivery are on request.'
        : 'O 123 Pine Gel 500 ml é um produto de limpeza multiusos em destaque da HMATIAS Clean, para utilização doméstica e profissional. É fornecido sob encomenda; preço, stock atual, prazo e entrega são sob consulta.';
    }

    if (item) {
      const [code, name, category] = item;
      return en
        ? `${name} (${code}) is listed in the HMATIAS Clean professional catalogue under ${category}. HMATIAS does not publish a confirmed price, format or live stock for this item on the website. Please request commercial confirmation for price, format, stock, lead time and delivery.`
        : `${name} (${code}) consta do catálogo profissional HMATIAS Clean, na categoria ${category}. O site não publica preço confirmado, formato ou stock em tempo real para este item. Solicite confirmação comercial de preço, formato, stock, prazo e entrega.`;
    }

    if (/pre[çc]o|quanto custa|valor|price|cost/.test(m) && /(cv|curr[ií]culo|expediente|reda[çc][aã]o|documental|business support|apresenta[çc]|pme|administrativ)/.test(m)) {
      const lines = data.businessServices.pricesPt.map(([name, price]) => `${name}: ${price}`).join('; ');
      return en
        ? 'Published HMATIAS Business Services base prices are: Administrative & Institutional Drafting from 5,000 Kz; Professional CV from 10,000 Kz; Document Management from 10,000 Kz; Commercial Proposals & Business Support from 15,000 Kz; Business Presentations from 20,000 Kz; Recurring SME Administrative Support from 75,000 Kz/month. Visa/consular administrative support is on request. Volume, complexity, urgency and timing may change the final quotation.'
        : `Valores-base publicados da HMATIAS Business Services: ${lines}. Volume, complexidade, urgência e prazo podem alterar o orçamento final.`;
    }

    if (/visto|consular|vfs|embaixad|visa|appointment slot/.test(m)) {
      return en
        ? 'HMATIAS provides administrative and document support for visa and consular processes. It does not sell appointment slots, does not guarantee appointment availability or visa approval, and has no privileged access to embassies, consulates, VFS Global or official platforms. Official fees are separate unless expressly included in a quotation.'
        : `A HMATIAS presta apoio administrativo e documental para processos de visto e assuntos consulares. ${data.businessServices.visaLimitsPt}`;
    }

    if (/agendamento|marcar|hor[aá]rio|booking|meeting/.test(m) && !/consular|visto|visa|vfs/.test(m)) {
      return en
        ? 'The website booking is a request for a HMATIAS appointment, in Luanda or remotely when applicable. It does not show real-time availability, does not automatically confirm a time and does not process online payment. The appointment is confirmed only after an explicit HMATIAS reply.'
        : `O agendamento do site é um pedido de atendimento HMATIAS. ${data.booking.summaryPt} Não apresenta disponibilidade em tempo real, não confirma automaticamente horário e não processa pagamento online.`;
    }

    if (/constru|obra|bet[aã]o|paviment|infraestrutura|construction|infrastructure|paving|concrete|remodel/.test(m)) {
      return en ? data.construction.summaryEn : `${data.construction.summaryPt} Capacidades: ${data.construction.capabilitiesPt.join(', ')}.`;
    }

    if (/facilities|manuten|maintenance|instala[çc]|limpeza empresarial|conserva[çc]/.test(m)) {
      return en ? data.facilities.summaryEn : `${data.facilities.summaryPt} Capacidades: ${data.facilities.capabilitiesPt.join(', ')}.`;
    }

    if (/supply|procurement|sourcing|fornecimento|equipamento|material|fornecedor|supplier/.test(m)) {
      return en ? data.supply.summaryEn : `${data.supply.summaryPt} ${data.supply.rulePt}`;
    }

    if (/hmatias clean|produto[s]? de limpeza|cleaning|detergent|detergente|desinfet|higiene|cat[aá]logo|catalogue|catalog/.test(m)) {
      return en ? data.clean.summaryEn : `${data.clean.summaryPt} Para qualquer item sem preço publicado, preço, formato, stock, prazo e entrega são confirmados pela equipa comercial.`;
    }

    if (/administrativ|documental|business services|business support|apoio empresarial|pm[e]?|carta|declara[çc]|proposta|presentation|apresenta[çc]/.test(m)) {
      return en
        ? 'HMATIAS Business Services provides administrative, document and business support for professionals and companies, in Luanda and remotely when applicable. Published services include institutional drafting, professional CVs, document organisation, commercial proposals/business support, business presentations and recurring SME administrative support.'
        : `${data.businessServices.summaryPt} Serviços publicados: ${data.businessServices.pricesPt.map(([name, price]) => `${name} (${price})`).join('; ')}.`;
    }

    if (/contact|telefone|whatsapp|email|e-mail|contacto/.test(m)) {
      const c = data.company;
      return en
        ? `Contact HMATIAS: phone/WhatsApp ${c.phone}; general email ${c.emailGeneral}; commercial email ${c.emailCommercial}.`
        : `Contactos HMATIAS: telefone/WhatsApp ${c.phone}; e-mail geral ${c.emailGeneral}; e-mail comercial ${c.emailCommercial}.`;
    }

    if (/onde|morada|endere[çc]o|localiza|where|address|location|nif|registo|matr[ií]cula/.test(m)) {
      const c = data.company;
      return en
        ? `HMATIAS is based at ${c.location}. Tax ID/NIF: ${c.nif}; Commercial Registration: ${c.commercialRegistration}; Registration No.: ${c.registrationNumber}.`
        : `A HMATIAS está sediada em ${c.location}. NIF: ${c.nif}; Registo Comercial: ${c.commercialRegistration}; Matrícula: ${c.registrationNumber}.`;
    }

    if (/pre[çc]o|valor|quanto custa|or[çc]amento|price|cost|quote/.test(m)) {
      return en
        ? 'HMATIAS publishes prices only for clearly defined approved items/services. If a price is not published, it is on request and must be commercially confirmed. Tell me the exact product or service you need.'
        : 'A HMATIAS publica preços apenas para itens/serviços claramente definidos. Quando o preço não está publicado, fica sob consulta e deve ser confirmado comercialmente. Indique o produto ou serviço exato que pretende.';
    }

    return null;
  }

  async function askAPI(message, history) {
    const payload = {
      message,
      history,
      pageContext: currentPageContext(),
      knowledgeVersion: kb()?.version || null,
      pageUrl: location.href,
      pageTitle: document.title
    };
    for (const url of API_URLS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        const answer = (data.answer || data.reply || data.response || '').trim();
        if (answer) return answer;
      } catch (_) {
        clearTimeout(timer);
      }
    }
    throw new Error('AI unavailable');
  }

  function fallbackAnswer(raw) {
    const en = prefersEnglish(raw);
    return en
      ? 'I can help with HMATIAS Construction & Infrastructure, Facilities, Supply, HMATIAS Clean products and catalogue, Business Services, appointments, contacts and quotation requests. If information such as price or stock is not officially published, I will tell you it requires commercial confirmation.'
      : 'Posso ajudar com Construção & Infraestrutura, Facilities, Supply, produtos e catálogo HMATIAS Clean, Business Services, agendamentos, contactos e pedidos de cotação. Se uma informação como preço ou stock não estiver oficialmente publicada, indicarei que precisa de confirmação comercial.';
  }

  function init() {
    if (document.querySelector('.hmatias-assistant')) return;
    const t = pageEnglish
      ? {label:'HMATIAS Assistant',sub:'Official services, products, prices and quotations.',close:'Close assistant',msg:'Message',placeholder:'What do you need?',send:'Send',toggle:'Assistant',hello:'Hello. I can guide you using the current official HMATIAS service, product and commercial information.',loading:'Preparing response…'}
      : {label:'Assistente HMATIAS',sub:'Serviços, produtos, preços e cotações oficiais.',close:'Fechar assistente',msg:'Mensagem',placeholder:'O que precisa?',send:'Enviar',toggle:'Assistente',hello:'Olá. Posso orientar com base nas informações oficiais atuais da HMATIAS sobre serviços, produtos, preços e cotações.',loading:'A preparar resposta…'};

    const root = document.createElement('aside');
    root.className = 'hmatias-assistant';
    root.setAttribute('aria-label', t.label);
    root.innerHTML = `<div class="hmatias-assistant-panel"><div class="hmatias-assistant-head"><div><strong>${t.label}</strong><small>${t.sub}</small></div><button class="hmatias-assistant-close" type="button" aria-label="${t.close}">×</button></div><div class="hmatias-assistant-messages" aria-live="polite"></div><div class="hmatias-assistant-links"><a href="${WA}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="mailto:comercial@hmatiasps.ao">E-mail</a></div><form class="hmatias-assistant-form"><input aria-label="${t.msg}" maxlength="1000" autocomplete="off" placeholder="${t.placeholder}"><button type="submit" aria-label="${t.send}">${t.send}</button></form></div><button class="hmatias-assistant-toggle" type="button" aria-expanded="false"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 2V11.5a8.5 8.5 0 0 1 17 0Z"/><path d="M7 9h9M7 13h6"/></svg><span>${t.toggle}</span></button>`;
    document.body.appendChild(root);

    const panel = root.querySelector('.hmatias-assistant-panel');
    const toggle = root.querySelector('.hmatias-assistant-toggle');
    const close = root.querySelector('.hmatias-assistant-close');
    const form = root.querySelector('.hmatias-assistant-form');
    const input = form.querySelector('input');
    const button = form.querySelector('button');
    const messages = root.querySelector('.hmatias-assistant-messages');
    const history = [];

    const setOpen = open => {
      root.classList.toggle('is-open', open);
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) input.focus();
    };

    panel.hidden = true;
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    addMessage(messages, t.hello, 'assistant');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;
      input.value = '';
      addMessage(messages, raw, 'user');
      history.push({role:'user', content:raw});
      button.disabled = true;
      input.disabled = true;
      const loading = addMessage(messages, t.loading, 'assistant');

      let answer = authoritativeAnswer(raw);
      if (!answer) {
        try {
          answer = await askAPI(raw, history.slice(-8));
        } catch (_) {
          answer = fallbackAnswer(raw);
        }
      }

      loading.textContent = answer;
      history.push({role:'assistant', content:answer});
      if (history.length > 12) history.splice(0, history.length - 12);
      button.disabled = false;
      input.disabled = false;
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    });
  }

  const boot = async () => {
    await loadKnowledge();
    init();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
