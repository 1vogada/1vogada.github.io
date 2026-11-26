// The cards: rooted in the grid, pulled, torn out, thrown; everything a card says (legacy startPull, tear, the card lines of
// say(), cardSay with the AGONY tiers, BEG, panic with the PANIC tiers and the NOTME bystanders, the cards-rendered listener,
// the regrow of resetAll, putBack: one card grown back into its slot after the search box ate it, and takeOne: the card the
// hand helped itself to while you were away, chain away-thief).
// the regrow of resetAll, and putBack: one card grown back into its slot after the search box ate it, or paid for with the kept
// coin, 'card.paid'; spared: a card on the shelf sees the hand go for the coin instead, 'card.spared').
//
// A card speaks only from the world's pull/tear hooks and from its own event listeners (registered in install, so they run
// before src/reactions.js). Each listener runs where the legacy code said the line, so the line picks and the random draws
// keep their legacy order:
//   card.strained      'card.strain' (forced the first time in a pull)            legacy step()
//   card.sprangBack    'card.back'                                                legacy drop()
//   body.thrown        'card.throw' (not the katana, not a cut-off hand)          legacy drop()
//   card.landed        'card.land'                                                legacy onContact()
//   hand.grabbed       'card.pull' when the arm plucks it (how: catch | reach)    legacy clawTick catch / reach
//   hand.ripped        'card.slice' scream on your half                           legacy clawRip
//   hand.severed       'card.stab' on the card it was crushing (crushed)          legacy clawLetGo inside sever
//   card.hurt          'card.agony' tiers at the given pain                        legacy cardSay (the arm's tug and crush)
//   card.begged        'card.beg'                                                 legacy crush pause talkOn(ob, pick(BEG))
//   card.crushed       'card.slice' scream left standing where the arm crushed it  legacy sayAt(H[0], H[1] - 70, pick(SAY.slice), 'scream')
//   hand.tossed        'card.throw' when the arm throws it back hard              legacy clawTick has
//   hand.chewing       'card.chewed' while the arm chews it at the edge (forced on the way in)   chain away-thief
//   hand.unchewed      'card.bitten' once you pulled it out of its fingers                     chain away-thief
//   hand.reaching      panic(): reactions.js calls it                             legacy panic(o, fear, dt, t)
// The blade's own card lines (cutting, the slice of a cut, the stab) stay in world/cut.js: 'card.cut' is emitted after the
// katana's line and 'card.stabbed' before the wound's random life, so a listener there would change the draw order.
// The cut-off hand's crush (actors/severed, package V2) speaks for its prey through this speaker directly ('card.pull' forced,
// 'card.agony' in agony mode, sayAt 'card.slice' scream): the 'card' speaker, the agony mode and the scream are all core/speech.
// Event types not yet in src/core/events.js are listened to only once they are (isEvent), so a strict bus never throws.

import { defineSpeaker, say, sayAt } from '../core/speech.js';
import { bus } from '../core/bus.js';
import { isEvent } from '../core/events.js';
import { line } from '../core/lines.js';
import { TUNE, TIMING } from '../core/tune.js';
import { clock } from '../core/clock.js';
import * as W from '../world/world.js';
import { rideAnchor } from '../world/loop.js';
import { validPoly } from '../world/cut.js';
import { gore, shake } from '../world/fx.js';
import { unstretch } from '../world/stretch.js';

const { world } = W;
const S = TUNE.physics.S;
const REGROW_MS = TUNE.cards.REGROW_MS;
const CRUSH_DY = TUNE.cards.CRUSH_DY;
const D = TUNE.drag;
const notMine = (o) => o.kind !== 'katana' && o.kind !== 'hand';   // the katana and the cut-off hands have their own lines

// ---- pull and tear (the world calls them through onPull / onTear('card')) ----

/** a press became a pull: root body at the slot, hold it, say 'card.pull', emit 'card.pulled' (legacy startPull) */
export function startPull(p, e) {
  W.init();
  const card = p.card; card.classList.remove('grab-ready');
  let o = world.rootOf.get(card);
  if (o) return W.hold(o, e.clientX + scrollX, e.clientY + scrollY, e);   // caught again while springing back
  card.classList.add('pulling', 'settled'); card.style.transform = 'none';
  const r = card.getBoundingClientRect(), hx = r.left + r.width / 2 + scrollX, hy = r.top + r.height / 2 + scrollY;
  card.style.rotate = '';   // a loosened card sat crooked: the body takes over from here
  o = W.add({ kind: 'card', el: card, w: r.width, h: r.height, ex: hx, ey: hy, key: card.dataset.key, grip: 1, tugs: need(card.dataset.key), loose: world.loose.get(card.dataset.key) || 0, root: { x: hx / S, y: hy / S } },
    hx / S, hy / S, 0, new world.pl.Box(r.width / 2 / S, r.height / 2 / S), { filterMaskBits: 0 });
  world.rootOf.set(card, o);
  W.hold(o, p.px, p.py, e); say(o, 'card.pull', { force: true });
  bus.emit('card.pulled', { card: o });
}

// how many tugs this card takes: one for most, two for the stubborn ones; rolled once per card (until Put the cards back). 0: no teeth.
// The roll is a hash of the card's key and the time of the first pull, not Math.random: a draw here would shift every later pick
// on the page (docs/pitfalls.md 1), and a pull is far too common a thing for that
let salt = 0;
function need(key) {
  if (!D.TEETH) return 0;
  if (!world.tugs.has(key)) {
    if (!salt) salt = Date.now() % 100000 + 1;
    let h = salt; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
    world.tugs.set(key, (h * 7919 % 1000) / 1000 < D.ONE_TUG ? 1 : 2);
  }
  return world.tugs.get(key);
}

// out of its slot: the grid card stays behind as an empty place, a copy in the physics layer is the body from here on
function uproot(o) {
  if (o.sg) unstretch(o);   // the stretch look stays on the grid card otherwise, and the copy would inherit it
  const card = o.el, el = W.cloneCard(card);
  el.style.width = o.w + 'px'; el.style.height = o.h + 'px'; el._o = o; world.layer.appendChild(el);
  world.rootOf.delete(card); card.classList.remove('pulling'); card.style.transform = ''; card.classList.add('held');
  o.el = el; o.ex = o.w / 2; o.ey = o.h / 2; o.root = null; W.markRipped(o.key); world.loose.delete(o.key); world.tugs.delete(o.key);
  o.body.setGravityScale(TUNE.physics.FALL);
  o.body.getFixtureList().setFilterData(W.HIT_ALL);
  if (world.grab && world.grab.o === o) { world.grab.joint.setFrequency(TUNE.drag.HAND_HZ); world.grab.joint.setDampingRatio(TUNE.drag.HAND_DAMPING); W.carry(o); }
  W.showReset();
}

/** the root gave one notch (world/loop.js, a tug that used up its grip): it lurches, bleeds a little at the root and says so */
export function give(o) {
  world.loose.set(o.key, o.loose);
  const b = o.body, g = world.grab, t = g.joint.getTarget(), p = b.getPosition(), dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1, m = b.getMass();
  b.applyLinearImpulse({ x: m * 2.2 * dx / d, y: m * 2.2 * dy / d }, b.getWorldCenter(), true);
  b.applyAngularImpulse(b.getInertia() * (Math.random() - 0.5) * 5, true);
  gore(o.root.x * S, o.root.y * S, dx / d, dy / d, 5, 0.6);
  say(o, 'card.loosen', { force: true });
  bus.emit('card.loosened', { card: o, left: o.tugs - o.loose });
}

/**
 * yanked past RIP before the root was loose (world/loop.js): the card tears in two across the pull. The half you hold flies to
 * your hand, the other half drops out of the slot. Falls back to an ordinary tear when the halves would not be valid pieces
 */
export function snap(o) {
  const gr = world.grab, b = o.body, W_ = o.w, H_ = o.h;
  const q = b.getLocalPoint(gr.joint.getAnchorB()), t = gr.joint.getTarget(), a0 = gr.joint.getAnchorB(), v = b.getLocalVector({ x: t.x - a0.x, y: t.y - a0.y });
  const vl = Math.hypot(v.x, v.y) || 1, ux = v.x / vl, uy = v.y / vl, gp = [q.x * S + W_ / 2, q.y * S + H_ / 2];
  const src = W.rectPoly(o), pr = (p) => p[0] * ux + p[1] * uy, lo = Math.min(...src.map(pr)), hi = Math.max(...src.map(pr)), L = hi - lo;
  // the tear runs across the pull, halfway between where you hold it and the end that stays behind
  const c = Math.max(lo + D.SNAP_KEEP * L, Math.min(hi - D.SNAP_KEEP * L, (lo + pr(gp)) / 2)), side = (p) => pr(p) - c;
  const mineP = [], restP = [], cut = [];
  for (let i = 0; i < src.length; i++) {
    const p = src[i], n = src[(i + 1) % src.length], sp = side(p), sn = side(n);
    (sp >= 0 ? mineP : restP).push(p);
    if ((sp > 0 && sn < 0) || (sp < 0 && sn > 0)) { const f = sp / (sp - sn), x = [p[0] + (n[0] - p[0]) * f, p[1] + (n[1] - p[1]) * f]; mineP.push(x); restP.push(x); cut.push(x); }
  }
  if (cut.length !== 2 || !validPoly(mineP) || !validPoly(restP)) return tear(o);
  uproot(o);
  // ragged: both halves get the same teeth along the tear, in the clip-path only (the bodies keep the straight edge)
  const n = Math.max(6, Math.round(Math.hypot(cut[1][0] - cut[0][0], cut[1][1] - cut[0][1]) / 15)), teeth = [];
  for (let k = 1; k < n; k++) teeth.push([(k + (Math.random() - 0.5) * 0.5) / n, (k % 2 ? 1 : -1) * (4 + Math.random() * 9) * (Math.random() < 0.18 ? 2.2 : 1)]);
  const jag = (poly) => {
    const out = [];
    poly.forEach((p, i) => {
      out.push(p); const z = poly[(i + 1) % poly.length];
      if (cut.includes(p) && cut.includes(z)) for (const [f, off] of (p === cut[0] ? teeth : [...teeth].reverse())) out.push([cut[0][0] + (cut[1][0] - cut[0][0]) * f + ux * off, cut[0][1] + (cut[1][1] - cut[0][1]) * f + uy * off]);
    });
    return `polygon(${out.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
  };
  const mine = W.fragment(o, mineP, 'piece', {}, {}), rest = W.fragment(o, restP, 'piece', {}, {});
  mine.el.style.clipPath = jag(mineP); rest.el.style.clipPath = jag(restP);
  const at = b.getWorldPoint(q), wu = b.getWorldVector({ x: ux, y: uy }), vel = b.getLinearVelocity();
  world.b2.destroyJoint(gr.joint); world.grab = null; W.remove(o);
  W.hold(mine, at.x * S, at.y * S, { pointerId: gr.id, clientX: gr.cx, clientY: gr.cy }); world.grab.moved = true; world.grab.h = gr.h; world.grab.sticky = gr.sticky;
  mine.body.setLinearVelocity({ x: vel.x + wu.x * 6, y: vel.y + wu.y * 6 });
  rest.body.setLinearVelocity({ x: -wu.x * 2.5, y: -wu.y * 2.5 }); rest.body.setAngularVelocity((Math.random() - 0.5) * 5);
  for (let k = 0; k <= 8; k++) {
    const f = k / 8, l = { x: (cut[0][0] + (cut[1][0] - cut[0][0]) * f - W_ / 2) / S, y: (cut[0][1] + (cut[1][1] - cut[0][1]) * f - H_ / 2) / S }, A = rest.body.getWorldPoint(l);
    gore(A.x * S, A.y * S, wu.x, wu.y, 5, 1); gore(A.x * S, A.y * S, -wu.x, -wu.y, 4, 0.8);
  }
  shake();
  say(mine, 'card.slice', { force: true, scream: true });
  bus.emit('card.snapped', { mine, rest });
  if (!snapped) { snapped = true; bus.emit('ui.toast', { msg: line('toast.snapped') }); }
}
let snapped = false;

/** the root tore: clone into the layer, full collisions, say 'card.rip', emit 'card.ripped', first-rip toast (legacy tear) */
export function tear(o) {
  uproot(o); say(o, 'card.rip', { force: true });
  bus.emit('card.ripped', { card: o });   // legacy notice('loose')
  if (world.ripped.size === 1) bus.emit('ui.toast', { msg: line('toast.ripped') });
}

// ---- agony and panic ----

/** legacy cardSay(o, pain): three tiers by pain, louder, bigger and more often the more it hurts */
export const agony = (o, pain) => say(o, 'card.agony', { mode: 'agony', pain });

// legacy kept these two on the claw object, which lives as long as the page: never reset
let crowd = 0, notme = 0;
/**
 * a card on the shelf while the hand creeps up (legacy panic(o, fear, dt, t)): it shakes harder and harder, hops, shuffles
 * away from the hand and says so ('card.panic' tiers); loose cards nearby shiver, and one of them (one in three, at most once
 * per TIMING.gap.notme) says 'card.notme'. handX: the wrist's viewport x (legacy claw.x).
 */
export function panic(o, fear, dt, t, handX) {
  const b = o.body, m = b.getMass(), away = Math.sign(b.getWorldCenter().x * S - scrollX - handX) || -1;
  if (fear > 0.05) say(o, 'card.panic', { mode: 'agony', pain: 0.1 + 0.9 * fear });
  if (t > (o.jit || 0)) {
    o.jit = t + 150 - 90 * fear + Math.random() * 60;
    b.applyLinearImpulse({ x: m * (away * (0.25 + 0.9 * fear) * Math.random() + (Math.random() - 0.5) * 0.5 * fear), y: -m * (0.35 + 2 * fear * Math.random()) }, b.getWorldCenter(), true);
    b.applyAngularImpulse(b.getInertia() * (Math.random() - 0.5) * (1.2 + 5 * fear), true);
  }
  if (t > crowd) {
    crowd = t + 220; const w0 = b.getWorldCenter(), grab = world.grab;
    for (const q of world.bodies) {
      if (q === o || q.kind !== 'card' || q.root || q.tug || (grab && grab.o === q)) continue;
      const w = q.body.getWorldCenter(); if (Math.hypot(w.x - w0.x, w.y - w0.y) > 6.5) continue;
      q.body.applyLinearImpulse({ x: (Math.random() - 0.5) * q.body.getMass() * 0.5 * (0.3 + fear), y: -q.body.getMass() * 0.35 * (0.3 + fear) * Math.random() }, w, true);
      q.body.applyAngularImpulse(q.body.getInertia() * (Math.random() - 0.5) * (0.3 + fear), true);
      if (t - notme > TIMING.gap.notme && Math.random() < 0.3 && !q.say) { notme = t; say(q, 'card.notme', { mode: 'plain' }); }
    }
  }
}

// ---- the grid ----

/** "Put the cards back": the torn-out grid cards grow back (legacy resetAll, on wall time) */
function regrow() {
  document.querySelectorAll('#grid .card').forEach((c) => { c.style.rotate = ''; });
  document.querySelectorAll('#grid .card.held').forEach((c) => { c.classList.remove('held'); c.classList.add('regrow'); clock.real.after(REGROW_MS, () => c.classList.replace('regrow', 'settled')); });
}
/**
 * one card goes home (the search box swallowed it and found its project, page/feed.js 'search.fed' via src/reactions.js): its
 * slot is no longer torn out, it grows back like "Put the cards back" does it, and says so over the slot ('card.home').
 * The "Put the cards back" button stays: there may be more out there. what: the line it says ('card.paid' when the kept coin paid
 * for it, page/coinbody.js 'coin.paid')
 */
export function putBack(key, what = 'card.home') {
  if (!key) return;
  world.ripped.delete(key); world.loose.delete(key); world.tugs.delete(key);
  const c = [...document.querySelectorAll('#grid .card')].find((x) => x.dataset.key === key);
  if (!c) return;
  c.style.rotate = '';
  if (c.classList.contains('held')) { c.classList.remove('held'); c.classList.add('regrow'); clock.real.after(REGROW_MS, () => c.classList.replace('regrow', 'settled')); }
  const r = c.getBoundingClientRect();
  if (r.width) sayAt(r.left + scrollX + r.width / 2, r.top + scrollY + TUNE.speech.RIDE_DY, what);
}
/**
 * the hand goes for the kept coin on the shelf instead of a card (src/reactions.js): the first loose card lying there (on(o): it is
 * on the shelf) says how relieved it is ('card.spared')
 */
export function spared(on) {
  for (const o of world.bodies) if (o.kind === 'card' && !o.root && !o.tug && on(o)) { say(o, 'card.spared', { force: true }); return; }
}
/**
 * the hand helped itself while you were away (page/away.js 'page.returned' via src/reactions.js, chain away-thief): one grid
 * card leaves its slot unseen and is a loose body from here on (the slot stays empty, "Put the cards back" shows). It takes the
 * card nearest the right edge among those on screen (top first), else the first one still in the grid. No random draw.
 * @returns the body, or null (no physics yet, or no card left in the grid)
 */
export function takeOne() {
  if (world.reduced || !world.b2) return null;
  const vh = innerHeight;
  let best = null, br = null;
  for (const c of document.querySelectorAll('#grid .card')) {
    if (c.classList.contains('held') || world.rootOf.has(c) || world.ripped.has(c.dataset.key)) continue;
    const r = c.getBoundingClientRect(); if (!r.width) continue;
    const on = r.bottom > 0 && r.top < vh, bOn = br && br.bottom > 0 && br.top < vh;
    if (!best || (on && !bOn) || (on === bOn && on && (r.right > br.right + 1 || (Math.abs(r.right - br.right) <= 1 && r.top < br.top)))) { best = c; br = r; }
  }
  if (!best) return null;
  best.style.rotate = ''; world.loose.delete(best.dataset.key); world.tugs.delete(best.dataset.key);
  return W.freeCard(best);
}
/** the grid re-rendered on search or theme changes: keep torn-out cards out of it (legacy cards-rendered listener) */
function rendered() {
  for (const o of [...world.bodies]) if (o.root && o.kind === 'card') W.remove(o);
  document.querySelectorAll('#grid .card').forEach((c) => { if (world.ripped.has(c.dataset.key)) c.classList.add('held'); crook(c); });
}

// a card whose root has given sits a little crooked in its slot, one way then the other, more with every tug
const crook = (c) => { const n = world.loose.get(c.dataset.key) || 0; c.style.rotate = n ? `${((n % 2 ? 1 : -1) * D.LOOSE_TILT * n).toFixed(1)}deg` : ''; };

const live = (o) => !!o && world.bodies.has(o);
const when = (type, fn) => { if (isEvent(type)) bus.on(type, fn); };

export function install(app) {
  if (app && app.reduced) return;
  // legacy draw(): the bubble rides above the rotated box and stays upright, offset like the held body is drawn
  defineSpeaker('card', { kinds: ['card', 'piece', 'shard'], prefix: 'card.', gate: 'card', layer: () => world.layer,
    anchor: rideAnchor });
  W.onPull(startPull);
  W.onTear('card', tear);
  W.onGive('card', give);
  W.onSnap('card', snap);
  bus.on('body.removed', ({ body }) => { if (body.root && body.kind === 'card') crook(body.el); });   // sprang home: world.remove clears its transform right after
  bus.on('card.strained', ({ card, first }) => { if (card.kind !== 'katana') say(card, 'card.strain', { force: first }); });
  bus.on('card.sprangBack', ({ card }) => { if (card.kind !== 'katana') say(card, 'card.back', { force: true }); });
  bus.on('body.thrown', ({ body }) => { if (notMine(body)) say(body, 'card.throw', { force: true }); });
  bus.on('card.landed', ({ card }) => { if (live(card)) say(card, 'card.land'); });   // the world's own say is the same call: the gate drops the second
  bus.on('cards.rendered', rendered);
  bus.on('world.reset', regrow);
  // what the arm and the cut-off hands do to a card
  bus.on('hand.grabbed', ({ card, how }) => { if ((how === 'catch' || how === 'reach') && live(card)) say(card, 'card.pull', { force: true }); });
  bus.on('hand.ripped', ({ mine }) => { if (live(mine)) say(mine, 'card.slice', { force: true, scream: true }); });
  bus.on('hand.severed', ({ crushed }) => { if (live(crushed)) say(crushed, 'card.stab', { force: true }); });
  when('card.hurt', ({ card, pain }) => { if (live(card)) agony(card, pain); });
  when('card.begged', ({ card }) => { if (live(card)) say(card, 'card.beg', { mode: 'plain' }); });
  when('card.crushed', ({ at }) => sayAt(at[0], at[1] + CRUSH_DY, 'card.slice', { scream: true }));
  when('hand.tossed', ({ card, hard }) => { if (hard && live(card)) say(card, 'card.throw', { force: true }); });
  when('hand.chewing', ({ card, first }) => { if (live(card)) say(card, 'card.chewed', { force: !!first }); });   // left unattended (away-thief)
  when('hand.unchewed', ({ card }) => { if (live(card)) say(card, 'card.bitten', { force: true }); });
}
