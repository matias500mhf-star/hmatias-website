import test from 'node:test';
import assert from 'node:assert/strict';
import {createPartnerApplication} from '../src/partner-applications.js';
import {readFile} from 'node:fs/promises';

function request(body){
  return new Request('https://source.example/api/partner-applications',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(body)
  });
}

test('partner application rejects incomplete commercial identity',async()=>{
  const env={
    PII_ENCRYPTION_KEY:'test-private-key',
    SOURCE_AO_DB:{prepare(){throw new Error('database should not be reached')}}
  };
  const res=await createPartnerApplication(request({
    company_name:'Empresa Teste',
    locality:'Luanda',
    partner_type:'supplier',
    capabilities:['supply']
  }),env);
  assert.equal(res.status,400);
  const body=await res.json();
  assert.equal(body.error.code,'registration_required');
});

test('partner application requires explicit privacy consent',async()=>{
  const res=await createPartnerApplication(request({
    company_name:'Empresa Técnica Lda',country_code:'AO',locality:'Luanda',partner_type:'service_provider',
    registration_number:'5000000000',contact_name:'Responsável Comercial',email:'comercial@example.com',
    capabilities:['facilities']
  }),{PII_ENCRYPTION_KEY:'test-private-key',SOURCE_AO_DB:{prepare(){throw new Error('database should not be reached')}}});
  assert.equal(res.status,400);
  assert.equal((await res.json()).error.code,'privacy_consent_required');
});

test('partner application does not expose private contact in response',async()=>{
  let inserted=false,insertSql='',insertArgs=[];
  const env={
    PII_ENCRYPTION_KEY:'test-private-key',
    SOURCE_AO_DB:{
      prepare(sql){
        return {
          bind(...args){
            return {
              async first(){return null},
              async run(){inserted=sql.includes('INSERT INTO partner_applications');insertSql=sql;insertArgs=args;return {success:true}}
            };
          }
        };
      }
    }
  };
  const res=await createPartnerApplication(request({
    company_name:'Empresa Técnica Lda',
    country_code:'AO',
    locality:'Luanda',
    partner_type:'service_provider',
    registration_number:'5000000000',
    contact_name:'Responsável Comercial',
    email:'comercial@example.com',
    whatsapp:'+244900000000',
    website:'https://example.com',
    capabilities:['facilities','plumbing'],
    sectors:['construction'],
    note:'Disponível para manutenção e pequenas obras.',
    privacy_consent:true
  }),env);
  assert.equal(res.status,201);
  const body=await res.json();
  assert.equal(body.ok,true);
  assert.match(body.reference,/^PAR-\d{8}-[A-Z0-9]{6}$/);
  assert.equal(Object.hasOwn(body,'email'),false);
  assert.equal(Object.hasOwn(body,'whatsapp'),false);
  assert.equal(inserted,true);
  assert.match(insertSql,/privacy_consent_at/);
  assert.match(insertSql,/privacy_notice_version/);
  assert.equal(insertArgs.at(-1),'source-ao-partner-privacy-2026-11');
});


test('partner privacy migration adds nullable consent audit fields without backfilling old records',async()=>{
  const sql=await readFile(new URL('../migrations/0027_partner_application_privacy_consent.sql',import.meta.url),'utf8');
  assert.match(sql,/ALTER TABLE partner_applications ADD COLUMN privacy_consent_at TEXT/);
  assert.match(sql,/ALTER TABLE partner_applications ADD COLUMN privacy_notice_version TEXT/);
  assert.doesNotMatch(sql,/UPDATE partner_applications/i);
});
