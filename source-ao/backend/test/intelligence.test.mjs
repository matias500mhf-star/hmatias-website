import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOpportunityIntelligence,buildCopilotBrief} from '../src/intelligence.js';

const clock=Date.UTC(2026,8,26,12,0,0);

test('intelligence core produces explainable fit and confidence scores',()=>{
  const record={
    id:'opp-test',
    title:'Aquisição de materiais para manutenção de edifícios em Luanda',
    sector:'supply-procurement',
    opportunity_type:'supply-request',
    location:'Luanda, Angola',
    issuer:'Faculdade de Direito',
    reference:'PROC/2026/17',
    deadline:'2026-10-09T23:59:59Z',
    source_url:'https://example.ao/proc/17',
    source_checked_at:'2026-09-26T10:00:00Z',
    scope_summary:'Fornecimento de materiais e acessórios destinados à manutenção predial.',
    fit_score:82,
    fit_tags:['supply','facilities'],
    source_name:'Portal oficial'
  };
  const result=buildOpportunityIntelligence(record,{clock});
  assert.ok(result.fit_score>=75);
  assert.ok(result.confidence_score>=80);
  assert.equal(result.recommended_action,'direct_bid');
  assert.equal(typeof result.breakdown.service_fit,'number');
  assert.ok(result.next_actions.length>=3);
});

test('large multidisciplinary opportunity shifts recommendation toward partnership',()=>{
  const record={
    id:'opp-large',
    title:'Concepção e construção das infraestruturas básicas de plataforma logística',
    sector:'construction',
    opportunity_type:'tender',
    location:'Angola',
    issuer:'Entidade Pública',
    reference:'TENDER/88/2026',
    deadline:'2026-10-20T23:59:59Z',
    source_url:'https://example.ao/tender/88',
    source_checked_at:'2026-09-26T10:00:00Z',
    scope_summary:'Design and build covering civil, hydraulic, electrical and ICT disciplines.',
    fit_score:78,
    fit_tags:['construction'],
    source_name:'Portal oficial'
  };
  const result=buildOpportunityIntelligence(record,{clock});
  assert.equal(result.complexity.large,true);
  assert.equal(result.recommended_action,'partnership');
});

test('copilot brief exposes operational commands without claiming eligibility',()=>{
  const record={
    id:'opp-review',
    title:'Serviços de manutenção',
    sector:'facilities-maintenance',
    opportunity_type:'maintenance',
    location:'Luanda',
    issuer:'Cliente',
    deadline:'2026-10-04T23:59:59Z',
    source_url:'https://example.ao/maintenance',
    source_checked_at:'2026-09-26T10:00:00Z',
    scope_summary:'Manutenção predial.',
    fit_score:88,
    source_name:'Portal'
  };
  const intelligence=buildOpportunityIntelligence(record,{clock});
  const brief=buildCopilotBrief(record,intelligence);
  assert.equal(brief.title,'SOURCE Copilot');
  assert.ok(brief.executive_summary.includes('/100'));
  assert.ok(brief.commands.some(x=>x.id==='find_suppliers'));
});
