import test from 'node:test';
import assert from 'node:assert/strict';
import {technicalRequirement,matchesTechnicalRequirement,technicalRfq} from '../../technical-requirement.js';

test('preserves a model and weight without interpreting weight as an order quantity',()=>{
  const r=technicalRequirement('Aspirador modelo CH53010, peso 15 lb (6,8 kg), sem alternativas');
  assert.deepEqual(r.models,['CH53010']);
  assert.deepEqual(r.measures,['15 lb','6,8 kg']);
  assert.equal(r.quantity,null);
  assert.equal(r.strict,true);
  assert.match(technicalRfq(r,{lang:'en'}),/Quantity: to confirm/);
  assert.match(technicalRfq(r,{lang:'en'}),/No alternatives are accepted/);
});
test('keeps a structured metric dimension and ASTM grade in the request',()=>{
  const r=technicalRequirement('Parafuso M12 × 40, ASTM A193 Grade B8, 5 unidades');
  assert.deepEqual(r.standards,['ASTM A193']);
  assert.deepEqual(r.grades,['Grade B8']);
  assert.deepEqual(r.dimensions,['M12 × 40']);
  assert.equal(r.quantity.value,5);
  assert.match(technicalRfq(r),/Quantidade: 5 unidades/);
});
test('generic equipment observation does not verify an exact requested model',()=>{
  const r=technicalRequirement('aspirador CH53010');
  assert.equal(matchesTechnicalRequirement({name:'Tools and equipment',specification:'Industrial equipment'},r),false);
  assert.equal(matchesTechnicalRequirement({name:'Hoover CH53010',specification:'Upright vacuum'},r),true);
  assert.equal(matchesTechnicalRequirement({name:'Hoover CH54115',specification:'Upright vacuum'},r),false);
  assert.equal(matchesTechnicalRequirement({name:'CH5301010',specification:'Different model'},r),false);
});
test('preserves chemical identity and concentration and rejects a conflicting concentration',()=>{
  const r=technicalRequirement('Formol 37% CAS 50-00-0');
  assert.deepEqual(r.chemicalIds,['CAS 50-00-0']);
  assert.deepEqual(r.percentages,['37%']);
  assert.equal(matchesTechnicalRequirement({name:'Formaldehyde CAS 50-00-0',specification:'30-35%'},r),false);
  assert.equal(matchesTechnicalRequirement({name:'Formaldehyde CAS 50-00-0',specification:'37%'},r),true);
});
test('a different dimension or standard does not become an exact technical match',()=>{
  const r=technicalRequirement('ASTM A193 M12x40');
  assert.equal(matchesTechnicalRequirement({name:'ASTM A193 bolt',specification:'M12 × 40'},r),true);
  assert.equal(matchesTechnicalRequirement({name:'ASTM A193 bolt',specification:'M16x90'},r),false);
  assert.equal(matchesTechnicalRequirement({name:'ASTM A307 bolt',specification:'M12x40'},r),false);
});
test('preserves a multi-part model and bilingual count units',()=>{
  const r=technicalRequirement('Kärcher CV 38/2 Adv 2 units');
  assert.deepEqual(r.models,['CV 38/2 Adv']);
  assert.equal(r.quantity.unit,'un');
  assert.equal(r.quantity.value,2);
  assert.equal(matchesTechnicalRequirement({name:'Karcher CV 38/2',specification:'standard model'},r),false);
  assert.match(technicalRfq(r,{lang:'en',quantity:4,location:'Lobito'}),/Quantity: 4 units/);
});
test('unspecified alternatives require approval and packaging quantity keeps its unit',()=>{
  const r=technicalRequirement('Cinta PP 9 mm 1 rolo');
  assert.equal(r.quantity.unit,'rolo');
  assert.match(technicalRfq(r,{quantity:3}),/Quantidade: 3 rolo/);
  assert.match(technicalRfq(r,{lang:'en'}),/obtain approval before substituting/);
});
