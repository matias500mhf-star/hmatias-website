import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSearch,effectiveObservationStatus,canAcceptSupplierResponse,normalizeSupplierResponse,createConfirmationToken,verifyConfirmationToken} from '../src/index.js';

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

test('supplier response gate is one-shot',()=>{
  assert.equal(canAcceptSupplierResponse({status:'sent',supplier_response_json:null}),true);
  assert.equal(canAcceptSupplierResponse({status:'supplier_responded',supplier_response_json:'{}'}),false);
  assert.equal(canAcceptSupplierResponse({status:'approved',supplier_response_json:'{}'}),false);
  assert.equal(canAcceptSupplierResponse({status:'sent',supplier_response_json:'{}'}),false);
  assert.equal(canAcceptSupplierResponse(null),false);
});

test('supplier response normalization accepts valid commercial data',()=>{
  const result=normalizeSupplierResponse({
    available:true,
    quantity_reported:20,
    price_reported:12500.5,
    currency:'aoa',
    lead_time:'Imediato',
    note:'Caixa fechada',
    responded_by:'Fornecedor teste'
  });
  assert.equal(result.ok,true);
  assert.deepEqual(result.value,{
    available:true,
    quantity_reported:20,
    price_reported:12500.5,
    currency:'AOA',
    lead_time:'Imediato',
    note:'Caixa fechada',
    responded_by:'Fornecedor teste'
  });
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
