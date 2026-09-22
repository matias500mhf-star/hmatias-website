import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(path.join(here,'data',name),'utf8'));
const catalog=read('catalog.json');
const suppliers=read('suppliers.json');
const services=read('services.json');
const observations=read('observations.json');
const opportunities=read('opportunities.json');
const registry=read('source-registry.json');

const errors=[];
const warn=[];
const required=(obj,fields,label)=>fields.forEach(k=>{if(obj[k]===undefined||obj[k]===null||obj[k]==='') errors.push(`${label}: missing ${k}`)});
const unique=(arr,label)=>{const seen=new Set();for(const id of arr){if(seen.has(id)) errors.push(`${label}: duplicate id ${id}`);seen.add(id)}};
const validUrl=value=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)}catch{return false}};

unique(catalog.items.map(x=>x.id),'catalog');
unique(suppliers.suppliers.map(x=>x.id),'suppliers');
unique(services.providers.map(x=>x.id),'services');
unique(observations.observations.map(x=>x.id),'observations');
unique(opportunities.opportunities.map(x=>x.id),'opportunities');

const supplierIds=new Set(suppliers.suppliers.map(x=>x.id));
const itemIds=new Set(catalog.items.map(x=>x.id));
const sourceTypes=new Map(registry.source_types.map(x=>[x.id,x]));

for(const s of suppliers.suppliers){
  required(s,['id','name','location','source_urls','verification_status','last_verified_at'],`supplier ${s.id}`);
  if(!Array.isArray(s.source_urls)||!s.source_urls.length) errors.push(`supplier ${s.id}: at least one source URL required`);
  for(const url of s.source_urls||[]) if(!validUrl(url)) errors.push(`supplier ${s.id}: invalid source URL ${url}`);
  if(['supplier_confirmed','in_stock_confirmed'].includes(s.verification_status)) errors.push(`supplier ${s.id}: supplier-level record cannot claim stock; use observations`);
}

for(const p of services.providers){
  required(p,['id','name','service_category','location','verification_status','last_verified_at'],`service ${p.id}`);
  for(const url of p.source_urls||[]) if(!validUrl(url)) errors.push(`service ${p.id}: invalid source URL ${url}`);
}

for(const o of observations.observations){
  required(o,['id','supplier_id','item_id','observed_at','source_type','verification_status'],`observation ${o.id}`);
  if(!supplierIds.has(o.supplier_id)) errors.push(`observation ${o.id}: unknown supplier ${o.supplier_id}`);
  if(!itemIds.has(o.item_id)) errors.push(`observation ${o.id}: unknown item ${o.item_id}`);
  if(!sourceTypes.has(o.source_type)) errors.push(`observation ${o.id}: unknown source type ${o.source_type}`);
  if(o.source_url&&!validUrl(o.source_url)) errors.push(`observation ${o.id}: invalid source URL`);
  if(['supplier_confirmed','in_stock_confirmed'].includes(o.verification_status)){
    if(!o.verified_at) errors.push(`observation ${o.id}: ${o.verification_status} requires verified_at`);
    if(!o.evidence_reference) errors.push(`observation ${o.id}: ${o.verification_status} requires evidence_reference`);
    const type=sourceTypes.get(o.source_type);
    if(!type?.can_confirm_availability) errors.push(`observation ${o.id}: source type ${o.source_type} cannot confirm availability`);
  }
  if(o.verification_status==='in_stock_confirmed'&&o.price_reported!==undefined&&!o.currency) errors.push(`observation ${o.id}: price requires currency`);
  if(o.expires_at&&new Date(o.expires_at)<=new Date(o.verified_at||o.observed_at)) errors.push(`observation ${o.id}: expires_at must be after verification`);
}

for(const opp of opportunities.opportunities){
  required(opp,['id','title','type','location','issuer','deadline','status','source_url','source_checked_at'],`opportunity ${opp.id}`);
  if(!validUrl(opp.source_url)) errors.push(`opportunity ${opp.id}: invalid source URL`);
  if(opp.status==='active'&&new Date(opp.deadline).getTime()<Date.now()) errors.push(`opportunity ${opp.id}: active opportunity is already expired`);
}

const now=Date.now();
for(const o of observations.observations){
  if(o.expires_at&&new Date(o.expires_at).getTime()<now&& !['needs_reconfirmation','unavailable'].includes(o.verification_status)){
    warn.push(`observation ${o.id}: freshness expired; UI must downgrade to needs_reconfirmation`);
  }
}

console.log(`Source AO data QA: ${catalog.items.length} items, ${suppliers.suppliers.length} suppliers, ${services.providers.length} service providers, ${observations.observations.length} observations, ${opportunities.opportunities.length} opportunities.`);
warn.forEach(x=>console.warn('WARN:',x));
if(errors.length){errors.forEach(x=>console.error('ERROR:',x));process.exit(1)}
console.log('Source AO data QA: PASS');
