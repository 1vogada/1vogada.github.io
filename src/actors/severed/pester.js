// "The old hand pokes you instead" (chain idle-old): with an old hand on the page, leave the mouse still (TUNE.severed.PESTER.
// STILL_MS, a little before the arm's own "are you still there?" at TUNE.hand.IDLE.MS) and the nearest old hand that is up to it
// walks over to your cursor and jumps up to poke it with one finger (behaviours/pester.js). When the arm comes out to do the
// same (its 'mine', src/actors/hand/behaviours/mine.js) it finds the job taken: "hey. that's MY job". Then they take turns,
// each poke a little sooner than the last (PESTER.RALLY), until you move the mouse.
//
// This file picks the hand and keeps who is pestering; the turns go through the bus: the old hand's poke emits 'sev.pestered'
// { hand, n } (reactions -> hand.pesterTurn), the arm's 'hand.pestered' { hand, n } (reactions -> pesterTurn() here). n counts
// the pokes so far: the rally's pace. Off while window.__test.idle === false (every scenario but its own), like the gift and
// the tower; never in crazy mode, never while the tower is up or could be (three old hands that have all met the new hand have that on their minds).
import { TUNE } from '../../core/tune.js';
import { clock } from '../../core/clock.js';
import { isFree } from '../../core/claims.js';
import { flags } from '../../core/debug.js';
import { world, isHeld, isCrazy } from '../../world/world.js';
import { list, brain, set, pointer, moved, onRefuge, wrist } from './index.js';
import { tower } from './tower.js';

const S = TUNE.physics.S, SV = TUNE.severed, PE = SV.PESTER;

let P = null;        // { o, from: the pointer's last move it is pestering for, poked, n }
let spent = null;    // the pointer's last move an old hand already went for (once per stillness)

/** the rally's pace after n pokes: how long until the next one (ms) */
export const gap = (n) => Math.max(PE.RALLY.MIN_MS, PE.RALLY.GAP_MS * Math.pow(PE.RALLY.DECAY, n));

/** the old hand pestering your cursor: { hand, poked (it has poked it at least once), n (pokes so far) }, or null */
export function pestering() {
  if (P && (!list.has(P.o) || !world.bodies.has(P.o) || !brain(P.o) || !brain(P.o).is('pester'))) P = null;
  return P && { hand: P.o, poked: P.poked, n: P.n };
}
/** it poked the cursor (behaviours/pester.js): the n-th poke of the rally */
export function poked(o, n) { if (P && P.o === o) { P.poked = true; P.n = n; } }
/** the stillness it went for, or null */
export const pesterFrom = (o) => (P && P.o === o ? P.from : null);

/** up for it: awake on its feet (walking, not hurt, hunting, fleeing or crawling) or asleep (rest), free, in view */
function ready(o, t) {
  const a = o.ai, m = brain(o);
  if (!world.bodies.has(o) || !m || !m.is('walk', 'rest') || a.hunting || a.gait === 'crawl' || t < a.hurt || t < a.flee || isHeld(o) || !isFree(o) || onRefuge(o)) return false;
  const p = o.body.getPosition(), vx = p.x * S - scrollX, vy = p.y * S - scrollY;
  return vx > 0 && vx < document.documentElement.clientWidth && vy > 0 && vy < innerHeight + SV.BODY.h;
}

/** once a frame, before the hands think (from tick() in ./index.js): your mouse has gone still: the nearest one goes */
export function pesterTick() {
  if (pestering()) return;
  const at = pointer(), mv = moved(), t = clock.now();
  if (!at || mv == null || mv === spent || !flags().idle || isCrazy() || t - mv < PE.STILL_MS) return;
  if (tower() || (list.size === SV.MAX && [...list].every((o) => o.ai.met))) return;   // three that have met the new hand: the hand tower comes first
  const w = wrist(); if (w && w.is('poke')) return;            // the arm beat it to it this time
  let best = null, bd = Infinity;
  for (const o of list) { if (!ready(o, t)) continue; const d = Math.abs(o.body.getPosition().x * S - scrollX - at[0]); if (d < bd) { bd = d; best = o; } }
  if (!best) return;
  spent = mv; P = { o: best, from: mv, poked: false, n: 0 };
  set(best, 'pester');
}

/** the arm poked the cursor too (reactions: hand.pestered): the old hand's turn, a little sooner each time */
export function pesterTurn(o, n) {
  const m = brain(o); if (!P || P.o !== o || !m || !m.is('pester')) return;
  P.n = n; const pe = o.ai.pe; if (!pe) return;
  pe.n = n; pe.turn = true; pe.next = m.t + gap(n) / 1000;
  clock.wake();
}

export function install(app) {}
