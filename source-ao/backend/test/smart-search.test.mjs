import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSmartSearchPlan} from '../src/smart-search.js';

test('expands Portuguese PP strapping query into bilingual supplier discovery terms',()=>{
  const plan=buildSmartSearchPlan({query:'cinta PP 9mm 1 rolo urgente',location:'Luanda'});
  assert.equal(plan.interpretation.family_id,'packaging-strapping');
  assert.equal(plan.interpretation.category,'industrial-supply');
  assert.equal(plan.interpretation.semantic_match,'high');
  assert.deepEqual(plan.interpretation.specifications,['9mm']);
  assert.equal(plan.interpretation.quantity,1);
  assert.equal(plan.urgency,'urgent');
  assert.ok(plan.query_variants.some(q=>q.toLowerCase().includes('polypropylene strapping')));
  assert.ok(plan.query_variants.some(q=>q.toLowerCase().includes('embalagens industriais')));
  assert.equal(plan.claims.stock_confirmed,false);
});

test('maps formol and formaldehyde to the same chemical sourcing family',()=>{
  const plan=buildSmartSearchPlan({query:'formol 37% 1L urgente',location:'Luanda'});
  assert.equal(plan.interpretation.family_id,'formaldehyde-chemical');
  assert.equal(plan.interpretation.category,'industrial-supply');
  assert.equal(plan.urgency,'urgent');
  assert.ok(plan.query_variants.some(q=>q.toLowerCase().includes('formaldehyde 37%')));
  assert.ok(plan.query_variants.some(q=>q.toLowerCase().includes('produtos químicos laboratoriais')));
  assert.equal(plan.claims.stock_confirmed,false);
});

test('keeps unknown product as general sourcing without fabricating availability',()=>{
  const plan=buildSmartSearchPlan({query:'peça especial modelo ZX-441',location:'Viana'});
  assert.equal(plan.interpretation.family_id,'general-sourcing');
  assert.equal(plan.interpretation.category,'general');
  assert.equal(plan.claims.price_confirmed,false);
  assert.ok(plan.query_variants.some(q=>q.includes('Viana')));
});

test('rejects invalid short queries',()=>{
  assert.throws(()=>buildSmartSearchPlan({query:'x'}),/invalid_query/);
});
