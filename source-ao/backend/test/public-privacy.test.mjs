import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import router from '../src/router.js';
import core from '../src/index.js';
import {copyPublicData,PUBLIC_DATA_FILES} from '../scripts/public-data.mjs';

const secretName='PRIVATE_SUPPLIER_SENTINEL';
const secretUrl='https://private-supplier.example';
const secretEmail='buying-channel@example.invalid';
const forbidden=new Set(['supplier','supplier_id','supplier_name','supplier_candidates','website','phone','whatsapp','email','contact','fast_path','price','price_reported','quantity_reported','capabilities','contactable_candidates']);
function assertPublic(value){
  const text=JSON.stringify(value);
  for(const sentinel of [secretName,secretUrl,secretEmail,'123456789']) assert.ok(!text.includes(sentinel),sentinel);
  function visit(node){
    if(!node||typeof node!=='object')return;
    for(const [key,child] of Object.entries(node)){assert.ok(!forbidden.has(key),`private field ${key}`);visit(child);}
  }
  visit(value);
}

function fixture(t){
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());
  db.exec(`
    CREATE TABLE items(id TEXT,name TEXT,category TEXT,specification TEXT,unit TEXT,search_text TEXT);
    CREATE TABLE suppliers(id TEXT,name TEXT,location TEXT,website TEXT,public_status TEXT,last_verified_at TEXT,categories_json TEXT,capabilities_json TEXT,phone TEXT,whatsapp TEXT,email TEXT);
    CREATE TABLE observations(id TEXT,item_id TEXT,supplier_id TEXT,approved_at TEXT,verification_status TEXT,quantity_reported REAL,price_reported REAL,currency TEXT,location TEXT,verified_at TEXT,expires_at TEXT,source_type TEXT);
    CREATE TABLE service_providers(id TEXT,name TEXT,service_category TEXT,specialties_json TEXT,location TEXT,website TEXT,verification_status TEXT,last_verified_at TEXT,search_text TEXT);
  `);
  const now=new Date().toISOString(),future=new Date(Date.now()+3600000).toISOString();
  db.prepare('INSERT INTO items VALUES (?,?,?,?,?,?)').run('item-packaging-strapping','PP strapping','industrial-supply','9 mm','roll','cinta pp 9mm');
  db.prepare('INSERT INTO items VALUES (?,?,?,?,?,?)').run('item-unknown','PP strapping 12 mm','industrial-supply','12 mm','roll','cinta pp 12mm');
  for(const id of ['private-supplier-1','private-supplier-2']) db.prepare('INSERT INTO suppliers VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,secretName,'Luanda',secretUrl,'source_checked',now,'["industrial-supply"]','["polypropylene packaging"]','123456789','123456789',secretEmail);
  db.prepare('INSERT INTO observations VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run('private-observation','item-packaging-strapping','private-supplier-1',now,'in_stock_confirmed',15,123456789,'AOA','Luanda',now,future,'direct_supplier_confirmation');
  for(const id of ['private-service-1','private-service-2']) db.prepare('INSERT INTO service_providers VALUES (?,?,?,?,?,?,?,?,?)').run(id,secretName,'hvac','["AVAC"]','Luanda',secretUrl,'supplier_confirmed',now,'manutencao avac');
  return {
    SOURCE_AO_ENV:'test',ADMIN_API_TOKEN:'test-admin-token',
    SOURCE_AO_DB:{
      prepare(sql){
        const stmt=db.prepare(sql);
        return {bind(...args){
          return {all:async()=>({results:stmt.all(...args)}),first:async()=>stmt.get(...args)};
        }};
      }
    }
  };
}

test('current and legacy search routes conceal supplier identity and cost, preserving availability and dates',async t=>{
  const env=fixture(t);
  for(const api of [router,core]){
    const response=await api.fetch(new Request('https://source.example/api/search?q=cinta%20PP%209mm&location=Luanda'),env);
    assert.equal(response.status,200);const data=await response.json();assertPublic(data);
    assert.equal(data.results[0].status,'in_stock_confirmed');
    assert.equal(data.results[0].specification,'9 mm');
    assert.ok(data.results[0].verified_at&&data.results[0].expires_at);
  }
});

test('unconfirmed products do not disclose a supplier shortlist; service matches aggregate by category',async t=>{
  const env=fixture(t);
  const item=await router.fetch(new Request('https://source.example/api/search?q=cinta%20PP%2012mm'),env).then(r=>r.json());
  assertPublic(item);assert.equal(item.results.length,1);assert.equal(item.results[0].status,'discovered');
  const services=await router.fetch(new Request('https://source.example/api/search?q=manutencao'),env).then(r=>r.json());
  assertPublic(services);assert.equal(services.results.length,1);
  assert.equal(services.results[0].category,'hvac');assert.equal(services.results[0].status,'source_checked');
});

test('public procurement remains anonymous even with an admin header; the protected route retains operational detail',async t=>{
  const env=fixture(t);const query='?q=cinta%20PP%209mm&location=Luanda&quantity=2';
  for(const headers of [{},{authorization:'Bearer '+env.ADMIN_API_TOKEN}]){
    const response=await router.fetch(new Request('https://source.example/api/procurement-mission'+query,{headers}),env);
    assert.equal(response.status,200);const data=await response.json();assertPublic(data);
    assert.equal(data.mission.exact_matches[0].status,'in_stock_confirmed');
    assert.equal(data.mission.requirement.quantity,2);assert.match(data.mission.rfq.pt,/9mm/);
  }
  for(const headers of [{},{authorization:'Bearer wrong-token'}]){
    const response=await router.fetch(new Request('https://source.example/api/admin/procurement-mission'+query,{headers}),env);
    assert.equal(response.status,401);
  }
  const response=await router.fetch(new Request('https://source.example/api/admin/procurement-mission'+query,{headers:{authorization:'Bearer '+env.ADMIN_API_TOKEN}}),env);
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.mission.exact_matches[0].supplier.email,secretEmail);
  assert.equal(data.mission.exact_matches[0].price.amount,123456789);
  assert.equal(data.mission.supplier_candidates[0].name,secretName);
});

test('public static build and offline search require only catalogue, opportunity and verification policy data',async t=>{
  const out=await mkdtemp(path.join(tmpdir(),'source-ao-public-'));t.after(()=>rm(out,{recursive:true,force:true}));
  await copyPublicData(out);
  assert.deepEqual((await readdir(out)).sort(),[...PUBLIC_DATA_FILES].sort());
  const requests=[];
  const context={window:{},console,fetch:async url=>{
    requests.push(url);assert.ok(PUBLIC_DATA_FILES.includes(url.replace('data/','')));
    return {ok:true,json:async()=>JSON.parse(await readFile(path.join(out,url.replace('data/','')),'utf8'))};
  }};
  vm.runInNewContext(await readFile(new URL('../../data-engine.js',import.meta.url),'utf8'),context);
  await context.window.SourceAOData.init();
  assert.equal(requests.length,3);
  const result=context.window.SourceAOData.search('cinta PP 9mm','Luanda');
  assert.ok(result.matches.length>0);assertPublic(result);
  assert.ok(result.matches.every(row=>row.status==='discovered'));
  assert.ok(context.window.SourceAOData.activeOpportunities().length>=0);
});
