// src/lines/*.js against the legacy sources. The legacy list literals are read out of scripts/legacy.js and
// scripts/phrasebook.js here and evaluated, never copied by hand: every legacy list must sit under exactly one key with the
// same content and order, every phrasebook trigger (CHAPTERS) and every gloss (GLOSS) must have landed on a key, the
// `legacy:` paths must rebuild window.__lines, and every line must carry its language tag.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lines } from '../../src/core/lines.js';
import '../../src/lines/cards.js';
import '../../src/lines/katana.js';
import '../../src/lines/hand.js';
import '../../src/lines/severed.js';
import '../../src/lines/shelf.js';
import '../../src/lines/phrasebook.js';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const LEG = read('scripts/legacy.js'), PB = read('scripts/phrasebook.js');

/** the value of `const <name> = <literal>` in a source file: the literal is cut out by bracket matching (strings and
 *  line comments skipped) and evaluated */
function literal(src, name) {
  const decl = `const ${name} = `, at = src.indexOf(decl);
  assert.ok(at >= 0, `${name} found in the legacy source`);
  assert.equal(src.indexOf(decl, at + 1), -1, `${name} declared once`);
  const start = at + decl.length; let depth = 0, q = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '/' && src[i + 1] === '/') { while (src[i] !== '\n') i++; continue; }
    if (c === '[' || c === '{') depth++;
    else if ((c === ']' || c === '}') && --depth === 0) return new Function(`return (${src.slice(start, i + 1)});`)();
  }
  throw new Error(`${name}: unterminated literal`);
}

const L = {};
for (const n of ['SAY', 'CLAW_SAY', 'AGONY', 'PANIC', 'NOTME', 'BEG', 'SEV_SAY', 'hellos', 'FORTUNES']) L[n] = literal(LEG, n);
const RAID = { RAID_SAY: 'bored', SWAT_SAY: 'swat', GRUDGE_SAY: 'grudge', ANGRY_SAY: 'angry', SCROLL_SAY: 'scroll', HELP_SAY: 'help', ALONE_SAY: 'alone', MORE_SAY: 'more', HIDE_SAY: 'hide' };
for (const n of Object.keys(RAID)) L[n] = literal(PB, n);
const CHAPTERS = literal(PB, 'CHAPTERS'), GLOSS = literal(PB, 'GLOSS');
// the phrasebook's own names for its lists (build(): BOOK: RAID_SAY, SWAT: SWAT_SAY, ...)
const PB_SRC = { BOOK: 'RAID_SAY', SWAT: 'SWAT_SAY', GRUDGE: 'GRUDGE_SAY', ANGRY: 'ANGRY_SAY', SCROLL: 'SCROLL_SAY', HELP: 'HELP_SAY', ALONE: 'ALONE_SAY', MORE: 'MORE_SAY', HIDE: 'HIDE_SAY' };

// every legacy list, by legacy name, and the key it must be under (src/README.md "Line keys")
const KATANA = { kdrop: 'drop', khello: 'hello', kbrag: 'brag', kcut: 'cut' };
const expected = [];   // [legacyName, list, key]
for (const [k, v] of Object.entries(L.SAY)) expected.push([`SAY.${k}`, v, k === 'btnhi' ? 'button.hi' : KATANA[k] ? `katana.${KATANA[k]}` : `card.${k}`]);
for (const [k, v] of Object.entries(L.CLAW_SAY)) expected.push([`CLAW_SAY.${k}`, v, `hand.${k}`]);
for (const [k, v] of Object.entries(L.SEV_SAY)) expected.push([`SEV_SAY.${k}`, v, `sev.${k}`]);
L.AGONY.forEach((v, i) => expected.push([`AGONY.${i}`, v, `card.agony.${i}`]));
L.PANIC.forEach((v, i) => expected.push([`PANIC.${i}`, v, `card.panic.${i}`]));
expected.push(['NOTME', L.NOTME, 'card.notme'], ['BEG', L.BEG, 'card.beg'], ['hellos', L.hellos, 'greeting.hello'], ['FORTUNES', L.FORTUNES, 'fortune.slip']);
for (const [n, k] of Object.entries(RAID)) expected.push([n, L[n], `raid.${k}`]);

const defs = lines.allLines();
const byKey = new Map(defs.map((d) => [d.key, d]));
const textOf = (d) => d.lines.map((l) => l.text);

test('every legacy list is under exactly one key, with identical content and order', () => {
  assert.equal(lines.languages(), null, 'no language filter: list() is the original array');
  for (const [name, legacyList, key] of expected) {
    assert.ok(byKey.has(key), `${name} -> ${key} exists`);
    assert.deepStrictEqual(lines.list(key), legacyList, `${name} == ${key}`);
    const same = defs.filter((d) => JSON.stringify(textOf(d)) === JSON.stringify(legacyList)).map((d) => d.key);
    assert.deepEqual(same, [key], `${name} sits under one key only`);
  }
  assert.equal(new Set(expected.map((e) => e[2])).size, expected.length, 'no two legacy lists share a key');
  assert.equal(lines.list('hand.rip')[0], 'CHEESE PULL!!!!', 'the forced first rip line is hand.rip[0]');
  // nothing else was added: the remaining keys are the one-line lists (toasts and the raid's 'all gone.')
  const known = new Set(expected.map((e) => e[2]));
  const rest = defs.filter((d) => !known.has(d.key));
  assert.deepEqual(rest.map((d) => d.key).sort(), ['raid.done', 'toast.fog', 'toast.halved', 'toast.katanaDrawn', 'toast.katanaFound', 'toast.ripped',
    'toast.severed', 'toast.shelfFirst', 'toast.shelfGone', 'toast.shelfIn', 'toast.smashed', 'toast.smashed10']);
  for (const d of rest) assert.equal(d.lines.length, 1, `${d.key} is a one-line list`);
  // the toasts' and the raid literal's text is the legacy text, verbatim
  for (const d of rest) assert.ok(LEG.includes(`'${d.lines[0].text}'`) || PB.includes(`'${d.lines[0].text}'`), `${d.key} text found verbatim in legacy`);
});

test('every CHAPTERS trigger landed on its key', () => {
  let n = 0;
  for (const c of CHAPTERS) for (const e of c.entries) {
    if (e.fig) continue;
    n++;
    const name = PB_SRC[e.src] || (e.key == null ? e.src : `${e.src}.${e.key}`);
    const row = expected.find((x) => x[0] === name);
    assert.ok(row, `chapter entry ${e.src}/${e.key} names a legacy list`);
    assert.deepEqual(byKey.get(row[2]).trigger, { title: e.title, when: e.when }, `${row[2]} carries the trigger of ${name}`);
  }
  assert.equal(defs.filter((d) => d.trigger).length, n, 'and no key has a trigger the phrasebook did not have');
});

test('every GLOSS entry landed next to its line, on every list that has the line', () => {
  for (const [text, meaning] of Object.entries(GLOSS)) {
    const holders = defs.filter((d) => textOf(d).includes(text));
    assert.ok(holders.length, `gloss for ${text} has a line`);
    for (const d of holders) assert.equal(d.lines.find((l) => l.text === text).gloss, meaning, `${d.key}: ${text}`);
  }
  for (const d of defs) for (const l of d.lines) if (l.gloss) assert.equal(GLOSS[l.text], l.gloss, `${d.key}: no gloss the phrasebook did not have (${l.text})`);
});

test('legacy: paths rebuild window.__lines from the very same arrays', () => {
  const leg = lines.legacy();
  assert.deepEqual(Object.keys(leg).sort(), ['AGONY', 'BEG', 'CLAW_SAY', 'NOTME', 'PANIC', 'SAY', 'SEV_SAY']);
  for (const n of ['SAY', 'CLAW_SAY', 'AGONY', 'BEG', 'PANIC', 'NOTME', 'SEV_SAY']) assert.deepStrictEqual(leg[n], L[n], n);
  for (const n of ['SAY', 'CLAW_SAY', 'SEV_SAY']) assert.deepEqual(Object.keys(leg[n]).sort(), Object.keys(L[n]).sort(), `${n} has every sub-list`);
  for (const [name, , key] of expected) {
    const [top, sub] = name.split('.');
    if (!(top in leg)) continue;
    assert.equal(sub == null ? leg[top] : leg[top][sub], lines.list(key), `__lines.${name} is the array line('${key}') picks from`);
  }
});

test('every line carries its language tag (Cyrillic = bg, kana/kanji = ja, else en)', () => {
  const bySript = (s) => (typeof s !== 'string' ? 'en' : /[぀-ヿ㐀-鿿]/.test(s) ? 'ja' : /[Ѐ-ӿ]/.test(s) ? 'bg' : 'en');
  for (const d of defs) for (const l of d.lines) assert.equal(l.lang, bySript(l.text), `${d.key}: ${JSON.stringify(l.text)}`);
});
