// Bite marks: a card the hand has been chewing (actors/hand/behaviours/chew.js) loses round, toothed bites out of its edge.
// Pure geometry and the clip-path: bite(o, at, r) adds a bite at the edge point nearest to the local point `at` (px from the
// card's top-left corner) and redraws the card's clip-path. The bites are kept on the body (o.bites, perimeter position and
// radius) and the clip in o.clip (as a piece keeps its outline, world/stretch.js keepClip / ownClip), so the stretch and the
// crumple put it back, and the basement copies it with the card (page/basement.js reads el.style.clipPath).
// The body keeps its rectangle: the bites are a look. No random draws (the teeth are a fixed wave).

const STEP = 4;          // px between points along a straight edge
const TEETH = 5;         // tooth marks along each bite
const TOOTH = 0.13;      // tooth depth, share of the bite's radius

/** perimeter position (px from the top-left corner, clockwise) of the edge point nearest to local point p of a w x h card */
function along(w, h, p) {
  const x = Math.max(0, Math.min(w, p[0])), y = Math.max(0, Math.min(h, p[1]));
  const d = [y, w - x, h - y, x], k = d.indexOf(Math.min(...d));
  return k === 0 ? x : k === 1 ? w + y : k === 2 ? w + h + (w - x) : 2 * w + h + (h - y);
}
/** the point at perimeter position s, the edge's direction (clockwise) and its inward normal */
function at(w, h, s) {
  const L = 2 * (w + h); s = ((s % L) + L) % L;
  if (s < w) return { p: [s, 0], t: [1, 0], n: [0, 1] };
  if (s < w + h) return { p: [w, s - w], t: [0, 1], n: [-1, 0] };
  if (s < 2 * w + h) return { p: [w - (s - w - h), h], t: [-1, 0], n: [0, -1] };
  return { p: [0, h - (s - 2 * w - h)], t: [0, -1], n: [1, 0] };
}
/** keep a bite on one straight edge, clear of the corners (it would cut the corner off oddly otherwise) */
function onEdge(w, h, s, r) {
  const L = 2 * (w + h), edges = [[0, w], [w, w + h], [w + h, 2 * w + h], [2 * w + h, L]];
  s = ((s % L) + L) % L;
  const [a, b] = edges.find(([a, b]) => s >= a && s < b) || edges[0];
  if (b - a < 2 * r + 4) return (a + b) / 2;
  return Math.max(a + r + 2, Math.min(b - r - 2, s));
}

/** the clip-path polygon of a w x h card with these bites ({ s, r }), in px */
export function biteClip(w, h, bites) {
  const L = 2 * (w + h), bs = [...bites].sort((u, v) => u.s - v.s), out = [];
  const push = (q) => out.push(`${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`);
  let s = 0;
  const corner = [0, w, w + h, 2 * w + h];
  const walk = (to) => {   // straight along the edge from s to `to`, through any corner on the way
    while (s < to) {
      const next = Math.min(to, ...corner.filter((c) => c > s), s + STEP);
      push(at(w, h, s).p); s = next;
    }
  };
  for (const b of bs) {
    if (b.s - b.r < s) continue;   // overlaps the last bite: the bigger mark already covers it
    walk(b.s - b.r);
    const e = at(w, h, b.s), n = 12;
    for (let i = 0; i <= n; i++) {   // the half-moon, with a row of tooth marks along its rim
      const f = (i / n) * Math.PI, rr = b.r * (1 - TOOTH * Math.abs(Math.sin(f * TEETH)));
      push([e.p[0] - e.t[0] * Math.cos(f) * rr + e.n[0] * Math.sin(f) * rr, e.p[1] - e.t[1] * Math.cos(f) * rr + e.n[1] * Math.sin(f) * rr]);
    }
    s = b.s + b.r;
  }
  walk(L);
  return `polygon(${out.join(',')})`;
}

/**
 * bite o (a card body: o.w, o.h, o.el) at the edge nearest local point p (px from its top-left corner), radius r px. Where a
 * mark is already in the way it bites deeper into that one instead. @returns the number of bite marks
 */
export function bite(o, p, r) {
  const w = o.w, h = o.h, bs = o.bites || (o.bites = []);
  const s = onEdge(w, h, along(w, h, p), r);
  const hit = bs.find((b) => Math.abs(b.s - s) < b.r + r);
  if (hit) hit.r = Math.min(hit.r + r * 0.35, Math.min(w, h) * 0.45);   // no room left there: it bites deeper into the same mark
  else bs.push({ s, r });
  o.clip = biteClip(w, h, bs);
  o.el.style.clipPath = o.clip;
  return bs.length;
}
