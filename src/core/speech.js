// The one bubble system. Every speech bubble on the page is made here, lives as long as TIMING says, and is put on the
// page by the once-per-frame layout pass (legacy sayLayout). The legacy paths map onto it like this:
//
//   legacy                              new
//   say(o, kind, force)                 say(o, 'card.<kind>', { force })              speaker 'card' / 'katana', gate 'card'
//   say(o, 'slice', true)               say(o, 'card.slice', { force: true, scream: true })
//   cardSay(o, pain, AGONY|PANIC)       say(o, 'card.agony' | 'card.panic', { mode: 'agony', pain })   picks key + '.' + tier
//   talkOn(o, pick(L), floor)           say(o, key, { mode: 'plain', floor })          (BEG, NOTME)
//   clawSay(kind, force)                say(claw, 'hand.<kind>', { force })            speaker 'arm', gate 'arm'; flushLater(claw) in its tick
//   sevSay(o, kind, force)              say(o, 'sev.<kind>', { force })                speaker 'severed', gate 'severed'
//   sayAt(x, y, text, 'scream')         sayAt(x, y, key, { scream: true })             speaker 'page' (wall-time removal)
//   span.btn-say in a button            sayIn(buttonEl, key, { text, floor: 'btn' })   speaker 'button' (no tilt draw)
//   raidSay(text, o, floor)             say(o || raid, key, { as: 'raidCard' | 'raidHand', floor, text })
//   raid smash scream                   sayAt(x, y, key, { as: 'raidScream' })
//
// Order of random draws is legacy order: the line is picked (one draw), then the bubble is made (one draw for its tilt,
// none for speakers with tilt: false). A gate that drops a line draws nothing.
//
// Speakers are configured by the actors in their install():
//   defineSpeaker(kind, { kinds, prefix, gate, cls, extraCls, tag, tilt, layer, life, quiet, layout, first, anchor, onSaid })
//     kinds    body kinds that speak as this speaker (default [kind]); say(self) finds the speaker by opts.as || self.kind
//     prefix   a line key must start with this ('card.'), or the line is silently not said (legacy: the katana never says
//              card lines and cards never say katana lines; that check came first and drew nothing)
//     gate     'card' | 'arm' | 'severed' | 'plain' | fn(self, key, opts, t, sp) -> true | false
//     quiet    extra quiet time after any line (the katana: TIMING.gap.katana)
//     cls      class of the bubble element ('say'); extraCls added after its life is set ('claw-say')
//     tag      'div'; tilt: true = one Math.random draw for --tilt
//     layer    () => Element the bubble is appended to
//     life     'game' (clock.now) | 'wall' | () => number (the raid's own clock)
//     layout   true: the bubble rides in the layout pass at self.say.x/y/ax; false: the owner places it
//     first    true: goes first in the layout pass and is the one others slide away from (the arm's hand)
//     anchor   (self, t) -> { x, y, ax } | null: called in the draw phase for riders (bodies); omit to place by hand (place())
//     onSaid   (self, key, rec) after a line went up (the arm emits 'hand.said')
//
// A bubble record is self.say = { el, until, ms, key, x?, y?, ax?, w?, h?, lean?, apart? }. self.said is when the last one
// went up (now()). The arm also keeps self.sayEnd and self.later.
//
// The said-hook: onSaid(fn) calls fn({ key, text, as }) every time any bubble goes up (say, its agony and arm paths, sayAt,
// sayIn), after the element is made: key is the line key, text the bubble's words, as the speaker's name. It draws nothing and
// changes nothing; phrasebook/heard.js keeps the lines you have heard on this browser with it (the book blots the rest).
// changes nothing; the phrasebook (phrasebook/say.js) keeps the lines you have heard with it.
//
// setStyle('film') (the 1926 egg, via 'page.film' in src/reactions.js): every bubble is a silent-film title card, a few lists give
// way to 1926-only ones (FILM); setStyle(null) brings the normal bubbles back. filmDress(el) dresses the toast. See the section below.

import { TIMING, TUNE } from './tune.js';
import { clock } from './clock.js';
import { lines } from './lines.js';

const speakers = new Map();   // name -> config
const byKind = new Map();     // body kind -> config
let layoutSource = () => [];  // ordered riders (world.bodies)
const firsts = [];            // () => self with a first-speaker bubble (the arm)
const shared = { scream: -1e9 };   // legacy cutSaid: death screams of different bodies share one cooldown
const hooks = [];             // the said-hook: fn({ key, text, as }) after every bubble

/** the said-hook: fn({ key, text, as }) after any bubble goes up. @returns off */
export function onSaid(fn) { hooks.push(fn); return () => { const i = hooks.indexOf(fn); if (i >= 0) hooks.splice(i, 1); }; }
function heard(key, el, sp) {
  key = el._filmKey || key; if (hooks.length) { const rec = { key, text: el.textContent, as: (sp && sp.kind) || null }; for (const fn of hooks.slice()) fn(rec); } }

export function defineSpeaker(kind, cfg = {}) {
  const sp = { kind, kinds: [kind], prefix: '', gate: 'plain', cls: 'say', extraCls: '', tag: 'div', tilt: true, layer: null, life: 'game', quiet: 0, layout: true, first: false, anchor: null, onSaid: null, ...cfg };
  speakers.set(kind, sp);
  for (const k of sp.kinds) byKind.set(k, sp);
  return sp;
}
export const speaker = (name) => speakers.get(name);
/** the ordered list of riders for the layout pass (the world installs () => world.bodies) */
export function setLayoutSource(fn) { layoutSource = fn; }
/** a first speaker for the layout pass (the hand installs () => claw) */
export function addFirst(fn) { firsts.push(fn); return () => { const i = firsts.indexOf(fn); if (i >= 0) firsts.splice(i, 1); }; }

const timeOf = (sp) => (typeof sp.life === 'function' ? sp.life() : sp.life === 'wall' ? clock.wall() : clock.now());
const floorOf = (opts) => (typeof opts.floor === 'number' ? opts.floor : opts.floor ? TIMING.floor[opts.floor] : undefined);
const find = (self, opts) => { const sp = opts.as ? speakers.get(opts.as) : byKind.get(self && self.kind); if (!sp) throw new Error(`speech: no speaker for ${opts.as || (self && self.kind)}`); return sp; };

/** make a bubble element: class, text, the tilt draw, appended to the speaker's layer */
function make(sp, text, cls) {
  const el = document.createElement(sp.tag);
  el.className = cls || sp.cls;
  el.textContent = text; el._filmKey = pending; pending = null;
  if (sp.tilt) { const [a, b] = TUNE.speech.TILT; el.style.setProperty('--tilt', (a + Math.random() * b).toFixed(1)); }
  if (style === 'film') dress(el);
  const layer = sp.layer && sp.layer();
  if (layer) layer.appendChild(el);
  return el;
}
/** legacy scream(el): a death scream looks like one */
export function scream(el) { el.classList.add('agony'); el.style.setProperty('--pain', '1'); el.dataset.lvl = 2; return el; }

/** legacy talkOn(o, text, floor): replace self's bubble with a new one riding on it */
function show(sp, self, text, opts, t, key) {
  if (self.say) self.say.el.remove();
  const el = make(sp, text, opts.cls);
  self.said = t;
  const ms = TIMING.talk(el, floorOf(opts));
  self.say = { el, until: t + ms, ms, key };
  if (sp.extraCls) el.classList.add(sp.extraCls);
  if (typeof sp.life !== 'function') clock.wake();   // a speaker on its own clock (the phrasebook raid) never restarts the page's frame loop, as legacy raidSay did not
  heard(key, el, sp);
  return el;
}

// ---- gates: the legacy rules for who may speak when, by name ----
const GATES = {
  // legacy say(o, kind, force) for cards, pieces, shards and the katana
  card(self, key, opts, t, sp) {
    const gap = TIMING.gap, force = !!opts.force;
    if (!force && self.said && t - self.said < gap.card) return false;
    // one line per burst: a bubble is up long enough to be seen before another replaces it (a death scream may cut in)
    if (force && !opts.scream && self.say && t - self.said < gap.show) return false;
    if (sp.quiet) { if (self.said && t - self.said < sp.quiet) return false; }
    else if (opts.scream) { if (t - shared.scream < gap.scream) return false; shared.scream = t; }
    return true;
  },
  // legacy sevSay
  severed(self, key, opts, t) { return !(t - (self.said || -1e9) < (opts.force ? TIMING.gap.sevForce : TIMING.gap.sev)); },
  plain: () => true,
};

/**
 * Say a line. @returns the bubble record (self.say) or null when the gate held it back.
 * opts: { force, scream, mode: 'agony' | 'plain', pain, floor (TIMING.floor key or ms), text (already chosen), first: { id } , as, cls }
 */
export function say(self, key, opts = {}) {
  const sp = find(self, opts);
  if (sp.prefix && !key.startsWith(sp.prefix)) return null;
  const t = timeOf(sp);
  if (opts.mode === 'agony') return agony(sp, self, key, opts, t);
  if (sp.gate === 'arm') return armSay(sp, self, key, opts, t);
  const gate = opts.mode === 'plain' ? GATES.plain : typeof sp.gate === 'function' ? sp.gate : GATES[sp.gate];
  if (!gate(self, key, opts, t, sp)) return null;
  const el = show(sp, self, opts.text != null ? opts.text : line(key), opts, t, key);
  if (opts.scream) scream(el);
  if (sp.onSaid) sp.onSaid(self, key, self.say);
  return self.say;
}

// legacy cardSay(o, pain, LINES): three tiers by pain; louder, bigger, more often the more it hurts
function agony(sp, self, key, opts, t) {
  const pain = opts.pain, [t1, t2] = TUNE.speech.AGONY_TIERS, [g0, g1] = TUNE.speech.AGONY_GAP;
  const lvl = pain > t2 ? 2 : pain > t1 ? 1 : 0;
  if (self.said && t - self.said < g0 - g1 * pain && lvl <= (self.lvl || 0)) return null;
  const el = show(sp, self, line(key + '.' + lvl), opts, t, key + '.' + lvl);
  el.classList.add('agony'); el.style.setProperty('--pain', pain.toFixed(2)); if (lvl) el.dataset.lvl = lvl;
  self.lvl = lvl;
  return self.say;
}

// legacy clawSay(kind, force). Never two lines within gap.handIdle unless forced; a forced line cuts in on the last one once
// that has been up gap.show, otherwise it is queued in self.later (flushLater runs it); an unforced one is dropped
function armSay(sp, self, key, opts, t) {
  const gap = TIMING.gap, force = !!opts.force;
  if (!force && (t - self.said < gap.handIdle || t < (self.sayEnd || 0) + gap.after)) return null;
  if (t - self.said < gap.show) { if (force) self.later = { key, opts, at: self.said + gap.show }; return null; }
  self.later = null;
  if (self.say) self.say.el.remove();
  const text = opts.text != null ? opts.text : filmed(key) ? line(key) : opts.first && lines.once(opts.first.id) ? opts.first.text : lines.line(key);
  const el = make(sp, text, opts.cls);
  const ms = TIMING.talk(el, opts.floor != null ? floorOf(opts) : TIMING.floor[key.slice(key.indexOf('.') + 1)]);   // legacy TIMING.floor[kind]
  if (sp.extraCls) el.classList.add(sp.extraCls);
  self.said = t; self.sayEnd = t + ms; self.say = { el, until: t + ms, ms, key };
  clock.wake();
  heard(key, el, sp);
  if (sp.onSaid) sp.onSaid(self, key, self.say);
  return self.say;
}
/** legacy clawTick: a queued forced line is said when its time comes, unless it is more than gap.handLate late */
export function flushLater(self) {
  const sp = speakers.get('arm'), t = sp ? timeOf(sp) : clock.now();
  if (self.later && t >= self.later.at) { const l = self.later; self.later = null; if (t - l.at < TIMING.gap.handLate) return say(self, l.key, { ...l.opts, force: true }); }
  return null;
}

/**
 * A bubble left standing at a page point (legacy sayAt). It does not ride or slide; it is removed after its reading time
 * on WALL time (legacy setTimeout). opts: { scream, text, as ('page' default), floor }. @returns the element
 */
export function sayAt(x, y, key, opts = {}) {
  const sp = speakers.get(opts.as || 'page'); if (!sp) throw new Error('speech: no "page" speaker');
  const el = make(sp, opts.text != null ? opts.text : line(key), opts.cls);
  if (opts.scream) scream(el);
  el.style.translate = `calc(${x.toFixed(0)}px - 50%) ${y.toFixed(0)}px`;
  clock.real.after(TIMING.talk(el, floorOf(opts)), () => el.remove());
  heard(key, el, sp);
  return el;
}
/** A bubble inside an element, placed by CSS (the Heads / Tails buttons). opts: { text, floor, extra ms }. @returns the element */
export function sayIn(target, key, opts = {}) {
  const sp = speakers.get(opts.as || 'button') || { tag: 'span', cls: 'btn-say', tilt: false };
  const el = document.createElement(sp.tag); el.className = opts.cls || sp.cls; el.textContent = opts.text != null ? opts.text : line(key); el._filmKey = pending; pending = null;
  if (sp.tilt) { const [a, b] = TUNE.speech.TILT; el.style.setProperty('--tilt', (a + Math.random() * b).toFixed(1)); }
  if (style === 'film') dress(el);
  target.appendChild(el);
  clock.real.after(TIMING.talk(el, floorOf(opts)) + (opts.extra ?? TUNE.speech.BUTTON_EXTRA_MS), () => el.remove());
  heard(key, el, sp);
  return el;
}

/** take self's bubble down now */
export function hush(self) { if (self && self.say) { self.say.el.remove(); self.say = null; } }
/** legacy expiry check: false (and the bubble removed) once its time is up */
export function expire(self, t) { if (!self.say) return false; if (t > self.say.until) { self.say.el.remove(); self.say = null; return false; } return true; }
/** where self's bubble goes this frame: top centre (x, y) and its speaker's x (ax), page px; put on the page by layout() */
export function place(self, x, y, ax) { const s = self.say; if (!s) return; s.x = x; s.y = y; s.ax = ax; }

/** the riding bubbles of the given bodies: expire and anchor, in body order (legacy draw() loop). t: now() */
export function ride(bodies, t) {
  for (const o of bodies) {
    if (!o.say) continue;
    const sp = byKind.get(o.kind); if (!sp || !sp.anchor) continue;
    if (!expire(o, t)) continue;
    const a = sp.anchor(o, t); if (a) place(o, a.x, a.y, a.ax);
  }
}

/** legacy sayLayout(): every bubble that follows something is put on the page here, once a frame */
export function layout() {
  const html = document.documentElement, S = TUNE.speech;
  let hs = null;
  for (const f of firsts) { const s = f(); if (s && s.say && s.say.x != null) { hs = s; break; } }
  const h = hs ? hs.say : null, all = h ? [h] : [], x0 = scrollX + S.EDGE, x1 = scrollX + html.clientWidth - S.EDGE;
  for (const o of layoutSource()) if (o.say && o.say.x != null) all.push(o.say);
  for (const s of all) { if (!s.w) { s.w = s.el.offsetWidth; s.h = s.el.offsetHeight; } s.x = Math.max(x0 + s.w / 2, Math.min(x1 - s.w / 2, s.x)); }
  // something it holds up (the coin) is never covered by what it says: the bubble moves to the left of it
  const dodge = h && hs.dodge && hs.dodge.isConnected && hs.dodge.getBoundingClientRect();
  if (dodge && dodge.width && Math.abs(h.x - scrollX - (dodge.left + dodge.right) / 2) < (h.w + dodge.width) / 2 + S.DODGE && h.y - scrollY < dodge.bottom + S.DODGE && h.y - scrollY + h.h > dodge.top - S.DODGE)
    h.x = Math.max(x0 + h.w / 2, dodge.left + scrollX - S.DODGE_GAP - h.w / 2);
  // leaning makes a bubble taller by about 7% of its width at each end. A pair that was slid apart stays apart until it is well clear
  const hit = (a, b, pad) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.y + a.h / 2 - b.y - b.h / 2) < (a.h + b.h) / 2 + S.LEAN_GROW * (a.w + b.w) + pad - 4;
  if (h) for (const s of all) {
    if (s === h) continue;
    if (!hit(h, s, h.apart === s ? S.APART_HOLD : S.APART)) { if (h.apart === s) h.apart = null; continue; }
    h.apart = s;
    const dir = h.ax >= s.ax ? 1 : -1, need = (h.w + s.w) / 2 + S.APART - (h.x - s.x) * dir;
    h.x = Math.max(x0 + h.w / 2, Math.min(x1 - h.w / 2, h.x + dir * need / 2));
    s.x = Math.max(x0 + s.w / 2, Math.min(x1 - s.w / 2, h.x - dir * ((h.w + s.w) / 2 + S.APART)));
    if (hit(h, s, S.APART_TOUCH)) h.y = s.y - h.h - S.STACK;   // no room side by side (the screen's edge): the hand's goes on top
  }
  for (const s of all) {
    s.el.style.translate = `calc(${s.x.toFixed(1)}px - 50%) ${s.y.toFixed(1)}px`;
    const lean = Math.max(S.TAIL - s.w / 2, Math.min(s.w / 2 - S.TAIL, s.ax - s.x)).toFixed(0);
    if (lean !== s.lean) { s.lean = lean; s.el.style.setProperty('--tail', lean + 'px'); }
  }
}

// ---- silent film: while the 1926 egg is on (page/eggs.js emits 'page.film', src/reactions.js calls setStyle) ----
// Every bubble made from here (all speakers: cards, katana, the arm, old hands, the page, buttons, the phrasebook's) is dressed as
// a silent-film title card: the bubble itself goes see-through (so its CSS tail, which inherits the background, vanishes) and its
// words sit in a black card with white serif type, a thin double border and a small flourish. Inline styles only (styles/*.css are
// pinned). Its text stays the bubble's textContent, so reading time, the trace and the phrasebook see the same words.
// A few lists give way to 1926-only ones (FILM: key -> film list); the logic still sees the original key (the arm's onSaid, the
// bubble record), the said-hook gets the film key. A substituted line is one draw from the film list instead of one from the
// original: draws only change while the egg is on. Turning the style off undresses every film card still up.
let style = null, pending = null;
const dressed = new Set();
const FILM = {
  'card.slice': 'card.filmSlash', 'katana.cut': 'katana.film',
  'card.rip': 'card.filmAlas', 'card.smash': 'card.filmAlas', 'card.stab': 'card.filmAlas', 'card.agony.2': 'card.filmAlas', 'card.panic.2': 'card.filmAlas',
  'hand.rip': 'hand.film', 'hand.eat': 'hand.film', 'hand.cut': 'hand.film', 'hand.grab': 'hand.film', 'hand.stab': 'hand.film',
  'hand.severed': 'hand.filmCurses',
  'sev.cut': 'sev.film', 'sev.rise': 'sev.film', 'sev.flee': 'sev.film', 'sev.doomed': 'sev.film', 'sev.mourn': 'sev.film',
};
const filmed = (key) => style === 'film' && FILM[key] && lines.has(FILM[key]) ? FILM[key] : null;
/** pick a line for key: from its 1926 list while the film style is on (remembered for the said-hook), else from its own */
function line(key) { const f = filmed(key); pending = f; return lines.line(f || key); }
const INK = '#0d0c0b', PAPER = '#f2ecdd';
const FLOURISH = 'url("data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='8'><g fill='none' stroke='${PAPER}' stroke-width='.8'><path d='M2 4C9 0 15 8 23 4M37 4C45 0 51 8 58 4'/><path d='M26 4h8'/></g><circle cx='30' cy='4' r='1.3' fill='${PAPER}'/></svg>`) + '")';
const OUTER = { background: 'transparent', padding: '0', boxShadow: 'none', borderRadius: '0', rotate: '0deg' };   // title cards stand straight
/** dress a bubble as a title card (its words move into an inner card) */
function dress(el) {
  if (el._film && el.firstChild && el.firstChild._card) return;   // already a card (an element whose text was set again is re-dressed)
  const card = document.createElement('span'); card._card = true; card.textContent = el.textContent;
  Object.assign(card.style, { display: 'inline-block', background: `${INK} ${FLOURISH} no-repeat center bottom 4px / 52px 7px`, color: PAPER,
    font: '500 1.08em/1.3 "Playfair Display", "Didot", Georgia, "Times New Roman", serif', fontStyle: 'normal', letterSpacing: '.07em',
    padding: '8px 18px 14px', border: `3px double ${PAPER}`, borderRadius: '1px', boxShadow: `0 0 0 4px ${INK}, 0 8px 20px rgba(0, 0, 0, .45)`, textAlign: 'center' });
  el.textContent = ''; el.appendChild(card);
  el._film = true; Object.assign(el.style, OUTER);
  if (dressed.size > 40) for (const d of dressed) if (!d.isConnected) dressed.delete(d);
  dressed.add(el);
}
function undress(el) {
  if (!el._film) return;
  const text = el.textContent; el.textContent = text; el._film = false;
  for (const k in OUTER) el.style[k] = '';
}
/** the bubble style: 'film' (the 1926 egg) or null (normal bubbles). Off undresses the title cards still up */
export function setStyle(name) {
  style = name === 'film' ? 'film' : null;
  if (!style) { for (const el of dressed) undress(el); dressed.clear(); }
  else for (const el of dressed) if (!el.isConnected) dressed.delete(el);
}
export const getStyle = () => style;
/** dress any element (the toast) as a title card while the film style is on, or back */
export function filmDress(el, on = style === 'film') { if (on) dress(el); else undress(el); }

let installed = false;
export function install() {
  if (installed) return; installed = true;
  clock.onDraw(layout, 'bubbles');
}
