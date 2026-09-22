import test from 'node:test';
import assert from 'node:assert/strict';
import {missingReadinessConfig} from '../src/health.js';

test('readiness identifies every missing protected dependency',()=>{
  const missing=missingReadinessConfig({});
  assert.equal(missing.includes('SOURCE_AO_DB'),true);
  assert.equal(missing.includes('ADMIN_API_TOKEN'),true);
  assert.equal(missing.includes('CONFIRMATION_SECRET'),true);
  assert.equal(missing.includes('PII_ENCRYPTION_KEY'),true);
  assert.equal(missing.includes('RATE_LIMIT_SECRET'),true);
  assert.equal(missing.includes('PUBLIC_ORIGIN'),true);
  assert.equal(missing.includes('CONTACT_RETENTION_DAYS'),true);
});

test('readiness configuration passes with protected values and HTTPS origin',()=>{
  const env={
    SOURCE_AO_DB:{},
    ADMIN_API_TOKEN:'a'.repeat(32),
    CONFIRMATION_SECRET:'b'.repeat(32),
    PII_ENCRYPTION_KEY:'c'.repeat(32),
    RATE_LIMIT_SECRET:'d'.repeat(32),
    PUBLIC_ORIGIN:'https://staging.sourceao.example',
    CONTACT_RETENTION_DAYS:'30'
  };
  assert.deepEqual(missingReadinessConfig(env),[]);
});

test('readiness rejects weak, non-HTTPS or unsafe retention configuration',()=>{
  const env={
    SOURCE_AO_DB:{},
    ADMIN_API_TOKEN:'short',
    CONFIRMATION_SECRET:'b'.repeat(32),
    PII_ENCRYPTION_KEY:'c'.repeat(32),
    RATE_LIMIT_SECRET:'d'.repeat(32),
    PUBLIC_ORIGIN:'http://insecure.example',
    CONTACT_RETENTION_DAYS:'7'
  };
  const missing=missingReadinessConfig(env);
  assert.equal(missing.includes('ADMIN_API_TOKEN'),true);
  assert.equal(missing.includes('PUBLIC_ORIGIN'),true);
  assert.equal(missing.includes('CONTACT_RETENTION_DAYS'),true);
});
