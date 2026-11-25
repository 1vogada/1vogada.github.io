#!/usr/bin/env node
// Screenshots the page at rest in two builds and checks they are pixel-identical, in light and dark, viewport and full page.
//
//   node tests/helpers/compare-rest.js --ref origin/master            this worktree against a git ref (exported to a temp folder)
//   node tests/helpers/compare-rest.js --query-b '?next'              this worktree, / against /?next
//   options: --dir-a <folder>  --dir-b <folder> (default: this worktree)  --out <folder for the PNGs> (default tests/shots/rest)
//
// "At rest": frozen clock (same start time), seeded Math.random, the cards' entrance animation finished, nothing touched.
// Both sides get the test fixtures for projects.json and site.json. Exit 1 if any pair differs.
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const server = require('./server');
const pageInit = require('./page-init');

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const repo = server.REPO;
let dirA = opt('--dir-a'), dirB = opt('--dir-b', repo), tmp = null;
const ref = opt('--ref');
if (ref) {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kiripad-ref-'));
  execFileSync('sh', ['-c', `git -C "${repo}" archive "${ref}" | tar -x -C "${tmp}"`]);
  dirA = tmp;
}
const queryA = opt('--query-a', ''), queryB = opt('--query-b', '');
if (!dirA) dirA = repo;
const out = opt('--out', path.join(repo, 'tests', 'shots', 'rest'));
fs.mkdirSync(out, { recursive: true });

async function shoot(browser, url, scheme, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: scheme });
  await ctx.route((u) => !u.href.startsWith(url.split('/').slice(0, 3).join('/')), (r) => r.fulfill({ status: 200, body: '' }));
  const page = await ctx.newPage();
  const T0 = Date.parse('2026-11-24T12:00:00Z');
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(T0 + 1000);
  await ctx.addInitScript(pageInit, { seed: 7 });
  await page.goto(url, { waitUntil: 'load' });
  for (let i = 0; i < 100 && !(await page.evaluate(() => document.querySelectorAll('#grid .card').length)); i++) await new Promise((r) => setTimeout(r, 30));
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => { for (const a of document.getAnimations()) if (a.animationName === 'rise') a.finish(); });
  await page.clock.runFor(1500);   // the greeting has typed its first word, the fog has drawn
  await page.mouse.move(0, 0);
  await new Promise((r) => setTimeout(r, 100));
  const shots = {};
  shots.view = await page.screenshot({ animations: 'disabled', caret: 'initial' });
  shots.full = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'initial' });
  for (const [k, buf] of Object.entries(shots)) fs.writeFileSync(path.join(out, `${name}-${scheme}-${k}.png`), buf);
  await ctx.close();
  return shots;
}

(async () => {
  const a = await server.start({ root: dirA }), b = dirA === dirB ? a : await server.start({ root: dirB });
  const browser = await chromium.launch();
  let bad = 0;
  try {
    for (const scheme of ['light', 'dark']) {
      const A = await shoot(browser, a.url + '/' + queryA, scheme, 'a'), B = await shoot(browser, b.url + '/' + queryB, scheme, 'b');
      for (const k of Object.keys(A)) {
        const same = Buffer.compare(A[k], B[k]) === 0;
        if (!same) bad++;
        console.log(`${scheme} ${k}: ${same ? 'identical' : 'DIFFERENT'} (${A[k].length} / ${B[k].length} bytes)`);
      }
    }
  } finally {
    await browser.close(); await a.close(); if (b !== a) await b.close();
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(bad ? `${bad} screenshot pair(s) differ; PNGs in ${out}` : `all identical; PNGs in ${out}`);
  process.exit(bad ? 1 : 0);
})();
