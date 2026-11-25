// Surprise me and the omikuji slip (legacy: the surprise click with its slot-machine roll, FORTUNES, drawFortune,
// closeFortune, fitOmi, the secret × (pointermove near it, click), askHand, unpeek, omi-x / backdrop / Escape handlers).
// The hand asks the question itself: askHand() 700 ms after the slip opens (wall time), ask again after TIMING.wait.ask.
// install(app): listeners in legacy order: surprise click, visualViewport resize/scroll, document pointermove (secret),
// secret click, omi-x click, omi click, document keydown (Escape) — after the katana's keydown and before page/kiri.js keys.
//
// Every wait here was a bare setTimeout in legacy: wall time (clock.real). The fortunes are the line list 'fortune.slip'
// (src/lines/page.js), thinned for English-only mode by page/language.js thinFortunes (legacy lang.js did it in place).
// Emits slip.opened { project, fortune } and slip.closed { how }.

import { TIMING, TUNE } from '../core/tune.js';
import { real } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { list } from '../core/lines.js';
import { isCrazy } from '../world/world.js';
import * as hand from '../actors/hand/index.js';
import { data, band } from '../page/directory.js';
import { thinFortunes } from '../page/language.js';
import { current } from './scene.js';
import { handScene } from './coin.js';

const { STEPS, STEP_MS, STEP_GROW, ASK_DELAY_MS } = TUNE.surprise;
const SURPRISE = 'Surprise me', GO_THERE = 'Go there?';   // the button's label and the slip's question (page labels, as in index.html)

/** the slip's elements (filled at install; scenes/coin.js uses them too) */
export const dom = {};
/** state shared with scenes/coin.js: peek (the hand is out without a scene), found (the secret × was found), showOff (cancel of the hand-show removal) */
export const st = { peek: false, found: false, showOff: null };
let app = { reduced: false, root: null }, FORTUNES = [], askAgain = null;

/** legacy window.__hand: there is a hand unless reduced motion (cardPhysics() returned first) */
export const H = () => (app.reduced || !hand.awake() ? null : hand);   // and it keeps away until a card has been ripped out of its slot
/** legacy clearTimeout(showOff) */
export const keepShow = () => { if (st.showOff) { st.showOff(); st.showOff = null; } };
/** legacy showOff = setTimeout(() => root.classList.remove('hand-show'), 2000) */
export const endShow = () => { st.showOff = real.after(2000, () => app.root.classList.remove('hand-show')); };
/** the projects Surprise me picks from: not the GitHub ones */
export const candidates = (d) => d.projects.filter((p) => !/^https:\/\/github\.com\//.test(p.url));

/** legacy drawFortune(list, pick): one Math.random for the fortune, one more for a 末吉 line */
export function drawFortune(list, pick) {
  const { omi, slip, goBtn, noBtn, qEl, actEl, secret } = dom, $ = (id) => document.getElementById(id);
  const total = FORTUNES.reduce((a, f) => a + f[3], 0);
  let r = Math.random() * total, f = FORTUNES[0];
  for (const x of FORTUNES) { if ((r -= x[3]) < 0) { f = x; break; } }
  $('omi-kanji').textContent = f[0]; $('omi-name').textContent = f[1]; { const t = Array.isArray(f[2]) ? f[2][Math.floor(Math.random() * f[2].length)] : [f[2], '']; $('omi-text').textContent = t[0]; $('omi-text').title = t[1]; $('omi-text').lang = Array.isArray(f[2]) ? 'ja' : ''; }
  $('omi-proj').textContent = pick.name; $('omi-desc').textContent = pick.description || '';
  goBtn.href = pick.url; qEl.textContent = H() && !isCrazy() ? '' : GO_THERE;
  { const b = band(pick.name, 0); slip.style.setProperty('--c1', b.c1); slip.style.setProperty('--tile', b.style.slice(b.style.indexOf(':') + 1).replaceAll('&quot;', '"')); }   // the project's own embroidery
  actEl.innerHTML = ''; actEl.append(goBtn, noBtn); goBtn.classList.remove('pressed'); noBtn.disabled = false;
  slip.classList.toggle('curse', f[0] === '凶');
  omi.hidden = false; fitOmi(); secret.classList.remove('near'); st.found = false;
  slip.style.animation = 'none'; void slip.offsetWidth; slip.style.animation = '';
  const seal = slip.querySelector('.omi-seal'); seal.style.animation = 'none'; void seal.offsetWidth; seal.style.animation = '';
  goBtn.focus({ preventScroll: true });
  real.after(ASK_DELAY_MS, askHand);
  bus.emit('slip.opened', { project: pick, fortune: f });
}
/** legacy closeFortune(); how: 'backdrop' | 'escape' | 'x' (No or the × with no hand to play) */
export function closeFortune(how) {
  if (current()) return;
  dom.omi.hidden = true; unpeek(); dom.surprise.focus({ preventScroll: true });
  bus.emit('slip.closed', { how });
}
// keep the slip on screen when the page is pinch-zoomed: fixed boxes follow the layout viewport, so sit on the visible one instead
function fitOmi() {
  const v = window.visualViewport, omi = dom.omi; if (!v || omi.hidden) return;
  Object.assign(omi.style, v.scale > 1.01 ? { inset: 'auto', left: v.offsetLeft + 'px', top: v.offsetTop + 'px', width: v.width + 'px', height: v.height + 'px' } : { inset: '', left: '', top: '', width: '', height: '' });
}
// nothing on the slip talks: the hand leans in beside it and asks the question itself
/** legacy askHand() */
export function askHand() {
  const h = H(), { omi, slip } = dom; if (!h || isCrazy() || current() || st.peek || omi.hidden) return;
  st.peek = true; keepShow(); app.root.classList.add('hand-show');
  const r = slip.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  const asking = () => st.peek && !current() && !omi.hidden;
  // it asks, and if you do nothing for a while it asks once more
  h.come(Math.min(vw - 70, r.right + 70), r.top + r.height * 0.35, 'eager').then(() => real.after(600, () => { if (!asking()) return; h.say('ask'); if (askAgain) askAgain(); askAgain = real.after(TIMING.wait.ask, () => asking() && h.say('ask')); }));
}
/** legacy unpeek() */
export function unpeek() {
  if (askAgain) { askAgain(); askAgain = null; }
  if (!st.peek) return;
  st.peek = false; const h = H(); if (h) h.leave(); endShow();
}

export function install(a) {
  app = a;
  FORTUNES = thinFortunes(list('fortune.slip').map((f) => [...f]));   // legacy lang.js thinned FORTUNES in place; a copy here
  const $ = (id) => document.getElementById(id);
  Object.assign(dom, { surprise: $('surprise'), label: $('surprise-label'), omi: $('omikuji'), slip: $('slip'), goBtn: $('omi-go'), noBtn: $('omi-no'), qEl: $('omi-q'), actEl: $('omi-actions'), secret: $('omi-secret') });
  const { surprise, label, omi, slip, secret } = dom;

  // ---- surprise me: slot-machine through project names, then draw an omikuji fortune ----
  surprise.addEventListener('click', async () => {
    const d = data();
    if (!d || !d.projects.length || surprise.classList.contains('rolling')) return;
    const list = candidates(d);
    const pick = list[Math.floor(Math.random() * list.length)] || d.projects[0];
    surprise.classList.add('rolling');
    const steps = app.reduced ? 1 : STEPS;
    for (let s = 0; s < steps; s++) {
      label.textContent = list[Math.floor(Math.random() * list.length)].name;
      await real.sleep(STEP_MS + s * s * STEP_GROW);
    }
    label.textContent = SURPRISE;
    surprise.classList.remove('rolling');
    drawFortune(list, pick);
  });
  if (window.visualViewport) { visualViewport.addEventListener('resize', fitOmi); visualViewport.addEventListener('scroll', fitOmi); }
  // the secret ×: it rises when the pointer comes within ~90px of the screen's bottom-left corner, and the hand panics.
  // Clicking it closes the slip there and then, coin game or not
  document.addEventListener('pointermove', (e) => {
    if (omi.hidden) return;
    const o = omi.getBoundingClientRect(), r = slip.getBoundingClientRect(), near = Math.hypot(e.clientX - (o.left + 29), e.clientY - (o.bottom - 29)) < 90;
    if (near === secret.classList.contains('near')) return;
    secret.classList.toggle('near', near);
    if (!near || st.found) return;
    st.found = true;
    const h = H(); if (!h || isCrazy()) return;
    if (current()) { h.say('secret'); return; }
    // the hand was not out: it bursts in to protest
    st.peek = true; keepShow(); app.root.classList.add('hand-show');
    const vw = document.documentElement.clientWidth;
    h.come(Math.min(vw - 70, r.right + 70), r.top + r.height * 0.6, 'clamp').then(() => { if (st.peek) real.after(TIMING.wait.secret, () => st.peek && h.say('secret')); });
  });
  secret.addEventListener('click', () => {
    const h = H(), sc = current(), out = st.peek || sc;
    if (sc) sc.kill();   // stop the coin game wherever it is
    omi.hidden = true;
    if (out && h) { h.say('escaped'); if (current() === null) unpeek(); }
    surprise.focus({ preventScroll: true });
    bus.emit('slip.closed', { how: 'secret' });
  });
  $('omi-x').addEventListener('click', () => { if (!current()) handScene(); });
  omi.addEventListener('click', (e) => { if (e.target === omi) closeFortune('backdrop'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !omi.hidden) closeFortune('escape'); });
}
