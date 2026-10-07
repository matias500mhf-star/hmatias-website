// Read-only production check: no contacts, bids or commercial state changes.
import assert from 'node:assert/strict';

const base=(process.env.SOURCE_AO_PRODUCTION_API_BASE||'').replace(/\/$/,'');
const token=process.env.SOURCE_AO_ADMIN_API_TOKEN;
if(!/^https:\/\//.test(base)||!token)throw new Error('Protected pursuit smoke configuration is missing.');
const url=base+'/api/admin/opportunity-pursuits';

const anonymous=await fetch(url,{signal:AbortSignal.timeout(15000)});
assert.equal(anonymous.status,401,'Commercial pursuits must reject anonymous access.');
await anonymous.body?.cancel();

const response=await fetch(url,{
  headers:{accept:'application/json',authorization:`Bearer ${token}`},
  signal:AbortSignal.timeout(15000)
});
assert.equal(response.status,200,'Production pursuit endpoint and migration must be available.');
const data=await response.json();
assert.equal(data.ok,true);
assert.equal(data.confidential,true);
assert.ok(Array.isArray(data.pursuits));
assert.equal(typeof data.summary?.opportunities,'number');
assert.equal(data.summary.opportunities,data.pursuits.length);
console.log('Production opportunity pursuits passed: authenticated access, schema and anonymous denial.');
