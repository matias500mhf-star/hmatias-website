const base=(process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
if(!base){console.error('SOURCE_AO_API_BASE is required');process.exit(2)}

const fail=message=>{throw new Error(message)};
const get=async path=>{
  const res=await fetch(base+path,{headers:{accept:'application/json'}});
  if(!res.ok) fail(`${path}: HTTP ${res.status}`);
  const data=await res.json().catch(()=>fail(`${path}: invalid JSON`));
  return data;
};

const health=await get('/health');
if(!health||health.ok!==true) fail('/health did not return ok=true');

const ready=await get('/ready');
if(!ready||ready.ready!==true||ready.ok!==true) fail('/ready did not confirm staging readiness');
if(!ready.checks?.configuration||!ready.checks?.database||!ready.checks?.rate_limits||!ready.checks?.contact_retention) fail('/ready security/database/retention checks did not all pass');

const search=await get('/api/search?q='+encodeURIComponent('PVC pipe 110 mm')+'&location='+encodeURIComponent('Luanda'));
if(!search||typeof search!=='object') fail('/api/search returned an invalid payload');

const rows=Array.isArray(search.results)?search.results:Array.isArray(search.matches)?search.matches:[];
for(const row of rows){
  const status=row.verification_status||row.status||'';
  if(['supplier_confirmed','in_stock_confirmed'].includes(status)){
    if(!row.verified_at&&!row.last_verified_at) fail('confirmed search result has no verification timestamp');
    if(!row.source_url&&!row.source&&!row.evidence_reference) fail('confirmed search result has no traceable source/evidence');
  }
}

const opportunities=await get('/api/opportunities');
const opps=Array.isArray(opportunities)?opportunities:(opportunities.results||opportunities.opportunities||[]);
for(const opp of opps){
  if(opp.status==='active'&&opp.deadline&&new Date(opp.deadline).getTime()<Date.now()) fail(`expired opportunity exposed as active: ${opp.id||opp.title}`);
  if(!opp.source_url) fail(`opportunity has no traceable source: ${opp.id||opp.title}`);
}

console.log(JSON.stringify({
  staging:'PASS',
  base,
  health:true,
  ready:true,
  search_results:rows.length,
  opportunities:opps.length,
  checked_at:new Date().toISOString()
},null,2));
