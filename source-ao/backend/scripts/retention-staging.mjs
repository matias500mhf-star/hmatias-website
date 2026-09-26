import {execFileSync} from 'node:child_process';

const base=(process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
const token=process.env.ADMIN_API_TOKEN||'';
if(!base||!token){
  console.error('Required: SOURCE_AO_API_BASE, ADMIN_API_TOKEN');
  process.exit(2);
}

const headers={accept:'application/json','content-type':'application/json'};
const adminHeaders={...headers,authorization:`Bearer ${token}`};

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const request=async(path,{method='GET',body,admin=false}={})=>{
  const attempts=admin?8:1;
  let lastStatus=0;
  let lastData={};
  for(let attempt=1;attempt<=attempts;attempt++){
    const res=await fetch(base+path,{
      method,
      headers:admin?adminHeaders:headers,
      body:body?JSON.stringify(body):undefined
    });
    const data=await res.json().catch(()=>({}));
    if(res.ok) return data;
    lastStatus=res.status;
    lastData=data;
    if(!(admin&&res.status===401&&attempt<attempts)){
      throw new Error(`${method} ${path}: HTTP ${res.status} ${JSON.stringify(data)}`);
    }
    console.warn(`Transient staging admin 401 on ${method} ${path}; retry ${attempt}/${attempts-1}`);
    await sleep(2000);
  }
  throw new Error(`${method} ${path}: HTTP ${lastStatus} ${JSON.stringify(lastData)}`);
};

const ready=await request('/ready');
if(ready?.environment!=='staging'||ready?.ready!==true){
  throw new Error('Retention drill must run only against ready staging');
}

const stamp=Date.now();
const syntheticContact=`sourceao-retention-${stamp}@example.invalid`;

console.log('RETENTION 1/6 — create synthetic sourcing request');
const created=await request('/api/sourcing-requests',{
  method:'POST',
  body:{
    requirement_text:`TEST STAGING retention drill ${stamp}`,
    specification:'Synthetic retention validation only',
    quantity:1,
    unit:'test',
    location:'Luanda',
    requester_contact:syntheticContact,
    contact_channel:'email'
  }
});
const row=created?.request;
if(!row?.id||!row?.status_path) throw new Error('Retention drill request was not created');
if(!/^sr_[0-9a-f-]{36}$/i.test(row.id)) throw new Error('Unexpected sourcing request id format');

console.log('RETENTION 2/6 — close synthetic request');
const closed=await request(`/api/admin/sourcing-requests/${encodeURIComponent(row.id)}/status`,{
  method:'POST',
  admin:true,
  body:{
    status:'closed',
    assigned_to:'SOURCE AO RETENTION DRILL',
    internal_notes:'Synthetic staging retention drill only.'
  }
});
if(closed?.request?.status!=='closed') throw new Error('Retention drill request did not close');

console.log('RETENTION 3/6 — backdate only the synthetic closed request');
const sql=`UPDATE sourcing_requests SET updated_at=datetime('now','-31 days') WHERE id='${row.id}' AND status='closed';`;
execFileSync('npx',[
  'wrangler','d1','execute','source-ao-staging','--remote',
  '--command',sql,
  '--config','wrangler.staging.runtime.jsonc'
],{stdio:'inherit'});

console.log('RETENTION 4/6 — run real staging maintenance');
const maintenance=await request('/api/admin/maintenance/run',{method:'POST',admin:true,body:{}});
if(maintenance?.ok!==true) throw new Error('Staging maintenance did not return ok=true');
if(Number(maintenance?.purged_requester_contacts||0)<1){
  throw new Error('Retention drill did not purge an eligible requester contact');
}

console.log('RETENTION 5/6 — verify admin view no longer exposes contact');
const adminList=await request('/api/admin/sourcing-requests?status=closed&limit=100',{admin:true});
const adminRow=(adminList?.results||[]).find(x=>x.id===row.id);
if(!adminRow) throw new Error('Purged synthetic request missing from admin queue');
if(adminRow.contact!==null) throw new Error('Purged requester contact is still decryptable');
if(adminRow.contact_hint!=='purged') throw new Error('Purged requester contact is not marked purged');
if(!adminRow.contact_purged_at) throw new Error('Purged requester contact has no purge timestamp');

console.log('RETENTION 6/6 — verify private tracking keeps non-identifying request state');
const tracking=await request(row.status_path);
const trackingText=JSON.stringify(tracking);
if(tracking?.request?.id!==row.id) throw new Error('Private tracking returned the wrong request');
if(trackingText.includes(syntheticContact)||Object.prototype.hasOwnProperty.call(tracking.request||{},'contact')){
  throw new Error('Private tracking exposed purged requester contact');
}

console.log(JSON.stringify({
  retention_drill:'PASS',
  environment:'staging',
  request_id:row.id,
  status:adminRow.status,
  contact:null,
  contact_hint:adminRow.contact_hint,
  contact_purged_at:adminRow.contact_purged_at,
  purged_requester_contacts:Number(maintenance.purged_requester_contacts||0),
  non_identifying_tracking_preserved:true,
  checked_at:new Date().toISOString()
},null,2));
