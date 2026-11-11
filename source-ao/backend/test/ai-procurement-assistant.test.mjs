import test from 'node:test';
import assert from 'node:assert/strict';
import {aiProcurementAssistantResponse} from '../src/ai-procurement-assistant.js';

const env={ADMIN_API_TOKEN:'test-admin-token',PUBLIC_ORIGIN:'https://comercialhmatiasps.com'};

test('rejects unauthenticated requests before invoking AI',async()=>{
  const request=new Request('https://worker.test/api/admin/ai/procurement-assistant',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({query:'cimento',location:'Luanda'})
  });
  const response=await aiProcurementAssistantResponse(request,env);
  assert.equal(response.status,401);
  assert.equal((await response.json()).error.code,'unauthorized');
});

test('rejects malformed sourcing input',async()=>{
  const request=new Request('https://worker.test/api/admin/ai/procurement-assistant',{
    method:'POST',
    headers:{'content-type':'application/json',authorization:'Bearer test-admin-token'},
    body:JSON.stringify({query:'x',location:'Luanda'})
  });
  const response=await aiProcurementAssistantResponse(request,env);
  assert.equal(response.status,400);
  assert.equal((await response.json()).error.code,'invalid_input');
});

test('fails closed when Gemini server secret is not configured',async()=>{
  const request=new Request('https://worker.test/api/admin/ai/procurement-assistant',{
    method:'POST',
    headers:{'content-type':'application/json',authorization:'Bearer test-admin-token'},
    body:JSON.stringify({query:'cimento Portland 50 kg',location:'Luanda',quantity:20})
  });
  const response=await aiProcurementAssistantResponse(request,env);
  assert.equal(response.status,503);
  assert.equal((await response.json()).error.code,'ai_not_configured');
});
