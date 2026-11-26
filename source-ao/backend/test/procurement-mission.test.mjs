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

test('formaldehyde mission pauses before database lookup, supplier ranking or RFQ creation',async()=>{
  const {buildProcurementMission}=await import('../src/procurement-mission.js');
  const env={SOURCE_AO_DB:{prepare(){throw new Error('database lookup must not run before compliance review')}}};
  const mission=await buildProcurementMission(env,{query:'formol 37% 1L urgente',location:'Luanda'});
  assert.equal(mission.status,'manual_compliance_review_required');
  assert.equal(mission.interpretation.item_id,'item-formaldehyde');
  assert.equal(mission.interpretation.requires_manual_compliance_review,true);
  assert.ok(mission.interpretation.specifications.includes('37%'));
  assert.ok(mission.interpretation.specifications.includes('1l'));
  assert.deepEqual(mission.exact_matches,[]);
  assert.deepEqual(mission.supplier_candidates,[]);
  assert.equal(mission.contactable_candidates,0);
  assert.equal(mission.rfq,null);
  assert.equal(mission.fast_path,null);
  assert.equal(mission.manual_review.supplier_discovery_paused,true);
});

test('RFQ never states that stock is already confirmed',()=>{
  const plan=buildSmartSearchPlan({query:'cinta PP 9mm 1 rolo urgente',location:'Luanda'});
  const rfq=buildRfq(plan,{});
  assert.doesNotMatch(rfq.pt,/stock confirmado/i);
  assert.match(rfq.pt,/confirmação de disponibilidade/i);
});
