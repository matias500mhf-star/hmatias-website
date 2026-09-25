import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRequirement,
  validateSourcingRequestInput,
  encryptPrivateText,
  decryptPrivateText,
  sha256Hex,
  isAdmin
} from '../src/sourcing.js';

test('sourcing requirement normalization keeps technical meaning',()=>{
  assert.equal(normalizeRequirement('Tubo PVC 110 mm em Luanda'),'tubo pvc 110mm em luanda');
  assert.equal(normalizeRequirement('Formaldeído 37% 5 L'),'formaldeido 37 5l');
});

test('valid sourcing intake preserves exact accepted fields',()=>{
  const result=validateSourcingRequestInput({
    requirement_text:'Tubo PVC 110 mm',
    specification:'PN 10',
    location:'Viana, Luanda',
    requester_contact:'+244 900 000 000',
    quantity:25,
    unit:'un',
    contact_channel:'whatsapp'
  });
  assert.equal(result.ok,true);
  assert.equal(result.value.requirement,'Tubo PVC 110 mm');
  assert.equal(result.value.specification,'PN 10');
  assert.equal(result.value.quantity,25);
  assert.equal(result.value.requestedChannel,'whatsapp');
});

test('sourcing intake rejects truncation and unsafe numeric values',()=>{
  assert.equal(validateSourcingRequestInput({requirement_text:'x',requester_contact:'12345',location:'Luanda'}).code,'invalid_requirement');
  assert.equal(validateSourcingRequestInput({requirement_text:'x'.repeat(241),requester_contact:'12345',location:'Luanda'}).code,'invalid_requirement');
  assert.equal(validateSourcingRequestInput({requirement_text:'PVC',requester_contact:'12345',location:'Luanda',quantity:-1}).code,'invalid_quantity');
  assert.equal(validateSourcingRequestInput({requirement_text:'PVC',requester_contact:'x'.repeat(181),location:'Luanda'}).code,'invalid_contact');
  assert.equal(validateSourcingRequestInput({requirement_text:'PVC',requester_contact:'12345',location:'Luanda',specification:'x'.repeat(301)}).code,'field_too_long');
});

test('private contact encryption round-trips without exposing plaintext',async()=>{
  const secret='unit-test-pii-key';
  const contact='+244 923 000 000';
  const encrypted=await encryptPrivateText(contact,secret);
  assert.notEqual(encrypted,contact);
  assert.equal(encrypted.includes(contact),false);
  assert.equal(await decryptPrivateText(encrypted,secret),contact);
});

test('private access token hashing is deterministic',async()=>{
  const a=await sha256Hex('private-token');
  const b=await sha256Hex('private-token');
  const c=await sha256Hex('other-token');
  assert.equal(a,b);
  assert.notEqual(a,c);
  assert.equal(a.length,64);
});


const adminReq=token=>new Request('https://example.test/api/admin/sourcing-requests',{headers:{authorization:`Bearer ${token}`}});

test('sourcing admin accepts the temporary pilot token only in staging',()=>{
  const staging={
    SOURCE_AO_ENV:'staging',
    ADMIN_API_TOKEN:'primary-secret',
    PILOT_ADMIN_API_TOKEN:'pilot-secret'
  };
  assert.equal(isAdmin(adminReq('primary-secret'),staging),true);
  assert.equal(isAdmin(adminReq('pilot-secret'),staging),true);
  assert.equal(isAdmin(adminReq('wrong-secret'),staging),false);

  assert.equal(isAdmin(adminReq('pilot-secret'),{
    ...staging,
    SOURCE_AO_ENV:'production'
  }),false);
});
