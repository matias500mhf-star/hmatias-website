const enc = new TextEncoder();
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedJwks = null;
let cachedJwksUntil = 0;

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

async function loadJwks(fetchImpl = fetch, force = false) {
  if (!force && cachedJwks && cachedJwksUntil > Date.now()) return cachedJwks;
  const response = await fetchImpl(JWKS_URL, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('firebase_keys_unavailable');
  const data = await response.json();
  if (!Array.isArray(data.keys) || !data.keys.length) throw new Error('firebase_keys_invalid');
  cachedJwks = data;
  const header = response.headers.get('cache-control') || '';
  const match = header.match(/max-age=(\d+)/i);
  const maxAge = Math.min(Math.max(Number(match?.[1] || 3600), 60), 21600);
  cachedJwksUntil = Date.now() + maxAge * 1000;
  return cachedJwks;
}

export async function verifyFirebaseIdToken(idToken, env, options = {}) {
  if (typeof idToken !== 'string' || idToken.length > 8192) throw new Error('firebase_token_invalid');
  const parts = idToken.split('.');
  if (parts.length !== 3 || parts.some(part => !part)) throw new Error('firebase_token_invalid');

  let header, claims;
  try {
    header = decodeJsonPart(parts[0]);
    claims = decodeJsonPart(parts[1]);
  } catch {
    throw new Error('firebase_token_invalid');
  }
  if (header?.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('firebase_token_invalid');
  }

  const projectId = String(env?.FIREBASE_PROJECT_ID || '').trim();
  if (!projectId) throw new Error('firebase_project_not_configured');

  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
  if (
    claims?.aud !== projectId ||
    claims?.iss !== 'https://securetoken.google.com/' + projectId ||
    typeof claims?.sub !== 'string' ||
    claims.sub.length < 1 ||
    claims.sub.length > 128 ||
    !Number.isInteger(claims.exp) ||
    !Number.isInteger(claims.iat) ||
    !Number.isInteger(claims.auth_time) ||
    claims.exp <= nowSeconds - 30 ||
    claims.iat > nowSeconds + 60 ||
    claims.auth_time > nowSeconds + 60 ||
    claims.exp <= claims.iat ||
    claims.exp - claims.iat > 3900
  ) {
    throw new Error('firebase_token_invalid');
  }

  let keySet = options.jwks || null;
  if (!keySet) keySet = await loadJwks(options.fetchImpl || fetch);
  let jwk = keySet.keys.find(key => key.kid === header.kid && key.kty === 'RSA' && key.use === 'sig');
  if (!jwk && !options.jwks) {
    keySet = await loadJwks(options.fetchImpl || fetch, true);
    jwk = keySet.keys.find(key => key.kid === header.kid && key.kty === 'RSA' && key.use === 'sig');
  }
  if (!jwk) throw new Error('firebase_signing_key_not_found');

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signedContent = enc.encode(parts[0] + '.' + parts[1]);
  const valid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    decodeBase64Url(parts[2]),
    signedContent,
  );
  if (!valid) throw new Error('firebase_signature_invalid');

  return {
    uid: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : null,
    email_verified: claims.email_verified === true,
    display_name: typeof claims.name === 'string' ? claims.name.slice(0, 120) : null,
    auth_time: claims.auth_time,
  };
}

function responseHeaders(env) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': env.PUBLIC_ORIGIN || 'https://comercialhmatiasps.com',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  };
}

function json(env, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: responseHeaders(env) });
}

function fail(env, status, code, message) {
  return json(env, { ok: false, error: { code, message } }, status);
}

export async function getFirebasePrincipalFromRequest(request, env, { optional = false } = {}) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization) {
    return optional
      ? { claims: null, response: null }
      : { claims: null, response: fail(env, 401, 'authentication_required', 'Firebase sign-in is required.') };
  }
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return { claims: null, response: fail(env, 401, 'invalid_authentication', 'A valid Firebase ID token is required.') };
  try {
    const claims = await verifyFirebaseIdToken(match[1].trim(), env);
    return { claims, response: null };
  } catch (error) {
    const status = error?.message === 'firebase_project_not_configured' ? 503 : 401;
    const code = status === 503 ? 'authentication_not_configured' : 'invalid_firebase_token';
    const message = status === 503
      ? 'Firebase authentication is not configured on the API.'
      : 'The Firebase session is invalid or expired. Sign in again.';
    return { claims: null, response: fail(env, status, code, message) };
  }
}

export async function upsertFirebaseIdentity(env, claims) {
  if (!env?.SOURCE_AO_DB || !claims?.uid) throw new Error('firebase_identity_storage_unavailable');
  const now = new Date().toISOString();
  await env.SOURCE_AO_DB.prepare(
    "INSERT INTO firebase_identities(uid, role, email_verified, created_at, updated_at) VALUES(?, 'customer', ?, ?, ?) " +
    'ON CONFLICT(uid) DO UPDATE SET email_verified = excluded.email_verified, updated_at = excluded.updated_at'
  ).bind(claims.uid, claims.email_verified ? 1 : 0, now, now).run();

  const row = await env.SOURCE_AO_DB.prepare(
    'SELECT uid, role, email_verified, created_at, updated_at FROM firebase_identities WHERE uid = ?'
  ).bind(claims.uid).first();
  if (!row) throw new Error('firebase_identity_storage_unavailable');
  return {
    uid: row.uid,
    role: row.role,
    email: claims.email,
    display_name: claims.display_name,
    email_verified: Number(row.email_verified) === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function createFirebaseSession(request, env) {
  const principal = await getFirebasePrincipalFromRequest(request, env);
  if (principal.response) return principal.response;
  try {
    const identity = await upsertFirebaseIdentity(env, principal.claims);
    return json(env, { ok: true, identity });
  } catch {
    return fail(env, 503, 'identity_storage_unavailable', 'The account was authenticated but its SOURCE AO profile could not be saved.');
  }
}

export async function setFirebaseIdentityRole(request, env, uid) {
  if (!env?.SOURCE_AO_DB || !/^[-A-Za-z0-9:_]{1,128}$/.test(uid)) {
    return fail(env, 400, 'invalid_identity', 'The Firebase UID is invalid.');
  }
  let data;
  try {
    if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('json_required');
    data = await request.json();
  } catch {
    return fail(env, 400, 'invalid_json', 'A JSON role value is required.');
  }
  const role = String(data?.role || '').trim();
  if (!['customer', 'supplier', 'hm_operator'].includes(role)) {
    return fail(env, 400, 'invalid_role', 'Allowed roles are customer, supplier and hm_operator.');
  }

  const existing = await env.SOURCE_AO_DB.prepare(
    'SELECT uid, role FROM firebase_identities WHERE uid = ?'
  ).bind(uid).first();
  if (!existing) return fail(env, 404, 'identity_not_found', 'The Firebase identity has not yet registered a SOURCE AO session.');

  const now = new Date().toISOString();
  await env.SOURCE_AO_DB.batch([
    env.SOURCE_AO_DB.prepare(
      'UPDATE firebase_identities SET role = ?, updated_at = ? WHERE uid = ?'
    ).bind(role, now, uid),
    env.SOURCE_AO_DB.prepare(
      "INSERT INTO firebase_identity_role_changes(id, uid, previous_role, next_role, changed_by, created_at) VALUES(?, ?, ?, ?, 'ADMIN_API_TOKEN', ?)"
    ).bind('fir_' + crypto.randomUUID(), uid, existing.role, role, now),
  ]);
  return json(env, { ok: true, identity: { uid, role, updated_at: now } });
}
