import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {setImmediate as settle} from 'node:timers/promises';

const source=readFileSync(new URL('../../verified-results.js',import.meta.url),'utf8');
const result={ok:true,results:[{type:'item',name:'Stud B7',status:'in_stock_confirmed'}]};

async function radar(search=async()=>result){
  const requests=[];
  const controls=new Map();
  let ready;
  let observer;
  let observedOptions;
  const element=()=>({
    value:'',hidden:false,textContent:'',listeners:new Map(),
    addEventListener(name,fn){this.listeners.set(name,fn);},
    replaceChildren(){},
    emit(name){this.listeners.get(name)?.();}
  });
  const root=element();
  const small=element();
  let status='Luanda · Aguardando fonte verificada';
  Object.defineProperty(small,'textContent',{
    get:()=>status,
    set:value=>{
      status=value;
      // Assigning textContent replaces its text node, even if the text is equal.
      if(observedOptions?.subtree)queueMicrotask(()=>observer.callback([{target:small,type:'childList'}]));
    }
  });
  const row={isConnected:true,querySelector:name=>name==='strong'?{textContent:'Stud ASTM A193 B7'}:small};
  const rows=[row];
  for(const key of ['#verifiedMatches','#smartSearchPlan','#procurementMission','#searchInput',
    '#locationInput','#quantityInput','#neededByInput','#searchForm','#langToggle',
    '#radarForm','#addRadar'])controls.set(key,element());
  controls.set('#radarList',root);
  controls.set('#resultZone',{hidden:true});
  controls.get('#locationInput').value='Luanda';
  const document={
    documentElement:{lang:'pt-AO'},
    querySelector:name=>controls.get(name)||null,
    querySelectorAll:name=>name==='#radarList .radar-item'?rows.filter(r=>r.isConnected):[],
    addEventListener(name,fn){if(name==='DOMContentLoaded')ready=fn;}
  };
  const window={
    SOURCE_AO_RUNTIME:{apiBase:'https://example.test'},
    SourceAOAPI:{isConfigured:()=>true,async search(query,location){
      requests.push({query,location});
      // Bound the unfixed regression so a feedback loop fails without hanging.
      if(requests.length>6)throw new Error('Repeated lookup');
      return search(query,location);
    }},
    SourceAOData:{init:async()=>{},isReady:()=>true,search:()=>({best_status:'source_checked'})}
  };
  class Observer{
    constructor(callback){this.callback=callback;observer=this;}
    observe(target,options){assert.equal(target,root);observedOptions=options;}
  }
  vm.runInNewContext(source,{document,window,MutationObserver:Observer,setTimeout,
    console:{warn(){}},URLSearchParams,Intl,Date});
  await ready();
  await settle();
  return {requests,controls,small,document,row};
}

test('updating a radar evidence label does not issue more API requests',async()=>{
  const state=await radar();
  await settle();
  assert.equal(state.requests.length,1);
  assert.equal(state.small.textContent,'Luanda · Stock confirmado');
});

test('overlapping radar refreshes share the pending lookup and use the current language',async()=>{
  let resolve;
  const pending=new Promise(done=>{resolve=done;});
  const state=await radar(()=>pending);
  state.document.documentElement.lang='en';
  state.controls.get('#langToggle').emit('click');
  state.controls.get('#langToggle').emit('click');
  await new Promise(done=>setTimeout(done,12));
  assert.equal(state.requests.length,1);
  resolve(result);
  await settle();
  assert.equal(state.small.textContent,'Luanda · In stock — confirmed');
});

test('changing search quantity does not re-query unchanged radar entries',async()=>{
  const state=await radar();
  const count=state.requests.length;
  state.controls.get('#quantityInput').emit('change');
  await new Promise(done=>setTimeout(done,12));
  assert.equal(state.requests.length,count);
});

test('a completed lookup cannot update a radar entry that was removed',async()=>{
  let resolve;
  const pending=new Promise(done=>{resolve=done;});
  const state=await radar(()=>pending);
  const before=state.small.textContent;
  state.row.isConnected=false;
  resolve(result);
  await settle();
  assert.equal(state.small.textContent,before);
});
