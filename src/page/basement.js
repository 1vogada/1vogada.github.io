// The basement: at the very bottom of the page, keep scrolling down (TUNE.basement.PUSHES more wheel pushes or swipes) and the
// footer lifts like a trapdoor onto the hand's trophy wall: every card and piece it ate on this visit ('hand.ate') and every old
// hand it ate ('hand.devoured'), pinned up in the order it ate them. Scroll up, click, tap or press Escape and the lid drops
// back. Nothing hints at it. The trophies are kept in sessionStorage (a copy of each card as it went down), so a reload keeps them.
// The toast you fed it (page/bread.js, kind 'toast') is kept as its message and pinned up as a slice of bread (bread.js look()).
// Styles are set from here (inline), so styles/*.css stay as they were. Random draws: the plaque's line, only when the wall opens.
import { TUNE } from '../core/tune.js';
import { clock, real } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { line } from '../core/lines.js';
import { isCrazy } from '../world/world.js';
import { look } from './bread.js';

const B = TUNE.basement, KEY = 'kiripad-trophies';
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
let shelf = null, wall = null, lid = null, pushes = 0, last = -1e9, sum = 0, touchY = null;

function load() {
  if (shelf) return shelf;
  try { shelf = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { shelf = []; }
  if (!Array.isArray(shelf)) shelf = [];
  return shelf;
}
function keep(t) {
  const s = load(); s.push({ ...t, at: Date.now() });
  if (s.length > B.MAX) s.splice(0, s.length - B.MAX);
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}
/** the card as it went down its throat: a copy without its place on the page, its id or its state */
function stuff(o) {
  if (!o || !o.el) return;
  if (o.kind === 'toast') return keep({ kind: 'toast', msg: o.msg || '' });   // the slice of bread: its message is enough to make it again
  const el = o.el.cloneNode(true);
  el.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id'));
  const c1 = o.el.style.getPropertyValue('--c1'), clip = o.el.style.clipPath;
  el.removeAttribute('style'); el.className = 'card';
  keep({ kind: o.kind, w: o.w, h: o.h, c1, clip, html: el.outerHTML });
}
/** what it ate so far, oldest first */
export const trophies = () => load().slice();

const css = (el, s) => { Object.assign(el.style, s); return el; };
const div = (s, text) => { const d = css(document.createElement('div'), s); if (text != null) d.textContent = text; return d; };
const hhmm = (ms) => { const t = new Date(ms), p = (n) => String(n).padStart(2, '0'); return `${p(t.getHours())}:${p(t.getMinutes())}`; };

/** one trophy on the wall: the card under a pin, or the old hand on a mounted shield */
function frame(t, i) {
  const S = B.TROPHY_PX, tilt = ((i * 37) % 9) - 4;
  const box = div({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', rotate: tilt + 'deg' });
  if (t.kind === 'hand') {
    const shield = div({ width: S * 0.7 + 'px', height: S * 0.8 + 'px', borderRadius: '10px 10px 50% 50% / 10px 10px 38% 38%', display: 'grid', placeItems: 'center',
      background: 'linear-gradient(160deg, #8a5a36, #5b3a22)', boxShadow: '0 8px 18px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.08)' });
    shield.appendChild(div({ fontFamily: MINCHO, fontSize: S * 0.38 + 'px', fontWeight: '800', color: '#c8372d', textShadow: '0 2px 0 rgba(0,0,0,.35)' }, '手'));
    box.append(shield, div({ font: '600 .72rem/1.2 system-ui, sans-serif', color: '#e9dcc6', letterSpacing: '.06em', textTransform: 'uppercase' }, 'its old hand · ' + hhmm(t.at)));
    return box;
  }
  if (t.kind === 'toast') {   // the toast it ate, pinned through the crust
    const slice = div({ position: 'relative' });
    slice.appendChild(look(div({ pointerEvents: 'none' }), t.msg));
    slice.appendChild(div({ position: 'absolute', left: '50%', top: '2px', width: '14px', height: '14px', marginLeft: '-7px', borderRadius: '50%', zIndex: '2',
      background: 'radial-gradient(circle at 35% 35%, #ff8a7a, #c8372d 60%, #7d1d16)', boxShadow: '0 3px 4px rgba(0,0,0,.5)' }));   // the pin
    box.append(slice, div({ font: '600 .72rem/1.2 system-ui, sans-serif', color: '#e9dcc6', letterSpacing: '.06em', textTransform: 'uppercase' }, 'toast · ' + hhmm(t.at)));
    return box;
  }
  const s = S / (t.w || S), card = div({ position: 'relative', width: S + 'px', height: (t.h || S) * s + 'px' });
  const inner = document.createElement('div'); inner.innerHTML = t.html || '';
  const c = inner.firstChild || div({});
  css(c, { position: 'absolute', left: '0', top: '0', width: t.w + 'px', height: t.h + 'px', transform: `scale(${s})`, transformOrigin: '0 0', margin: '0',
    animation: 'none', opacity: '1', visibility: 'visible', pointerEvents: 'none', boxShadow: '0 8px 16px rgba(0,0,0,.45)' });
  if (t.c1) c.style.setProperty('--c1', t.c1);
  if (t.clip) c.style.clipPath = t.clip;
  card.appendChild(c);
  card.appendChild(div({ position: 'absolute', left: '50%', top: '-6px', width: '14px', height: '14px', marginLeft: '-7px', borderRadius: '50%', zIndex: '2',
    background: 'radial-gradient(circle at 35% 35%, #ff8a7a, #c8372d 60%, #7d1d16)', boxShadow: '0 3px 4px rgba(0,0,0,.5)' }));   // the pin
  box.append(card, div({ font: '600 .72rem/1.2 system-ui, sans-serif', color: '#e9dcc6', letterSpacing: '.06em', textTransform: 'uppercase' }, (t.kind === 'piece' ? 'a piece · ' : 'eaten · ') + hhmm(t.at)));
  return box;
}

const height = () => Math.min(B.H_MAX, innerHeight * B.H_VH);
/** the lid's open pose: its top edge on the wall's top edge (the hinge), swung up towards you */
const lifted = (l) => `translateY(${-(height() - l.offsetHeight)}px) perspective(700px) rotateX(-${B.LID_DEG}deg)`;
function open() {
  if (wall) return;
  lid = document.querySelector('footer.bottom');
  const H = height(), all = trophies();
  wall = div({ position: 'fixed', left: '0', right: '0', bottom: '0', height: H + 'px', zIndex: '41', overflow: 'auto', padding: `${(lid ? lid.offsetHeight : 0) + 34}px 16px 30px`, boxSizing: 'border-box',   // under the open lid
    background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 46px), repeating-linear-gradient(90deg, rgba(255,255,255,.03) 0 1px, transparent 1px 96px), linear-gradient(#3a2b22, #241a14)',
    boxShadow: 'inset 0 24px 30px -12px rgba(0,0,0,.7)', color: '#e9dcc6' });
  wall.className = 'basement'; wall.setAttribute('role', 'dialog'); wall.setAttribute('aria-label', 'The trophy wall');
  const plaque = div({ margin: '0 auto 26px', width: 'fit-content', maxWidth: '100%', padding: '8px 18px', borderRadius: '6px', font: '700 .95rem/1.3 system-ui, sans-serif',
    letterSpacing: '.08em', textTransform: 'uppercase', color: '#3a2412', background: 'linear-gradient(#e7c77d, #b98f3e)', boxShadow: '0 4px 10px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.5)', textAlign: 'center' }, line('page.trophy'));
  const pins = div({ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '34px 30px', maxWidth: '1100px', margin: '0 auto' });
  all.forEach((t, i) => pins.appendChild(frame(t, i)));
  if (!all.length) pins.appendChild(div({ font: 'italic 1rem/1.4 system-ui, sans-serif', opacity: '.8', paddingTop: '20px' }, line('page.trophyEmpty')));
  wall.append(plaque, pins);
  document.body.appendChild(wall);
  wall.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: B.OPEN_MS, easing: 'cubic-bezier(.2,1.1,.4,1)' });
  // the footer is the lid: hinged at its top edge, it swings up and open over the wall
  if (lid) {
    lid.dataset.was = lid.getAttribute('style') || '';
    css(lid, { position: 'relative', zIndex: '42', transformOrigin: '50% 0', willChange: 'transform', background: 'var(--surface)', boxShadow: '0 -10px 24px rgba(0,0,0,.35)',
      borderTop: '1px solid var(--border)', borderBottom: '6px solid #5b3a22' });
    lid.animate([{ transform: 'none' }, { transform: lifted(lid) }], { duration: B.OPEN_MS, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'forwards' });
  }
}
function close() {
  if (!wall) return;
  const w = wall, l = lid; wall = null; lid = null; pushes = 0; sum = 0;
  w.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: B.OPEN_MS * 0.6, easing: 'ease-in', fill: 'forwards' });
  if (l) { const shut = lifted(l); l.getAnimations().forEach((a) => a.cancel()); l.animate([{ transform: shut }, { transform: 'none' }], { duration: B.OPEN_MS * 0.6, easing: 'cubic-bezier(.5,0,.8,.4)' }); }
  real.after(B.OPEN_MS * 0.6, () => { w.remove(); if (l) { l.setAttribute('style', l.dataset.was || ''); delete l.dataset.was; if (!l.getAttribute('style')) l.removeAttribute('style'); } });
}

/** something else is over the page, or it is not the calm page */
function busy() {
  const R = document.documentElement, reader = document.getElementById('reader'), omi = document.getElementById('omikuji');
  return isCrazy() || R.classList.contains('pb-lock') || (reader && !reader.hidden) || (omi && !omi.hidden);
}
const atBottom = () => scrollY + innerHeight >= document.documentElement.scrollHeight - B.BOTTOM_PX;
/** one more push down at the bottom of the page */
function push(t) {
  if (t - last > B.RESET_MS) pushes = 0;
  last = t; sum = 0;
  if (++pushes >= B.PUSHES) { pushes = 0; open(); }
}

export function install(app) {
  bus.on('hand.ate', ({ card }) => stuff(card));
  bus.on('hand.devoured', () => keep({ kind: 'hand' }));
  addEventListener('wheel', (e) => {
    if (wall) { if (e.deltaY < 0) close(); return; }
    const t = clock.wall(), gap = t - last;
    if (e.deltaY <= 0 || busy() || !atBottom()) { last = t; sum = 0; if (e.deltaY < 0) pushes = 0; return; }
    sum += e.deltaY;
    if (gap > B.GAP_MS || sum > B.PUSH_PX) push(t); else last = t;
  }, { passive: true });
  addEventListener('touchstart', (e) => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (touchY == null || !e.changedTouches.length) return;
    const dy = touchY - e.changedTouches[0].clientY; touchY = null;
    if (wall) { if (dy < -B.TOUCH_PX) close(); return; }
    if (dy > B.TOUCH_PX && !busy() && atBottom()) push(clock.wall());
  }, { passive: true });
  document.addEventListener('pointerdown', () => { if (wall) close(); }, true);
  document.addEventListener('keydown', (e) => { if (wall && e.key === 'Escape') close(); });
}
