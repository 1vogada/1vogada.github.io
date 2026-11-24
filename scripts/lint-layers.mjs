#!/usr/bin/env node
// Layer lint for src/ (no dependencies). Fails (exit 1) on:
//   - an import that breaks the layer order: a file may import only from layers above it (lower number), or from its own
//     package (src/core, src/world, one actor = src/actors/<name>(.js|/), src/scenes, src/page, src/phrasebook, src/lines);
//     layer 4 is split: page/ and lines/ are 4, scenes/ and phrasebook/ are 4.5 (they may import page/, not each other);
//     src/main.js may import anything in src/
//   - an actor importing another actor
//   - an import that leaves src/ or is not a relative path
//   - setTimeout | setInterval | clearTimeout | clearInterval | requestAnimationFrame | cancelAnimationFrame | performance.now
//     outside src/core/ (use core/clock.js), and window.__ outside src/core/debug.js
// Comments are ignored. Usage: node scripts/lint-layers.mjs [root]   (root defaults to the repo this script is in)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..'));
const SRC = join(ROOT, 'src');

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.m?js$/.test(n) ? [p] : []; });
const rel = (p) => relative(SRC, p).split(sep).join('/');

/** { layer, pkg } of a path relative to src */
function where(r) {
  const [top, second] = r.split('/');
  if (r === 'main.js' || r === 'reactions.js') return { layer: 5, pkg: r };
  if (top === 'core') return { layer: 1, pkg: 'core' };
  if (top === 'world') return { layer: 2, pkg: 'world' };
  if (top === 'actors') return { layer: 3, pkg: 'actors/' + (second || '').replace(/\.m?js$/, ''), actor: true };
  if (top === 'page' || top === 'lines') return { layer: 4, pkg: top };
  if (top === 'scenes' || top === 'phrasebook') return { layer: 4.5, pkg: top };   // they sit on the page: may import page/
  return { layer: 0, pkg: '?' };
}

// remove comments, keep strings (so '//' inside a URL string survives) and keep line numbers
function strip(src) {
  let out = '', i = 0, q = null;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (q) {
      out += c;
      if (c === '\\') { out += d || ''; i += 2; continue; }
      if (c === q) q = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') out += '\n'; i++; } i += 2; continue; }
    if (c === '/') {   // a regex literal (after an operator, a bracket or `return`): copy it whole, quotes inside it are not strings
      const before = out.replace(/\s+$/, ''), p = before[before.length - 1];
      if (!p || '(,=:[!&|?{};+-*%<>~^'.includes(p) || /\breturn$/.test(before)) {
        let j = i + 1, cls = false;
        while (j < src.length && src[j] !== '\n') { const e = src[j]; if (e === '\\') { j += 2; continue; } if (e === '[') cls = true; else if (e === ']') cls = false; else if (e === '/' && !cls) break; j++; }
        if (src[j] === '/') { out += src.slice(i, j + 1); i = j + 1; continue; }
      }
    }
    out += c; i++;
  }
  return out;
}

const TIMERS = /\b(setTimeout|setInterval|clearTimeout|clearInterval|requestAnimationFrame|cancelAnimationFrame)\b|\bperformance\s*\.\s*now\b/;
const WINDOW = /\bwindow\s*\.\s*__|\bwindow\s*\[\s*['"`]__/;
const IMPORT = /(?:^|[;\n}])\s*(?:import|export)\s[^'"`;]*?\sfrom\s*(['"`])([^'"`]+)\1|(?:^|[;\n}])\s*import\s*(['"`])([^'"`]+)\3|\bimport\s*\(\s*(['"`])([^'"`]+)\5\s*\)/g;

const errors = [];
let files = [];
try { files = walk(SRC); } catch (e) { console.error(`lint-layers: no src/ under ${ROOT}`); process.exit(1); }
for (const file of files) {
  const r = rel(file), me = where(r), code = strip(readFileSync(file, 'utf8'));
  const lineOf = (idx) => code.slice(0, idx).split('\n').length;
  if (me.layer === 0) errors.push(`${r}: not inside a known layer (core, world, actors, scenes, page, phrasebook, lines, main.js, reactions.js)`);
  for (const m of code.matchAll(IMPORT)) {
    const spec = m[2] || m[4] || m[6], at = `${r}:${lineOf(m.index + m[0].indexOf(spec))}`;
    if (!/^\.\.?\//.test(spec)) { errors.push(`${at}: import "${spec}" is not a relative path inside src/`); continue; }
    const target = resolve(dirname(file), spec), tr = relative(SRC, target).split(sep).join('/');
    if (tr.startsWith('..')) { errors.push(`${at}: import "${spec}" leaves src/`); continue; }
    const them = where(tr);
    if (r === 'main.js') continue;
    if (them.pkg === me.pkg) continue;
    if (me.actor && them.actor) { errors.push(`${at}: actor ${me.pkg} imports actor ${them.pkg} (actors never import each other; emit an event and add a line to src/reactions.js)`); continue; }
    if (them.layer >= me.layer) errors.push(`${at}: layer ${me.layer} (${me.pkg}) imports layer ${them.layer} (${them.pkg}) "${spec}" (only layers above may be imported)`);
  }
  if (!r.startsWith('core/')) {
    code.split('\n').forEach((ln, i) => { const m = ln.match(TIMERS); if (m) errors.push(`${r}:${i + 1}: "${m[0]}" outside src/core (use core/clock.js: after, every, sleep, scope, real, frames, nextFrame, now, wall)`); });
  }
  if (r !== 'core/debug.js') {
    code.split('\n').forEach((ln, i) => { if (WINDOW.test(ln)) errors.push(`${r}:${i + 1}: window.__ outside src/core/debug.js (use debug.hook(name, value))`); });
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\nlint-layers: ${errors.length} problem${errors.length > 1 ? 's' : ''} in ${files.length} files`);
  process.exit(1);
}
console.log(`lint-layers: ${files.length} files, layers ok`);
