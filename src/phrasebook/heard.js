// Heard lines: every line you have heard on this browser, kept in localStorage 'kiripad-heard' (a list of bubble texts, oldest
// first, at most TUNE.heard.MAX). Every bubble that goes up, from any speaker, is heard: core/speech.js onSaid (the said-hook).
// The per-visit record phrase-say kept in sessionStorage under the same key is folded in once and dropped.
// "Fresh": the lines heard since the phrasebook was last opened. localStorage 'kiripad-heard-seen' holds how many of the list
// were there at that look, and when (ms since 1970), so the diary can tell its new pages too. look() takes that snapshot and
// moves the mark; the menu (./menu.js) calls it on every open and writes the fresh ones out with a red ink dot that fades.
// Used by ./menu.js (blots the lines you have not heard) and ./say.js (refuses them). Draws no Math.random. Test hook: __heard.
import { TUNE } from '../core/tune.js';
import { onSaid } from '../core/speech.js';
import { allLines } from '../core/lines.js';
import { hook } from '../core/debug.js';

const KEY = 'kiripad-heard', SEEN = 'kiripad-heard-seen';
const order = [], set = new Set(), subs = [];
let seen = { n: 0, at: 0 };

function load() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  try {   // phrase-say's old record, kept for one visit only
    const old = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    if (Array.isArray(old) && old.length) { arr = (Array.isArray(arr) ? arr : []).concat(old); sessionStorage.removeItem(KEY); }
  } catch (e) {}
  if (Array.isArray(arr)) for (const t of arr) if (typeof t === 'string' && t && !set.has(t)) { set.add(t); order.push(t); }
  try { const s = JSON.parse(localStorage.getItem(SEEN) || 'null'); if (s && Number.isFinite(s.n)) seen = { n: s.n, at: +s.at || 0 }; } catch (e) {}
  trim(); save();
}
function trim() { while (order.length > TUNE.heard.MAX) { set.delete(order.shift()); if (seen.n > 0) seen.n--; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(order)); localStorage.setItem(SEEN, JSON.stringify(seen)); } catch (e) {}
}

/** the said-hook: the words of every bubble are a line you have now heard */
function remember({ text }) {
  if (!text || set.has(text)) return;
  set.add(text); order.push(text); trim(); save();
  for (const fn of subs.slice()) fn(text);
}

/** have you heard this line on this browser? */
export const has = (text) => set.has(text);
/** every line heard, oldest first */
export const texts = () => order.slice();
/** fn(text) whenever a line is heard for the first time; returns an unsubscribe */
export function onHeard(fn) { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; }
/** what is new since the last look: { fresh: Set of texts, since: ms of that look (0: never looked) } */
export const peek = () => ({ fresh: new Set(order.slice(Math.min(seen.n, order.length))), since: seen.at });
/** the phrasebook is looked at: returns peek() from before, and moves the mark to now */
export function look() { const p = peek(); seen = { n: order.length, at: Date.now() }; save(); return p; }

/** tests: hear every line there is (and look at them, so none is fresh); forget all of it */
function everything() {
  for (const d of allLines()) for (const l of d.lines) if (!set.has(l.text)) { set.add(l.text); order.push(l.text); }
  seen = { n: order.length, at: Date.now() }; save();
}
function forget() { order.length = 0; set.clear(); seen = { n: 0, at: 0 }; save(); }

load();
onSaid(remember);
hook('__heard', { has, texts, fresh: () => [...peek().fresh], all: everything, forget });

export function install(app) {}
