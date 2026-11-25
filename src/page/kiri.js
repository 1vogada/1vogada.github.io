// 霧 kiri: the whole page floods with fog (legacy kSize, kMaskSize, kWipe, kFrame, floodPage, liftFlood, its pointermove /
// scroll / resize), and the page keys (legacy document keydown: "/" focuses search, kiri / мъгла floods, Escape lifts,
// tana / рафт / たな opens the shelf) and the tap on the uncovered secret (legacy hero click). 16 blobs, 4 Math.random each,
// at install (after page/fog.js). Emits 'kiri.flooded'.
// The shelf is reached through its contract name app.shelf.toggle (legacy window.__shelf?.(), which did not exist under
// reduced motion), never by importing actors/shelf.js.

import { TUNE } from '../core/tune.js';
import { clock } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { has, line } from '../core/lines.js';
import { isCrazy } from '../world/world.js';
import { regrowMask, refog, alphaAt, rgb } from './fog.js';
import { show as toast } from './toast.js';

const K = TUNE.kiri;
const FLOOD_TOAST = '霧が出た · Мъгла падна · The fog rolls in';   // fallback only: the line is toast.fog in src/lines/page.js

let kv = null, kctx = null, km = null, kmctx = null, reduced = false;
let state = null, kW = 0, kH = 0, kdpr = 1, kS = K.MASK_SCALE, kLast = null;
const kGrow = { t: null, acc: 0 };
let kBlobs = [];
const ease = (p) => p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(1 - p, 3);
function pageH() { return Math.max(document.documentElement.scrollHeight, innerHeight); }

function kSize() {
  kdpr = Math.min(window.devicePixelRatio || 1, TUNE.fog.DPR_MAX);
  kW = document.documentElement.clientWidth; kH = innerHeight;
  kv.width = Math.round(kW * kdpr); kv.height = Math.round(kH * kdpr);
  kctx.setTransform(kdpr, 0, 0, kdpr, 0, 0);
}
function kMaskSize() { // page-sized mask at reduced resolution, keeps what was there
  const ph = pageH(); kS = Math.min(K.MASK_SCALE, K.MASK_MAX / ph);
  const w = Math.ceil(kW * kS), h = Math.ceil(ph * kS);
  if (km.width === w && km.height === h) return;
  const old = km.width ? (() => { const c = document.createElement('canvas'); c.width = km.width; c.height = km.height; c.getContext('2d').drawImage(km, 0, 0); return c; })() : null;
  km.width = w; km.height = h;
  kmctx.fillStyle = '#000'; kmctx.fillRect(0, 0, w, h);
  if (old) kmctx.drawImage(old, 0, 0, w, h);
}
function kWipe(x, y) { // page coordinates
  const from = kLast || { x, y }, dist = Math.hypot(x - from.x, y - from.y), n = Math.max(1, Math.ceil(dist / 10)), R = Math.max(50, Math.min(kW, kH) * 0.12);
  kmctx.globalCompositeOperation = 'destination-out';
  for (let k = 1; k <= n; k++) {
    const px = (from.x + (x - from.x) * k / n) * kS, py = (from.y + (y - from.y) * k / n) * kS, r = R * kS;
    const g = kmctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    kmctx.fillStyle = g; kmctx.beginPath(); kmctx.arc(px, py, r, 0, Math.PI * 2); kmctx.fill();
  }
  kmctx.globalCompositeOperation = 'source-over';
  kLast = { x, y };
}
function kFrame(t) {
  const flood = state;
  if (!flood) return;
  clock.nextFrame(kFrame);
  const s = (t - flood.t0) / 1000;
  const liftAt = flood.lift ?? (K.FLOOD_IN_S + K.FLOOD_HOLD_S);
  const alpha = 1 - Math.min(1, Math.max(0, (s - liftAt) / K.FLOOD_OUT_S));
  if (alpha <= 0) { state = null; kv.classList.remove('on'); return; }
  kMaskSize();
  regrowMask(kmctx, km, t, kGrow);
  const front = flood.from + (flood.to - flood.from) * ease(s / K.FLOOD_IN_S);
  if (front > flood.filled) { kmctx.fillStyle = '#000'; kmctx.fillRect(0, flood.filled * kS, km.width, (front - flood.filled) * kS); flood.filled = front; }
  const sy = scrollY, fv = front - sy, edge = K.EDGE, a = alpha, c = rgb();
  kctx.globalCompositeOperation = 'source-over';
  kctx.clearRect(0, 0, kW, kH);
  if (fv <= 0) return;
  const bottom = Math.min(kH, fv);
  kctx.fillStyle = `rgba(${c}, ${a})`; kctx.fillRect(0, 0, kW, Math.max(0, Math.min(kH, fv - edge)));
  if (fv - edge < kH) {
    const g = kctx.createLinearGradient(0, fv - edge, 0, fv);
    g.addColorStop(0, `rgba(${c}, ${a})`); g.addColorStop(1, `rgba(${c}, 0)`);
    kctx.fillStyle = g; kctx.fillRect(0, Math.max(0, fv - edge), kW, bottom - Math.max(0, fv - edge));
  }
  const time = reduced ? 0 : t / 1000;
  for (const b of kBlobs) {
    const x = ((b.x + time * 0.015 * b.s) % 1 + 1) % 1 * (kW + 400) - 200, y = b.y * kH, r = b.r * Math.max(kW, 500);
    if (y - r > bottom) continue;
    const g = kctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c}, ${0.6 * alpha})`); g.addColorStop(1, `rgba(${c}, 0)`);
    kctx.fillStyle = g; kctx.fillRect(x - r, y - r, r * 2, Math.min(r * 2, bottom - (y - r)));
  }
  kctx.globalCompositeOperation = 'destination-in';
  kctx.drawImage(km, 0, sy * kS, km.width, kH * kS, 0, 0, kW, kH);
}

/** legacy floodPage(): a wall of fog rolls down over the whole page */
export function flood() {
  if (state && state.lift == null) return; // already flooded
  kSize(); kMaskSize();
  const from = Math.max(0, scrollY - 40);
  kmctx.fillStyle = '#000'; kmctx.fillRect(0, 0, km.width, from * kS); // everything above the screen is already gone
  state = { t0: clock.wall(), from, to: pageH() + 200, filled: from, lift: null };
  kGrow.t = null; kLast = null;
  kv.classList.add('on');
  clock.nextFrame(kFrame);
  bus.emit('kiri.flooded', {});
}

/** legacy liftFlood(): thin out over FLOOD_OUT_S, starting no earlier than when it has fully rolled in */
export function lift() { if (state && state.lift == null) state.lift = Math.max(K.FLOOD_IN_S, (clock.wall() - state.t0) / 1000); }

/** legacy window.__shelf?.(): there is no shelf under reduced motion */
function shelf(app) { if (!reduced && app.shelf) app.shelf.toggle(); }

export function install(app) {
  reduced = !!app.reduced;
  kv = document.getElementById('kiri'); kctx = kv.getContext('2d');
  km = document.createElement('canvas'); kmctx = km.getContext('2d');
  kBlobs = Array.from({ length: K.BLOBS }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.2 + Math.random() * 0.25, s: (0.3 + Math.random()) * (i % 2 ? 1 : -1) }));
  document.addEventListener('pointermove', (e) => { if (state) kWipe(e.clientX + scrollX, e.clientY + scrollY); }, { passive: true });
  addEventListener('scroll', () => { kLast = null; }, { passive: true });
  addEventListener('resize', () => { if (state) kSize(); });

  // ---- keys: "/" focuses search, typing "kiri" or "мъгла" buries the whole page in fog (Esc lifts it) ----
  const q = document.getElementById('q'), hero = document.getElementById('hero');
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/' && !isCrazy()) { e.preventDefault(); q.focus(); return; }
    if (e.key === 'Escape') lift();
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-8);
    if (typed.endsWith('kiri') || typed.endsWith('мъгла')) {
      if (!isCrazy()) { refog(); flood(); toast(has('toast.fog') ? line('toast.fog') : FLOOD_TOAST); }
    }
    // 棚 the secret written under the fog in the top right corner of the banner
    if (typed.endsWith('tana') || typed.endsWith('рафт') || typed.endsWith('たな')) { typed = ''; shelf(app); }
  });
  // no keyboard: wipe the fog off the writing and tap it
  hero.addEventListener('click', (e) => {
    const r = document.getElementById('secret').getBoundingClientRect();
    if (e.clientX < r.left - 8 || e.clientX > r.right + 8 || e.clientY < r.top - 8 || e.clientY > r.bottom + 8) return;
    const a = alphaAt(r.left + r.width / 2, r.top + r.height / 2);
    if (a < 150) shelf(app);
  });
}
