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
    if(!row.supplier?.id||!row.verification?.source_type||!row.verification?.verified_at) fail('confirmed search result has no safe supplier/source provenance');
    if(Object.prototype.hasOwnProperty.call(row,'evidence_reference')) fail('public result exposed private evidence reference');
  }
}

const diamondSearch=await get('/api/search?q='+encodeURIComponent('discos diamantados 115 mm')+'&location='+encodeURIComponent('Luanda'));
const diamondIds=['item-carbodiam-pantera-115','item-carbodiam-pantera-neutre-115','item-carbodiam-crack-chaser-115'];
const diamondRows=(diamondSearch.results||[]).filter(row=>diamondIds.includes(row.id));
if(diamondIds.some(id=>!diamondRows.some(row=>row.id===id))) fail('one or more exact Carbodiam 115 mm catalogue references are missing from staging D1');
if(diamondRows.some(row=>row.category!=='diamond-tools'||row.status!=='discovered')) fail('Portugal catalogue references must remain discovered, not imply stock in Luanda');
if(diamondRows.some(row=>['supplier','price','quantity_reported','evidence_reference'].some(key=>Object.prototype.hasOwnProperty.call(row,key)))) fail('diamond tools public result exposed private supplier/commercial fields');

const exactSkuChecks=[
 ['9194','item-carbodiam-sku-pantera-pantera-125-ref-9194'],
 ['15449','item-carbodiam-sku-neutre-pantera-neutre-125-ref-15449'],
 ['11603','item-carbodiam-sku-crack-crack-chaser-125-ref-11603'],
 ['14491','item-carbodiam-sku-acier-acier-300-h20-ref-14491'],
 ['19722','item-carbodiam-sku-beton-beton-400-ref-19722'],
 ['13745','item-carbodiam-sku-betonsol-beton-sol-600-1-ref-13745'],
 ['5182','item-carbodiam-sku-incisor-incisor-125-ref-5182']
];
for(const [reference,itemId] of exactSkuChecks){
  const byReference=await get('/api/search?q='+encodeURIComponent(reference)+'&location='+encodeURIComponent('Portugal'));
  const result=(byReference.results||[]).find(row=>row.id===itemId);
  if(!result||result.status!=='source_checked') fail('Carbodiam factory reference '+reference+' missing or not source-traceable in staging D1');
  const local=await get('/api/search?q='+encodeURIComponent(reference)+'&location='+encodeURIComponent('Luanda'));
  const localResult=(local.results||[]).find(row=>row.id===itemId);
  if(!localResult||localResult.status!=='discovered') fail('Portugal catalogue reference '+reference+' incorrectly implies current Luanda stock');
}
const proforSearch=await get('/api/search?q='+encodeURIComponent('coroa diamantada PROFOR')+'&location='+encodeURIComponent('Portugal'));
const proforItem=(proforSearch.results||[]).find(row=>row.id==='item-crown-family-carbodiam-profor');
if(!proforItem||proforItem.status!=='source_checked') fail('Carbodiam PROFOR crown family is missing or not source-traceable in staging D1');

const grindingSearch=await get('/api/search?q='+encodeURIComponent('copos de desbaste diamantados')+'&location='+encodeURIComponent('Luanda'));
const grindingItem=(grindingSearch.results||[]).find(row=>row.id==='item-synvor-diamond-grinding-cups');
if(!grindingItem||grindingItem.status!=='discovered') fail('Diamond grinding-cup family is missing or incorrectly marked as locally available');

const wekaSearch=await get('/api/search?q='+encodeURIComponent('WEKA DK17')+'&location='+encodeURIComponent('Portugal'));
if(!(wekaSearch.results||[]).some(row=>row.id==='item-weka-dk17')) fail('WEKA DK17 model is not searchable in staging D1');

const panteraReference=await get('/api/search?q=9193&location=Portugal');
const pantera=(panteraReference.results||[]).find(row=>row.id==='item-carbodiam-pantera-115');
if(!pantera||pantera.status!=='source_checked'||pantera.verification?.source_type!=='supplier_official_channel') fail('Carbodiam PANTERA factory reference 9193 is not source-traceable');
if(pantera.status==='in_stock_confirmed') fail('official catalogue entry must not be treated as confirmed stock');

const formolMission=await get('/api/procurement-mission?q='+encodeURIComponent('formol 37% 1L urgente')+'&location='+encodeURIComponent('Luanda'));
if(formolMission?.mission?.interpretation?.item_id!=='item-formaldehyde') fail('formaldehyde acceptance case was not interpreted correctly');
if(!(formolMission.mission.exact_matches||[]).length) fail('formaldehyde acceptance case returned no exact source-checked match');
if((formolMission.mission.exact_matches||[]).some(row=>row.status==='in_stock_confirmed'&&!row.verified_at)) fail('formaldehyde mission exposed untraceable stock confirmation');

const strapMission=await get('/api/procurement-mission?q='+encodeURIComponent('cinta PP 9mm 1 rolo urgente')+'&location='+encodeURIComponent('Luanda'));
if(strapMission?.mission?.interpretation?.item_id!=='item-packaging-strapping') fail('PP strapping acceptance case was not interpreted correctly');
if(!(strapMission.mission.requirement?.specifications||[]).includes('9mm')) fail('PP strapping acceptance case lost the 9 mm specification');
if(!(strapMission.mission.supplier_candidates||[]).length) fail('PP strapping acceptance case returned no Angola supplier candidates');
if(!(strapMission.mission.supplier_candidates||[]).some(row=>row.whatsapp||row.phone||row.email||row.website)) fail('PP strapping acceptance case returned no contactable supplier candidate');

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
  formaldehyde_exact_matches:formolMission.mission.exact_matches.length,
  pp_strapping_candidates:strapMission.mission.supplier_candidates.length,
  opportunities:opps.length,
  checked_at:new Date().toISOString()
},null,2));
