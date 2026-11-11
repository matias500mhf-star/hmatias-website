import test from 'node:test';
import assert from 'node:assert/strict';
import {processSourcingRequest,getSourcingWorkflow} from '../src/sourcing-workflow.js';
import {interpretSourcingRequest} from '../src/ai-procurement-assistant.js';

const request=(url,token='')=>new Request('https://api.test'+url,{
  method:'POST',
  headers:token?{authorization:`Bearer ${token}`,'content-type':'application/json'}:{'content-type':'application/json'},
  body:'{}'
});

test('sourcing workflow processing requires admin authorization',async()=>{
  const response=await processSourcingRequest(request('/api/admin/sourcing-requests/sr_test/process'),{},'sr_test');
  assert.equal(response.status,401);
  assert.equal((await response.json()).error.code,'unauthorized');
});

test('sourcing workflow results require admin authorization',async()=>{
  const response=await getSourcingWorkflow(new Request('https://api.test/api/admin/sourcing-requests/sr_test/workflow'),{},'sr_test');
  assert.equal(response.status,401);
  assert.equal((await response.json()).error.code,'unauthorized');
});

test('authorized workflow fails closed when secure storage is not configured',async()=>{
  const response=await processSourcingRequest(request('/api/admin/sourcing-requests/sr_test/process','test-admin'),{ADMIN_API_TOKEN:'test-admin'},'sr_test');
  assert.equal(response.status,503);
  assert.equal((await response.json()).error.code,'workflow_not_configured');
});

test('AI interpretation reports missing Gemini secret without network access',async()=>{
  const result=await interpretSourcingRequest({},{
    query:'cimento Portland 50 kg',
    location:'Luanda',
    needed_by:'2026-11-05',
    quantity:50
  });
  assert.equal(result.error,'ai_not_configured');
});
