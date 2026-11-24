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

// the phrasebook keeps its own lists (the hand's lines in the menu) inside scripts/phrasebook.js; they are read from there once
let pbLists = null;
function phrasebookLists() {
  if (pbLists) return pbLists;
  pbLists = {};
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'phrasebook.js'), 'utf8');
    for (const m of src.matchAll(/const ([A-Z]+_SAY) = (\[[^\n]*\]);/g)) { try { pbLists[m[1]] = new Function('return ' + m[2])(); } catch (e) { /* skip */ } }
  } catch (e) { /* no phrasebook */ }
  return pbLists;
}

function keyIndex(lines) {
  const idx = new Map();
  const add = (text, key) => { const k = idx.get(text); if (!k) idx.set(text, [key]); else if (!k.includes(key)) k.push(key); };
  for (const [list, v] of Object.entries(lines || {})) {
    if (Array.isArray(v)) v.forEach((t, i) => (Array.isArray(t) ? t.forEach((x) => add(x, `${list}.${i}`)) : add(t, list)));
    else if (v && typeof v === 'object') for (const [k, arr] of Object.entries(v)) if (Array.isArray(arr)) arr.forEach((t) => add(t, `${list}.${k}`));
  }
  for (const [list, arr] of Object.entries(phrasebookLists())) arr.forEach((t) => add(t, 'PB.' + list));
  return idx;
}

function who(cls) {
  const c = ' ' + cls + ' ';
  if (c.includes(' btn-say ')) return 'btn';
  if (c.includes(' pb-say ')) return c.includes(' hand ') ? 'pb-hand' : c.includes(' scream ') ? 'pb-scream' : 'pb-card';
  if (c.includes(' claw-say ')) return 'hand';
  return 'card';
}

let cachedIdx = null, cachedFor = null;
function buildTrace(raw, lines) {
  if (cachedFor !== lines) { cachedIdx = keyIndex(lines); cachedFor = lines; }
  const idx = cachedIdx;
  const bubbles = raw.bubbles.map((b) => ({ doc: b.doc, t: b.t, ms: b.ms, who: who(b.cls), key: (idx.get(b.text) || ['?']).join('|'), text: b.text, ...(b.lvl ? { lvl: b.lvl } : {}) }));
  return { bubbles, states: raw.states };
}

const KIND_FIELDS = ['claw', 'sev', 'pb', 'kat', 'shelf'];
function kindStates(states) {
  const out = []; let last = null;
  for (const s of states) {
    const p = KIND_FIELDS.map((f) => `${f}=${s[f]}`).join(' ');
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

module.exports = { buildTrace, compareTrace, kindStates, keyIndex, who };
