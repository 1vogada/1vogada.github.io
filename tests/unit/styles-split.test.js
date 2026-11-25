'use strict';
// The split of index.html's inline <style> into styles/*.css (styles/README.md) changes nothing:
//  1. the files, concatenated in link order, hold exactly the rules of the inline block (each top-level rule's cssText as Chromium's
//     CSSOM parses it, once each, nothing added or lost), and each file keeps the rules in their original order;
//  2. the split moves some rules past others (a feature's rules were spread over the block). The order of two rules only matters
//     when both can set the same property on the same element with the same specificity and importance. For every pair whose order
//     changed, it shows one of these fails: they set no longhand in common (with !important apart), or no selector of one has the
//     same specificity and pseudo-element as a selector of the other, or the elements the two selectors style cannot be one
//     element: different tags, different ids (a bare id is looked up in index.html for its tag), or each needs a different class
//     of COMPONENTS, the classes that name what an element is and that no element ever carries two of. That last fact is checked
//     here over every class string in index.html and the page scripts, and in the rendered page in every state of
//     tests/unit/styles-split.screens.js;
//  3. the <link> lines in styles/README.md (and in index.html, once the inline block is replaced) are in that same order.
// The inline block is read from index.html, or, once it has been replaced by the links, from the commit the split was made against.
// Needs Chromium through Playwright (preinstalled); skipped if it cannot be launched. Run: node --test tests/unit/styles-split.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ORDER = ['base', 'cards', 'physics', 'hand', 'omikuji', 'fog', 'crazy'];
const BASE_COMMIT = 'df0dc3b';   // the commit whose index.html inline <style> was split
// what an element is: no element carries two of these (checked below). Only classes the reordered pairs need are listed
const COMPONENTS = ['band', 'btn', 'btn-say', 'card', 'claw', 'crease', 'cursor', 'date', 'empty', 'katana', 'katana-in', 'omi-actions',
  'omi-pick', 'omi-puff', 'omi-seal', 'omikuji', 'phys-actions', 'pill', 'pin', 'reader', 'sec', 'secret', 'slip', 'slop-only', 'toast',
  'toggle', 'vein'];
const SOURCES = ['index.html', 'scripts/legacy.js', 'scripts/phrasebook.js', 'scripts/lang.js'];

// the inline <style> block of an index.html (the only <style> without attributes in the head), or null
function inlineBlock(html) {
  const m = /<head>[\s\S]*?<style>([\s\S]*?)<\/style>[\s\S]*?<\/head>/.exec(html);
  return m ? m[1] : null;
}
function referenceCss() {
  const own = inlineBlock(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  if (own) return { css: own, from: 'index.html' };
  const old = execFileSync('git', ['show', BASE_COMMIT + ':index.html'], { cwd: ROOT, encoding: 'utf8' });
  return { css: inlineBlock(old), from: BASE_COMMIT + ':index.html' };
}

// ---- specificity: [ids, classes/attributes/pseudo-classes, types/pseudo-elements], and the pseudo-element the selector ends in ----
function splitTop(s, sep) {   // split on sep outside parentheses and brackets
  const out = []; let d = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
    if (ch === sep && d === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
function specificity(sel) {
  const sp = [0, 0, 0]; let pseudo = '';
  let i = 0;
  const add = (v) => { for (let k = 0; k < 3; k++) sp[k] += v[k]; };
  const max = (list) => list.map((x) => specificity(x).sp).reduce((a, b) => (cmp(a, b) >= 0 ? a : b), [0, 0, 0]);
  while (i < sel.length) {
    const ch = sel[i];
    if (ch === '#') { sp[0]++; i++; while (i < sel.length && /[\w-]/.test(sel[i])) i++; }
    else if (ch === '.') { sp[1]++; i++; while (i < sel.length && /[\w-]/.test(sel[i])) i++; }
    else if (ch === '[') { sp[1]++; let d = 0; do { if (sel[i] === '[') d++; if (sel[i] === ']') d--; i++; } while (d > 0); }
    else if (ch === ':') {
      const el = sel[i + 1] === ':'; i += el ? 2 : 1;
      let name = ''; while (i < sel.length && /[\w-]/.test(sel[i])) name += sel[i++];
      let arg = null;
      if (sel[i] === '(') { let d = 0, a = ''; do { if (sel[i] === '(') d++; if (sel[i] === ')') d--; a += sel[i]; i++; } while (d > 0); arg = a.slice(1, -1); }
      if (el || ['before', 'after', 'first-line', 'first-letter'].includes(name)) { sp[2]++; pseudo = '::' + name + (arg ? '(' + arg + ')' : ''); }
      else if (name === 'where') { /* 0 */ }
      else if (['not', 'is', 'has', 'matches'].includes(name)) add(max(splitTop(arg, ',')));
      else if (/^nth-/.test(name) && arg && / of /.test(arg)) { sp[1]++; add(max(splitTop(arg.split(/ of /)[1], ','))); }
      else sp[1]++;
    }
    else if (ch === '*') i++;
    else if (/[a-zA-Z]/.test(ch)) { sp[2]++; while (i < sel.length && /[\w-]/.test(sel[i])) i++; }
    else i++;   // combinators, spaces
  }
  return { sp, pseudo };
}
// the last compound of a selector (the element it styles), without its pseudo-element
function subject(sel) {
  let d = 0, cut = 0;
  for (let i = 0; i < sel.length; i++) { const ch = sel[i]; if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--; else if (d === 0 && /[\s>+~]/.test(ch)) cut = i + 1; }
  return sel.slice(cut).replace(/::?(before|after)\b.*$/, '');
}
// two selectors whose subjects need different tags, different ids or different components never match one element
function exclusive(s1, s2, html) {
  const a = subject(s1), b = subject(s2);
  const id = (x) => (/#([\w-]+)/.exec(x) || [null, null])[1];
  const tag = (x) => { const t = /^[a-zA-Z][\w-]*/.exec(x); if (t) return t[0].toLowerCase();
    const m = id(x) && new RegExp(`<([a-zA-Z][\\w-]*)[^>]*\\sid="${id(x)}"`).exec(html); return m ? m[1].toLowerCase() : null; };
  const comp = (x) => [...x.matchAll(/\.([\w-]+)/g)].map((m) => m[1]).find((c) => COMPONENTS.includes(c)) || null;
  if (tag(a) && tag(b) && tag(a) !== tag(b)) return true;
  if (id(a) && id(b) && id(a) !== id(b)) return true;
  if (comp(a) && comp(b) && comp(a) !== comp(b)) return true;
  return false;
}
// every class string of the page (class="...", className = '...', setAttribute('class', ...)) and every class added with classList
function classStrings() {
  const out = [], added = [];
  for (const f of SOURCES) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of src.matchAll(/\bclass\s*=\s*\\?(["'])(.*?)\\?\1/g)) out.push({ f, s: m[2] });
    for (const m of src.matchAll(/\.className\s*=\s*([^;\n]*)/g)) out.push({ f, s: m[1] });
    for (const m of src.matchAll(/setAttribute\(\s*'class'\s*,\s*([^;\n]*)/g)) out.push({ f, s: m[1] });
    for (const m of src.matchAll(/classList\.(?:add|toggle|replace)\(([^)]*)\)/g)) added.push({ f, s: m[1] });
  }
  return { out, added };
}
function cmp(a, b) { for (let k = 0; k < 3; k++) if (a[k] !== b[k]) return a[k] - b[k]; return 0; }

// ---- parse with the browser: one entry per top-level rule ----
function parseAll(page, sheets) {
  return page.evaluate((sheets) => sheets.map((text) => {
    const sh = new CSSStyleSheet(); sh.replaceSync(text);
    const flat = (rule, media) => {
      if (rule instanceof CSSStyleRule) {
        const props = [];
        for (let k = 0; k < rule.style.length; k++) { const p = rule.style.item(k); props.push(p + (rule.style.getPropertyPriority(p) ? ' !important' : '')); }
        return [{ sel: rule.selectorText, media, props }];
      }
      if (rule.cssRules) return [...rule.cssRules].flatMap((r) => flat(r, (media ? media + ' and ' : '') + (rule.conditionText || rule.media?.mediaText || '')));
      return [];
    };
    return [...sh.cssRules].map((r) => ({ cssText: r.cssText, type: r.constructor.name, name: r.name || null, styles: flat(r, '') }));
  }), sheets);
}

test('styles/*.css hold the inline <style> rules unchanged, in an order that keeps the cascade', async (t) => {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { t.skip('playwright is not installed'); return; }
  let browser;
  try { browser = await chromium.launch(); } catch (e) { t.skip('Chromium could not be launched: ' + e.message); return; }
  try {
    const page = await browser.newPage();
    const ref = referenceCss();
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.ok(ref.css, 'found the inline <style> block');
    const texts = ORDER.map((f) => fs.readFileSync(path.join(ROOT, 'styles', f + '.css'), 'utf8'));
    const [A, ...files] = await parseAll(page, [ref.css, ...texts]);
    const B = files.flatMap((rules, fi) => rules.map((r) => ({ ...r, file: ORDER[fi] })));

    // 1. the same rules, once each
    const key = (r) => r.cssText;
    const sortedA = A.map(key).sort(), sortedB = B.map(key).sort();
    const lost = sortedA.filter((x) => !sortedB.includes(x)), extra = sortedB.filter((x) => !sortedA.includes(x));
    assert.deepEqual({ lost, extra }, { lost: [], extra: [] }, 'no rule lost, none added or changed');
    assert.deepEqual(sortedB, sortedA, 'every rule exactly as many times as in the inline block');
    // map each rule of B to its index in A (repeated cssText: in order of appearance)
    const used = new Set();
    const pos = B.map((r) => { const i = A.findIndex((a, k) => !used.has(k) && a.cssText === r.cssText); used.add(i); return i; });
    for (const f of ORDER) {
      const idx = pos.filter((_, k) => B[k].file === f);
      assert.deepEqual(idx, [...idx].sort((a, b) => a - b), `styles/${f}.css keeps the original order of its rules`);
    }

    // 2. every pair the split reorders: no property in common, or no selector pair of equal specificity on the same pseudo-element
    const kf = A.filter((r) => r.type === 'CSSKeyframesRule').map((r) => r.name);
    assert.deepEqual(kf.filter((n, k) => kf.indexOf(n) !== k), [], '@keyframes names are unique, so their order never matters');
    // no element carries two components: no class string names two, and classList never adds one
    const { out: strs, added } = classStrings();
    const tokens = (x) => [...x.matchAll(/[\w-]+/g)].map((m) => m[0]);
    const two = strs.filter(({ s }) => new Set(tokens(s).filter((c) => COMPONENTS.includes(c))).size > 1);
    assert.deepEqual(two, [], 'no class string names two components');
    const add = added.filter(({ s }) => [...s.matchAll(/'([^']*)'/g)].some((m) => tokens(m[1]).some((c) => COMPONENTS.includes(c))));
    assert.deepEqual(add, [], 'classList never adds a component class');
    assert.ok(strs.length > 100, `found the class strings (${strs.length})`);
    let inverted = 0, sharing = 0;
    const conflicts = [];
    for (let x = 0; x < B.length; x++) {
      for (let y = x + 1; y < B.length; y++) {
        if (pos[x] < pos[y]) continue;   // still in the original order
        inverted++;
        let shared = false;
        for (const r1 of B[x].styles) {
          for (const r2 of B[y].styles) {
            const common = r1.props.filter((p) => r2.props.includes(p));
            if (!common.length) continue;
            shared = true;
            for (const s1 of splitTop(r1.sel, ',')) {
              for (const s2 of splitTop(r2.sel, ',')) {
                const a = specificity(s1), b = specificity(s2);
                if (cmp(a.sp, b.sp) !== 0 || a.pseudo !== b.pseudo || exclusive(s1, s2, html)) continue;
                conflicts.push(`${s1} (${B[x].file}) now after ${s2} (${B[y].file}): ${common.join(', ')}`);
              }
            }
          }
        }
        if (shared) sharing++;
      }
    }
    assert.deepEqual(conflicts, [], 'no reordered pair can compete in the cascade');

    // 3. the documented link order
    const readme = fs.readFileSync(path.join(ROOT, 'styles', 'README.md'), 'utf8');
    const links = (html) => [...html.matchAll(/<link rel="stylesheet" href="\/?styles\/(\w+)\.css[^"]*">/g)].map((m) => m[1]).filter((f) => ORDER.includes(f));
    assert.deepEqual(links(readme), ORDER, 'styles/README.md gives the <link> lines in link order');
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    if (!inlineBlock(idx)) assert.deepEqual(links(idx), ORDER, 'index.html links the files in that order');

    const counts = ORDER.map((f) => {
      const rs = B.filter((r) => r.file === f);
      return `${f}: ${rs.length} rules (${rs.reduce((n, r) => n + r.styles.length, 0)} style rules, ${rs.filter((r) => r.type === 'CSSKeyframesRule').length} @keyframes, ${rs.filter((r) => r.type === 'CSSMediaRule').length} @media)`;
    });
    t.diagnostic(`reference: ${ref.from}, ${A.length} top-level rules`);
    for (const c of counts) t.diagnostic(c);
    t.diagnostic(`${inverted} pairs of top-level rules change order; ${sharing} of them share a property; none can compete for one element`);
  } finally {
    await browser.close();
  }
});

module.exports = { ORDER, COMPONENTS, inlineBlock, BASE_COMMIT };
