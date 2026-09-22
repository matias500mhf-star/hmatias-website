import test from 'node:test';
import assert from 'node:assert/strict';
import {maintenanceCutoffs} from '../src/maintenance.js';

test('maintenance keeps rate-limit retention at 48 hours',()=>{
  const now=Date.parse('2026-09-23T00:00:00Z');
  const cutoffs=maintenanceCutoffs(now);
  assert.equal(cutoffs.now,'2026-09-23T00:00:00.000Z');
  assert.equal(cutoffs.rateLimitBefore,'2026-09-21T00:00:00.000Z');
});
