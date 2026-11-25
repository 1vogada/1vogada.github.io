// Parity of world/cut.js with the legacy blade. src/world/cut.js runs on a tiny fake DOM and a fake planck, with a seeded
// Math.random and a set clock, over random polygons, cut lines, cards and katana strokes. Geometry results, the pieces a slice
// makes, the particles, the order of lines and hand notices, and the number of Math.random draws must equal what the legacy
// functions (polyArea, validPoly, inside, crossings, edgeOf, slice, bladeCuts, endCut, bleed, cloneCard, addBody, spray, trail,
// cut out of the old scripts/legacy.js) gave for the very same cases: recorded in tests/unit/fixtures/cut-geometry.*.json
// (tests/unit/recorded.js; UPDATE_SNAPSHOT=1 rewrites them for an intended change). Plain node, no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from './fake-env.js';
import { recording } from './recorded.js';

// ---- a fake DOM ----
let T = 0;
const el = (tag) => {
  const props = {};
  const e = {
    tag, className: '', textContent: '', dataset: {}, kids: [], removed: false, attrs: {},
    style: { setProperty(k, v) { props[k] = String(v); }, getPropertyValue(k) { return props[k] || ''; }, props },
    classList: { set: new Set(), add(...c) { c.forEach((x) => this.set.add(x)); }, remove(...c) { c.forEach((x) => this.set.delete(x)); }, contains(c) { return this.set.has(c); } },
    appendChild(n) { this.kids.push(n); return n; }, remove() { this.removed = true; },
    querySelectorAll: () => [], removeAttribute(k) { delete this.attrs[k]; }, setAttribute(k, v) { this.attrs[k] = v; },
    cloneNode() { const c = el(tag); c.className = e.className; return c; },
    get isConnected() { return !e.removed; },
  };
  return e;
};
const grid = { querySelectorAll: () => [] };
globalThis.document = { body: el('body'), documentElement: el('html'), createElement: el, getElementById: (id) => (id === 'grid' ? grid : null), hidden: false };
globalThis.scrollX = 0; globalThis.scrollY = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => T }, configurable: true, writable: true });

// ---- a fake planck: bodies hold a pose and velocities, nothing moves by itself ----
function makeBody(pos, ang) {
  return {
    pos: { x: pos.x, y: pos.y }, ang, lv: { x: 0, y: 0 }, av: 0, fixtures: [],
    getPosition() { return this.pos; }, getAngle() { return this.ang; },
    getLinearVelocity() { return this.lv; }, getAngularVelocity() { return this.av; },
    setLinearVelocity(v) { this.lv = { x: v.x, y: v.y }; }, setAngularVelocity(w) { this.av = w; },
    createFixture(f) { this.fixtures.push(f); }, setGravityScale(g) { this.g = g; }, setUserData(u) { this.u = u; },
  };
}
const pl = { Polygon: class { constructor(v) { this.v = v; } }, Box: class { constructor(...a) { this.a = a; } } };
const fakeB2 = () => ({ createBody: (d) => makeBody(d.position, d.angle), destroyBody() {} });

const cutMod = await import('../../src/world/cut.js');
const W = await import('../../src/world/world.js');
const { defineSpeaker } = await import('../../src/core/speech.js');
const { bus } = await import('../../src/core/bus.js');
const { TUNE } = await import('../../src/core/tune.js');
const S = TUNE.physics.S;

// ---- random shapes ----
const R = seeded(424242);
const rnd = (a, b) => a + R() * (b - a);
function convex(n, cx, cy, r) {   // a convex polygon (sorted angles on an ellipse-ish blob), either winding
  const angs = Array.from({ length: n }, () => rnd(0, 2 * Math.PI)).sort((p, q) => p - q), rr = rnd(0.4, 1) * r, ry = rnd(0.4, 1) * r;
  const ps = angs.map((a) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * ry]);
  return R() < 0.5 ? ps : ps.reverse();
}
const anyPoly = (n) => Array.from({ length: n }, () => [rnd(-200, 200), rnd(-200, 200)]);   // not convex, may self-cross
const rect = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];
const N = 600;

test(`polyArea, validPoly, inside, crossings, edgeOf equal legacy on ${N} random polygons and lines`, () => {
  const rec = recording('cut-geometry.polys');
  let crossed = 0, ins = 0, valid = 0;
  for (let i = 0; i < N; i++) {
    const n = 3 + Math.floor(R() * 10), poly = i % 3 === 2 ? anyPoly(n) : convex(n, rnd(-50, 50), rnd(-50, 50), rnd(10, 300));
    if (i % 17 === 0) poly.push([...poly[0]]);   // a zero-length edge
    if (i % 23 === 0) poly.splice(1, 0, [(poly[0][0] + poly[1][0]) / 2, (poly[0][1] + poly[1][1]) / 2]);   // collinear point
    const area = cutMod.polyArea(poly), ok = cutMod.validPoly(poly), lines = [];
    valid += ok;
    for (let k = 0; k < 6; k++) {
      const a = [rnd(-400, 400), rnd(-400, 400)], b = k === 5 ? [...a] : k === 4 ? [...poly[0]] : [rnd(-400, 400), rnd(-400, 400)];
      const x = cutMod.crossings(poly, a, b); crossed += x.length > 0;
      const q = k === 3 ? poly[1] : a, inn = cutMod.inside(poly, q[0], q[1]); ins += inn;
      lines.push({ crossings: x, inside: inn, edgeOf: cutMod.edgeOf(poly, q) });
    }
    rec.check(`#${i}`, { area, valid: ok, lines }, `polygon #${i}`);
  }
  rec.done();
  assert.ok(crossed > N && ins > N / 2 && valid > N / 4, `coverage: ${crossed} crossing lines, ${ins} inside, ${valid} valid`);
});

// ---- slice and the stroke: the real world module on a fake b2, a counted seeded Math.random, a set clock ----
// lines are recorded by the speakers' gates, which then say no (no draws); bodies get ids 0, 1, 2 ... in creation order
let nextLog = [], nextIds = 0;
W.world.pl = pl; W.world.layer = el('div'); W.world.b2 = fakeB2();
bus.on('body.added', ({ body }) => { if (body.id == null) body.id = nextIds++; });
bus.on('body.removed', ({ body }) => nextLog.push(['remove', body.id]));
bus.on('card.cut', () => nextLog.push(['notice', 'cut']));
bus.on('card.stabbed', () => nextLog.push(['notice', 'stab']));
const gate = (self, key, opts) => { nextLog.push(['say', self.id, key, !!opts.force]); return false; };
defineSpeaker('card', { kinds: ['card', 'piece', 'shard'], prefix: 'card.', gate });
defineSpeaker('katana', { kinds: ['katana'], prefix: 'katana.', gate });
function newSide() { nextLog = []; nextIds = 0; W.world.bodies.clear(); W.world.bits.length = 0; W.world.grab = null; W.setBlade(null); return nextLog; }

function counting(seed) { const r = seeded(seed); let n = 0; const f = () => { n++; return r(); }; f.count = () => n; return f; }
const shape = (o) => ({ id: o.id, kind: o.kind, poly: o.poly, die: o.die, lv: o.body.lv, av: o.body.av, pos: o.body.pos, ang: o.body.ang, clip: o.el.style.clipPath, removed: o.el.removed });
const bitsOf = (bits) => bits.map(({ x, y, vx, vy, life, el: e }) => ({ x, y, vx, vy, life, cls: e.className, w: e.style.width, tf: e.style.transform }));
function makeCard(addFn, c) {
  const o = { kind: c.poly ? 'piece' : 'card', el: el('div'), w: c.w, h: c.h, ex: c.w / 2, ey: c.h / 2, poly: c.poly && c.poly.map((p) => [...p]) };
  const b = addFn(o, c.x / S, c.y / S, c.a, new pl.Box(c.w / 2 / S, c.h / 2 / S));
  b.body.lv = { ...c.v }; b.body.av = c.av; return b;
}
function randomCard(x, y) {
  const w = rnd(60, 320), h = rnd(40, 260), c = { w, h, x, y, a: rnd(-3, 3), v: { x: rnd(-5, 5), y: rnd(-5, 5) }, av: rnd(-3, 3) };
  if (R() < 0.3) c.poly = convex(3 + Math.floor(R() * 6), w / 2, h / 2, Math.min(w, h) / 2);
  return c;
}

test('slice equals legacy on 500 random cards and cut lines (pieces, velocities, life, particles, lines, draws)', () => {
  const rec = recording('cut-geometry.slice');
  const realRandom = Math.random;
  let cuts = 0;
  try {
    for (let i = 0; i < 500; i++) {
      const c = randomCard(rnd(100, 1000), rnd(100, 800));
      const A = [c.x + rnd(-250, 250), c.y + rnd(-250, 250)], B = i % 9 === 0 ? [A[0] + rnd(-3, 3), A[1]] : [c.x + rnd(-250, 250), c.y + rnd(-250, 250)];
      const dir = i % 7 === 0 ? [0, 0] : [B[0] - A[0], B[1] - A[1]];
      T = 1000 * i;
      const log = newSide();
      Math.random = counting(i);
      const no = makeCard(W.add, c), np = cutMod.slice(no, A, B, dir), nDraws = Math.random.count();
      Math.random = realRandom;
      if (np) cuts++;
      rec.check(`#${i}`, { cut: !!np, pieces: np ? np.map(shape) : null, card: shape(no), alive: W.world.bodies.has(no), draws: nDraws, bits: bitsOf(W.world.bits), log }, `slice #${i}`);
    }
  } finally { Math.random = realRandom; }
  rec.done();
  assert.ok(cuts > 150, `only ${cuts} of 500 lines cut`);
});

test('the stroke (bladeCuts, endCut, bleed) equals legacy: cuts, stabs, screams, wounds, notices, draws', () => {
  const rec = recording('cut-geometry.stroke');
  const realRandom = Math.random;
  const total = { cut: 0, stab: 0, cutting: 0, brag: 0 };
  try {
    for (let sim = 0; sim < 60; sim++) {
      const cards = Array.from({ length: 8 }, () => randomCard(rnd(150, 1050), rnd(150, 750)));
      // the katana's path: a random walk of its centre and angle, with pauses, sometimes held (held: kbrag rolls)
      let x = rnd(100, 1100), y = rnd(0, 600), a = rnd(-1, 1), dir = rnd(0, 7), sp = 10;
      const path = Array.from({ length: 400 }, (_, f) => {
        const pause = R() < 0.06;
        if (R() < 0.1) sp = R() < 0.25 ? rnd(30, 90) : rnd(1, 16);   // now and then faster (a streak) or slower
        dir += R() < 0.04 ? rnd(2, 4) : rnd(-0.15, 0.15);              // mostly straight on, sometimes back the way it came (a stab)
        if (!pause) { x = Math.max(0, Math.min(1200, x + Math.cos(dir) * sp)); y = Math.max(-150, Math.min(800, y + Math.sin(dir) * sp)); a += rnd(-0.08, 0.08); }
        return { x, y, a, held: Math.floor(f / 100) % 2 === 1, dt: f % 50 === 49 ? 0 : 0.016 };
      });
      const run = (side) => {
        T = 1e7 * (sim + 1);   // module state of cut.js (the scream time) carries over: the clock never goes back
        const kat = side.add({ kind: 'katana', el: el('div'), w: 40, h: 300, ex: 20, ey: 150 }, x / S, y / S, 0, new pl.Box(0.06, 0.48));
        side.setKat(kat);
        const bodies = cards.map((c) => makeCard(side.add, c));
        for (const p of path) {
          T += 16; kat.body.pos = { x: p.x / S, y: p.y / S }; kat.body.ang = p.a;
          side.setGrab(p.held ? { o: kat } : null);
          side.cuts(p.dt);
        }
        return bodies;
      };
      const log = newSide();
      Math.random = counting(1000 + sim);
      const nb = run({ add: W.add, setKat: W.setBlade, setGrab: (g) => { W.world.grab = g; }, cuts: cutMod.bladeCuts });
      const nDraws = Math.random.count(), nAll = [...W.world.bodies];
      Math.random = realRandom;
      rec.check(`#${sim}`, { log, draws: nDraws, cards: nb.map(shape), all: nAll.map(shape), bits: bitsOf(W.world.bits) }, `stroke #${sim}`);
      for (const e of log) { if (e[1] === 'cut') total.cut++; if (e[1] === 'stab') total.stab++; if (e[2] === 'card.cutting') total.cutting++; if (e[2] === 'katana.brag') total.brag++; }
    }
  } finally { Math.random = realRandom; }
  rec.done();
  assert.ok(total.cut > 10 && total.stab > 3 && total.cutting > 10 && total.brag > 0, `coverage: ${JSON.stringify(total)}`);
});
