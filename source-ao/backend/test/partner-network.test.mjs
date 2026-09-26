import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreCommercialPartner} from '../src/partner-network.js';

const partner=(overrides={})=>({
  id:'partner-test',
  name:'Partner Test',
  country_code:'AO',
  partner_type:'subcontractor',
  relationship_stage:'approved',
  capabilities:['drywall','painting','interior-finishes'],
  sectors:['construction','interiors'],
  ...overrides
});

test('construction opportunity matches relevant subcontractor capabilities',()=>{
  const result=scoreCommercialPartner({
    title:'Reabilitação e pintura de edifício',
    sector:'construction',
    type:'tender',
    country_code:'AO',
    scope_summary:'Civil works, painting and interior finishes.'
  },partner());
  assert.ok(result.score>=60);
  assert.ok(result.matched_capabilities.includes('painting'));
  assert.ok(result.reasons.includes('same-market'));
});

test('cleaning opportunity prioritizes cleaning service provider',()=>{
  const result=scoreCommercialPartner({
    title:'Serviços de limpeza e higienização',
    sector:'facilities',
    type:'maintenance',
    country_code:'AO'
  },partner({
    partner_type:'service_provider',
    capabilities:['cleaning','hygiene','facility-cleaning'],
    sectors:['facilities']
  }));
  assert.ok(result.score>=70);
  assert.ok(result.reasons.includes('cleaning'));
  assert.ok(result.reasons.includes('execution'));
});

test('cross-border opportunity records review signal instead of pretending local eligibility',()=>{
  const result=scoreCommercialPartner({
    title:'Supply of PPE',
    sector:'supply-procurement',
    type:'supply-request',
    country_code:'NA'
  },partner({
    partner_type:'supplier',
    capabilities:['ppe','epi','equipment'],
    sectors:['supply-procurement']
  }));
  assert.ok(result.score>=40);
  assert.ok(result.reasons.includes('cross-border-review'));
  assert.ok(!result.reasons.includes('same-market'));
});

test('unrelated partner remains below match threshold baseline',()=>{
  const result=scoreCommercialPartner({
    title:'Payroll outsourcing services',
    sector:'human-resources',
    type:'tender',
    country_code:'AO'
  },partner());
  assert.ok(result.score<30);
});
