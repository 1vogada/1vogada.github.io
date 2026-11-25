// Small easter eggs on the page itself (nothing hints at them):
//   1926                     hover the © year in the footer for TUNE.eggs.YEAR_MS: it reads 1926 and the page goes sepia
//                            under film grain. It emits 'page.film' { on } both ways: in 1926 every bubble is a silent-film
//                            title card and the hands move in jerky steps (src/reactions.js). Chain silent-film: the reel keeps
//                            rolling TUNE.film.LINGER_MS after the pointer leaves the year (so you can go and pull a card, or cut
//                            one), holds while the pointer is back on the year, then ends on a last title card (page.filmEnd)
//                            and END_MS later the colour comes back. No random draw but that card's line
//   too many light switches  flip the theme button TUNE.eggs.SWITCHES times within SWITCH_MS: the hero's sun becomes a moon
//                            with the hand's eye in it, for the rest of the visit
//   apologise to the card    right-click a card that is out of its slot (whole or torn): a tiny menu, one option,
//                            "apologise". It forgives you (TUNE.apology.YES) or not; ask twice and it is not impressed
// Styles are set from here (inline), so styles/*.css stay as they were. The only random draw is the card's answer, on your click.
import { TUNE } from '../core/tune.js';
import { real, clock } from '../core/clock.js';
import { isCrazy } from '../world/world.js';
import { say, sayAt, speaker } from '../core/speech.js';
import { bus } from '../core/bus.js';
import { hook } from '../core/debug.js';

const E = TUNE.eggs, F = TUNE.film, SVG = 'http://www.w3.org/2000/svg';
const GRAIN = "url(\"data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>") + "\")";

let old = null;
function to1926(yr) {
  if (old || isCrazy()) return;
  old = { text: yr.textContent, filter: document.body.style.filter };
  yr.textContent = '1926';
  bus.emit('secret.found', { name: '1926' });
  document.body.style.transition = 'filter .8s'; document.body.style.filter = 'sepia(.85) contrast(1.08) brightness(.97)';
  const g = document.createElement('div'); g.id = 'grain';
  Object.assign(g.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '60', backgroundImage: GRAIN, opacity: '0', transition: 'opacity .8s', mixBlendMode: 'multiply' });
  document.body.after(g); requestFrame(() => { g.style.opacity = '.5'; });
  bus.emit('page.film', { on: true });
}
function back(yr) {
  if (!old) return;
  yr.textContent = old.text; document.body.style.filter = old.filter; old = null;
  const g = document.getElementById('grain'); if (g) { g.style.opacity = '0'; real.after(800, () => g.remove()); }
  bus.emit('page.film', { on: false });
}
const requestFrame = (fn) => real.after(30, fn);
// the reel runs out: a last title card in the middle of the window
function theEnd() {
  const layer = speaker('page') && speaker('page').layer && speaker('page').layer();
  if (layer) sayAt(scrollX + document.documentElement.clientWidth / 2, scrollY + innerHeight * 0.38, 'page.filmEnd');
}

function moon() {
  const sun = document.querySelector('#hero svg.scene circle'); if (!sun || sun.dataset.moon) return;
  sun.dataset.moon = '1';
  bus.emit('secret.found', { name: 'moon' });
  const cx = +sun.getAttribute('cx'), cy = +sun.getAttribute('cy'), r = +sun.getAttribute('r');
  sun.style.transition = 'fill 1.2s, opacity 1.2s'; sun.setAttribute('fill', '#efe9d8'); sun.setAttribute('opacity', '1');
  const g = document.createElementNS(SVG, 'g'); g.setAttribute('class', 'moon-eye');
  const el = (tag, a) => { const e = document.createElementNS(SVG, tag); for (const k in a) e.setAttribute(k, a[k]); g.appendChild(e); return e; };
  el('circle', { cx: cx - 22, cy: cy + 18, r: 9, fill: '#d6cfbd' }); el('circle', { cx: cx + 26, cy: cy - 24, r: 6, fill: '#d6cfbd' });   // craters
  const eye = el('ellipse', { cx, cy, rx: r * 0.42, ry: 0.5, fill: '#1d1a19' });
  const iris = el('ellipse', { cx, cy, rx: 7, ry: 0.4, fill: '#c8372d' });
  sun.after(g);
  eye.animate([{ ry: '0.5px' }, { ry: `${r * 0.2}px` }], { duration: 900, delay: 600, fill: 'forwards', easing: 'ease-out' });
  iris.animate([{ ry: '0.4px' }, { ry: `${r * 0.18}px` }], { duration: 900, delay: 600, fill: 'forwards', easing: 'ease-out' });
  // it watches the pointer, and blinks now and then
  document.addEventListener('pointermove', (e) => { const b = sun.getBoundingClientRect(), dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2), d = Math.hypot(dx, dy) || 1; iris.setAttribute('cx', String(cx + (dx / d) * 12)); iris.setAttribute('cy', String(cy + (dy / d) * 5)); }, { passive: true });
  real.every(5200, () => { eye.animate([{ ry: `${r * 0.2}px` }, { ry: '0.5px' }, { ry: `${r * 0.2}px` }], { duration: 220 }); iris.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 220 }); });
}

// ---- apologise to the card ----
const A = TUNE.apology;
let menu = null;
function closeMenu() { if (menu) { menu.el.remove(); menu.stop(); menu = null; } }
function sorry(o) {
  closeMenu();
  if (!o.el || !o.el.isConnected) return;
  const key = o.sorry ? 'card.again' : Math.random() < A.YES ? 'card.forgive' : 'card.grudge';
  o.sorry = true;
  say(o, key, { mode: 'plain' });
  if (key === 'card.forgive') o.el.animate([{ filter: 'none' }, { filter: 'drop-shadow(0 0 10px rgba(255, 200, 120, .9))' }, { filter: 'none' }], { duration: 1200 });
  else if (key === 'card.grudge') o.el.animate([{ translate: '0 0' }, { translate: '-4px 0' }, { translate: '4px 0' }, { translate: '0 0' }], { duration: 260, iterations: 2 });
}
function openMenu(o, x, y) {
  closeMenu();
  const el = document.createElement('div'); el.className = 'sorry-menu'; el.setAttribute('role', 'menu');
  Object.assign(el.style, { position: 'fixed', left: x + 'px', top: y + 'px', zIndex: '70', background: 'var(--surface)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow)', padding: '4px', font: '13px/1.2 system-ui, sans-serif' });
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = 'apologise';
  Object.assign(b.style, { font: 'inherit', color: 'inherit', background: 'transparent', border: '0', borderRadius: '5px', padding: '6px 14px', cursor: 'pointer' });
  b.addEventListener('pointerenter', () => { b.style.background = 'var(--accent-soft)'; });
  b.addEventListener('pointerleave', () => { b.style.background = 'transparent'; });
  b.addEventListener('click', () => sorry(o));
  el.appendChild(b); document.body.appendChild(el); b.focus({ preventScroll: true });
  menu = { el, stop: real.after(A.MENU_MS, closeMenu) };
}

export function install(app) {
  document.addEventListener('contextmenu', (e) => {
    const t = e.target.closest?.('#phys .phys'), o = t && t._o;
    if (!o || (o.kind !== 'card' && o.kind !== 'piece') || isCrazy()) return;
    e.preventDefault(); openMenu(o, e.clientX, e.clientY);
  });
  document.addEventListener('pointerdown', (e) => { if (menu && !menu.el.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  addEventListener('scroll', closeMenu, { passive: true });

  hook('__film', TUNE.film);   // live: a scenario shortens the reel
  const yr = document.getElementById('yr');
  if (yr) {
    let cancel = null, reel = null;
    const stop = () => { if (reel) { reel(); reel = null; } };
    yr.addEventListener('pointerenter', () => { if (old) { stop(); return; } if (cancel) cancel(); cancel = real.after(E.YEAR_MS, () => { cancel = null; to1926(yr); }); });
    yr.addEventListener('pointerleave', () => { if (cancel) { cancel(); cancel = null; } if (old && !reel) reel = real.after(F.LINGER_MS, () => { reel = real.after(F.END_MS, () => { reel = null; back(yr); }); theEnd(); }); });
  }
  const btn = document.getElementById('theme');
  if (btn) {
    const clicks = [];
    btn.addEventListener('click', () => { const t = clock.wall(); clicks.push(t); while (clicks.length && t - clicks[0] > E.SWITCH_MS) clicks.shift(); if (clicks.length >= E.SWITCHES) moon(); });
  }
}
