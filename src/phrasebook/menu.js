// The phrasebook menu (legacy scripts/phrasebook.js: nav, esc, VER, here, CHAPTERS, listOf, linesHTML, build, el, scroller,
// isOpen, lastFocus, q, make, onKey, open, close, the translate button, window.__phrasebook). A translate button in the header
// opens a near-fullscreen menu (one big card over the tinted page) that lists every line the cards, the katana and the hand
// can say, what sets each one off, and what the Bulgarian and Japanese ones mean.
// The lines, their triggers ({ title, when }) and glosses are NOT kept here: they come from core/lines.js (defineLines in
// src/lines/*.js). This file only knows the chapters: their intros, and which keys and figures go in which order.
// English-only mode (page/language.js) shows the lists as list(key) gives them: thinned to English, like legacy window.__thin.
// Emits phrasebook.opened / phrasebook.closed (where legacy dispatched pb-open / pb-close).
// Each entry carries its line key (data-key), so a selected chip can be traced back to who says it (./say.js: phrase-say).
// Heard lines (./heard.js, ./ink.js): only the lines you have heard on this browser are written out; the rest are blotted
// (▒▒▒), their trigger's "When" still readable, so you know what to go and try. A line heard since the book was last opened
// carries a red ink dot that fades (so does its section's tab), and the header says how many are new. A line heard while the
// book is open inks itself in where it stands (and counts as seen when it closes). The pills count heard / all; a footer line says what the blots are. The diary
// fills the same way: its new pages get the dot, and the next few pages it has not written yet show as blots with their When.
import { allLines, list, langOf } from '../core/lines.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { hook } from '../core/debug.js';
import { figure, resetPlates, esc } from './figures.js';
import * as raid from './raid.js';
import * as heard from './heard.js';
import { blot, dot, fade, hash } from './ink.js';
import { TUNE } from '../core/tune.js';
import { entries } from '../page/diary.js';

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
      'card.forgive',
      'card.grudge',
      'card.again',
      'card.omikuji',
      'card.cursed',
      'card.tornslip',
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
      'bread.pop',
      'bread.thrown',
      'bread.caught',
      'card.eaten',
      'card.home',
      'card.notyet',
      'stamps.head',
      'stamps.foot',
      'stamps.full',
      'card.filmSlash',
      'card.filmAlas',
      'page.filmEnd',
      'card.chewed',
      'card.bitten',
      'card.ghost',
      'coin.land',
      'coin.thrown',
      'coin.bitten',
      'coin.flicked',
      'coin.reached',
      'card.spared',
      'card.paid',
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
      'katana.notyet',
      'katana.tana',
      'katana.film',
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
      'hand.small',
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
      'sev.mourn',
      'sev.paint',
      'sev.painted',
      'sev.avenge',
      'sev.haul',
      'sev.stab',
      'sev.five',
      'sev.hide',
      'sev.safe',
      'sev.mirror',
      'hand.mirror',
      'hand.prod',
      'sev.dead',
      'sev.twitch',
      'hand.gotcha',
      'hand.fooled',
      'sev.phew',
      'sev.spring',
      'hand.tricked',
      'hand.paper',
      'sev.notcard',
      'hand.notpaper',
      'hand.giveback',
      'sev.returned',
      'sev.notthere',
      'sev.home',
      'hand.sewn',
      'sev.latch',
      'sev.ride',
      'sev.cling',
      'sev.whee',
      'sev.dizzy',
      'sev.alight',
      'sev.pounce',
      'hand.cheese',
      'sev.cheese',
      'hand.cheeseEnd',
      'sev.cheeseEnd',
      'hand.cheeseWon',
      'hand.wrest',
      'card.wrest',
      'sev.wrest',
      'hand.wrestWon',
      'sev.wrestSlip',
      'hand.wrestSlip',
      'sev.wrestWon',
      'hand.wrestEnd',
      'sev.wrestEnd',
      'sev.fetch',
      'sev.gift',
      'hand.burp',
      'sev.regift',
      'hand.rps',
      'sev.rpsYes',
      'sev.coached',
      'hand.rpsShoot',
      'hand.rpsDraw',
      'hand.rpsWon',
      'sev.rpsLost',
      'hand.rpsLost',
      'sev.rpsWon',
      'hand.rpsQuit',
      'sev.towerCall',
      'sev.towerBrace',
      'sev.towerClimb',
      'sev.towerReach',
      'hand.towerPeer',
      'sev.towerPull',
      'hand.pulled',
      'hand.shakeOff',
      'sev.towerHeap',
      'hand.towerSulk',
      'sev.towerFell',
      'hand.towerLaugh',
      'hand.towerSaved',
      'sev.uprising',
      'hand.flewOff',
      'hand.spent',
      'hand.truce',
      'toast.truce',
      'hand.tempted',
      'sev.dance',
      'hand.bob',
      'sev.jive',
      'sev.freeze',
      'sev.pretend',
      'hand.danced',
      'hand.jealous',
      'hand.idle',
      'hand.idleback',
      'sev.pester',
      'sev.pesterPoke',
      'hand.pesterMine',
      'sev.pesterRetort',
      'hand.pesterTurn',
      'sev.pesterBack',
      'hand.pesterBack',
      'hand.dark',
      'hand.grope',
      'hand.there',
      'hand.light',
      'hand.unattended',
      'hand.unchewed',
      'hand.gulp',
      'hand.squeezed',
      'hand.unsqueezed',
      'hand.word',
      'hand.wordgot',
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
      'hand.edge',
      'hand.edgepick',
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
      'hand.toast',
      'hand.toastEat',
      'hand.notyet',
      'sev.notyet',
      'hand.film',
      'hand.filmCurses',
      'sev.film',
      'ghost.drift',
      'ghost.wave',
      'ghost.roam',
      'sev.ghost',
      'ghost.bowed',
      'ghost.rest',
      'hand.fake',
      'hand.fakeAgain',
      'hand.shelfCoin',
      'hand.paid',
    ] },
];

// ---- the secret last chapter: type "kotoba" (言葉, words) with the phrasebook open and the hand's diary appears below the
// others: every line it said to you on this visit, in order (page/diary.js). Found once, it stays for the visit; finding it emits
// 'secret.found' { name: 'diary' } (page/stamps.js) ----
const DIARY = { id: 'diary', title: 'The Hand’s Diary', word: 'kotoba', key: 'kiripad-kotoba',
  intro: 'Not for you. Kept by the hand, in its own words: everything it has said to you on this visit, in the order it said it, and what made it say so. It writes in it every time it opens its mouth. It did not expect anyone to read this.',
  none: 'Not a word yet. Tear a card out of its slot and it will start talking soon enough.' };
let diaryOn = false, typed = '';
try { diaryOn = sessionStorage.getItem(DIARY.key) === '1'; } catch (e) {}
const hhmm = (ms) => { const t = new Date(ms), p = (n) => String(n).padStart(2, '0'); return `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`; };
function diaryHTML() {
  const d = entries(), defs = new Map(allLines().map((x) => [x.key, x]));
  const why = (kind) => { const t = (defs.get('hand.' + kind) || {}).trigger; return t ? t.title : kind; };
  let h = `<section class="pb-sec pb-sec-hand pb-sec-diary" id="pb-${DIARY.id}"><header class="pb-sec-h"><h3>${esc(DIARY.title)}</h3><span class="pb-pill">${d.length} lines</span></header><p class="pb-intro">${esc(DIARY.intro)}</p><div class="pb-grid">`;
  if (!d.length) h += `<article class="pb-entry"><h4>Dear diary,</h4><p class="pb-when">${esc(DIARY.none)}</p></article>`;
  d.forEach((e, i) => { const nu = e.at > glance.since; h += `<article class="pb-entry" data-key="hand.${esc(e.kind)}"><h4>Dear diary, ${hhmm(e.at)}${nu ? dot() : ''}<span class="pb-pill">${i + 1}</span></h4><p class="pb-when"><b>When</b> ${esc(why(e.kind))}</p><div class="pb-lines">${linesHTML([e.text], { fresh: nu ? new Set([e.text]) : null })}</div></article>`; });
  // the pages it has not written yet: the hand's lists you have heard nothing of, in the book's order, blotted
  const blank = CHAPTERS[2].entries.filter((k) => typeof k === 'string' && k.startsWith('hand.') && defs.has(k) && list(k).length && !list(k).some(heard.has));
  for (const k of blank.slice(0, TUNE.heard.DIARY_BLOTS)) h += `<article class="pb-entry pb-unheard" data-key="${esc(k)}" style="border-style: dashed"><h4>Dear diary, ▒▒:▒▒:▒▒</h4><p class="pb-when"><b>When</b> ${esc(defs.get(k).trigger ? defs.get(k).trigger.title : k)}</p><div class="pb-lines">${linesHTML([list(k)[0]], { blot: true })}</div></article>`;
  if (blank.length > TUNE.heard.DIARY_BLOTS) h += `<p class="pb-when pb-diary-more" style="grid-column: 1 / -1; text-align: center; font-style: italic">…and ${blank.length - TUNE.heard.DIARY_BLOTS} more pages it has not written yet.</p>`;
  return h + '</div></section>';
}
const diaryTab = () => `<button type="button" class="pb-tab" data-go="${DIARY.id}">Diary${entries().some((e) => e.at > glance.since) ? dot() : ''}</button>`;
/** the diary goes in under the last chapter, and the menu scrolls to it */
function reveal() {
  if (!opened || !scroller || app.reduced) return;
  diaryOn = true; try { sessionStorage.setItem(DIARY.key, '1'); } catch (e) {}
  bus.emit('secret.found', { name: 'diary' });   // page/stamps.js stamps it
  let sec = document.getElementById('pb-' + DIARY.id);
  if (!sec) {
    const end = scroller.querySelector('.pb-end'), box = document.createElement('div'); box.innerHTML = diaryHTML(); sec = box.firstChild;
    if (end) end.before(sec); else scroller.appendChild(sec);
    q('.pb-tabs').insertAdjacentHTML('beforeend', diaryTab());
    sec.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,1.2,.4,1)' });
    fade(sec);
  }
  scroller.scrollTo({ top: sec.offsetTop - 8, behavior: 'smooth' });
}

// what the Bulgarian and Japanese lines mean (legacy GLOSS: one table for every list; the glosses now sit next to their lines)
let GLOSS = null;
const gloss = () => { if (!GLOSS) { GLOSS = new Map(); for (const d of allLines()) for (const l of d.lines) if (l.gloss) GLOSS.set(l.text, l.gloss); } return GLOSS; };
const LANG = { ja: 'JP', bg: 'BG' };

// ---- the text, built from the live lists ----
/** legacy listOf: the list as the picker sees it (English only: thinned) */
function listOf(e) { return list(e.key); }
/** the chips of a list. o.blot: blot the lines you have not heard; o.fresh: a Set of lines to mark with the ink dot */
function linesHTML(arr, o = {}) {
  return [...new Set(arr)].map((s) => {
    const lang = LANG[langOf(s)] || '', g = gloss().get(s);
    if (o.blot && !heard.has(s)) return blot(s, lang);
    const nu = !!(o.fresh && o.fresh.has(s));
    return `<span class="pb-chip${nu ? ' pb-inked' : ''}"${lang ? ` lang="${lang === 'JP' ? 'ja' : 'bg'}"` : ''}${nu ? ' style="position: relative"' : ''}><b>${esc(s)}</b>${lang ? `<i lang="en">${lang}${g ? ' · ' + esc(g) : ''}</i>` : ''}${nu ? dot(true) : ''}</span>`;
  }).join('');
}
/** a line was heard while the book is open: its blots ink themselves in where they stand */
function inkIn(text) {
  if (!opened || !scroller) return;
  const h = hash(text), one = new Set([text]);
  for (const b of scroller.querySelectorAll(`.pb-blot[data-ink="${h}"]`)) {
    const box = document.createElement('div'); box.innerHTML = linesHTML([text], { fresh: one }); b.replaceWith(box.firstChild);
  }
  fade(scroller);
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
  // heard lines: how many of each entry, chapter and the book you have heard, and which are new since the last look
  const fresh = glance.fresh;
  let nLines = 0, nOcc = 0, nHeard = 0, nNew = 0;
  for (const c of chapters) {
    c.n = 0; c.h = 0; c.nu = 0;
    for (const e of c.entries) if (!e.fig) { nOcc++; const u = [...new Set(e.lines)]; e.n = u.length; e.h = u.filter(heard.has).length; c.n += e.n; c.h += e.h; c.nu += u.filter((t) => fresh.has(t)).length; }
    nLines += c.n; nHeard += c.h; nNew += c.nu;
  }
  const of = (h, n) => (h < n ? `${h}/${n}` : `${n}`);
  let h = '';
  for (const c of chapters) {
    h += `<section class="pb-sec pb-sec-${c.id}" id="pb-${c.id}"><header class="pb-sec-h"><h3>${esc(c.title)}</h3><span class="pb-pill">${c.h < c.n ? `${c.h} of ${c.n}` : c.n} lines</span></header><p class="pb-intro">${esc(c.intro)}</p><div class="pb-grid">`;
    for (const e of c.entries) h += e.fig ? figure(e.fig) : `<article class="pb-entry${e.h ? '' : ' pb-unheard'}" data-key="${esc(e.key)}"${e.h ? '' : ' style="border-style: dashed"'}><h4>${esc(e.title)}<span class="pb-pill"${e.h < e.n ? ' title="heard / all"' : ''}>${of(e.h, e.n)}</span></h4><p class="pb-when"><b>When</b> ${esc(e.when)}</p><div class="pb-lines">${linesHTML(e.lines, { blot: true, fresh })}</div></article>`;
    h += '</div></section>';
  }
  if (diaryOn) h += diaryHTML();
  h += '<p class="pb-end">That is all of them. Go and make them say it.</p>';
  h += `<p class="pb-foot" style="margin: 6px 0 0; text-align: center; color: var(--muted); font-size: .78rem; font-style: italic; opacity: .85">${nHeard < nLines ? (nHeard ? 'Lines you have not heard yet are blotted out.' : 'Lines you have not heard yet are blotted out. So far, that is all of them.') : 'You have heard every one of them. Not a blot left in the book.'}</p>`;
  const head = (nHeard < nLines ? `${nHeard} of ${nLines} lines heard, ${nOcc} triggers` : `${nLines} lines, ${nOcc} triggers`) + (nNew ? `; ${nNew} new since you last looked` : '');
  return { head, nav: chapters.map((c) => `<button type="button" class="pb-tab" data-go="${c.id}">${esc(c.title)}${c.nu ? dot() : ''}</button>`).join('') + (diaryOn ? diaryTab() : ''), body: h };
}

// ---- the menu: one big card over a tinted page, scrolling top to bottom ----
export let el = null, scroller = null;
let opened = false, lastFocus = null, glance = { fresh: new Set(), since: 0 };
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
  else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { typed = (typed + e.key.toLowerCase()).slice(-DIARY.word.length); if (typed === DIARY.word) { typed = ''; reveal(); } }
  else if (e.key === 'Tab') { const f = [...el.querySelectorAll('button:not(:disabled)')], k = f.indexOf(document.activeElement); e.preventDefault(); (f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length] || f[0]).focus(); }
  e.stopPropagation();   // nothing typed in the menu reaches the page under it
}
export async function open() {
  if (opened) return;
  opened = true; lastFocus = document.activeElement;
  if (!el) await make();
  glance = heard.look();   // what is new since the last time the book was open; from now on, nothing is
  const b = build(); scroller.innerHTML = b.body; q('.pb-count').textContent = b.head + '.'; q('.pb-tabs').innerHTML = b.nav;
  el.hidden = false; document.documentElement.classList.add('pb-lock'); scroller.scrollTop = 0; scroller.dispatchEvent(new Event('scroll'));
  clock.nextFrame(() => el.classList.add('in'));
  fade(el);
  scroller.focus({ preventScroll: true });   // so the arrow keys, space and page keys scroll it straight away
  raid.raidArm();
  el.dispatchEvent(new CustomEvent('pb-open'));
  bus.emit('phrasebook.opened', {});
}
export function close() {
  if (!opened) return;
  opened = false; el.classList.remove('in'); document.documentElement.classList.remove('pb-lock'); raid.raidStop();
  heard.look();   // what was inked in while it was open has been seen too
  el.dispatchEvent(new CustomEvent('pb-close'));
  bus.emit('phrasebook.closed', {});
  clock.real.after(240, () => { if (!opened) el.hidden = true; });
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

export function install(a) {
  app = a;
  const nav = document.querySelector('header.top .nav'); if (!nav) return;
  document.addEventListener('keydown', onKey, true);
  heard.onHeard(inkIn);
  // ---- the button: a translate sign, next to the theme switch ----
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'icon-btn pb-open-btn'; btn.id = 'phrasebook'; btn.title = 'Phrasebook: what everything on this page says, and why'; btn.setAttribute('aria-label', 'Open the phrasebook');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  btn.addEventListener('click', open);
  nav.insertBefore(btn, document.getElementById('theme'));
  hook('__phrasebook', { open, close, raid: raid.start, next: raid.next, state: () => ({ isOpen: opened, raid: raid.state() }), get el() { return el; } });
}
