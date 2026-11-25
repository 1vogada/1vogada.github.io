// The phrasebook menu (legacy scripts/phrasebook.js: nav, esc, VER, here, CHAPTERS, listOf, linesHTML, build, el, scroller,
// isOpen, lastFocus, q, make, onKey, open, close, the translate button, window.__phrasebook). A translate button in the header
// opens a near-fullscreen menu (one big card over the tinted page) that lists every line the cards, the katana and the hand
// can say, what sets each one off, and what the Bulgarian and Japanese ones mean.
// The lines, their triggers ({ title, when }) and glosses are NOT kept here: they come from core/lines.js (defineLines in
// src/lines/*.js). This file only knows the chapters: their intros, and which keys and figures go in which order.
// English-only mode (page/language.js) shows the lists as list(key) gives them: thinned to English, like legacy window.__thin.
// Emits phrasebook.opened / phrasebook.closed (where legacy dispatched pb-open / pb-close).
import { allLines, list, langOf } from '../core/lines.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { hook } from '../core/debug.js';
import { figure, resetPlates, esc } from './figures.js';
import * as raid from './raid.js';

let app = null;
// Bump VER, and the ?v= on scripts/phrasebook.js's tag in index.html, whenever the stylesheet changes: GitHub Pages caches each
// file for ten minutes on its own, and a new script with an old stylesheet looks broken
const VER = 17;
const here = import.meta.url;

// ---- what this file knows: which occasion each list belongs to (a line key), and where the figures go ----
const CHAPTERS = [
  { id: 'cards', num: 'I', title: 'The Cards', head: 'Of the Cards',
    intro: 'The cards of this site are rooted in their grid and would like to stay there. Each one may be taken by any part of it and pulled; it will complain from the first pixel, and louder the worse you treat it. A card is never silent for long, but it will not speak twice within about a second and a half unless something new is done to it.',
    entries: [
      'card.pull',
      'card.strain',
      { fig: 'strain' },
      'card.back',
      { fig: 'back' },
      'card.loosen',
      'card.rip',
      { fig: 'pull' },
      'card.throw',
      { fig: 'fly' },
      'card.land',
      { fig: 'land' },
      'card.smash',
      { fig: 'smash' },
      { fig: 'stack' },
      'card.cutting',
      'card.stab',
      'card.slice',
      { fig: 'cut' },
      'card.agony.0',
      'card.agony.1',
      { fig: 'stretch' },
      'card.agony.2',
      'card.panic.0',
      'card.panic.1',
      { fig: 'shelf' },
      'card.panic.2',
      'card.notme',
      'card.beg',
      { fig: 'crush' },
    ] },
  { id: 'katana', num: 'II', title: 'The Katana', head: 'Of the Katana',
    intro: 'Hidden in the mist of the banner stands a katana, and it has a very high opinion of itself. It is drawn like a card, by pulling, and a double click keeps it in the hand. Only its very tip cuts, at any speed whatever. It speaks once and is then quiet for two seconds, however much it has done in the meantime.',
    entries: [
      { fig: 'katana' },
      'katana.hello',
      { fig: 'mist' },
      'katana.brag',
      { fig: 'equip' },
      'katana.cut',
      { fig: 'kfall' },
      'katana.drop',
    ] },
  { id: 'hand', num: 'III', title: 'The Hand', head: 'Of the Hand',
    intro: 'Something lives past the right edge of the screen, and it wants your cards. It shows itself only after the first card has been torn loose. It has one eye, on the back of the hand, and opinions on everything it sees. It never answers at once: every remark waits up to three seconds, and two full seconds always pass between any two things it says.',
    entries: [
      'hand.eager',
      { fig: 'hand' },
      'hand.grab',
      'hand.tug',
      'hand.rip',
      'hand.eat',
      'hand.keep',
      'hand.toss',
      'hand.sulk',
      { fig: 'sulking' },
      'hand.snatch',
      'hand.savour',
      'hand.crush',
      { fig: 'fist' },
      'hand.shelf',
      'hand.severed',
      { fig: 'severed' },
      'hand.regrow',
      'sev.cut',
      'sev.rise',
      'sev.held',
      'sev.thrown',
      'sev.hunt',
      'sev.squeeze',
      'sev.crush',
      'sev.drag',
      'sev.flee',
      'sev.rest',
      'hand.meet',
      'sev.meet',
      'hand.stolen',
      'hand.devour',
      'sev.doomed',
      'hand.robbed',
      'hand.devoured',
      'hand.caught',
      { fig: 'catch' },
      'hand.slip',
      'hand.cut',
      'hand.stab',
      'hand.smash',
      'hand.throw',
      'hand.katana',
      'hand.kdrop',
      'raid.bored',
      'raid.help',
      'raid.alone',
      'raid.swat',
      { fig: 'swat' },
      'raid.grudge',
      'raid.angry',
      'raid.scroll',
      'raid.more',
      'raid.hide',
      { fig: 'scroll' },
      'hand.ask',
      'hand.hello',
      'hand.smashbtn',
      'hand.better',
      'hand.flip',
      { fig: 'coin' },
      'hand.heads',
      'hand.tails',
      'hand.won',
      'hand.stay',
      'hand.lost',
      'hand.idgaf',
      'hand.waiting',
      'hand.bye',
      { fig: 'press' },
      'hand.slap',
      'hand.snap',
      'hand.secret',
      'hand.escaped',
      'button.hi',
      'hand.yourpick',
      'hand.callit',
      'hand.mypick',
      'hand.back',
      'hand.rematch',
    ] },
];

// what the Bulgarian and Japanese lines mean (legacy GLOSS: one table for every list; the glosses now sit next to their lines)
let GLOSS = null;
const gloss = () => { if (!GLOSS) { GLOSS = new Map(); for (const d of allLines()) for (const l of d.lines) if (l.gloss) GLOSS.set(l.text, l.gloss); } return GLOSS; };
const LANG = { ja: 'JP', bg: 'BG' };

// ---- the text, built from the live lists ----
/** legacy listOf: the list as the picker sees it (English only: thinned) */
function listOf(e) { return list(e.key); }
function linesHTML(arr) {
  return [...new Set(arr)].map((s) => {
    const lang = LANG[langOf(s)] || '', g = gloss().get(s);
    return `<span class="pb-chip"${lang ? ` lang="${lang === 'JP' ? 'ja' : 'bg'}"` : ''}><b>${esc(s)}</b>${lang ? `<i lang="en">${lang}${g ? ' · ' + esc(g) : ''}</i>` : ''}</span>`;
  }).join('');
}
function build() {
  resetPlates();
  if (app.reduced) return { head: 'Nothing to list', nav: '', body: '<p class="pb-intro">Nothing on this site moves or speaks while your system asks for reduced motion, so there are no lines to show. Switch that setting off and open this again.</p>' };
  const defs = new Map(allLines().map((d) => [d.key, d]));
  const chapters = CHAPTERS.map((c) => ({ ...c, entries: c.entries.map((e) => (typeof e === 'string' ? { key: e, ...defs.get(e).trigger } : e)).map((e) => e.fig ? e : ({ ...e, lines: listOf(e) })).filter((e) => e.fig || (e.lines && e.lines.length)) }));
  // lists the page has that this file has not been told about yet: they are still shown, in the section they belong to
  // (legacy walked the page's SAY and CLAW_SAY tables; here the lists that carry such a legacy path, in definition order)
  const known = new Set(CHAPTERS.flatMap((c) => c.entries.filter((e) => typeof e === 'string')));
  const extra = (src, test, ch) => { for (const d of defs.values()) { const [top, k] = (d.legacy || '').split('.'); if (top === src && k != null && !known.has(d.key) && test(k)) chapters[ch].entries.push({ key: d.key, title: `New: “${k}”`, when: 'A new set of lines. What sets it off has not been written down here yet.', lines: list(d.key) }); } };
  extra('SAY', (k) => k[0] !== 'k', 0); extra('SAY', (k) => k[0] === 'k', 1); extra('CLAW_SAY', () => true, 2);
  let nLines = 0, nOcc = 0; for (const c of chapters) { c.n = 0; for (const e of c.entries) if (!e.fig) { nOcc++; c.n += new Set(e.lines).size; } nLines += c.n; }
  let h = '';
  for (const c of chapters) {
    h += `<section class="pb-sec pb-sec-${c.id}" id="pb-${c.id}"><header class="pb-sec-h"><h3>${esc(c.title)}</h3><span class="pb-pill">${c.n} lines</span></header><p class="pb-intro">${esc(c.intro)}</p><div class="pb-grid">`;
    for (const e of c.entries) h += e.fig ? figure(e.fig) : `<article class="pb-entry"><h4>${esc(e.title)}<span class="pb-pill">${new Set(e.lines).size}</span></h4><p class="pb-when"><b>When</b> ${esc(e.when)}</p><div class="pb-lines">${linesHTML(e.lines)}</div></article>`;
    h += '</div></section>';
  }
  h += '<p class="pb-end">That is all of them. Go and make them say it.</p>';
  return { head: `${nLines} lines, ${nOcc} triggers`, nav: chapters.map((c) => `<button type="button" class="pb-tab" data-go="${c.id}">${esc(c.title)}</button>`).join(''), body: h };
}

// ---- the menu: one big card over a tinted page, scrolling top to bottom ----
export let el = null, scroller = null;
let opened = false, lastFocus = null;
/** legacy isOpen */
export const isOpen = () => opened;
export const q = (s) => el.querySelector(s);
function make() {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../../styles/phrasebook.css?v=' + VER, here).href;
  const ready = new Promise((res) => { css.onload = css.onerror = res; }); document.head.appendChild(css);
  el = document.createElement('div'); el.className = 'pb'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pb-title');
  el.innerHTML = `<div class="pb-shade"></div>
      <div class="pb-card">
        <header class="pb-top"><div class="pb-top-row"><div><h2 id="pb-title">Phrasebook</h2><p class="pb-sub">Everything the cards, the katana and the hand can say, and what sets it off. <span class="pb-count"></span></p></div>
          <button class="icon-btn pb-x" type="button" aria-label="Close the phrasebook">✕</button></div><nav class="pb-tabs" aria-label="Sections"></nav></header>
        <div class="pb-scroll" tabindex="-1"></div>
      </div>`;
  document.body.appendChild(el);
  scroller = q('.pb-scroll');
  q('.pb-shade').addEventListener('click', close); q('.pb-x').addEventListener('click', close);
  q('.pb-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'), sec = b && document.getElementById('pb-' + b.dataset.go); if (sec) scroller.scrollTo({ top: sec.offsetTop - 8, behavior: 'smooth' }); });
  scroller.addEventListener('scroll', () => { let cur = null; el.querySelectorAll('.pb-sec').forEach((s) => { if (s.offsetTop - 140 <= scroller.scrollTop) cur = s.id.slice(3); }); el.querySelectorAll('.pb-tab').forEach((t) => t.classList.toggle('on', t.dataset.go === cur)); el.classList.toggle('scrolled', scroller.scrollTop > 4); }, { passive: true });
  return ready;
}
function onKey(e) {
  if (!opened) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  else if (e.key === 'Tab') { const f = [...el.querySelectorAll('button:not(:disabled)')], k = f.indexOf(document.activeElement); e.preventDefault(); (f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length] || f[0]).focus(); }
  e.stopPropagation();   // nothing typed in the menu reaches the page under it
}
export async function open() {
  if (opened) return;
  opened = true; lastFocus = document.activeElement;
  if (!el) await make();
  const b = build(); scroller.innerHTML = b.body; q('.pb-count').textContent = b.head + '.'; q('.pb-tabs').innerHTML = b.nav;
  el.hidden = false; document.documentElement.classList.add('pb-lock'); scroller.scrollTop = 0; scroller.dispatchEvent(new Event('scroll'));
  clock.nextFrame(() => el.classList.add('in'));
  scroller.focus({ preventScroll: true });   // so the arrow keys, space and page keys scroll it straight away
  raid.raidArm();
  el.dispatchEvent(new CustomEvent('pb-open'));
  bus.emit('phrasebook.opened', {});
}
export function close() {
  if (!opened) return;
  opened = false; el.classList.remove('in'); document.documentElement.classList.remove('pb-lock'); raid.raidStop();
  el.dispatchEvent(new CustomEvent('pb-close'));
  bus.emit('phrasebook.closed', {});
  clock.real.after(240, () => { if (!opened) el.hidden = true; });
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

export function install(a) {
  app = a;
  const nav = document.querySelector('header.top .nav'); if (!nav) return;
  document.addEventListener('keydown', onKey, true);
  // ---- the button: a translate sign, next to the theme switch ----
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'icon-btn pb-open-btn'; btn.id = 'phrasebook'; btn.title = 'Phrasebook: what everything on this page says, and why'; btn.setAttribute('aria-label', 'Open the phrasebook');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  btn.addEventListener('click', open);
  nav.insertBefore(btn, document.getElementById('theme'));
  hook('__phrasebook', { open, close, raid: raid.start, next: raid.next, state: () => ({ isOpen: opened, raid: raid.state() }), get el() { return el; } });
}
