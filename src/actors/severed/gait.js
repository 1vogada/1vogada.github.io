// How a cut-off hand walks (legacy GAIT, TURN, NEXT, sevGround, sevFeet, sevStep, the turning code in sevTick). Moved verbatim
// from scripts/legacy.js: objs -> world.bodies, world -> world.b2, grab -> world.grab, the numbers of the leg spring from
// TUNE.severed.LEG (same values), every other literal is a formula literal and moved with its function.
// step(o) runs in the 'forces' step phase (legacy: inside step()'s loop over objs, before the root springs; the springs of
// world/loop.js are registered first, forces add and neither draws a random number, so the split keeps legacy results).
//
// How it walks. Feet are planted on the ground and stay where they are while the body travels over them; a foot that has fallen
// too far behind its place under the body swings forward in an arc to a spot ahead of it, and never while the foot next to it is
// in the air. The body is held at hh above the ground and leans. flat: palm down, fingers forward, every finger and the thumb a
// leg (the classic crawling hand); otherwise upright on the first two fingers. home: where each foot belongs, px ahead of the
// body's middle (4 is the thumb).

import { TUNE } from '../../core/tune.js';
import { clock } from '../../core/clock.js';
import { world } from '../../world/world.js';

const S = TUNE.physics.S, P = TUNE.physics, LEG = TUNE.severed.LEG;

export const GAIT = TUNE.severed.GAIT, TURN = TUNE.severed.TURN, NEXT = TUNE.severed.NEXT;
/** legacy clamp01 / wrapA (the same one-liners the arm uses) */
export const clamp01 = (v) => Math.max(0, Math.min(1, v)), wrapA = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

/** the ground under a page point, looking from a little above it down (legacy sevGround(x, y)). @returns page y or null */
export function ground(x, y) {
  let best = null; const p1 = { x: x / S, y: y / S - 0.5 }, p2 = { x: x / S, y: y / S + 2.6 };
  world.b2.rayCast(p1, p2, (f, pt, n, frac) => { const u = f.getBody().getUserData(); if ((u && u.kind === 'hand') || f.isSensor() || !(f.getFilterMaskBits() & 1)) return -1; best = pt.y * S; return frac; });
  return best;
}

/** plant and swing the feet (legacy sevFeet(o, a, dt)) */
export function feet(o, a, dt) {
  const g = GAIT[a.gait], b = o.body, p = b.getPosition(), bx = p.x * S, by = p.y * S, v = b.getLinearVelocity(), floor = by + a.hh * S;
  if (!a.feet || a.feetGait !== a.gait) {   // a new way of walking: the feet it needs are set down where they belong, the others are lifted off
    const old = a.feet || {}; a.feet = {}; a.feetGait = a.gait;
    for (const k in g.home) { const hx = bx + a.fd * g.home[k]; a.feet[k] = old[k] || { x: hx, y: ground(hx, by) ?? floor, sw: 0 }; }
  }
  let air = 0; for (const k in a.feet) if (a.feet[k].sw) air++;
  for (const k in a.feet) {
    const f = a.feet[k], hx = bx + a.fd * g.home[k];
    if (f.sw) {   // in the air: an arc from where it was to where it is going
      f.u = Math.min(1, f.u + dt / g.swing); const e = f.u * f.u * (3 - 2 * f.u);
      f.x = f.x0 + (f.x1 - f.x0) * e; f.y = f.y0 + (f.y1 - f.y0) * e - g.lift * Math.sin(Math.PI * f.u);
      if (f.u >= 1) { f.sw = 0; f.x = f.x1; f.y = f.y1; }
      continue;
    }
    const e = (f.x - hx) * a.fd, far = Math.hypot(f.x - bx, f.y - by) > 190;   // how far ahead of its place it is; negative is behind
    if (far) { f.x = hx; f.y = ground(hx, by) ?? floor; continue; }   // the body was thrown or fell: the foot is simply back under it
    if ((e < -g.step / 2 || e > g.step * 0.8) && !NEXT[k].some((n) => a.feet[n] && a.feet[n].sw) && air < 2) {
      const lead = Math.min(g.step * 0.75, g.step / 2 + Math.abs(v.x) * S * g.swing * 0.9), x1 = hx + (Math.abs(v.x) > 0.2 ? a.fd * lead : 0);
      f.sw = 1; f.u = 0; f.x0 = f.x; f.y0 = f.y; f.x1 = x1; f.y1 = ground(x1, by) ?? floor; air++;
    }
  }
  a.air = air;
  const out = [null, null, null, null, null]; for (const k in a.feet) out[k] = [a.feet[k].x - scrollX, a.feet[k].y - 22 - scrollY];   // the joint above the pointed tip
  o.hand.feet = out;
}

// inside the physics step: a walking hand is held up by its legs (a spring to the ground under it), turned to the angle its gait wants, and pushed along
/** leg spring, upright torque, walking force (legacy sevStep(o)) */
export function step(o) {
  const a = o.ai; if (!a.up || (world.grab && world.grab.o === o)) return;
  const g = GAIT[a.gait], b = o.body, p = b.getPosition(), v = b.getLinearVelocity(), m = b.getMass(), L = a.hh + 0.5; let fr = 1;
  world.b2.rayCast(p, { x: p.x, y: p.y + L }, (f, pt, n, frac) => { if (f.getBody() === b || f.isSensor() || !(f.getFilterMaskBits() & 1)) return -1; fr = frac; return frac; });
  const h = fr * L, on = fr < 1 && h < a.hh + 0.14; let fx = 0, fy = 0;
  if (!g.drag && fr < 1 && h < a.hh + 0.3) fy = -m * Math.max(0, Math.min(LEG.cap, P.GRAVITY * P.FALL + LEG.force * (a.hh - h) + LEG.damp * v.y));
  if (on) fx = m * (a.vx - v.x) * (g.drag ? LEG.drag : LEG.walk);
  b.applyForceToCenter({ x: fx, y: fy }, true);
  const want = g.flat ? (a.fd > 0 ? 0 : Math.PI) - a.fd * g.lean : Math.PI / 2 + a.fd * g.lean * Math.min(1, Math.abs(v.x) + 0.4);
  b.applyTorque(b.getInertia() * (LEG.torque * wrapA(want - b.getAngle()) - LEG.torqueDamp * b.getAngularVelocity()), true);
}

/**
 * turning on the spot and the feet (legacy sevTick's `if (a.up) { ... } else { ... }` block). b, p, ang: the body, its
 * position and angle as sevTick read them after the behaviour's tick.
 */
export function turn(o, dt, b, p, ang) {
  const a = o.ai, h = o.hand;
  if (a.up) {   // the palm faces back, the knuckles lead; height follows the gait, with a dip each time a foot is in the air
    // Turning round: it slows to a stop, turns on the spot (seen from the side that is the whole hand narrowing to edge-on and opening out again
    // the other way round), ducking a little, and sets off again. At the edge-on moment body and feet are swapped left for right
    if (a.face !== a.dir) {
      const was = a.face; a.face = a.dir > a.face ? Math.min(a.dir, a.face + dt / TURN * 2) : Math.max(a.dir, a.face - dt / TURN * 2);
      if (was * a.face <= 0 && a.fd !== a.dir) {
        a.fd = a.dir; b.setTransform(p, Math.PI - ang); b.setAngularVelocity(-b.getAngularVelocity()); o.pa = Math.PI - ang;
        if (a.feet) for (const k in a.feet) { const f = a.feet[k]; f.x = 2 * p.x * S - f.x; if (f.sw) { f.x0 = 2 * p.x * S - f.x0; f.x1 = 2 * p.x * S - f.x1; } }
      }
    }
    const open = Math.abs(a.face), g = GAIT[a.gait]; a.vx = a.fd === a.dir ? a.vx * open * open : 0;
    h.m = -a.fd; h.sx = Math.max(0.07, Math.sin(open * Math.PI / 2)); h.cx = p.x * S - scrollX;
    a.hh += (g.hh * (1 - 0.1 * (1 - open)) - (a.air ? g.bob : 0) - (a.hop || 0) - a.hh) * (1 - Math.exp(-dt * 9));
    feet(o, a, dt);
  } else { h.feet = null; a.feet = null; h.sx = 1; a.face = a.fd = a.dir; }
}

/**
 * walk towards d (-1 left, 1 right): turns round on the spot first if it faces the other way. Its feet may point the other
 * way while it already faces d (walk flips fd at the edges on its own): then they simply follow
 */
export function head(a, d) { a.dir = d; if (a.face === d) a.fd = d; }

function stepAll() { for (const o of world.bodies) if (o.kind === 'hand') step(o); }

export function install(app) {
  if (app && app.reduced) return;
  clock.onStep(stepAll, 'forces');
}
