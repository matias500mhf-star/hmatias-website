import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import catalog from '../../data/catalog.json' with {type:'json'};
import {validateRfq} from '../../rfq-model.js';
import {createSourcingRequest,getSourcingRequest,listSourcingRequests,updateSourcingRequestStatus} from '../src/sourcing.js';
import {runMaintenance} from '../src/maintenance.js';

// A real SQLite database exercises migrations, bindings, deduplication and retention.
export function testEnvironment(){
  const db=new DatabaseSync(':memory:');
  const migrations=new URL('../migrations/',import.meta.url);
  for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL(file,migrations),'utf8'));
  const adapter={prepare(sql){return {bind(...args){return {
    async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};},
    async first(){return db.prepare(sql).get(...args)||null;},
    async all(){return {results:db.prepare(sql).all(...args)};}
  };},async all(){return {results:db.prepare(sql).all()};}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}};
  return {db,env:{SOURCE_AO_DB:adapter,PII_ENCRYPTION_KEY:'synthetic-test-encryption-key',ADMIN_API_TOKEN:'synthetic-test-admin-token',CONTACT_RETENTION_DAYS:'180'}};
}
export function rfqFixture(){return {
  rfq_version:1,client_token:'a'.repeat(64),consent:true,website:'',
  items:[{catalog_item_id:'item-ppe-workplace-safety',category:'forged-category',description:'Luvas de proteção',specification:'Tamanho L, EN 388',quantity:25,unit:'par'},{catalog_item_id:'item-vci-corrosion-protection',description:'Proteção VCI',specification:'Ficha técnica necessária',quantity:4,unit:'rolo'}],
  requester_name:'Cliente de teste',company:'Empresa de teste',buyer_type:'company',requester_contact:'+244 900 000 000',contact_channel:'whatsapp',
  location:'Viana, Luanda',needed_by:'',urgency:'urgent',intent:'recurring',alternatives:'discuss',budget:'100000',notes:'Pedido sintético',origin:'catalog',language:'pt'
};}
const request=(data)=>new Request('https://api.test/api/sourcing-requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
const admin=(url,options={})=>new Request('https://api.test'+url,{...options,headers:{authorization:'Bearer synthetic-test-admin-token','content-type':'application/json'}});

test('RFQ validates catalog identity, strict quantities, contact, consent and dates',()=>{
  const input=rfqFixture();const result=validateRfq(input,catalog);
  assert.equal(result.ok,true);assert.equal(result.value.items[0].category,'industrial-supply');
  for(const quantity of [0,-1,Infinity,true,'NaN'])assert.equal(validateRfq({...input,items:[{...input.items[0],quantity}]},catalog).ok,false);
  assert.equal(validateRfq({...input,items:[{...input.items[0],catalog_item_id:'invented'}]},catalog).code,'invalid_catalog_item');
  assert.equal(validateRfq({...input,requester_contact:'abcde'},catalog).code,'invalid_contact');
  assert.equal(validateRfq({...input,consent:false},catalog).code,'invalid_consent');
  assert.equal(validateRfq({...input,needed_by:'2099-02-30'},catalog).code,'invalid_date');
  assert.equal(validateRfq({...input,needed_by:'2000-01-01'},catalog).code,'invalid_date');
  assert.equal(validateRfq({...input,items:Array(21).fill(input.items[0])},catalog).code,'invalid_items');
});

test('RFQ persists once, encrypts qualification and restricts disclosure to admin',async()=>{
  const {db,env}=testEnvironment();const input=rfqFixture();
  const first=await createSourcingRequest(request(input),env);assert.equal(first.status,201);
  const created=(await first.json()).request;assert.equal(created.item_count,2);
  const retry=await createSourcingRequest(request(input),env);assert.equal(retry.status,200);assert.equal((await retry.json()).request.id,created.id);
  assert.equal(db.prepare('SELECT count(*) n FROM sourcing_requests').get().n,1);
  const changed=await createSourcingRequest(request({...input,notes:'Changed payload'}),env);assert.equal(changed.status,409);
  const stored=db.prepare('SELECT * FROM sourcing_requests').get();
  assert.ok(!JSON.stringify(stored).includes(input.requester_name));assert.ok(!JSON.stringify(stored).includes(input.requester_contact));assert.ok(!JSON.stringify(stored).includes(input.client_token));
  const tracking=await getSourcingRequest(new Request('https://api.test'+created.status_path),env,created.id);
  const customer=(await tracking.json()).request;assert.equal(customer.items.length,2);
  for(const field of ['rfq','requester_name','company','requester_contact','contact','budget','notes','internal_notes','rfq_details_encrypted','submission_key_hash'])assert.equal(Object.hasOwn(customer,field),false);
  assert.equal((await getSourcingRequest(new Request('https://api.test/x?token=wrong'),env,created.id)).status,403);
  assert.equal((await listSourcingRequests(new Request('https://api.test/api/admin/sourcing-requests'),env)).status,401);
  const internal=await listSourcingRequests(admin('/api/admin/sourcing-requests'),env);const row=(await internal.json()).results[0];
  assert.equal(row.rfq.requester_name,input.requester_name);assert.equal(row.rfq.items[1].catalog_item_id,input.items[1].catalog_item_id);assert.equal(row.rfq.budget,100000);
  for(const status of ['quoted','awarded','purchased','delivered','completed']){
    const changed=await updateSourcingRequestStatus(admin('/x',{method:'POST',body:JSON.stringify({status})}),env,created.id);assert.equal(changed.status,200);
  }
  db.prepare("UPDATE sourcing_requests SET updated_at='2020-01-01'").run();
  const maintenance=await runMaintenance(env);assert.equal(maintenance.purged_requester_contacts,1);
  const purged=db.prepare('SELECT * FROM sourcing_requests').get();assert.equal(purged.rfq_details_encrypted,'PURGED');assert.equal(purged.contact_encrypted,'PURGED');
  db.close();
});

test('legacy intake is preserved and invalid payloads receive explicit errors',async()=>{
  const {db,env}=testEnvironment();
  const old=await createSourcingRequest(request({requirement_text:'Tubo PVC',requester_contact:'+244 900 000 000',location:'Luanda'}),env);assert.equal(old.status,201);
  const created=(await old.json()).request;assert.equal((await getSourcingRequest(new Request('https://api.test'+created.status_path),env,created.id)).status,200);
  assert.equal((await createSourcingRequest(request(null),env)).status,400);
  assert.equal((await createSourcingRequest(request({x:'x'.repeat(40001)}),env)).status,413);
  assert.equal((await createSourcingRequest(request({...rfqFixture(),rfq_version:99}),env)).status,400);
  db.close();
});
