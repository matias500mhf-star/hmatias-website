import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync(new URL('../../requests.js',import.meta.url),'utf8');

function desk(){
  const elements=new Map();
  const classes=new Set(['internal-locked']);
  const failures=new Map();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{
      value:'',textContent:'',innerHTML:'',dataset:{},disabled:false,handlers:{},
      classList:{toggle(){}},
      addEventListener(event,fn){this.handlers[event]=fn;}
    });
    return elements.get(id);
  };
  const document={
    querySelector:element,
    body:{classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}},
    addEventListener(event,fn){if(event==='DOMContentLoaded')fn();}
  };
  const window={SOURCE_AO_RUNTIME:{apiBase:'https://source.test'},addEventListener(){}};
  vm.runInNewContext(script,{
    document,window,AbortController,setTimeout,clearTimeout,Intl,Date,console,
    fetch:async url=>{
      const path=new URL(url).pathname;
      const failure=failures.get(path);
      if(failure==='network')throw new TypeError('Failed to fetch');
      const status=typeof failure==='number'?failure:200;
      const payload=failure==='malformed'?{ok:true}:status===200?{ok:true,results:[]}:{ok:false,error:{code:'unavailable'}};
      return {ok:status===200,status,json:async()=>payload};
    }
  });
  return {
    element,failures,classes,
    async connect(){element('#adminToken').value='test-token';await element('#connectApi').handlers.click();},
    async refresh(){await element('#refreshRequests').handlers.click();}
  };
}

test('a successful empty response is the only case shown as an empty queue',async()=>{
  const d=desk();await d.connect();
  assert.equal(d.element('#openCount').textContent,'0');
  assert.match(d.element('#requestList').innerHTML,/No requests in this view/);
  assert.equal(d.element('#commercialActionCount').textContent,'0 ação(ões)');
  assert.equal(d.element('#apiStatus').dataset.state,'connected');
});

for(const failure of [503,'network','malformed']){
  test(`request ${failure} failure never means zero requests, including after filtering`,async()=>{
    const d=desk();await d.connect();
    d.failures.set('/api/admin/sourcing-requests',failure);await d.refresh();
    assert.equal(d.element('#openCount').textContent,'—');
    assert.match(d.element('#requestList').innerHTML,/Não foi possível carregar os pedidos/);
    d.element('#statusFilter').value='received';d.element('#statusFilter').handlers.change();
    assert.match(d.element('#requestList').innerHTML,/Não foi possível carregar os pedidos/);
    assert.equal(d.element('#apiStatus').dataset.state,'error');
  });
}

test('a commercial action failure is visible and a later refresh recovers',async()=>{
  const d=desk();d.failures.set('/api/admin/commercial-actions',503);await d.connect();
  assert.equal(d.element('#commercialActionCount').textContent,'—');
  assert.match(d.element('#commercialActionList').innerHTML,/Não foi possível carregar as ações/);
  assert.equal(d.element('#apiStatus').dataset.state,'error');
  d.failures.clear();await d.refresh();
  assert.equal(d.element('#commercialActionCount').textContent,'0 ação(ões)');
  assert.equal(d.element('#apiStatus').dataset.state,'connected');
});

test('a failed demand query is unavailable rather than zero',async()=>{
  const d=desk();d.failures.set('/api/admin/demand-radar',503);await d.connect();
  assert.equal(d.element('#demandCount').textContent,'—');
  assert.match(d.element('#demandList').innerHTML,/Não foi possível carregar a procura/);
  assert.equal(d.element('#apiStatus').dataset.state,'error');
});

test('a failed dashboard does not report all private operations loaded',async()=>{
  const d=desk();d.failures.set('/api/admin/commercial-dashboard',503);await d.connect();
  assert.equal(d.element('#apiStatus').dataset.state,'error');
});

test('authentication failure keeps the private desk locked',async()=>{
  const d=desk();d.failures.set('/api/admin/commercial-actions',401);await d.connect();
  assert.ok(d.classes.has('internal-locked'));
  assert.equal(d.element('#apiStatus').dataset.state,'error');
});
