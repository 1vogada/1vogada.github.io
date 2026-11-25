// Parity of the severed hand's gait (src/actors/severed/gait.js) with the legacy code. The legacy GAIT, TURN, NEXT, sevGround,
// sevFeet and sevStep are cut out of scripts/legacy.js as text and run next to the new ones over a scripted walk on a fake
// planck world (a floor with a step and a raised block, a sensor and another hand that the ray must ignore). Every foot
// position (a.feet and o.hand.feet), a.air, and every force and torque sevStep applies must be identical. Plain node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.scrollX = 0; globalThis.scrollY = 37;
const gait = await import('../../src/actors/severed/gait.js');
const { world } = await import('../../src/world/world.js');
const { TUNE } = await import('../../src/core/tune.js');
const S = TUNE.physics.S;

// ---- legacy, cut out of scripts/legacy.js ----
const SRC = readFileSync(new URL('../../scripts/legacy.js', import.meta.url), 'utf8');
const cut = (from, to) => { const i = SRC.indexOf(from), j = SRC.indexOf(to, i); assert.ok(i >= 0 && j > i, `legacy.js: ${from}`); return SRC.slice(i, j); };
const gaitSrc = cut('const GAIT = {', 'const sevs = new Set()');
const stepSrc = cut('function sevStep(o) {', '// once per frame: every cut-off hand thinks');
const clampSrc = cut('const clamp01 = ', '\n');
function legacy(fakeWorld, grabRef) {
  return new Function('S', 'world', 'GRAVITY', 'FALL', 'scrollX', 'scrollY', 'grabRef',
    `const grab = null; ${clampSrc}\n${gaitSrc}\n${stepSrc}\nreturn { GAIT, TURN, NEXT, sevGround, sevFeet, sevStep };`,
  )(S, fakeWorld, TUNE.physics.GRAVITY, TUNE.physics.FALL, globalThis.scrollX, globalThis.scrollY, grabRef);
}

// ---- a fake planck world: horizontal surfaces, a vertical ray cast reports each one it crosses, in list order ----
const fixture = (kind, opts = {}) => ({ getBody: () => opts.body || { getUserData: () => (kind ? { kind } : null) }, isSensor: () => !!opts.sensor, getFilterMaskBits: () => (opts.mask ?? 0xFFFF) });
const surfaces = [
  { y: 9.4, x0: 3.0, x1: 3.6, f: fixture('hand') },                 // another severed hand: ignored
  { y: 9.6, x0: 0, x1: 99, f: fixture(null, { sensor: true }) },    // a sensor: ignored
  { y: 9.2, x0: 6.2, x1: 7.4, f: fixture('card', { mask: 0 }) },   // a squeezed card (mask 0): ignored
  { y: 9.5, x0: 4.4, x1: 5.6, f: fixture('card') },                 // a card lying on the floor
  { y: 9.8, x0: 0, x1: 5.0, f: fixture(null) },                     // the floor, with a step down at x = 5 m
  { y: 9.9, x0: 5.0, x1: 99, f: fixture(null) },
];
function fakeWorld(self) {
  return {
    rayCast(p1, p2, cb) {
      let max = 1;
      for (const s of surfaces) {
        if (p1.x < s.x0 || p1.x > s.x1) continue;
        const frac = (s.y - p1.y) / (p2.y - p1.y);
        if (frac < 0 || frac > max) continue;
        const f = s.f === 'self' ? fixture(null, { body: self }) : s.f;
        const r = cb(f, { x: p1.x, y: s.y }, { x: 0, y: -1 }, frac);
        if (r === 0) return; if (r >= 0) max = Math.min(max, r);
      }
    },
  };
}
// a body: scripted position and velocity; records forces and torques
function body() {
  const b = { p: { x: 2.2, y: 9.0 }, v: { x: 0, y: 0 }, a: Math.PI / 2, w: 0, log: [] };
  return Object.assign(b, {
    getPosition: () => b.p, getLinearVelocity: () => b.v, getMass: () => 0.29, getInertia: () => 0.011, getAngle: () => b.a, getAngularVelocity: () => b.w,
    applyForceToCenter: (f) => b.log.push(['f', f.x, f.y]), applyTorque: (t) => b.log.push(['t', t]), getUserData: () => null,
  });
}
// the scripted walk: a sequence of frames, each moving the body and maybe changing gait, direction or teleporting it
function script() {
  const out = [];
  const gaits = ['crawl', 'tiptoe', 'scuttle', 'sneak', 'run', 'tiptoe'];
  let x = 2.2, fd = 1, g = 0;
  for (let i = 0; i < 1800; i++) {
    const dt = i % 7 === 3 ? 0.021 : 1 / 60;
    if (i && i % 300 === 0) g = (g + 1) % gaits.length;
    if (i === 700 || i === 1250) fd = -fd;
    const speed = TUNE.severed.GAIT[gaits[g]].speed * (0.3 + Math.sin(i / 37)) * fd;   // sometimes backwards: feet end up ahead of their place
    x += speed * dt;
    const jump = i === 520 ? 2.5 : i % 97 === 50 ? 1.2 + (i % 13) * 0.07 : 0;   // thrown or shoved: near and past the 190 px reset
    out.push({ dt, gait: gaits[g], fd, x: x + jump, y: 9.0 + 0.05 * Math.sin(i / 11), vx: speed, vy: 0.3 * Math.cos(i / 9), a: Math.PI / 2 + 0.3 * Math.sin(i / 23), w: 0.7 * Math.sin(i / 13) });
    if (jump) x += jump;
  }
  return out;
}
const run = (impl, steps) => {
  const b = body(), o = { body: b, hand: {}, ai: { gait: 'crawl', fd: 1, hh: 0.4, up: true, vx: 0 } }, frames = [];
  for (const s of steps) {
    b.p = { x: s.x, y: s.y }; b.v = { x: s.vx, y: s.vy }; b.a = s.a; b.w = s.w;
    o.ai.gait = s.gait; o.ai.fd = s.fd; o.ai.vx = s.vx; o.ai.hh = TUNE.severed.GAIT[s.gait].hh;
    impl.feet(o, o.ai, s.dt);
    impl.step(o);
    frames.push(JSON.stringify({ feet: o.ai.feet, hand: o.hand.feet, air: o.ai.air, log: b.log.splice(0) }));
  }
  return frames;
};

test('gait tables equal legacy', () => {
  const L = legacy(fakeWorld(null));
  assert.deepEqual(gait.GAIT, L.GAIT); assert.equal(gait.TURN, L.TURN); assert.deepEqual(gait.NEXT, L.NEXT);
  // the leg spring's numbers moved to TUNE.severed.LEG: the legacy sevStep literals
  assert.match(stepSrc, /Math\.min\(170, GRAVITY \* FALL \+ 520 \* \(a\.hh - h\) \+ 42 \* v\.y\)/);
  assert.match(stepSrc, /\(g\.drag \? 30 : 14\)/); assert.match(stepSrc, /900 \* wrapA\(want - b\.getAngle\(\)\) - 54 \* b\.getAngularVelocity\(\)/);
  assert.deepEqual(TUNE.severed.LEG, { force: 520, damp: 42, cap: 170, walk: 14, drag: 30, torque: 900, torqueDamp: 54 });
});

test('sevGround finds the same ground', () => {
  const L = legacy(fakeWorld(null)); world.b2 = fakeWorld(null);
  for (let x = 150; x < 900; x += 7) for (const y of [880, 905, 940, 960, 1000, 1100]) assert.equal(gait.ground(x, y), L.sevGround(x, y), `${x},${y}`);
});

test('sevFeet and sevStep: the same feet, forces and torques over a scripted walk', () => {
  const steps = script();
  const L = legacy(fakeWorld(null));
  const a = run({ feet: L.sevFeet, step: L.sevStep }, steps);
  world.b2 = fakeWorld(null); world.grab = null;
  const b = run({ feet: gait.feet, step: gait.step }, steps);
  assert.equal(b.length, a.length);
  let swings = 0;
  for (let i = 0; i < a.length; i++) { assert.equal(b[i], a[i], `frame ${i}`); if (/"sw":1/.test(a[i])) swings++; }
  assert.ok(swings > 200, `the walk swings feet (${swings} frames with a foot in the air)`);
});
