// The new hand and the old one: how the arm sees the hands that were cut off (they are another actor, sensed through
// sense().oldHands, wired in src/reactions.js), and when it may go for one.
//
// The rules (Ivo 2026-11-25: "consuming the old one, with a set of conditions that make sense"):
//   meet     the first time an old hand is in view while the arm lurks with a hand of its own, it leans out and looks (once
//            per old hand; not while the old hand is stalking or eating a card). Nothing is eaten before they have met.
//   devour   an old hand it has met, near the right edge (TUNE.hand.OLD.REACH), that cannot get away: asleep (rest), lying
//            down (limp), still dragging itself on its belly from the cut (crawl), or caught gloating over a card it just
//            stole (crush -> gloat, then 'thief' for THIEF_MS). Not while you hold it, not while it is busy crushing, not
//            while the arm holds a card, not for DIGEST_MS after the last one it ate, never in crazy mode or a scene (the arm
//            only looks from lurk). Also an old hand it beat at rock, paper, scissors (scenes/rps.js), for TUNE.rps.FAIR_MS.
//   prod     an old hand it has met, walking about on its feet near the right edge (awake, not weak): now and then it goes for
//            it anyway (OLD.AWAKE, rolled once per old hand per OLD.ROLL_MS, never while full). That one plays dead (prod.js).
//   wrest    an old hand it has met starts crushing a card near the right edge while it lurks with nothing in its hand (not
//            full, not cooling off): now and then (TUNE.hand.WREST.CHANCE, rolled once per crush) it grabs the other end (wrest.js).
//   rival    an old hand got to your still cursor first and pokes it (severed/pester.js): the arm leaves it alone meanwhile
//            (look() skips it) and, once it has poked, comes out to do its job anyway ('mine', see rival()).
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { now } from '../../core/clock.js';
import { isFree } from '../../core/claims.js';
import { world, isHeld } from '../../world/world.js';
import { sense, set, notice, speak } from './index.js';

const S = TUNE.physics.S, OLD = TUNE.hand.OLD;
const met = new WeakSet();       // old hands it has looked at
const seen = new WeakMap();      // old hand -> since when it has been in view, not yet met
const thieves = new WeakMap();   // old hand -> until when it is fair game for stealing a card
const rolled = new WeakMap();    // old hand -> when it may next be rolled for (prod)

/** the cut-off hands there are (none wired: none) */
const olds = () => { const f = sense().oldHands; return f ? [...f()].filter((o) => world.bodies.has(o)) : []; };
/** the palm of an old hand, viewport px */
export const at = (o) => { const p = o.body.getWorldCenter(); return [p.x * S - scrollX, p.y * S - scrollY]; };
const inView = (q, vw, vh) => q[0] > OLD.SEE[0] && q[0] < vw - 10 && q[1] > OLD.SEE[1] && q[1] < vh + OLD.SEE_BOTTOM;   // lying on the floor of the page its palm can be at (or just past) the very bottom

/** has the arm met this old hand */
export const hasMet = (o) => met.has(o);
/** it met this one (meet.js) */
export const meet = (o) => { met.add(o); };

/** an old hand crushed a card (reactions: sev.state crush -> gloat): if they have met, it notices and the old one is fair game */
export function stole(o, t) {
  if (!met.has(o)) return;
  thieves.set(o, t + OLD.THIEF_MS);
  notice('stolen');
  bus.emit('hand.thief', { hand: o });
}

/**
 * old hand o just started crushing card q (reactions: sev.state -> crush): may the arm, lurking, go for the card? The checks
 * draw nothing; the one random draw (TUNE.hand.WREST.CHANCE) happens only when it could. @returns true when it goes for it
 */
export function wrestable(c, o, q, t) {
  if (t <= c.cool || t <= (c.fullUntil || 0) || world.grab || !met.has(o) || isHeld(o) || !q || !world.bodies.has(q) || q.wrested) return false;
  const vw = document.documentElement.clientWidth, vh = innerHeight, reach = Math.min(OLD.REACH[0], vw * OLD.REACH[1]), p = at(o);
  const w = q.body.getWorldCenter(), qx = w.x * S - scrollX, qy = w.y * S - scrollY;
  if (!inView(p, vw, vh) || qx <= vw - reach || qx >= vw - 10 || qy < OLD.SEE[1] || qy > vh + OLD.SEE_BOTTOM) return false;
  q.wrested = true;   // rolled for: once per crush
  return Math.random() < TUNE.hand.WREST.CHANCE;
}

/** it beat this old hand at rock, paper, scissors: fair game until `until` (game ms), as a thief is (no remark) */
export function lost(o, until) { met.add(o); thieves.set(o, Math.max(thieves.get(o) || 0, until)); }

/** it cannot get away (see the rules at the top) */
function weak(o, t) {
  const a = o.ai, st = a.st, f = sense().onShelf;
  if (f && f(o)) return false;   // it hid on the shelf: out of bounds
  return st === 'rest' || st === 'limp' || (st === 'walk' && a.gait === 'crawl') || ((st === 'gloat' || st === 'walk') && t < (thieves.get(o) || 0));
}

/** lurking, it has something to look at: an old hand in view it has not met, or one it could eat (keeps the frame loop awake) */
export function wants(c) {
  const t = now(), vw = document.documentElement.clientWidth, vh = innerHeight, reach = Math.min(OLD.REACH[0], vw * OLD.REACH[1]);
  if (world.grab) return false;
  for (const o of olds()) {
    if (isHeld(o) || !isFree(o)) continue;
    const q = at(o); if (!inView(q, vw, vh)) continue;
    if ((!met.has(o) && !o.ai.hunting && o.ai.st !== 'crush' && o.ai.st !== 'gloat') || (met.has(o) && t > (c.fullUntil || 0) && q[0] > vw - reach && weak(o, t))) return true;
  }
  return false;
}

/**
 * from lurk, with nothing in your hand: meet an old hand in view, or go for one. @returns true when it switched state
 * (c.old = the one it meets; c.o = the one it goes for)
 */
export function look(c, x) {
  const { t, vw, vh } = x;
  if (t <= c.cool) return false;
  let prey = null, best = -1, awake = null;
  const reach = Math.min(OLD.REACH[0], vw * OLD.REACH[1]);
  for (const o of olds()) {
    if (isHeld(o) || !isFree(o) || o.ai.st === 'held' || o.ai.st === 'caught' || o.ai.st === 'pester') continue;
    const q = at(o); if (!inView(q, vw, vh)) continue;
    if (!met.has(o)) {   // it takes a moment to notice, and does not interrupt a hunt or a meal
      if (o.ai.hunting || o.ai.st === 'crush' || o.ai.st === 'gloat') { seen.delete(o); continue; }
      if (!seen.has(o)) seen.set(o, t);
      if (t - seen.get(o) > OLD.NOTICE_MS) { seen.delete(o); c.old = o; set('meet'); return true; }
      continue;
    }
    if (t <= (c.fullUntil || 0) || q[0] <= vw - reach) continue;
    if (weak(o, t)) { if (q[0] > best) { best = q[0]; prey = o; } continue; }
    // awake and on its feet: once in a while it tries anyway (one draw per old hand per ROLL_MS)
    const f = sense().onShelf;
    if (!awake && o.ai.st === 'walk' && o.ai.gait !== 'crawl' && !(f && f(o)) && t >= (rolled.get(o) || 0)) { rolled.set(o, t + OLD.ROLL_MS); if (Math.random() < OLD.AWAKE) awake = o; }
  }
  if (prey) { c.o = prey; set('devour'); return true; }
  if (awake) { c.o = awake; set('prod'); return true; }
  return false;
}

/**
 * not paper: you hold an old hand out in the tease zone like a card (not near the shelf) for PAPER.MS. The arm takes it for
 * one (paper.js). Called from lurk. @returns true when it switched state (c.o = the old hand)
 */
export function mistake(c, x) {
  const g = world.grab, f = sense().nearShelf, PA = OLD.PAPER;
  if (!g || g.o.kind !== 'hand' || !g.moved || g.cx <= x.Z.tease || (f && f([g.cx, g.cy]))) { c.paperAt = null; return false; }
  if (c.paperAt == null) c.paperAt = x.t;
  if (x.t - c.paperAt < PA.MS || x.t <= c.cool) return false;
  c.paperAt = null; c.o = g.o; set('paper');
  return true;
}

/**
 * you have been carrying an old hand around for JEALOUS.MS: the arm leans in, drumming its fingers (the flinch of index.js),
 * and says so. Once per carry, not again for COOL_MS. Called from lurk.
 */
export function jealous(c, t) {
  const g = world.grab, J = TUNE.hand.JEALOUS;
  if (!g || g.o.kind !== 'hand' || !g.moved) { c.carry = null; return; }
  if (c.carry !== g) { c.carry = g; c.carryAt = t; return; }
  if (c.carryAt == null || t - c.carryAt < J.MS || (c.jealousAt != null && t < c.jealousAt + J.COOL_MS)) return;
  c.carryAt = null; c.jealousAt = t; c.mood = 'jealous'; c.flinch = t + J.LEAN_MS; c.react = null;
  speak('jealous', true);
}

/** an old hand poking your still cursor (sense().pester): { hand, poked, n }, or null (none wired: none) */
export const rival = () => { const f = sense().pester; return f ? f() : null; };

export function install(app) {}
