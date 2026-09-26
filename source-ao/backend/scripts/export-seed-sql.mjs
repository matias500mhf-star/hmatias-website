import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.resolve(here,'../../data');
const read=name=>JSON.parse(fs.readFileSync(path.join(dataDir,name),'utf8'));
const esc=value=>value==null?'NULL':`'${String(value).replaceAll("'","''")}'`;
const json=value=>esc(JSON.stringify(value??[]));
const normalize=value=>(value||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

const sourceTypeForSupplierUrl=(supplier,url)=>{
  try{
    const source=new URL(url);
    const website=supplier.website?new URL(supplier.website):null;
    if(/\.pdf(?:$|[?#])/i.test(source.pathname)) return 'catalog';
    if(website && source.hostname.replace(/^www\./,'')===website.hostname.replace(/^www\./,'')) return 'supplier_website';
    if(/(?:waze|yellowmega|agroportal)/i.test(source.hostname)) return 'directory';
    return 'other';
  }catch{
    return 'other';
  }
};

const suppliers=read('suppliers.json').suppliers||[];
const catalog=read('catalog.json').items||[];
const observations=read('observations.json').observations||[];
const services=read('services.json').providers||[];
const opportunities=read('opportunities.json').opportunities||[];

const sql=[];
sql.push('PRAGMA foreign_keys = ON;');

for(const s of suppliers){
  sql.push(`INSERT OR REPLACE INTO suppliers(id,name,legal_name,location,website,public_status,last_verified_at,categories_json,capabilities_json,phone,whatsapp,email) VALUES(${esc(s.id)},${esc(s.name)},${esc(s.legal_name)},${esc(s.location)},${esc(s.website)},${esc(s.verification_status||'source_checked')},${esc(s.last_verified_at)},${json(s.category||[])},${json(s.capabilities||[])},${esc(s.phone)},${esc(s.whatsapp)},${esc(s.email)});`);
  const sourceUrls=[...(s.source_urls||[])];
  if(s.website && !sourceUrls.includes(s.website)) sourceUrls.unshift(s.website);
  for(const sourceUrl of sourceUrls){
    const sourceId=`seed-source-${normalize(s.id+' '+sourceUrl).replaceAll(' ','-').slice(0,110)}`;
    sql.push(`INSERT OR REPLACE INTO supplier_sources(id,supplier_id,search_candidate_id,source_url,source_type,title,evidence_text,source_checked_at) VALUES(${esc(sourceId)},${esc(s.id)},NULL,${esc(sourceUrl)},${esc(sourceTypeForSupplierUrl(s,sourceUrl))},${esc(s.name)},NULL,${esc(s.last_verified_at)});`);
  }
}

for(const item of catalog){
  const searchText=normalize([item.name,item.specification,...(item.aliases||[]),...(item.keywords||[])].join(' '));
  sql.push(`INSERT OR REPLACE INTO items(id,name,category,specification,unit,aliases_json,search_text) VALUES(${esc(item.id)},${esc(item.name)},${esc(item.category)},${esc(item.specification)},${esc(item.unit)},${json(item.aliases)},${esc(searchText)});`);
}

for(const o of observations){
  const approvedAt=o.approved_at||o.verified_at||o.observed_at;
  const approvedBy=o.approved_by||'source-ao-curated-seed';
  sql.push(`INSERT OR REPLACE INTO observations(id,supplier_id,item_id,verification_request_id,observed_at,verified_at,source_type,verification_status,quantity_reported,price_reported,currency,location,evidence_reference,expires_at,approved_at,approved_by) VALUES(${esc(o.id)},${esc(o.supplier_id)},${esc(o.item_id)},${esc(o.verification_request_id)},${esc(o.observed_at)},${esc(o.verified_at||o.observed_at)},${esc(o.source_type)},${esc(o.verification_status)},${esc(o.quantity_reported)},${esc(o.price_reported)},${esc(o.currency)},${esc(o.location)},${esc(o.evidence_reference||o.source_url||'curated public source')},${esc(o.expires_at||o.verified_at||o.observed_at)},${esc(approvedAt)},${esc(approvedBy)});`);
}

for(const p of services){
  const searchText=normalize([p.name,p.service_category,...(p.specialties||[])].join(' '));
  sql.push(`INSERT OR REPLACE INTO service_providers(id,name,service_category,specialties_json,location,website,verification_status,last_verified_at,search_text) VALUES(${esc(p.id)},${esc(p.name)},${esc(p.service_category)},${json(p.specialties)},${esc(p.location)},${esc(p.website)},${esc(p.verification_status||'source_checked')},${esc(p.last_verified_at)},${esc(searchText)});`);
}

for(const o of opportunities){
  sql.push(`INSERT OR REPLACE INTO opportunities(id,title,type,sector,location,issuer,reference,published_at,deadline,status,source_url,source_checked_at,scope_summary,source_fit) VALUES(${esc(o.id)},${esc(o.title)},${esc(o.type)},${esc(o.sector)},${esc(o.location)},${esc(o.issuer)},${esc(o.reference)},${esc(o.published_at)},${esc(o.deadline)},${esc(o.status)},${esc(o.source_url)},${esc(o.source_checked_at)},${esc(o.scope_summary)},${esc(o.source_fit)});`);
}

process.stdout.write(sql.join('\n')+'\n');
