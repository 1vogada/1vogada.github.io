// hand state "cheese": the cheese pull. It was dragging a card off the shelf (reach -> eat) when an old hand jumped on the other
// end (sev.cheese, src/reactions.js -> cheese() in ../index.js). Both pull; the card stretches between them like hot cheese
// (tugDraw, the card hurts) until it tears in two (TUNE.hand.CHEESE.TEAR_PX past its length): each keeps its half, the arm
// drags its own off to eat (eat), the old hand falls with the other (it crushes it where it lands). If the old hand lets go
// first (you pick it up, it is gone) the arm keeps the card whole and flicks the old hand away.
// The card is c.o (claimed 'hand' / 'target'); the old hand is c.old. The card's o.tug carries { cheese: the old hand, P: where
// the old hand holds it (page px), ...the tug of war's geometry }; the old hand puts itself at P (severed 'cheese').
// Emits 'hand.cheesed' { hand, mine, its } (mine: the old hand's half, or null when it lost) before the line.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, isHeld, toLocal, rectPoly, remove } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak, clamp01 } from '../index.js';
import { gripPt, wristFor, tugDraw, untug, split, strands } from '../tug.js';

const S = TUNE.physics.S, C = TUNE.hand.CHEESE, NONE = { groupIndex: 0, categoryBits: 1, maskBits: 0 };

const page = (v) => [v[0] + scrollX, v[1] + scrollY];
/** a mouse joint from the arm's grip H (page px) to the card's point at H */
function grab(c, q, H) {
  q.body.setAngularDamping(TUNE.physics.HELD_SPIN); q.body.getFixtureList().setFilterData(NONE); q.el.style.pointerEvents = 'none';
  c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: TUNE.physics.MAX_FORCE * q.body.getMass(), frequencyHz: TUNE.hand.JOINT_HZ, dampingRatio: 1 }, world.ground, q.body, { x: H[0] / S, y: H[1] / S }));
}
/** the old hand let go first: the card is the arm's, whole */
function win(c, o, H) {
  const g = o.tug, old = c.old; untug(o, g.P, H); grab(c, o, H);
  c.old = null; set('eat'); bus.emit('hand.cheesed', { hand: old, mine: null, its: o }); speak('cheeseWon', true);
}

export default defineBehaviour('hand', 'cheese', {
  pose: 'strain',
  enter(c, m) {
    const o = c.o, old = c.old, H = page(gripPt()), P = old.ai && old.ai.tip ? old.ai.tip : H;
    if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
    const gp = toLocal(o, P), gh = toLocal(o, H), dx = gh[0] - gp[0], dy = gh[1] - gp[1], dn = Math.hypot(dx, dy) || 1;
    o.tug = { cheese: old, P: [...P], P0: [...P], H0: H, gp, gh, dn, d0: Math.max(80, dn), d: dn, phi: Math.atan2(dy, dx), psi: Math.atan2(H[1] - P[1], H[0] - P[0]), s: 1, e: 0, grip: 1, rip: C.TEAR_PX };
    o.body.getFixtureList().setFilterData(NONE);
    c.hy = H[1] - scrollY; speak('cheese', true);
  },
  tick(c, m, dt) {
    const x = m.x, o = c.o, g = o && o.tug, old = c.old;
    if (!o || !g || !g.cheese) { c.old = null; set('lurk'); return; }
    if (!old || !world.bodies.has(old) || isHeld(old)) { win(c, o, page(gripPt())); return; }   // you took the old hand away
    // both pull, in surges: it a little more than the old one
    const u = clamp01(m.t / C.PULL_S), grow = C.TEAR_PX * C.OVER * u * u * (3 - 2 * u) + C.JERK_PX * Math.max(0, Math.sin(m.t * C.JERK_W)), ux = Math.cos(g.psi), uy = Math.sin(g.psi);
    const Hg = [g.H0[0] + ux * grow * C.ARM_SHARE - scrollX, g.H0[1] + uy * grow * C.ARM_SHARE + C.SAG_PX * u - scrollY];
    g.P = [Math.max(scrollX + C.EDGE_PX, g.P0[0] - ux * grow * (1 - C.ARM_SHARE)), g.P0[1] - uy * grow * (1 - C.ARM_SHARE) + C.SAG_PX * u + 4 * Math.sin(m.t * 23)];
    const pain = clamp01((g.d - g.d0) / g.rip);
    x.aim = Math.atan2(g.P[1] - scrollY - Hg[1], g.P[0] - scrollX - Hg[0]); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI;
    x.T = wristFor(Hg, x.aim); x.rate = 5; x.pose = pain > 0.5 ? POSES.strain : POSES.clamp; x.wig = 0.1; x.shake = 1.5 + 3 * pain; x.strain = pain;
    if (m.t > 1.2 && pain < 0.7) speak('cheese');
  },
  // after the easing: the card is drawn stretched between the old hand (P) and the grip (H); past TEAR_PX it gives
  hold(c, m, x, H) {
    const o = c.o, g = o && o.tug; if (!g || !g.cheese) return false;
    tugDraw(o, g.P, H);
    const pain = clamp01((g.d - g.d0) / g.rip);
    bus.emit('card.hurt', { card: o, pain });
    if (g.d - g.d0 < g.rip && m.t < C.MAX_S) return true;
    const old = c.old, W = o.w, Hh = o.h, halves = split(o, g.P, H, o.poly || rectPoly(o));
    if (!halves) { win(c, o, H); return true; }
    const { mine, its, cut } = halves;
    o.tug = null; remove(o);
    c.o = its; grab(c, its, H);
    strands(mine, its, g, cut, W, Hh);
    c.old = null; set('eat');
    bus.emit('hand.cheesed', { hand: old, mine, its });
    speak('cheeseEnd', true);
    return true;
  },
  leave(c, m) { const o = c.o, g = o && o.tug; if (g && g.cheese && world.bodies.has(o)) { untug(o, g.P, page(gripPt())); o.body.getFixtureList().setFilterData(NONE); } },
});
export function install(app) {}
