import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mapPublicItemRow,publicSearch} from '../src/public-search.js';
import {normalizeSearch} from '../src/index.js';
import masterCatalog from '../../data/catalog.json' with {type:'json'};

const base={
  item_id:'item_1',
  item_name:'PVC Pipe 110 mm',
  category:'construction',
  specification:'110 mm',
  unit:'unit',
  supplier_id:'sup_1',
  supplier_name:'Supplier Test',
  supplier_location:'Luanda',
  supplier_website:'https://supplier.example',
  observation_id:'obs_1',
  verification_status:'in_stock_confirmed',
  quantity_reported:5,
  price_reported:1000,
  currency:'AOA',
  source_type:'direct_supplier_confirmation',
  verified_at:'2026-09-22T10:00:00.000Z'
};

test('expired confirmed observation becomes needs_reconfirmation, not discovered',()=>{
  const now=Date.parse('2026-09-23T00:00:00.000Z');
  const result=mapPublicItemRow({...base,expires_at:'2026-09-22T23:00:00.000Z'},now);
  assert.equal(result.status,'needs_reconfirmation');
  assert.equal(result.verification.source_type,'direct_supplier_confirmation');
  assert.equal(Object.hasOwn(result.verification,'supplier_id'),false);
  assert.equal(result.verified_at,'2026-09-22T10:00:00.000Z');
});

test('current confirmed observation keeps freshness without exposing the buying channel or purchase price',()=>{
  const now=Date.parse('2026-09-22T12:00:00.000Z');
  const result=mapPublicItemRow({...base,expires_at:'2026-09-23T12:00:00.000Z'},now);
  assert.equal(result.status,'in_stock_confirmed');
  assert.equal(Object.hasOwn(result,'supplier'),false);
  assert.equal(Object.hasOwn(result,'price'),false);
  assert.equal(Object.hasOwn(result,'quantity_reported'),false);
  assert.equal(result.verification.source_type,'direct_supplier_confirmation');
  assert.equal(Object.prototype.hasOwnProperty.call(result,'evidence_reference'),false);
  assert.equal(JSON.stringify(result).includes('verification_request:'),false);
  assert.equal(JSON.stringify(result).includes('Supplier Test'),false);
  assert.equal(JSON.stringify(result).includes('supplier.example'),false);
});

test('item with no approved observation remains discovered',()=>{
  const result=mapPublicItemRow({
    item_id:'item_2',item_name:'Unknown Item',category:'general',specification:null,unit:null,
    supplier_id:null,observation_id:null,verification_status:null,verified_at:null,expires_at:null,
    quantity_reported:null,price_reported:null,currency:null
  });
  assert.equal(result.status,'discovered');
  assert.equal(result.verification,null);
});


test('public search resolves exact Carbodiam 115 mm references without implying Luanda stock',async()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE items(id TEXT,name TEXT,category TEXT,specification TEXT,unit TEXT,search_text TEXT,public_visible INTEGER);
    CREATE TABLE suppliers(id TEXT,location TEXT);
    CREATE TABLE observations(id TEXT,supplier_id TEXT,item_id TEXT,approved_at TEXT,location TEXT,
      verification_status TEXT,verified_at TEXT,expires_at TEXT,source_type TEXT);
    CREATE TABLE service_providers(service_category TEXT,last_verified_at TEXT,search_text TEXT,location TEXT);
  `);
  const products=masterCatalog.items.filter(row=>['item-carbodiam-pantera-115','item-carbodiam-pantera-neutre-115','item-carbodiam-crack-chaser-115'].includes(row.id));
  const exactSkus=masterCatalog.items.filter(row=>row.id.startsWith('item-carbodiam-sku-'));
  assert.equal(exactSkus.length,46,'the catalogue must contain 46 exact Carbodiam factory references across the seven indexed disc families');
  const sampleFamilies=[
    'item-disc-family-carbodiam-acier',
    'item-crown-family-carbodiam-profor',
    'item-synvor-diamond-grinding-cups',
    'item-weka-dk17',
    'item-carbodiam-multicut-400p'
  ].map(id=>masterCatalog.items.find(row=>row.id===id));
  assert.equal(masterCatalog.items.filter(row=>row.id.startsWith('item-disc-family-')).length,8,'the catalogue must include the eight SYNVOR-featured disc families');
  assert.equal(masterCatalog.items.filter(row=>row.id.startsWith('item-crown-family-')).length,33,'the catalogue must include all 33 publicly listed crown families');
  assert.ok(sampleFamilies.every(Boolean),'disc, crown, grinding, WEKA and saw models must exist in the canonical catalogue');
  assert.equal(products.length,3,'the canonical catalogue must contain the three published 115 mm references');
  for(const item of [...products,...exactSkus,...sampleFamilies,masterCatalog.items.find(row=>row.id==='item-diamond-tools')]){
    assert.ok(item);
    const searchText=normalizeSearch([item.name,item.name_pt,item.specification,...item.aliases,...item.keywords].join(' '));
    db.prepare('INSERT INTO items VALUES(?,?,?,?,?,?,?)').run(item.id,item.name,item.category,item.specification,'un',searchText,1);
  }
  db.prepare('INSERT INTO items VALUES(?,?,?,?,?,?,?)').run('item-private','Disco diamantado privado','diamond-tools','Registo privado','un','discos diamantados 115mm 9193',0);
  db.prepare('INSERT INTO suppliers VALUES(?,?)').run('sup-synvor-industrial','Portugal');
  for(const item of [...products,...exactSkus,...sampleFamilies]){
    db.prepare('INSERT INTO observations VALUES(?,?,?,?,?,?,?,?,?)').run(
      'obs-'+item.id,'sup-synvor-industrial',item.id,'2026-11-14T12:00:00+01:00','Portugal',
      'source_checked','2026-11-14T12:00:00+01:00','2026-11-21T12:00:00+01:00','supplier_official_channel'
    );
  }
  const adapter={
    prepare(sql){
      return {bind(...values){return {async all(){return {results:db.prepare(sql).all(...values)}}};}};
    }
  };
  const luanda=await publicSearch(new Request('https://api.test/api/search?q='+encodeURIComponent('discos diamantados 115 mm')+'&location=Luanda'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const localBody=await luanda.json();
  const expectedIds=products.map(x=>x.id).sort();
  const matchedIds=localBody.results.filter(x=>expectedIds.includes(x.id)).map(x=>x.id).sort();
  assert.deepEqual(matchedIds,expectedIds);
  assert.ok(localBody.results.some(row=>row.id==='item-diamond-tools'));
  for(const row of localBody.results.filter(x=>expectedIds.includes(x.id))){
    assert.equal(row.status,'discovered','Portugal catalogue records must not imply stock in Luanda');
    for(const key of ['supplier','price','quantity_reported','evidence_reference']) assert.equal(Object.hasOwn(row,key),false);
  }
  const exact=await publicSearch(new Request('https://api.test/api/search?q=9193&location=Portugal'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const exactBody=await exact.json();
  const pantera=exactBody.results.find(row=>row.id==='item-carbodiam-pantera-115');
  assert.ok(pantera,'factory reference 9193 must resolve to the exact PANTERA product');
  assert.equal(pantera.status,'source_checked');
  assert.equal(pantera.verification.source_type,'supplier_official_channel');
  assert.equal(pantera.verification.verified_at,'2026-11-14T12:00:00+01:00');
  assert.equal(Object.hasOwn(pantera,'supplier'),false);
  assert.equal(Object.hasOwn(pantera,'price'),false);
  const exactReference=await publicSearch(new Request('https://api.test/api/search?q=19722&location=Portugal'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const exactRefBody=await exactReference.json();
  const betonSku=exactRefBody.results.find(row=>row.id==='item-carbodiam-sku-beton-beton-400-ref-19722');
  assert.ok(betonSku,'factory reference 19722 must resolve to its exact BETON Ø400 SKU');
  assert.equal(betonSku.status,'source_checked');
  const exactInAngola=await publicSearch(new Request('https://api.test/api/search?q=19722&location=Luanda'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const angolaSku=(await exactInAngola.json()).results.find(row=>row.id==='item-carbodiam-sku-beton-beton-400-ref-19722');
  assert.equal(angolaSku.status,'discovered','Portugal catalogue references must not imply stock in Luanda');

  const profor=await publicSearch(new Request('https://api.test/api/search?q='+encodeURIComponent('coroa diamantada PROFOR')+'&location=Portugal'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const proforBody=await profor.json();
  const proforRow=proforBody.results.find(row=>row.id==='item-crown-family-carbodiam-profor');
  assert.ok(proforRow,'Carbodiam PROFOR crown family must be searchable by model');
  assert.equal(proforRow.status,'source_checked');
  const cups=await publicSearch(new Request('https://api.test/api/search?q='+encodeURIComponent('copos de desbaste diamantados')+'&location=Luanda'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const cupsBody=await cups.json();
  const cupsRow=cupsBody.results.find(row=>row.id==='item-synvor-diamond-grinding-cups');
  assert.ok(cupsRow,'diamond grinding cups must be searchable');
  assert.equal(cupsRow.status,'discovered','Portugal product family must not imply stock in Luanda');
  const weka=await publicSearch(new Request('https://api.test/api/search?q='+encodeURIComponent('WEKA DK17')+'&location=Portugal'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const wekaBody=await weka.json();
  assert.ok(wekaBody.results.some(row=>row.id==='item-weka-dk17'),'WEKA model search must find its exact machine record');
  for(const query of ['coroas diamantadas','copos de desbaste diamantados']){
    const followUp=await publicSearch(new Request('https://api.test/api/search?q='+encodeURIComponent(query)+'&location=Luanda'),{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
    const followUpBody=await followUp.json();
    assert.ok(followUpBody.results.some(row=>row.id==='item-diamond-tools'),query+' should resolve to canonical diamond tools family');
  }
  db.close();
});
