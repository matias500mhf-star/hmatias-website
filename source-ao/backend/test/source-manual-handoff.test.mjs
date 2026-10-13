import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../../verified-results.js',import.meta.url),'utf8');
function handoff(lang,data){
  const window={};
  vm.runInNewContext(source.replace(/\}\)\(\);\s*$/,
    'window.researchHandoff=researchHandoff;})();'),{
    document:{documentElement:{lang},addEventListener(){}},window,
    console:{warn(){}},URLSearchParams,Intl,Date
  });
  return new URL(window.researchHandoff(data));
}

test('manual supply handoff preserves the exact specification without interpreting product weight as order quantity',()=>{
  const query='Aspirador CH53010, peso 15 lb (6,8 kg), sem alternativas';
  const url=handoff('pt-AO',{query,location:'Benguela',quantity:'',neededBy:''});
  assert.equal(url.origin+url.pathname,'https://wa.me/244948806673');
  const text=url.searchParams.get('text');
  assert.ok(text.includes(query));
  assert.ok(text.includes('Quantidade: A confirmar'));
  assert.ok(text.includes('Local de entrega: Benguela'));
  assert.ok(text.includes('Solicito confirmação'));
});

test('English manual handoff retains explicit quantity, delivery location and target date',()=>{
  const url=handoff('en',{query:'ASTM A193 B7 M12 × 40 — no alternatives',
    location:'Lobito',quantity:'150 pcs',neededBy:'2026-11-02'});
  const text=url.searchParams.get('text');
  assert.ok(text.includes('ASTM A193 B7 M12 × 40 — no alternatives'));
  assert.ok(text.includes('Quantity: 150 pcs'));
  assert.ok(text.includes('Delivery location: Lobito'));
  assert.ok(text.includes('Target date: 2026-11-02'));
});
