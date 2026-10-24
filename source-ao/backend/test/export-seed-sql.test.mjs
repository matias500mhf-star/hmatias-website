import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';

const here=path.dirname(fileURLToPath(import.meta.url));
const script=path.resolve(here,'../scripts/export-seed-sql.mjs');

test('D1 seed export avoids unsupported explicit SQL transactions',()=>{
  const sql=execFileSync(process.execPath,[script],{encoding:'utf8'});
  assert.match(sql,/PRAGMA foreign_keys = ON;/);
  assert.doesNotMatch(sql,/\bBEGIN\s+TRANSACTION\b/i);
  assert.doesNotMatch(sql,/\bSAVEPOINT\b/i);
  assert.doesNotMatch(sql,/\bCOMMIT\s*;/i);
});

test('redeployment preserves commercial pursuits, evidence links and operational metadata',t=>{
  const db=new DatabaseSync(':memory:');
  t.after(()=>db.close());
  const migrations=new URL('../migrations/',import.meta.url);
  for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort()){
    db.exec(readFileSync(new URL(file,migrations),'utf8'));
  }
  const sql=execFileSync(process.execPath,[script],{encoding:'utf8'});
  db.exec(sql);
  const opportunity=db.prepare('SELECT id,title FROM opportunities LIMIT 1').get();
  db.prepare(`UPDATE opportunities SET title='Outdated seed title',fit_score=87,
    fit_tags_json='["synthetic-fit"]',created_at='2020-01-01' WHERE id=?`).run(opportunity.id);
  db.prepare(`INSERT INTO opportunity_pursuits(opportunity_id,decision,stage,owner,next_action,notes)
    VALUES(?,'go','preparing_bid','Synthetic owner','Review synthetic quote','Keep commercial history')`).run(opportunity.id);
  const pursuit=db.prepare('SELECT * FROM opportunity_pursuits WHERE opportunity_id=?').get(opportunity.id);
  const source=db.prepare('SELECT id,supplier_id,source_url FROM supplier_sources LIMIT 1').get();
  // A collector may have recorded the same source before the curated seed.
  db.exec(`INSERT INTO search_runs(id,query,normalized_query,location)
    VALUES('seed-test-run','synthetic','synthetic','Luanda');
    INSERT INTO search_candidates(id,search_run_id,supplier_name,normalized_supplier_name,source_url,source_type)
    VALUES('seed-test-candidate','seed-test-run','Synthetic supplier','synthetic supplier','https://example.invalid/evidence','supplier_website');`);
  db.prepare(`UPDATE supplier_sources SET id='seed-test-collected-source',
    search_candidate_id='seed-test-candidate',evidence_text='Keep collected evidence' WHERE id=?`).run(source.id);
  db.prepare(`INSERT INTO supplier_sources(id,supplier_id,source_url,source_type)
    VALUES('seed-test-additional-source',?,'https://example.invalid/additional','other')`).run(source.supplier_id);
  const countSources=db.prepare('SELECT count(*) n FROM supplier_sources').get().n;

  // Repeating a deployment must update seed-owned fields without deleting rows.
  db.exec(sql);
  db.exec(sql);
  assert.deepEqual(db.prepare('SELECT * FROM opportunity_pursuits WHERE opportunity_id=?').get(opportunity.id),pursuit);
  const refreshed=db.prepare('SELECT title,fit_score,fit_tags_json,created_at FROM opportunities WHERE id=?').get(opportunity.id);
  assert.equal(refreshed.title,opportunity.title);
  assert.equal(refreshed.fit_score,87);
  assert.equal(refreshed.fit_tags_json,'["synthetic-fit"]');
  assert.equal(refreshed.created_at,'2020-01-01');
  const collected=db.prepare("SELECT * FROM supplier_sources WHERE id='seed-test-collected-source'").get();
  assert.equal(collected.supplier_id,source.supplier_id);
  assert.equal(collected.search_candidate_id,'seed-test-candidate');
  assert.equal(collected.evidence_text,'Keep collected evidence');
  assert.equal(db.prepare("SELECT supplier_id FROM supplier_sources WHERE id='seed-test-additional-source'").get().supplier_id,source.supplier_id);
  assert.equal(db.prepare('SELECT count(*) n FROM supplier_sources').get().n,countSources);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
