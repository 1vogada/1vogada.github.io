// Impacts (legacy onContact, shatter, the blast shove).
// begin-contact queues hits into world.hits and shoves into world.blasts; the 'impacts' step drains hits (shatter) and the
// 'blasts' step applies the shoves. A soft hit over TUNE.physics.LAND emits 'card.landed' for each card (the cards say their own line).
// shatter(h): pieces, a pass-on to touching cards, sayAt(x, y + TUNE.shatter.SAY_DY, 'card.smash'), emit 'card.smashed'
// (legacy notice('smash') point), remove(o), shake #projects, toasts at 1 and 10 smashed (via 'ui.toast').
//
// Events emitted here:
//   'card.landed'  { card, at, closing }          for each card of a contact closing faster than LAND
//                                                (emitted from inside begin-contact, i.e. during b2.step: listeners must not
//                                                create or destroy bodies)
//   'card.smashed' { card, at, closing, pieces }  after the smash scream, before remove(card) (legacy notice('smash'))
//   'ui.toast'     { msg }                         line('toast.smashed') at the 1st, line('toast.smashed10') at the 10th
//   (at: page px [x, y] of the contact point; pieces: the new piece and shard bodies)

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { sayAt } from '../core/speech.js';
import { line } from '../core/lines.js';
import { world, remove, rectPoly, fragment } from './world.js';
import { polyArea, inside } from './cut.js';
import { shake } from './fx.js';

const S = TUNE.physics.S, P = TUNE.physics, Z = TUNE.shatter;

// begin-contact fires before the solver, so the velocities read here are still the ones the bodies came in with
/** the begin-contact listener (legacy onContact) */
export function onContact(c) {
  const grab = world.grab;
  const A = c.getFixtureA().getBody(), B = c.getFixtureB().getBody(), oa = A.getUserData(), ob = B.getUserData();
  const card = (o) => o && (o.kind === 'card' || (o.kind === 'piece' && !o.die)) && !o.root, hot = (o) => card(o) && !!o.hot && !(grab && grab.o === o);   // only a card that was thrown breaks things. One in the hand never does: dragging it out of a pile shoves the others hard, and that is not an impact
  const solid = (o) => !o || card(o) || o.kind === 'piece';
  if (!solid(oa) || !solid(ob) || (!card(oa) && !card(ob))) return;   // shards and rooted cards never break anything
  const wm = c.getWorldManifold(null); if (!wm || !wm.points.length) return;
  const pt = { x: 0, y: 0 }; for (const p of wm.points) { pt.x += p.x / wm.points.length; pt.y += p.y / wm.points.length; }
  const n = wm.normal, va = A.getLinearVelocityFromWorldPoint(pt), vb = B.getLinearVelocityFromWorldPoint(pt);
  const closing = (va.x - vb.x) * n.x + (va.y - vb.y) * n.y;   // normal points from A to B
  if (world.dbg) console.log('contact closing', closing.toFixed(1), 'hot', !!hot(oa), !!hot(ob));   // eslint-disable-line no-console
  if (closing < P.SMASH || (!hot(oa) && !hot(ob))) {
    if (closing > P.LAND) {
      const at = [pt.x * S, pt.y * S];
      if (card(oa) && oa.kind === 'card') { bus.emit('card.landed', { card: oa, at, closing }); }
      if (card(ob) && ob.kind === 'card') { bus.emit('card.landed', { card: ob, at, closing }); }
    }
    return;
  }
  const ia = A.getMass() ? 1 / A.getMass() : 0, ib = B.getMass() ? 1 / B.getMass() : 0;
  const snap = (b) => ({ v: { x: b.getLinearVelocity().x, y: b.getLinearVelocity().y }, w: b.getAngularVelocity() });
  const fast = va.x * va.x + va.y * va.y > vb.x * vb.x + vb.y * vb.y ? va : vb, fs = Math.hypot(fast.x, fast.y) || 1;
  world.blasts.push({ pt, closing, dir: { x: fast.x / fs, y: fast.y / fs } });
  if (card(oa)) world.hits.push({ o: oa, pt, n: { x: -n.x, y: -n.y }, closing, share: ia / (ia + ib), ...snap(A), vo: { x: vb.x, y: vb.y } });
  if (card(ob)) world.hits.push({ o: ob, pt, n: { x: n.x, y: n.y }, closing, share: ib / (ia + ib), ...snap(B), vo: { x: va.x, y: va.y } });
}

// break the card into a web of pieces around the impact point; each piece keeps the card's motion,
// bounces off the surface that was hit and is pushed away from the impact
/** break a card from the impact point (legacy shatter). h: { o, pt, n, closing, share, v, w, vo } */
export function shatter(h) {
  const o = h.o; if (!world.bodies.has(o)) return;
  const pl = world.pl, now = clock.now;
  const b = o.body, pos = b.getPosition(), ang = b.getAngle(), W = o.w, H = o.h, ca = Math.cos(ang), sa = Math.sin(ang);
  const bx = pos.x, by = pos.y, rx = (h.pt.x - bx) * S, ry = (h.pt.y - by) * S;
  // the crack web is drawn on the body's own outline, so a chunk of a card breaks the same way a whole card does
  const out = o.poly || rectPoly(o), cen = out.reduce((m, q) => [m[0] + q[0] / out.length, m[1] + q[1] / out.length], [0, 0]);
  let ix = rx * ca + ry * sa + W / 2, iy = -rx * sa + ry * ca + H / 2;   // impact in card space
  for (let k = 0; k < 14 && !inside(out, ix, iy); k++) { ix = cen[0] + (ix - cen[0]) * 0.8; iy = cen[1] + (iy - cen[1]) * 0.8; }
  const lens = out.map((q, i) => { const r = out[(i + 1) % out.length]; return Math.hypot(r[0] - q[0], r[1] - q[1]); }), per = lens.reduce((m, l) => m + l, 0);
  const N = Math.max(Z.POINTS[0], Math.min(Z.POINTS[1], Math.round(per / Z.PERIM_STEP))), ring = [];
  let gone = 0, k = 0;
  out.forEach((q, i) => {   // the corners, plus N random points along the outline, in order
    const r = out[(i + 1) % out.length]; ring.push(q);
    for (; k < N; k++) { const d = (k + 0.2 + Math.random() * 0.6) / N * per - gone; if (d >= lens[i]) break; if (d > 0) ring.push([q[0] + (r[0] - q[0]) * d / lens[i], q[1] + (r[1] - q[1]) * d / lens[i]]); }
    gone += lens[i];
  });
  const rings = Z.RINGS, polys = [], at = (p, f) => [ix + (p[0] - ix) * f, iy + (p[1] - iy) * f];
  for (let k = 0; k < ring.length; k++) {
    const p = ring[k], q = ring[(k + 1) % ring.length];
    for (let r = 0; r < 3; r++) polys.push(r === 0 ? [[ix, iy], at(p, rings[1]), at(q, rings[1])] : [at(p, rings[r]), at(p, rings[r + 1]), at(q, rings[r + 1]), at(q, rings[r])]);
  }
  o.el.classList.remove('grabbed');
  const pieces = [];
  for (const poly of polys) {
    if (polyArea(poly) < Z.MIN_AREA || poly.some((p, i) => { const q = poly[(i + 1) % poly.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) < Z.MIN_EDGE; })) continue;
    if (new pl.Polygon(poly.map(([x, y]) => ({ x: (x - W / 2) / S, y: (y - H / 2) / S }))).m_count !== poly.length) continue;
    // same rule as a cut: a big chunk stays and is a body like any other (grab it, stack it, cut it, smash it again), crumbs fade away
    const s = polyArea(poly) >= Z.CHUNK_AREA ? fragment(o, poly, 'piece', { ...Z.PIECE }, {})
      : fragment(o, poly, 'shard', { ...Z.SHARD }, { die: now() + Z.SHARD_LIFE[0] + Math.random() * Z.SHARD_LIFE[1] });
    pieces.push(s);
    const c = s.body.getWorldCenter(), dx = c.x - bx, dy = c.y - by;
    let vx = h.v.x - h.w * dy, vy = h.v.y + h.w * dx;                       // the card's own motion at this piece
    const cn = (vx - h.vo.x) * h.n.x + (vy - h.vo.y) * h.n.y;               // speed into the surface (negative)
    if (cn < 0) { const j = -(1.1 + Math.random() * 0.35) * cn * h.share; vx += j * h.n.x; vy += j * h.n.y; }
    const ax = c.x - h.pt.x, ay = c.y - h.pt.y, dist = Math.max(0.15, Math.hypot(ax, ay));
    const burst = h.closing * (0.06 + Math.random() * 0.26) * Math.min(1, 0.9 / dist);
    s.body.setLinearVelocity({ x: vx + ax / dist * burst, y: vy + ay / dist * burst });
    s.body.setAngularVelocity(h.w + (Math.random() - 0.5) * h.closing * 0.5);
  }
  // a really hard hit carries on into the cards this one was touching, losing 40% of its speed per card
  const pass = h.closing * Z.PASS, inc = Math.hypot(h.v.x, h.v.y) > Math.hypot(h.vo.x, h.vo.y) ? h.v : h.vo;
  if (pass >= P.SMASH) for (let ce = b.getContactList(); ce; ce = ce.next) {
    const c = ce.other.getUserData(); if (!c || (c.kind !== 'card' && (c.kind !== 'piece' || c.die)) || c.root || !ce.contact.isTouching()) continue;
    const wm = ce.contact.getWorldManifold(null); if (!wm || !wm.points.length) continue;
    const q = wm.points[0], d = ce.other.getWorldCenter(), nx = d.x - q.x, ny = d.y - q.y, nl = Math.hypot(nx, ny) || 1, cv = ce.other.getLinearVelocity();
    world.hits.push({ o: c, pt: { x: q.x, y: q.y }, n: { x: nx / nl, y: ny / nl }, closing: pass, share: 0.5, v: { x: cv.x, y: cv.y }, w: ce.other.getAngularVelocity(), vo: { x: inc.x * 0.6, y: inc.y * 0.6 } });
  }
  sayAt(bx * S, by * S + Z.SAY_DY, 'card.smash');
  bus.emit('card.smashed', { card: o, at: [h.pt.x * S, h.pt.y * S], closing: h.closing, pieces });   // legacy notice('smash')
  remove(o);
  shake();
  world.smashed++;
  if (world.smashed === 1) bus.emit('ui.toast', { msg: line('toast.smashed') });
  else if (world.smashed === 10) bus.emit('ui.toast', { msg: line('toast.smashed10') });
}

function impacts() { while (world.hits.length) shatter(world.hits.shift()); }
function blasts() {
  for (const q of world.blasts.splice(0)) for (const o of world.bodies) {   // the shock shoves whatever stands next to the impact, mostly the way the throw was going
    if (o.kind !== 'card' || o.root) continue;
    const c = o.body.getWorldCenter(), ax = c.x - q.pt.x, ay = c.y - q.pt.y, dist = Math.hypot(ax, ay) || 1;
    if (dist > Z.BLAST_RADIUS) continue;
    const j = o.body.getMass() * q.closing * Z.BLAST * (1 - dist / Z.BLAST_RADIUS);
    o.body.applyLinearImpulse({ x: (0.5 * ax / dist + 0.8 * q.dir.x) * j, y: (0.5 * ay / dist + 0.8 * q.dir.y) * j }, { x: c.x, y: c.y - 0.4 }, true);
  }
}

export function install(app) {
  if (app && app.reduced) return;
  clock.onStep(impacts, 'impacts');
  clock.onStep(blasts, 'blasts');
}
