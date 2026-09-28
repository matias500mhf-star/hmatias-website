import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOpportunityTitle,
  classifyOpportunityText,
  extractReference,
  extractDeadline,
  extractOpportunityLinks,
  extractCpbnBidLinks,
  normalizeCpbnBidPage,
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
  const plumbing=classifyOpportunityText('Serviços de canalização e hidráulica predial');
  assert.equal(plumbing.sector,'technical-maintenance');
  assert.ok(plumbing.fit_score>=50);
  assert.ok(plumbing.fit_tags.includes('technical-services'));
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

test('opportunity link discovery includes plumbing, facilities and technical works',()=>{
  const html=[
    '<a href="/servicos/canalizacao">Serviços de canalização predial</a>',
    '<a href="/facilities/gestao">Facilities para edifícios</a>',
    '<a href="/infraestrutura/hidraulica">Infraestrutura hidráulica</a>',
    '<a href="/institucional">Institucional</a>'
  ].join('');
  const links=extractOpportunityLinks(html,'https://compras.example.ao/');
  assert.equal(links.length,3);
  assert.ok(links.some(x=>/canalizacao/.test(x.url)));
  assert.ok(links.some(x=>/facilities/.test(x.url)));
  assert.ok(links.some(x=>/hidraulica/.test(x.url)));
});

test('title normalization removes generic procurement noise',()=>{
  assert.equal(normalizeOpportunityTitle('Concurso Público Angola — Reabilitação de Edifício'),'reabilitacao de edificio');
});

test('Namibia CPBN adapter discovers bid detail links even when anchor text is generic',()=>{
  const html='<h4>Provision of landscaping and garden services: NCS/OAB/CPBN-05/2026</h4><a href="/index/bid/120">More Details</a><h4>Supply and delivery of vehicles: G/ONB/CPBN-11/2026</h4><a href="/index/bid/121">More Details</a><a href="/index/external/8">Awards</a>';
  const links=extractCpbnBidLinks(html,'https://www.cpbn.com.na/index/external/2');
  assert.equal(links.length,2);
  assert.equal(links[0].url,'https://www.cpbn.com.na/index/bid/120');
  assert.match(links[0].label,/landscaping/i);
});

test('Namibia CPBN bid detail page becomes a structured NA/NAD candidate',()=>{
  const source={name:'Central Procurement Board of Namibia — Open Bids',source_url:'https://www.cpbn.com.na/index/external/2',country_code:'NA',currency_code:'NAD',adapter:'cpbn_namibia'};
  const html='<h1>Bid Details</h1><div>Category: Works</div><div>Institution: University of Namibia</div><div>Description of the Bid: Procurement for the Provision of Landscaping and Garden Services for a Period of Three (3) Years.</div><div>Procurement Reference Number: NCS/OAB/CPBN-05/2026</div><div>Bid Document Price: N$300.00</div><div>Address for the Collection & Submission of Documents: CPBN, Windhoek, Namibia</div><div>Date of Issue: 4th September, 2026</div><div>Closing Date and Time: 8th October, 2026 11:00</div><div>Non-compulsory Pre-Bid Meeting/Site Visit: 25 September 2026 at 10H00, Windhoek</div><h3>Documents</h3>';
  const candidate=normalizeCpbnBidPage(html,'https://www.cpbn.com.na/index/bid/120',source,Date.UTC(2026,8,27));
  assert.equal(candidate.country_code,'NA');
  assert.equal(candidate.currency_code,'NAD');
  assert.equal(candidate.issuer,'University of Namibia');
  assert.equal(candidate.reference,'NCS/OAB/CPBN-05/2026');
  assert.equal(candidate.deadline,'2026-10-08T09:00:00.000Z');
  assert.match(candidate.scope_summary,/N\$300\.00/);
  assert.match(candidate.scope_summary,/Pre-bid\/site visit/i);
});
