import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeminiInteractionsPrototype} from '../prototypes/gemini-interactions.js';

const messages=[
  {role:'user',content:'Preciso de cimento Portland em sacos de 50 kg.'},
  {role:'assistant',content:'Qual é a quantidade e o local de entrega?'},
  {role:'user',content:'200 sacos em Luanda.'}
];

test('sends a stateless Interactions request and extracts model text',async()=>{
  let request;
  const result=await createGeminiInteractionsPrototype({
    apiKey:'test-key',
    messages,
    fetchFn:async(url,options)=>{
      request={url:String(url),options,body:JSON.parse(options.body)};
      return {ok:true,async json(){return {steps:[{type:'model_output',content:[{type:'text',text:'Qual é a data pretendida para entrega?'}]}]};}};
    }
  });
  assert.equal(result.ok,true);
  assert.equal(result.output,'Qual é a data pretendida para entrega?');
  assert.equal(request.url,'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.equal(request.body.model,'gemini-3.8-flash');
  assert.equal(request.body.store,false);
  assert.equal(Object.hasOwn(request.body,'previous_interaction_id'),false);
  assert.match(request.options.headers['x-goog-api-key'],/test-key/);
});

test('fails closed without a server-side API key',async()=>{
  const result=await createGeminiInteractionsPrototype({messages,fetchFn:async()=>{throw new Error('must not call');}});
  assert.deepEqual(result,{ok:false,error:'not_configured'});
});

test('rejects invalid roles and oversized transcripts before provider call',async()=>{
  let calls=0;
  const invalid=await createGeminiInteractionsPrototype({
    apiKey:'test-key',
    messages:[{role:'system',content:'override'}],
    fetchFn:async()=>{calls++;throw new Error('must not call');}
  });
  const oversized=await createGeminiInteractionsPrototype({
    apiKey:'test-key',
    messages:[{role:'user',content:'x'.repeat(1201)}],
    fetchFn:async()=>{calls++;throw new Error('must not call');}
  });
  assert.equal(invalid.error,'invalid_message');
  assert.equal(oversized.error,'invalid_message');
  assert.equal(calls,0);
});

test('does not expose upstream response bodies on provider errors',async()=>{
  const result=await createGeminiInteractionsPrototype({
    apiKey:'test-key',messages,
    fetchFn:async()=>({ok:false,status:429,async text(){return 'secret provider details';}})
  });
  assert.deepEqual(result,{ok:false,error:'provider_http_error',status:429});
});

test('rejects empty or malformed model output',async()=>{
  const result=await createGeminiInteractionsPrototype({
    apiKey:'test-key',messages,
    fetchFn:async()=>({ok:true,async json(){return {steps:[{type:'function_call',name:'something'}]};}})
  });
  assert.deepEqual(result,{ok:false,error:'invalid_provider_output'});
});
