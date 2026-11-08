import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRfq,scoreSupplierCandidate} from '../src/procurement-mission.js';
import {buildSmartSearchPlan} from '../src/smart-search.js';

test('PP strapping mission ranks packaging suppliers above unrelated industrial suppliers',()=>{
  const plan=buildSmartSearchPlan({query:'cinta PP 9mm 1 rolo urgente',location:'Luanda'});
  const packaging={
    name:'Packaging Test',
    categories_json:JSON.stringify(['industrial-supply']),
    capabilities_json:JSON.stringify(['polypropylene packaging','industrial packaging']),
    phone:'+244900000000'
  };
  const chemical={
    name:'Chemical Test',
    categories_json:JSON.stringify(['industrial-supply']),
    capabilities_json:JSON.stringify(['laboratory chemicals','reagents']),
    phone:'+244900000001'
  };
  assert.ok(scoreSupplierCandidate(plan,packaging)>scoreSupplierCandidate(plan,chemical));
});

test('formaldehyde mission ranks chemical supplier and preserves concentration in RFQ',()=>{
  const plan=buildSmartSearchPlan({query:'formol 37% 1L urgente',location:'Luanda'});
  const chemical={
    name:'Lab Supplier',
    categories_json:JSON.stringify(['industrial-supply']),
    capabilities_json:JSON.stringify(['formaldehyde','formalin','laboratory chemicals']),
    whatsapp:'+244900000002'
  };
  assert.equal(plan.interpretation.item_id,'item-formaldehyde');
  assert.ok(plan.interpretation.specifications.includes('37%'));
  assert.ok(plan.interpretation.specifications.includes('1l'));
  assert.ok(scoreSupplierCandidate(plan,chemical)>=20);
  const rfq=buildRfq(plan,{});
  assert.match(rfq.pt,/37%/);
  assert.match(rfq.pt,/1l/i);
  assert.match(rfq.pt,/stock atual/i);
});

test('RFQ never states that stock is already confirmed',()=>{
  const plan=buildSmartSearchPlan({query:'cinta PP 9mm 1 rolo urgente',location:'Luanda'});
  const rfq=buildRfq(plan,{});
  assert.doesNotMatch(rfq.pt,/stock confirmado/i);
  assert.match(rfq.pt,/confirmação de disponibilidade/i);
});

test('PPE search recognizes a source-checked regional supplier without assuming stock',()=>{
  const plan=buildSmartSearchPlan({query:'EPI luvas de proteção',location:'Namibia'});
  const esn={
    name:'Evolution Safety Namibia',
    categories_json:JSON.stringify(['industrial-supply','tools-equipment']),
    capabilities_json:JSON.stringify(['PPE','EPI','luvas de proteção','Wenaas','Karam','Mechanix']),
    email:'sales@esn.com.na'
  };
  const unrelated={
    name:'Packaging Supplier',
    categories_json:JSON.stringify(['industrial-supply']),
    capabilities_json:JSON.stringify(['polypropylene packaging','PP strapping'])
  };
  assert.ok(scoreSupplierCandidate(plan,esn)>scoreSupplierCandidate(plan,unrelated));
  assert.equal(plan.claims.stock_confirmed,false);
  assert.equal(plan.claims.price_confirmed,false);
});
