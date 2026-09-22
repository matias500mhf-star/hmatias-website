import test from 'node:test';
import assert from 'node:assert/strict';
import {maintenanceCutoffs,parseContactRetentionDays} from '../src/maintenance.js';

test('maintenance keeps rate-limit retention at 48 hours',()=>{
  const now=Date.parse('2026-09-23T00:00:00Z');
  const cutoffs=maintenanceCutoffs(now);
  assert.equal(cutoffs.now,'2026-09-23T00:00:00.000Z');
  assert.equal(cutoffs.rateLimitBefore,'2026-09-21T00:00:00.000Z');
  assert.equal(cutoffs.contactBefore,null);
});

test('maintenance calculates requester contact purge cutoff',()=>{
  const now=Date.parse('2026-09-23T00:00:00Z');
  const cutoffs=maintenanceCutoffs(now,'30');
  assert.equal(cutoffs.contactRetentionDays,30);
  assert.equal(cutoffs.contactBefore,'2026-08-24T00:00:00.000Z');
});

test('unsafe retention windows are rejected',()=>{
  assert.equal(parseContactRetentionDays('7'),null);
  assert.equal(parseContactRetentionDays('2000'),null);
  assert.equal(parseContactRetentionDays('365'),365);
});
