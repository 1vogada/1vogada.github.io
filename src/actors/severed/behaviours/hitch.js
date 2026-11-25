// cut-off hand behaviour "hitch": the hitchhiker. You picked up a card (or a piece of one) near it and it decided to come along
// (TUNE.severed.HITCH.CHANCE, rolled in ../index.js hitchhike()), or it pounced on a card the arm was dragging off the shelf
// (o.ai.cheese: the cheese pull, ../index.js pounce()). It jumps on, grips the card's edge and dangles under it on a revolute
// joint while you carry it about, chatting. Swing it too hard and its grip gives out: it flies off (whee). Put the card down
// and it gets off once the card lies still; if the card is its own half from a cheese pull (o.ai.mine) it crushes it there.
// o.ai: ride (the card), cheese, mine, from (where the jump started), at (the card's local point it holds, m), joint, grip
// (1 .. 0, lets go at 0), pv / acc (the card's last velocity and how hard it is being jerked), still (s the card has lain still).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { isFree } from '../../../core/claims.js';
import { world, isHeld, worldPoly } from '../../../world/world.js';
import { clamp01, wrapA } from '../gait.js';
import { set, say } from '../index.js';

const S = TUNE.physics.S, HI = TUNE.severed.HITCH, NONE = { groupIndex: 0, categoryBits: 1, maskBits: 0 }, ALL = { groupIndex: 0, categoryBits: 1, maskBits: 0xFFFF };

/** where on the card it takes hold (page px): a corner (the lowest one; for a cheese pull the one furthest from the arm), a little way in */
function holdAt(q, away) {
  const pts = worldPoly(q), cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let best = pts[0], bv = -Infinity;
  for (const p of pts) { const v = away ? Math.hypot(p[0] - away[0], p[1] - away[1]) : p[1]; if (v > bv) { bv = v; best = p; } }
  return [best[0] + (cx - best[0]) * HI.IN, best[1] + (cy - best[1]) * HI.IN];
}
/** the middle of its body for its fingertips to be at page point A with the hand turned to angle th (m) */
const bodyFor = (A, th) => ({ x: (A[0] - HI.TIP_PX * Math.cos(th)) / S, y: (A[1] - HI.TIP_PX * Math.sin(th)) / S });

/** it has hold: the joint between its fingertips and the card */
export function latch(o) {
  const a = o.ai, q = a.ride, A = q.body.getWorldPoint(a.at);
  o.body.getFixtureList().setFilterData(ALL); o.body.setGravityScale(isHeld(q) ? 1 : TUNE.physics.FALL); o.body.setAngularDamping(0.4); o.body.setAwake(true);
  a.joint = world.b2.createJoint(new world.pl.RevoluteJoint({ collideConnected: false }, o.body, q.body, A));
  a.grip = 1; a.acc = 0; a.pv = null; a.still = 0; a.chat = 0; a.clung = false;
}
/** let go of the card (the joint goes; it keeps its own speed) */
export function unlatch(o) {
  const a = o.ai;
  if (a.joint) { if (world.bodies.has(o) && a.ride && world.bodies.has(a.ride)) world.b2.destroyJoint(a.joint); a.joint = null; }
  if (world.bodies.has(o)) { o.body.getFixtureList().setFilterData(ALL); o.body.setGravityScale(isHeld(o) ? 1 : TUNE.physics.FALL); o.body.setAngularDamping(TUNE.severed.BODY.damping); }
}
/** its grip gave out: off it flies */
function fling(o) {
  const b = o.body, v = b.getLinearVelocity();
  unlatch(o);
  b.setLinearVelocity({ x: v.x * HI.FLING, y: v.y * HI.FLING - HI.LIFT }); b.setAngularVelocity((Math.random() - 0.5) * 2 * HI.SPIN);
  bus.emit('sev.flung', { hand: o, card: o.ai.ride });
  set(o, 'whee');
}

export default defineBehaviour('sev', 'hitch', {
  pose: 'grip',
  enter(o, m) {
    const a = o.ai, q = a.ride, p = o.body.getPosition();
    a.vx = 0; a.joint = null;
    if (a.mine || a.hold) { a.hold = false; a.at = q.body.getLocalPoint(o.body.getWorldPoint({ x: HI.TIP_PX / S, y: 0 })); latch(o); return; }   // it already has hold (its half of a cheese pull, or the arm let go of the other end)
    const A = holdAt(q, a.away); a.at = q.body.getLocalPoint({ x: A[0] / S, y: A[1] / S });
    a.from = { x: p.x, y: p.y, a: o.body.getAngle() };
    o.body.getFixtureList().setFilterData(NONE); o.body.setGravityScale(0);   // in the air it passes through everything
    say(o, a.cheese ? 'pounce' : 'latch', true);
  },
  tick(o, m, dt) {
    const a = o.ai, q = a.ride, b = o.body;
    if (!q || !world.bodies.has(q) || q.sq || q.die) { if (a.joint || m.t > HI.LEAP_S) fling(o); else set(o, 'limp'); return; }   // the card is gone (eaten, smashed, crumbling) from under it
    if (!a.joint) {   // the jump: an arc onto the card, turning fingers up (or, for a cheese pull, fingers towards the card)
      const A = q.body.getWorldPoint(a.at), th = a.cheese ? Math.PI + Math.atan2(a.from.y - A.y, a.from.x - A.x) : -Math.PI / 2, T = bodyFor([A.x * S, A.y * S], th);
      const k = clamp01(m.t / HI.LEAP_S), e = k * k * (3 - 2 * k), up = Math.sin(Math.PI * k) * HI.ARC_PX / S;
      b.setTransform({ x: a.from.x + (T.x - a.from.x) * e, y: a.from.y + (T.y - a.from.y) * e - up }, a.from.a + wrapA(th - a.from.a) * e); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
      a.wig = 0.5;
      if (k >= 1) {
        if (a.cheese) { a.cheese = false; a.tip = [A.x * S, A.y * S]; bus.emit('sev.cheese', { hand: o, card: q }); if (q.tug && q.tug.cheese === o) { set(o, 'cheese'); return; } }   // the arm takes up the fight (reactions -> the arm's 'cheese')
        latch(o); bus.emit('sev.hitched', { hand: o, card: q }); if (isHeld(q)) say(o, 'ride', true);
      }
      return;
    }
    if (q.tug || (!isFree(q) && !a.mine)) { fling(o); return; }   // the arm has taken it: it is shaken off
    if (a.boast && m.t > 0.2) a.boast = !say(o, 'cheeseEnd', true) && m.t < 1.5;   // its half of a cheese pull: it crows about it (as soon as its last line allows)
    // hanging on: how hard is the card being swung about?
    const v = q.body.getLinearVelocity(), held = isHeld(q);
    if (a.pv && dt > 0) { const acc = Math.hypot(v.x - a.pv.x, v.y - a.pv.y) / dt; a.acc += (acc - a.acc) * (1 - Math.exp(-dt * 12)); }
    a.pv = { x: v.x, y: v.y };
    const sp = b.getLinearVelocity().length(), over = Math.max((sp - HI.SPEED) / HI.SPEED, (a.acc - HI.ACC) / HI.ACC);
    b.setGravityScale(held ? 1 : TUNE.physics.FALL);
    if (over > 0) {
      a.grip -= dt * HI.DRAIN * (1 + over); a.wig = 0.6;
      if (!a.clung) { a.clung = true; say(o, 'cling', true); } else say(o, 'cling');
      if (a.grip <= 0) { fling(o); return; }
    } else {
      a.grip = Math.min(1, a.grip + dt * HI.REGAIN); a.wig = 0.08 + 0.3 * (1 - a.grip);
      if (held && a.grip > 0.8 && m.t * 1000 > a.chat) { a.chat = m.t * 1000 + HI.RIDE_SAY_MS; say(o, a.grip > 0.95 ? 'ride' : 'cling'); }
    }
    // put down: once the card lies still it gets off (or, if the card is its own, crushes it)
    a.still = !held && v.length() < HI.REST_V && sp < HI.REST_V ? a.still + dt : 0;
    if (a.still > HI.REST_S) {
      unlatch(o);
      if (a.mine) { a.mine = false; a.prey = q; set(o, 'crush'); return; }
      say(o, 'alight', true); set(o, 'limp');
    }
  },
  leave(o, m) { unlatch(o); o.ai.wig = 0; },
});
export function install(app) {}
