import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../../opportunity-radar.css', import.meta.url), 'utf8');

test('Radar responsive overrides remain after the catalogue desktop grid', () => {
  const desktop = css.lastIndexOf('.op-card{padding:28px 22px;grid-template-columns:116px minmax(0,1fr) 250px}');
  const tablet = css.lastIndexOf('.op-card{grid-template-columns:90px minmax(0,1fr)}');
  const mobile = css.lastIndexOf('.op-card{grid-template-columns:minmax(0,1fr);gap:18px;padding:22px 18px}');
  const mobileSide = css.lastIndexOf('.op-side{grid-column:1}');

  assert.ok(desktop >= 0, 'catalogue desktop grid must remain defined');
  assert.ok(tablet > desktop, 'tablet override must come after the desktop grid');
  assert.ok(mobile > desktop, 'mobile single-column override must come after the desktop grid');
  assert.ok(mobileSide > desktop, 'mobile side panel must return to column 1 after the desktop grid');
});
