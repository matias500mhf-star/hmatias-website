import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import catalog from '../../data/catalog.json' with {type:'json'};
import publicCatalog from '../../data/public-catalog.json' with {type:'json'};
import {validateRfq,UNITS,CATEGORY_LABELS} from '../../rfq-model.js';
import {createSourcingRequest,getSourcingRequest,listSourcingRequests,updateSourcingRequestStatus} from '../src/sourcing.js';
import core from '../src/index.js';
import router from '../src/router.js';
import {runMaintenance} from '../src/maintenance.js';

// A real SQLite database exercises migrations, bindings, deduplication and retention.
export function testEnvironment(){
  const db=new DatabaseSync(':memory:');
  const migrations=new URL('../migrations/',import.meta.url);
  for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL(file,migrations),'utf8'));
  const seedItem=db.prepare(`INSERT INTO items(
    id,name,name_pt,category,specification,unit,aliases_json,keywords_json,search_text,public_visible,management_mode
  ) VALUES(?,?,?,?,?,?,?,?,?,1,'seed')`);
  for(const item of catalog.items.filter(row=>row.id!=='item-formaldehyde')){
    const searchText=[item.name,item.name_pt,item.specification,...(item.aliases||[]),...(item.keywords||[])].filter(Boolean).join(' ').toLowerCase();
    seedItem.run(item.id,item.name,item.name_pt||item.name,item.category,item.specification||null,item.unit||null,
      JSON.stringify(item.aliases||[]),JSON.stringify(item.keywords||[]),searchText);
  }
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

test('public RFQ preflight allows only the configured origin and JSON POST contract',async()=>{
  const env={PUBLIC_ORIGIN:'https://preview.example',SOURCE_AO_ENV:'staging'};
  const request=new Request('https://api.example/api/sourcing-requests',{
    method:'OPTIONS',
    headers:{
      origin:'https://preview.example',
      'access-control-request-method':'POST',
      'access-control-request-headers':'content-type'
    }
  });
  const response=await router.fetch(request,env);
  assert.equal(response.status,204);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://preview.example');
  assert.match(response.headers.get('access-control-allow-methods')||'',/POST/);
  assert.match(response.headers.get('access-control-allow-headers')||'',/content-type/i);

  const foreign=await router.fetch(new Request('https://api.example/api/sourcing-requests',{
    method:'OPTIONS',
    headers:{
      origin:'https://untrusted.example',
      'access-control-request-method':'POST',
      'access-control-request-headers':'content-type'
    }
  }),env);
  assert.equal(foreign.status,403);
  assert.equal(foreign.headers.get('access-control-allow-origin'),null);

  const unsupportedHeader=await router.fetch(new Request('https://api.example/api/sourcing-requests',{
    method:'OPTIONS',
    headers:{
      origin:'https://preview.example',
      'access-control-request-method':'POST',
      'access-control-request-headers':'authorization,content-type'
    }
  }),env);
  assert.equal(unsupportedHeader.status,403);
});

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

test('every customer-visible RFQ select option satisfies the shared API contract',()=>{
  const publicPage=readFileSync(new URL('../../rfq.html',import.meta.url),'utf8');
  const publicScript=readFileSync(new URL('../../rfq.js',import.meta.url),'utf8');
  assert.ok(publicPage.includes('família de fornecimento'),'RFQ must describe catalogue entries as supply families');
  assert.ok(publicPage.includes('artigo exato'),'RFQ must ask for the exact item specification');
  assert.ok(publicScript.includes('Famílias de fornecimento disponíveis'),'catalogue notice must not imply generic entries are exact products');
  assert.ok(publicScript.includes('Artigo / material / serviço'),'the required description must refer to the requested item');
  assert.ok(publicScript.includes("PUBLIC_EXCLUDED_CATALOG_ITEMS=new Set(['item-formaldehyde'])"),'formaldehyde must not be offered or inferred as a public catalogue family');
  assert.ok(publicScript.includes('!PUBLIC_EXCLUDED_CATALOG_ITEMS.has(item.id)'),'public catalogue and inference must exclude restricted families');
  assert.equal(publicCatalog.items.some(item=>item.id==='item-formaldehyde'),false,'static public fallback must exclude the restricted family');
  assert.equal(publicScript.includes("'/source-ao/data/public-catalog.json'"),true,'RFQ must default to the sanitised static public catalogue');

  const source=readFileSync(new URL('../../rfq.js',import.meta.url),'utf8');
  const review=readFileSync(new URL('../../requests.js',import.meta.url),'utf8');
  const input=rfqFixture();
  for(const label of [
    "institution:'Instituição pública / estatal'",
    "budgeting:'Consulta de orçamento para projecto / instalação'",
    "recurring:'Fornecimento recorrente'",
    "planned:'Compra programada'"
  ]){
    assert.ok(review.includes(label),'RFQ review desk label must match the shared option: '+label);
  }
  assert.ok(source.includes('Guarde a ligação privada'),'RFQ success message must use consistent Portuguese terminology');
  const fields=[['rfqUrgency','urgency'],['rfqIntent','intent'],['rfqBuyer','buyer_type'],['rfqAlternatives','alternatives'],['rfqChannel','contact_channel']];
  for(const [selectId,payloadKey] of fields){
    const select=source.match(new RegExp('<select id="'+selectId+'"[\\s\\S]*?<\\/select>'));
    assert.ok(select,'RFQ select '+selectId+' must exist');
    const values=[...select[0].matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]);
    assert.ok(values.length>0,'RFQ select '+selectId+' must expose choices');
    for(const value of values){
      const candidate={...input,[payloadKey]:value};
      if(payloadKey==='contact_channel'&&value==='email')candidate.requester_contact='buyer@example.com';
      const result=validateRfq(candidate,catalog);
      assert.equal(result.ok,true,'RFQ choice '+selectId+'='+value+' must be accepted by validateRfq');
    }
  }
  for(const category of Object.keys(CATEGORY_LABELS)){
    const candidate={...input,items:input.items.map(item=>({...item,catalog_item_id:null,category}))};
    assert.equal(validateRfq(candidate,catalog).ok,true,'RFQ category '+category+' must be accepted');
  }
  for(const category of ['diamond-tools','measurement-instruments']){
    const candidate={...input,items:input.items.map(item=>({...item,catalog_item_id:null,category}))};
    assert.equal(validateRfq(candidate,{items:[]}).ok,true,'Specialised D1 category '+category+' must be accepted');
  }
  for(const unit of UNITS){
    const candidate={...input,items:input.items.map(item=>({...item,unit}))};
    assert.equal(validateRfq(candidate,catalog).ok,true,'RFQ unit '+unit+' must be accepted');
  }
});

test('a catalog family created and published in Ops Desk is accepted by the live RFQ validator',async()=>{
  const {db,env}=testEnvironment();
  const itemId='item-live-catalog-test';
  const created=await core.fetch(new Request('https://api.test/api/admin/items',{
    method:'POST',
    headers:{authorization:'Bearer synthetic-test-admin-token','content-type':'application/json'},
    body:JSON.stringify({
      id:itemId,name:'Live catalog test item',name_pt:'Artigo de teste live',
      category:'construction',specification:'A database-managed item',unit:'un',
      aliases:['live test'],keywords:['dynamic'],public_visible:true
    })
  }),env);
  assert.equal(created.status,201);

  const input=rfqFixture();
  input.items=[{...input.items[0],catalog_item_id:itemId,category:'construction',description:'Artigo de teste live'}];
  const result=await createSourcingRequest(request(input),env);
  assert.equal(result.status,201);
  const stored=db.prepare('SELECT count(*) n FROM sourcing_requests').get().n;
  assert.equal(stored,1);
  db.close();
});

test('a private catalog family cannot be selected in a public RFQ',async()=>{
  const {db,env}=testEnvironment();
  const itemId='item-private-catalog-test';
  db.prepare(`INSERT INTO items(id,name,category,search_text,public_visible,management_mode)
    VALUES(?,?,?,?,0,'managed')`).run(itemId,'Private item','construction','private item');
  const input=rfqFixture();
  input.items=[{...input.items[0],catalog_item_id:itemId,category:'construction',description:'Private item'}];
  const result=await createSourcingRequest(request(input),env);
  assert.equal(result.status,400);
  assert.equal((await result.json()).error.code,'invalid_catalog_item');
  db.close();
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
