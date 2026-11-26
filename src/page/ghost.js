// A ghost in the fog (chain fog-ghost). When the new hand eats an old hand ('hand.devoured' -> rise(), src/reactions.js), a pale
// hand lingers in the banner fog: drawn over the fog by page/fog.js overlay(), and only where the fog is thick (its alpha is
// multiplied by the fog mask's alpha TUNE.ghost.MASK_POW times, so a wiped patch hides it at once and thin fog nearly so).
//  - It drifts slowly around the banner. Wipe through it (the pointer, fast, close to it) and it slips away and waves, with a
//    faint word ('ghost.wave'); 'ghost.slipped'.
//  - Type kiri: once the flood has rolled in, it leaves the banner and roams the whole page in the flood (page/kiri.js overlay()),
//    tapping the cards in view: each shivers and says so ('card.ghost'; 'ghost.tapped'). While it roams it asks for an old hand
//    in view ('ghost.roaming'): src/reactions.js sends them over (severed salute: they walk in and bow, 'sev.ghost') and calls
//    attend(at): it hovers over the spot, and bows back when they bow (bowBack(), 'ghost.bowed'). The funeral happens in the fog.
//  - Wipe through it TUNE.ghost.WIPES times, or wipe the banner's fog down below REST_COVER while it is there, and it bows and
//    fades ('ghost.rest', a toast 'toast.ghost'; 'ghost.rested'). Laid to rest, it never comes back on this visit (page load).
// It moves only in the fog's and the flood's own frames (no loop of its own): with the banner out of view and no flood, it
// waits. No Math.random on the way in (rise); line picks only on its own path. Nothing under reduced motion or in crazy mode.
// Its words and the cards' bubbles go in a layer of its own above the flood (z-index 49), styled inline (styles/ is pinned).
// install(app): hero/document pointermove (after fog and kiri), the speakers 'ghost' and 'ghostCard', hook('__ghost').
//
// Events emitted here (src/core/events.js): 'ghost.risen' { x, y }, 'ghost.slipped' { hits }, 'ghost.roaming' { x, y },
// 'ghost.tapped' { card, x, y }, 'ghost.rested' { }.

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { line } from '../core/lines.js';
import { defineSpeaker, sayAt } from '../core/speech.js';
import { hook } from '../core/debug.js';
import { isCrazy } from '../world/world.js';
import { overlay as fogOverlay, cover, bladeInHand } from './fog.js';
import { overlay as kiriOverlay, floodState as flooded } from './kiri.js';

const G = TUNE.ghost, TAU = Math.PI * 2;
let reduced = false, hero = null, layer = null, off = null;
let g = null;          // the ghost, or null
let laid = false;      // laid to rest: never again this visit
let lastT = null, coolUntil = 0, coverAt = 0, mourned = false, last = null;

const heroBox = () => { const r = hero.getBoundingClientRect(); return { l: r.left + scrollX, t: r.top + scrollY, w: r.width, h: r.height }; };
const view = () => ({ l: scrollX, t: scrollY, r: scrollX + document.documentElement.clientWidth, b: scrollY + innerHeight });

/** a faint word at the ghost */
function whisper(key) {
  if (!g || !layer) return null;
  const el = sayAt(g.x, g.y + G.WHISPER_DY * G.SIZE, key, { as: 'ghost' });
  Object.assign(el.style, { position: 'absolute', left: '0', top: '0', whiteSpace: 'nowrap', pointerEvents: 'none', fontStyle: 'italic', fontSize: '.95rem',
    fontWeight: '500', letterSpacing: '.04em', color: 'var(--muted)', opacity: '.8', textShadow: '0 0 8px var(--bg), 0 0 3px var(--bg)', animation: 'say var(--say, 1.3s) both' });
  return el;
}
/** a card's bubble above it (the flood would hide the cards' own layer) */
function cardSay(x, y) {
  const el = sayAt(x, y, 'card.ghost', { as: 'ghostCard' });
  Object.assign(el.style, { position: 'absolute', left: '0', top: '0', whiteSpace: 'nowrap', pointerEvents: 'none', background: 'var(--text)', color: 'var(--bg)',
    fontSize: '.82rem', fontWeight: '650', padding: '4px 11px', borderRadius: '12px', boxShadow: '0 6px 16px rgba(0,0,0,.2)', animation: 'say var(--say, 1.3s) both' });
  return el;
}

/** the new hand ate an old one: its ghost lingers in the banner fog (once; never after it was laid to rest) */
export function rise() {
  if (reduced || laid || g || !hero || isCrazy()) return;
  const b = heroBox();
  g = { st: 'fog', x: b.l + b.w / 2, y: b.t + b.h / 2, vx: 0, vy: 0, a: 0, life: 0, t: 0, hits: 0, dip: 0, tap: 0, card: null, tapped: new Set(), taps: G.TAPS,
    attend: null, seen: false, roamed: false, callAt: 0 };
  bus.emit('ghost.risen', { x: g.x, y: g.y });
}

/** an old hand comes to bow to it (src/reactions.js, after severed salute): it hovers over that spot (page px [x, y]) */
export function attend(at) {
  if (!g || g.st !== 'roam' || !at) return;
  mourned = true; g.attend = { x: at[0], y: at[1], until: g.life + G.ATTEND_S }; g.card = null;
}
/** the old hand bows to it: it bows back */
export function bowBack() {
  if (!g || g.dip > 0 || g.st === 'bow') return;
  g.dip = G.DIP_S; whisper('ghost.bowed');
  if (g.attend) g.attend.until = Math.min(g.attend.until, g.life + G.DIP_S + 0.6);
}

function set(st) { g.st = st; g.t = 0; }

/** laid to rest: a small bow, and it fades */
function rest() { set('bow'); g.vx = g.vy = 0; whisper('ghost.rest'); }

function slip(px, py, mx, my) {
  g.hits++;
  bus.emit('ghost.slipped', { hits: g.hits });
  if (g.hits >= G.WIPES) { rest(); return; }
  let dx = g.x - px, dy = g.y - py, d = Math.hypot(dx, dy);
  if (d < 1) { dx = mx; dy = my; d = Math.hypot(dx, dy) || 1; }
  g.vx = dx / d * G.SLIP_SPEED; g.vy = dy / d * G.SLIP_SPEED;
  set('slip');
  whisper('ghost.wave');
}

const ease = (k, dt) => 1 - Math.exp(-dt * k);
function toward(tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy), s = Math.min(d, speed * dt);
  if (d > 0.01) { g.x += dx / d * s; g.y += dy / d * s; }
  return d;
}

/** the next card in view to tap: the nearest it has not tapped in this flood */
function nextCard() {
  const v = view(), cards = [...document.querySelectorAll('#grid .card:not(.held)')];
  let best = null, bd = Infinity;
  for (let pass = 0; pass < 2 && !best; pass++) {
    for (const c of cards) {
      if (g.tapped.has(c)) continue;
      const r = c.getBoundingClientRect(); if (!r.width) continue;
      const x = r.left + scrollX + r.width / 2, y = r.top + scrollY + r.height / 2;
      if (x < v.l || x > v.r || y < v.t + 40 || y > v.b - 20) continue;
      const d = Math.hypot(x - g.x, y - g.y); if (d < bd) { bd = d; best = c; }
    }
    if (!best) g.tapped.clear();
  }
  return best;
}
function centre(c) { const r = c.getBoundingClientRect(); return [r.left + scrollX + r.width / 2, r.top + scrollY + r.height / 2, r.top + scrollY]; }

/** it taps a card: the card shivers and says so */
function tap(c) {
  const [x, y, top] = centre(c);
  if (typeof c.animate === 'function') {
    const p = G.SHIVER_PX;
    c.animate([{ translate: '0 0' }, { translate: `${p}px 0` }, { translate: `${-p}px ${p / 2}px` }, { translate: `${p}px ${-p / 2}px` }, { translate: `${-p / 2}px 0` }, { translate: '0 0' }],
      { duration: G.SHIVER_MS, easing: 'linear' });
  }
  cardSay(x, top + TUNE.speech.RIDE_DY);
  bus.emit('ghost.tapped', { card: c, x, y });
}

function roam(dt) {
  const f = flooded();
  if (!f || f.lifting) { set('fog'); g.card = null; g.attend = null; g.taps = G.TAPS; g.tapped.clear(); g.roamed = false; return; }
  if (!g.roamed) { g.roamed = true; whisper('ghost.roam'); }
  if (!mourned && g.life >= g.callAt) { g.callAt = g.life + G.CALL_MS / 1000; bus.emit('ghost.roaming', { x: g.x, y: g.y }); if (!g || g.st !== 'roam') return; }
  if (g.attend) {
    toward(g.attend.x, g.attend.y - G.HOVER_DY * G.SIZE, G.ROAM_SPEED, dt);
    if (g.life > g.attend.until) g.attend = null;
    return;
  }
  if (g.card && !g.card.isConnected) g.card = null;
  if (!g.card) {
    if (g.taps <= 0) { const v = view(); toward((v.l + v.r) / 2 + Math.sin(g.life * 0.5) * (v.r - v.l) * 0.3, (v.t + v.b) / 2 + Math.sin(g.life * 0.8) * (v.b - v.t) * 0.2, G.ROAM_SPEED * 0.4, dt); return; }
    g.card = nextCard(); g.tap = 0;
    if (!g.card) { g.taps = 0; return; }
  }
  if (g.tap > 0) {
    g.tap += dt;
    if (g.tap > G.TAP_S + G.TAP_GAP_S) { g.tapped.add(g.card); g.card = null; g.taps--; g.tap = 0; }
    return;
  }
  const [x, y] = centre(g.card);
  if (toward(x, y, G.ROAM_SPEED, dt) < 8) { g.tap = dt; tap(g.card); }
}

/** one frame (wall ms t, from the fog's or the flood's frame; once per t) */
function update(t) {
  if (!g) return;
  if (lastT === t) return;
  const dt = lastT == null ? 0 : Math.min(0.05, Math.max(0, (t - lastT) / 1000)); lastT = t;
  g.life += dt; g.t += dt; g.dip = Math.max(0, g.dip - dt);
  if (g.st !== 'bow') g.a = Math.min(1, g.life / G.RISE_S);
  const f = flooded();
  if (g.st === 'fog') {
    if (f && f.in && !f.lifting) { set('roam'); return; }
    const b = heroBox(), [ax, ay] = G.DRIFT, [rx, ry] = G.DRIFT_RATE, k = ease(G.EASE, dt);
    const tx = b.l + b.w / 2 + ax * b.w * Math.sin(g.life * rx * TAU), ty = b.t + b.h / 2 + ay * b.h * Math.sin(g.life * ry * TAU + 1);
    g.x += (tx - g.x) * k; g.y += (ty - g.y) * k;
    if (!f && g.a >= 1 && clock.wall() >= coverAt) { coverAt = clock.wall() + G.COVER_MS; if (cover() < G.REST_COVER) rest(); }
  } else if (g.st === 'slip') {
    g.x += g.vx * dt; g.y += g.vy * dt; const d = Math.exp(-G.DAMP * dt); g.vx *= d; g.vy *= d;
    if (g.t > G.WAVE_S) set(f && f.in && !f.lifting ? 'roam' : 'fog');
  } else if (g.st === 'roam') roam(dt);
  else if (g.st === 'bow') {
    g.a = Math.max(0, 1 - g.t / G.BOW_S);
    if (g.t >= G.BOW_S) {
      g = null; laid = true;
      bus.emit('ghost.rested', {});
      bus.emit('ui.toast', { msg: line('toast.ghost') });
    }
  }
}

// ---- drawing: a pale hand with a wisp for a wrist, two hollow eyes; it waves, taps, bows ----
function shape(c, time) {
  const wave = g.st === 'slip' ? Math.max(0, 1 - g.t / G.WAVE_S) : 0;
  const bow = g.st === 'bow' ? Math.sin(Math.min(1, g.t / (G.BOW_S * 0.5)) * Math.PI / 2) : g.dip > 0 ? Math.sin(Math.PI * (1 - g.dip / G.DIP_S)) : 0;
  const tapping = g.st === 'roam' && g.tap > 0 && g.tap < G.TAP_S ? Math.sin(Math.PI * g.tap / G.TAP_S) : 0;
  c.rotate(wave * Math.sin(time * 9) * 0.45 + bow * 0.55);
  c.translate(0, tapping * 14 + bow * 10);
  c.scale(1, 1 - bow * 0.12);
  c.beginPath();
  // the wisp where the wrist would be
  const sw = Math.sin(time * 2.2) * 6;
  c.moveTo(24, 30); c.bezierCurveTo(26, 58, 18, 78, 12 + sw * 0.3, 102);   // (clockwise, as roundRect: the parts add up under nonzero)
  c.quadraticCurveTo(5 + sw * 0.4, 92, -2 + sw * 0.6, 106); c.quadraticCurveTo(-8 + sw, 92, -14 + sw, 104);
  c.bezierCurveTo(-18 + sw, 80, -26, 60, -24, 30); c.closePath();
  c.roundRect(-28, -18, 56, 60, 20);
  const len = [38, 46, 44, 34];
  for (let i = 0; i < 4; i++) {
    const x = -21 + i * 14, curl = tapping && i !== 1 ? 0.35 : 0, l = len[i] * (1 - curl);
    c.save(); c.translate(x, -12); c.rotate((i - 1.5) * 0.09 + Math.sin(time * 5 + i * 1.3) * (0.05 + wave * 0.2));
    c.roundRect(-6, -l, 12, l + 8, 6); c.restore();
  }
  c.save(); c.translate(-24, 16); c.rotate(2.21 - wave * Math.sin(time * 9 + 1) * 0.2); c.roundRect(-6, -4, 12, 32, 6); c.restore();
  c.fillStyle = 'rgba(255,255,255,0.86)'; c.shadowColor = 'rgba(120,135,175,0.75)'; c.shadowBlur = 14;
  c.fill();
  c.shadowBlur = 0; c.fillStyle = 'rgba(70,76,104,0.55)';
  c.beginPath(); c.ellipse(-9, 8, 4, bow > 0.4 ? 1.2 : 6, 0, 0, TAU); c.ellipse(9, 8, 4, bow > 0.4 ? 1.2 : 6, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(0, 24, 3, wave ? 4 : 2.5, 0, 0, TAU); c.fill();
}

/** draw the ghost on ctx (fog or flood), hidden by the mask where the fog is thin */
function draw(ctx, v) {
  const R = 135 * G.SIZE, lx = g.x - v.ox, ly = g.y - v.oy;
  if (g.a <= 0 || lx < -R || ly < -R || lx > v.w + R || ly > v.h + R) return false;
  const k = ctx.getTransform().a || 1, n = Math.max(1, Math.ceil(2 * R * k));
  if (!off) off = document.createElement('canvas');
  if (off.width !== n) { off.width = n; off.height = n; }
  const c = off.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, n, n);
  c.setTransform(k * G.SIZE, 0, 0, k * G.SIZE, n / 2, n / 2);
  shape(c, v.t / 1000);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in';
  const sx = (lx - R + v.mx) * v.ms, sy = (ly - R + v.my) * v.ms, sw = 2 * R * v.ms;
  for (let i = 0; i < G.MASK_POW; i++) c.drawImage(v.mask, sx, sy, sw, sw, 0, 0, n, n);
  c.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = g.a * v.fade * G.ALPHA; ctx.drawImage(off, lx - R, ly - R, 2 * R, 2 * R); ctx.restore();
  return true;
}

function onFog(ctx, v) {
  update(v.t);
  if (!g || flooded()) return;
  if (draw(ctx, v) && !g.seen && g.a > 0.6 && g.st === 'fog') { g.seen = true; whisper('ghost.drift'); }
}
function onKiri(ctx, v) { update(v.t); if (g) draw(ctx, v); }

/** your pointer went through it (page px): it slips away */
function moved(e) {
  const px = e.clientX + scrollX, py = e.clientY + scrollY, now = clock.wall();
  const prev = last; last = { x: px, y: py, t: now };
  if (!g || (g.st !== 'fog' && g.st !== 'roam') || g.a < 0.5 || now < coolUntil || bladeInHand() || isCrazy()) return;
  if (g.st === 'fog') { const b = heroBox(); if (px < b.l || px > b.l + b.w || py < b.t || py > b.t + b.h) return; }
  if (Math.hypot(px - g.x, py - g.y) > G.HIT_R * G.SIZE || !prev) return;
  const d = Math.hypot(px - prev.x, py - prev.y), speed = d / Math.max(0.001, (now - prev.t) / 1000);
  if (speed < G.HIT_SPEED) return;
  coolUntil = now + G.COOL_MS;
  slip(px, py, px - prev.x, py - prev.y);
}

export function install(app) {
  reduced = !!app.reduced;
  if (reduced) return;
  hero = document.getElementById('hero');
  if (!hero) return;
  layer = document.createElement('div'); layer.className = 'ghost-layer'; layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '0', height: '0', overflow: 'visible', zIndex: '49', pointerEvents: 'none' });
  document.body.appendChild(layer);
  defineSpeaker('ghost', { prefix: 'ghost.', tilt: false, layer: () => layer });
  defineSpeaker('ghostCard', { prefix: 'card.', tilt: false, layer: () => layer });
  fogOverlay(onFog);
  kiriOverlay(onKiri);
  document.addEventListener('pointermove', moved, { passive: true });
  hook('__ghost', { rise, attend, bowBack, get: () => g, laid: () => laid });
}
