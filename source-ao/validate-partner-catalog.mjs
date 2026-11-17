import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'data','partner-catalog.json'),'utf8'));
const errors=[];
const required=(o,keys,label)=>keys.forEach(k=>{if(o?.[k]===undefined||o?.[k]===null||o?.[k]==='')errors.push(`${label}: missing ${k}`)});
const validUrl=value=>{try{const u=new URL(value);return ['https:'].includes(u.protocol)}catch{return false}};
const unique=(rows,label)=>{const seen=new Set();for(const row of rows){if(seen.has(row.id))errors.push(`${label}: duplicate id ${row.id}`);seen.add(row.id)}};
const forbidden=/(^|_)(internal|private|buying|purchase_cost|supplier_cost|margin|profit|secret|token|password|contact_email|contact_phone)(_|$)/i;
const scan=(value,path='record')=>{
  if(Array.isArray(value)){value.forEach((v,i)=>scan(v,`${path}[${i}]`));return}
  if(value&&typeof value==='object'){
    for(const [key,child] of Object.entries(value)){
      if(forbidden.test(key))errors.push(`${path}: prohibited public field ${key}`);
      scan(child,`${path}.${key}`);
    }
  }
};
if(!Array.isArray(data.partners)||!Array.isArray(data.products))errors.push('partner-catalog: partners and products must be arrays');
const partners=Array.isArray(data.partners)?data.partners:[];
const products=Array.isArray(data.products)?data.products:[];
unique(partners,'partner');
unique(products,'product');
const partnerIds=new Set(partners.map(p=>p.id));
for(const p of partners){
  required(p,['id','display_name','country_code','publication_status'],'partner');
  if(p.publication_status!=='approved')errors.push(`partner ${p.id}: only approved partners may enter the public feed`);
  if(p.website&&!validUrl(p.website))errors.push(`partner ${p.id}: website must use HTTPS`);
  if(p.logo_url&&!validUrl(p.logo_url))errors.push(`partner ${p.id}: logo_url must use HTTPS`);
}
const availabilityStatuses=new Set(['unknown','confirmation_pending','in_stock_confirmed','out_of_stock','made_to_order','discontinued']);
for(const p of products){
  required(p,['id','partner_id','name','category','publication_status','availability'],'product');
  if(!partnerIds.has(p.partner_id))errors.push(`product ${p.id}: unknown partner_id ${p.partner_id}`);
  if(p.publication_status!=='published')errors.push(`product ${p.id}: only published products may enter the public feed`);
  if(!Array.isArray(p.images)||!p.images.length)errors.push(`product ${p.id}: at least one authorized product image is required`);
  for(const img of p.images||[]){
    if(typeof img==='string'){if(!validUrl(img))errors.push(`product ${p.id}: image URL must use HTTPS`);}
    else{
      required(img,['url','alt'],'product image');
      if(img.url&&!validUrl(img.url))errors.push(`product ${p.id}: image URL must use HTTPS`);
    }
  }
  const a=p.availability||{};
  if(!availabilityStatuses.has(a.status))errors.push(`product ${p.id}: invalid availability status`);
  if(a.status==='in_stock_confirmed'){
    required(a,['checked_at','expires_at','confirmation_method'],'product availability');
    if(!a.checked_at||Number.isNaN(Date.parse(a.checked_at)))errors.push(`product ${p.id}: invalid checked_at`);
    if(!a.expires_at||Number.isNaN(Date.parse(a.expires_at))||Date.parse(a.expires_at)<=Date.parse(a.checked_at))errors.push(`product ${p.id}: expires_at must be after checked_at`);
    if(!['supplier_direct','partner_feed','hmatias_verified'].includes(a.confirmation_method))errors.push(`product ${p.id}: invalid confirmation_method`);
  }
  if(p.price){
    if(p.price.public!==true)errors.push(`product ${p.id}: private prices must not be included in the public feed`);
    if(typeof p.price.amount!=='number'||p.price.amount<0||!p.price.currency)errors.push(`product ${p.id}: invalid public price`);
  }
}
scan(data);
console.log(`Source AO partner catalogue QA: ${partners.length} approved partners, ${products.length} published products.`);
if(errors.length){errors.forEach(e=>console.error('ERROR:',e));process.exit(1)}
console.log('Source AO partner catalogue QA: PASS');
