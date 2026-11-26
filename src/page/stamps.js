// The stamp book (stamps chain): press and hold the seal in the header (the red hanko of the logo) for TUNE.stamps.HOLD_MS and
// a small station-stamp card (an eki stamp book page: cream paper, red ink) slides out under it, one circle per secret of the
// site. A secret you have found is a red stamp: two rings, its drawn motif, its name round the rim. One you have not is a
// faint dashed outline with a vague hint in it, never its name. A secret found since you last looked thumps down onto the card
// when it opens (or at once, if the card is open when you find it). Found secrets live in localStorage, so they stay across visits.
// A short click on the seal still does what it did (the link home): only a press that reached HOLD_MS swallows its click.
// Escape, the ×, or a press anywhere off the card puts it away.
//
// Each secret is an event that already fires (docs/events.md), or 'secret.found' { name } where there was none (1926, the moon,
// the Konami code, the basement, the diary, the fallen toast). Nothing here draws Math.random except the card's two lines, and
// only when the card opens. Styles are inline (styles/*.css stay as they were).
import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { real } from '../core/clock.js';
import { line } from '../core/lines.js';
import { hook } from '../core/debug.js';
import { isCrazy } from '../world/world.js';

const S = TUNE.stamps, KEY = 'kiripad-stamps', INK = '#c8372d', SVG = 'http://www.w3.org/2000/svg';
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

// ---- the secrets: id, the kanji on the top of the rim, the name on the bottom, a vague hint, what finds it, the motif ----
// motifs are SVG in a 24 x 24 box, drawn with currentColor strokes (fill="currentColor" where a part is solid)
export const STAMPS = [
  { id: 'shelf', jp: '棚', name: 'SHELF', hint: 'a word in the haze', on: ['shelf.opened'],
    art: '<path d="M2.5 16h19M5 16v4M19 16v4"/><path d="M6 16V8h3.5v8M11 16V6h3v10"/><path d="M15.5 16l2.2-6.5 2.8 1-2 5.5"/>' },
  { id: 'kiri', jp: '霧', name: 'FOG', hint: 'the footer whispers', on: ['kiri.flooded'],
    art: '<path d="M3 8c2.5-2 5 2 7.5 0s5 2 7.5 0 2.5 1 3 .5M3 12.5c2.5-2 5 2 7.5 0s5 2 7.5 0 2.5 1 3 .5M5 17c2.5-2 5 2 7.5 0s4 2 6 0"/>' },
  { id: 'katana', jp: '刀', name: 'KATANA', hint: 'something sharp in the mist', on: ['katana.drawn'],
    art: '<path d="M3 21l3.6-3.6"/><path d="M5.4 15.2l3.4 3.4"/><path d="M7.6 16.4L19.5 4.5l1 .3-.6 1.4L8.8 17.6"/>' },
  { id: 'severed', jp: '手', name: 'CUT OFF', hint: 'the edge has a wrist', on: ['hand.severed'],
    art: '<path d="M8.5 15V7a1.2 1.2 0 0 1 2.4 0v5M10.9 11V5a1.2 1.2 0 0 1 2.4 0v6M13.3 11V6a1.2 1.2 0 0 1 2.4 0v6M15.7 12V9a1.2 1.2 0 0 1 2.4 0v4.5c0 3-1.8 5.5-5 5.5h-1.5c-2 0-3-1-4.3-3l-2-3.2a1.2 1.2 0 0 1 2-1.3l1 1.5"/><path d="M3.5 21.5l17-3" stroke-dasharray="2 1.6"/>' },
  { id: 'devoured', jp: '食', name: 'DEVOURED', hint: 'hands are not picky', on: ['hand.devoured'],
    art: '<path d="M3 9.5c4-4.5 14-4.5 18 0M3 14.5c4 4.5 14 4.5 18 0"/><path d="M6 8.3l1.2 3 1.2-3.6M10.2 7.3l1.2 3.2 1.2-3.3M14.6 7.4l1.2 3.1 1.2-2.7M7.2 15.8l1.2-3 1.2 3.5M11.4 16.7l1.2-3.2 1.2 3.2M15.6 16.2l1.2-3 1.1 2.4"/>' },
  { id: 'edge', jp: '縁', name: 'ON EDGE', hint: 'one in a hundred', on: [['coin.tossed', (e) => e && e.side === 'edge']],
    art: '<path d="M4 20h16"/><ellipse cx="12" cy="12" rx="3.2" ry="7.6"/><path d="M12 4.4v15.2M10.4 7v10M13.6 7v10" stroke-width=".7"/>' },
  { id: '1926', jp: '昭和', name: '1926', hint: 'linger at the bottom', on: [['secret.found', (e) => e && e.name === '1926']],
    art: '<rect x="2.5" y="6" width="19" height="12" rx="1"/><path d="M2.5 8.2h19M2.5 15.8h19" stroke-width=".7"/><text x="12" y="14.2" text-anchor="middle" font-size="6" font-family="Georgia, serif" font-weight="700" fill="currentColor" stroke="none">1926</text>' },
  { id: 'moon', jp: '月', name: 'MOON', hint: 'too much switching', on: [['secret.found', (e) => e && e.name === 'moon']],
    art: '<circle cx="12" cy="12" r="8.5"/><path d="M7 12q5-4.2 10 0q-5 4.2-10 0z"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>' },
  { id: 'konami', jp: '籤', name: 'KONAMI', hint: 'an old code', on: [['secret.found', (e) => e && e.name === 'konami']],
    art: '<path d="M9.5 2.5h5v19h-5z"/><path d="M7 11h10M7 13.2h10"/><path d="M12 5l-1.3 1.4M12 5l1.3 1.4M12 16.8l-1.3 1.4M12 16.8l1.3 1.4"/>' },
  { id: 'basement', jp: '地下', name: 'BASEMENT', hint: 'below the bottom', on: [['secret.found', (e) => e && e.name === 'basement']],
    art: '<path d="M6 3.5h12v7c0 5.2-3 8.3-6 9.5-3-1.2-6-4.3-6-9.5z"/><text x="12" y="14.5" text-anchor="middle" font-size="8" font-weight="800" fill="currentColor" stroke="none">手</text>' },
  { id: 'diary', jp: '言葉', name: 'DIARY', hint: 'a word in the book', on: [['secret.found', (e) => e && e.name === 'diary']],
    art: '<path d="M3.5 5.5c3-1.2 6-1 8.5 1v14c-2.5-2-5.5-2.2-8.5-1zM20.5 5.5c-3-1.2-6-1-8.5 1v14c2.5-2 5.5-2.2 8.5-1z"/><path d="M6 9.5h3.5M6 12h3.5M14.5 9.5H18M14.5 12H18" stroke-width=".7"/>' },
  { id: 'toast', jp: 'パン', name: 'TOAST', hint: 'pester the messenger', on: [['secret.found', (e) => e && e.name === 'toast']],
    art: '<path d="M5.5 20.5V11a4.6 4.6 0 0 1 1.5-8h10a4.6 4.6 0 0 1 1.5 8v9.5z"/><circle cx="9.5" cy="12" r=".9" fill="currentColor"/><circle cx="14" cy="15.5" r="1.1" fill="currentColor"/><circle cx="13.5" cy="9.5" r=".7" fill="currentColor"/>' },
  { id: 'fed', jp: '検索', name: 'FED IT', hint: 'the box looks hungry', on: ['search.fed'],
    art: '<circle cx="10" cy="10" r="6.5"/><path d="M14.8 14.8L21 21"/><rect x="7.6" y="7.4" width="4.8" height="5.4" rx=".6" stroke-width=".8"/>' },
  { id: 'slashed', jp: '斬', name: 'SLASHED', hint: 'cut the writing', on: ['tana.slashed'],
    art: '<text x="12" y="17.5" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor" stroke="none">棚</text><path d="M2.5 19.5L21.5 4.5" stroke-width="1.8"/>' },
  { id: 'dance', jp: '踊', name: 'DANCE', hint: 'a crazy party', on: [['sev.state', (e) => e && e.to === 'dance']],
    art: '<path d="M9 18V6.5l10-2.2v11.5"/><path d="M9 9.3l10-2.2"/><ellipse cx="6.8" cy="18" rx="2.3" ry="1.8" fill="currentColor"/><ellipse cx="16.8" cy="15.8" rx="2.3" ry="1.8" fill="currentColor"/>' },
  { id: 'pester', jp: '突', name: 'PESTER', hint: 'sit very still', on: ['sev.pestered'],
    art: '<path d="M4 3l11.5 9-5 .8 3 6.2-2.2 1.1-3-6.3L4.6 17z"/><path d="M17 4.5l2-1.5M18.5 8l2.4-.4M15.5 2.2l.3-1.2" stroke-width="1"/>' },
];

// ---- what you found: { found: { id: ms }, seen: [ids already shown on the card] } ----
let store = null;
function load() {
  if (store) return store;
  try { store = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { store = null; }
  if (!store || typeof store !== 'object') store = {};
  if (!store.found || typeof store.found !== 'object') store.found = {};
  if (!Array.isArray(store.seen)) store.seen = [];
  return store;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) {} }

/** the ids found so far, in card order */
export const found = () => STAMPS.filter((s) => load().found[s.id]).map((s) => s.id);

/** a secret was found (once; again is nothing). If the card is open it thumps down at once */
export function mark(id) {
  const st = load();
  if (st.found[id] || !STAMPS.some((s) => s.id === id)) return false;
  st.found[id] = Date.now(); save();
  if (card) thumpIn(id);
  return true;
}

// ---- the card ----
const css = (el, s) => { Object.assign(el.style, s); return el; };
const div = (s, text) => { const d = css(document.createElement('div'), s); if (text != null) d.textContent = text; return d; };
const tiltOf = (i) => ((i * 47) % 23) - 11;   // each stamp sits a little crooked, the same way every time
let card = null, cells = null;

/** one stamp, inked: two rings, the motif, the kanji over it and the name under it round the rim */
function inked(s, i) {
  const pid = 'stp-' + s.id;
  return `<svg viewBox="0 0 72 72" width="100%" height="100%" aria-hidden="true" style="overflow:visible">
    <defs><path id="${pid}-t" d="M12.5 36a23.5 23.5 0 0 1 47 0"/><path id="${pid}-b" d="M10.5 36a25.5 25.5 0 0 0 51 0"/></defs>
    <g fill="none" stroke="currentColor" filter="url(#stp-rough)">
      <circle cx="36" cy="36" r="33" stroke-width="2.6"/><circle cx="36" cy="36" r="29.2" stroke-width=".9"/>
      <g transform="translate(19.2 20.2) scale(1.4)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${s.art}</g>
      <text font-size="${s.jp.length > 1 ? 7 : 8.5}" font-family='${MINCHO}' font-weight="700" fill="currentColor" stroke="none" letter-spacing="1"><textPath href="#${pid}-t" startOffset="50%" text-anchor="middle">${s.jp}</textPath></text>
      <text font-size="6.8" font-family="system-ui, sans-serif" font-weight="700" fill="currentColor" stroke="none" letter-spacing="1.1"><textPath href="#${pid}-b" startOffset="50%" text-anchor="middle" dominant-baseline="hanging">${s.name}</textPath></text>
    </g></svg>`;
}
/** one circle on the card: the stamp if found, else the faint outline and its hint */
function cell(s, i, isFound) {
  const c = div({ position: 'relative', width: '100%', aspectRatio: '1', display: 'grid', placeItems: 'center' });
  c.dataset.stamp = s.id;
  if (isFound) {
    c.dataset.found = '1'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', s.name.toLowerCase());
    const ink = div({ position: 'absolute', inset: '0', color: INK, opacity: '.86', rotate: tiltOf(i) + 'deg', mixBlendMode: 'multiply' });
    ink.className = 'stp-ink'; ink.innerHTML = inked(s, i);
    c.appendChild(ink);
  } else {
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'not found yet: ' + s.hint); c.title = s.hint;
    c.appendChild(css(document.createElementNS(SVG, 'svg'), { position: 'absolute', inset: '0', width: '100%', height: '100%', overflow: 'visible' }));
    c.lastChild.setAttribute('viewBox', '0 0 72 72');
    c.lastChild.innerHTML = '<circle cx="36" cy="36" r="33" fill="none" stroke="#b6a37f" stroke-width="1.2" stroke-dasharray="3 4" opacity=".7"/>';
    c.appendChild(div({ position: 'relative', maxWidth: '74%', textAlign: 'center', font: 'italic 9px/1.15 Georgia, serif', color: '#a8956f', opacity: '.8' }, s.hint));
  }
  return c;
}

/** the new stamp comes down hard: big and faint, then slammed onto the paper, the card jolts */
function thump(c, delay) {
  const ink = c.querySelector('.stp-ink'); if (!ink) return;
  c.dataset.new = '1';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = ink.style.rotate || '0deg';
  ink.animate([
    { transform: 'scale(2.3)', opacity: 0, filter: 'blur(2px)' },
    { transform: 'scale(.9)', opacity: 1, filter: 'blur(0)', offset: 0.6 },
    { transform: 'scale(1.05)', offset: 0.78 },
    { transform: 'scale(1)' },
  ], { duration: S.THUMP_MS, delay, easing: 'cubic-bezier(.55,0,.9,.5)', fill: 'backwards' });
  // the ink squashes out a little ring as it lands
  const ring = div({ position: 'absolute', inset: '6%', borderRadius: '50%', border: `2px solid ${INK}`, opacity: '0', pointerEvents: 'none', rotate: r });
  c.appendChild(ring);
  ring.animate([{ transform: 'scale(.9)', opacity: 0.5 }, { transform: 'scale(1.25)', opacity: 0 }], { duration: S.RING_MS, delay: delay + S.THUMP_MS * 0.6, easing: 'ease-out', fill: 'both' }).onfinish = () => ring.remove();
  if (card) card.animate([{ transform: 'none' }, { transform: `translateY(${S.JOLT_PX}px) rotate(.4deg)` }, { transform: 'none' }], { duration: 160, delay: delay + S.THUMP_MS * 0.6 });
}
function thumpIn(id) {
  const i = STAMPS.findIndex((s) => s.id === id), old = cells && cells[i];
  if (!old) return;
  const c = cell(STAMPS[i], i, true); old.replaceWith(c); cells[i] = c;
  seen(id); thump(c, 0); count();
}
function seen(id) { const st = load(); if (!st.seen.includes(id)) { st.seen.push(id); save(); } }
function count() {
  if (!card) return;
  const n = found().length, el = card.querySelector('.stp-count'), ft = card.querySelector('.stp-foot');
  if (el) el.textContent = `${n} / ${STAMPS.length}`;
  if (ft && n === STAMPS.length && !ft.dataset.full) { ft.dataset.full = '1'; ft.textContent = line('stamps.full'); }
}

function open() {
  close(true);
  const st = load(), seal = document.querySelector('.brand .hanko'), b = seal ? seal.getBoundingClientRect() : { left: 16, bottom: 56 };
  const W = Math.min(S.W_PX, innerWidth - 32);
  card = div({ position: 'fixed', zIndex: '66', left: Math.max(16, Math.min(b.left - 8, innerWidth - W - 16)) + 'px', top: (b.bottom + 12) + 'px', width: W + 'px', boxSizing: 'border-box',
    maxHeight: `calc(100vh - ${b.bottom + 24}px)`, overflow: 'auto', padding: '16px 16px 12px', borderRadius: '4px', color: '#3b2f22', transformOrigin: '20px 0',
    background: 'radial-gradient(circle at 18% 22%, rgba(160,120,60,.08) 0 2px, transparent 3px) 0 0 / 23px 29px, radial-gradient(circle at 70% 60%, rgba(120,90,40,.06) 0 1px, transparent 2px) 0 0 / 17px 13px, linear-gradient(170deg, #f7f0dc, #efe4c8)',
    border: '1px solid #d8c7a0', boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 14px 34px rgba(40,25,10,.28), 0 2px 6px rgba(40,25,10,.18)' });
  card.className = 'stamp-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Stamp book');
  // the rough edge of the ink, shared by every stamp on the card
  const defs = document.createElementNS(SVG, 'svg'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.style.position = 'absolute';
  defs.innerHTML = '<filter id="stp-rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter>';
  // header: the book's name in a red box, the line under it, the ×
  const head = div({ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', marginBottom: '12px', borderBottom: '1px dashed #c9b48a' });
  const badge = div({ flex: 'none', width: '38px', height: '38px', display: 'grid', placeItems: 'center', border: `2px solid ${INK}`, borderRadius: '4px', color: INK,
    font: `800 22px/1 ${MINCHO}`, rotate: '-5deg', opacity: '.9' }, '霧');
  const titles = div({ flex: '1', minWidth: '0' });
  titles.append(div({ font: `700 17px/1.1 ${MINCHO}`, letterSpacing: '.12em', color: '#2c2219' }, 'スタンプ帳'),
    div({ font: 'italic 12px/1.3 Georgia, serif', color: '#7a6548', marginTop: '3px' }, line('stamps.head')));
  const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
  css(x, { flex: 'none', alignSelf: 'flex-start', border: '0', background: 'transparent', color: '#8a7656', font: '20px/1 system-ui, sans-serif', cursor: 'pointer', padding: '0 2px' });
  x.addEventListener('click', () => close());
  head.append(badge, titles, x);
  // the circles
  const grid = div({ display: 'grid', gridTemplateColumns: `repeat(${S.COLS}, 1fr)`, gap: '10px 12px', padding: '2px 4px' });
  const fresh = [];
  cells = STAMPS.map((s, i) => {
    const isFound = !!st.found[s.id], c = cell(s, i, isFound);
    if (isFound && !st.seen.includes(s.id)) fresh.push(c);
    grid.appendChild(c); return c;
  });
  // footer: how many, and a line
  const n = found().length;
  const foot = div({ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', paddingTop: '9px', borderTop: '1px dashed #c9b48a' });
  const num = div({ flex: 'none', padding: '2px 7px', border: `1.5px solid ${INK}`, borderRadius: '3px', color: INK, font: '700 12px/1.3 system-ui, sans-serif', letterSpacing: '.06em' }, `${n} / ${STAMPS.length}`);
  num.className = 'stp-count';
  const ft = div({ flex: '1', font: 'italic 11.5px/1.35 Georgia, serif', color: '#7a6548' }, line(n === STAMPS.length ? 'stamps.full' : 'stamps.foot'));
  ft.className = 'stp-foot'; if (n === STAMPS.length) ft.dataset.full = '1';
  foot.append(num, ft);
  card.append(defs, head, grid, foot);
  document.body.appendChild(card);
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) card.animate([{ transform: 'translateY(-14px) scaleY(.2)', opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { transform: 'none', opacity: 1, clipPath: 'inset(0 0 0 0)' }],
    { duration: S.SLIDE_MS, easing: 'cubic-bezier(.2,1.1,.4,1)' });
  fresh.forEach((c, k) => { seen(c.dataset.stamp); thump(c, (reduced ? 0 : S.SLIDE_MS) + k * S.THUMP_GAP_MS); });
}
function close(quiet) {
  if (!card) return;
  const c = card; card = null; cells = null;
  if (quiet || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { c.remove(); return; }
  c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-10px)', opacity: 0 }], { duration: S.OUT_MS, easing: 'ease-in', fill: 'forwards' });
  real.after(S.OUT_MS, () => c.remove());
}

// ---- the hold on the seal ----
let press = null, swallow = false;
function down(e, seal) {
  swallow = false;
  if (e.button !== 0 || isCrazy()) return;
  stop();
  const a = seal.animate([{ transform: 'rotate(-4deg)' }, { transform: `rotate(-4deg) scale(${S.PRESS_SCALE})`, filter: 'brightness(.85)' }], { duration: S.HOLD_MS, easing: 'ease-in', fill: 'forwards' });
  press = { a, cancel: real.after(S.HOLD_MS, () => { press = null; a.cancel(); swallow = true; seal.animate([{ transform: `rotate(-4deg) scale(${S.PRESS_SCALE})` }, { transform: 'rotate(-4deg) scale(1.12)' }, { transform: 'rotate(-4deg)' }], { duration: 260 }); open(); }) };
}
function stop() { if (!press) return; press.cancel(); press.a.cancel(); press = null; }

export function install(app) {
  for (const s of STAMPS) for (const o of s.on) {
    const [type, test] = Array.isArray(o) ? o : [o, null];
    bus.on(type, (ev) => { if (!test || test(ev)) mark(s.id); });
  }
  const seal = document.querySelector('.brand .hanko'), link = seal && seal.closest('a');
  if (seal) {
    css(seal, { touchAction: 'none', webkitTouchCallout: 'none', userSelect: 'none' });
    seal.addEventListener('pointerdown', (e) => down(e, seal));
    for (const t of ['pointerup', 'pointerleave', 'pointercancel']) seal.addEventListener(t, stop);
    seal.addEventListener('contextmenu', (e) => { if (press || card) e.preventDefault(); });
    seal.addEventListener('dragstart', (e) => { if (press) e.preventDefault(); });
  }
  // the click that ends a hold does not follow the link; any other click on the logo does
  if (link) link.addEventListener('click', (e) => { if (swallow) { swallow = false; e.preventDefault(); } }, true);
  document.addEventListener('pointerdown', (e) => { swallow = false; if (card && !card.contains(e.target) && !(seal && seal.contains(e.target))) close(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && card) close(); });
  hook('__stamps', { STAMPS, found, mark, open, close: () => close(true), isOpen: () => !!card, store: () => JSON.parse(JSON.stringify(load())) });
}
