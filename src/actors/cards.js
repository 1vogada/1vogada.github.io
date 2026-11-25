// The cards: rooted in the grid, pulled, torn out, thrown; everything a card says (legacy startPull, tear, the card lines of
// say(), cardSay with the AGONY tiers, BEG, panic with the PANIC tiers and the NOTME bystanders, the cards-rendered listener,
// the regrow of resetAll).
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
import { drawOffset } from '../world/loop.js';

const { world } = W;
const S = TUNE.physics.S;
const REGROW_MS = 700;                     // TUNE-REQUEST TUNE.cards.REGROW_MS: the torn-out grid cards regrow (CSS 'regrow' class)
const CRUSH_DY = -70;                      // TUNE-REQUEST TUNE.cards.CRUSH_DY: the crushed card's last scream, above the arm's fist
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
  o = W.add({ kind: 'card', el: card, w: r.width, h: r.height, ex: hx, ey: hy, key: card.dataset.key, grip: 1, root: { x: hx / S, y: hy / S } },
    hx / S, hy / S, 0, new world.pl.Box(r.width / 2 / S, r.height / 2 / S), { filterMaskBits: 0 });
  world.rootOf.set(card, o);
  W.hold(o, p.px, p.py, e); say(o, 'card.pull', { force: true });
  bus.emit('card.pulled', { card: o });
}

/** the root tore: clone into the layer, full collisions, say 'card.rip', emit 'card.ripped', first-rip toast (legacy tear) */
export function tear(o) {
  const card = o.el, el = W.cloneCard(card);
  el.style.width = o.w + 'px'; el.style.height = o.h + 'px'; el._o = o; world.layer.appendChild(el);
  world.rootOf.delete(card); card.classList.remove('pulling'); card.style.transform = ''; card.classList.add('held');
  o.el = el; o.ex = o.w / 2; o.ey = o.h / 2; o.root = null; world.ripped.add(o.key);
  o.body.setGravityScale(TUNE.physics.FALL);
  o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0xFFFF });
  if (world.grab && world.grab.o === o) { world.grab.joint.setFrequency(TUNE.drag.HAND_HZ); world.grab.joint.setDampingRatio(TUNE.drag.HAND_DAMPING); W.carry(o); }
  W.showReset(); say(o, 'card.rip', { force: true });
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
  document.querySelectorAll('#grid .card.held').forEach((c) => { c.classList.remove('held'); c.classList.add('regrow'); clock.real.after(REGROW_MS, () => c.classList.replace('regrow', 'settled')); });
}
/** the grid re-rendered on search or theme changes: keep torn-out cards out of it (legacy cards-rendered listener) */
function rendered() {
  for (const o of [...world.bodies]) if (o.root && o.kind === 'card') W.remove(o);
  document.querySelectorAll('#grid .card').forEach((c) => { if (world.ripped.has(c.dataset.key)) c.classList.add('held'); });
}

const live = (o) => !!o && world.bodies.has(o);
const when = (type, fn) => { if (isEvent(type)) bus.on(type, fn); };

export function install(app) {
  if (app && app.reduced) return;
  // legacy draw(): the bubble rides above the rotated box and stays upright, offset like the held body is drawn
  defineSpeaker('card', { kinds: ['card', 'piece', 'shard'], prefix: 'card.', gate: 'card', layer: () => world.layer,
    anchor: (o) => {
      const p = o.body.getPosition(), a = o.body.getAngle(), [hx, hy] = drawOffset(o), top = Math.abs(Math.sin(a)) * o.w / 2 + Math.abs(Math.cos(a)) * o.h / 2;
      return { x: p.x * S + hx, ax: p.x * S + hx, y: p.y * S + hy - top + TUNE.speech.RIDE_DY };
    } });
  W.onPull(startPull);
  W.onTear('card', tear);
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
}
