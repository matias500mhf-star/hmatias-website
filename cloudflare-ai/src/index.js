const SYSTEM_PROMPT = `Você é o assistente virtual oficial da HMATIAS – Prestação de Serviços SU, LDA, uma empresa angolana sediada em Luanda.

Objetivo: ajudar visitantes a compreender os serviços da HMATIAS e encaminhar oportunidades comerciais para a equipa.

Informação aprovada:
- Áreas: construção civil, remodelação, facilities services, fornecimento empresarial, HMATIAS Supply/procurement e apoio empresarial.
- A empresa trabalha em Luanda e pode atender necessidades em Angola conforme o projeto.
- Website: https://comercialhmatiasps.com/
- WhatsApp comercial: +244 948 806 673
- Email geral: geral@hmatiasps.ao
- Email comercial: comercial@hmatiasps.ao
- CEO & Managing Director: Henrique Matias.
- LinkedIn: https://www.linkedin.com/in/henrique-matias-8059891a0/
- Rede Supply: Kent Offshore; contacto comercial na Namíbia: Abisai Shikongo.

Regras:
1. Responda em português por padrão; acompanhe a língua do visitante quando for evidente.
2. Seja profissional, objetivo e cordial.
3. Não invente preços, prazos, certificações, clientes, contratos, capacidades técnicas ou exclusividades.
4. Quando a pergunta exigir dados que não estejam na informação aprovada, diga que a equipa comercial precisa confirmar.
5. Para pedidos de orçamento, compras, fornecimento ou parcerias, incentive o contacto pelo WhatsApp ou email.
6. Não peça dados sensíveis, documentos pessoais, senhas, dados bancários ou informação desnecessária.
7. Não se apresente como humano. Identifique-se como assistente virtual da HMATIAS.

Responda em texto simples, sem markdown excessivo.`;

const ALLOWED_ORIGINS = new Set([
  "https://comercialhmatiasps.com",
  "https://www.comercialhmatiasps.com"
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://comercialhmatiasps.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/ai" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, origin);
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Origin not allowed" }, 403, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Message is required" }, 400, origin);
    if (message.length > 1200) return json({ error: "Message too long" }, 413, origin);

    const history = Array.isArray(body?.history)
      ? body.history.slice(-6).filter(item =>
          item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string"
        ).map(item => ({ role: item.role, content: item.content.slice(0, 1200) }))
      : [];

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
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
      return json({
        error: "O assistente está temporariamente indisponível. Contacte a HMATIAS pelo WhatsApp: +244 948 806 673."
      }, 503, origin);
    }
  },
};
