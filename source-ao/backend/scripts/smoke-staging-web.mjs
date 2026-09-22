const origin=(process.env.SOURCE_AO_STAGING_PUBLIC_ORIGIN||'').replace(/\/$/,'');
const apiBase=(process.env.SOURCE_AO_API_BASE||'').replace(/\/$/,'');
if(!origin||!apiBase){console.error('SOURCE_AO_STAGING_PUBLIC_ORIGIN and SOURCE_AO_API_BASE are required');process.exit(2)}

const fail=message=>{throw new Error(message)};
const text=async(path,{expect=200}={})=>{
  const res=await fetch(origin+path,{redirect:'manual',headers:{accept:'text/html,application/javascript,text/plain'}});
  if(res.status!==expect) fail(`${path}: expected HTTP ${expect}, got ${res.status}`);
  return res.text();
};

const home=await text('/');
if(!/Source AO/i.test(home)) fail('staging homepage does not identify Source AO');
if(!/noindex/i.test(home)) fail('staging homepage must remain noindex');

const runtime=await text('/runtime-config.js');
if(!runtime.includes(JSON.stringify(apiBase))) fail('runtime config is not wired to the staging API');
if(!runtime.includes("environment:'staging'")) fail('runtime config does not identify staging');

for(const page of ['/confirm.html','/track.html','/privacy.html','/terms.html']){
  const html=await text(page);
  if(!/noindex/i.test(html)) fail(`${page} must remain noindex in staging`);
}

const robots=await text('/robots.txt');
if(!/Disallow:\s*\//i.test(robots)) fail('robots.txt must disallow staging crawling');

for(const privatePath of ['/backend/package.json','/docs/SECURITY_AND_TRUST.md','/verification-desk.html','/review-desk.html','/sourcing-desk.html']){
  const res=await fetch(origin+privatePath,{redirect:'manual'});
  if(res.status===200) fail(`private/internal asset is publicly bundled: ${privatePath}`);
}

console.log(JSON.stringify({
  staging_web:'PASS',
  origin,
  api_base:apiBase,
  noindex:true,
  robots_disallow:true,
  private_assets_exposed:false,
  checked_at:new Date().toISOString()
},null,2));
