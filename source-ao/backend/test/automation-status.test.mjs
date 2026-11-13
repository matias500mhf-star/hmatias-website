import test from 'node:test';
import assert from 'node:assert/strict';
import {automationStatusResponse,summarizeAutomationSources} from '../src/automation-status.js';

const now=Date.parse('2026-11-13T12:00:00.000Z');

test('automation summary reports healthy source cadence without exposing source records',()=>{
  const summary=summarizeAutomationSources([
    {scan_interval_minutes:60,last_checked_at:'2026-11-13T11:30:00.000Z',last_success_at:'2026-11-13T11:30:00.000Z',last_error:null},
    {scan_interval_minutes:180,last_checked_at:'2026-11-13T09:30:00.000Z',last_success_at:'2026-11-13T09:30:00.000Z',last_error:null}
  ],now);

  assert.equal(summary.status,'operational');
  assert.equal(summary.active_sources,2);
  assert.equal(summary.overdue_sources,0);
  assert.equal(summary.sources_with_last_error,0);
  assert.equal(summary.last_checked_at,'2026-11-13T11:30:00.000Z');
});

test('automation summary flags sources that are overdue or failing',()=>{
  const summary=summarizeAutomationSources([
    {scan_interval_minutes:60,last_checked_at:'2026-11-13T08:00:00.000Z',last_success_at:'2026-11-13T08:00:00.000Z',last_error:null},
    {scan_interval_minutes:60,last_checked_at:'2026-11-13T11:00:00.000Z',last_success_at:'2026-11-13T10:00:00.000Z',last_error:'upstream_unavailable'}
  ],now);

  assert.equal(summary.status,'attention');
  assert.equal(summary.overdue_sources,1);
  assert.equal(summary.sources_with_last_error,1);
});

test('automation summary handles an empty source registry explicitly',()=>{
  assert.equal(summarizeAutomationSources([],now).status,'not_configured');
});

test('automation status endpoint returns only aggregate public information',async()=>{
  const env={
    PUBLIC_ORIGIN:'https://preview.example',
    SOURCE_AO_DB:{
      prepare(sql){
        return {
          all:async()=>({results:[{scan_interval_minutes:60,last_checked_at:'2026-11-13T11:30:00.000Z',last_success_at:'2026-11-13T11:30:00.000Z',last_error:null}]}),
          bind(value){return {first:async()=>({active_angola:4,last_source_checked_at:'2026-11-13T11:00:00.000Z',received_at:value})}}
        };
      }
    }
  };
  const response=await automationStatusResponse(env,now);
  const body=await response.json();

  assert.equal(response.status,200);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://preview.example');
  assert.equal(body.status,'operational');
  assert.equal(body.sources.active_sources,1);
  assert.equal(body.public_opportunities.active_angola,4);
  assert.equal(JSON.stringify(body).includes('upstream_unavailable'),false);
  assert.equal(JSON.stringify(body).includes('source_url'),false);
});

test('automation status fails closed when the database is unavailable',async()=>{
  const response=await automationStatusResponse({},now);
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{ok:false,status:'unavailable'});
});
