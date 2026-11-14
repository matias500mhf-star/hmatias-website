import test from 'node:test';
import assert from 'node:assert/strict';
import {listPublicCatalog,listAdminCatalog,updateCatalogItem} from '../src/catalog.js';
import core from '../src/index.js';

function databaseMock({items=[],item=null}={}){
  return {
    prepare(sql){
      return {
        all:async()=>({results:items}),
        bind(...values){
          return {
            first:async()=>item,
            run:async()=>({success:true,meta:{changes:1},values})
          };
        }
      };
    }
  };
}

test('public catalog exposes only explicitly visible items and never the excluded chemical',async()=>{
  const env={PUBLIC_ORIGIN:'https://preview.example',SOURCE_AO_DB:databaseMock({items:[
    {id:'item-a',name:'Paint',name_pt:'Tinta',category:'construction',aliases_json:'["paint"]',keywords_json:'["obra"]',public_visible:1,updated_at:'2026-11-13 10:00:00'},
    {id:'item-formaldehyde',name:'Formaldehyde',name_pt:'Formaldeído',category:'industrial-supply',aliases_json:'[]',keywords_json:'[]',public_visible:0,updated_at:'2026-11-13 10:00:00'}
  ]})};
  const response=await listPublicCatalog(new Request('https://api.example/api/catalog'),env);
  const body=await response.json();

  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'public, max-age=300, stale-while-revalidate=300');
  assert.equal(response.headers.get('access-control-allow-origin'),'https://preview.example');
  assert.equal(body.ok,true);
  assert.equal(body.items.length,1);
  assert.equal(body.items[0].name_pt,'Tinta');
  assert.equal(body.items.some(item=>item.id==='item-formaldehyde'),false);
  assert.ok(Array.isArray(body.taxonomy));
  assert.ok(body.taxonomy.some(row=>row.id==='construction'));
  assert.match(body.public_rule,/Prices, suppliers, stock, availability and internal commercial data are not included/);
  assert.equal(body.version,'0.8');
  assert.equal('public_visible' in body.items[0],false);
  assert.equal('updated_at' in body.items[0],false);
  assert.equal('price' in body.items[0],false);
});

test('public catalog fails closed when the database is unavailable',async()=>{
  const response=await listPublicCatalog(new Request('https://api.example/api/catalog'),{});
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{ok:false,error:{code:'catalog_unavailable'}});
});

test('catalog administration requires an authenticated user',async()=>{
  const env={SOURCE_AO_DB:databaseMock()};
  const response=await listAdminCatalog(new Request('https://api.example/api/admin/catalog/items'),env);
  assert.equal(response.status,401);
});

test('catalog update validates data and requires admin authentication',async()=>{
  const current={id:'item-a',name:'Paint',name_pt:'Tinta',category:'construction',specification:'Base',unit:'un',aliases_json:'[]',keywords_json:'[]',public_visible:0};
  const env={ADMIN_API_TOKEN:'a'.repeat(40),SOURCE_AO_DB:databaseMock({item:current})};
  const response=await updateCatalogItem(new Request('https://api.example/api/admin/catalog/items/item-a',{
    method:'PATCH',
    headers:{authorization:'Bearer '+'a'.repeat(40),'content-type':'application/json'},
    body:JSON.stringify({name_pt:'Tinta profissional',public_visible:true,aliases:['tinta']})
  }),env,'item-a');
  const body=await response.json();

  assert.equal(response.status,200);
  assert.equal(body.item.public_visible,true);
  assert.equal(body.item.name_pt,'Tinta profissional');
  assert.deepEqual(body.item.aliases,['tinta']);
});

test('catalog administration accepts specialised D1 catalogue categories',async()=>{
  const env={ADMIN_API_TOKEN:'a'.repeat(40),SOURCE_AO_DB:databaseMock({item:{
    id:'item-special',name:'Special item',name_pt:'Artigo especial',category:'industrial-supply',
    specification:'',unit:'un',aliases_json:'[]',keywords_json:'[]',public_visible:1
  }})};

  for(const category of ['diamond-tools','measurement-instruments']){
    const response=await updateCatalogItem(new Request('https://api.example/api/admin/catalog/items/item-special',{
      method:'PATCH',
      headers:{authorization:'Bearer '+'a'.repeat(40),'content-type':'application/json'},
      body:JSON.stringify({category})
    }),env,'item-special');
    assert.equal(response.status,200);
    assert.equal((await response.json()).item.category,category);
  }
});

test('excluded item can never be published even by an administrator',async()=>{
  const current={id:'item-formaldehyde',name:'Formaldehyde',name_pt:'Formaldeído',category:'industrial-supply',specification:'',unit:'',aliases_json:'[]',keywords_json:'[]',public_visible:0};
  const env={ADMIN_API_TOKEN:'a'.repeat(40),SOURCE_AO_DB:databaseMock({item:current})};
  const response=await updateCatalogItem(new Request('https://api.example/api/admin/catalog/items/item-formaldehyde',{
    method:'PATCH',
    headers:{authorization:'Bearer '+'a'.repeat(40),'content-type':'application/json'},
    body:JSON.stringify({public_visible:true})
  }),env,'item-formaldehyde');
  const body=await response.json();

  assert.equal(response.status,400);
  assert.equal(body.error.code,'item_not_publishable');
});

test('catalog editing preflight explicitly allows the PATCH method',async()=>{
  const env={PUBLIC_ORIGIN:'https://preview.example'};
  const response=await core.fetch(new Request('https://api.example/api/admin/catalog/items/item-a',{
    method:'OPTIONS',
    headers:{
      origin:'https://preview.example',
      'access-control-request-method':'PATCH',
      'access-control-request-headers':'authorization,content-type'
    }
  }),env);

  assert.equal(response.status,204);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://preview.example');
  assert.match(response.headers.get('access-control-allow-methods')||'',/PATCH/);
  assert.match(response.headers.get('access-control-allow-headers')||'',/authorization/i);
});
