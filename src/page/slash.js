// The katana cuts the fog (chain fog-slash). src/reactions.js hands every 'blade.moved' to cut(): the tip leaves a long thin
// slit in the banner fog (page/fog.js slit) and, while it is up, in the kiri flood (page/kiri.js slit), instead of the pointer's
// round wipe; the fog's own regrow closes them again, slowly. A slash across the hidden 棚 in the banner's top corner (fast, in
// and out across the writing) splits the writing in two and emits 'tana.slashed'; src/reactions.js has the katana gloat
// ('katana.tana') and opens the shelf, so the shelf can be found without knowing the word.
// No Math.random here: slits and the split are drawing only. Nothing under crazy mode or reduced motion (no katana there).
//
// Events emitted here:
//   'tana.slashed'  { at }  the tip went across the 棚 writing while the shelf was in (at: where it left the writing, page px)

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { isCrazy } from '../world/world.js';
import * as shelf from '../actors/shelf.js';
import { slit as fogSlit } from './fog.js';
import { slit as kiriSlit } from './kiri.js';

const S = TUNE.fogSlash;
let reduced = false, glyph = null, word = '棚', pass = null, coolUntil = 0;

/** the part of the segment a -> b inside the box r ({ l, t, r, b }), or null (Liang-Barsky) */
export function clip(a, b, r) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, a[0] - r.l], [dx, r.r - a[0]], [-dy, a[1] - r.t], [dy, r.b - a[1]]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
}
const inBox = (p, r) => p[0] >= r.l && p[0] <= r.r && p[1] >= r.t && p[1] <= r.b;

/** the writing falls apart along the cut: two halves of 棚, clipped on either side of the line, drift apart and fade */
function split(dir) {
  if (!glyph || typeof glyph.animate !== 'function') return;
  const w = glyph.offsetWidth, h = glyph.offsetHeight, L = Math.max(w, h) * 4;
  const len = Math.hypot(dir[0], dir[1]) || 1, d = [dir[0] / len, dir[1] / len], n = [-d[1], d[0]], c = [w / 2, h / 2];
  const pt = (k, m) => `${(c[0] + d[0] * k + n[0] * m).toFixed(1)}px ${(c[1] + d[1] * k + n[1] * m).toFixed(1)}px`;
  glyph.style.position = 'relative'; glyph.style.color = 'transparent';
  let left = 2;
  for (const side of [1, -1]) {
    const half = document.createElement('span');
    half.textContent = word; half.setAttribute('aria-hidden', 'true');
    half.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;color:var(--accent);pointer-events:none;`
      + `clip-path:polygon(${pt(-L, 0)}, ${pt(L, 0)}, ${pt(L, side * L)}, ${pt(-L, side * L)});`;
    glyph.appendChild(half);
    const ox = n[0] * side * S.SPLIT_PX, oy = n[1] * side * S.SPLIT_PX, rot = side * 4;
    const a = half.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${ox}px, ${oy}px) rotate(${rot}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${ox * 1.4}px, ${oy * 1.4 + 3}px) rotate(${rot * 1.5}deg)`, opacity: 0 },
    ], { duration: S.SPLIT_MS, easing: 'ease-out', fill: 'forwards' });
    a.onfinish = () => { half.remove(); if (--left === 0) { glyph.style.color = ''; glyph.style.position = ''; } };
  }
}

/** one frame of the katana's tip (the 'blade.moved' payload, page px): slits, and the slash across 棚 */
export function cut({ from, to, speed }) {
  if (reduced || isCrazy() || !from || !to) return;
  if (speed >= S.SLIT_SPEED) { fogSlit(from, to); kiriSlit(from, to); }
  tana(from, to, speed);
}

function tana(a, b, speed) {
  if (!glyph) return;
  const g = glyph.getBoundingClientRect();
  if (!g.width) { pass = null; return; }
  const P = S.TANA_PAD, r = { l: g.left + scrollX - P, t: g.top + scrollY - P, r: g.right + scrollX + P, b: g.bottom + scrollY + P };
  const seg = clip(a, b, r);
  if (seg) {
    if (speed < S.SLASH_SPEED) pass = null;           // dragged through slowly: that is not a slash
    else { if (!pass) pass = { a: seg[0] }; pass.b = seg[1]; }
  }
  if (!pass || inBox(b, r)) return;
  const p = pass; pass = null;                        // the tip is out again: was it across?
  if (Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]) < S.ACROSS * Math.min(r.r - r.l, r.b - r.t)) return;
  if (clock.wall() < coolUntil || shelf.state()) return;
  coolUntil = clock.wall() + S.COOL_MS;
  split([p.b[0] - p.a[0], p.b[1] - p.a[1]]);
  bus.emit('tana.slashed', { at: p.b });
}

export function install(app) {
  reduced = !!app.reduced;
  glyph = document.querySelector('#secret b');
  if (glyph) word = glyph.textContent;
}
