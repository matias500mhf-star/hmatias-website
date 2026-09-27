import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProposalDraft} from '../src/proposal-builder.js';

test('proposal draft refuses to fabricate a customer proposal before commercial readiness',()=>{
  const result=buildProposalDraft({
    request:{id:'sr-1',public_ref:'SAO-1',requirement_text:'Cimento 42.5',location:'Luanda'},
    commercial_case:{proposal_ref:null},
    summary:{proposal_ready:false,missing_requirements:['selected_cost_required','sale_price_required']}
  });
  assert.equal(result.ready,false);
  assert.equal(result.draft,null);
  assert.deepEqual(result.missing_requirements,['selected_cost_required','sale_price_required']);
});

test('proposal draft uses confirmed RFQ items and explicit sale price only',()=>{
  const result=buildProposalDraft({
    request:{id:'sr-1',public_ref:'SAO-20260927-TEST',requirement_text:'Materiais de obra',location:'Luanda',needed_by:'2026-10-10'},
    commercial_case:{proposal_ref:'PROP-2026-001'},
    summary:{proposal_ready:true,sale_price_aoa:1250000,missing_requirements:[]},
    rfq:{
      requester_name:'Cliente Teste',
      company:'Empresa Teste',
      items:[
        {description:'Tinta acrílica',specification:'Exterior, 20 L',quantity:15,unit:'baldes'},
        {description:'Rolo profissional',specification:null,quantity:10,unit:'un.'}
      ],
      notes:'Entrega em Luanda.'
    }
  });
  assert.equal(result.ready,true);
  assert.equal(result.draft.total_price_aoa,1250000);
  assert.equal(result.draft.items.length,2);
  assert.match(result.draft.text,/PROP-2026-001/);
  assert.match(result.draft.text,/Tinta acrílica/);
  assert.match(result.draft.text,/1\.250\.000|1,250,000|1250000/);
  assert.match(result.draft.text,/Prazo de entrega\/execução HMATIAS: A confirmar/);
  assert.equal(result.draft.payment_terms,null);
  assert.equal(result.draft.validity,null);
});

test('customer-facing proposal draft does not expose supplier cost, profit or margin data',()=>{
  const result=buildProposalDraft({
    request:{id:'sr-1',public_ref:'SAO-1',requirement_text:'EPI',location:'Luanda'},
    commercial_case:{proposal_ref:'PROP-1',selected_supplier_id:'secret-supplier'},
    summary:{
      proposal_ready:true,
      sale_price_aoa:500000,
      landed_cost_aoa:300000,
      gross_profit_aoa:200000,
      gross_margin_pct:40,
      missing_requirements:[]
    },
    rfq:{items:[{description:'Capacetes',quantity:20,unit:'un.'}]}
  });
  const serialized=JSON.stringify(result.draft).toLowerCase();
  for(const forbidden of ['secret-supplier','landed_cost','gross_profit','gross_margin','supplier_id']){
    assert.equal(serialized.includes(forbidden),false);
  }
});
