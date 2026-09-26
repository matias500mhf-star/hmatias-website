import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOpportunityTitle,
  classifyOpportunityText,
  extractReference,
  extractDeadline,
  extractOpportunityLinks,
  normalizeOcdsRelease,
  buildSourceFetchUrl
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

test('English closing dates from Namibia retain the local UTC+2 deadline',()=>{
  const deadline=extractDeadline('Closing Date and Time: 8th October, 2026 11:00',Date.UTC(2026,8,26),'+02:00');
  assert.equal(deadline,'2026-10-08T09:00:00.000Z');
});

test('South Africa OCDS releases become ZA/ZAR candidates',()=>{
  const source={name:'South Africa National Treasury — eTenders OCDS',source_url:'https://ocds-api.etenders.gov.za/api/OCDSReleases',country_code:'ZA',currency_code:'ZAR',adapter:'ocds_etenders_za'};
  const candidate=normalizeOcdsRelease({
    ocid:'ocds-9t57fa-999999',
    date:'2026-09-25T08:00:00Z',
    buyer:{name:'Public Works'},
    tender:{id:'PW-01-2026',title:'Facilities maintenance services',status:'active',tenderPeriod:{endDate:'2026-10-15T11:00:00+02:00'}}
  },source,Date.UTC(2026,8,26));
  assert.equal(candidate.country_code,'ZA');
  assert.equal(candidate.currency_code,'ZAR');
  assert.equal(candidate.reference,'PW-01-2026');
  assert.match(candidate.source_url,/ocds-9t57fa-999999/);
});

test('South Africa adapter builds a rolling seven-day OCDS query',()=>{
  const url=buildSourceFetchUrl({adapter:'ocds_etenders_za',source_url:'https://ocds-api.etenders.gov.za/api/OCDSReleases'},Date.UTC(2026,8,26));
  assert.match(url,/dateFrom=2026-09-19/);
  assert.match(url,/dateTo=2026-09-26/);
  assert.match(url,/PageNumber=1/);
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
