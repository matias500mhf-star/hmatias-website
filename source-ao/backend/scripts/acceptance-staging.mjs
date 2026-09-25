const base=(process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
const token=process.env.ADMIN_API_TOKEN||'';
if(!base||!token){
  console.error('Required: SOURCE_AO_API_BASE, ADMIN_API_TOKEN');
  process.exit(2);
}

const headers={accept:'application/json','content-type':'application/json'};
const adminHeaders={...headers,authorization:`Bearer ${token}`};

const request=async(path,{method='GET',body,admin=false}={})=>{
  const res=await fetch(base+path,{
    method,
    headers:admin?adminHeaders:headers,
    body:body?JSON.stringify(body):undefined
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${JSON.stringify(data)}`);
  return data;
};

const ready=await request('/ready');
if(ready?.environment!=='staging'||ready?.ready!==true){
  throw new Error('Real acceptance must run only against ready staging');
}

async function runCase({name,query,quantity}){
  const created=await request('/api/admin/collector/runs',{
    method:'POST',
    admin:true,
    body:{query,location:'Luanda',quantity}
  });
  const runId=created?.run?.id;
  if(!runId) throw new Error(`${name}: collector run was not created`);

  const discovery=await request(`/api/admin/collector/runs/${encodeURIComponent(runId)}/discover`,{
    method:'POST',
    admin:true,
    body:{execute:true,limit:4}
  });
  if(!(discovery?.jobs||[]).length){
    throw new Error(`${name}: no Angola supplier sources were queued`);
  }
  if(Number(discovery?.processed||0)<1){
    throw new Error(`${name}: automatic discovery did not process any source`);
  }

  const state=await request(`/api/admin/collector/runs/${encodeURIComponent(runId)}/discovery`,{admin:true});
  const collector=await request(`/api/admin/collector/runs/${encodeURIComponent(runId)}`,{admin:true});
  const mission=await request(
    '/api/procurement-mission?q='+encodeURIComponent(query)+'&location=Luanda&quantity='+encodeURIComponent(quantity)
  );

  await request(`/api/admin/collector/runs/${encodeURIComponent(runId)}/finish`,{
    method:'POST',
    admin:true,
    body:{}
  });

  return {
    name,
    run_id:runId,
    discovery_jobs:(state?.jobs||[]).length,
    processed:Number(discovery?.processed||0),
    evidence:(state?.evidence||[]).length,
    web_candidates:(collector?.candidates||[]).length,
    mission_status:mission?.mission?.status||null,
    exact_matches:(mission?.mission?.exact_matches||[]).length,
    supplier_candidates:(mission?.mission?.supplier_candidates||[]).length,
    contactable_candidates:Number(mission?.mission?.contactable_candidates||0),
    fast_path:mission?.mission?.fast_path||null
  };
}

console.log('REAL 1/2 — cinta PP 9mm urgente');
const pp=await runCase({
  name:'pp_strapping_9mm',
  query:'cinta PP 9mm 1 rolo urgente',
  quantity:1
});
if(pp.supplier_candidates<1&&pp.web_candidates<1){
  throw new Error('PP acceptance: no supplier candidate found from curated or discovered sources');
}
if(pp.contactable_candidates<1){
  throw new Error('PP acceptance: no contactable supplier candidate found');
}

console.log('REAL 2/2 — formol 37% 1L urgente');
const formaldehyde=await runCase({
  name:'formaldehyde_37_1l',
  query:'formol 37% 1L urgente',
  quantity:1
});
if(formaldehyde.exact_matches<1){
  throw new Error('Formaldehyde acceptance: exact source-checked match is missing');
}

console.log(JSON.stringify({
  acceptance:'PASS',
  environment:'staging',
  pp,
  formaldehyde,
  truth_rule:'Discovery evidence and supplier candidates do not confirm current stock or price. Commercial confirmation remains required.',
  checked_at:new Date().toISOString()
},null,2));
