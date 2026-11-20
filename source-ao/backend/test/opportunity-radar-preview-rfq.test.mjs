import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../../opportunity-radar.js',import.meta.url),'utf8');

function radarLinks(language='pt-AO'){
  const document={
    documentElement:{lang:language},
    querySelector:selector=>selector==='[data-radar-preview]'?{}:null,
    addEventListener(){}
  };
  const window={};
  const instrumented=source.replace(/\}\)\(\);\s*$/, 'window.radarLinks={requestHref,setLanguage(value){lang=value;}}})();');
  vm.runInNewContext(instrumented,{window,document,URLSearchParams,Intl,Date});
  return window.radarLinks;
}

const opportunity={
  title:'Acquisition of construction materials for building maintenance',
  type:'supply-request',
  sector:'building-maintenance-materials',
  location:'Viana, Luanda, Angola',
  reference:'RFQ-2026-041',
  source_url:'https://procurement.example/notice/041',
  deadline:'2026-11-20T12:00:00+01:00'
};

test('Portuguese Radar pre-fills Smart RFQ with public opportunity context and supply category',()=>{
  const links=radarLinks('pt-AO');
  const url=new URL(links.requestHref(opportunity),'https://preview.example');
  assert.equal(url.pathname,'/source-ao/smart-rfq/');
  assert.equal(url.searchParams.get('category'),'industrial-supply');
  assert.equal(url.searchParams.get('request'),opportunity.title);
  assert.equal(url.searchParams.get('location'),opportunity.location);
  assert.match(url.searchParams.get('specification'),/RFQ-2026-041/);
  assert.match(url.searchParams.get('specification'),/procurement\.example/);
});

test('English Radar preserves the English Smart RFQ route when switching language',()=>{
  const links=radarLinks('pt-AO');
  links.setLanguage('en');
  const url=new URL(links.requestHref(opportunity),'https://preview.example');
  assert.equal(url.pathname,'/en/source-ao/smart-rfq/');
  assert.equal(url.searchParams.get('category'),'industrial-supply');
});

test('Radar does not prefill procurement-only private fields',()=>{
  const url=new URL(radarLinks().requestHref(opportunity),'https://preview.example');
  for(const key of ['supplier','supplier_id','purchase_price','margin','private_contact','internal_notes']){
    assert.equal(url.searchParams.has(key),false);
  }
});
