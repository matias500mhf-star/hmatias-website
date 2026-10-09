import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverExternalSuppliers,validateDiscoveryInput,normalizeBraveResults} from '../src/external-supplier-discovery.js';

const makeRequest=(body,token='correct')=>new Request('https://example.test/api/admin/supplier-discovery',{
  method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},
  body:JSON.stringify(body)
});
function env(overrides={}){
  let requests=0;
  return {
    ADMIN_API_TOKEN:'correct',SOURCE_AO_AI_PILOT_ENABLED:'true',
    BRAVE_SEARCH_API_KEY:'brave-secret',SOURCE_AO_DISCOVERY_DAILY_LIMIT:'2',
    SOURCE_AO_DB:{prepare(){return {bind(){return {async first(){requests+=1;return requests<=2?{requests}:null;}};}};}},
    ...overrides
  };
}
const bravePayload={
  web:{results:[
    {title:'Industrial supply listing',url:'https://supply.example/catalogue/pp-strap',description:'Packaging and strapping catalogue'},
    {title:'Duplicate',url:'https://supply.example/catalogue/pp-strap',description:'Repeated'},
    {title:'Untrusted protocol',url:'javascript:alert(1)',description:'Unsafe'}
  ]}
};
const fetchSearch=async url=>{
  assert.match(String(url),/^https:\/\/api.search.brave.com\/res\/v1\/web\/search/);
  return {ok:true,async json(){return bravePayload;}};
};
test('validates market codes and exact technical query text',()=>{
  assert.deepEqual(validateDiscoveryInput({query:'  PP cinta 9mm  ',markets:['AO','NA']}),{query:'PP cinta 9mm',markets:['AO','NA']});
  assert.throws(()=>validateDiscoveryInput({query:'PVC',markets:['XX']}),/invalid_markets/);
  assert.throws(()=>validateDiscoveryInput({query:'PVC',markets:['AO','AO']}),/invalid_markets/);
  assert.throws(()=>validateDiscoveryInput({query:'x'}),/invalid_query/);
});
test('never treats a search result as confirmed product or stock',()=>{
  const res=normalizeBraveResults(bravePayload,'AO');
  assert.equal(res.length,2);
  assert.equal(res[0].evidence_status,'web_candidate_only');
  assert.equal(res[0].product_confirmed,false);
  assert.equal(res[0].stock_confirmed,false);
  assert.equal(res[0].price_confirmed,false);
});
test('rejects unauthorized requests before external calls',async()=>{
  let calls=0;
  const res=await discoverExternalSuppliers(makeRequest({query:'cinta PP 9mm'},'wrong'),env(),{fetchFn:async()=>{calls++;}});
  assert.equal(res.status,401);
  assert.equal(calls,0);
});
test('feature flag and missing API key fail closed without charge',async()=>{
  let calls=0;
  const opts={fetchFn:async()=>{calls++;}};
  assert.equal((await discoverExternalSuppliers(makeRequest({query:'cinta PP 9mm'}),env({SOURCE_AO_AI_PILOT_ENABLED:'false'}),opts)).status,503);
  assert.equal((await discoverExternalSuppliers(makeRequest({query:'cinta PP 9mm'}),env({BRAVE_SEARCH_API_KEY:''}),opts)).status,503);
  assert.equal(calls,0);
});
test('searches specified countries, deduplicates URLs and labels evidence',async()=>{
  const res=await discoverExternalSuppliers(makeRequest({query:'cinta PP 9mm',markets:['AO','NA']}),env(),{fetchFn:fetchSearch});
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.candidates.length,1);
  assert.deepEqual(body.markets_requested,['AO','NA']);
  assert.equal(body.candidates[0].market_searched,'AO');
  assert.equal(body.candidates[0].stock_confirmed,false);
  assert.equal(body.ai_status,'not_configured');
});
test('enforces an atomic budget before initiating external search',async()=>{
  const e=env();let calls=0;
  const args={fetchFn:async url=>{calls++;return fetchSearch(url);},day:'2026-10-09'};
  for(let i=0;i<2;i++){
    const res=await discoverExternalSuppliers(makeRequest({query:'capacete EPI',markets:['AO']}),e,args);
    assert.equal(res.status,200);
  }
  const third=await discoverExternalSuppliers(makeRequest({query:'capacete EPI',markets:['AO']}),e,args);
  assert.equal(third.status,429);
  assert.equal(calls,2);
});
test('optional GPT assessment attaches opinions only to existing sourced IDs',async()=>{
  const e=env({OPENAI_API_KEY:'openai-secret'});
  let aiPayload;
  const fakeFetch=async(url,options)=>{
    if(String(url).includes('openai.com')){
      aiPayload=JSON.parse(options.body);
      return {ok:true,async json(){return {output:[{content:[{type:'output_text',text:JSON.stringify({assessments:[
        {id:'web_1',fit:'potential',reason:'O catálogo menciona fitas de embalagem.'},
        {id:'fake',fit:'potential',reason:'Inventado'}
      ]})}]}]};}};
    }
    return fetchSearch(url);
  };
  const res=await discoverExternalSuppliers(makeRequest({query:'PP strap 9 mm',markets:['ZA']}),e,{fetchFn:fakeFetch});
  const body=await res.json();
  assert.equal(body.ai_status,'completed');
  assert.equal(body.candidates.length,1);
  assert.equal(body.candidates[0].ai_assessment.fit,'potential');
  assert.equal(body.candidates[0].product_confirmed,false);
  assert.equal(aiPayload.model,'gpt-5.4-mini');
  assert.equal(aiPayload.store,false);
});
test('AI outage does not fabricate confirmation or discard sourced links',async()=>{
  const e=env({OPENAI_API_KEY:'openai-secret'});
  const res=await discoverExternalSuppliers(makeRequest({query:'PP strap 9 mm',markets:['ZA']}),e,{fetchFn:async(url)=>{
    if(String(url).includes('openai.com'))return {ok:false,status:503};
    return fetchSearch(url);
  }});
  const body=await res.json();
  assert.equal(body.ai_status,'unavailable');
  assert.equal(body.candidates.length,1);
  assert.equal(body.candidates[0].stock_confirmed,false);
});
