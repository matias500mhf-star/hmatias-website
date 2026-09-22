import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSearch,effectiveObservationStatus,createConfirmationToken,verifyConfirmationToken} from '../src/index.js';

test('normalizes Portuguese accents and technical units',()=>{
  assert.equal(normalizeSearch('Tubo PVC 110 mm'), 'tubo pvc 110mm');
  assert.equal(normalizeSearch('Formaldeído 37%'), 'formaldeido 37');
  assert.equal(normalizeSearch('Ar Condicionado 24 000 BTU'), 'ar condicionado 24 000btu');
});

test('expired observations downgrade automatically',()=>{
  const now=Date.parse('2026-09-22T16:00:00Z');
  assert.equal(effectiveObservationStatus({verification_status:'in_stock_confirmed',expires_at:'2026-09-22T15:59:59Z'},now),'needs_reconfirmation');
  assert.equal(effectiveObservationStatus({verification_status:'in_stock_confirmed',expires_at:'2026-09-22T18:00:00Z'},now),'in_stock_confirmed');
});

test('unavailable remains explicit even after time passes',()=>{
  assert.equal(effectiveObservationStatus({verification_status:'unavailable',expires_at:'2020-01-01T00:00:00Z'},Date.now()),'unavailable');
});

test('supplier confirmation token is deterministic and rejects tampering',async()=>{
  const id='vr_example';
  const expires=new Date(Date.now()+3600000).toISOString();
  const secret='unit-test-secret';
  const token=await createConfirmationToken(id,expires,secret);
  assert.equal(await verifyConfirmationToken(id,expires,token,secret),true);
  assert.equal(await verifyConfirmationToken(id+'x',expires,token,secret),false);
  assert.equal(await verifyConfirmationToken(id,expires,token.slice(0,-1)+'0',secret),false);
});

test('expired supplier confirmation token is rejected',async()=>{
  const id='vr_expired';
  const expires=new Date(Date.now()-1000).toISOString();
  const secret='unit-test-secret';
  const token=await createConfirmationToken(id,expires,secret);
  assert.equal(await verifyConfirmationToken(id,expires,token,secret),false);
});
