import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveCommercialAction,buildCommercialActionQueue} from '../src/commercial-actions.js';

const now=new Date('2026-09-27T12:00:00.000Z');

test('overdue cash collection outranks all other commercial work',()=>{
  const overdue=deriveCommercialAction({
    id:'sr-1',public_ref:'SAO-1',request_status:'completed',requirement_text:'Material',
    proposal_status:'accepted',fulfillment_stage:'completed',
    invoice_amount_aoa:1000000,received_aoa:250000,due_date:'2026-09-20T00:00:00.000Z'
  },now);
  assert.equal(overdue.type,'collect_overdue');
  assert.equal(overdue.amount_aoa,750000);
  assert.equal(overdue.priority,'critical');

  const queue=buildCommercialActionQueue([
    {id:'sr-2',public_ref:'SAO-2',request_status:'received',requirement_text:'Novo pedido',created_at:'2026-09-27T08:00:00Z'},
    {id:'sr-1',public_ref:'SAO-1',request_status:'completed',requirement_text:'Material',proposal_status:'accepted',fulfillment_stage:'completed',invoice_amount_aoa:1000000,received_aoa:250000,due_date:'2026-09-20T00:00:00.000Z'}
  ],now,10);
  assert.equal(queue[0].request_id,'sr-1');
});

test('delivered work without invoice becomes a billing action',()=>{
  const action=deriveCommercialAction({
    id:'sr-3',public_ref:'SAO-3',request_status:'delivered',requirement_text:'Entrega',
    proposal_status:'accepted',fulfillment_stage:'delivered',fulfillment_updated_at:'2026-09-26T12:00:00Z'
  },now);
  assert.equal(action.type,'issue_invoice');
  assert.equal(action.score,92);
});

test('accepted proposal without execution becomes award action',()=>{
  const action=deriveCommercialAction({
    id:'sr-4',public_ref:'SAO-4',request_status:'quoted',requirement_text:'EPI',
    proposal_status:'accepted',fulfillment_stage:'pending',sale_price_aoa:800000,commercial_updated_at:'2026-09-25T12:00:00Z'
  },now);
  assert.equal(action.type,'record_award');
  assert.equal(action.amount_aoa,800000);
});

test('sent proposal gets follow-up and never exposes customer or supplier identities',()=>{
  const action=deriveCommercialAction({
    id:'sr-5',public_ref:'SAO-5',request_status:'quoted',requirement_text:'Pintura',
    proposal_status:'sent',fulfillment_stage:'pending',sale_price_aoa:500000,commercial_updated_at:'2026-09-22T12:00:00Z',
    requester_name:'Should not appear',supplier_name:'Should not appear'
  },now);
  assert.equal(action.type,'follow_up_proposal');
  const serialized=JSON.stringify(action);
  assert.equal(serialized.includes('Should not appear'),false);
  assert.equal(serialized.includes('requester_name'),false);
  assert.equal(serialized.includes('supplier_name'),false);
});
