const base=(process.env.SOURCE_AO_PRODUCTION_API_BASE||process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
if(!base) throw new Error('SOURCE_AO_API_BASE is required');
const forbidden=new Set(['supplier','supplier_id','supplier_name','supplier_candidates','website','phone','whatsapp','email','fast_path','price','price_reported','quantity_reported','contactable_candidates']);
function check(value){
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    if(forbidden.has(key)) throw new Error(`Private field on public endpoint: ${key}`);
    check(child);
  }
}
for(const query of ['cimento','cinta PP 9mm','manutencao']){
  for(const route of ['search','procurement-mission']){
    const response=await fetch(`${base}/api/${route}?q=${encodeURIComponent(query)}&location=Luanda`,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(`${route}: HTTP ${response.status}`);
    const body=await response.json();if(!body.ok)throw new Error(`${route}: unsuccessful response`);check(body);
  }
}
const privateProbe=await fetch(`${base}/api/admin/procurement-mission?q=cimento`,{signal:AbortSignal.timeout(15000)});
if(privateProbe.status!==401)throw new Error(`Private procurement endpoint: expected 401, got ${privateProbe.status}`);
console.log('Public search/procurement privacy and administrative access control: PASS');
