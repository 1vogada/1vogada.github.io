// One drawing for every hand (legacy handParts, handDraw): the arm's own and every cut-off one, mirrored with m,
// turned with sx/cx, standing on feet. Moved verbatim from scripts/legacy.js; legacy now() is clock.now(), legacy html is
// document.documentElement (read at call time), the eye's place E is TUNE.hand.EYE. The arm's wrapper (legacy
// clawDraw(wig, shake, strain) = handDraw(claw, ...)) is draw() in ./index.js.
// handDraw draws two Math.random values per call (the shake offset) even when shake is 0: every call counts for parity.
// tests/unit/hand-draw.test.js compares every path with what the legacy functions drew (tests/unit/fixtures/hand-draw.*.json).

import { now } from '../../core/clock.js';
import { FING, THUMB, BEND, ARCH, PALM, EYE } from './poses.js';

const NS = 'http://www.w3.org/2000/svg';

// the drawing of one hand: two layers, the thumb under the cards and the rest over them, so a card really sits in its grip.
// The arm's hand has one, and so does every hand that has been cut off
/** the two SVG layers and their paths (legacy handParts(extra)). @returns { under, over, thumb, talonT, flesh, talon, crease, vein, eye, pupil } */
export function handParts(extra) {
  const mk = (cls) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'claw ' + cls + (extra ? ' ' + extra : '')); s.setAttribute('aria-hidden', 'true'); document.body.appendChild(s); return s; };
  const path = (svg, cls) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', cls); svg.appendChild(p); return p; };
  const under = mk('under'), over = mk('over');
  return { under, over, thumb: path(under, 'flesh'), talonT: path(under, 'talon'), flesh: path(over, 'flesh'), talon: path(over, 'talon'), crease: path(over, 'crease'), vein: path(over, 'vein'), eye: path(over, 'eye'), pupil: path(over, 'pupil') };
}

// the arm and hand, rebuilt each frame from the pose: bones as tapered limbs with knobbly joints, a talon on every finger.
// c is the arm's own hand (claw) or a cut-off one: arm false draws no arm, stump draws the arm with nothing on the end, m -1 mirrors it,
// and pose.legs stands it on its first two fingers, stepping with c.gait
/** legacy handDraw(c, wig, shake, strain); sets c.tip, c.arm2 */
export function handDraw(c, wig, shake, strain) {
  const p = c.pose, ca = Math.cos(c.a), sa = Math.sin(c.a), tm = now() / 1000, vw = document.documentElement.clientWidth, mr = c.m || 1;
  const ox = c.x + (Math.random() - 0.5) * shake, oy = c.y + (Math.random() - 0.5) * shake, f1 = (v) => v.toFixed(1);
  const sx = c.sx ?? 1, cx = c.cx ?? 0;   // sx under 1 narrows the whole drawing towards the upright line through cx: the hand turning round, seen from the side
  const tf = (x, y) => { const X = ox + x * ca + mr * y * sa; return [sx === 1 ? X : cx + (X - cx) * sx, oy + x * sa - mr * y * ca]; };
  const limb = (pts, ws) => {
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i], r = ws[i] / 2 * (i && i < pts.length - 1 ? 1.34 : i ? 1.05 : 1);
      d += `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
      if (i + 1 < pts.length) {
        const [X, Y] = pts[i + 1], dx = X - x, dy = Y - y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, a = ws[i] / 2, b = ws[i + 1] / 2;
        d += `M${f1(x + nx * a)} ${f1(y + ny * a)}L${f1(X + nx * b)} ${f1(Y + ny * b)}L${f1(X - nx * b)} ${f1(Y - ny * b)}L${f1(x - nx * a)} ${f1(y - ny * a)}Z`;
      }
    }
    return d;
  };
  // a finger is three bones on three joints. It arches back at the first knuckle and hooks at the other two, so even an open hand is a claw;
  // curling adds to every joint. Knuckles are knobs wider than the bones, each with two crease lines, and the talon is a long curved hook
  // With a foot (hand space) the finger is a leg: its tip is put exactly there and the joints are solved backwards from it, knee towards the back of the hand
  const finger = (f, curl, sgn, spread, foot) => {
    let a = f.a * spread, x = f.b[0], y = f.b[1]; const loc = [[x, y]], dirs = [];
    if (foot) {
      const L1 = f.l[0] * 1.1, L2 = f.l[1] * 1.1, L3 = f.l[2] * 1.1, B = L2 + L3 * 0.94, d = Math.max(Math.abs(L1 - B) + 2, Math.min((L1 + B) * 0.995, Math.hypot(foot[0] - x, foot[1] - y))), ang = Math.atan2(foot[1] - y, foot[0] - x);
      const a1 = ang - Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - B * B) / (2 * L1 * d)))), kx = x + L1 * Math.cos(a1), ky = y + L1 * Math.sin(a1), fx = x + d * Math.cos(ang), fy = y + d * Math.sin(ang);
      const a2 = Math.atan2(fy - ky, fx - kx) - 0.16, jx = kx + L2 * Math.cos(a2), jy = ky + L2 * Math.sin(a2), a3 = Math.atan2(fy - jy, fx - jx);
      dirs.push(a1, a2, a3); loc.push([kx, ky], [jx, jy], [fx, fy]); a = a3; x = fx; y = fy; sgn = 1;
    } else for (let j = 0; j < 3; j++) { a += sgn * (curl * BEND[j] + ARCH[j]); dirs.push(a); x += Math.cos(a) * f.l[j] * 1.1; y += Math.sin(a) * f.l[j] * 1.1; loc.push([x, y]); }
    const pts = loc.map(([lx, ly]) => tf(lx, ly)), w = f.w * 0.86, L = pts[3], tl = w * 2.4, hook = sgn * (0.55 + curl * 0.35);
    const P = (r, da, side) => tf(x + Math.cos(a + da) * r - Math.sin(a) * side, y + Math.sin(a + da) * r + Math.cos(a) * side), tip = P(tl, hook, 0);
    const c1 = P(tl * 0.55, hook * 0.25, -sgn * w * 0.42), c2 = P(tl * 0.5, hook * 0.75, sgn * w * 0.3), b1 = P(-w * 0.15, 0, -sgn * w * 0.3), b2 = P(-w * 0.15, 0, sgn * w * 0.3);
    const talon = `M${f1(b1[0])} ${f1(b1[1])}Q${f1(c1[0])} ${f1(c1[1])} ${f1(tip[0])} ${f1(tip[1])}Q${f1(c2[0])} ${f1(c2[1])} ${f1(b2[0])} ${f1(b2[1])}Z`;
    let crease = '';
    for (let j = 1; j < 3; j++) for (const off of [-0.16, 0.16]) {   // across the knuckle, on the outside of the bend
      const ang = (dirs[j - 1] + dirs[j]) / 2, r = w * (j === 1 ? 0.5 : 0.42), cx = loc[j][0] + Math.cos(ang) * off * w, cy = loc[j][1] + Math.sin(ang) * off * w;
      const q0 = tf(cx - Math.sin(ang) * r * -sgn * 0.1, cy + Math.cos(ang) * r * -sgn * 0.1), q1 = tf(cx + Math.sin(ang) * r * sgn * -1, cy - Math.cos(ang) * r * sgn * -1);
      crease += `M${f1(q0[0])} ${f1(q0[1])}L${f1(q1[0])} ${f1(q1[1])}`;
    }
    return { pts, talon, crease, tip, d: limb(pts, [w, w * 0.9, w * 0.78, w * 0.56]) };
  };
  // feet: where each finger's tip stands (viewport px; 0 to 3 the fingers, 4 the thumb). A finger with no foot curls by the pose; pose.legs makes a fist of those
  const pt = p.point || 0, lg = p.legs || 0, ft = c.feet, toL = (q) => { const dx = (sx === 1 ? q[0] : cx + (q[0] - cx) / sx) - ox, dy = q[1] - oy; return [dx * ca + dy * sa, mr * (dx * sa - dy * ca)]; }, fs = FING.map((f, i) => {
    let cu = (p.curl + wig * Math.sin(tm * 12 + i * 1.4)) * (1 - pt) + (i ? 1.1 : -0.22) * pt;   // point: the first finger straightens, the others close
    if (lg) cu = cu * (1 - lg) + lg * 1.15;
    return finger(f, cu, 1, p.spread * (1 - lg) + 0.3 * lg, ft && ft[i] ? toL(ft[i]) : null);
  });
  c.tip = fs[0].tip;
  const th = finger(THUMB, p.th + wig * Math.sin(tm * 12 + 5), -1, 1, ft && ft[4] ? toL(ft[4]) : null);
  // arm: in from past the edge, a bony elbow, a bend that straightens under strain
  const A = [vw + 90, c.sh], Wp = [ox, oy], ax = Wp[0] - A[0], ay = Wp[1] - A[1], al = Math.hypot(ax, ay) || 1, bend = (10 + 44 * (1 - strain));
  let ex = (A[0] + Wp[0]) / 2 + ay / al * bend, ey = (A[1] + Wp[1]) / 2 - ax / al * bend; if (ax > 0) { ex = (A[0] + Wp[0]) / 2; ey = (A[1] + Wp[1]) / 2; }
  const arm = [A, [ex, ey], Wp], noArm = c.arm === false, armD = noArm ? limb([tf(-17, 1), tf(8, 0)], [18, 22]) : limb(arm, [44, 30, 21]);
  if (!noArm) c.arm2 = arm;
  if (c.stump && (c.st === 'stump' || c.st === 'sew')) {   // the hand is gone: the arm ends in a raw ring (and while the old one is put back on)
    c.flesh.setAttribute('d', armD); for (const key of ['thumb', 'talonT', 'talon', 'crease', 'eye', 'pupil']) c[key].setAttribute('d', '');
    c.vein.setAttribute('d', `M${f1(ox - 8)} ${f1(oy)}a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M${f1(ox - 3)} ${f1(oy)}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`); return;
  }
  let palm = PALM.map(([x, y]) => tf(x, y)), ar = 0; palm.forEach((q, i) => { const r = palm[(i + 1) % palm.length]; ar += q[0] * r[1] - r[0] * q[1]; }); if (ar > 0) palm.reverse();   // same winding as the limbs, or the overlaps would cut holes
  const mid = (q, r) => [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2], m0 = mid(palm[palm.length - 1], palm[0]);
  let pd = `M${f1(m0[0])} ${f1(m0[1])}`; palm.forEach((q, i) => { const m = mid(q, palm[(i + 1) % palm.length]); pd += `Q${f1(q[0])} ${f1(q[1])} ${f1(m[0])} ${f1(m[1])}`; }); pd += 'Z';
  c.flesh.setAttribute('d', armD + pd + fs.map((f) => f.d).join(''));
  c.thumb.setAttribute('d', th.d); c.talonT.setAttribute('d', th.talon);
  c.talon.setAttribute('d', fs.map((f) => f.talon).join('')); c.crease.setAttribute('d', fs.map((f) => f.crease).join(''));
  const line = (pts) => 'M' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join('L');
  c.vein.setAttribute('d', fs.map((f, i) => line([tf(FING[i].b[0] - 30, FING[i].b[1] * 0.45), ...f.pts.slice(0, 3)])).join('') + (noArm ? '' : line([tf(18, 6), Wp, [ex + 3, ey + 4], [A[0], A[1] + 6]]) + line([tf(-2, -6), [ex - 2, ey - 6]])));
  // one eye on the back of the hand
  const E = EYE, hh = 8.5 * Math.max(0.08, p.eye), happy = p.happy > 0.5, q = (x, y) => { const v = tf(E[0] + x, E[1] + y); return `${f1(v[0])} ${f1(v[1])}`; };
  if (p.dead > 0.5) {   // playing dead: two crossed strokes for an eye
    c.eye.setAttribute('class', 'eye happy'); c.eye.setAttribute('d', `M${q(-9, -7)}L${q(9, 7)}M${q(-9, 7)}L${q(9, -7)}`); c.pupil.setAttribute('d', ''); return;
  }
  c.eye.setAttribute('class', happy ? 'eye happy' : 'eye');
  c.eye.setAttribute('d', happy ? `M${q(-12, 4)}Q${q(0, -13)} ${q(12, 4)}` : `M${q(-14, 0)}Q${q(0, -2 * hh)} ${q(14, 0)}Q${q(0, 2 * hh)} ${q(-14, 0)}Z`);
  const pw = 2.2 + 2.6 * p.pupil; let ph = hh * 0.82, lx = 0, ly = 0;
  if (c.lookAt) {   // it watches a point (viewport px): the pupil slides towards it, a little smaller so it stays in the eye
    const e = tf(E[0] + 3, E[1]), dx = c.lookAt[0] - e[0], dy = c.lookAt[1] - e[1], ux = dx * ca + dy * sa, uy = mr * (dx * sa - dy * ca), l = Math.hypot(ux, uy) || 1, k = c.lookPx || 5;
    ph *= 0.7; lx = ux / l * k; ly = uy / l * Math.min(k, hh * 0.3);
  }
  c.pupil.setAttribute('d', happy ? '' : `M${q(3 + lx, ly - ph)}Q${q(3 + lx + pw, ly)} ${q(3 + lx, ly + ph)}Q${q(3 + lx - pw, ly)} ${q(3 + lx, ly - ph)}Z`);
}

export function install(app) {}
