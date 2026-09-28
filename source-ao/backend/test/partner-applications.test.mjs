import test from 'node:test';
import assert from 'node:assert/strict';
import {createPartnerApplication} from '../src/partner-applications.js';

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

test('partner application does not expose private contact in response',async()=>{
  let inserted=false;
  const env={
    PII_ENCRYPTION_KEY:'test-private-key',
    SOURCE_AO_DB:{
      prepare(sql){
        return {
          bind(...args){
            return {
              async first(){return null},
              async run(){inserted=sql.includes('INSERT INTO partner_applications');return {success:true}}
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
    note:'Disponível para manutenção e pequenas obras.'
  }),env);
  assert.equal(res.status,201);
  const body=await res.json();
  assert.equal(body.ok,true);
  assert.match(body.reference,/^PAR-\d{8}-[A-Z0-9]{6}$/);
  assert.equal(Object.hasOwn(body,'email'),false);
  assert.equal(Object.hasOwn(body,'whatsapp'),false);
  assert.equal(inserted,true);
});
