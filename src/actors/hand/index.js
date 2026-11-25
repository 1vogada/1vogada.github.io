// The arm and its hand past the right edge (legacy claw*: clawInit, clawSet, clawBusy, notice, clawSay, clawTick, clawLetGo,
// sever, clawReset, snatch, window.__hand). Moved from scripts/legacy.js.
//
// clawTick is tick() below: the pre-chain (init when the first card is torn, the "someone took what it held" check, grab
// tracking, the catch scan of thrown cards) -> machine('hand').step: the one behaviour of the current state (./behaviours,
// one file per legacy branch) sets the motion target on the frame's ctx { T, rate, aim, pose, wig, shake, strain } -> the
// post-chain in legacy order: agitation decay, speech.flushLater, the react queue (notice), the flinch override, easing of
// x/y/a/pose, the held card (the behaviour's hold(): crush, tug, has; else the joint follows the grip), strands, the bubble's
// place, draw(), the sever check against world.blade.
//
// The legacy if-chain asked state names in a few places; the behaviours carry flags for them instead:
//   busy / busyUntil   clawBusy: off never, lurk until c.until (1.5 s after set), the rest always
//   calm               the lost-card check does not sulk (off, lurk)
//   catches            the catch scan runs (lurk, eager, sulk, gloat)
//   idle               a remark is said and the flinch leans in (lurk, sulk)
//   poseRate           how fast the pose follows (lunge: 30, else 12)
//   uncut              the blade cannot take the hand off (off, show, book, regrow)
//   borrowed           tick() leaves it alone (book)
//   hold(c, m, x, H)   the per-state work on what it holds after the easing; returns true when it handled it
//
// The claw record is legacy's (the phrasebook and the tests read and write it). c.st, c.t and c.o are accessors:
// c.st is the machine's state (a direct write, as the phrasebook raid does, switches it without restarting t, like legacy),
// c.t is the machine's time, and c.o claims its body for the hand (core/claims.js 'hand' / 'target') and releases it when
// it is cleared or replaced.
// It never imports another actor: the shelf reaches it through senses() (wired in src/reactions.js), the blade through
// world.blade, and what happens to cards goes out as events (hand.grabbed, hand.reaching, hand.ripped, ...).

import { TUNE, TIMING } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { clock, now } from '../../core/clock.js';
import { defineSpeaker, say as speechSay, expire, place, flushLater, addFirst, hush } from '../../core/speech.js';
import { list, line } from '../../core/lines.js';
import { machine } from '../../core/machine.js';
import { claim } from '../../core/claims.js';
import { hook } from '../../core/debug.js';
import { world, isCrazy, load, init, report } from '../../world/world.js';
import { gore, shake } from '../../world/fx.js';
import { handParts, handDraw } from './draw.js';
import { POSES } from './poses.js';
import { zones } from './zones.js';
import { gripPt, untug } from './tug.js';
import { stole, wants } from './old.js';

export { POSES };

const S = TUNE.physics.S, H_ = TUNE.hand;
const html = () => document.documentElement;
export const clamp01 = (v) => Math.max(0, Math.min(1, v)), wrapA = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

let claw = null, m = null;

/** a direct write of c.st (legacy `c.st = st`): no restart of t, no until, no wake */
function rawSet(st) { if (!m || st === m.state) return; const t = m.t; m.set(st); m.t = t; }

// legacy clawInit()
function clawInit() {
  const vw = html().clientWidth;
  let target = null, release = null;
  const c = { until: 0, cool: 0, x: vw + H_.OFF_X, y: innerHeight * 0.55, ly: innerHeight * 0.55, hy: 0, a: Math.PI, sh: innerHeight * 0.55 + 70, pose: { ...POSES.lurk },
    joint: null, snap: null, pre: null, gh: null, g: null, far: false, say: null, said: 0, strands: [], ...handParts() };
  Object.defineProperties(c, {
    st: { get: () => m.state, set: rawSet, enumerable: true },
    t: { get: () => m.t, set: (v) => { m.t = v; }, enumerable: true },
    o: { get: () => target, set: (v) => { if (v === target) return; if (release) release(); release = null; target = v || null; if (target) release = claim(target, 'hand', 'target'); }, enumerable: true },
  });
  claw = c;
  m = machine('hand', c, 'off');
}

/** the claw record (legacy claw), made on first use (legacy __hand.get) */
export function get() { if (!claw) clawInit(); return claw; }
/** the machine of the claw (null before the claw exists) */
export const brain = () => m;

/** legacy clawSet(st): restarts t, keeps it busy 1.5 s, wakes the loop; the machine emits 'hand.state' */
export function set(st) {
  const c = get();
  if (st === 'show' || st === 'book') c.stump = false;   // called in for a scene, it arrives with a hand
  m.set(st); c.until = now() + H_.SET_UNTIL_MS; clock.wake();
}
/** legacy clawDraw(wig, shake, strain) */
export const draw = (wig, shk, strain) => handDraw(get(), wig, shk, strain);

/** legacy clawSay(kind, force): speech gate 'arm'. @returns the bubble record, or null (held back or queued) */
export function speak(kind, force) {
  const opts = { as: 'arm', force: !!force };
  // the first rip it gets to shout about after every page load is always the cheese pull
  if (kind === 'rip') opts.first = { id: 'cheese', text: list('hand.rip')[0] };
  return speechSay(claw, 'hand.' + kind, opts);
}

// The hand comments on most things it sees, but never at once: each remark waits a random while. When a lot happens together its
// agitation fills up and the wait gets shorter, and there are always at least 2 s of real time between two things it says
const REACT_GAP = TIMING.gap.hand;
/** it saw something (legacy notice(kind)): a remark after a random wait; draws Math.random (one draw, two when one is queued) */
export function notice(kind) {
  const c = claw; if (!c || m.is('off') || isCrazy()) return;
  const t = now(), R = TIMING.react; c.agit = Math.min(H_.AGIT_MAX, (c.agit || 0) + 1);
  const wait = (R.min + Math.random() * R.spread) * (1 - R.calm * clamp01((c.agit - 1) / 4));
  if (!c.react) c.react = { kind, at: t + wait, born: t }; else { c.react.at = Math.min(c.react.at, t + wait); if (Math.random() < 0.5) c.react.kind = kind; }
  clock.wake();
}

/** an old (cut-off) hand just crushed a card (src/reactions.js): the arm takes note (./old.js) */
export function oldStole(o) { if (claw && !isCrazy()) stole(o, now()); }

/** out of patience: it takes the held card (legacy snatch(o)) */
export function snatch(o) { claw.o = o; set('snatch'); }

// what it can sense of other actors, injected by src/reactions.js:
// { shelfSnack() -> body|null, nearShelf(P) -> bool, onShelf(o) -> bool, want(v), shelf() -> state|null, oldHands() -> Set of cut-off hand bodies }
let sensed = {};
/** what senses() was given */ export const sense = () => sensed;
export function senses(s) { sensed = s || {}; }
/** the shelf as the hand sees it (no shelf wired: there is none) */
export const shelf = {
  snack: () => (sensed.shelfSnack ? sensed.shelfSnack() : null),
  near: (P) => (sensed.nearShelf ? sensed.nearShelf(P) : false),
  holds: (o) => (sensed.onShelf ? sensed.onShelf(o) : false),
  state: () => (sensed.shelf ? sensed.shelf() : null),
  want: (v) => { if (sensed.want) sensed.want(v); },
};

/** the loop must keep running (legacy clawBusy minus sevBusy) */
export const busy = () => {
  const c = claw; if (!c) return false;
  const sh = shelf.state();
  return (!!sh && sh.want) || !!c.react || !!c.later || now() < (c.flinch || 0) || c.strands.length > 0 || !!c.say || m.busy || (!!m.def.busyUntil && now() < c.until) || (m.is('lurk') && wants(c));
};

// legacy clawTick(dt)
function tick(dt) {
  if (!claw) { if (!world.ripped.size || isCrazy()) return; clawInit(); }
  const c = claw; if (isCrazy() || m.def.borrowed) return;
  const vw = html().clientWidth, vh = innerHeight, t = now(); m.age(dt);
  if (c.o && !world.bodies.has(c.o)) { c.o = null; c.joint = null; c.snap = null; if (!m.def.calm) { set('sulk'); speak('sulk'); } }   // someone cut or smashed what it was holding
  if (world.grab !== c.g) { c.g = world.grab; c.far = false; }
  const grab = world.grab, P = grab ? [grab.cx, grab.cy] : null, held = grab && grab.o.kind === 'card' && !grab.o.root ? grab.o : null, o = c.o;
  const NEAR = Math.min(H_.NEAR[0], vw * H_.NEAR[1]), FAR = Math.min(300, vw * 0.5), Z = zones(vw), HOLD = Math.min(110, vw * 0.2);
  const ripE = Math.min(330, 0.3 * Math.min(vw, vh)), strainE = 0.4 * ripE;
  if (P && P[0] < vw - FAR) c.far = true;   // a card has to be brought over, not just be there
  // the frame's shared locals (legacy: the consts and lets at the top of clawTick); the behaviour sets the motion target on it
  const x = { t, dt, vw, vh, P, held, o, NEAR, FAR, Z, HOLD, ripE, strainE, T: [vw + H_.LURK_X, c.ly], rate: 6, aim: Math.PI, pose: POSES.lurk, wig: 0.05, shake: 0, strain: 0 };
  if (!c.o && m.def.catches) {   // a card thrown its way: it goes for the catch
    for (const q of world.bodies) {
      if (q.kind !== 'card' || q.root || q.tug || (world.grab && world.grab.o === q)) continue;
      const v = q.body.getLinearVelocity(), w = q.body.getWorldCenter(), sx = w.x * S - scrollX, sy = w.y * S - scrollY;
      if (v.x > 5 && Math.hypot(v.x, v.y) > 8 && sx > Z.grab && sx < vw + 40 && sy > 20 && sy < vh - 20) { c.o = q; set('catch'); break; }
    }
  }
  m.x = x; m.step(dt);
  c.agit = Math.max(0, (c.agit || 0) - dt * H_.AGIT_DECAY);
  flushLater(c);   // legacy: if (c.later && t >= c.later.at) { ... clawSay(l.kind, true) } unless it is more than gap.handLate late
  if (c.react) {
    const idle = !!m.def.idle;
    if (t - c.react.born > H_.REACT_TTL_MS) c.react = null;   // it was busy for too long: the moment has passed
    else if (idle && t >= c.react.at && t - (c.said || 0) >= REACT_GAP && t >= (c.sayEnd || 0) + TIMING.gap.after) { speak(c.react.kind, true); c.flinch = t + TIMING.react.flinch; c.mood = c.react.kind; c.react = null; }
  }
  if (t < (c.flinch || 0) && m.def.idle) {   // it leans in to say it: fingers drumming, or a fist for the things it disapproves of
    x.T = [vw + 36, c.ly]; x.rate = 10; x.wig = 0.3; x.aim = Math.PI + Math.sin(m.t * 9) * 0.06; x.pose = c.mood === 'katana' || c.mood === 'smash' ? POSES.sulk : c.mood === 'kdrop' || c.mood === 'stab' ? POSES.joy : POSES.eager;
  }
  const { T, rate, aim, pose } = x;
  const k = 1 - Math.exp(-dt * rate), ka = 1 - Math.exp(-dt * (rate > 20 ? 30 : 9)), kp = 1 - Math.exp(-dt * (m.def.poseRate || 12));
  c.x += (T[0] - c.x) * k; c.y += (T[1] - c.y) * k; c.a += wrapA(aim - c.a) * ka; c.sh += (c.y + 70 - c.sh) * (1 - Math.exp(-dt * 4));
  for (const key in pose) c.pose[key] = (c.pose[key] || 0) + (pose[key] - (c.pose[key] || 0)) * kp;
  const Hv = gripPt(), H = [Hv[0] + scrollX, Hv[1] + scrollY];
  if (!(m.def.hold && m.def.hold(c, m, x, H)) && c.joint) c.joint.setTarget({ x: H[0] / S, y: H[1] / S });
  for (let i = c.strands.length - 1; i >= 0; i--) {
    const s = c.strands[i]; s.t += dt;
    const gone = !world.bodies.has(s.a) || !world.bodies.has(s.b), A = gone ? null : s.a.body.getWorldPoint(s.q), B = gone ? null : s.b.body.getWorldPoint(s.q);
    const len = gone ? 0 : Math.hypot(B.x - A.x, B.y - A.y) * S;
    if (gone || s.t > s.life || len > s.max) { if (!gone) gore((A.x + B.x) / 2 * S, (A.y + B.y) / 2 * S, 0, 1, 2, 0.3); s.el.remove(); c.strands.splice(i, 1); continue; }
    s.el.style.width = len.toFixed(1) + 'px';
    s.el.style.transform = `translate(${(A.x * S).toFixed(1)}px, ${(A.y * S).toFixed(1)}px) rotate(${Math.atan2(B.y - A.y, B.x - A.x).toFixed(3)}rad) scaleY(${Math.max(0.2, s.w / 5 * (1 - 0.8 * len / s.max)).toFixed(2)})`;
  }
  if (expire(c, t)) place(c, Math.min(c.x, Hv[0], vw - 80) - 30 + scrollX, Math.max(70, Math.min(c.y, Hv[1]) - 115) + scrollY, c.x + scrollX);   // put on the page in the layout pass
  draw(x.wig, x.shake, x.strain);
  // the katana's tip through the arm, anywhere along it: the hand comes off
  const kt = world.blade;
  if (kt && !kt.root && kt.tips && c.arm2 && !c.stump && c.x < vw - 30 && !m.def.uncut) {
    const a = kt.tipWas || kt.tips, b = kt.tips, n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / H_.SEVER_STEP));
    const near = (q, u, v) => { const ex = v[0] - u[0], ey = v[1] - u[1], f = clamp01(((q[0] - u[0]) * ex + (q[1] - u[1]) * ey) / (ex * ex + ey * ey || 1)); return Math.hypot(q[0] - u[0] - ex * f, q[1] - u[1] - ey * f); };
    for (let i = 0; i <= n; i++) {
      const q = [a[0] + (b[0] - a[0]) * i / n - scrollX, a[1] + (b[1] - a[1]) * i / n - scrollY];
      if (q[0] < vw - 6 && (near(q, c.arm2[1], c.arm2[2]) < H_.SEVER_PX[0] || near(q, c.arm2[0], c.arm2[1]) < H_.SEVER_PX[1])) { sever(q, kt.tipDt > 0 ? [(b[0] - a[0]) / kt.tipDt, (b[1] - a[1]) / kt.tipDt] : [0, 0]); break; }
    }
  }
}

// whatever the arm's hand was holding is let go, whole, as it was
/**
 * legacy clawLetGo(). @returns the card it was crushing, or null: legacy said 'card.stab' on it right here; the card now says it
 * on 'hand.severed' { crushed } (legacy only let go inside sever, and nothing between drew a random number)
 */
export function letGo() {
  const c = claw, o = c.o; let crushed = null; if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
  if (o && world.bodies.has(o)) {
    const grab = world.grab, mineToo = grab && grab.o === o;
    if (o.tug && o.tug.crush) { o.tug = null; o.el.style.clipPath = ''; o.el.style.filter = ''; crushed = o; }   // legacy say(o, 'stab', true): see sever()
    else if (o.tug) { const H = gripPt(), Hp = [H[0] + scrollX, H[1] + scrollY], g = o.tug; untug(o, mineToo ? [grab.cx + scrollX, grab.cy + scrollY] : [Hp[0] - Math.cos(g.psi) * g.d0, Hp[1] - Math.sin(g.psi) * g.d0], Hp); }
    o.el.style.pointerEvents = ''; o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0xFFFF });
    o.body.setGravityScale(mineToo ? 1 : TUNE.physics.FALL); o.body.setAngularDamping(mineToo ? TUNE.physics.HELD_SPIN : TUNE.physics.SPIN); o.body.setAwake(true);
  }
  c.o = null; c.snap = null;
  return crushed;
}
/**
 * the blade went through the arm (legacy sever(q, v); q: viewport px, v: tip px/s). Emits 'hand.severed' where legacy called
 * sevSpawn (the severed package spawns the hand there and gives it the fling and the random spin); 'hand.said' of its
 * "MY HAND!!" lets the katana brag (src/reactions.js)
 */
export function sever(q, v) {
  const c = claw;
  const crushed = letGo();
  const ca = Math.cos(c.a), sa = Math.sin(c.a);
  bus.emit('hand.severed', { x: c.x + 35 * ca + scrollX, y: c.y + 35 * sa + scrollY, a: c.a, pose: c.pose, v, at: q, crushed });
  gore(q[0] + scrollX, q[1] + scrollY, -1, 0, 34, 1); gore(q[0] + scrollX, q[1] + scrollY, 1, 0, 22, 0.8); gore(q[0] + scrollX, q[1] + scrollY, 0, -1, 14, 0.7);
  c.stump = true; c.react = null; c.later = null; c.said = 0; set('stump'); speak('severed', true);
  shake();
  if (!c.cutOnce) { c.cutOnce = true; bus.emit('ui.toast', { msg: line('toast.severed') }); }
}
/** cut the hand off now (legacy __sev.cut: `claw && sever([claw.x, claw.y], [0, 0])`) */
export function cut() { return claw && sever([claw.x, claw.y], [0, 0]); }
/** legacy clawReset() ("Put the cards back") */
export function reset() {
  const c = claw; if (!c) return;
  for (const s of c.strands.splice(0)) s.el.remove();
  hush(c);
  c.o = null; c.joint = null; c.snap = null; rawSet('off'); c.stump = false; c.cool = 0; c.x = html().clientWidth + H_.OFF_X; c.pose = { ...POSES.lurk }; draw(0, 0, 0);
}

// Surprise me calls it in for a scene: come() brings its grip to a point (viewport px), to() moves or re-poses it, say() and leave()
/** bring the grip to (x, y) viewport px in a pose; state 'show'. @returns {Promise<void>} */
export async function come(x, y, pose) {
  await load(); init(); if (!claw) clawInit();
  claw.show = { x, y, pose: pose || 'eager', rate: 6, bob: true }; claw.y = y; claw.ly = y; claw.sh = y + 70; set('show');
}
/** move or re-pose while in 'show': { x, y, pose, rate, aim, bob, tip, wig } */
export function to(o) { if (claw && m.is('show')) { Object.assign(claw.show, o); m.t = 0; clock.wake(); } }
/** a forced line. @returns ms it stays up (0: held back a moment) */
export function say(kind) { if (!claw) return 0; const r = speak(kind, true); return r ? r.ms : 0; }
/** the grip point, viewport px, or null */
export function grip() { return claw ? gripPt() : null; }
/** done with the scene: back to 'sulk' */
export function leave() { if (claw && m.is('show')) { claw.show = null; set('sulk'); } }
/**
 * the phrasebook borrows it: state 'book' (tick() leaves it alone), written the way the raid wrote it (legacy
 * `c.st = 'book'`: t keeps running, no until, the stump flag untouched). Give it back with set('lurk'). @returns the claw record
 */
export function borrow() { const c = get(); rawSet('book'); return c; }

export function install(app) {
  if (app && app.reduced) return;   // legacy cardPhysics() returned first: no claw, no __hand
  defineSpeaker('arm', { gate: 'arm', extraCls: 'claw-say', layer: () => world.layer, first: true,
    onSaid: (c, key, rec) => bus.emit('hand.said', { kind: key.slice(key.indexOf('.') + 1), ms: rec.ms }) });
  addFirst(() => claw);
  clock.onTick(tick, 'hand');
  clock.hasWork(busy);
  clock.keepAwake(busy);
  bus.on('world.reset', reset);
  report('claw', () => claw);
  hook('__hand', { get, draw, set, POSES, katanaSvg: (id) => (app && app.katana && app.katana.katanaSvg ? app.katana.katanaSvg(id) : '')   /* the katana's drawing, read off app (no actor import) */, come, to, say, grip, leave });
}
