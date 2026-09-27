// Synthetic commercial-case validation only. No supplier quote, price, margin, proposal or purchase is fabricated.
import assert from 'node:assert/strict';

const base=(process.env.SOURCE_AO_PRODUCTION_API_BASE||'').replace(/\/$/,'');
const adminToken=process.env.SOURCE_AO_ADMIN_API_TOKEN;
if(!/^https:\/\//.test(base)||!adminToken)throw new Error('Protected commercial-case smoke configuration is missing.');

async function call(path,{method='GET',body}={}){
  const response=await fetch(base+path,{
    method,
    headers:{accept:'application/json',authorization:`Bearer ${adminToken}`,...(body?{'content-type':'application/json'}:{})},
    body:body?JSON.stringify(body):undefined,
    signal:AbortSignal.timeout(15000)
  });
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(`Commercial-case smoke failed with HTTP ${response.status}: ${data?.error?.code||'unknown'}`);
  return data;
}

const list=await call('/api/admin/sourcing-requests?limit=100');
const synthetic=(list?.results||[]).find(row=>String(row.requirement_text||'').includes('VALIDAÇÃO RFQ'));
assert.ok(synthetic?.id,'Synthetic RFQ from the previous smoke step was not found.');

const opened=await call(`/api/admin/sourcing-requests/${encodeURIComponent(synthetic.id)}/commercial-case`);
assert.equal(opened?.ok,true);
assert.equal(opened?.confidential,true);
assert.ok(Array.isArray(opened?.cost_options));
assert.ok(Array.isArray(opened?.supplier_candidates));
assert.equal(opened?.summary?.proposal_ready,false);

const serialized=JSON.stringify(opened);
for(const forbidden of ['contact_encrypted','private_contact_encrypted','access_token_hash']){
  assert.equal(serialized.includes(forbidden),false);
}

const updated=await call(`/api/admin/sourcing-requests/${encodeURIComponent(synthetic.id)}/commercial-case`,{
  method:'POST',
  body:{
    qualification_status:'declined',
    proposal_status:'not_ready',
    internal_notes:'Validação técnica automática. Nenhum fornecedor, custo, margem, proposta ou compra foi criado.'
  }
});
assert.equal(updated?.commercial_case?.qualification_status,'declined');
assert.equal(updated?.summary?.proposal_ready,false);
assert.equal(updated?.summary?.gross_profit_aoa,null);
assert.equal(updated?.summary?.gross_margin_pct,null);
console.log('Commercial-case production smoke passed without creating commercial values.');
