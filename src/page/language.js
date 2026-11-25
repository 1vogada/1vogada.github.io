// English-only mode (Ivo, 2026-11-24: on by default): no Bulgarian or Japanese in bubbles, greeting, slip, toasts or
// phrasebook. The new-code twin of scripts/lang.js.
// localStorage 'kiripad-lang': unset or 'en' = English only; 'all' = the mixed English / Bulgarian / Japanese site as it always was.
//
// The filter is applied when this module is EVALUATED (main.js imports it before boot(), so before any install and before
// anything speaks; legacy lang.js likewise ran before phrasebook.js). install() does the DOM part: data-lang on <html>, the
// 棚 glyph of #secret dropped, and the footer button #lang that flips the key and reloads.
// Other packages reach it through isEnglishOnly(), plain(text) and thinFortunes(list).

import { setLanguages, languages } from '../core/lines.js';
import { bus } from '../core/bus.js';

const KEY = 'kiripad-lang';
const foreign = /[Ѐ-ӿ぀-ヿ㐀-鿿]/;   // the same test as scripts/lang.js

let mode = null; try { mode = localStorage.getItem(KEY); } catch (e) {}
const en = mode !== 'all';
if (en) setLanguages(['en']);

/** true unless localStorage['kiripad-lang'] === 'all' (read once per page load) */
export const isEnglishOnly = () => en;
/** @returns {string[] | null} null = all languages */
export const get = () => languages();
/** "棚 · A shelf." -> "A shelf.": in English-only mode the parts of a notice that are not English are dropped (else unchanged) */
export const plain = (s) => !en || typeof s !== 'string' || !foreign.test(s) ? s : (s.split(' · ').filter((p) => !foreign.test(p)).join(' · ') || s);
/** a list of strings keeps its English ones (a list with none is left alone): legacy window.__thin for one flat list, copied */
export const thin = (list) => { if (!en) return list; const keep = list.filter((s) => typeof s !== 'string' || !foreign.test(s)); return keep.length ? keep : list; };
/** the omikuji FORTUNES, in place like scripts/lang.js: names lose their Bulgarian part, the 末吉 Japanese lines become their English, untitled */
export function thinFortunes(list) {
  if (!en) return list;
  for (const f of list) { f[1] = plain(f[1]); if (Array.isArray(f[2])) f[2] = f[2].map((t) => [t[1], '']); }
  return list;
}
/** switch: ['en'] = English only, null = all. Stores the choice and reloads, so every list is rebuilt from scratch */
export function set(l) {
  const all = !(l && l.length);
  try { localStorage.setItem(KEY, all ? 'all' : 'en'); } catch (e) {}
  bus.emit('language.changed', { languages: all ? null : [...l] });
  location.reload();
}

export function install(app) {
  const root = document.documentElement;
  root.dataset.lang = en ? 'en' : 'all';
  if (en) { const kanji = document.querySelector('#secret b'); if (kanji) kanji.remove(); }   // the 棚 next to "psst. type tana"
  // the switch sits in the footer next to the mode toggle
  const at = document.getElementById('toggle');
  if (at) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'toggle'; b.id = 'lang';
    b.textContent = en ? 'More languages' : 'English only';
    b.title = en ? 'Let the cards and the hand speak Bulgarian and Japanese too' : 'Keep everything in English';
    b.addEventListener('click', () => set(en ? null : ['en']));
    b.style.marginLeft = 'auto'; b.style.marginRight = '10px';   // both switches sit together at the right end of the footer
    at.before(b);
  }
}
