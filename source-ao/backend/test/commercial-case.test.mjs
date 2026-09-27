import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLandedCost,
  calculateCommercialSummary,
  validateCostOptionInput
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
