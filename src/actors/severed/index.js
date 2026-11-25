// A hand that has been cut off is its own creature (legacy SEV table, sevSpawn, sevGone, sevSet, sevSay, sevTick, sevFood,
// sevUnsquash, window.__sev). Moved verbatim from scripts/legacy.js.
// Its brain is core/machine.js: machine('sev', o, 'limp', { switched, entered }), one file per behaviour in ./behaviours.
// o.ai holds its state as in legacy: st (mirrored from the machine for the test recorder and __sev users), t (a live view of
// the machine's m.t), dir (which way it faces), fd (which way its feet point and it walks), face, vx (walking speed it wants,
// m/s), hh (leg length, m), gait, stroll, feet, ... The body record keeps o.hand (the drawing) as in legacy.
// It is drawn with the shared hand drawing (actors/hand/draw.js handParts/handDraw), reached through app.handDraw: an actor
// never imports another actor (lint), and main.js passes every module to install(app).
// install(app): onTick 'severed' (legacy sevTick), clock.hasWork/keepAwake(busy), the 'severed' speaker, body.removed of a
// hand -> gone(o), body.thrown of a hand -> say(o, 'thrown', true), hook('__sev', { list, SEV, POSES, set, spawn, say, cut }).
// The 'hand.severed' event is wired to spawn() in src/reactions.js.

import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { clock } from '../../core/clock.js';
import { defineSpeaker, say as speak } from '../../core/speech.js';
import { machine, behaviours } from '../../core/machine.js';
import { isFree } from '../../core/claims.js';
import { hook } from '../../core/debug.js';
import { world, add, remove, isHeld } from '../../world/world.js';
import { drawOffset } from '../../world/loop.js';
import { gore } from '../../world/fx.js';
import { turn } from './gait.js';

const S = TUNE.physics.S, P = TUNE.physics, SV = TUNE.severed, B = SV.BODY;

let app = null;
const brains = new WeakMap();   // body record -> its machine
let frameT = 0;                 // legacy sevTick's `t = now()`, read once per frame and handed to every behaviour's tick

/** every cut-off hand body (legacy sevs) */ export const list = new Set();
/** its poses (legacy SEV_POSE) */ export const POSES = TUNE.severed.POSES;
/** legacy sevTick's t: now() at the start of this frame's tick (behaviours read it as legacy tick(o, a, dt, t)) */
export const tickNow = () => frameT;
/** the machine of a cut-off hand */
export const brain = (o) => brains.get(o);

/** legacy sevSay(o, kind, force) = speech.say(o, 'sev.' + kind, { force }) */
export function say(o, kind, force) { return speak(o, 'sev.' + kind, { force: !!force }); }

/**
 * a new cut-off hand (legacy sevSpawn(px, py, a, pose)); a fourth makes the oldest burst.
 * opts.v: [vx, vy] px/s of the blade: sets the legacy fling velocity and the random spin right after the spawn.
 * @returns the body record
 */
export function spawn(px, py, a, pose, opts = {}) {   // page px of the middle of the palm, and the way the fingers point
  if (list.size >= SV.MAX) { const old = list.values().next().value, w = old.body.getPosition(); gore(w.x * S, w.y * S, 0, -1, 26, 0.9); remove(old); }   // three is a crowd
  const el = document.createElement('div'); el.className = 'phys hand-hit'; world.layer.appendChild(el);
  const o = add({ kind: 'hand', el, w: B.w, h: B.h, ex: B.w / 2, ey: B.h / 2 }, px / S, py / S, a, new world.pl.Box(B.hw, B.hh), { density: B.density, friction: B.friction, restitution: B.restitution });
  el._o = o; o.body.setAngularDamping(B.damping);
  o.hand = { ...app.handDraw.handParts('sev'), arm: false, m: 1, x: 0, y: 0, a, sh: 0, pose: { legs: 0, ...pose }, gait: 0, reach: 100 };
  const now = clock.now();
  o.ai = { st: 'limp', dir: Math.random() < 0.5 ? -1 : 1, vx: 0, hh: 0.4, gait: 'crawl', stroll: 'tiptoe', up: false, cool: 0, born: now, hurt: now + SV.HURT_MS, flee: 0 }; o.ai.face = o.ai.fd = o.ai.dir;
  list.add(o);
  let m = null;
  Object.defineProperty(o.ai, 't', { get: () => (m ? m.t : 0), set: (v) => { if (m) m.t = v; }, enumerable: true });
  // legacy sevSpawn: SEV.limp.enter(o, o.ai) only (switched runs, entered does not, for the initial state); then run()
  m = machine('sev', o, 'limp', {
    switched: (self, mm) => { self.ai.st = mm.state; self.ai.up = !!mm.def.up; },
    entered: (self) => { self.body.setAwake(true); clock.wake(); },
  });
  brains.set(o, m);
  clock.wake();
  bus.emit('sev.spawned', { hand: o });
  if (opts.v) {   // legacy sever(): o.body.setLinearVelocity(...), setAngularVelocity(random) right after sevSpawn
    const v = opts.v, lim = (x) => Math.max(-7, Math.min(7, x / S * 0.3));
    o.body.setLinearVelocity({ x: lim(v[0]) - 2.5, y: lim(v[1]) - 3 }); o.body.setAngularVelocity((Math.random() - 0.5) * 9);
  }
  return o;
}

/** it left the world (legacy sevGone): machine.end() (the behaviour's leave), SVGs removed, emits 'sev.gone' */
export function gone(o) {
  if (!list.has(o)) return;
  list.delete(o);
  const m = brains.get(o); if (m) m.end();
  o.hand.under.remove(); o.hand.over.remove();
  bus.emit('sev.gone', { hand: o });
}

/** legacy sevSet(o, st) */
export function set(o, st) { const m = brains.get(o); if (m) m.set(st); }

/** legacy __sev.cut(): cut the arm's hand off now (tests). Legacy: claw && sever([claw.x, claw.y], [0, 0]) */
export function cut() { const h = app && app.hand; if (h && typeof h.cut === 'function') return h.cut(); return undefined; }

/**
 * legacy sevFood(q): a card or big piece it may hunt. The flags it shares with the other actors (o.root, o.tug of the arm's
 * tug, o.sq of its own squeeze, o.die) stay; the pointer is world.grab; the arm's target (legacy claw.o) is a claim.
 */
export const food = (q) => (q.kind === 'card' || (q.kind === 'piece' && !q.die)) && !q.root && !q.tug && !q.sq && !isHeld(q) && isFree(q);

/** legacy sevUnsquash(q): the card it was squeezing is let go, as it was */
export function unsquash(q) {
  if (!q.sq) return; if (q.sq.free) q.sq.free(); q.el.style.clipPath = q.sq.clip; q.el.style.filter = ''; q.el.style.pointerEvents = ''; q.sq = null;
  if (world.bodies.has(q)) { q.body.setGravityScale(P.FALL); q.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0xFFFF }); q.body.setAwake(true); }
}

/** any hand that is not resting (legacy sevBusy) */
export const busy = () => { for (const o of list) if (brains.get(o).busy) return true; return false; };

// once per frame: every cut-off hand thinks, and is drawn where its body is (legacy sevTick)
export function tick(dt) {
  if (!list.size) return;
  frameT = clock.now();
  for (const o of [...list]) {
    const a = o.ai, h = o.hand, m = brains.get(o); m.age(dt);
    if (isHeld(o) && m.state !== 'held') m.set('held');
    m.step(dt);
    if (!world.bodies.has(o)) continue;
    const b = o.body, p = b.getPosition(), ang = b.getAngle(), pose = POSES[m.def.pose], kp = 1 - Math.exp(-dt * 10);
    const look = m.state === 'walk' && a.look2 ? POSES[a.look2] : pose;
    if (!a.poseSet) for (const key in look) h.pose[key] = (h.pose[key] || 0) + (look[key] - (h.pose[key] || 0)) * kp;
    turn(o, dt, b, p, ang);
    const ang2 = b.getAngle();
    h.a = ang2; h.x = p.x * S - scrollX - 35 * Math.cos(ang2); h.y = p.y * S - scrollY - 35 * Math.sin(ang2);
    app.handDraw.handDraw(h, a.wig || 0, 0, 0);
  }
}

/** the table of behaviours by name (legacy SEV), for __sev */
const table = () => Object.fromEntries(behaviours('sev'));

export function install(a) {
  app = a || {};
  if (app.reduced) return;   // legacy: the whole of cardPhysics() is skipped, __sev never exists
  // the bubble rides above the body like a card's (legacy draw()), and gets the hand's look (legacy sevSay: .claw-say)
  defineSpeaker('severed', { kinds: ['hand'], gate: 'severed', extraCls: 'claw-say', layer: () => world.layer,
    anchor: (o) => { const p = o.body.getPosition(), an = o.body.getAngle(), [hx, hy] = drawOffset(o), top = Math.abs(Math.sin(an)) * o.w / 2 + Math.abs(Math.cos(an)) * o.h / 2;
      return { x: p.x * S + hx, ax: p.x * S + hx, y: p.y * S + hy - top + TUNE.speech.RIDE_DY }; } });
  clock.onTick(tick, 'severed');
  clock.hasWork(busy);    // legacy clawBusy() = sevBusy() || ...: both the start-of-frame and the end-of-frame checks
  clock.keepAwake(busy);
  bus.on('body.removed', ({ body }) => { if (body.kind === 'hand') gone(body); });                 // legacy remove(): sevGone(o)
  bus.on('body.thrown', ({ body }) => { if (body.kind === 'hand') say(body, 'thrown', true); });   // legacy drop(): sp > HOT
  // world.reset: nothing of its own to undo (legacy resetAll removed every body, and remove() ran sevGone for each hand)
  hook('__sev', { list, get SEV() { return table(); }, POSES, set, spawn, say, cut });
}
