import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mapPublicItemRow,publicSearch} from '../src/public-search.js';

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


test('public catalogue search matches Portuguese plural queries against singular D1 records',async()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE items(id TEXT,name TEXT,category TEXT,specification TEXT,unit TEXT,search_text TEXT);
    CREATE TABLE suppliers(id TEXT,location TEXT);
    CREATE TABLE observations(id TEXT,supplier_id TEXT,item_id TEXT,approved_at TEXT,location TEXT,
      verification_status TEXT,verified_at TEXT,expires_at TEXT,source_type TEXT);
    CREATE TABLE service_providers(service_category TEXT,last_verified_at TEXT,search_text TEXT,location TEXT);
  `);
  db.prepare('INSERT INTO items VALUES(?,?,?,?,?,?)').run(
    'item-diamond','Disco diamantado 115 mm','diamond-tools','115 mm · segmento turbo','un','disco diamantado 115mm synvor'
  );
  db.prepare('INSERT INTO items VALUES(?,?,?,?,?,?)').run(
    'item-unrelated','Disco de corte 115 mm','tools-equipment','115 mm','un','disco corte 115mm'
  );
  const adapter={
    prepare(sql){
      return {bind(...values){return {async all(){return {results:db.prepare(sql).all(...values)}}};}};
    }
  };
  const request=new Request('https://api.test/api/search?q=discos%20diamantados%20115%20mm&location=Luanda');
  const response=await publicSearch(request,{SOURCE_AO_DB:adapter,PUBLIC_ORIGIN:'https://preview.example'});
  const body=await response.json();
  assert.equal(response.status,200);
  assert.deepEqual(body.results.map(row=>row.id),['item-diamond']);
  assert.equal(body.results[0].status,'discovered');
  assert.equal(body.results[0].category,'diamond-tools');
  assert.equal(Object.hasOwn(body.results[0],'supplier'),false);
  assert.equal(Object.hasOwn(body.results[0],'price'),false);
  assert.equal(Object.hasOwn(body.results[0],'quantity_reported'),false);
  db.close();
});
