import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCollectionSummary,validateInvoiceInput,validatePaymentInput} from '../src/collections.js';

test('collection summary distinguishes invoice from cash received',()=>{
  const invoice={invoice_amount_aoa:1000000,due_date:'2026-10-15T00:00:00.000Z'};
  const result=buildCollectionSummary(invoice,[
    {amount_aoa:250000,received_at:'2026-10-01T00:00:00.000Z'},
    {amount_aoa:100000,received_at:'2026-10-02T00:00:00.000Z',voided_at:'2026-10-03T00:00:00.000Z'}
  ],new Date('2026-10-10T00:00:00.000Z'));
  assert.equal(result.status,'partial');
  assert.equal(result.total_received_aoa,250000);
  assert.equal(result.outstanding_aoa,750000);
  assert.equal(result.payment_count,1);
});

test('unpaid balance becomes overdue only after due date',()=>{
  const invoice={invoice_amount_aoa:500000,due_date:'2026-09-20T00:00:00.000Z'};
  const result=buildCollectionSummary(invoice,[],new Date('2026-09-27T00:00:00.000Z'));
  assert.equal(result.status,'overdue');
  assert.equal(result.outstanding_aoa,500000);
  assert.equal(result.overdue_days,7);
});

test('overpayment is visible instead of silently capped',()=>{
  const result=buildCollectionSummary({invoice_amount_aoa:100000,due_date:null},[
    {amount_aoa:120000}
  ],new Date('2026-09-27T00:00:00.000Z'));
  assert.equal(result.status,'paid');
  assert.equal(result.outstanding_aoa,0);
  assert.equal(result.overpayment_aoa,20000);
  assert.equal(result.collection_rate_pct,120);
});

test('invoice validation rejects due date before invoice date',()=>{
  const result=validateInvoiceInput({
    invoice_ref:'FT-1',invoice_date:'2026-09-27',due_date:'2026-09-26',invoice_amount_aoa:100
  });
  assert.equal(result.ok,false);
  assert.equal(result.code,'due_before_invoice');
});

test('payment requires positive amount, reference and valid method',()=>{
  assert.equal(validatePaymentInput({payment_ref:'REC-1',payment_method:'bank_transfer',amount_aoa:100,received_at:'2026-09-27'}).ok,true);
  assert.equal(validatePaymentInput({payment_ref:'REC-2',payment_method:'bank_transfer',amount_aoa:0,received_at:'2026-09-27'}).ok,false);
  assert.equal(validatePaymentInput({payment_ref:'REC-3',payment_method:'crypto',amount_aoa:100,received_at:'2026-09-27'}).code,'invalid_payment_method');
});
