import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLandedCost,
  calculateCommercialSummary,
  validateCostOptionInput,
  buildProposalDraft
} from '../src/commercial-case.js';

test('AOA commercial cost uses explicit entered costs without inventing extras',()=>{
  const result=calculateLandedCost({
    currency:'AOA',
    material_cost:100000,
    transport_cost:10000,
    customs_cost:0,
    tax_cost:0,
    other_cost:5000,
    contingency_cost:0
  });
  assert.equal(result.ok,true);
  assert.equal(result.fx_rate_to_aoa,1);
  assert.equal(result.source_total,115000);
  assert.equal(result.landed_cost_aoa,115000);
});

test('foreign verified cost requires an explicit FX rate',()=>{
  const result=validateCostOptionInput({
    supplier_id:'supplier-na',
    currency:'NAD',
    material_cost:5000,
    transport_cost:600,
    status:'verified'
  });
  assert.equal(result.ok,false);
  assert.equal(result.code,'fx_rate_required');
});

test('foreign draft can remain incomplete instead of fabricating an exchange rate',()=>{
  const result=validateCostOptionInput({
    supplier_id:'supplier-na',
    currency:'NAD',
    material_cost:5000,
    status:'draft'
  });
  assert.equal(result.ok,true);
  assert.equal(result.value.fx_rate_to_aoa,null);
  assert.equal(result.value.landed_cost_aoa,null);
});

test('commercial summary does not calculate margin until explicit sale price exists',()=>{
  const costs=[{
    id:'cost-1',
    supplier_id:'supplier-1',
    status:'verified',
    landed_cost_aoa:250000
  }];
  const summary=calculateCommercialSummary({
    qualification_status:'qualified',
    selected_cost_option_id:'cost-1',
    sale_price_aoa:null
  },costs);
  assert.equal(summary.gross_profit_aoa,null);
  assert.equal(summary.gross_margin_pct,null);
  assert.equal(summary.proposal_ready,false);
  assert.ok(summary.missing_requirements.includes('sale_price_required'));
});

test('commercial summary calculates gross profit and gross margin from explicit values',()=>{
  const costs=[{
    id:'cost-1',
    supplier_id:'supplier-1',
    status:'selected',
    landed_cost_aoa:300000
  }];
  const summary=calculateCommercialSummary({
    qualification_status:'qualified',
    selected_cost_option_id:'cost-1',
    sale_price_aoa:400000
  },costs);
  assert.equal(summary.landed_cost_aoa,300000);
  assert.equal(summary.gross_profit_aoa,100000);
  assert.equal(summary.gross_margin_pct,25);
  assert.equal(summary.proposal_ready,true);
});

test('negative commercial costs are rejected',()=>{
  const result=validateCostOptionInput({
    supplier_id:'supplier-1',
    currency:'AOA',
    material_cost:-1,
    status:'draft'
  });
  assert.equal(result.ok,false);
  assert.equal(result.code,'invalid_cost');
});


test('proposal draft excludes private supplier cost and margin data',()=>{
  const result=buildProposalDraft({
    request:{id:'sr-1',public_ref:'SAO-1',requirement_text:'20 capacetes',location:'Luanda',needed_by:'2026-10-10'},
    commercialCase:{
      proposal_ref:'PROP-001',
      proposal_validity_days:15,
      proposal_payment_terms:'50% adjudicação, 50% entrega',
      proposal_delivery_terms:'Entrega em Luanda após confirmação de stock',
      proposal_tax_treatment:'Preço conforme tratamento fiscal indicado na proposta final',
      proposal_customer_notes:'Sujeito a confirmação final.'
    },
    summary:{proposal_ready:true,sale_price_aoa:420000,landed_cost_aoa:300000,gross_profit_aoa:120000,gross_margin_pct:28.57},
    rfq:{requester_name:'Cliente Teste',company:'Empresa Teste',buyer_type:'company',items:[{description:'Capacete',quantity:20,unit:'un',specification:'EN 397'}]}
  });
  assert.equal(result.issuance_ready,true);
  assert.equal(result.draft.total_price_aoa,420000);
  assert.equal(result.draft.items.length,1);
  assert.equal(Object.hasOwn(result.draft,'landed_cost_aoa'),false);
  assert.equal(Object.hasOwn(result.draft,'gross_margin_pct'),false);
  assert.equal(Object.hasOwn(result.draft,'supplier_id'),false);
});

test('proposal draft remains non-issuable when commercial or contractual terms are missing',()=>{
  const result=buildProposalDraft({
    request:{id:'sr-2',public_ref:'SAO-2',requirement_text:'Material'},
    commercialCase:{proposal_ref:null},
    summary:{proposal_ready:false,sale_price_aoa:null}
  });
  assert.equal(result.issuance_ready,false);
  assert.ok(result.missing_requirements.includes('commercial_case_not_ready'));
  assert.ok(result.missing_requirements.includes('proposal_reference_required'));
  assert.ok(result.missing_requirements.includes('payment_terms_required'));
  assert.ok(result.missing_requirements.includes('delivery_terms_required'));
});
