// Every line anything on the page can say, by key, and the one picker.
//
// line(key) is EXACTLY legacy pick(): the line said last (from this list, or by anyone) never comes straight back, one said
// a few lines ago has a tenth of a fresh line's chance, one Math.random() draw per pick (none for a list of fewer than two),
// and the memory is per list array and shared across lists (the last line said anywhere). pick(array) is the same picker
// for any array (legacy window.__pick; the phrasebook raid also picks DOM elements with it).
//
// defineLines(key, list, { who, trigger, gloss, lang, legacy })
//   key      'card.pull', 'hand.rip', 'sev.gloat', 'card.agony.1' ... (see README "Line keys")
//   list     the array itself. Its identity is the picker's memory key: never copy it.
//   who      'card' | 'katana' | 'hand' | 'sev' | 'button' | 'raid' | 'toast' ... (who says it; for the phrasebook)
//   trigger  { title, when } what sets it off (phrasebook text)
//   gloss    { [line]: 'English meaning' } for the Bulgarian and Japanese lines
//   lang     per-line language tags: a string for all, an array per line, or omitted to detect ('ja' | 'bg' | 'en')
//   legacy   'SAY.pull' | 'AGONY.1' | 'BEG' ...: where the array sits in the legacy window.__lines (debug.js builds it)
//
// setLanguages(['en']) keeps only lines tagged with one of those languages (an emptied list falls back to all of it);
// null (the default) keeps every line and the original arrays, so picks are identical to legacy.

const JP = /[぀-ヿ一-鿿]/, BG = /[Ѐ-ӿ]/;
/** the language of one line: 'ja' | 'bg' | 'en' (phrasebook langOf, as a BCP 47 tag) */
export const langOf = (s) => (typeof s !== 'string' ? 'en' : JP.test(s) ? 'ja' : BG.test(s) ? 'bg' : 'en');

export function createLines() {
  const defs = new Map();     // key -> def
  const mem = new WeakMap();  // array -> indices given out lately, newest first
  let said = null;            // the last line said by anyone
  let langs = null;           // null = all
  const firsts = new Set();

  function pick(a) {
    if (a.length < 2) return a[0];
    let m = mem.get(a); if (!m) mem.set(a, m = []);
    const keep = Math.min(3, a.length - 2), w = a.map((s, i) => i === m[0] || s === said ? 0 : m.indexOf(i) > 0 ? 0.1 : 1);
    let sum = 0; for (const v of w) sum += v;
    let i = 0; if (sum > 0) { let r = Math.random() * sum; while (i < a.length - 1 && (r -= w[i]) >= 0) i++; } else i = (m[0] + 1) % a.length;
    m.unshift(i); m.length = Math.min(m.length, keep + 1); if (typeof a[i] === 'string') said = a[i];
    return a[i];
  }

  function defineLines(key, list, opts = {}) {
    if (defs.has(key)) throw new Error(`lines: "${key}" is defined twice`);
    if (!Array.isArray(list)) throw new Error(`lines: "${key}" needs an array`);
    const tags = list.map((s, i) => (Array.isArray(opts.lang) ? opts.lang[i] : typeof opts.lang === 'string' ? opts.lang : langOf(s)) || 'en');
    defs.set(key, { key, list, tags, who: opts.who || key.split('.')[0], trigger: opts.trigger || null, gloss: opts.gloss || {}, legacy: opts.legacy || null, filtered: null });
    return list;
  }
  const def = (key) => { const d = defs.get(key); if (!d) throw new Error(`lines: unknown key "${key}"`); return d; };
  /** the list line(key) picks from: the original array, or (with a language filter) a stable filtered copy */
  function list(key) {
    const d = def(key);
    if (!langs) return d.list;
    if (!d.filtered) { const f = d.list.filter((_, i) => langs.includes(d.tags[i])); d.filtered = f.length ? f : d.list; }
    return d.filtered;
  }
  const line = (key) => pick(list(key));
  const has = (key) => defs.has(key);
  /** the first time this page load (per id) gives `text`, every later time null: legacy "the first rip is always the cheese pull" */
  const once = (id) => { if (firsts.has(id)) return false; firsts.add(id); return true; };
  function setLanguages(l) { langs = l && l.length ? [...l] : null; for (const d of defs.values()) d.filtered = null; }
  const languages = () => (langs ? [...langs] : null);
  /** everything, for the phrasebook: [{ key, who, trigger, legacy, lines: [{ text, lang, gloss, shown }] }] */
  const allLines = () => [...defs.values()].map((d) => ({ key: d.key, who: d.who, trigger: d.trigger, legacy: d.legacy,
    lines: d.list.map((text, i) => ({ text, lang: d.tags[i], gloss: d.gloss[text] || null, shown: !langs || langs.includes(d.tags[i]) })) }));
  /** the legacy window.__lines object ({ SAY: { pull: [...] }, AGONY: [[...], ...], BEG: [...] ...}) built from the very same arrays */
  function legacy() {
    const out = {};
    for (const d of defs.values()) {
      if (!d.legacy) continue;
      const [top, sub] = d.legacy.split('.');
      if (sub == null) { out[top] = d.list; continue; }
      if (/^\d+$/.test(sub)) { (out[top] = out[top] || [])[+sub] = d.list; } else (out[top] = out[top] || {})[sub] = d.list;
    }
    return out;
  }
  /** forget the picker memory (tests) */
  function _reset() { said = null; firsts.clear(); }
  return { defineLines, line, list, pick, has, once, setLanguages, languages, allLines, legacy, langOf, _reset };
}

export const lines = createLines();
export const { defineLines, line, list, pick, has, once, setLanguages, languages, allLines, legacy } = lines;
export function install() {}
