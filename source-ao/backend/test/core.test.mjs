import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSearch,
  effectiveObservationStatus,
  canAcceptSupplierResponse,
  normalizeSupplierResponse,
  createConfirmationToken,
  verifyConfirmationToken
} from '../src/index.js';

test('normalizes Portuguese accents and technical units',()=>{
  assert.equal(normalizeSearch('Tubo PVC 110 mm — São Paulo'),'tubo pvc 110mm sao paulo');
  assert.equal(normalizeSearch('Ar condicionado 24.000 BTU'),'ar condicionado 24 000btu');
});

test('expired observations downgrade automatically',()=>{
  const row={verification_status:'in_stock_confirmed',expires_at:'2026-09-20T00:00:00Z'};
  assert.equal(effectiveObservationStatus(row,Date.parse('2026-09-22T00:00:00Z')),'needs_reconfirmation');
});

test('unavailable remains explicit even after time passes',()=>{
  const row={verification_status:'unavailable',expires_at:'2026-09-20T00:00:00Z'};
  assert.equal(effectiveObservationStatus(row,Date.parse('2026-09-22T00:00:00Z')),'unavailable');
});

test('supplier response gate is one-shot',()=>{
  assert.equal(canAcceptSupplierResponse({status:'sent',supplier_response_json:null}),true);
  assert.equal(canAcceptSupplierResponse({status:'sent',supplier_response_json:'{}'}),false);
  assert.equal(canAcceptSupplierResponse({status:'supplier_responded',supplier_response_json:null}),false);
});

test('supplier response normalization accepts valid commercial data',()=>{
  const result=normalizeSupplierResponse({
    available:true,
    quantity_reported:12,
    price_reported:2500,
    currency:'aoa',
    lead_time:'2 days',
    note:'Factory packed',
    responded_by:'Test Supplier'
  });
  assert.equal(result.ok,true);
  assert.equal(result.value.currency,'AOA');
  assert.equal(result.value.quantity_reported,12);
});

test('supplier response normalization rejects unsafe commercial values',()=>{
  assert.equal(normalizeSupplierResponse({available:'yes'}).code,'missing_availability');
  assert.equal(normalizeSupplierResponse({available:true,quantity_reported:-1}).code,'invalid_quantity');
  assert.equal(normalizeSupplierResponse({available:true,price_reported:-1,currency:'AOA'}).code,'invalid_price');
  assert.equal(normalizeSupplierResponse({available:true,price_reported:10,currency:'KZ'}).code,'currency_required');
  assert.equal(normalizeSupplierResponse({available:true,note:'x'.repeat(601)}).code,'invalid_note');
});

test('supplier confirmation token is deterministic and rejects tampering',async()=>{
  const id='vr_example';
  const expires=new Date(Date.now()+3600000).toISOString();
  const secret='unit-test-secret';
  const token=await createConfirmationToken(id,expires,secret);
  const replacement=token.at(-1)==='0'?'1':'0';
  const tampered=token.slice(0,-1)+replacement;
  assert.equal(await verifyConfirmationToken(id,expires,token,secret),true);
  assert.equal(await verifyConfirmationToken(id+'x',expires,token,secret),false);
  assert.equal(await verifyConfirmationToken(id,expires,tampered,secret),false);
});

test('expired supplier confirmation token is rejected',async()=>{
  const id='vr_expired';
  const expires=new Date(Date.now()-1000).toISOString();
  const secret='unit-test-secret';
  const token=await createConfirmationToken(id,expires,secret);
  assert.equal(await verifyConfirmationToken(id,expires,token,secret),false);
});
