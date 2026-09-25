const base=(process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
const token=process.env.ADMIN_API_TOKEN||'';
const supplierId=process.env.SOURCE_AO_TEST_SUPPLIER_ID||'';
if(!base||!token||!supplierId){
  console.error('Required: SOURCE_AO_API_BASE, ADMIN_API_TOKEN, SOURCE_AO_TEST_SUPPLIER_ID');
  process.exit(2);
}

const headers={accept:'application/json','content-type':'application/json'};
const adminHeaders={...headers,authorization:`Bearer ${token}`};
const request=async(path,{method='GET',body,admin=false}={})=>{
  const res=await fetch(base+path,{method,headers:admin?adminHeaders:headers,body:body?JSON.stringify(body):undefined});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${JSON.stringify(data)}`);
  return data;
};

const ready=await request('/ready');
if(ready?.environment!=='staging'||ready?.ready!==true){
  throw new Error('Pilot must run only against a ready Source AO staging API');
}

const stamp=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14);
const itemId=`item_test_staging_${stamp}`;
const itemName=`TEST STAGING PVC Pipe 110 mm ${stamp}`;

console.log('1/13 create TEST item');
await request('/api/admin/items',{method:'POST',admin:true,body:{
  id:itemId,
  name:itemName,
  category:'construction',
  specification:'PVC 110 mm — staging test only',
  unit:'unit',
  aliases:['TEST PVC 110 mm','staging pipe']
}});

console.log('2/13 create verification request');
const created=await request('/api/admin/verification-requests',{method:'POST',admin:true,body:{
  supplier_id:supplierId,
  item_id:itemId,
  requirement_text:'TEST STAGING — confirm one PVC pipe 110 mm',
  specification:'PVC 110 mm — TEST ONLY',
  quantity:1,
  unit:'unit',
  location:'Luanda'
}});
const vr=created.verification_request;
if(!vr?.id||!vr?.confirmation_path) throw new Error('verification request response missing id/confirmation_path');

console.log('3/13 verify signed supplier link');
const confirmation=await request(vr.confirmation_path);
if(confirmation?.verification_request?.id!==vr.id) throw new Error('confirmation link returned wrong request');

console.log('4/13 submit TEST supplier response');
await request(vr.confirmation_path,{method:'POST',body:{
  available:true,
  quantity_reported:1,
  price_reported:100,
  currency:'AOA',
  lead_time:'TEST ONLY',
  note:'Automated staging pilot. Not a commercial claim.',
  responded_by:'SOURCE AO STAGING TEST'
}});

console.log('5/13 approve after HMATIAS-review simulation');
const approved=await request(`/api/admin/verification/${encodeURIComponent(vr.id)}/approve`,{method:'POST',admin:true,body:{
  item_id:itemId,
  reviewer:'SOURCE AO STAGING TEST'
}});
if(approved?.observation?.verification_status!=='in_stock_confirmed') throw new Error('pilot did not create in_stock_confirmed observation');

console.log('6/13 verify public search result');
const found=await request('/api/search?q='+encodeURIComponent(itemName)+'&location=Luanda');
const results=found.results||[];
const row=results.find(x=>x.id===itemId||x.name===itemName);
if(!row) throw new Error('approved TEST item not returned by public search');
if(row.status!=='in_stock_confirmed') throw new Error(`unexpected public status: ${row.status}`);
if(!row.verified_at||!row.expires_at) throw new Error('confirmed TEST result missing freshness timestamps');

console.log('7/13 create synthetic customer sourcing request');
const syntheticContact=`sourceao-test-${stamp}@example.invalid`;
const sourcing=await request('/api/sourcing-requests',{method:'POST',body:{
  requirement_text:`TEST STAGING sourcing ${stamp}`,
  specification:'PVC 110 mm — synthetic request only',
  quantity:2,
  unit:'unit',
  location:'Luanda',
  requester_contact:syntheticContact,
  contact_channel:'email'
}});
if(!sourcing?.request?.id||!sourcing?.request?.reference||!sourcing?.request?.status_path) throw new Error('sourcing request missing private tracking fields');

console.log('8/13 verify private tracking does not expose contact');
const tracking=await request(sourcing.request.status_path);
if(tracking?.request?.reference!==sourcing.request.reference) throw new Error('private tracking returned the wrong request');
const trackingText=JSON.stringify(tracking);
if(trackingText.includes(syntheticContact)||Object.prototype.hasOwnProperty.call(tracking.request||{},'contact')) throw new Error('private tracking exposed requester contact');

console.log('9/13 verify authenticated Sourcing Desk can recover protected contact');
const adminList=await request('/api/admin/sourcing-requests?status=received&limit=100',{admin:true});
const adminRow=(adminList.results||[]).find(x=>x.id===sourcing.request.id);
if(!adminRow) throw new Error('synthetic sourcing request missing from admin queue');
if(adminRow.contact!==syntheticContact) throw new Error('authorized admin could not recover encrypted synthetic contact');

console.log('10/13 close synthetic sourcing request');
const closed=await request(`/api/admin/sourcing-requests/${encodeURIComponent(sourcing.request.id)}/status`,{method:'POST',admin:true,body:{
  status:'closed',
  assigned_to:'SOURCE AO STAGING TEST',
  internal_notes:'Synthetic pilot only. No real customer data.'
}});
if(closed?.request?.status!=='closed') throw new Error('synthetic sourcing request was not closed');

console.log('11/13 create Collector v1 search run');
const collector=await request('/api/admin/collector/runs',{method:'POST',admin:true,body:{
  query:'TEST STAGING cinta PP 9mm',
  location:'Luanda',
  quantity:1
}});
const collectorRun=collector?.run;
if(!collectorRun?.id) throw new Error('Collector v1 did not create a search run');

console.log('12/13 add traceable TEST supplier candidate');
const candidate=await request(`/api/admin/collector/runs/${encodeURIComponent(collectorRun.id)}/candidates`,{
  method:'POST',
  admin:true,
  body:{
    supplier_name:'TEST STAGING Packaging Supplier',
    source_url:'https://example.invalid/source-ao-staging-candidate',
    source_type:'supplier_website',
    location:'Luanda, Angola',
    phone:'+244 900 000 000',
    matched_variant:'PP strapping 9mm',
    evidence_text:'Synthetic staging evidence only. No stock or price claim.'
  }
});
if(candidate?.commercial_confirmation!==false) throw new Error('Collector candidate incorrectly implied commercial confirmation');

console.log('13/13 finalize and verify Collector v1 run');
const finalized=await request(`/api/admin/collector/runs/${encodeURIComponent(collectorRun.id)}/finish`,{
  method:'POST',
  admin:true,
  body:{}
});
if(finalized?.run?.status!=='completed') throw new Error('Collector v1 run did not complete');
if(Number(finalized?.run?.candidate_count||0)<1) throw new Error('Collector v1 candidate was not persisted');
const collectorState=await request(`/api/admin/collector/runs/${encodeURIComponent(collectorRun.id)}`,{admin:true});
if(!(collectorState?.candidates||[]).length) throw new Error('Collector v1 candidate list is empty after persistence');

console.log(JSON.stringify({
  pilot:'PASS',
  verification_request_id:vr.id,
  observation_id:approved.observation.id,
  public_status:row.status,
  verified_at:row.verified_at,
  expires_at:row.expires_at,
  sourcing_request_id:sourcing.request.id,
  sourcing_reference:sourcing.request.reference,
  collector_run_id:collectorRun.id,
  collector_candidates:(collectorState.candidates||[]).length,
  private_tracking_pii_exposed:false,
  warning:'TEST STAGING DATA ONLY — remove/reset staging DB after pilot'
},null,2));
