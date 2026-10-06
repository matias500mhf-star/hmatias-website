import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSupplierOutreachInput} from '../src/supplier-outreach.js';

test('accepts a contacted supplier with explicit channel and contact time',()=>{
  const result=validateSupplierOutreachInput({
    supplier_id:'sup_1',
    status:'awaiting_response',
    channel:'email',
    contacted_at:'2026-10-06T09:00:00+01:00',
    next_follow_up_at:'2026-10-07T09:00:00+01:00'
  });
  assert.equal(result.ok,true);
  assert.equal(result.value.status,'awaiting_response');
  assert.equal(result.value.contacted_at,'2026-10-06T08:00:00.000Z');
});

test('response statuses require response evidence time',()=>{
  const result=validateSupplierOutreachInput({
    supplier_id:'sup_1',
    status:'out_of_scope',
    channel:'email',
    contacted_at:'2026-10-06T09:00:00+01:00'
  });
  assert.equal(result.ok,false);
  assert.equal(result.code,'responded_at_required');
});

test('quote received requires a quote reference or response summary',()=>{
  const result=validateSupplierOutreachInput({
    supplier_id:'sup_1',
    status:'quote_received',
    channel:'email',
    contacted_at:'2026-10-06T09:00:00+01:00',
    responded_at:'2026-10-06T10:00:00+01:00'
  });
  assert.equal(result.ok,false);
  assert.equal(result.code,'quote_evidence_required');
});

test('closed supplier outcomes clear follow-up date',()=>{
  const result=validateSupplierOutreachInput({
    supplier_id:'sup_1',
    status:'declined',
    channel:'email',
    contacted_at:'2026-10-06T09:00:00+01:00',
    responded_at:'2026-10-06T10:00:00+01:00',
    next_follow_up_at:'2026-10-08T09:00:00+01:00'
  });
  assert.equal(result.ok,true);
  assert.equal(result.value.next_follow_up_at,null);
});
