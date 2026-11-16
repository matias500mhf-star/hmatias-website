import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyFirebaseIdToken } from '../src/firebase-auth.js';

const projectId = 'hmatias-c660a';
const now = Date.now();

function base64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function fixture(overrides = {}) {
  const pair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  jwk.kid = 'test-key';
  jwk.use = 'sig';
  jwk.alg = 'RS256';
  const seconds = Math.floor(now / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key' }));
  const payload = base64Url(JSON.stringify({
    iss: 'https://securetoken.google.com/' + projectId,
    aud: projectId,
    sub: 'firebase-user-001',
    iat: seconds - 30,
    auth_time: seconds - 60,
    exp: seconds + 3300,
    email: 'customer@example.com',
    email_verified: true,
    ...overrides,
  }));
  const input = header + '.' + payload;
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    pair.privateKey,
    new TextEncoder().encode(input),
  );
  return { token: input + '.' + base64Url(signature), jwks: { keys: [jwk] } };
}

test('accepts a correctly signed Firebase ID token for the configured project', async () => {
  const value = await fixture();
  const claims = await verifyFirebaseIdToken(value.token, { FIREBASE_PROJECT_ID: projectId }, { jwks: value.jwks, now });
  assert.equal(claims.uid, 'firebase-user-001');
  assert.equal(claims.email, 'customer@example.com');
  assert.equal(claims.email_verified, true);
});

test('rejects a token issued for another Firebase project', async () => {
  const value = await fixture({ aud: 'another-project', iss: 'https://securetoken.google.com/another-project' });
  await assert.rejects(
    verifyFirebaseIdToken(value.token, { FIREBASE_PROJECT_ID: projectId }, { jwks: value.jwks, now }),
  );
});

test('rejects an expired Firebase ID token', async () => {
  const value = await fixture({ exp: Math.floor(now / 1000) - 120 });
  await assert.rejects(
    verifyFirebaseIdToken(value.token, { FIREBASE_PROJECT_ID: projectId }, { jwks: value.jwks, now }),
  );
});

test('rejects a token with a signature from a different signing key', async () => {
  const value = await fixture();
  const other = await fixture();
  await assert.rejects(
    verifyFirebaseIdToken(value.token, { FIREBASE_PROJECT_ID: projectId }, { jwks: other.jwks, now }),
  );
});

test('rejects malformed tokens and oversized subjects', async () => {
  await assert.rejects(verifyFirebaseIdToken('not-a-jwt', { FIREBASE_PROJECT_ID: projectId }, { now }));
  const value = await fixture({ sub: 'x'.repeat(129) });
  await assert.rejects(
    verifyFirebaseIdToken(value.token, { FIREBASE_PROJECT_ID: projectId }, { jwks: value.jwks, now }),
  );
});
