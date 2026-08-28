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
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
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

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ status: "ok", service: "hmatias-ai-assistant" }, 200, origin);
    }

    if (request.method === "GET" && url.pathname === "/api/ai") {
      return json({ status: "ok", service: "hmatias-ai-assistant", endpoint: "POST /api/ai" }, 200, origin);
    }

    if (url.pathname !== "/api/ai" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, origin);
    }

    if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return json({ error: "Content-Type must be application/json" }, 415, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    // The current website widget sends { message, history }.
    // Also accept { messages } so the Worker remains compatible with generic clients.
    let messages = [];
    if (Array.isArray(body?.messages)) {
      messages = body.messages;
    } else {
      const message = typeof body?.message === "string" ? body.message.trim() : "";
      const history = Array.isArray(body?.history) ? body.history : [];
      messages = [...history, ...(message ? [{ role: "user", content: message }] : [])];
    }

    messages = messages
      .slice(-8)
      .filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .map(item => ({ role: item.role, content: item.content.trim().slice(0, 1200) }))
      .filter(item => item.content);

    if (!messages.length) return json({ error: "Message is required" }, 400, origin);

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 450,
        temperature: 0.2,
      });

      const answer = result?.response?.trim();
      if (!answer) return json({ error: "Empty AI response" }, 502, origin);

      // Current website widget expects { answer }.
      return json({ answer, reply: answer }, 200, origin);
    } catch (error) {
      console.error("HMATIAS AI error", error);
      return json({
        error: "O assistente está temporariamente indisponível.",
        reply: "O assistente está temporariamente indisponível. Contacte a HMATIAS pelo WhatsApp: +244 948 806 673."
      }, 503, origin);
    }
  },
};
