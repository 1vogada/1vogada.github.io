#!/usr/bin/env node
// Proves that scripts/legacy.js is the old big inline <script> of index.html, byte for byte.
// Usage: node tests/helpers/check-legacy-move.js [git-ref]   (default ref: 41683e8, the master commit the move was made from)
// Exit 0 when identical, 1 when not (prints where the first difference is).
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '..', '..');
const ref = process.argv[2] || '41683e8';
const html = execFileSync('git', ['show', `${ref}:index.html`], { cwd: repo, maxBuffer: 64 << 20 });
const text = html.toString('utf8');
// the big script is the one that starts with `const root = document.documentElement;` and ends right before the phrasebook's tag
const open = text.indexOf('\n<script>\n  const root = document.documentElement;');
if (open < 0) { console.error(`no inline script found in ${ref}:index.html`); process.exit(1); }
const from = open + '\n<script>'.length;
const to = text.indexOf('</script>\n<script src="/scripts/phrasebook.js', from);
if (to < 0) { console.error('end of the inline script not found'); process.exit(1); }
const inline = Buffer.from(text.slice(from, to), 'utf8');
const moved = fs.readFileSync(path.join(repo, 'scripts', 'legacy.js'));
if (Buffer.compare(inline, moved) === 0) {
  console.log(`scripts/legacy.js is identical to the inline script of ${ref}:index.html (${moved.length} bytes)`);
  process.exit(0);
}
let i = 0; while (i < inline.length && i < moved.length && inline[i] === moved[i]) i++;
console.error(`DIFFERENT: inline ${inline.length} bytes, legacy.js ${moved.length} bytes, first difference at byte ${i}`);
console.error('inline:   ' + JSON.stringify(inline.slice(Math.max(0, i - 40), i + 40).toString('utf8')));
console.error('legacy.js:' + JSON.stringify(moved.slice(Math.max(0, i - 40), i + 40).toString('utf8')));
process.exit(1);
