import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSafeDiscoveryUrl,
  htmlToText,
  scoreDiscoveryEvidence
} from '../src/collector-discovery.js';

test('discovery URL guard blocks local and private network targets',()=>{
  for(const url of [
    'http://localhost/admin',
    'http://127.0.0.1/',
    'http://10.0.0.8/',
    'http://192.168.1.4/',
    'http://172.20.1.1/',
    'http://169.254.1.1/',
    'file:///etc/passwd'
  ]){
    assert.equal(isSafeDiscoveryUrl(url),false,url);
  }
  assert.equal(isSafeDiscoveryUrl('https://example.com/catalogo'),true);
});

test('html extraction drops executable markup and keeps supplier evidence',()=>{
  const text=htmlToText('<html><head><title>Fornecedor</title><style>.x{}</style></head><body><script>alert(1)</script><h1>Cinta PP 9mm</h1><p>Embalagem industrial em Luanda</p></body></html>');
  assert.match(text,/Cinta PP 9mm/);
  assert.match(text,/Luanda/);
  assert.doesNotMatch(text,/alert/);
});

test('discovery evidence ranking rewards query and curated capability overlap',()=>{
  const run={
    query:'cinta PP 9mm',
    query_variants_json:JSON.stringify(['PP strapping 9mm','cinta de arquear 9mm'])
  };
  const supplier={
    website:'https://example.com',
    capabilities_json:JSON.stringify(['polypropylene packaging','industrial packaging'])
  };
  const strong=scoreDiscoveryEvidence(run,supplier,'Fornecedor de PP strapping e cinta PP 9mm para embalagem industrial em Luanda.');
  const weak=scoreDiscoveryEvidence(run,supplier,'Empresa de serviços administrativos e mobiliário.');
  assert.ok(strong>weak);
  assert.ok(strong>=14);
});
