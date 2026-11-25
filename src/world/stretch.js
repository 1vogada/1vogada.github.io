// The stretch look: a card (or a piece of one) pulled between two points goes long and thin, necks in the middle, goes
// see-through and red there, cracks along the neck and trembles. Drawn for the hand's tug of war (actors/hand/tug.js) and for a
// card yanked while it is still rooted in its slot (rootStretch, called by world/loop.js draw). Style only: no physics, no draws.

import { TUNE } from '../core/tune.js';
import { now } from '../core/clock.js';

const S = TUNE.physics.S, D = TUNE.drag;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// the points along o's edge that the stretch and the crumple move: 26 (or n) per side of a card, every 12 px or so of a piece
export function rim(o, n) {
  const out = [];
  if (!o.poly) { for (let k = 0; k < 4 * n; k++) { const f = (k % n) / n, e = Math.floor(k / n); out.push([e === 0 ? f * o.w : e === 1 ? o.w : e === 2 ? o.w - f * o.w : 0, e === 0 ? 0 : e === 1 ? f * o.h : e === 2 ? o.h : o.h - f * o.h]); } return out; }
  const p = o.poly;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], m = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (n > 10 ? 12 : 40))); for (let k = 0; k < m; k++) out.push([a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m]); }
  return out;
}
// a piece has a shape of its own (its clip-path): remembered before the stretch or the crumple draws over it, put back after
export const keepClip = (o) => { if (o.clip === undefined) o.clip = o.el.style.clipPath || ''; };
/** o's own shape again (a whole card: none) */
export const ownClip = (o) => { o.el.style.clipPath = o.clip || ''; };

/**
 * draw o stretched. g: { gp, gh: the two held points, px from the body's origin; dn: their distance; phi: the angle from gp to gh };
 * (cx, cy): page px of the body's origin; psi: the angle the pull lies along; s, tt: the stretch along and across it;
 * pain: 0 slack .. 1 about to tear
 */
export function stretchLook(o, g, cx, cy, psi, s, tt, pain) {
  keepClip(o);
  const cf = Math.cos(g.phi), sf = Math.sin(g.phi), cp = Math.cos(psi), sp = Math.sin(psi);
  // near the limit the whole card trembles (real time, not frames)
  const tm = now(), shk = 2.6 * pain * pain * pain, jx = shk * Math.sin(tm * 0.083) * -sp + shk * 0.4 * Math.sin(tm * 0.131) * cp, jy = shk * Math.sin(tm * 0.083) * cp + shk * 0.4 * Math.sin(tm * 0.131) * sp;
  o.el.style.transform = `translate(${(cx - o.ex + jx).toFixed(2)}px, ${(cy - o.ey + jy).toFixed(2)}px) rotate(${psi.toFixed(4)}rad) scale(${s.toFixed(4)}, ${tt.toFixed(4)}) rotate(${(-g.phi).toFixed(4)}rad)`;
  const waist = Math.min(0.86, 0.5 * Math.pow(pain, 0.7) + 0.4 * pain * pain), crack = clamp01((pain - 0.45) / 0.55);
  // the paper goes thin where it necks: you start to see through the middle, and it reddens under the strain
  const nx = g.gp[0] + 0.5 * g.dn * cf + o.w / 2, ny = g.gp[1] + 0.5 * g.dn * sf + o.h / 2, thin = (1 - 0.6 * pain * pain).toFixed(3), r0 = 0.1 * g.dn, r1 = (0.2 + 0.25 * pain) * g.dn;
  o.el.style.maskImage = o.el.style.webkitMaskImage = pain < 0.08 ? '' : `radial-gradient(circle at ${nx.toFixed(1)}px ${ny.toFixed(1)}px, rgba(0,0,0,${thin}) ${r0.toFixed(1)}px, #000 ${r1.toFixed(1)}px)`;
  o.el.style.filter = pain < 0.3 ? '' : `saturate(${(1 + 0.8 * pain).toFixed(2)}) sepia(${(0.35 * (pain - 0.3)).toFixed(2)}) hue-rotate(-${(28 * (pain - 0.3)).toFixed(0)}deg)`;
  if (waist < 0.02) ownClip(o);
  else {
    const W = o.w, Hh = o.h, pts = [], R = g.rim || (g.rim = rim(o, 26));
    for (let k = 0; k < R.length; k++) {
      const x = R[k][0], y = R[k][1];
      const rx = x - W / 2 - g.gp[0], ry = y - Hh / 2 - g.gp[1], al = rx * cf + ry * sf, bell = Math.exp(-Math.pow((al / g.dn - 0.5) / (0.3 - 0.1 * pain), 2));
      // necking, and past the halfway point little tears open along the neck: every other point bites inwards by a fixed, uneven amount
      const bite = crack * bell * (k % 2 ? 0.1 + 0.5 * (Math.sin(k * 12.9898) * 43758.5453 % 1 + 1) % 1 : 0), pe = (-rx * sf + ry * cf) * (1 - waist * bell) * (1 - bite);
      pts.push(`${(g.gp[0] + al * cf - pe * sf + W / 2).toFixed(1)}px ${(g.gp[1] + al * sf + pe * cf + Hh / 2).toFixed(1)}px`);
    }
    o.el.style.clipPath = `polygon(${pts.join(',')})`;
  }
}
/** o's ordinary look again (the transform is the caller's) */
export function unstretch(o) { ownClip(o); o.el.style.maskImage = o.el.style.webkitMaskImage = ''; o.el.style.filter = ''; if (o.sg) lift(false); o.sg = null; }
// a card stretched out of the grid reaches over the hero and the header: the list comes above them for that long, as a torn-out
// card is (inline, not a rule: styles/ is checked against the old inline block, tests/unit/styles-split.test.js)
function lift(on) { const m = document.getElementById('projects'); if (m) { m.style.position = on ? 'relative' : ''; m.style.zIndex = on ? '30' : ''; } }

/**
 * a rooted card held by the pointer and pulled away from its slot: the spot you hold goes with your hand, the far end stays
 * where the root holds it, and the card stretches between them like it does between you and the hand. o.pain (world/loop.js
 * 'bodies') is how close it is to tearing. k: the frame's interpolation. @returns {boolean} drawn (false: draw it as usual)
 */
export function rootStretch(o, grab, k) {
  const t = grab.joint.getTarget(), pull = Math.hypot(t.x - grab.hx, t.y - grab.hy), f = clamp01((pull - D.STRETCH[0]) / (D.STRETCH[1] - D.STRETCH[0]));
  if (f <= 0 && !(o.pain > 0)) return false;
  const b = o.body, p = b.getPosition(), bx = (o.px + (p.x - o.px) * k) * S, by = (o.py + (p.y - o.py) * k) * S, ba = o.pa + (b.getAngle() - o.pa) * k, ca = Math.cos(ba), sa = Math.sin(ba);
  let g = o.sg;
  if (!g) {
    // the end of the card opposite the one you hold; held by the middle, the side away from the pull
    const q = b.getLocalPoint(grab.joint.getAnchorB()), gp = [q.x * S, q.y * S], far = Math.hypot(gp[0], gp[1]) > 45;
    const w = far ? { x: -gp[0], y: -gp[1] } : b.getLocalVector({ x: grab.hx - t.x, y: grab.hy - t.y }), wl = Math.hypot(w.x, w.y) || 1, ux = w.x / wl, uy = w.y / wl;
    const ray = (x, y) => Math.min(ux > 1e-6 ? (o.w / 2 - x) / ux : ux < -1e-6 ? (-o.w / 2 - x) / ux : 1e9, uy > 1e-6 ? (o.h / 2 - y) / uy : uy < -1e-6 ? (-o.h / 2 - y) / uy : 1e9);
    let d = ray(gp[0], gp[1]) - 24, gh;
    if (d < 100) { d = ray(0, 0) - 24; gh = [ux * d, uy * d]; } else gh = [gp[0] + ux * d, gp[1] + uy * d];
    const dx = gh[0] - gp[0], dy = gh[1] - gp[1];
    g = o.sg = { gp, gh, dn: Math.hypot(dx, dy) || 1, phi: Math.atan2(dy, dx) };
    lift(true);
  }
  const ax = bx + g.gp[0] * ca - g.gp[1] * sa, ay = by + g.gp[0] * sa + g.gp[1] * ca, hx = bx + g.gh[0] * ca - g.gh[1] * sa, hy = by + g.gh[0] * sa + g.gh[1] * ca;
  const px = ax + f * (grab.cx + scrollX - ax), py = ay + f * (grab.cy + scrollY - ay), dx = hx - px, dy = hy - py, d = Math.hypot(dx, dy) || 1, psi = Math.atan2(dy, dx);
  const s = Math.max(1, d / g.dn), tt = Math.pow(s, -0.3), cf = Math.cos(g.phi), sf = Math.sin(g.phi), cp = Math.cos(psi), sp = Math.sin(psi);
  const a = (g.gp[0] * cf + g.gp[1] * sf) * s, c = (-g.gp[0] * sf + g.gp[1] * cf) * tt;
  stretchLook(o, g, px - (a * cp - c * sp), py - (a * sp + c * cp), psi, s, tt, o.pain || 0);
  return true;
}
