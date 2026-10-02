import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const now = Date.parse('2026-10-02T10:00:00Z');
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}

// Exercise the actual page functions without starting its network/DOM lifecycle.
const source = readFileSync(new URL('../../opportunity-radar.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source.replace(/\}\)\(\);\s*$/, 'window.radarTime={fmt,clock,daysLeft,isActive};})();'), {
  window, document: {addEventListener() {}}, Date: FixedDate, Intl, URLSearchParams
});
const {fmt, clock, daysLeft, isActive} = window.radarTime;

test('Radar preserves the Angola deadline date in every visitor timezone', () => {
  assert.match(fmt('2026-10-02T23:59:59+01:00'), /^02\D.*2026$/);
  assert.match(fmt('2026-10-03T00:15:00+01:00'), /^03\D.*2026$/);
  assert.equal(clock('2026-10-02T10:00:00Z'), '11:00');
});

test('Radar counts Angola calendar days so a deadline tonight closes today', () => {
  assert.equal(daysLeft('2026-10-02T23:59:59+01:00'), 0);
  assert.equal(daysLeft('2026-10-03T00:15:00+01:00'), 1);
});

test('Radar removes expired opportunities at the exact deadline, including cached rows', () => {
  assert.equal(isActive({deadline:'2026-10-02T11:00:01+01:00'}), true);
  assert.equal(isActive({deadline:'2026-10-02T11:00:00+01:00'}), false);
  assert.equal(isActive({deadline:'2026-10-02T10:59:59+01:00'}), false);
  assert.equal(isActive({deadline:'invalid'}), false);
  assert.equal(isActive({}), false);
  assert.equal(isActive({deadline:'2026-10-03T00:15:00+01:00',status:'closed'}), false);
});
