import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCommercialDashboard} from '../src/commercial-dashboard.js';

test('commercial cockpit aggregates pipeline and realized profit without identities',()=>{
  const result=buildCommercialDashboard({
    requestStatusRows:[
      {status:'received',count:2},{status:'quoted',count:3},{status:'completed',count:1},{status:'closed',count:1}
    ],
    proposalStatusRows:[
      {proposal_status:'ready',count:1,total_value_aoa:500000},
      {proposal_status:'sent',count:1,total_value_aoa:700000},
      {proposal_status:'accepted',count:2,total_value_aoa:1800000}
    ],
    fulfillmentRows:[
      {stage:'awarded',count:1,final_revenue_aoa:0,actual_cost_aoa:0},
      {stage:'completed',count:2,final_revenue_aoa:1700000,actual_cost_aoa:1200000}
    ],
    collectionRows:[
      {invoice_amount_aoa:900000,received_aoa:900000,due_date:'2026-09-20T00:00:00.000Z'},
      {invoice_amount_aoa:800000,received_aoa:300000,due_date:'2026-09-25T00:00:00.000Z'}
    ],
    asOf:new Date('2026-09-27T00:00:00.000Z')
  });
  assert.equal(result.requests.total,7);
  assert.equal(result.requests.active,5);
  assert.equal(result.requests.awaiting_triage,2);
  assert.equal(result.proposals.pipeline_value_aoa,3000000);
  assert.equal(result.proposals.accepted_value_aoa,1800000);
  assert.equal(result.execution.completed_revenue_aoa,1700000);
  assert.equal(result.execution.completed_actual_cost_aoa,1200000);
  assert.equal(result.execution.realized_gross_profit_aoa,500000);
  assert.equal(result.execution.realized_gross_margin_pct,29.41);
  assert.equal(result.collections.invoiced_aoa,1700000);
  assert.equal(result.collections.received_aoa,1200000);
  assert.equal(result.collections.outstanding_aoa,500000);
  assert.equal(result.collections.overdue_aoa,500000);
  assert.equal(result.collections.overdue_count,1);
  assert.equal(result.collections.paid_count,1);
  assert.equal(JSON.stringify(result).includes('supplier'),false);
  assert.equal(JSON.stringify(result).includes('contact'),false);
});

test('commercial cockpit returns zero-safe metrics on an empty database',()=>{
  const result=buildCommercialDashboard({});
  assert.equal(result.requests.total,0);
  assert.equal(result.requests.active,0);
  assert.equal(result.proposals.pipeline_value_aoa,0);
  assert.equal(result.execution.realized_gross_profit_aoa,0);
  assert.equal(result.execution.realized_gross_margin_pct,null);
  assert.equal(result.collections.invoiced_aoa,0);
  assert.equal(result.collections.received_aoa,0);
  assert.equal(result.collections.outstanding_aoa,0);
});
