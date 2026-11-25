// The blade (legacy TIP, TRAIL_SPEED, edgeOf, screamed, wounds, bladeCuts, endCut, bleed, polyArea, validPoly, inside,
// crossings, targets, slice; toLocal / toPage / rectPoly / worldPoly / freeCard / fragment live in world.js).
// Registered on onTick 'blade' (after 'fx', before 'hand'). Follows world.blade's TIP each frame: entry -> exit through
// another side = cut (slice, then the katana's own line, then emit 'card.cut'), the same side = stab (emit 'card.stabbed'
// FIRST, then the wound with its random life, then say 'card.stab'). When the tip enters a card it screams 'card.cutting'
// (one scream per TUNE.cut.SCREAM_GAP), then emits 'card.cutting'. Sets blade.tips / tipWas / tipDt and emits
// 'blade.moved' once per frame, after the stroke (where legacy went on to clawTick).
//
// Events emitted here:
//   'card.cutting' { card, grid, at }          card: the body (null for a grid card), grid: the grid element (else null), at: tip px
//   'card.cut'     { card, at, pieces, held }  card: the body that was cut (a grid card was freed first), at: [entry, exit] px
//   'card.stabbed' { card, grid, at, held }    at: the deepest point, page px
//   'blade.moved'  { from, to, speed, dt }     page px, px/s, s

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { say, sayAt } from '../core/speech.js';
import { world, remove, rectPoly, worldPoly, freeCard, fragment, toPage, toLocal } from './world.js';
import { spray, trail, drip } from './fx.js';

const S = TUNE.physics.S, C = TUNE.cut, V = TUNE.cut.VALID;

// ---- geometry (pure: unit-tested against the legacy text) ----
/** legacy polyArea(ps) */
export const polyArea = (ps) => Math.abs(ps.reduce((s, p, i) => { const q = ps[(i + 1) % ps.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/** legacy validPoly(ps) */
export const validPoly = (ps) => ps.length >= V.minVerts && ps.length <= V.maxVerts && polyArea(ps) >= V.minArea && !ps.some((p, i) => { const q = ps[(i + 1) % ps.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) < V.minEdge; });
/** legacy inside(poly, x, y) (convex) */
export function inside(poly, x, y) {
  let sgn = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], cr = (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]); if (cr) { if (sgn && Math.sign(cr) !== sgn) return false; sgn = Math.sign(cr); } }
  return true;
}
/** legacy crossings(poly, a, b): where the blade's path a -> b crosses the outline, in order ([x, y, t]) */
export function crossings(poly, a, b) {
  const out = [], rx = b[0] - a[0], ry = b[1] - a[1];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], sx = q[0] - p[0], sy = q[1] - p[1], den = rx * sy - ry * sx; if (!den) continue;
    const t = ((p[0] - a[0]) * sy - (p[1] - a[1]) * sx) / den, u = ((p[0] - a[0]) * ry - (p[1] - a[1]) * rx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) out.push([a[0] + rx * t, a[1] + ry * t, t]);
  }
  return out.sort((m, n) => m[2] - n[2]);
}
/** legacy edgeOf(poly, q): which side of the outline a point is nearest to (its index) */
export function edgeOf(poly, q) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], t = Math.max(0, Math.min(1, ((q[0] - a[0]) * ex + (q[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)));
    const d = Math.hypot(q[0] - a[0] - ex * t, q[1] - a[1] - ey * t); if (d < bd) { bd = d; best = i; }
  }
  return best;
}
/**
 * The polygon half of legacy slice(): split the local outline src along the local line a -> z.
 * @returns {{ L, R, cut }} (cut: the points where the line crosses the outline)
 */
export function split(src, a, z) {
  const ux = z[0] - a[0], uy = z[1] - a[1];
  const side = (p) => ux * (p[1] - a[1]) - uy * (p[0] - a[0]), L = [], R = [], cut = [];
  for (let i = 0; i < src.length; i++) {
    const p = src[i], q = src[(i + 1) % src.length], sp = side(p), sq = side(q);
    (sp >= 0 ? L : R).push(p);
    if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) { const t = sp / (sp - sq), x = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; L.push(x); R.push(x); cut.push(x); }
  }
  return { L, R, cut };
}

// ---- the stroke ----
let tick = 0, screamed = -1e9;
const wounds = [];
const alive = (t) => (t.o ? world.bodies.has(t.o) : t.card.isConnected && !t.card.classList.contains('held'));
const top = (poly) => Math.min(...poly.map((q) => q[1])) + C.SAY_DY;

/** everything the blade can cut: loose cards and pieces, and the cards still in the grid (legacy targets) */
function targets() {
  const out = [];
  for (const o of world.bodies) if ((o.kind === 'card' || o.kind === 'piece') && !o.root && o.born !== tick) out.push({ key: o, o, poly: worldPoly(o) });
  for (const card of document.getElementById('grid').querySelectorAll('.card:not(.held)')) {
    if (world.rootOf.has(card)) continue;
    const r = card.getBoundingClientRect(), x = r.left + scrollX, y = r.top + scrollY;
    out.push({ key: card, card, poly: [[x, y], [x + r.width, y], [x + r.width, y + r.height], [x, y + r.height]] });
  }
  return out;
}

/** legacy bladeCuts(dt): once per frame, the tip of world.blade */
export function bladeCuts(dt) {
  bleed();
  const o = world.blade; if (o) o.tipWas = null; if (!o || o.root || dt <= 0) return;
  const T = toPage(o, C.TIP), prev = o.tips; o.tips = T; o.tipWas = prev; o.tipDt = dt; if (!prev) { o.open = new Map(); return; }
  const step = stroke(o, prev, T, dt);
  bus.emit('blade.moved', { from: prev, to: T, speed: step / dt, dt });
}
function stroke(o, prev, T, dt) {
  const held = !!world.grab && world.grab.o === o, open = o.open, seen = new Set(), step = Math.hypot(T[0] - prev[0], T[1] - prev[1]);
  if (step / dt >= C.TRAIL_SPEED) trail(prev, T);
  if (!step && !open.size) return step;
  tick++;
  for (const t of targets()) {
    const here = (q) => t.o ? toLocal(t.o, q) : [q[0], q[1]];   // a loose card moves while it is being cut: remember the points on the card itself
    const rec = open.get(t.key), xs = crossings(t.poly, prev, T), isIn = inside(t.poly, T[0], T[1]);
    if (rec) {
      seen.add(t.key); rec.t = t;
      if (isIn) { const q = here(T), d = Math.hypot(q[0] - rec.a[0], q[1] - rec.a[1]); rec.z = q; if (d > rec.depth) { rec.depth = d; rec.w = q; } continue; }
      if (xs.length) rec.z = here(xs[xs.length - 1]);   // the tip left: this is the way out
      open.delete(t.key); endCut(o, rec, held); continue;
    }
    if (!xs.length) continue;   // the tip did not cross this outline
    const a = here(xs[0]);
    if (!isIn) { if (xs.length > 1) { const z = here(xs[xs.length - 1]); endCut(o, { t, a, z, w: z }, held); } continue; }   // in and out again within one frame
    seen.add(t.key); open.set(t.key, { t, a, z: here(T), w: here(T), depth: 0 });
    const tm = clock.now();
    if (tm - screamed > C.SCREAM_GAP) {
      screamed = tm;
      if (t.o) say(t.o, 'card.cutting', { force: true }); else sayAt(T[0], top(t.poly), 'card.cutting');
      bus.emit('card.cutting', { card: t.o || null, grid: t.card || null, at: T });
    }
  }
  for (const key of [...open.keys()]) if (!seen.has(key)) open.delete(key);   // the card is gone
  return step;
}

/** legacy endCut(k, rec, held): the tip left a card. Another side: cut. The same side: a stab */
function endCut(k, rec, held) {
  const t = rec.t; if (!alive(t)) return;
  const outline = t.o ? (t.o.poly || rectPoly(t.o)).map(([x, y]) => [x - t.o.w / 2, y - t.o.h / 2]) : t.poly;
  const through = edgeOf(outline, rec.a) !== edgeOf(outline, rec.z) && Math.hypot(rec.z[0] - rec.a[0], rec.z[1] - rec.a[1]) > C.MIN_THROUGH;
  if (through) {
    const src = t.o || freeCard(t.card), A = toPage(src, t.o ? rec.a : toLocal(src, rec.a)), B = toPage(src, t.o ? rec.z : toLocal(src, rec.z));
    const pieces = slice(src, A, B, [B[0] - A[0], B[1] - A[1]]);
    if (pieces) {
      if (!held) say(k, 'katana.cut', { force: true }); else if (Math.random() < 0.4) say(k, 'katana.brag');
      bus.emit('card.cut', { card: src, at: [A, B], pieces, held });   // legacy notice('cut')
      return;
    }
    t.o = src; rec.w = t.card ? toLocal(src, rec.w) : rec.w;   // could not be split there after all: it is a wound
  }
  // stabbed: in and out through the same side. It keeps its shape, bleeds for a while and has something to say about it
  bus.emit('card.stabbed', { card: t.o || null, grid: t.o ? null : t.card, at: t.o ? toPage(t.o, rec.w) : rec.w, held });   // legacy notice('stab')
  wounds.push({ o: t.o, card: t.o ? null : t.card, p: rec.w, until: clock.now() + C.WOUND_LIFE[0] + Math.random() * C.WOUND_LIFE[1], next: 0 });
  if (t.o) say(t.o, 'card.stab', { force: true }); else sayAt(rec.w[0], top(t.poly), 'card.stab');
  clock.wake();
}

/** legacy bleed(): every wound drips until its time is up */
function bleed() {
  const tm = clock.now();
  for (let i = wounds.length - 1; i >= 0; i--) {
    const w = wounds[i], ok = w.o ? world.bodies.has(w.o) : w.card.isConnected && !w.card.classList.contains('held');
    if (!ok || tm > w.until) { wounds.splice(i, 1); continue; }
    if (tm < w.next) continue; w.next = tm + C.DRIP_MS[0] + Math.random() * C.DRIP_MS[1];
    drip(w.o ? toPage(w.o, w.p) : w.p);
  }
}

/** legacy slice(o, A, B, dir): cut o along page points A -> B (where the blade entered and left). @returns [L, R] pieces or null */
export function slice(o, A, B, dir) {
  if (!o || !world.bodies.has(o)) return null;
  const b = o.body, pos = b.getPosition(), ang = b.getAngle(), c = Math.cos(ang), s = Math.sin(ang), W = o.w, H = o.h;
  const loc = (p) => { const dx = p[0] - pos.x * S, dy = p[1] - pos.y * S; return [dx * c + dy * s + W / 2, -dx * s + dy * c + H / 2]; };
  const a = loc(A), z = loc(B), ux = z[0] - a[0], uy = z[1] - a[1], ul = Math.hypot(ux, uy); if (ul < C.MIN_CUT) return null;
  const { L, R, cut } = split(o.poly || rectPoly(o), a, z);
  if (cut.length !== 2 || !validPoly(L) || !validPoly(R)) return null;
  const v = b.getLinearVelocity(), vx = v.x, vy = v.y, w = b.getAngularVelocity();
  const nx = (-uy * c - ux * s) / ul, ny = (-uy * s + ux * c) / ul;     // world normal of the cut, towards the L half
  const dl = Math.hypot(dir[0], dir[1]) || 1, dx = dir[0] / dl, dy = dir[1] / dl;
  const parts = [[L, 1], [R, -1]].map(([poly, sg]) => {
    const p = fragment(o, poly, 'piece', {}, polyArea(poly) < TUNE.shatter.CHUNK_AREA ? { die: clock.now() + C.PIECE_LIFE[0] + Math.random() * C.PIECE_LIFE[1] } : {});
    p.born = tick;   // the stroke that made it cannot cut it again in the same move
    p.body.setLinearVelocity({ x: vx + sg * nx * C.PUSH + dx * C.STROKE_PUSH, y: vy + sg * ny * C.PUSH + dy * C.STROKE_PUSH });
    p.body.setAngularVelocity(w + sg * (0.7 + Math.random()));
    return p;
  });
  const toWorld = (p) => { const lx = p[0] - W / 2, ly = p[1] - H / 2; return [pos.x * S + lx * c - ly * s, pos.y * S + lx * s + ly * c]; };
  const c0 = toWorld(cut[0]), c1 = toWorld(cut[1]), n = Math.max(4, Math.round(Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) / 28));
  for (let k = 0; k <= n; k++) spray(c0[0] + (c1[0] - c0[0]) * k / n, c0[1] + (c1[1] - c0[1]) * k / n, nx, ny);
  say(parts[0], 'card.slice', { force: true, scream: true });
  remove(o);
  return parts;
}

export function install(app) {
  if (app && app.reduced) return;
  clock.onTick(bladeCuts, 'blade');
  bus.on('world.reset', () => { wounds.length = 0; });   // legacy resetAll: wounds.length = 0
}
