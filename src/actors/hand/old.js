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
//            only looks from lurk).
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { now } from '../../core/clock.js';
import { isFree } from '../../core/claims.js';
import { world, isHeld } from '../../world/world.js';
import { sense, set, notice } from './index.js';

const S = TUNE.physics.S, OLD = TUNE.hand.OLD;
const met = new WeakSet();       // old hands it has looked at
const seen = new WeakMap();      // old hand -> since when it has been in view, not yet met
const thieves = new WeakMap();   // old hand -> until when it is fair game for stealing a card

/** the cut-off hands there are (none wired: none) */
const olds = () => { const f = sense().oldHands; return f ? [...f()].filter((o) => world.bodies.has(o)) : []; };
/** the palm of an old hand, viewport px */
export const at = (o) => { const p = o.body.getWorldCenter(); return [p.x * S - scrollX, p.y * S - scrollY]; };
const inView = (q, vw, vh) => q[0] > OLD.SEE[0] && q[0] < vw - 10 && q[1] > OLD.SEE[1] && q[1] < vh + 10;   // lying on the floor of the page its palm can be at the very bottom

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

/** it cannot get away (see the rules at the top) */
function weak(o, t) {
  const a = o.ai, st = a.st;
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
  let prey = null, best = -1;
  const reach = Math.min(OLD.REACH[0], vw * OLD.REACH[1]);
  for (const o of olds()) {
    if (isHeld(o) || !isFree(o) || o.ai.st === 'held' || o.ai.st === 'caught') continue;
    const q = at(o); if (!inView(q, vw, vh)) continue;
    if (!met.has(o)) {   // it takes a moment to notice, and does not interrupt a hunt or a meal
      if (o.ai.hunting || o.ai.st === 'crush' || o.ai.st === 'gloat') { seen.delete(o); continue; }
      if (!seen.has(o)) seen.set(o, t);
      if (t - seen.get(o) > OLD.NOTICE_MS) { seen.delete(o); c.old = o; set('meet'); return true; }
      continue;
    }
    if (t > (c.fullUntil || 0) && q[0] > vw - reach && weak(o, t) && q[0] > best) { best = q[0]; prey = o; }
  }
  if (prey) { c.o = prey; set('devour'); return true; }
  return false;
}

export function install(app) {}
