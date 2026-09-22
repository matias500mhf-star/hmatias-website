import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.resolve(here,'../../data');
const read=name=>JSON.parse(fs.readFileSync(path.join(dataDir,name),'utf8'));
const esc=value=>value==null?'NULL':`'${String(value).replaceAll("'","''")}'`;
const json=value=>esc(JSON.stringify(value??[]));
const normalize=value=>(value||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

const suppliers=read('suppliers.json').suppliers||[];
const services=read('services.json').providers||[];
const opportunities=read('opportunities.json').opportunities||[];

const sql=[];
sql.push('PRAGMA foreign_keys = ON;','BEGIN TRANSACTION;');

for(const s of suppliers){
  sql.push(`INSERT OR REPLACE INTO suppliers(id,name,legal_name,location,website,public_status,last_verified_at) VALUES(${esc(s.id)},${esc(s.name)},${esc(s.legal_name)},${esc(s.location)},${esc(s.website)},${esc(s.verification_status||'source_checked')},${esc(s.last_verified_at)});`);
}

for(const p of services){
  const searchText=normalize([p.name,p.service_category,...(p.specialties||[])].join(' '));
  sql.push(`INSERT OR REPLACE INTO service_providers(id,name,service_category,specialties_json,location,website,verification_status,last_verified_at,search_text) VALUES(${esc(p.id)},${esc(p.name)},${esc(p.service_category)},${json(p.specialties)},${esc(p.location)},${esc(p.website)},${esc(p.verification_status||'source_checked')},${esc(p.last_verified_at)},${esc(searchText)});`);
}

for(const o of opportunities){
  sql.push(`INSERT OR REPLACE INTO opportunities(id,title,type,sector,location,issuer,reference,published_at,deadline,status,source_url,source_checked_at,scope_summary,source_fit) VALUES(${esc(o.id)},${esc(o.title)},${esc(o.type)},${esc(o.sector)},${esc(o.location)},${esc(o.issuer)},${esc(o.reference)},${esc(o.published_at)},${esc(o.deadline)},${esc(o.status)},${esc(o.source_url)},${esc(o.source_checked_at)},${esc(o.scope_summary)},${esc(o.source_fit)});`);
}

sql.push('COMMIT;');
process.stdout.write(sql.join('\n')+'\n');
