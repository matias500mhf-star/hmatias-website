import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../../data-engine.js',import.meta.url),'utf8');

function jsonResponse(data,ok=true){
  return {ok,json:async()=>data};
}

function runtime({apiBase='https://source-ao-api-staging.example.workers.dev',fetcher}){
  const intervals=[];
  const listeners={};
  const document={
    visibilityState:'visible',
    addEventListener(name,callback){listeners[name]=callback;}
  };
  const window={SOURCE_AO_RUNTIME:{apiBase}};
  const context={
    window,
    document,
    fetch:fetcher,
    setInterval(callback,delay){intervals.push({callback,delay});return intervals.length;},
    console:{warn(){}},
    Date,
    Intl,
    URLSearchParams,
    Set,
    Promise
  };
  vm.runInNewContext(source,context);
  return {api:window.SourceAOData,intervals,listeners,document};
}

const liveCatalog={
  ok:true,
  version:'1.0',
  updated_at:'2026-11-13T20:00:00.000Z',
  items:[{id:'item-live',name:'Live family',category:'construction',aliases:['live'],keywords:[],specification:'Live from D1'}],
  taxonomy:[{id:'construction',name_en:'Construction',name_pt:'Construção',aliases:['obra']}]
};
const staticCatalog={
  version:'0.6',
  updated_at:'2026-09-27T09:15:00+01:00',
  items:[{id:'item-static',name:'Static family',category:'construction',aliases:['static'],keywords:[],specification:'Local fallback'}],
  taxonomy:[{id:'construction',name_en:'Construction',name_pt:'Construção',aliases:['obra']}]
};

test('Source AO homepage prefers the live catalog and schedules five-minute refreshes',async()=>{
  const calls=[];
  const app=runtime({fetcher:async url=>{
    calls.push(url);
    if(String(url).endsWith('/api/catalog'))return jsonResponse(liveCatalog);
    if(String(url)==='data/opportunities.json')return jsonResponse({opportunities:[]});
    if(String(url)==='data/source-registry.json')return jsonResponse({source_types:[],verification_rules:{}});
    if(String(url)==='data/public-catalog.json')return jsonResponse(staticCatalog);
    throw new Error('Unexpected URL '+url);
  }});

  await app.api.init();
  assert.equal(app.api.db().catalog.items[0].id,'item-live');
  assert.equal(app.api.catalogStatus().source,'live');
  assert.equal(app.api.catalogStatus().updated_at,liveCatalog.updated_at);
  assert.equal(calls.some(url=>String(url)==='data/public-catalog.json'),false);
  assert.equal(app.intervals.length,1);
  assert.equal(app.intervals[0].delay,5*60*1000);
});

test('Source AO homepage falls back to the sanitised local catalogue when the API is unavailable',async()=>{
  const calls=[];
  const app=runtime({fetcher:async url=>{
    calls.push(url);
    if(String(url).endsWith('/api/catalog'))return jsonResponse({error:'unavailable'},false);
    if(String(url)==='data/public-catalog.json')return jsonResponse(staticCatalog);
    if(String(url)==='data/opportunities.json')return jsonResponse({opportunities:[]});
    if(String(url)==='data/source-registry.json')return jsonResponse({source_types:[],verification_rules:{}});
    throw new Error('Unexpected URL '+url);
  }});

  await app.api.init();
  assert.equal(app.api.db().catalog.items[0].id,'item-static');
  assert.equal(app.api.catalogStatus().source,'static');
  assert.equal(calls.some(url=>String(url)==='data/public-catalog.json'),true);
});

test('temporary API failure does not overwrite a last-known-good live catalog with stale static data',async()=>{
  let apiAvailable=true;
  let staticReads=0;
  const app=runtime({fetcher:async url=>{
    if(String(url).endsWith('/api/catalog'))return apiAvailable?jsonResponse(liveCatalog):jsonResponse({error:'unavailable'},false);
    if(String(url)==='data/public-catalog.json'){staticReads++;return jsonResponse(staticCatalog);}
    if(String(url)==='data/opportunities.json')return jsonResponse({opportunities:[]});
    if(String(url)==='data/source-registry.json')return jsonResponse({source_types:[],verification_rules:{}});
    throw new Error('Unexpected URL '+url);
  }});

  await app.api.init();
  apiAvailable=false;
  const refreshed=await app.api.refreshCatalog();
  assert.equal(refreshed,false);
  assert.equal(staticReads,0);
  assert.equal(app.api.catalogStatus().source,'live');
  assert.equal(app.api.db().catalog.items[0].id,'item-live');
});
