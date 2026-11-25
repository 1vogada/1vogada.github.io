// Every line list the page can say (src/lines/*.js through src/core/lines.js allLines()) against the committed snapshot
// tests/unit/lines.snapshot.json: key -> { who, legacy, trigger, lines: [[text, lang, gloss?], ...] }, in definition order.
// Changing a line is: edit src/lines/<file>.js, run   UPDATE_SNAPSHOT=1 node --test tests/unit/lines-snapshot.test.js
// and review the diff of lines.snapshot.json (git diff) before committing both. The snapshot was first generated from the
// registry that matched scripts/legacy.js and scripts/phrasebook.js list for list (the old lines-data.test.js).
// Order matters: line() draws by index, and a list's position decides which key a shared line is traced under.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { lines } from '../../src/core/lines.js';
import '../../src/lines/cards.js';
import '../../src/lines/katana.js';
import '../../src/lines/hand.js';
import '../../src/lines/severed.js';
import '../../src/lines/shelf.js';
import '../../src/lines/phrasebook.js';
import '../../src/lines/page.js';

const FILE = new URL('./lines.snapshot.json', import.meta.url);
const defs = lines.allLines();

/** the snapshot text: one JSON line per line of text, so a diff shows exactly which line changed */
function snapshot() {
  const j = JSON.stringify;
  const out = defs.map((d) => {
    const head = [`"who": ${j(d.who)}`, `"legacy": ${j(d.legacy)}`, `"trigger": ${j(d.trigger)}`];
    const rows = d.lines.map((l) => '   ' + j(l.gloss ? [l.text, l.lang, l.gloss] : [l.text, l.lang]));
    return ` ${j(d.key)}: {\n  ${head.join(',\n  ')},\n  "lines": [\n${rows.join(',\n')}\n  ]\n }`;
  });
  return '{\n' + out.join(',\n') + '\n}\n';
}

test('every line list equals tests/unit/lines.snapshot.json (UPDATE_SNAPSHOT=1 rewrites it)', () => {
  assert.equal(lines.languages(), null, 'no language filter: allLines() lists the original arrays');
  const now = snapshot();
  JSON.parse(now);   // well-formed
  if (process.env.UPDATE_SNAPSHOT === '1') { writeFileSync(FILE, now); return; }
  let want;
  try { want = readFileSync(FILE, 'utf8'); } catch (e) { assert.fail('no tests/unit/lines.snapshot.json: run UPDATE_SNAPSHOT=1 node --test tests/unit/lines-snapshot.test.js'); }
  if (now === want) return;
  const a = want.split('\n'), b = now.split('\n');
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  const key = (rows) => { for (let k = i; k >= 0; k--) { const m = /^ "([^"]+)": \{$/.exec(rows[k] || ''); if (m) return m[1]; } return '?'; };
  assert.fail(`the lines differ from tests/unit/lines.snapshot.json at line ${i + 1} (list "${key(b)}"):\n  snapshot: ${a[i]}\n  now:      ${b[i]}\n` +
    'If the change is meant: UPDATE_SNAPSHOT=1 node --test tests/unit/lines-snapshot.test.js, then review git diff tests/unit/lines.snapshot.json');
});

test('the first rip line after a load is the cheese pull: hand.rip[0]', () => {
  assert.equal(lines.list('hand.rip')[0], 'CHEESE PULL!!!!');
});

test('legacy: paths are unique and rebuild window.__lines from the very same arrays', () => {
  const leg = lines.legacy(), seen = new Set();
  for (const d of defs) {
    if (!d.legacy) continue;
    assert.ok(!seen.has(d.legacy), `legacy path ${d.legacy} used once`); seen.add(d.legacy);
    const [top, sub] = d.legacy.split('.');
    assert.equal(sub == null ? leg[top] : leg[top][sub], lines.list(d.key), `__lines.${d.legacy} is the array line('${d.key}') picks from`);
  }
});

test('a line shared by several lists has the same gloss in each', () => {
  const gloss = new Map();
  for (const d of defs) for (const l of d.lines) {
    if (typeof l.text !== 'string') continue;
    if (!gloss.has(l.text)) gloss.set(l.text, [d.key, l.gloss]);
    else assert.equal(l.gloss, gloss.get(l.text)[1], `${JSON.stringify(l.text)}: ${d.key} and ${gloss.get(l.text)[0]}`);
  }
});

test('every line carries its language tag (Cyrillic = bg, kana/kanji = ja, else en)', () => {
  const byScript = (s) => (typeof s !== 'string' ? 'en' : /[぀-ヿ㐀-鿿]/.test(s) ? 'ja' : /[Ѐ-ӿ]/.test(s) ? 'bg' : 'en');
  for (const d of defs) for (const l of d.lines) assert.equal(l.lang, byScript(l.text), `${d.key}: ${JSON.stringify(l.text)}`);
});
