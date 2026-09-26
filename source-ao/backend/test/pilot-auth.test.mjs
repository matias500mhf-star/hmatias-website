import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdmin} from '../src/index.js';

const req=token=>new Request('https://example.test/api/admin/items',{headers:{authorization:`Bearer ${token}`}});

test('primary admin token remains valid in staging',()=>{
  assert.equal(isAdmin(req('primary-secret'),{
    SOURCE_AO_ENV:'staging',
    ADMIN_API_TOKEN:'primary-secret',
    PILOT_ADMIN_API_TOKEN:'pilot-secret'
  }),true);
});

test('ephemeral pilot token is accepted only in staging',()=>{
  assert.equal(isAdmin(req('pilot-secret'),{
    SOURCE_AO_ENV:'staging',
    ADMIN_API_TOKEN:'primary-secret',
    PILOT_ADMIN_API_TOKEN:'pilot-secret'
  }),true);

  assert.equal(isAdmin(req('pilot-secret'),{
    SOURCE_AO_ENV:'production',
    ADMIN_API_TOKEN:'primary-secret',
    PILOT_ADMIN_API_TOKEN:'pilot-secret'
  }),false);
});

test('unknown token is rejected',()=>{
  assert.equal(isAdmin(req('wrong-secret'),{
    SOURCE_AO_ENV:'staging',
    ADMIN_API_TOKEN:'primary-secret',
    PILOT_ADMIN_API_TOKEN:'pilot-secret'
  }),false);
});
