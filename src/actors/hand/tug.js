// The tug of war and the crush (legacy clawPre, clawTug, tugDraw, clawUntug, clawSlip, clawRip, crushStart, crushQ, crushPause,
// gripPt, wristFor). Moved verbatim from scripts/legacy.js: legacy claw is get(), clawSet is set(), clawSay(kind, force) is
// speak(kind, force), now() is clock.now(), grab is world.grab, world.destroyJoint is world.b2.destroyJoint.
// Random draws (in legacy order): clawRip draws the teeth, the pieces' die times, the strands and the gore; crushStart draws
// the crumple phase, the points and the spin.

import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { now } from '../../core/clock.js';
import { line } from '../../core/lines.js';
import { world, remove, hold, fragment, rectPoly, HIT_ALL, NO_HIT, pinJoint } from '../../world/world.js';
import { polyArea, validPoly } from '../../world/cut.js';
import { gore, shake } from '../../world/fx.js';
import { rim, keepClip, ownClip, stretchLook } from '../../world/stretch.js';
export { ownClip };
import { GRIP } from './poses.js';
import { get, set, speak, clamp01 } from './index.js';

const S = TUNE.physics.S, HELD_SPIN = TUNE.physics.HELD_SPIN, H_ = TUNE.hand;
const html = () => document.documentElement;

// ---- pieces of cards: the same tug of war, rip and crush as a whole card, on the piece's own outline ----
/** o's outline in its own px (0..w, 0..h): the piece's polygon, or the card's rectangle */
const outline = (o) => o.poly || rectPoly(o);
/** the middle of o's outline, px from the body's origin (the card's centre): [0, 0] for a whole card */
export function middle(o) {
  if (!o.poly) return [0, 0];
  let a = 0, cx = 0, cy = 0; const p = o.poly;
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length], f = p[i][0] * q[1] - q[0] * p[i][1]; a += f; cx += (p[i][0] + q[0]) * f; cy += (p[i][1] + q[1]) * f; }
  return a ? [cx / (3 * a) - o.w / 2, cy / (3 * a) - o.h / 2] : [0, 0];
}
// how far it is from (x, y) (px from the origin, inside the piece) along (ux, uy) to the piece's edge
function reachOf(o, x, y, ux, uy) {
  const p = o.poly, X = x + o.w / 2, Y = y + o.h / 2; let best = 1e9;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], ex = b[0] - a[0], ey = b[1] - a[1], den = ux * ey - uy * ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - X) * ey - (a[1] - Y) * ex) / den, s = ((a[0] - X) * uy - (a[1] - Y) * ux) / den;
    if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6) best = Math.min(best, t);
  }
  return best === 1e9 ? 0 : best;
}
/** the claw's grip point, viewport px (legacy gripPt) */
export const gripPt = () => { const c = get(), ca = Math.cos(c.a), sa = Math.sin(c.a); return [c.x + GRIP[0] * ca + GRIP[1] * sa, c.y + GRIP[0] * sa - GRIP[1] * ca]; };
/** where the wrist goes for the grip to be at H with the hand turned to a (legacy wristFor) */
export const wristFor = (H, a) => { const ca = Math.cos(a), sa = Math.sin(a); return [H[0] - GRIP[0] * ca - GRIP[1] * sa, H[1] - GRIP[0] * sa + GRIP[1] * ca]; };

// where the claw takes the card: on the far side of it from the pointer, seen from the hand
/** legacy clawPre(o, keep) */
export function pre(o, keep) {
  const claw = get(), grab = world.grab;
  const b = o.body, q = b.getLocalPoint(grab.joint.getAnchorB()), gp = [q.x * S, q.y * S];
  let gh = keep;
  if (!gh && o.poly) {   // a piece: the far end of what is left of it, through its own middle
    const cen = middle(o), far = Math.hypot(gp[0] - cen[0], gp[1] - cen[1]) > 30, w = far ? { x: cen[0] - gp[0], y: cen[1] - gp[1] } : b.getLocalVector({ x: claw.x - grab.cx, y: claw.y - grab.cy }), wl = Math.hypot(w.x, w.y) || 1, ux = w.x / wl, uy = w.y / wl;
    let d = reachOf(o, gp[0], gp[1], ux, uy) - 18; const room = Math.max(90, 0.45 * (html().clientWidth - 110));
    if (d < 50) { d = Math.max(8, reachOf(o, cen[0], cen[1], ux, uy) - 18); gh = [cen[0] + ux * d, cen[1] + uy * d]; } else { d = Math.min(d, room); gh = [gp[0] + ux * d, gp[1] + uy * d]; }
  }
  if (!gh) {
    // the end of the card opposite the one you hold; held by the middle, the side nearest the hand
    const far = Math.hypot(gp[0], gp[1]) > 45, w = far ? { x: -gp[0], y: -gp[1] } : b.getLocalVector({ x: claw.x - grab.cx, y: claw.y - grab.cy }), wl = Math.hypot(w.x, w.y) || 1, ux = w.x / wl, uy = w.y / wl;
    const ray = (x, y) => Math.min(ux > 1e-6 ? (o.w / 2 - x) / ux : ux < -1e-6 ? (-o.w / 2 - x) / ux : 1e9, uy > 1e-6 ? (o.h / 2 - y) / uy : uy < -1e-6 ? (-o.h / 2 - y) / uy : 1e9);
    let d = ray(gp[0], gp[1]) - 24; const room = Math.max(90, 0.45 * (html().clientWidth - 110));   // on a narrow screen it takes the card nearer your hand, so there is room left to pull
    if (d < 100) { d = ray(0, 0) - 24; gh = [ux * d, uy * d]; } else { d = Math.min(d, room); gh = [gp[0] + ux * d, gp[1] + uy * d]; }
  }
  const dx = gh[0] - gp[0], dy = gh[1] - gp[1], dn = Math.hypot(dx, dy) || 1;
  return { gp, gh, dn, d0: Math.max(o.poly ? 45 : 80, dn), phi: Math.atan2(dy, dx), ghm: { x: gh[0] / S, y: gh[1] / S }, gpm: { x: gp[0] / S, y: gp[1] / S } };
}
/** it takes hold: the tug of war starts (legacy clawTug(o)); emits 'hand.grabbed' after its line */
export function tug(o) {
  const claw = get();
  keepClip(o); o.tug = { ...claw.pre, grip: 1, s: 1, e: 0, d: claw.pre.d0, psi: 0 }; claw.gh = claw.pre.gh;
  o.body.getFixtureList().setFilterData(NO_HIT);   // nothing bumps into a card that is being fought over
  claw.hy = Math.max(90, Math.min(innerHeight - 90, gripPt()[1]));
  set('tug'); speak('grab', true);
  bus.emit('hand.grabbed', { card: o, how: 'tug' });
}
// the card between the pointer P and the claw H (page px): turned to lie along the pull, stretched to its length, thinner in the middle
/** legacy tugDraw(o, P, H) */
export function tugDraw(o, P, H) {
  const g = o.tug, dx = H[0] - P[0], dy = H[1] - P[1], d = Math.hypot(dx, dy) || 1, psi = Math.atan2(dy, dx), s = Math.max(0.85, d / g.d0), tt = s > 1 ? Math.pow(s, -0.3) : 1;
  const cf = Math.cos(g.phi), sf = Math.sin(g.phi), a = (g.gp[0] * cf + g.gp[1] * sf) * s, b = (-g.gp[0] * sf + g.gp[1] * cf) * tt, cp = Math.cos(psi), sp = Math.sin(psi);
  const cx = P[0] - (a * cp - b * sp), cy = P[1] - (a * sp + b * cp);
  o.body.setTransform({ x: cx / S, y: cy / S }, psi - g.phi); o.body.setLinearVelocity({ x: 0, y: 0 }); o.body.setAngularVelocity(0); o.body.setAwake(true);
  stretchLook(o, g, cx, cy, psi, s, tt, clamp01((d - g.d0) / (g.rip || 300)));
  g.s = s; g.d = d; g.psi = psi; g.e = d - g.d0;
}
/** back to an ordinary card, at its own size (legacy clawUntug(o, P, H)) */
export function untug(o, P, H) {
  const g = o.tug, dx = H[0] - P[0], dy = H[1] - P[1], d = Math.hypot(dx, dy) || 1;
  tugDraw(o, P, [P[0] + dx / d * g.d0, P[1] + dy / d * g.d0]);
  o.tug = null; ownClip(o); o.el.style.maskImage = o.el.style.webkitMaskImage = ''; o.el.style.filter = '';
  o.body.getFixtureList().setFilterData(HIT_ALL);
  const p = o.body.getPosition(); o.px = p.x; o.py = p.y; o.pa = o.body.getAngle();
}
/** a sharp yank right after it grabs and the claws slide off (legacy clawSlip(P, H)); emits 'hand.slipped' after its line */
export function slip(P, H) {
  const claw = get(), o = claw.o; untug(o, P, H); claw.o = null; claw.cool = now() + H_.COOL.slip;
  set('sulk'); speak('slip', true);
  bus.emit('hand.slipped', { card: o });
}
/**
 * cut o in two across the line of its tug (o.tug: gp, gh, phi, psi), with ragged teeth along the tear; P, H: page px where the two
 * halves are held (gp at P, gh at H). Draws the teeth, then each half's die time (legacy clawRip order). src: the outline to cut.
 * @returns { mine (the half at P), its (the half at H), cut } or null when the line misses the outline
 */
export function split(o, P, H, src) {
  { const el = o.el; el.style.maskImage = el.style.webkitMaskImage = ''; el.style.filter = ''; }   // the pieces are copies of this element: they must not inherit the stretch look
  const g = o.tug, W = o.w, Hh = o.h, cf = Math.cos(g.phi), sf = Math.sin(g.phi);
  // the tear runs across the pull, halfway between the two grips. A piece's outline can put that right on a corner (a sliver, an
  // edge too short to be a body): then a little to either side, the nearest place that gives two proper halves
  let hs, us, cut, side;
  for (const off of [0, 12, -12, 24, -24, 36, -36]) {
    const mx = (g.gp[0] + g.gh[0]) / 2 + W / 2 + cf * off, my = (g.gp[1] + g.gh[1]) / 2 + Hh / 2 + sf * off;
    side = (p) => (p[0] - mx) * cf + (p[1] - my) * sf; hs = []; us = []; cut = [];
    for (let i = 0; i < src.length; i++) {
      const p = src[i], q = src[(i + 1) % src.length], sp = side(p), sq = side(q);
      (sp >= 0 ? hs : us).push(p);
      if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) { const f = sp / (sp - sq), x = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]; hs.push(x); us.push(x); cut.push(x); }
    }
    if (cut.length === 2 && validPoly(hs) && validPoly(us)) break;
    if (!o.poly) break;   // a whole card: as it always was
  }
  if (cut.length !== 2 || !validPoly(hs) || !validPoly(us)) return null;
  // the tear is ragged: both halves get the same teeth along the cut, in the clip-path only. The bodies keep the straight edge
  const n = Math.max(6, Math.round(Math.hypot(cut[1][0] - cut[0][0], cut[1][1] - cut[0][1]) / 15)), teeth = [];
  for (let k = 1; k < n; k++) teeth.push([(k + (Math.random() - 0.5) * 0.5) / n, (k % 2 ? 1 : -1) * (4 + Math.random() * 9) * (Math.random() < 0.18 ? 2.2 : 1)]);
  const jag = (poly) => {
    const out = [];
    poly.forEach((p, i) => {
      out.push(p); const q = poly[(i + 1) % poly.length];
      if (cut.includes(p) && cut.includes(q)) for (const [f, off] of (p === cut[0] ? teeth : [...teeth].reverse())) out.push([cut[0][0] + (cut[1][0] - cut[0][0]) * f + cf * off, cut[0][1] + (cut[1][1] - cut[0][1]) * f + sf * off]);
    });
    return `polygon(${out.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
  };
  const ang = g.psi - g.phi, ca = Math.cos(ang), sa = Math.sin(ang);
  const part = (poly, at, loc) => {
    o.body.setTransform({ x: (at[0] - (loc[0] * ca - loc[1] * sa)) / S, y: (at[1] - (loc[0] * sa + loc[1] * ca)) / S }, ang);
    const p = fragment(o, poly, 'piece', {}, polyArea(poly) < 3000 ? { die: now() + 2500 + Math.random() * 1200 } : {});
    p.el.style.clipPath = jag(poly); return p;
  };
  const mine = part(us, P, g.gp), its = part(hs, H, g.gh);
  return { mine, its, cut };
}
/** strings between the two torn edges, and a mess (after split; the strands live on the claw record, they stretch and snap) */
export function strands(mine, its, g, cut, W, Hh) {
  const c = get(), ux = Math.cos(g.psi), uy = Math.sin(g.psi), loc = (f) => ({ x: (cut[0][0] + (cut[1][0] - cut[0][0]) * f - W / 2) / S, y: (cut[0][1] + (cut[1][1] - cut[0][1]) * f - Hh / 2) / S });
  for (let k = 0; k < 7; k++) {
    const el = document.createElement('i'); el.className = 'strand'; world.layer.appendChild(el);
    c.strands.push({ el, q: loc(0.08 + 0.84 * (k + Math.random() * 0.8) / 7), a: mine, b: its, t: 0, life: 0.35 + Math.random() * 1.1, max: 240 + Math.random() * 460, w: 3 + Math.random() * 4 });
  }
  for (let k = 0; k <= 8; k++) {
    const q = loc(k / 8), A = mine.body.getWorldPoint(q), B = its.body.getWorldPoint(q);
    gore(A.x * S, A.y * S, ux, uy, 5, 1); gore(B.x * S, B.y * S, -ux, -uy, 5, 1); gore((A.x + B.x) / 2 * S, (A.y + B.y) / 2 * S, -uy, ux, 3, 0.6);
  }
}
/** torn in two between you and it (legacy clawRip(P, H); P, H: page px of the pointer and of the claw's grip); 'hand.ripped' where your half screamed */
export function rip(P, H) {
  const c = get(), o = c.o, g = o.tug, W = o.w, Hh = o.h;
  const halves = split(o, P, H, outline(o));
  if (!halves) return slip(P, H);
  const { mine, its, cut } = halves, gr = world.grab;
  // legacy `world.destroyJoint(gr.joint); grab = null;`: the pointer's hold ends without a drop() (no release, no throw)
  world.b2.destroyJoint(gr.joint); world.grab = null; o.tug = null; remove(o);
  hold(mine, P[0], P[1], { pointerId: gr.id, clientX: gr.cx, clientY: gr.cy }); world.grab.moved = true; world.grab.h = gr.h; c.g = world.grab; c.far = false;
  c.o = its; c.gh = g.gh; c.joint = pinJoint(its.body, { x: H[0] / S, y: H[1] / S }, H_.JOINT_HZ);
  its.body.setAngularDamping(HELD_SPIN);
  strands(mine, its, g, cut, W, Hh);
  bus.emit('hand.ripped', { mine, its }); set('triumph'); speak('rip', true);   // legacy say(mine, 'slice', true): your half screams
  shake();
  if (!c.ripped) { c.ripped = true; bus.emit('ui.toast', { msg: line('toast.halved') }); }
}

// the crush takes its time: squeeze, stop and savour, squeeze, let it beg, squeeze, hold, and only then the crunch
const CRUSH_Q = H_.CRUSH_Q;
/** how far the fist has closed at t s into the crush, 0 to 1 (legacy crushQ) */
export const crushQ = (t) => { for (let i = 1; i < CRUSH_Q.length; i++) if (t < CRUSH_Q[i][0]) { const [t0, q0] = CRUSH_Q[i - 1], [t1, q1] = CRUSH_Q[i], f = (t - t0) / (t1 - t0); return q0 + (q1 - q0) * f * f * (3 - 2 * f); } return 1; };
/** it holds still and savours (legacy crushPause: (0.8, 1.7), (2.5, 3.7), (4.3, 5.0)) */
export const crushPause = (t) => H_.CRUSH_PAUSES.some(([a, b]) => t > a && t < b);
/** the card is in its fist from here on (legacy crushStart(o)) */
export function crushStart(o) {
  const claw = get();
  o.hot = 0; o.body.setBullet(false); o.body.setGravityScale(0); o.body.getFixtureList().setFilterData(NO_HIT); o.el.style.pointerEvents = 'none';
  keepClip(o);
  const pts = [], ph = Math.random() * 6, R = rim(o, 6); for (let k = 0; k < R.length; k++) pts.push([R[k][0], R[k][1], 0.45 + 0.22 * Math.sin(k * 1.9 + ph) + 0.18 * Math.random()]);
  o.tug = { crush: true, cen: middle(o), a: o.body.getAngle(), pts, spin: (Math.random() - 0.5) * 1.6 }; claw.hy = Math.max(110, Math.min(innerHeight - 110, claw.y));
}
export function install(app) {}
