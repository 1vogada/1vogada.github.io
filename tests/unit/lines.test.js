import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLines, langOf } from '../../src/core/lines.js';
import { seeded } from './fake-env.js';

// legacy pick() from index.html (master 41683e8), verbatim
function legacyPicker() {
  const pickMem = new WeakMap(); let pickSaid = null;
  return function pick(a) {
    if (a.length < 2) return a[0];
    let m = pickMem.get(a); if (!m) pickMem.set(a, m = []);
    const keep = Math.min(3, a.length - 2), w = a.map((s, i) => i === m[0] || s === pickSaid ? 0 : m.indexOf(i) > 0 ? 0.1 : 1);
    let sum = 0; for (const v of w) sum += v;
    let i = 0; if (sum > 0) { let r = Math.random() * sum; while (i < a.length - 1 && (r -= w[i]) >= 0) i++; } else i = (m[0] + 1) % a.length;
    m.unshift(i); m.length = Math.min(m.length, keep + 1); if (typeof a[i] === 'string') pickSaid = a[i];
    return a[i];
  };
}

// real lists from the page, including ones that share lines across lists (so the "said by anyone" memory matters)
const L = () => ({
  'card.pull': ['hey!', 'nope.', 'let go!', 'I live here', 'hands off', 'не!', 'やめて!', 'excuse me?'],
  'card.rip': ['AAAH!', 'nooo!', 'rude.', 'ау!', 'I was comfy!', 'put me back!'],
  'card.throw': ['wheee', 'NOOO', 'not the wall!', 'I can fly?!', 'aaaaaa'],
  'hand.throw': ['wheee', 'over here!', 'pass it!', 'nice arm'],
  'hand.rip': ['CHEESE PULL!!!!', 'CHEESE PULL!!!!', 'CHEESE PULL!!!!', 'RIIIP', 'half is fine!', 'again! again!', 'チーズ!!!', 'СИРЕНЕ!!!'],
  'hand.keep': ['mine.', 'hehehe', 'no take-backs', 'finders keepers', 'хе-хе'],
  'hand.grab': ['mine.', 'GOT IT', 'thank you!', 'мое!', 'いただき!'],
  'two': ['a', 'b'],
  'three': ['a', 'b', 'c'],
  'one': ['only'],
});

function run(seed, n, useNew) {
  const lists = L(), keys = Object.keys(lists), order = seeded(seed ^ 0x5bd1e995);   // which list is picked: NOT Math.random
  const real = Math.random; Math.random = seeded(seed);
  try {
    const out = [];
    if (useNew) {
      const ln = createLines();
      for (const k of keys) ln.defineLines(k, lists[k]);
      for (let i = 0; i < n; i++) out.push(ln.line(keys[Math.floor(order() * keys.length)]));
    } else {
      const pick = legacyPicker();
      for (let i = 0; i < n; i++) out.push(pick(lists[keys[Math.floor(order() * keys.length)]]));
    }
    out.push('next draw ' + Math.random());   // the same number of draws were used
    return out;
  } finally { Math.random = real; }
}

test('line() reproduces legacy pick() draw for draw with a seeded Math.random', () => {
  for (const seed of [1, 2, 3, 42, 1234, 99991]) assert.deepEqual(run(seed, 400, true), run(seed, 400, false), 'seed ' + seed);
});

test('pick(array) shares the memory with line(key) for the same array (legacy __pick and the raid)', () => {
  const real = Math.random;
  try {
    const list = ['p', 'q', 'r', 's', 't'];
    Math.random = seeded(7); const ln = createLines(); ln.defineLines('x.y', list);
    const a = []; for (let i = 0; i < 50; i++) a.push(i % 2 ? ln.line('x.y') : ln.pick(list));
    Math.random = seeded(7); const pick = legacyPicker();
    const b = []; for (let i = 0; i < 50; i++) b.push(pick(list));
    assert.deepEqual(a, b);
  } finally { Math.random = real; }
});

test('a list of one draws nothing; picking non-strings works and does not touch "said by anyone"', () => {
  const real = Math.random; let draws = 0; Math.random = () => { draws++; return 0.5; };
  try {
    const ln = createLines(); ln.defineLines('one', ['only']);
    assert.equal(ln.line('one'), 'only'); assert.equal(draws, 0);
    const els = [{}, {}, {}]; assert.ok(els.includes(ln.pick(els))); assert.equal(draws, 1);
  } finally { Math.random = real; }
});

test('language filter: per-line tags, stable filtered list, empty falls back, null restores the original array', () => {
  const ln = createLines();
  const pull = ln.defineLines('card.pull', ['hey!', 'nope.', 'не!', 'やめて!']);
  ln.defineLines('card.bg', ['не!', 'ау!']);
  ln.defineLines('hand.mixed', ['a', 'b', 'c'], { lang: ['en', 'ja', 'en'] });
  assert.equal(ln.list('card.pull'), pull, 'no filter: the very same array');
  ln.setLanguages(['en']);
  assert.deepEqual(ln.list('card.pull'), ['hey!', 'nope.']);
  assert.equal(ln.list('card.pull'), ln.list('card.pull'), 'the filtered list keeps its identity (picker memory)');
  assert.deepEqual(ln.list('card.bg'), ['не!', 'ау!'], 'nothing in English: the whole list');
  assert.deepEqual(ln.list('hand.mixed'), ['a', 'c']);
  for (let i = 0; i < 30; i++) assert.ok(['hey!', 'nope.'].includes(ln.line('card.pull')));
  assert.deepEqual(ln.languages(), ['en']);
  ln.setLanguages(null);
  assert.equal(ln.list('card.pull'), pull);
  const all = ln.allLines().find((d) => d.key === 'card.pull');
  assert.deepEqual(all.lines.map((l) => l.lang), ['en', 'en', 'bg', 'ja']);
});

test('langOf, legacy __lines shape, unknown and duplicate keys, once()', () => {
  assert.equal(langOf('hey!'), 'en'); assert.equal(langOf('не!'), 'bg'); assert.equal(langOf('やめて!'), 'ja'); assert.equal(langOf('世界'), 'ja');
  const ln = createLines();
  const a = ln.defineLines('card.pull', ['x', 'y'], { legacy: 'SAY.pull' });
  const b = ln.defineLines('card.agony.1', ['p', 'q'], { legacy: 'AGONY.1' });
  const c = ln.defineLines('card.beg', ['z'], { legacy: 'BEG' });
  const leg = ln.legacy();
  assert.equal(leg.SAY.pull, a); assert.equal(leg.AGONY[1], b); assert.equal(leg.BEG, c); assert.ok(Array.isArray(leg.AGONY));
  assert.throws(() => ln.line('no.such'), /unknown key/);
  assert.throws(() => ln.defineLines('card.pull', ['again']), /twice/);
  assert.equal(ln.once('cheese'), true); assert.equal(ln.once('cheese'), false);
});
