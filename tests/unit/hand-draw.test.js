// Parity of the hand package's drawing and zones with the legacy code. The legacy functions (handParts, handDraw, zones and
// the hand's geometry tables) are cut out of scripts/legacy.js as text and run next to src/actors/hand/*.js on a tiny fake
// DOM, with the same seeded Math.random and the same clock. Every SVG path `d` (and the eye's class, c.tip, c.arm2, the number
// of Math.random draws) must be string-identical. Plain node, no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seeded } from './fake-env.js';

// ---- a fake DOM: just what handParts/handDraw touch ----
let T = 0, VW = 1280;
const body = { kids: [], appendChild(n) { this.kids.push(n); return n; } };
const el = (tag) => ({ tag, attrs: {}, kids: [], setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; }, appendChild(n) { this.kids.push(n); return n; } });
globalThis.document = { body, documentElement: { get clientWidth() { return VW; } }, createElementNS: (ns, tag) => el(tag), createElement: el, hidden: false };
Object.defineProperty(globalThis, 'performance', { value: { now: () => T }, configurable: true, writable: true });

const { handParts, handDraw } = await import('../../src/actors/hand/draw.js');
const { zones } = await import('../../src/actors/hand/zones.js');
const poses = await import('../../src/actors/hand/poses.js');
const { TUNE } = await import('../../src/core/tune.js');

// ---- legacy, cut out of scripts/legacy.js ----
const SRC = readFileSync(new URL('../../scripts/legacy.js', import.meta.url), 'utf8');
const cut = (from, to) => { const i = SRC.indexOf(from), j = SRC.indexOf(to, i); assert.ok(i >= 0 && j > i, `legacy.js: ${from}`); return SRC.slice(i, j); };
const tables = cut('const NS = ', 'let claw = null;');
const partsSrc = cut('function handParts(extra) {', 'function clawInit()');
const drawSrc = cut('function handDraw(c, wig, shake, strain) {', '// ---- 棚');
const zonesSrc = cut('const zones = (vw) => {', 'if (/[?&]debug=zones');
const L = new Function('document', 'now', 'html',
  `${tables}\n${partsSrc}\n${drawSrc}\n${zonesSrc}\nreturn { NS, FING, THUMB, BEND, ARCH, GRIP, PALM, POSES, handParts, handDraw, zones };`,
)(globalThis.document, () => T, globalThis.document.documentElement);

const KEYS = ['thumb', 'talonT', 'flesh', 'talon', 'crease', 'vein', 'eye', 'pupil'];

test('hand geometry tables equal legacy', () => {
  for (const k of ['FING', 'THUMB', 'BEND', 'ARCH', 'GRIP', 'PALM', 'POSES']) assert.deepEqual(poses[k], L[k], k);
  assert.deepEqual(Object.keys(poses.POSES), Object.keys(L.POSES));
  assert.deepEqual(TUNE.hand.EYE, [36, -2]);
});

test('handParts builds the same two layers', () => {
  for (const extra of [undefined, 'sev']) {
    const a = L.handParts(extra), b = handParts(extra);
    assert.deepEqual(Object.keys(b), Object.keys(a));
    for (const k of ['under', 'over']) assert.equal(JSON.stringify(b[k]), JSON.stringify(a[k]), k);
  }
});

// a deterministic case list (not from Math.random: that is reserved for the draws under test)
function cases() {
  const out = [], rnd = seeded(0xc1a7), pick = (a) => a[Math.floor(rnd() * a.length)];
  const base = (i) => ({ x: pick([200, 640, 1100, 1250, 1400, 1700]) + i % 7, y: pick([80, 300, 512.5, 900]), a: pick([Math.PI, Math.PI * 0.8, -2.6, 0, 0.4, 3.9]), sh: pick([400, 575, 900]) });
  let i = 0;
  for (const name of Object.keys(TUNE.hand.POSES)) for (const m of [undefined, 1, -1]) for (const arm of [undefined, false]) for (const wig of [0, 0.05, 0.3]) for (const shake of [0, 4]) for (const strain of [0, 0.6, 1]) {
    if (m === undefined && (wig || shake)) continue;
    out.push({ c: { ...base(i++), m, arm, pose: { ...TUNE.hand.POSES[name] } }, wig, shake, strain, t: 1000 + i * 37.3 });
  }
  // turning round (sx, cx), the severed hands' poses standing on feet, and the stump
  for (const name of Object.keys(TUNE.severed.POSES)) for (const m of [1, -1]) for (const sx of [undefined, 1, 0.4, 0.05]) for (const feet of [null, 2, 5]) {
    const b = base(i++), ft = feet && [[b.x + 60, b.y + 70], [b.x + 20, b.y + 76], null, feet > 2 ? [b.x - 40, b.y + 66] : null, feet > 2 ? [b.x - 10, b.y + 72] : null];
    out.push({ c: { ...b, m, arm: false, sx, cx: sx === undefined ? undefined : b.x - 12, feet: ft, pose: { ...TUNE.severed.POSES[name] } }, wig: 0.05, shake: m > 0 ? 0 : 2, strain: 0, t: 5000 + i * 11.1 });
  }
  for (const m of [1, -1]) for (const arm of [undefined, false]) for (const st of ['stump', 'regrow']) for (const shake of [0, 6]) {
    out.push({ c: { ...base(i++), m, arm, stump: true, st, pose: { ...TUNE.hand.POSES.sulk } }, wig: 0, shake, strain: 0.3, t: 9000 + i });
  }
  return out;
}

function render(impl, k, seed) {
  const c = { ...structuredClone(k.c), ...impl.handParts(k.c.arm === false ? 'sev' : undefined) };
  T = k.t;
  const real = Math.random, r = seeded(seed); let draws = 0;
  Math.random = () => { draws++; return r(); };
  try { impl.handDraw(c, k.wig, k.shake, k.strain); } finally { Math.random = real; }
  return { d: KEYS.map((key) => c[key].attrs.d), eye: c.eye.attrs.class, tip: c.tip, arm2: c.arm2, draws };
}

test('handDraw: every path d string-identical to legacy, two draws per call', () => {
  let n = 0, paths = 0;
  for (const vw of [360, 1280, 1920]) {
    VW = vw;
    for (const k of cases()) {
      const seed = 0x9e37 + n, a = render(L, k, seed), b = render({ handParts, handDraw }, k, seed);
      assert.equal(a.draws, 2);
      assert.deepEqual(b, a, `case ${n} ${JSON.stringify(k)}`);
      n++; paths += a.d.length;
    }
  }
  assert.ok(n > 1000);
  console.log(`# handDraw: ${n} calls, ${paths} path d strings compared`);
});

test('zones(vw) identical to legacy for 320..2560 step 10', () => {
  let n = 0;
  for (let vw = 320; vw <= 2560; vw += 10) { assert.deepEqual(zones(vw), L.zones(vw), `vw ${vw}`); n++; }
  assert.equal(n, 225);
});
