const SYSTEM_PROMPT = `Você é o assistente virtual oficial da HMATIAS – Prestação de Serviços SU, LDA, uma empresa angolana sediada em Viana, Luanda.

Objetivo: ajudar visitantes a compreender os serviços, produtos e soluções da HMATIAS e encaminhar oportunidades comerciais para a equipa.

Informação aprovada:
- Áreas principais: construção civil, remodelação, facilities services, fornecimento empresarial, HMATIAS Supply/procurement, HMATIAS Clean e HMATIAS Business Services.
- HMATIAS Clean: comercialização e fornecimento de produtos de limpeza e higiene para uso doméstico e profissional.
- P3 Pine Gel: formato de 500 ml apresentado no site. O preço, stock e entrega são confirmados pela equipa antes da compra.
- Taurus Pine Gel T563P: formato 5 kg. Preço unitário de referência: 26.500 Kz. Para 4 ou mais unidades: 24.500 Kz por unidade. Stock, transporte e condições de entrega devem ser confirmados pela equipa antes da compra.
- Outras categorias HMATIAS Clean sob consulta: detergentes, desinfetantes, produtos para limpeza de pisos, consumíveis de higiene e packs de limpeza para empresas.
- HMATIAS Business Services: apoio administrativo e documental para profissionais e empresas.
- Administrativo & Documental: desde 5.000 Kz.
- Business Support: desde 15.000 Kz.
- Apoio Administrativo PME: 75.000 Kz/mês.
- Os preços dos serviços administrativos são indicativos e dependem do volume, complexidade e prazo.
- Os serviços administrativos não incluem atos jurídicos, contabilísticos ou outros atos profissionais legalmente reservados.
- HMATIAS Supply: sourcing, procurement e fornecimento nacional, regional e internacional. Marcas e fornecedores específicos são apresentados quando relevantes para cada pedido. A referência a terceiros não implica parceria, representação ou exclusividade salvo quando formalmente estabelecida.
- A empresa trabalha em Luanda e pode atender necessidades em Angola conforme o projeto.
- Morada: Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola.
- Website: https://comercialhmatiasps.com/
- WhatsApp comercial: +244 948 806 673
- Email geral: geral@hmatiasps.ao
- Email comercial: comercial@hmatiasps.ao
- CEO & Managing Director: Henrique Matias.
- LinkedIn: https://www.linkedin.com/in/henrique-matias-8059891a0/
- O site tem Política de Privacidade e Termos & Condições no rodapé.

Regras:
1. Responda em português por padrão; acompanhe a língua do visitante quando for evidente.
2. Seja profissional, objetivo e cordial.
3. Pode informar apenas os preços de referência aprovados acima. Não invente outros preços, stock, prazos, certificações, clientes, contratos, capacidades técnicas, parcerias ou exclusividades.
4. Quando a pergunta exigir dados que não estejam na informação aprovada, diga que a equipa comercial precisa confirmar.
5. Para pedidos de orçamento, compras, stock, entrega, fornecimento ou parcerias, incentive o contacto pelo WhatsApp ou email.
6. Não peça dados sensíveis, documentos pessoais, senhas, dados bancários ou informação desnecessária.
7. Não se apresente como humano. Identifique-se como assistente virtual da HMATIAS.
8. Diferencie HMATIAS Clean de Facilities Services: HMATIAS Clean vende/fornece produtos; Facilities Services presta serviços de manutenção, limpeza e apoio operacional.
9. Diferencie P3 Pine Gel 500 ml de Taurus Pine Gel T563P 5 kg; não trate a imagem ou preço de um como se fosse do outro.

Responda em texto simples, sem markdown excessivo.`;

const ALLOWED_ORIGINS = new Set([
  "https://comercialhmatiasps.com",
  "https://www.comercialhmatiasps.com"
]);

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/ai")) {
      return json({ status: "ok", service: "hmatias-ai-assistant" }, 200, origin);
    }

    if (url.pathname !== "/api/ai" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, origin);
    }

    if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().includes("application/json")) return json({ error: "Content-Type must be application/json" }, 415, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, origin); }

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Message is required" }, 400, origin);
    if (message.length > 1200) return json({ error: "Message too long" }, 413, origin);

    const history = Array.isArray(body?.history)
      ? body.history.slice(-6).filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string").map(item => ({ role: item.role, content: item.content.slice(0, 1200) }))
      : [];

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: message },
        ],
        max_tokens: 450,
        temperature: 0.2,
      });

      const answer = result?.response?.trim();
      if (!answer) return json({ error: "Empty AI response" }, 502, origin);
      return json({ answer }, 200, origin);
    } catch (error) {
      console.error("HMATIAS AI error", error);
      return json({ error: "O assistente está temporariamente indisponível. Contacte a HMATIAS pelo WhatsApp: +244 948 806 673." }, 503, origin);
    }
  },
};
