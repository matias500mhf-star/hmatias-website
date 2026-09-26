import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOpportunityTitle,
  classifyOpportunityText,
  extractReference,
  extractDeadline,
  extractOpportunityLinks
} from '../src/opportunity-pipeline.js';

test('HMATIAS opportunity classifier prioritizes directly relevant work',()=>{
  const clean=classifyOpportunityText('Aquisição de produtos de limpeza e higiene para edifícios');
  assert.equal(clean.type,'supply-request');
  assert.equal(clean.sector,'cleaning-supplies');
  assert.ok(clean.fit_score>=50);
  assert.ok(clean.fit_tags.includes('hmatias-clean'));
  const maintenance=classifyOpportunityText('Manutenção e reparação das instalações eléctricas e ar condicionado');
  assert.equal(maintenance.type,'maintenance');
  assert.ok(maintenance.fit_tags.includes('facilities'));
});

test('opportunity reference and deadline extraction use traceable page text',()=>{
  assert.equal(extractReference('Referência: 196W3/UCP/26'),'196W3/UCP/26');
  const deadline=extractDeadline('Prazo de submissão: 09/10/2026',Date.UTC(2026,8,26));
  assert.match(deadline,/2026-10-09/);
});

test('opportunity link discovery keeps procurement-like links only',()=>{
  const html='<a href="/procedimentos/aquisicao-limpeza">Aquisição de produtos de limpeza</a><a href="/sobre">Sobre nós</a><a href="https://example.com/rfq/123">RFQ manutenção</a>';
  const links=extractOpportunityLinks(html,'https://compras.example.ao/');
  assert.equal(links.length,2);
  assert.ok(links.every(x=>x.url.startsWith('https://')));
});

test('title normalization removes generic procurement noise',()=>{
  assert.equal(normalizeOpportunityTitle('Concurso Público Angola — Reabilitação de Edifício'),'reabilitacao de edificio');
});
