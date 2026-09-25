import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCollectorCandidate,scoreCollectorCandidate} from '../src/collector.js';

test('collector candidate keeps traceable source metadata without claiming stock',()=>{
  const candidate=normalizeCollectorCandidate({
    supplier_name:'Fornecedor Angola',
    source_url:'https://example.com/catalogo',
    source_type:'catalog',
    location:'Luanda, Angola',
    phone:'+244 900 000 000',
    matched_variant:'cinta PP 9mm',
    evidence_text:'Catálogo público de materiais de embalagem'
  });
  assert.equal(candidate.normalized_supplier_name,'fornecedor angola');
  assert.equal(candidate.source_type,'catalog');
  assert.equal(candidate.location,'Luanda, Angola');
  assert.ok(!Object.hasOwn(candidate,'stock_confirmed'));
  assert.ok(!Object.hasOwn(candidate,'price'));
});

test('collector rejects non-public or unsupported source references',()=>{
  assert.throws(()=>normalizeCollectorCandidate({
    supplier_name:'Fornecedor',
    source_url:'file:///tmp/catalogo.pdf',
    source_type:'catalog'
  }),/source_url_invalid/);

  assert.throws(()=>normalizeCollectorCandidate({
    supplier_name:'Fornecedor',
    source_url:'https://example.com',
    source_type:'private_memory'
  }),/source_type_invalid/);
});

test('collector ranks a local official source above a weak search result',()=>{
  const run={
    query:'cinta PP 9mm',
    query_variants_json:JSON.stringify(['cinta de arquear 9mm','PP strapping 9mm']),
    location:'Luanda'
  };
  const official=normalizeCollectorCandidate({
    supplier_name:'Embalagens Luanda',
    source_url:'https://example.com/pp',
    source_type:'supplier_website',
    location:'Luanda, Angola',
    whatsapp:'+244 900 000 001',
    matched_variant:'PP strapping 9mm',
    evidence_text:'Cinta PP para embalagem industrial'
  });
  const weak=normalizeCollectorCandidate({
    supplier_name:'Resultado genérico',
    source_url:'https://search.example/result',
    source_type:'search_result',
    location:'Angola',
    evidence_text:'Materiais diversos'
  });
  assert.ok(scoreCollectorCandidate(run,official)>scoreCollectorCandidate(run,weak));
});
