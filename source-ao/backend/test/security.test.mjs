import test from 'node:test';
import assert from 'node:assert/strict';
import {rateLimitPolicy,clientAddress,hashClientKey,hardenResponse,safeRequestLog} from '../src/security.js';

function req(method,path,headers={}){
  return new Request(`https://example.test${path}`,{method,headers});
}

test('rate limit policy is strictest on sourcing and supplier submissions',()=>{
  assert.deepEqual(rateLimitPolicy(req('POST','/api/sourcing-requests'),'/api/sourcing-requests'),{bucket:'sourcing-create',limit:6,windowSeconds:600});
  assert.deepEqual(rateLimitPolicy(req('POST','/api/confirm/vr_1'),'/api/confirm/vr_1'),{bucket:'supplier-confirm-submit',limit:12,windowSeconds:600});
  assert.deepEqual(rateLimitPolicy(req('GET','/api/search'),'/api/search'),{bucket:'public-search',limit:90,windowSeconds:60});
});

test('health and preflight are not rate limited',()=>{
  assert.equal(rateLimitPolicy(req('GET','/health'),'/health'),null);
  assert.equal(rateLimitPolicy(req('OPTIONS','/api/search'),'/api/search'),null);
});

test('client identity prefers Cloudflare address and does not parse full forwarded chain',()=>{
  assert.equal(clientAddress(req('GET','/',{'cf-connecting-ip':'197.1.2.3','x-forwarded-for':'10.0.0.1, 10.0.0.2'})),'197.1.2.3');
  assert.equal(clientAddress(req('GET','/',{'x-forwarded-for':'10.0.0.1, 10.0.0.2'})),'10.0.0.1');
});

test('client key hash is deterministic and does not expose the address',async()=>{
  const value='197.1.2.3';
  const a=await hashClientKey('rate-limit-secret',value);
  const b=await hashClientKey('rate-limit-secret',value);
  assert.equal(a,b);
  assert.equal(a.length,64);
  assert.equal(a.includes(value),false);
});

test('response hardening adds request and browser security headers',()=>{
  const response=hardenResponse(new Response('{}',{status:200,headers:{'content-type':'application/json'}}),'req-123',{policy:{limit:10},count:3,retryAfter:25});
  assert.equal(response.headers.get('x-request-id'),'req-123');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(response.headers.get('x-ratelimit-remaining'),'7');
});

test('sanitized request log excludes query strings and client identity',()=>{
  const line=safeRequestLog({requestId:'r1',method:'GET',pathname:'/api/search',status:200,durationMs:7,env:{SOURCE_AO_ENV:'test',SOURCE_AO_RELEASE:'abc'}});
  const parsed=JSON.parse(line);
  assert.deepEqual(parsed,{type:'source_ao_request',request_id:'r1',method:'GET',route:'/api/search',status:200,duration_ms:7,environment:'test',release:'abc'});
  assert.equal(line.includes('q='),false);
});
