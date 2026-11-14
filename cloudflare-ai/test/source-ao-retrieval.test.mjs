import test from "node:test";
import assert from "node:assert/strict";
import assistant from "../src/index.js";

function makeRequest(message, extra = {}) {
  return new Request("https://hmatias-ai-assistant.workers.dev/api/ai", {
    method: "POST",
    headers: {
      "Origin": "https://comercialhmatiasps.com",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message, ...extra })
  });
}

function makeEnv(capture, overrides = {}) {
  return {
    AI: {
      async run(model, options) {
        capture.model = model;
        capture.messages = options.messages;
        return { response: "Resposta de teste." };
      }
    },
    ...overrides
  };
}

test("SOURCE AO retrieval calls only the configured staging public-search route", async t => {
  const originalFetch = globalThis.fetch;
  const capture = {};
  let requestedUrl;
  globalThis.fetch = async (url, options) => {
    requestedUrl = new URL(url);
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "error");
    return new Response(JSON.stringify({
      ok: true,
      results: [{
        type: "item",
        id: "diamond-disc-115",
        name: "Disco diamantado 115 mm",
        category: "diamond-tools",
        specification: "115 mm",
        unit: "un",
        status: "source_checked",
        verified_at: "2026-11-14T10:00:00.000Z",
        supplier_name: "PRIVATE SUPPLIER MUST NOT PASS",
        supplier_contact: "+244000000000",
        purchase_price: 123,
        stock_quantity: 999
      }]
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await assistant.fetch(
    makeRequest("Preciso de discos diamantados 115 mm para Luanda."),
    makeEnv(capture, {
      SOURCE_AO_PUBLIC_API_BASE: "https://source-ao-api-staging.account.workers.dev"
    })
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.answer, "Resposta de teste.");
  assert.equal(requestedUrl.hostname, "source-ao-api-staging.account.workers.dev");
  assert.equal(requestedUrl.pathname, "/api/search");
  assert.equal(requestedUrl.searchParams.get("q"), "discos diamantados 115mm");
  assert.equal(requestedUrl.searchParams.get("location"), "Luanda");

  const prompt = capture.messages.map(item => item.content).join("\n");
  assert.match(prompt, /quatro áreas oficiais/i);
  assert.match(prompt, /Disco diamantado 115 mm/);
  assert.match(prompt, /source_checked/);
  assert.doesNotMatch(prompt, /PRIVATE SUPPLIER MUST NOT PASS/);
  assert.doesNotMatch(prompt, /123/);
  assert.doesNotMatch(prompt, /stock_quantity/);
});

test("non-procurement questions do not call SOURCE AO", async t => {
  const originalFetch = globalThis.fetch;
  const capture = {};
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; throw new Error("unexpected fetch"); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await assistant.fetch(
    makeRequest("Quais são as áreas de atuação da HMATIAS?"),
    makeEnv(capture, {
      SOURCE_AO_PUBLIC_API_BASE: "https://source-ao-api-staging.account.workers.dev"
    })
  );

  assert.equal(response.status, 200);
  assert.equal(fetchCalled, false);
});

test("production or non-staging API host is rejected without a request", async t => {
  const originalFetch = globalThis.fetch;
  const capture = {};
  let fetchCalled = false;
  globalThis.fetch = async () => { fetchCalled = true; throw new Error("unexpected fetch"); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await assistant.fetch(
    makeRequest("Procuro brocas diamantadas 20 mm."),
    makeEnv(capture, {
      SOURCE_AO_PUBLIC_API_BASE: "https://source-ao-api.account.workers.dev"
    })
  );

  assert.equal(response.status, 200);
  assert.equal(fetchCalled, false);
  const prompt = capture.messages.map(item => item.content).join("\n");
  assert.match(prompt, /not_configured/);
});

test("a SOURCE AO outage does not break the chat response", async t => {
  const originalFetch = globalThis.fetch;
  const capture = {};
  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await assistant.fetch(
    makeRequest("Procuro disco diamantado 115 mm."),
    makeEnv(capture, {
      SOURCE_AO_PUBLIC_API_BASE: "https://source-ao-api-staging.account.workers.dev"
    })
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).answer, "Resposta de teste.");
  const prompt = capture.messages.map(item => item.content).join("\n");
  assert.match(prompt, /temporarily_unavailable/);
});

test("assistant prompt defines exactly four HMATIAS operating areas", async () => {
  const capture = {};
  const response = await assistant.fetch(
    makeRequest("Que serviços prestam?"),
    makeEnv(capture)
  );
  assert.equal(response.status, 200);
  const systemPrompt = capture.messages[0].content;
  assert.match(systemPrompt, /1\. Construção e Remodelação/);
  assert.match(systemPrompt, /2\. Facilities e Manutenção/);
  assert.match(systemPrompt, /3\. Supply e Procurement/);
  assert.match(systemPrompt, /4\. Business Services/);
  assert.match(systemPrompt, /HMATIAS Clean integra esta área/);
  assert.match(systemPrompt, /KARTA WALLET é um projeto digital autónomo/);
});
