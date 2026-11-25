// hand state "wrest": tug of war over a card. An old (cut-off) hand it has met started crushing a card near the right edge
// while it lurked (src/reactions.js, sev.state -> crush -> wrest() in ../index.js; rules in ../old.js wrestable). It eyes it a
// moment, lunges and takes the end of the card nearest the edge (hand.wrest: the old hand stops squeezing and hangs on to the
// other end, severed 'wrest'). Both pull, in surges; the card stretches between them (tugDraw) and screams. Then:
//   you click the arm      its claws slip: the old hand keeps the whole card and crushes it after all; the arm sulks off
//   you click the old hand it slips and flies off; the arm drags the whole card away and eats it (picked up: the same)
//   nobody clicks          the card tears in two (TUNE.hand.WREST.TEAR_PX, or by MAX_S): the arm eats its half, the old hand
//                          crushes the other
// Cut the arm's hand off during the pull and the old hand simply has the card (letGo untugs it).
// c.old is the old hand and c.prey the card while it reaches; from the grab on the card is c.o (claimed 'hand' / 'target').
// The card's o.tug carries { wrest: the old hand, P: where the old hand holds it (page px), ...the tug of war's geometry }.
// Emits 'hand.wrest' { hand, card } at the grab, 'hand.wrested' { hand, card, mine, its } at the end (mine: the old hand's part,
// its: the arm's; the whole card on one side and null on the other when someone slipped).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { clock } from '../../../core/clock.js';
import { say as speechSay, sayAt } from '../../../core/speech.js';
import { world, isHeld, rectPoly, remove } from '../../../world/world.js';
import { shake } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set, speak, clamp01, get, brain } from '../index.js';
import { gripPt, wristFor, tugDraw, untug, split, strands } from '../tug.js';

const S = TUNE.physics.S, W = TUNE.hand.WREST, NONE = { groupIndex: 0, categoryBits: 1, maskBits: 0 };

const page = (v) => [v[0] + scrollX, v[1] + scrollY];
/** page px of the card's own point L (px from its middle) */
const world_ = (q, L) => { const p = q.body.getWorldPoint({ x: L[0] / S, y: L[1] / S }); return [p.x * S, p.y * S]; };

/**
 * where each takes hold of card q (px from its middle): the arm (gh) the end that points most towards the right edge, the old
 * hand (gp) the other end, both END_PX in
 */
function ends(q) {
  const a = q.body.getAngle(), ca = Math.cos(a), sa = Math.sin(a);
  // of the card's four directions, the one that points most to the right on the page
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], u = dirs.reduce((b, d) => (d[0] * ca - d[1] * sa > b[0] * ca - b[1] * sa ? d : b)), v = [-u[1], u[0]];
  const poly = (q.poly || rectPoly(q)).map(([x, y]) => [x - q.w / 2, y - q.h / 2]), pr = poly.map((p) => p[0] * u[0] + p[1] * u[1]);
  const lo = Math.min(...pr), hi = Math.max(...pr), side = poly.reduce((s, p) => s + p[0] * v[0] + p[1] * v[1], 0) / poly.length;
  const at = (f) => [u[0] * f + v[0] * side, u[1] * f + v[1] * side];
  return { gh: at(hi - W.END_PX), gp: at(lo + W.END_PX) };
}
/** a mouse joint from the arm's grip H (page px) to the card's point at H */
function grab(c, q, H) {
  q.body.setAngularDamping(TUNE.physics.HELD_SPIN); q.body.getFixtureList().setFilterData(NONE); q.el.style.pointerEvents = 'none';
  c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: TUNE.physics.MAX_FORCE * q.body.getMass(), frequencyHz: TUNE.hand.JOINT_HZ, dampingRatio: 1 }, world.ground, q.body, { x: H[0] / S, y: H[1] / S }));
}
function done(c) { c.old = null; c.prey = null; c.slip = false; }
/** the old hand let go (you clicked it, or picked it up): the card is the arm's, whole */
function win(c, o, H) {
  const old = c.old; untug(o, o.tug.P, H); grab(c, o, H);
  done(c); set('eat'); bus.emit('hand.wrested', { hand: old, card: o, mine: null, its: o }); speak('wrestWon', true);
}
/** you clicked the arm: its claws slip, and the old hand has the whole card */
function lose(c, o, t) {
  const old = c.old; untug(o, o.tug.P, page(gripPt())); c.o = null;
  done(c); c.cool = t + W.COOL; set('sulk'); bus.emit('hand.wrested', { hand: old, card: o, mine: o, its: null }); speak('wrestSlip', true);
}
/** the old hand is still at its crush of card q, and nobody else has hold of either */
const crushing = (old, q) => old && world.bodies.has(old) && !isHeld(old) && old.ai.st === 'crush' && old.ai.prey === q && q && world.bodies.has(q) && !q.tug && !isHeld(q);

export default defineBehaviour('hand', 'wrest', {
  pose: 'eager',
  enter(c, m) { c.slip = false; },
  tick(c, m, dt) {
    const x = m.x, o = c.o, old = c.old;
    if (!o) {   // it eyes the crush a moment, then reaches for the free end of the card
      const q = c.prey;
      if (!crushing(old, q)) { done(c); set('lurk'); return; }   // too late, or you got there first
      const { gh, gp } = ends(q), Hp = world_(q, gh), Hc = [Hp[0] - scrollX, Hp[1] - scrollY];
      if (m.t < W.WAIT_S) { x.T = [x.vw - 10, Hc[1]]; x.rate = 6; x.pose = POSES.eager; x.wig = 0.3; return; }
      const g = gripPt(); x.pose = POSES.lunge; x.rate = W.RATE; x.wig = 0.1;
      x.aim = Math.atan2(Hc[1] - c.y, Hc[0] - c.x); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI; x.T = wristFor(Hc, x.aim);
      if (Math.hypot(g[0] - Hc[0], g[1] - Hc[1]) < W.GRAB_PX) {   // got it: the old hand stops squeezing and hangs on to its end
        bus.emit('hand.wrest', { hand: old, card: q });
        if (old.ai.st !== 'wrest' || !world.bodies.has(q)) { done(c); set('lurk'); return; }
        const P = world_(q, gp), H = page(g), lx = gh[0] - gp[0], ly = gh[1] - gp[1], dn = Math.hypot(lx, ly) || 1;
        c.o = q; c.prey = null;
        q.tug = { wrest: old, P: [...P], P0: [...P], H0: H, gp, gh, dn, d0: Math.max(80, dn), d: dn, phi: Math.atan2(ly, lx), psi: Math.atan2(H[1] - P[1], H[0] - P[0]), s: 1, e: 0, grip: 1, rip: W.TEAR_PX };
        q.body.getFixtureList().setFilterData(NONE); q.el.style.pointerEvents = 'none';
        c.hy = Hc[1]; c.pullAt = m.t;
        speak('wrest', true); speechSay(q, 'card.wrest', { force: true });
      } else if (m.t > W.WAIT_S + W.REACH_S) { done(c); set('lurk'); }
      return;
    }
    const g = o.tug;
    if (!g || !g.wrest) { done(c); set('lurk'); return; }
    if (!old || !world.bodies.has(old) || old.ai.st !== 'wrest') { win(c, o, page(gripPt())); return; }   // it slipped, or you took it
    if (c.slip) { lose(c, o, x.t); return; }
    // both pull, in surges: the arm a little more than the old one
    const t = m.t - c.pullAt, u = clamp01(t / W.PULL_S), grow = W.TEAR_PX * W.OVER * u * u * (3 - 2 * u) + W.JERK_PX * Math.max(0, Math.sin(t * W.JERK_W)), ux = Math.cos(g.psi), uy = Math.sin(g.psi);
    const Hg = [g.H0[0] + ux * grow * W.ARM_SHARE - scrollX, g.H0[1] + uy * grow * W.ARM_SHARE + W.SAG_PX * u - scrollY];
    g.P = [Math.max(scrollX + W.EDGE_PX, g.P0[0] - ux * grow * (1 - W.ARM_SHARE)), g.P0[1] - uy * grow * (1 - W.ARM_SHARE) + W.SAG_PX * u + 3 * Math.sin(t * 21)];
    const pain = clamp01((g.d - g.d0) / g.rip);
    x.aim = Math.atan2(g.P[1] - scrollY - Hg[1], g.P[0] - scrollX - Hg[0]); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI;
    x.T = wristFor(Hg, x.aim); x.rate = 5; x.pose = pain > 0.5 ? POSES.strain : POSES.clamp; x.wig = 0.1; x.shake = 1.5 + 3 * pain; x.strain = pain;
    if (t > 1.2 && pain < 0.75) speak('wrest');
  },
  // after the easing: the card is drawn stretched between the old hand (P) and the grip (H); past TEAR_PX it gives
  hold(c, m, x, H) {
    const o = c.o, g = o && o.tug; if (!g || !g.wrest) return false;
    tugDraw(o, g.P, H);
    const pain = clamp01((g.d - g.d0) / g.rip);
    bus.emit('card.hurt', { card: o, pain });
    if (g.d - g.d0 < g.rip && m.t - c.pullAt < W.MAX_S) return true;
    const old = c.old, Wd = o.w, Hh = o.h, P = g.P, halves = split(o, P, H, o.poly || rectPoly(o));
    if (!halves) { win(c, o, H); return true; }
    const { mine, its, cut } = halves;
    mine.wrested = its.wrested = true;
    o.tug = null; remove(o);
    c.o = its; grab(c, its, H);
    strands(mine, its, g, cut, Wd, Hh);
    sayAt((P[0] + H[0]) / 2, (P[1] + H[1]) / 2 - 110, 'card.slice', { scream: true });
    shake();
    done(c); set('eat');
    bus.emit('hand.wrested', { hand: old, card: o, mine, its });
    speak('wrestEnd', true);
    return true;
  },
  // any other way out (its hand cut off: letGo has untugged it already): the old hand is left holding the card
  leave(c, m) {
    const o = c.o, g = o && o.tug;
    if (g && g.wrest && world.bodies.has(o)) { untug(o, g.P, page(gripPt())); c.o = null; }
    c.prey = null; c.slip = false;
  },
});

/** how far viewport point q is from the segment u-v */
const near = (q, u, v) => { const ex = v[0] - u[0], ey = v[1] - u[1], f = clamp01(((q[0] - u[0]) * ex + (q[1] - u[1]) * ey) / (ex * ex + ey * ey || 1)); return Math.hypot(q[0] - u[0] - ex * f, q[1] - u[1] - ey * f); };

export function install(app) {
  if (app && app.reduced) return;
  // a click on the arm (its hand or forearm) while it pulls: its claws slip. Captured before the cards and bodies hear it
  document.addEventListener('pointerdown', (e) => {
    const mm = brain(); if (!mm || !mm.is('wrest') || e.button > 0) return;
    const c = get(), g = c.o && c.o.tug; if (!g || !g.wrest) return;
    const q = [e.clientX, e.clientY], segs = [[[c.x, c.y], gripPt()]]; if (c.arm2) segs.push([c.arm2[1], c.arm2[2]], [c.arm2[0], c.arm2[1]]);
    if (!segs.some(([u, v]) => near(q, u, v) < W.HIT_PX)) return;
    c.slip = true; e.preventDefault(); e.stopPropagation(); clock.wake();
  }, true);
}
