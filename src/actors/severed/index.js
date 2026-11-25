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
import { hook, flags } from '../../core/debug.js';
import { world, add, remove, isHeld, isCrazy, worldPoly, fragment } from '../../world/world.js';
import { drawOffset } from '../../world/loop.js';
import { gore } from '../../world/fx.js';
import { turn } from './gait.js';
import { towerTick, shookOff, tower } from './tower.js';

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
  if (waiting && list.has(waiting.o) && now < waiting.until && waiting.o !== o) {   // the hand it took off: they high-five
    const w = waiting.o; waiting = null; w.ai.mate = o; o.ai.mate = w; o.ai.met = true;
    clock.real.after(TUNE.severed.AVENGE.FIVE_AFTER_MS, () => { for (const q of [w, o]) { const qm = brains.get(q); if (list.has(q) && qm && q.ai.mate && !qm.is('held', 'caught')) qm.set('five'); } });
  }
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

// what it can sense of the other actors (wired in src/reactions.js): the shelf, as a place to hide from the new hand
let sensed = {};
/** what the old hands can sense: { lurks() -> boolean, wrist() -> { st, x, y, grip } | null, shelf() -> { x0, x1, y, w } | null, onShelf(o) -> boolean, arm() -> { pose, x, y, look } | null, armed() -> boolean, pointer() -> [x, y] viewport px | null, moved() -> game ms the pointer last moved } */
export function senses(s) { sensed = s || {}; }
/** the arm has a hand of its own to cut off (not a stump, not before a card was ripped) */ export const armed = () => (sensed.armed ? sensed.armed() : false);

// revenge: the old hand that threw the katana at the arm, waiting for the hand it cut off to drop (spawn), to high-five it
let waiting = null;
/** o threw the katana at the arm (avenge): the next hand that is cut off and drops high-fives it */
export function avenger(o) { waiting = { o, until: clock.now() + TUNE.severed.AVENGE.WAIT_MS }; }
/** a loose katana lies still within AVENGE.SEE_PX of this walking old hand, which has met the new hand: revenge */
function vengeful(o, m) {
  const a = o.ai, k = world.blade, AV = TUNE.severed.AVENGE;
  if (a.avenged || !a.met || !m.is('walk') || !k || k.root || !world.bodies.has(k) || isHeld(k) || k.body.getLinearVelocity().length() > 1 || !armed()) return false;
  const d = Math.hypot(k.body.getPosition().x - o.body.getPosition().x, k.body.getPosition().y - o.body.getPosition().y) * S;
  return d < AV.SEE_PX;
}

/** the arm is out lurking at the right edge with a hand on it, nothing in your hand (the hand tower may start) */
export const lurks = () => (sensed.lurks ? !!sensed.lurks() : false);
/** the arm's wrist and grip (viewport px), its state and seconds in it, or null: { st, t, x, y, grip, is(...states) } */
export const wrist = () => { const r = sensed.wrist ? sensed.wrist() : null; return r && { ...r, is: (...s) => s.includes(r.st) }; };
export { shookOff, tower };
/** the new hand, when the arm is out showing it (the mirror game), else null */ export const armOut = () => (sensed.arm ? sensed.arm() : null);

// the mirror game: a walking old hand that has met the new one, in view, with nothing better to do (not hunting, running, hurt,
// or hiding), while the arm is out
function mirrors(o) {
  const a = o.ai, t = frameT;
  if (!a.met || a.hunting || t < a.flee || t < a.hurt || t < (a.mirrorCool || 0) || onRefuge(o) || !armOut()) return false;
  const p = o.body.getPosition(), x = p.x * S - scrollX, y = p.y * S - scrollY;
  return x > 0 && x < document.documentElement.clientWidth && y > 0 && y < innerHeight + B.h;
}
/** the shelf, if it is out (a place to hide) */ export const refuge = () => (sensed.shelf ? sensed.shelf() : null);
/** o is on the shelf */ export const onRefuge = (o) => (sensed.onShelf ? sensed.onShelf(o) : false);
/** your mouse pointer on the page, viewport px, or null */ export const pointer = () => (sensed.pointer ? sensed.pointer() : null);
/**
 * a gift for you: your pointer is on the page and has rested for GIFT.STILL_MS (off while window.__test.idle === false, like the
 * arm's "are you still there?": the scenarios leave the mouse still)
 */
export const giving = () => !!pointer() && !!sensed.moved && flags().idle && clock.now() - sensed.moved() > SV.GIFT.STILL_MS;
/**
 * the crumpled ball of the card q it has just crushed, around q's own point (cx, cy) (px; crush takes it from the patterned band): a little piece of q,
 * screwed up (its outline jagged, darker, creased). It is a piece (it can be thrown, and caught and eaten) marked ball.
 */
export function crumple(q, cx, cy, giver) {
  const G = SV.GIFT, R = G.R, poly = [], clip = [];
  for (let k = 0; k < 8; k++) { const t = k / 8 * 2 * Math.PI; poly.push([cx + Math.cos(t) * R * 0.86, cy + Math.sin(t) * R * 0.86]); }
  for (let k = 0; k < 18; k++) { const t = k / 18 * 2 * Math.PI, r = R * (k % 2 ? 0.74 + 0.12 * Math.random() : 0.92 + 0.1 * Math.random()); clip.push(`${(cx + Math.cos(t) * r).toFixed(1)}px ${(cy + Math.sin(t) * r).toFixed(1)}px`); }
  const b = fragment(q, poly, 'piece', {}, { ball: true, giver });
  b.el.style.clipPath = `polygon(${clip.join(',')})`; b.el.style.filter = G.FILTER;
  const fold = document.createElement('i');   // the creases and the shading of a ball of paper
  Object.assign(fold.style, { position: 'absolute', left: (cx - R) + 'px', top: (cy - R) + 'px', width: 2 * R + 'px', height: 2 * R + 'px', borderRadius: '50%', pointerEvents: 'none', background: G.CREASES });
  b.el.appendChild(fold);
  return b;
}

/**
 * the new hand ate one of them (hand.devoured): every other old hand that is up to it walks to the spot (page x), bows, one of
 * them says a few words, and they run (mourn, bow)
 */
export function mourn(x) {
  const fun = { said: false };
  for (const o of list) { const m = brains.get(o); if (!world.bodies.has(o) || !m.is('walk', 'rest', 'limp', 'rise', 'stare', 'gloat')) continue; o.ai.spot = x; o.ai.fun = fun; o.ai.met = true; m.set('mourn'); }
}
/** the shelf came out: old hands that have met the new hand run for it (hide) */
export function scare() {
  if (!refuge()) return;
  for (const o of list) { const m = brains.get(o); if (o.ai.met && m.is('walk', 'rest', 'rise')) m.set('hide'); }
}

/** the new hand poked an old hand that plays dead (hand.poked): twitch, it gives itself away */
export function poked(o, twitch) {
  const m = brains.get(o); if (!m || !m.is('dead')) return;
  o.ai.pokedAt = clock.now(); o.ai.twitched = !!twitch;
  if (twitch) say(o, 'twitch', true);
}

/** the new hand took it for a card and has hold of it (hand.mistook): caught, and it says what it is */
export function mistaken(o) { const m = brains.get(o); if (!m) return; o.ai.why = 'notcard'; m.set('caught'); }
/** ...and gave it back (hand.returned): it drops, and says something about it */
export function returned(o) { const m = brains.get(o); if (!m || !m.is('caught')) return; m.set('limp'); say(o, 'returned', true); }

/**
 * the cheese pull: the arm is dragging card q off the shelf (its grip at page px `from`). The nearest old hand in view close to
 * it that is up to it may jump on the other end (TUNE.severed.CHEESE.CHANCE; the one random draw happens only when there is such
 * a hand). @returns the old hand that pounced, or null
 */
export function pounce(q, from) {
  const C = SV.CHEESE; if (!q || !world.bodies.has(q) || isCrazy()) return null;
  const poly = worldPoly(q); let best = null, bd = C.NEAR_PX;
  for (const o of list) {
    if (!world.bodies.has(o) || !brains.get(o).is(...C.FROM) || !isFree(o) || isHeld(o)) continue;
    const p = o.body.getWorldCenter(), y = p.y * S - scrollY, d = edgeDist(poly, p.x * S, p.y * S);
    if (y > 0 && y < innerHeight + C.BELOW_PX && d < bd) { bd = d; best = o; }
  }
  if (!best || Math.random() >= C.CHANCE) return null;
  Object.assign(best.ai, { ride: q, cheese: true, mine: false, away: from }); brains.get(best).set('hitch');
  return best;
}

/** the cheese pull is over (hand.cheesed): with its half (mine) it rides it down; without, it is flicked off */
export function cheesed(o, mine) {
  const m = brains.get(o); if (!m || !m.is('cheese') || !world.bodies.has(o)) return;
  if (mine && world.bodies.has(mine)) { Object.assign(o.ai, { ride: mine, mine: true, cheese: false }); o.ai.boast = true; m.set('hitch'); return; }   // (hitch says its line)
  if (isHeld(o)) return;   // you took it off the card: it is yours now (held)
  const C = SV.CHEESE; m.set('whee'); o.body.setLinearVelocity({ x: C.FLICK[0], y: C.FLICK[1] }); o.body.setAngularVelocity(-C.FLICK_SPIN);
}

/**
 * tug of war over a card (hand.wrest): the arm took the other end of card q, which o was crushing. It lets go of the squeeze and
 * hangs on to its end (wrest). @returns true when it did
 */
export function wrest(o, q) {
  const m = brains.get(o); if (!m || !m.is('crush') || o.ai.prey !== q || !world.bodies.has(o)) return false;
  o.ai.ride = q; m.set('wrest'); return true;
}
/** it has card q after all (the arm slipped or let go, or q is its half of the torn card): it says so, and crushes it */
export function regain(o, q, kind) {
  const m = brains.get(o); if (!m || !world.bodies.has(q)) return;
  q.wrested = true;   // (no second tug of war over the same card)
  o.ai.ride = null; o.ai.prey = q; say(o, kind, true); m.set('crush');
}
/** the tug of war is over (hand.wrested): with the whole card or its half (mine) it crushes it; without, it already slipped */
export function wrested(o, mine, whole) {
  const m = brains.get(o); if (!m || !m.is('wrest') || !world.bodies.has(o) || !mine || !world.bodies.has(mine)) return;
  regain(o, mine, whole ? 'wrestWon' : 'wrestEnd');
}

/** the new hand ate a gift (hand.ate of a ball): the old hand that brought it is not pleased */
export function regift(ball) { const o = ball.giver; if (o && list.has(o) && world.bodies.has(o)) say(o, 'regift', true); }

/** rock, paper, scissors (scenes/rps.js): what the old hand shows while it plays ('rps'): { pose: rock | paper | scissors, pump } */
export function play(o, look) { o.ai.rps = { ...(o.ai.rps || {}), ...look }; }

/** legacy sevSet(o, st) */
export function set(o, st) { const m = brains.get(o); if (m) m.set(st); }

/** legacy __sev.cut(): cut the arm's hand off now (tests). Legacy: claw && sever([claw.x, claw.y], [0, 0]) */
export function cut() { const h = app && app.hand; if (h && typeof h.cut === 'function') return h.cut(); return undefined; }

/**
 * legacy sevFood(q): a card or big piece it may hunt. The flags it shares with the other actors (o.root, o.tug of the arm's
 * tug, o.sq of its own squeeze, o.die) stay; the pointer is world.grab; the arm's target (legacy claw.o) is a claim.
 */
export const food = (q) => (q.kind === 'card' || (q.kind === 'piece' && !q.die)) && !q.root && !q.tug && !q.sq && !isHeld(q) && isFree(q) && !riding(q) && !q.ball;

/** an old hand is riding on q (hitch) */
export const riding = (q) => { for (const o of list) if (o.ai.ride === q && brains.get(o).is('hitch', 'cheese')) return true; return false; };

// The hitchhiker: each time you pick up a card or a piece (the moment it is loose in your hand), the nearest old hand close by
// that is up to it may jump on (TUNE.severed.HITCH.CHANCE; the one random draw happens only when there is such a hand)
let eyed = null;   // the pick-up already looked at
/** how far page point (x, y) is from the edge of an outline (page px) */
function edgeDist(poly, x, y) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length], ex = bx - ax, ey = by - ay, f = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1))); d = Math.min(d, Math.hypot(x - ax - ex * f, y - ay - ey * f)); }
  return d;
}
function hitchhike() {
  const g = world.grab; if (!g || g === eyed || g.o.root) return;
  eyed = g; const q = g.o, HI = SV.HITCH;
  if ((q.kind !== 'card' && q.kind !== 'piece') || q.die || q.tug || q.sq || q.ball || isCrazy() || riding(q)) return;
  const poly = worldPoly(q); let best = null, bd = HI.NEAR_PX;
  for (const o of list) { if (!world.bodies.has(o) || !brains.get(o).is(...HI.FROM) || !isFree(o)) continue; const p = o.body.getWorldCenter(), d = edgeDist(poly, p.x * S, p.y * S); if (d < bd) { bd = d; best = o; } }
  if (best && Math.random() < HI.CHANCE) { Object.assign(best.ai, { ride: q, cheese: false, mine: false, away: null }); brains.get(best).set('hitch'); }
}

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
  hitchhike();
  towerTick(dt);
  for (const o of [...list]) {
    const a = o.ai, h = o.hand, m = brains.get(o); m.age(dt);
    if (isHeld(o) && m.state !== 'held' && !m.def.tap) m.set('held');   // (a state with tap: true tells a tap from a pick-up itself)
    else if (m.state === 'walk' && mirrors(o)) m.set('mirror');
    if (vengeful(o, m)) m.set('avenge');
    if (m.state === 'held') a.alone = frameT; else if (!a.painted && frameT - (a.alone ?? a.born) > SV.PAINT.MS && m.is('walk', 'rest')) { a.painted = true; m.set('paint'); }   // left alone long enough: it writes something
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
  hook('__sev', { list, get SEV() { return table(); }, POSES, set, spawn, say, cut, mourn, scare, brain, riding, pounce, tower });
}
