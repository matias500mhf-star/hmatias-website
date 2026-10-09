// Restricted GitHub Actions utility. Never print widget secrets, tokens or API response bodies.
// Creates only the named HMATIAS Turnstile widget, or reuses an identical existing one.
// Production lead intake remains disabled. Only protective Worker bindings are added.
import {spawnSync} from 'node:child_process';

const name='HMATIAS Website Lead Intake';
const domains=['comercialhmatiasps.com','www.comercialhmatiasps.com'];
const account=(process.env.CLOUDFLARE_ACCOUNT_ID||'').trim();
const workersToken=(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const turnstileToken=(process.env.CLOUDFLARE_TURNSTILE_API_TOKEN||'').trim();
const base='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+'/challenges/widgets';
if(!/^[a-f0-9]{32}$/i.test(account)||workersToken.length<15)
  throw Error('Cloudflare Worker credentials or account ID are missing.');
if(turnstileToken.length<15)
  throw Error('Missing dedicated CLOUDFLARE_TURNSTILE_API_TOKEN. Create a scoped Turnstile Sites Write token and add it as a GitHub environment secret.');
function log(message){process.stdout.write(message+'\n');}
async function api(path,{method='GET',body}={}){
  let response;
  try{
    response=await fetch(base+path,{
      method,
      headers:{authorization:'Bearer '+turnstileToken,'content-type':'application/json'},
      ...(body?{body:JSON.stringify(body)}:{}),
      signal:AbortSignal.timeout(18000)
    });
  }catch{throw Error('Cloudflare Turnstile API unavailable.');}
  let payload;
  try{payload=await response.json();}catch{throw Error('Invalid Cloudflare API response.');}
  if(!response.ok||payload?.success!==true)
    throw Error('Cloudflare Turnstile '+method+' failed (HTTP '+response.status+
      '). Check whether token has Account:Turnstile:Edit permission.');
  return payload.result;
}
function run(command,args,options={}){
  const r=spawnSync(command,args,{encoding:'utf8',timeout:120000,maxBuffer:5*1024*1024,...options});
  if(r.status!==0||r.error)throw Error('Protected worker configuration step failed: '+args.slice(0,3).join(' '));
  return (r.stdout||'').trim();
}
const list=await api('?per_page=100');
if(!Array.isArray(list))throw Error('Turnstile list returned an unexpected structure.');
const same=list.filter(x=>x?.name===name);
if(same.length>1)throw Error('More than one HMATIAS widget matches the exact name. Resolve duplicates manually.');
let widget,created=false;
if(same.length){
  widget=await api('/'+encodeURIComponent(same[0].sitekey));
  if(!Array.isArray(widget?.domains)||
    !domains.every(d=>widget.domains.includes(d))||
    widget.mode!=='managed')
      throw Error('Existing HMATIAS Turnstile widget does not match expected domains/mode.');
  log('Found existing dedicated HMATIAS Turnstile widget.');
}else{
  widget=await api('',{method:'POST',body:{name,domains,mode:'managed'}});
  created=true;
  log('Dedicated HMATIAS Turnstile widget created with official-domain restrictions.');
}
if(!/^[0-9A-Za-z_-]{8,180}$/.test(widget?.sitekey||'')||
   typeof widget.secret!=='string'||widget.secret.length<12)
  throw Error('Turnstile response omitted the site key or private secret. No Worker changes made.');
const raw=run('npx',['wrangler','d1','list','--json']);
let databases;
try{const parsed=JSON.parse(raw);databases=Array.isArray(parsed)?parsed:parsed.result;}catch{
  throw Error('Unable to parse existing D1 database inventory.');
}
const db=databases?.find(x=>x.name==='source-ao');
const id=db?.uuid||db?.id||'';
if(!/^[0-9a-f-]{32,40}$/i.test(id))throw Error('Existing source-ao D1 database not found. Refusing to modify Worker.');
const config=run(process.execPath,['scripts/prepare-production-config.mjs'],{
  env:{...process.env,SOURCE_AO_PRODUCTION_D1_ID:id}
});
void config;
for(const [key,value] of [
  ['WEBSITE_LEADS_TURNSTILE_SECRET',widget.secret],
  ['WEBSITE_LEADS_TURNSTILE_SITE_KEY',widget.sitekey]
]){
  run('npx',['wrangler','secret','put',key,'--config','wrangler.production.runtime.jsonc'],{
    input:value+'\n'
  });
  log('Worker binding installed securely: '+key+' (value withheld).');
}
log('Turnstile setup complete. Reused existing widget: '+(!created)+'.');
log('No website intake was enabled; final lead registration remains disabled until Resend and end-to-end QA.');
