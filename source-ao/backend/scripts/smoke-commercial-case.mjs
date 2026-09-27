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

const proposal=await call(`/api/admin/sourcing-requests/${encodeURIComponent(synthetic.id)}/proposal-draft`);
assert.equal(proposal?.ok,true);
assert.equal(proposal?.confidential,true);
assert.equal(proposal?.issuance_ready,false);
const proposalSerialized=JSON.stringify(proposal);
for(const forbidden of ['supplier_id','supplier_name','landed_cost_aoa','gross_profit_aoa','gross_margin_pct','contact_encrypted','private_contact_encrypted']){
  assert.equal(proposalSerialized.includes(forbidden),false);
}

const fulfillment=await call(`/api/admin/sourcing-requests/${encodeURIComponent(synthetic.id)}/fulfillment`);
assert.equal(fulfillment?.ok,true);
assert.equal(fulfillment?.confidential,true);
assert.equal(fulfillment?.summary?.realized_profit_ready,false);
assert.equal(fulfillment?.summary?.realized_gross_profit_aoa,null);
const fulfillmentSerialized=JSON.stringify(fulfillment);
for(const forbidden of ['contact_encrypted','private_contact_encrypted','access_token_hash']){
  assert.equal(fulfillmentSerialized.includes(forbidden),false);
}
const collections=await call(`/api/admin/sourcing-requests/${encodeURIComponent(synthetic.id)}/collections`);
assert.equal(collections?.ok,true);
assert.equal(collections?.confidential,true);
assert.equal(collections?.invoice,null);
assert.equal(collections?.summary?.status,'not_invoiced');
assert.equal(collections?.summary?.total_received_aoa,0);
const collectionsSerialized=JSON.stringify(collections);
for(const forbidden of ['contact_encrypted','private_contact_encrypted','access_token_hash']){
  assert.equal(collectionsSerialized.includes(forbidden),false);
}

const actions=await call('/api/admin/commercial-actions?limit=12');
assert.equal(actions?.ok,true);
assert.equal(actions?.confidential,true);
assert.equal(actions?.identity_minimized,true);
assert.ok(Array.isArray(actions?.results));
const actionsSerialized=JSON.stringify(actions);
for(const forbidden of ['requester_name','requester_contact','supplier_name','supplier_id','contact_encrypted','private_contact_encrypted']){
  assert.equal(actionsSerialized.includes(forbidden),false);
}

const dashboard=await call('/api/admin/commercial-dashboard');
assert.equal(dashboard?.ok,true);
assert.equal(dashboard?.confidential,true);
assert.equal(dashboard?.aggregated_only,true);
assert.ok(dashboard?.collections);
assert.ok(Number.isFinite(Number(dashboard.collections.invoiced_aoa)));
assert.ok(Number.isFinite(Number(dashboard.collections.received_aoa)));
assert.ok(Number.isFinite(Number(dashboard.collections.outstanding_aoa)));
const dashboardSerialized=JSON.stringify(dashboard);
for(const forbidden of ['requester_name','requester_contact','supplier_name','contact_encrypted','private_contact_encrypted']){
  assert.equal(dashboardSerialized.includes(forbidden),false);
}
console.log('Commercial-case, proposal-pack, fulfillment, collections, action queue and aggregate cockpit production smoke passed without creating commercial values.');
