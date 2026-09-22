import test from 'node:test';
import assert from 'node:assert/strict';
import {mapPublicItemRow} from '../src/public-search.js';

const base={
  item_id:'item_1',
  item_name:'PVC Pipe 110 mm',
  category:'construction',
  specification:'110 mm',
  unit:'unit',
  supplier_id:'sup_1',
  supplier_name:'Supplier Test',
  supplier_location:'Luanda',
  supplier_website:'https://supplier.example',
  observation_id:'obs_1',
  verification_status:'in_stock_confirmed',
  quantity_reported:5,
  price_reported:1000,
  currency:'AOA',
  source_type:'direct_supplier_confirmation',
  verified_at:'2026-09-22T10:00:00.000Z'
};

test('expired confirmed observation becomes needs_reconfirmation, not discovered',()=>{
  const now=Date.parse('2026-09-23T00:00:00.000Z');
  const result=mapPublicItemRow({...base,expires_at:'2026-09-22T23:00:00.000Z'},now);
  assert.equal(result.status,'needs_reconfirmation');
  assert.equal(result.verification.source_type,'direct_supplier_confirmation');
  assert.equal(result.verification.supplier_id,'sup_1');
  assert.equal(result.verified_at,'2026-09-22T10:00:00.000Z');
});

test('current confirmed observation keeps public provenance without private evidence reference',()=>{
  const now=Date.parse('2026-09-22T12:00:00.000Z');
  const result=mapPublicItemRow({...base,expires_at:'2026-09-23T12:00:00.000Z'},now);
  assert.equal(result.status,'in_stock_confirmed');
  assert.equal(result.supplier.name,'Supplier Test');
  assert.equal(result.verification.source_type,'direct_supplier_confirmation');
  assert.equal(Object.prototype.hasOwnProperty.call(result,'evidence_reference'),false);
  assert.equal(JSON.stringify(result).includes('verification_request:'),false);
});

test('item with no approved observation remains discovered',()=>{
  const result=mapPublicItemRow({
    item_id:'item_2',item_name:'Unknown Item',category:'general',specification:null,unit:null,
    supplier_id:null,observation_id:null,verification_status:null,verified_at:null,expires_at:null,
    quantity_reported:null,price_reported:null,currency:null
  });
  assert.equal(result.status,'discovered');
  assert.equal(result.verification,null);
});
