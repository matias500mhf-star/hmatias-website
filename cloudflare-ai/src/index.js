const SYSTEM_PROMPT = `Você é o assistente virtual oficial da HMATIAS – Prestação de Serviços SU, LDA, uma empresa angolana sediada em Viana, Luanda.

Objetivo: ajudar visitantes a compreender os serviços, produtos e soluções da HMATIAS e encaminhar oportunidades comerciais para a equipa.

Informação aprovada:
- Áreas principais: construção civil, remodelação, facilities services, fornecimento empresarial, HMATIAS Supply/procurement, HMATIAS Clean e HMATIAS Business Services.
- O site está disponível em português e inglês. Responda na língua do visitante sempre que for evidente.
- HMATIAS Clean: comercialização e fornecimento de produtos de limpeza e higiene para uso doméstico e profissional.
- P3 Pine Gel: formato de 500 ml apresentado no site. O preço, stock e entrega são confirmados pela equipa antes da compra.
- Taurus Pine Gel T563P: formato 5 kg. Preço unitário de referência: 26.500 Kz. Para 4 ou mais unidades: 24.500 Kz por unidade. Stock, transporte e condições de entrega devem ser confirmados pela equipa antes da compra.
- Outras categorias HMATIAS Clean sob consulta: detergentes, desinfetantes, produtos para limpeza de pisos, consumíveis de higiene e packs de limpeza para empresas.
- HMATIAS Business Services: apoio administrativo e documental para profissionais e empresas.
- Administrativo & Documental: desde 5.000 Kz.
- CV profissional: desde 10.000 Kz.
- Organização documental: desde 10.000 Kz.
- Business Support / propostas comerciais: desde 15.000 Kz.
- Apresentações empresariais: desde 20.000 Kz.
- Apoio Administrativo PME: desde 75.000 Kz/mês, com escopo mensal definido.
- Agendamentos Consulares & Apoio Administrativo a Vistos: preço sob consulta. O serviço pode incluir checklist e organização documental, assistência administrativa em formulários, apoio no uso de plataformas oficiais, preparação do dossier e acompanhamento administrativo.
- A HMATIAS não vende vagas de agendamento, não garante disponibilidade de vagas, não garante aprovação de visto e não possui acesso privilegiado a consulados ou plataformas oficiais.
- Taxas consulares, VFS e outros encargos oficiais não estão incluídos, salvo indicação expressa na cotação.
- Os preços dos serviços administrativos dependem do volume, complexidade e prazo.
- Os serviços administrativos não incluem atos jurídicos, contabilísticos, representação legal ou outros atos profissionais legalmente reservados.
- HMATIAS Supply: sourcing, procurement e fornecimento nacional, regional e internacional. Marcas e fornecedores específicos são apresentados quando relevantes para cada pedido. A referência a terceiros não implica parceria, representação ou exclusividade salvo quando formalmente estabelecida.
- A empresa trabalha em Luanda e pode atender necessidades em Angola conforme o projeto.
- Morada: Viana, Bairro 1 de Maio, Casa n.º 31, Luanda – Angola.
- Website principal: https://comercialhmatiasps.com/
- Versão inglesa: https://comercialhmatiasps.com/en.html
- Catálogo Business Services: https://comercialhmatiasps.com/servicos-administrativos.html
- Catálogo Business Services em inglês: https://comercialhmatiasps.com/business-services.html
- WhatsApp comercial: +244 948 806 673
- Email geral: geral@hmatiasps.ao
- Email comercial: comercial@hmatiasps.ao
- CEO & Managing Director: Henrique Matias.
- LinkedIn: https://www.linkedin.com/in/henrique-matias-8059891a0/
- O site tem Política de Privacidade e Termos & Condições no rodapé.

Regras:
1. Responda em português por padrão, mas acompanhe a língua do visitante quando for evidente.
2. Seja profissional, objetivo e cordial.
3. Pode informar apenas os preços de referência aprovados acima. Não invente outros preços, stock, prazos, certificações, clientes, contratos, capacidades técnicas, parcerias ou exclusividades.
4. Para Agendamentos Consulares & Apoio a Vistos, diga que o preço é sob consulta e nunca prometa vaga ou aprovação.
5. Quando a pergunta exigir dados que não estejam na informação aprovada, diga que a equipa comercial precisa confirmar.
6. Para pedidos de orçamento, compras, stock, entrega, fornecimento ou serviços administrativos, incentive o contacto pelo WhatsApp ou email.
7. Não peça dados sensíveis, documentos pessoais, senhas, dados bancários ou informação desnecessária.
8. Não se apresente como humano. Identifique-se como assistente virtual da HMATIAS.
9. Diferencie HMATIAS Clean de Facilities Services: HMATIAS Clean vende/fornece produtos; Facilities Services presta serviços de manutenção, limpeza e apoio operacional.
10. Diferencie P3 Pine Gel 500 ml de Taurus Pine Gel T563P 5 kg; não trate a imagem ou preço de um como se fosse do outro.

Responda em texto simples, sem markdown excessivo.`;

const ALLOWED_ORIGINS = new Set([
  "https://comercialhmatiasps.com",
  "https://www.comercialhmatiasps.com"
]);

const CONTACT_MAX_BODY_BYTES = 32 * 1024;
const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_SERVICES = new Set([
  "administrative_correspondence",
  "professional_cv",
  "document_management",
  "business_proposal",
  "business_presentation",
  "sme_admin_support",
  "visa_admin_support",
  "other"
]);

const SERVICE_LABELS = {
  administrative_correspondence: { pt: "Expediente Administrativo & Redação Institucional", en: "Administrative Correspondence & Institutional Drafting" },
  professional_cv: { pt: "Estruturação de CV Profissional", en: "Professional CV Structuring" },
  document_management: { pt: "Gestão & Organização Documental", en: "Document Management & Organisation" },
  business_proposal: { pt: "Propostas Comerciais & Business Support", en: "Commercial Proposals & Business Support" },
  business_presentation: { pt: "Apresentações Empresariais", en: "Business Presentations" },
  sme_admin_support: { pt: "Apoio Administrativo Recorrente para PME", en: "Recurring Administrative Support for SMEs" },
  visa_admin_support: { pt: "Apoio Administrativo a Processos de Visto & Agendamentos Consulares", en: "Administrative Support for Visa Processes & Consular Appointments" },
  other: { pt: "Outro serviço administrativo", en: "Other administrative service" }
};

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...extraHeaders
    }
  });
}

function cleanSingleLine(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanMultiline(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

function validContact(value) {
  if (!/^[0-9+\s().\/-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 20 && value.length <= 40;
}

async function readJsonBody(request, maxBytes) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { error: "payload_too_large" };
  }

  const raw = await request.arrayBuffer();
  if (raw.byteLength > maxBytes) return { error: "payload_too_large" };

  try {
    return { body: JSON.parse(new TextDecoder().decode(raw)) };
  } catch {
    return { error: "invalid_json" };
  }
}

function validateContactPayload(body) {
  const clientName = cleanSingleLine(body?.client_name);
  const contact = cleanSingleLine(body?.contact);
  const email = cleanSingleLine(body?.email).toLowerCase();
  const location = cleanSingleLine(body?.location);
  const serviceType = cleanSingleLine(body?.service_type);
  const details = cleanMultiline(body?.details);
  const website = cleanSingleLine(body?.website);
  const turnstileToken = cleanSingleLine(body?.turnstile_token);
  const language = body?.language === "en" ? "en" : "pt";
  const privacyConsent = body?.privacy_consent === true;

  const errors = [];
  if (clientName.length < 2 || clientName.length > 100) errors.push("client_name");
  if (!validContact(contact)) errors.push("contact");
  if (email && !validEmail(email)) errors.push("email");
  if (location.length > 80) errors.push("location");
  if (!CONTACT_SERVICES.has(serviceType)) errors.push("service_type");
  if (details.length < 10 || details.length > 1000) errors.push("details");
  if (!privacyConsent) errors.push("privacy_consent");
  if (!turnstileToken || turnstileToken.length > 2048) errors.push("turnstile_token");

  return {
    errors,
    honeypotTriggered: Boolean(website),
    data: {
      clientName,
      contact,
      email: email || null,
      location: location || null,
      serviceType,
      details,
      language,
      privacyConsent
    },
    turnstileToken
  };
}

async function verifyTurnstile(token, request, env) {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  form.append("idempotency_key", crypto.randomUUID());
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.append("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form
  });

  if (!response.ok) throw new Error(`Turnstile Siteverify HTTP ${response.status}`);
  const result = await response.json();
  return Boolean(result?.success);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function enforceContactRateLimit(request, env, nowMs) {
  const remoteIp = request.headers.get("CF-Connecting-IP") || "unknown";
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const ipHash = await sha256Hex(`${env.RATE_LIMIT_SALT}:${remoteIp}:${userAgent.slice(0, 160)}`);
  const windowStart = Math.floor(nowMs / CONTACT_RATE_WINDOW_MS) * CONTACT_RATE_WINDOW_MS;
  const updatedAt = new Date(nowMs).toISOString();

  await env.LEADS_DB.prepare(`
    INSERT INTO lead_rate_limits (ip_hash, window_start, request_count, updated_at)
    VALUES (?1, ?2, 1, ?3)
    ON CONFLICT (ip_hash, window_start)
    DO UPDATE SET request_count = request_count + 1, updated_at = excluded.updated_at
  `).bind(ipHash, windowStart, updatedAt).run();

  const row = await env.LEADS_DB.prepare(`
    SELECT request_count
    FROM lead_rate_limits
    WHERE ip_hash = ?1 AND window_start = ?2
    LIMIT 1
  `).bind(ipHash, windowStart).first();

  const count = Number(row?.request_count || 0);
  return {
    allowed: count <= CONTACT_RATE_LIMIT,
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart + CONTACT_RATE_WINDOW_MS - nowMs) / 1000))
  };
}

function randomReferenceSuffix(length = 8) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
}

function createReferenceCode(now) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `HBS-${y}${m}${d}-${randomReferenceSuffix(8)}`;
}

async function persistLead(env, data, now) {
  const id = crypto.randomUUID();
  const referenceCode = createReferenceCode(now);
  const createdAt = now.toISOString();
  const confirmationStatus = data.email ? "pending" : "not_applicable";

  await env.LEADS_DB.prepare(`
    INSERT INTO leads (
      id, reference_code, client_name, contact, email, location,
      service_type, details, status, source, language,
      privacy_consent, notification_status, confirmation_status, created_at
    ) VALUES (
      ?1, ?2, ?3, ?4, ?5, ?6,
      ?7, ?8, 'new', 'website_business_services', ?9,
      1, 'pending', ?10, ?11
    )
  `).bind(
    id,
    referenceCode,
    data.clientName,
    data.contact,
    data.email,
    data.location,
    data.serviceType,
    data.details,
    data.language,
    confirmationStatus,
    createdAt
  ).run();

  return { id, referenceCode, createdAt };
}

async function sendResendEmail(env, payload, idempotencyKey) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "HMATIAS-Lead-Worker/1.0",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = (await response.text()).slice(0, 500);
    throw new Error(`Resend HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

function serviceLabel(serviceType, language) {
  return SERVICE_LABELS[serviceType]?.[language] || SERVICE_LABELS[serviceType]?.pt || serviceType;
}

async function notifyLead(env, lead, data) {
  const internalText = [
    "Novo lead HMATIAS Business Services",
    "",
    `Referência: ${lead.referenceCode}`,
    `Nome / Entidade: ${data.clientName}`,
    `Telefone / WhatsApp: ${data.contact}`,
    `E-mail: ${data.email || "Não indicado"}`,
    `Localização: ${data.location || "Não indicada"}`,
    `Serviço: ${serviceLabel(data.serviceType, "pt")}`,
    `Recebido em: ${lead.createdAt}`,
    "",
    "Pedido:",
    data.details
  ].join("\n");

  const internalPromise = sendResendEmail(env, {
    from: env.RESEND_FROM,
    to: [env.LEAD_NOTIFICATION_TO || "comercial@hmatiasps.ao"],
    subject: `Novo Lead HMATIAS Business Services — ${lead.referenceCode}`,
    text: internalText
  }, `internal-${lead.id}`);

  const clientPromise = data.email
    ? sendResendEmail(env, {
        from: env.RESEND_FROM,
        to: [data.email],
        subject: data.language === "en"
          ? `HMATIAS request received — ${lead.referenceCode}`
          : `Pedido recebido pela HMATIAS — ${lead.referenceCode}`,
        text: data.language === "en"
          ? `Dear ${data.clientName},\n\nWe confirm receipt of your request to HMATIAS Business Services.\nReference: ${lead.referenceCode}\nService: ${serviceLabel(data.serviceType, "en")}\n\nOur team will review the scope and contact you through the details provided. No appointment, visa approval or other outcome is guaranteed by this confirmation.\n\nHMATIAS Business Services\ncomercial@hmatiasps.ao\n+244 948 806 673`
          : `Exmo.(a) ${data.clientName},\n\nConfirmamos a receção do seu pedido dirigido à HMATIAS Business Services.\nReferência: ${lead.referenceCode}\nServiço: ${serviceLabel(data.serviceType, "pt")}\n\nA nossa equipa irá avaliar o escopo e contactá-lo através dos dados fornecidos. Esta confirmação não representa garantia de agendamento, concessão de visto ou qualquer outro resultado.\n\nHMATIAS Business Services\ncomercial@hmatiasps.ao\n+244 948 806 673`
      }, `client-${lead.id}`)
    : Promise.resolve(null);

  const [internalResult, clientResult] = await Promise.allSettled([internalPromise, clientPromise]);
  const notificationStatus = internalResult.status === "fulfilled" ? "sent" : "failed";
  const confirmationStatus = data.email
    ? (clientResult.status === "fulfilled" ? "sent" : "failed")
    : "not_applicable";

  if (internalResult.status === "rejected") console.error("HMATIAS lead internal notification error", internalResult.reason);
  if (clientResult.status === "rejected") console.error("HMATIAS lead client confirmation error", clientResult.reason);

  try {
    await env.LEADS_DB.prepare(`
      UPDATE leads
      SET notification_status = ?1, confirmation_status = ?2
      WHERE id = ?3
    `).bind(notificationStatus, confirmationStatus, lead.id).run();
  } catch (error) {
    console.error("HMATIAS lead status update error", error);
  }

  return { notificationStatus, confirmationStatus };
}

function contactConfigReady(env) {
  return Boolean(
    env.LEADS_DB &&
    env.TURNSTILE_SECRET_KEY &&
    env.RATE_LIMIT_SALT &&
    env.RESEND_API_KEY &&
    env.RESEND_FROM
  );
}

async function handleContact(request, env, origin) {
  if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (!contactConfigReady(env)) {
    console.error("HMATIAS contact API is not fully configured");
    return json({ error: "Contact service unavailable" }, 503, origin);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "Content-Type must be application/json" }, 415, origin);
  }

  let parsed;
  try {
    parsed = await readJsonBody(request, CONTACT_MAX_BODY_BYTES);
  } catch (error) {
    console.error("HMATIAS contact body read error", error);
    return json({ error: "Invalid request body" }, 400, origin);
  }

  if (parsed.error === "payload_too_large") return json({ error: "Payload too large" }, 413, origin);
  if (parsed.error === "invalid_json") return json({ error: "Invalid JSON" }, 400, origin);

  const validated = validateContactPayload(parsed.body);
  if (validated.honeypotTriggered) return json({ error: "Request rejected" }, 403, origin);
  if (validated.errors.length) {
    return json({ error: "Invalid fields", fields: validated.errors }, 400, origin);
  }

  let turnstileValid;
  try {
    turnstileValid = await verifyTurnstile(validated.turnstileToken, request, env);
  } catch (error) {
    console.error("HMATIAS Turnstile verification error", error);
    return json({ error: "Verification service unavailable" }, 503, origin);
  }
  if (!turnstileValid) return json({ error: "Verification failed" }, 403, origin);

  const nowMs = Date.now();
  try {
    const limit = await enforceContactRateLimit(request, env, nowMs);
    if (!limit.allowed) {
      return json(
        { error: "Too many requests" },
        429,
        origin,
        { "Retry-After": String(limit.retryAfterSeconds) }
      );
    }
  } catch (error) {
    console.error("HMATIAS contact rate-limit error", error);
    return json({ error: "Contact service unavailable" }, 503, origin);
  }

  let lead;
  try {
    lead = await persistLead(env, validated.data, new Date(nowMs));
  } catch (error) {
    console.error("HMATIAS lead persistence error", error);
    return json({ error: "Unable to register request" }, 503, origin);
  }

  await notifyLead(env, lead, validated.data);

  return json({
    success: true,
    referenceCode: lead.referenceCode,
    message: validated.data.language === "en"
      ? "Request received successfully."
      : "Pedido recebido com sucesso."
  }, 201, origin);
}

async function handleAi(request, env, origin) {
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
        { role: "user", content: message }
      ],
      max_tokens: 450,
      temperature: 0.2
    });

    const answer = result?.response?.trim();
    if (!answer) return json({ error: "Empty AI response" }, 502, origin);
    return json({ answer }, 200, origin);
  } catch (error) {
    console.error("HMATIAS AI error", error);
    return json({ error: "O assistente está temporariamente indisponível. Contacte a HMATIAS pelo WhatsApp: +244 948 806 673." }, 503, origin);
  }
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

    if (url.pathname === "/api/ai" && request.method === "POST") {
      return handleAi(request, env, origin);
    }

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env, origin);
    }

    return json({ error: "Not found" }, 404, origin);
  }
};
