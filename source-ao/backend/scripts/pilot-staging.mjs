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

const stamp=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14);
const itemId=`item_test_staging_${stamp}`;
const itemName=`TEST STAGING PVC Pipe 110 mm ${stamp}`;

console.log('1/6 create TEST item');
await request('/api/admin/items',{method:'POST',admin:true,body:{
  id:itemId,
  name:itemName,
  category:'construction',
  specification:'PVC 110 mm — staging test only',
  unit:'unit',
  aliases:['TEST PVC 110 mm','staging pipe']
}});

console.log('2/6 create verification request');
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

console.log('3/6 verify signed supplier link');
const confirmation=await request(vr.confirmation_path);
if(confirmation?.verification_request?.id!==vr.id) throw new Error('confirmation link returned wrong request');

console.log('4/6 submit TEST supplier response');
await request(vr.confirmation_path,{method:'POST',body:{
  available:true,
  quantity_reported:1,
  price_reported:100,
  currency:'AOA',
  lead_time:'TEST ONLY',
  note:'Automated staging pilot. Not a commercial claim.',
  responded_by:'SOURCE AO STAGING TEST'
}});

console.log('5/6 approve after HMATIAS-review simulation');
const approved=await request(`/api/admin/verification/${encodeURIComponent(vr.id)}/approve`,{method:'POST',admin:true,body:{
  item_id:itemId,
  reviewer:'SOURCE AO STAGING TEST'
}});
if(approved?.observation?.verification_status!=='in_stock_confirmed') throw new Error('pilot did not create in_stock_confirmed observation');

console.log('6/6 verify public search result');
const found=await request('/api/search?q='+encodeURIComponent(itemName)+'&location=Luanda');
const results=found.results||[];
const row=results.find(x=>x.id===itemId||x.name===itemName);
if(!row) throw new Error('approved TEST item not returned by public search');
if(row.status!=='in_stock_confirmed') throw new Error(`unexpected public status: ${row.status}`);
if(!row.verified_at||!row.expires_at) throw new Error('confirmed TEST result missing freshness timestamps');

console.log(JSON.stringify({
  pilot:'PASS',
  verification_request_id:vr.id,
  observation_id:approved.observation.id,
  public_status:row.status,
  verified_at:row.verified_at,
  expires_at:row.expires_at,
  warning:'TEST STAGING DATA ONLY — remove/reset staging DB after pilot'
},null,2));
