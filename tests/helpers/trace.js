'use strict';
// Turning the raw recording into the trace that is compared with tests/golden, and the comparison itself.
//
// A trace is { bubbles: [{ doc, t, ms, who, key, text, lvl }], states: [{ doc, t, claw, sev, pb, kat, shelf, grab, objs }] }
//   t: page time in ms (the document starts at 0, the clock is frozen, so it is exact); ms: how long the bubble stayed up (null: still up)
//   who: card | hand (the arm's hand and the cut-off hands: .claw-say) | btn (.btn-say) | pb-hand | pb-card | pb-scream (phrasebook)
//   key: which list(s) of lines the text comes from, e.g. "CLAW_SAY.hello" or "SAY.throw|CLAW_SAY.throw" (several when a line is in several lists)
//
// Two ways to compare (TRACE_MATCH):
//   strict  everything must be identical: texts, times, durations, every state sample. Legacy against its own recording: proves determinism
//   kind    the order of (who, key) of the bubbles, and the order of the actors' state changes (claw, sev, pb, kat, shelf) without times,
//           texts or object counts. For the rewrite (NEXT=1): a different order of Math.random() calls picks other lines from the same
//           lists and shifts timings by a frame, and that is still the same behaviour
const fs = require('node:fs');
const path = require('node:path');

// Which list(s) a bubble's text comes from. The index is built from the modules' own line registry (src/core/lines.js
// allLines(), filled by src/lines/*.js loaded here in node, in the order src/main.js imports them), never from the page:
//  - a list that carries a `legacy:` path ('SAY.pull', 'AGONY.1', 'BEG') is named by that path, walked in the shape and order of
//    the old window.__lines (what lines.legacy() builds), exactly as the goldens were recorded
//  - the phrasebook raid's lists keep the names the goldens give them (PB_NAMES: the old scripts/phrasebook.js constants)
//  - every other list (a new one) is named by its own key, e.g. 'hand.wave'
const SRC = path.join(__dirname, '..', '..', 'src');
const PB_NAMES = { 'raid.bored': 'PB.RAID_SAY', 'raid.swat': 'PB.SWAT_SAY', 'raid.grudge': 'PB.GRUDGE_SAY', 'raid.angry': 'PB.ANGRY_SAY',
  'raid.scroll': 'PB.SCROLL_SAY', 'raid.help': 'PB.HELP_SAY', 'raid.alone': 'PB.ALONE_SAY', 'raid.more': 'PB.MORE_SAY', 'raid.hide': 'PB.HIDE_SAY' };

let registry = null;
/** every list the page can say: [{ key, legacy, lines: [{ text }] }] (src/core/lines.js allLines()), loaded once */
function allLines() {
  if (registry) return registry;
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const files = [...main.matchAll(/from '\.\/lines\/([\w-]+\.js)'/g)].map((m) => m[1]);
  for (const f of fs.readdirSync(path.join(SRC, 'lines')).sort()) if (f.endsWith('.js') && !files.includes(f)) files.push(f);
  // the modules are ES modules in a package without "type": node loads them but warns once; that warning is noise here
  const emit = process.emitWarning;
  process.emitWarning = function (w, ...a) { const code = a[0] && typeof a[0] === 'object' ? a[0].code : a[1]; if (code === 'MODULE_TYPELESS_PACKAGE_JSON') return undefined; return emit.call(process, w, ...a); };
  try {
    const { lines } = require(path.join(SRC, 'core', 'lines.js'));
    for (const f of files) require(path.join(SRC, 'lines', f));
    registry = lines.allLines();
  } finally { process.emitWarning = emit; }
  return registry;
}

/** text -> [list names], first name first */
function keyIndex(defs = allLines()) {
  const idx = new Map();
  const add = (text, key) => { const k = idx.get(text); if (!k) idx.set(text, [key]); else if (!k.includes(key)) k.push(key); };
  const texts = (d) => d.lines.map((l) => l.text);
  // 1. the legacy-named lists, in the shape of the old window.__lines (same construction as lines.legacy()), walked as before
  const shaped = {};
  for (const d of defs) {
    if (!d.legacy) continue;
    const [top, sub] = d.legacy.split('.');
    if (sub == null) shaped[top] = texts(d);
    else if (/^\d+$/.test(sub)) (shaped[top] = shaped[top] || [])[+sub] = texts(d);
    else (shaped[top] = shaped[top] || {})[sub] = texts(d);
  }
  for (const [list, v] of Object.entries(shaped)) {
    if (Array.isArray(v)) v.forEach((t, i) => (Array.isArray(t) ? t.forEach((x) => add(x, `${list}.${i}`)) : add(t, list)));
    else if (v && typeof v === 'object') for (const [k, arr] of Object.entries(v)) if (Array.isArray(arr)) arr.forEach((t) => add(t, `${list}.${k}`));
  }
  // 2. the phrasebook raid's lists, under their old names
  const byKey = new Map(defs.map((d) => [d.key, d]));
  for (const [key, name] of Object.entries(PB_NAMES)) if (byKey.has(key)) texts(byKey.get(key)).forEach((t) => add(t, name));
  // 3. every other list under its own key (a line given as alternatives counts each one)
  for (const d of defs) {
    if (d.legacy || PB_NAMES[d.key]) continue;
    for (const t of texts(d)) (Array.isArray(t) ? t : [t]).forEach((x) => add(x, d.key));
  }
  return idx;
}

function who(cls) {
  const c = ' ' + cls + ' ';
  if (c.includes(' btn-say ')) return 'btn';
  if (c.includes(' pb-say ')) return c.includes(' hand ') ? 'pb-hand' : c.includes(' scream ') ? 'pb-scream' : 'pb-card';
  if (c.includes(' claw-say ')) return 'hand';
  return 'card';
}

let cachedIdx = null;
function buildTrace(raw) {
  const idx = cachedIdx || (cachedIdx = keyIndex());
  const bubbles = raw.bubbles.map((b) => ({ doc: b.doc, t: b.t, ms: b.ms, who: who(b.cls), key: (idx.get(b.text) || ['?']).join('|'), text: b.text, ...(b.lvl ? { lvl: b.lvl } : {}) }));
  return { bubbles, states: raw.states };
}

const KIND_FIELDS = ['claw', 'sev', 'pb', 'kat', 'shelf'];
const NOT_KIND = new Set(['doc', 't', 'grab', 'objs', ...KIND_FIELDS]);
function kindStates(states) {
  const out = []; let last = null;
  for (const s of states) {
    // the fields a new actor reports (harness sampleState) count as state changes too; existing goldens have none
    const more = Object.keys(s).filter((k) => !NOT_KIND.has(k)).sort().map((k) => `${k}=${JSON.stringify(s[k])}`);
    const p = [...KIND_FIELDS.map((f) => `${f}=${s[f]}`), ...more].join(' ');
    if (p !== last) { out.push(`${s.doc}| ${p}`); last = p; }
  }
  return out;
}

function firstDiff(a, b, show) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = JSON.stringify(a[i]), y = JSON.stringify(b[i]);
    if (x !== y) return `#${i} of ${a.length} expected / ${b.length} actual\n    expected: ${show(a[i])}\n    actual:   ${show(b[i])}`;
  }
  return null;
}

// returns null when the traces match, otherwise a description of the first difference
function compareTrace(want, got, mode = 'strict') {
  if (mode === 'strict') {
    const d1 = firstDiff(want.bubbles, got.bubbles, (b) => (b ? `${b.t}ms +${b.ms} ${b.who} ${b.key} "${b.text}"` : '(none)'));
    if (d1) return 'bubbles ' + d1;
    const d2 = firstDiff(want.states, got.states, (s) => (s ? JSON.stringify(s) : '(none)'));
    if (d2) return 'states ' + d2;
    return null;
  }
  if (mode === 'kind') {
    const bk = (t) => t.bubbles.map((b) => `${b.doc}| ${b.who} ${b.key}`);
    const d1 = firstDiff(bk(want), bk(got), (x) => x || '(none)');
    if (d1) return 'bubbles ' + d1;
    const d2 = firstDiff(kindStates(want.states), kindStates(got.states), (x) => x || '(none)');
    if (d2) return 'states ' + d2;
    return null;
  }
  throw new Error('TRACE_MATCH must be strict or kind');
}

module.exports = { buildTrace, compareTrace, kindStates, keyIndex, allLines, who, PB_NAMES };
