import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePursuitInput} from '../src/opportunity-pursuits.js';

test('normalizes a revenue pursuit without inventing commercial values',()=>{
  const value=normalizePursuitInput({
    decision:'go',
    stage:'preparing_bid',
    owner:'Commercial',
    estimated_value_aoa:12500000,
    next_action:'Confirm qualification documents',
    next_action_due_at:'2026-10-05T09:00:00+01:00'
  });
  assert.equal(value.decision,'go');
  assert.equal(value.stage,'preparing_bid');
  assert.equal(value.estimated_value_aoa,12500000);
  assert.equal(value.next_action_due_at,'2026-10-05T08:00:00.000Z');
});

test('rejects unsupported pipeline states',()=>{
  assert.throws(()=>normalizePursuitInput({decision:'maybe'}),/invalid_decision/);
  assert.throws(()=>normalizePursuitInput({decision:'no_go',stage:'submitted'}),/no_go_stage_conflict/);
  assert.throws(()=>normalizePursuitInput({decision:'no_go',stage:'won'}),/no_go_stage_conflict/);
});

test('competitive outcomes require a GO decision',()=>{
  assert.throws(()=>normalizePursuitInput({decision:'watch',stage:'won'}),/competitive_outcome_requires_go/);
  assert.throws(()=>normalizePursuitInput({decision:'watch',stage:'lost'}),/competitive_outcome_requires_go/);
});

test('withdrawal requires an explicit decision',()=>{
  assert.throws(()=>normalizePursuitInput({decision:'watch',stage:'withdrawn'}),/closed_stage_requires_decision/);
});
