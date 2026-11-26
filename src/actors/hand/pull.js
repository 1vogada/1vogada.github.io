// The arm's two-sided pulls over a card: the cheese pull (behaviours/cheese.js, an old hand grabbed the card it carried off)
// and the tug of war (behaviours/wrest.js, it grabbed a card an old hand was crushing). Both keep the same geometry on the
// card's o.tug, pull in surges, draw the card stretched (tug.js tugDraw) and tear it in two past K.TEAR_PX. K is the pull's
// TUNE table (TUNE.hand.CHEESE or TUNE.hand.WREST). No random draws here except those split() and strands() make (tug.js).
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { remove, rectPoly, NO_HIT, pinJoint } from '../../world/world.js';
import { POSES } from './poses.js';
import { clamp01 } from '../../world/math.js';
import { wristFor, aimAt, tugDraw, split, strands } from './tug.js';

const S = TUNE.physics.S;

/** viewport px -> page px */
export const page = (v) => [v[0] + scrollX, v[1] + scrollY];

/** a mouse joint from the arm's grip H (page px) to the card's point at H */
export function grabAt(c, q, H) {
  q.body.setAngularDamping(TUNE.physics.HELD_SPIN); q.body.getFixtureList().setFilterData(NO_HIT); q.el.style.pointerEvents = 'none';
  c.joint = pinJoint(q.body, { x: H[0] / S, y: H[1] / S }, TUNE.hand.JOINT_HZ);
}

/** the tug geometry for card o held by the other side at P and the arm at H (page px), at its own points gp and gh (px from its middle) */
export function pullGeom(P, H, gp, gh, rip) {
  const dx = gh[0] - gp[0], dy = gh[1] - gp[1], dn = Math.hypot(dx, dy) || 1;
  return { P: [...P], P0: [...P], H0: H, gp, gh, dn, d0: Math.max(80, dn), d: dn, phi: Math.atan2(dy, dx), psi: Math.atan2(H[1] - P[1], H[0] - P[0]), s: 1, e: 0, grip: 1, rip };
}

/**
 * one frame of both pulling, in surges (the arm a little more than the other side), t seconds in; wob: the other side's
 * wobble (px) this frame. Moves g.P and sets the arm's target, aim and pose on x. @returns the pain (0..1)
 */
export function surge(x, g, K, t, wob) {
  const u = clamp01(t / K.PULL_S), grow = K.TEAR_PX * K.OVER * u * u * (3 - 2 * u) + K.JERK_PX * Math.max(0, Math.sin(t * K.JERK_W)), ux = Math.cos(g.psi), uy = Math.sin(g.psi);
  const Hg = [g.H0[0] + ux * grow * K.ARM_SHARE - scrollX, g.H0[1] + uy * grow * K.ARM_SHARE + K.SAG_PX * u - scrollY];
  g.P = [Math.max(scrollX + K.EDGE_PX, g.P0[0] - ux * grow * (1 - K.ARM_SHARE)), g.P0[1] - uy * grow * (1 - K.ARM_SHARE) + K.SAG_PX * u + wob];
  const pain = clamp01((g.d - g.d0) / g.rip);
  x.aim = aimAt(Hg, [g.P[0] - scrollX, g.P[1] - scrollY]);
  x.T = wristFor(Hg, x.aim); x.rate = 5; x.pose = pain > 0.5 ? POSES.strain : POSES.clamp; x.wig = 0.1; x.shake = 1.5 + 3 * pain; x.strain = pain;
  return pain;
}

/** after the easing: draw card o stretched between the other side (g.P) and the grip H; emits card.hurt. @returns true once it gives */
export function strained(o, g, H) {
  tugDraw(o, g.P, H);
  bus.emit('card.hurt', { card: o, pain: clamp01((g.d - g.d0) / g.rip) });
  return g.d - g.d0 >= g.rip;
}

/**
 * tear card o in two between g.P and H: the arm takes its half (its) in its grip, the other side's half (mine) falls, strands
 * between them. before(mine, its) runs before the card is removed. @returns { mine, its } or null when it would not split
 */
export function tearOff(c, o, g, H, before) {
  const W = o.w, Hh = o.h, halves = split(o, g.P, H, o.poly || rectPoly(o));
  if (!halves) return null;
  const { mine, its, cut } = halves;
  if (before) before(mine, its);
  o.tug = null; remove(o);
  c.o = its; grabAt(c, its, H);
  strands(mine, its, g, cut, W, Hh);
  return { mine, its };
}
