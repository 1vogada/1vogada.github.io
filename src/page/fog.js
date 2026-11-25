// The wipeable fog over the hero (legacy regrowMask, fogRGB, resize, wipe, frame, setRunning, refog). An independent
// animation-frame loop (one clock.nextFrame per frame, requested at the end of a frame, exactly like the legacy rAF chain).
// Its 14 blobs draw 4 Math.random each at install: install order matters (before page/kiri.js).
// install(app): hero pointermove AFTER actors/katana.js registered its own; visibilitychange after the clock's.
// The fog colour is re-read on 'theme.changed' (legacy syncTheme: rgb = fogRGB()). theme.js calls refog() itself after a
// click (legacy theme click: syncTheme(); refog()); crazy.js calls setRunning (legacy applyMode).

import { TUNE } from '../core/tune.js';
import { clock } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { isCrazy } from '../world/world.js';
import { show as toast } from './toast.js';

const T = TUNE.fog;

let hero = null, cv = null, ctx = null, mask = null, mctx = null, hint = null, reduced = false;
let W = 0, H = 0, dpr = 1, last = null, running = false, wiped = 0;
// Regrow: add whole alpha steps with 'lighter' (additive), paced by real elapsed time.
// A faint source-over fade used to round to nothing on an 8-bit canvas and stalled at ~2/3 fog.
const heroGrow = { t: null, acc: 0 };
let blobs = [];
let fogColour = '';

/** legacy regrowMask(c, el, t, st) (kiri.js uses it too) */
export function regrowMask(c, el, t, st) {
  if (st.t != null) st.acc += Math.max(0, t - st.t) / 1000 * 255 / T.REGROW_S;
  st.t = t;
  const lv = Math.floor(st.acc);
  if (lv < 1) return;
  st.acc -= lv;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(0,0,0,${Math.min(255, lv) / 255})`; c.fillRect(0, 0, el.width, el.height); c.restore();
}

function fogRGB() { return getComputedStyle(document.documentElement).getPropertyValue('--fog').trim(); }
/** the fog colour "r, g, b" (legacy rgb) */
export const rgb = () => fogColour;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, T.DPR_MAX);
  W = hero.clientWidth; H = hero.clientHeight;
  for (const c of [cv, mask]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.fillStyle = '#000'; mctx.fillRect(0, 0, W, H);
}

function wipe(x, y) {
  mctx.globalCompositeOperation = 'destination-out';
  const from = last || { x, y }, dist = Math.hypot(x - from.x, y - from.y), n = Math.max(1, Math.ceil(dist / T.WIPE_STEP)), R = Math.max(T.WIPE_R[0], Math.min(W, H) * T.WIPE_R[1]);
  for (let k = 1; k <= n; k++) {
    const px = from.x + (x - from.x) * k / n, py = from.y + (y - from.y) * k / n;
    const g = mctx.createRadialGradient(px, py, 0, px, py, R);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = g; mctx.beginPath(); mctx.arc(px, py, R, 0, Math.PI * 2); mctx.fill();
  }
  mctx.globalCompositeOperation = 'source-over';
  last = { x, y };
  wiped += dist; if (wiped > T.HINT_PX) hint.classList.add('gone');
}

function frame(t) {
  if (!running) return;
  if (!mask.width || !mask.height) { clock.nextFrame(frame); return; }
  regrowMask(mctx, mask, t, heroGrow); // fog rolls back in, all the way
  const rgb = fogColour;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = `rgba(${rgb}, .8)`; ctx.fillRect(0, 0, W, H);
  const time = reduced ? 0 : t / 1000;
  for (const b of blobs) {
    const x = ((b.x + time * 0.012 * b.s) % 1 + 1) % 1 * (W + 400) - 200, y = b.y * H, r = b.r * Math.max(W, 500);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb}, .55)`); g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0, W, H);
  clock.nextFrame(frame);
}

/** legacy setRunning(on): start or stop the fog's frame loop (crazy mode and a hidden tab stop it) */
export function setRunning(on) { if (on && !running) { running = true; clock.nextFrame(frame); } else if (!on) running = false; }

/** legacy refog(msg): the whole banner fogged over again, the hint back */
export function refog(msg) { mctx.fillStyle = '#000'; mctx.fillRect(0, 0, W, H); hint.classList.remove('gone'); wiped = 0; if (msg) toast(msg); }

/** the fog's alpha (0-255) at a viewport point (legacy: getImageData on the mask, for the shelf secret tap) */
export function alphaAt(x, y) {
  const h = hero.getBoundingClientRect();
  return mctx.getImageData(Math.round((x - h.left) * dpr), Math.round((y - h.top) * dpr), 1, 1).data[3];
}

export function install(app) {
  reduced = !!app.reduced;
  hero = document.getElementById('hero'); cv = document.getElementById('fog'); ctx = cv.getContext('2d');
  mask = document.createElement('canvas'); mctx = mask.getContext('2d');
  hint = document.getElementById('hint');
  blobs = Array.from({ length: T.BLOBS }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.18 + Math.random() * 0.25, s: (0.3 + Math.random()) * (i % 2 ? 1 : -1) }));
  fogColour = fogRGB();
  bus.on('theme.changed', () => { fogColour = fogRGB(); });
  hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); wipe(e.clientX - r.left, e.clientY - r.top); });
  hero.addEventListener('pointerleave', () => { last = null; });
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([en]) => setRunning(en.isIntersecting && !isCrazy())).observe(hero);
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden && !isCrazy()));
}
