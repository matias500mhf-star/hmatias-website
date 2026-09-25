import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const script=path.resolve(here,'../scripts/export-seed-sql.mjs');

test('D1 seed export avoids unsupported explicit SQL transactions',()=>{
  const sql=execFileSync(process.execPath,[script],{encoding:'utf8'});
  assert.match(sql,/PRAGMA foreign_keys = ON;/);
  assert.doesNotMatch(sql,/\bBEGIN\s+TRANSACTION\b/i);
  assert.doesNotMatch(sql,/\bSAVEPOINT\b/i);
  assert.doesNotMatch(sql,/\bCOMMIT\s*;/i);
  assert.match(sql,/INSERT OR REPLACE INTO suppliers/);
  assert.match(sql,/INSERT OR REPLACE INTO items/);
  assert.match(sql,/INSERT OR REPLACE INTO supplier_sources/);
});
