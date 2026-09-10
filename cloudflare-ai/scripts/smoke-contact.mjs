const apiBase = (process.env.HMATIAS_API_BASE || '').replace(/\/$/, '');
const turnstileToken = process.env.HMATIAS_TURNSTILE_TOKEN || '';
const origin = process.env.HMATIAS_ORIGIN || 'https://comercialhmatiasps.com';

if (!apiBase) {
  console.error('Missing HMATIAS_API_BASE, e.g. https://api.comercialhmatiasps.com');
  process.exit(1);
}

if (!turnstileToken) {
  console.error('Missing HMATIAS_TURNSTILE_TOKEN. Obtain a fresh token from the configured Turnstile widget.');
  process.exit(1);
}

const payload = {
  client_name: 'HMATIAS E2E Test',
  contact: '+244948806673',
  email: '',
  location: 'Luanda',
  service_type: 'other',
  details: 'Teste controlado de integração do formulário Business Services. Não corresponde a um pedido comercial real.',
  privacy_consent: true,
  turnstile_token: turnstileToken,
  website: '',
  language: 'pt'
};

const response = await fetch(`${apiBase}/api/contact`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': origin
  },
  body: JSON.stringify(payload)
});

let body;
try {
  body = await response.json();
} catch {
  body = { error: 'Non-JSON response' };
}

console.log(JSON.stringify({ status: response.status, body }, null, 2));

if (response.status !== 201 || body?.success !== true || !body?.referenceCode) {
  console.error('Smoke test failed. No successful lead creation was confirmed.');
  process.exit(1);
}

console.log(`Smoke test passed. Reference: ${body.referenceCode}`);
