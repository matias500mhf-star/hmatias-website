// Synthetic request only. No messages, proposals, purchases or supplier contact.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';

const base=(process.env.SOURCE_AO_PRODUCTION_API_BASE||'').replace(/\/$/,'');
const adminToken=process.env.SOURCE_AO_ADMIN_API_TOKEN;
if(!/^https:\/\//.test(base)||!adminToken)throw new Error('Protected RFQ smoke configuration is missing.');
const input={
  rfq_version:1,client_token:randomBytes(32).toString('hex'),consent:true,
  items:[{catalog_item_id:'item-ppe-workplace-safety',description:'VALIDAÇÃO RFQ — PEDIDO SINTÉTICO, NÃO PROCESSAR',quantity:1,unit:'un',specification:'Teste técnico sem compra ou contacto.'}],
  requester_name:'Validação automática — não processar',company:'Teste técnico',buyer_type:'company',
  requester_contact:'source-ao-validation@example.invalid',contact_channel:'email',location:'Luanda',
  needed_by:'',urgency:'normal',intent:'budgeting',alternatives:'discuss',budget:'',notes:'Validação de publicação. Encerrar automaticamente.',origin:'source-ao',language:'pt'
};
async function call(path,{method='GET',body,admin=false}={}){
  const response=await fetch(base+path,{method,headers:{accept:'application/json',...(body?{'content-type':'application/json'}:{}),...(admin?{authorization:`Bearer ${adminToken}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(`RFQ smoke failed with HTTP ${response.status}.`);
  return data;
}
let requestId;
try{
  const created=await call('/api/sourcing-requests',{method:'POST',body:input});
  requestId=created?.request?.id;
  assert.ok(requestId);assert.equal(created.request.rfq_version,1);
  const retry=await call('/api/sourcing-requests',{method:'POST',body:input});
  assert.equal(retry.request.id,requestId);
  const tracked=await call(`/api/sourcing-requests/${encodeURIComponent(requestId)}?token=${input.client_token}`);
  assert.equal(tracked.request.items.length,1);
  for(const key of ['rfq','contact','requester_name','company','requester_contact','budget','internal_notes','rfq_details_encrypted'])assert.equal(Object.hasOwn(tracked.request,key),false);
  console.log('RFQ production smoke passed: persisted request, retry deduplication and private tracking.');
}finally{
  if(requestId){
    await call(`/api/admin/sourcing-requests/${encodeURIComponent(requestId)}/status`,{method:'POST',admin:true,body:{status:'closed',internal_notes:'Validação técnica automática. Pedido sintético encerrado, sem contacto, proposta ou compra.'}});
    console.log('Synthetic RFQ closed and excluded from active commercial demand.');
  }
}
