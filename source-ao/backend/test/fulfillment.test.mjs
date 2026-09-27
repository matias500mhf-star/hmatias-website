import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateFulfillmentSummary,validateFulfillmentInput} from '../src/fulfillment.js';

test('realized profit is not calculated while any actual cost component is unknown',()=>{
  const summary=calculateFulfillmentSummary({
    award_ref:'AW-1',awarded_at:'2026-09-27T10:00:00Z',
    purchase_ref:'PO-1',purchased_at:'2026-09-28T10:00:00Z',
    actual_material_cost_aoa:300000,
    actual_transport_cost_aoa:25000,
    actual_customs_cost_aoa:null,
    actual_tax_cost_aoa:0,
    actual_other_cost_aoa:5000,
    delivery_ref:'DEL-1',delivered_at:'2026-10-02T10:00:00Z',
    final_revenue_aoa:450000
  });
  assert.equal(summary.actual_total_cost_aoa,null);
  assert.equal(summary.realized_gross_profit_aoa,null);
  assert.equal(summary.realized_profit_ready,false);
  assert.ok(summary.missing_requirements.includes('missing_actual_customs_cost_aoa'));
});

test('explicit zero costs are valid and allow realized gross profit calculation',()=>{
  const summary=calculateFulfillmentSummary({
    award_ref:'AW-1',awarded_at:'2026-09-27T10:00:00Z',
    purchase_ref:'PO-1',purchased_at:'2026-09-28T10:00:00Z',
    actual_material_cost_aoa:300000,
    actual_transport_cost_aoa:25000,
    actual_customs_cost_aoa:0,
    actual_tax_cost_aoa:0,
    actual_other_cost_aoa:5000,
    delivery_ref:'DEL-1',delivered_at:'2026-10-02T10:00:00Z',
    final_revenue_aoa:450000
  });
  assert.equal(summary.actual_total_cost_aoa,330000);
  assert.equal(summary.realized_gross_profit_aoa,120000);
  assert.equal(summary.realized_gross_margin_pct,26.67);
  assert.equal(summary.realized_profit_ready,true);
});

test('negative actual values are rejected instead of normalized',()=>{
  const result=validateFulfillmentInput({stage:'pending',actual_material_cost_aoa:-1},{});
  assert.equal(result.ok,false);
  assert.equal(result.code,'invalid_fields');
});


test('invalid fulfillment dates are rejected',()=>{
  const result=validateFulfillmentInput({stage:'pending',awarded_at:'not-a-date'},{});
  assert.equal(result.ok,false);
  assert.equal(result.code,'invalid_fields');
});
