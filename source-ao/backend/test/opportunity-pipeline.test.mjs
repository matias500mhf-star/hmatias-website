import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOpportunityTitle,
  classifyOpportunityText,
  extractReference,
  extractDeadline,
  extractOpportunityLinks,
  extractCpbnBidLinks,
  extractAfdbAngolaLinks,
  extractUngmNoticeLinks,
  normalizeCpbnBidPage,
  normalizeAfdbAngolaPage,
  normalizeUngmNoticePage,
  normalizeWorldBankNotice,
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


test('World Bank Angola adapter builds an official country/deadline query',()=>{
  const url=buildSourceFetchUrl({adapter:'world_bank_angola',source_url:'https://search.worldbank.org/api/v2/procnotices'},Date.UTC(2026,8,28));
  assert.match(url,/project_ctry_name=Angola/);
  assert.match(url,/deadline_strdate=2026-09-28/);
  assert.match(url,/rows=100/);
});

test('World Bank notice becomes an AO candidate and rejects other countries',()=>{
  const source={name:'World Bank — Angola Procurement Notices',source_url:'https://search.worldbank.org/api/v2/procnotices',country_code:'AO',currency_code:'AOA',adapter:'world_bank_angola'};
  const candidate=normalizeWorldBankNotice({
    id:'OP00470001',project_ctry_name:'Angola',project_name:'Water Sector Institutional Development Project',
    notice_type:'Invitation for Bids',notice_title:'Rehabilitation of water supply infrastructure',
    procurement_reference:'AO-WATER-001',noticedate:'27-Sep-2026',submission_deadline_date:'2026-10-20T23:59:00Z',
    notice_text:'Works include rehabilitation, plumbing and hydraulic systems.'
  },source,Date.UTC(2026,8,28));
  assert.equal(candidate.country_code,'AO');
  assert.equal(candidate.reference,'AO-WATER-001');
  assert.match(candidate.source_url,/OP00470001/);
  assert.ok(candidate.fit_tags.includes('construction')||candidate.fit_tags.includes('technical-services'));
  assert.equal(normalizeWorldBankNotice({...candidate,project_ctry_name:'Kenya'},source,Date.UTC(2026,8,28)),null);
});

test('AfDB Angola discovery keeps only relevant Angola procurement links',()=>{
  const html=[
    '<a href="/notice/1">SPN - Angola - Rehabilitation of IDA Offices in Saurimo</a>',
    '<a href="/notice/2">SPN - Kenya - Construction of offices</a>',
    '<a href="/notice/3">SPN - Angola - Consulting services for policy review</a>'
  ].join('');
  const links=extractAfdbAngolaLinks(html,'https://www.afdb.org/en/');
  assert.equal(links.length,1);
  assert.match(links[0].label,/Rehabilitation/i);
});

test('AfDB Angola detail page is normalized only when Angola is evidenced',()=>{
  const source={name:'African Development Bank — Angola SPN',source_url:'https://www.afdb.org/en/documents/category/specific-procurement-notices',country_code:'AO',currency_code:'AOA',adapter:'afdb_angola'};
  const html='<title>SPN - Angola - Construction of EDA Office</title><h1>SPN - Angola - Construction of EDA Office</h1><p>Reference: ERAVCDP/W/02</p><p>Closing date: 20 October 2026</p><p>Construction and rehabilitation works in Angola.</p>';
  const candidate=normalizeAfdbAngolaPage(html,'https://www.afdb.org/en/documents/example',source,Date.UTC(2026,8,28));
  assert.equal(candidate.country_code,'AO');
  assert.equal(candidate.reference,'ERAVCDP/W/02');
  assert.match(candidate.deadline,/2026-10-20/);
  assert.equal(normalizeAfdbAngolaPage(html.replaceAll('Angola','Zambia'),'https://www.afdb.org/en/documents/example',source,Date.UTC(2026,8,28)),null);
});

test('UNGM detail parser is ready but requires explicit Angola beneficiary evidence',()=>{
  const source={name:'UNGM — Angola',source_url:'https://www.ungm.org/Public/Notice',country_code:'AO',currency_code:'AOA',adapter:'ungm_angola'};
  const html='<title>Construction services in Luanda</title><p>Reference: UNDP-AGO-00200</p><p>Beneficiary countries or territories: Angola</p><p>Deadline on: 30-Oct-2026 17:00</p><p>Facilities maintenance and plumbing.</p>';
  const candidate=normalizeUngmNoticePage(html,'https://www.ungm.org/Public/Notice/999999',source,Date.UTC(2026,8,28));
  assert.equal(candidate.country_code,'AO');
  assert.equal(candidate.reference,'UNDP-AGO-00200');
  assert.equal(normalizeUngmNoticePage(html.replace('Angola','Namibia'),'https://www.ungm.org/Public/Notice/999999',source,Date.UTC(2026,8,28)),null);
});

test('UNGM link discovery accepts only notice detail URLs',()=>{
  const html='<a href="/Public/Notice/312134">Angola RFP</a><a href="/Public/Notice">Search</a><a href="/Account/Login">Login</a>';
  const links=extractUngmNoticeLinks(html,'https://www.ungm.org/');
  assert.equal(links.length,1);
  assert.match(links[0].url,/312134/);
});
