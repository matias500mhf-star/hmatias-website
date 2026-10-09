import test from 'node:test';
import assert from 'node:assert/strict';
import {sendPendingIntakeAlerts,deliveryReady,retryMinutes,alertText} from '../src/intake-alerts.js';
import {encryptPrivateText} from '../src/sourcing.js';

const input=()=>({
 id:'alert_sr_sr_test',source_type:'sourcing_request',source_id:'sr_test',
 reference:'SAO-20261009-ABC123',state:'pending',attempts:0
});
function makeDb(secret){
 let state='pending',emailSentAt=null,attempts=0;
 const db={
  get state(){return state},get attempts(){return attempts},get sentAt(){return emailSentAt},
  prepare(sql){let values=[];
   return {bind(...v){values=v;return this},
    async all(){return {results:[input()]}},
    async first(){
     if(sql.includes('FROM sourcing_requests WHERE id=')){
      return {public_ref:'SAO-20261009-ABC123',requirement_text:'HELMET',specification:'EN 397',
       quantity:20,unit:'un',location:'Camama',needed_by:'urgent',status:'received',
       contact_encrypted:await encryptPrivateText('procurement@example.test',secret)};
     }
     return null;
    },
    async run(){
     if(sql.includes("SET state='sent'")){state='sent';emailSentAt=values[0];}
     else if(sql.includes('SET attempts=?')){attempts=values[0];}
     return {success:true}
    }
   };
  }
 };return db;
}
test('no notification claims without email credentials',async()=>{
 const db=makeDb('private_test_key');
 assert.equal(deliveryReady({SOURCE_AO_DB:db}),false);
 const result=await sendPendingIntakeAlerts({SOURCE_AO_DB:db});
 assert.deepEqual(result,{configured:false,processed:0,sent:0,failed:0});
 assert.equal(db.state,'pending');
});
test('retry backoff is bounded',()=>{assert.equal(retryMinutes(1),5);assert.equal(retryMinutes(2),10);assert.equal(retryMinutes(20),1280)});
test('notification has correct reference and requirements',()=>{
 const t=alertText('sourcing_request',{public_ref:'SAO-20261009-ABC123',requirement_text:'PVC',
  specification:'FF',quantity:15,unit:'kg',location:'Camama',needed_by:'urgent',status:'received'},'buyer@example.test');
 assert.match(t,/PVC/);assert.match(t,/15/);assert.match(t,/kg/);assert.match(t,/Camama/);assert.match(t,/FF/);
});
test('stored Source AO requests notify HMATIAS only after provider accepts message',async()=>{
 const db=makeDb('private_test_key'),calls=[];
 const env={SOURCE_AO_DB:db,RESEND_API_KEY:'test-token',SOURCE_AO_ALERT_FROM:'HMATIAS <hello@example.test>',
   SOURCE_AO_ALERT_TO:'geral@example.test',PII_ENCRYPTION_KEY:'private_test_key'};
 const before=globalThis.fetch;
 globalThis.fetch=async(url,args)=>{
   calls.push({url:String(url),body:JSON.parse(args.body),key:args.headers['Idempotency-Key']});
   return new Response(JSON.stringify({id:'email_test'}),{status:200});
 };
 try{
  const x=await sendPendingIntakeAlerts(env);
  assert.equal(x.sent,1);assert.equal(x.failed,0);assert.equal(db.state,'sent');
  assert.equal(calls.length,1);assert.equal(calls[0].body.to[0],'geral@example.test');
  assert.match(calls[0].body.text,/HELMET/);assert.match(calls[0].body.text,/EN 397/);
  assert.match(calls[0].body.text,/procurement@example.test/);
 }finally{globalThis.fetch=before}
});
test('failed email remains pending with retry',async()=>{
 const db=makeDb('test-key');
 const env={SOURCE_AO_DB:db,RESEND_API_KEY:'test',SOURCE_AO_ALERT_FROM:'test@example.test',SOURCE_AO_ALERT_TO:'sales@example.test',PII_ENCRYPTION_KEY:'test-key'};
 const before=globalThis.fetch;globalThis.fetch=async()=>new Response('{}',{status:503});
 try{
  const x=await sendPendingIntakeAlerts(env);assert.equal(x.failed,1);assert.equal(x.sent,0);
  assert.equal(db.state,'pending');assert.equal(db.attempts,1);
 }finally{globalThis.fetch=before}
});
