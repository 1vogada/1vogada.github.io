#!/usr/bin/env node
// Regenerates the import map in index.html from the ES modules under src/, so that every module URL carries a version (?v=N)
// and GitHub Pages' 10 minute cache can never serve a new module next to an old one.
//
//   node scripts/stamp.mjs           rewrite the block between the importmap markers in index.html and bump N
//   node scripts/stamp.mjs --check   exit 1 if the block is stale (a module was added, removed or changed since the last stamp)
//
// The block maps "/src/a/b.js" to "/src/a/b.js?v=N" for every .js file under src/ (one N for all of them). Modules import each other
// by root-absolute or relative URLs ("/src/core/clock.js", "./clock.js"); both resolve to the mapped URL. The end marker keeps N and a hash
// of all module contents, which is how --check knows that a file changed. No dependencies: node 18+.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(repo, 'index.html');
const srcDir = join(repo, 'src');
const START = /<!-- importmap:start[^>]*-->\n/;
const END = /<!-- importmap:end v=(\d+) hash=([0-9a-f]+|none) -->/;

function modules() {
  if (!existsSync(srcDir)) return [];
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name), st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.js')) out.push(p);
    }
  };
  walk(srcDir);
  return out.map((p) => ({ file: p, url: '/' + relative(repo, p).split(sep).join('/') })).sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}

function contentHash(mods) {
  if (!mods.length) return 'none';
  const h = createHash('sha256');
  for (const m of mods) { h.update(m.url + '\0'); h.update(readFileSync(m.file)); h.update('\0'); }
  return h.digest('hex').slice(0, 16);
}

function block(mods, v, hash) {
  const lines = mods.map((m) => `    ${JSON.stringify(m.url)}: ${JSON.stringify(m.url + '?v=' + v)}`);
  const imports = lines.length ? `{\n${lines.join(',\n')}\n  }` : '{}';
  return `<script type="importmap">\n{\n  "imports": ${imports}\n}\n</script>\n<!-- importmap:end v=${v} hash=${hash} -->`;
}

const html = readFileSync(indexPath, 'utf8');
const s = START.exec(html), e = END.exec(html);
if (!s || !e || e.index < s.index) { console.error('index.html: importmap markers not found'); process.exit(2); }
const current = html.slice(s.index + s[0].length, e.index + e[0].length);
const oldV = Number(e[1]);
const mods = modules(), hash = contentHash(mods);

if (process.argv.includes('--check')) {
  // stale when the module list or any module's content differs from what was stamped
  const want = block(mods, oldV, hash);
  if (current === want) { console.log(`importmap is current (v=${oldV}, ${mods.length} modules)`); process.exit(0); }
  console.error(`importmap is stale: run \`npm run stamp\` (stamped hash ${e[2]}, modules now hash ${hash}, ${mods.length} modules)`);
  process.exit(1);
}

const v = oldV + 1;
const next = html.slice(0, s.index + s[0].length) + block(mods, v, hash) + html.slice(e.index + e[0].length);
writeFileSync(indexPath, next);
console.log(`importmap stamped: v=${v}, ${mods.length} modules, hash ${hash}`);
