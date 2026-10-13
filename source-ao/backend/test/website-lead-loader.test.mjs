import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {setImmediate as settle} from 'node:timers/promises';

const loader=readFileSync(new URL('../../../website-lead-client.js',import.meta.url),'utf8');
const intake=readFileSync(new URL('../../../website-lead-intake.js',import.meta.url),'utf8');

function page({observerSupported=true,legacy=false}={}){
  const scripts=[];
  let observer;
  const form={listeners:new Map(),
    addEventListener(name,fn){this.listeners.set(name,fn);},
    removeEventListener(name,fn){if(this.listeners.get(name)===fn)this.listeners.delete(name);},
    emit(name){this.listeners.get(name)?.();}
  };
  const document={
    readyState:'complete',
    documentElement:{dataset:legacy?{hmatiasLeadsEndpoint:'https://example.test/v1/leads'}:{}},
    currentScript:{src:'https://example.test/website-lead-client.js'},
    getElementById:id=>id==='contactForm'?form:null,
    createElement:()=>({dataset:{}}),
    head:{appendChild:script=>scripts.push(script)}
  };
  const window={};
  if(observerSupported)window.IntersectionObserver=class{
    constructor(callback,options){this.callback=callback;this.options=options;this.disconnected=false;observer=this;}
    observe(target){assert.equal(target,form);}
    disconnect(){this.disconnected=true;}
  };
  const context=vm.createContext({document,window,URL,location:{href:'https://example.test/'}});
  vm.runInContext(loader,context);
  return {scripts,form,observer,context};
}

test('an offscreen form does not load the secure intake during initial rendering',()=>{
  const state=page();
  assert.equal(state.scripts.length,0);
  state.observer.callback([{isIntersecting:false}]);
  assert.equal(state.scripts.length,0);
});

test('approaching the form loads its intake once, including overlapping interaction',()=>{
  const state=page();
  state.observer.callback([{isIntersecting:true}]);
  state.form.emit('focusin');
  state.observer.callback([{isIntersecting:true}]);
  assert.equal(state.scripts.length,1);
  assert.match(state.scripts[0].src,/^https:\/\/example[.]test\/website-lead-intake[.]js[?]v=/);
  assert.equal(state.observer.disconnected,true);
});

test('direct form interaction starts intake without waiting for intersection',()=>{
  const state=page();
  state.form.emit('pointerdown');
  assert.equal(state.scripts.length,1);
});

test('duplicate loaders do not install a second observer or intake script',()=>{
  const state=page();
  vm.runInContext(loader,state.context);
  state.form.emit('focusin');
  assert.equal(state.scripts.length,1);
});

test('unsupported observers preserve eager loading and configured legacy intake stays separate',()=>{
  assert.equal(page({observerSupported:false}).scripts.length,1);
  const legacy=page({legacy:true});
  assert.equal(legacy.scripts.length,0);
  assert.equal(legacy.observer,undefined);
});

test('a late intake capability response preserves an already-prepared manual request',async()=>{
  const button={textContent:'Preparar pedido',closest:()=>null,parentElement:{}};
  const form={dataset:{},querySelector:selector=>{
    if(selector.includes('[data-hmatias-send-actions]'))return {};
    if(selector==='button[type="submit"]')return button;
    return null;
  }};
  const requests=[];
  const document={readyState:'complete',documentElement:{lang:'pt-AO',dataset:{}},
    getElementById:id=>id==='contactForm'?form:null};
  vm.runInNewContext(intake,{document,window:{turnstile:{}},AbortSignal,
    fetch:async url=>{requests.push(url);return {ok:true,json:async()=>({enabled:true,turnstileSiteKey:'test-site-key'})};}});
  await settle();
  assert.equal(button.textContent,'Preparar pedido');
  assert.equal(form.dataset.hmatiasWebsiteIntake,undefined);
  assert.equal(requests.length,1);
  assert.ok(requests[0].endsWith('/config'));
});
