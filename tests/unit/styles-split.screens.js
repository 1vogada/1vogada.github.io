'use strict';
// The page with the inline <style> block and the page with the <link>s to styles/*.css (styles/README.md) look exactly the same:
// pixel-identical screenshots in the 12 states asked for and three more, each driven the same way on both pages with the harness's frozen
// clock and seeded Math.random. Whichever of the two index.html is not is built in memory and served in its place through a route
// (nothing is written to disk): before the integration, the copy with the links; after it, the copy with the inline block from
// the commit the split was made against. In every state it also checks that no element carries two of the COMPONENTS classes of
// styles-split.test.js (what its proof that the reordered rules never compete rests on).
//
// Run: node --test tests/unit/styles-split.screens.js          (about two minutes; not part of tests/unit/*.test.js; it also runs
//      the CSSOM check of styles-split.test.js, which it requires)
//      SHOTS_OUT=/some/dir node --test ...                    to keep both screenshots of every state (else only a failing one's)
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const H = require('../helpers/harness');
const { ORDER, COMPONENTS, inlineBlock, BASE_COMMIT } = require('./styles-split.test.js');
const { scenario, Session, assert } = H;
const G = 'styles-split';

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.SHOTS_OUT || null;
const LINKS = ORDER.map((f) => `<link rel="stylesheet" href="/styles/${f}.css">`).join('\n');

// the other page: links in place of the inline block, or the inline block in place of the links
const own = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let other, ownKind, otherKind;
if (inlineBlock(own)) {
  other = own.replace(/<style>[\s\S]*?<\/style>/, () => LINKS);
  ownKind = 'inline'; otherKind = 'links';
} else {
  const block = inlineBlock(execFileSync('git', ['show', BASE_COMMIT + ':index.html'], { cwd: ROOT, encoding: 'utf8' }));
  const re = new RegExp(ORDER.map((f) => `<link rel="stylesheet" href="/?styles/${f}\\.css[^"]*">`).join('\\s*'));
  assert.match(own, re, 'index.html links styles/*.css in the documented order');
  other = own.replace(re, () => `<style>${block}</style>`);
  ownKind = 'links'; otherKind = 'inline';
}
if (process.env.SELF === '1') { other = own; otherKind = ownKind + '-again'; }   // to measure how stable the screenshots are
assert.ok(process.env.SELF === '1' || other !== own);

// a session of the other page: the same as the harness's, with "/" answered by the other HTML
const open0 = Session.prototype.open;
Session.prototype.open = async function open(...a) {
  await open0.apply(this, a);
  if (this.opts.other) {
    const base = this.url;
    await this.ctx.route((u) => u.href.split(/[?#]/)[0] === base + '/', (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: other }));
  }
};

// CSS animations and Web Animations run on real time: finish the entrances, stop everything else at the same point on both pages
async function freeze(s) {
  await s.syncHover();
  await s.real(100);   // let a hover that changed start its transition, so it is finished below
  await s.finishCss();
  await s.finishWaapi();
  await s.page.evaluate(() => {
    for (const a of document.getAnimations()) {
      try {
        if (a instanceof CSSTransition) a.finish();
        else { a.pause(); a.currentTime = 400; }
      } catch (e) { /* ignore */ }
    }
  });
  await s.real(50);
}
function twoComponents(comps) {
  const out = [];
  for (const el of document.querySelectorAll('[class]')) {
    const c = [...el.classList].filter((x) => comps.includes(x));
    if (c.length > 1) out.push(el.tagName + '.' + [...el.classList].join('.'));
  }
  return out;
}
async function shoot(s, full) {
  await freeze(s);
  const bad = await s.page.evaluate(twoComponents, COMPONENTS);
  assert.deepEqual(bad, [], 'no element carries two component classes');
  return s.page.screenshot({ fullPage: !!full, animations: 'allow', caret: 'hide' });
}
// pixels that differ between two PNGs, counted in the browser
async function diffCount(page, a, b) {
  return page.evaluate(async ([a, b]) => {
    const img = async (src) => { const i = new Image(); i.src = 'data:image/png;base64,' + src; await i.decode(); return i; };
    const [x, y] = [await img(a), await img(b)];
    if (x.width !== y.width || x.height !== y.height) return `size ${x.width}x${x.height} vs ${y.width}x${y.height}`;
    const px = (i) => { const c = new OffscreenCanvas(i.width, i.height), g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; };
    const [p, q] = [px(x), px(y)];
    let n = 0; for (let k = 0; k < p.length; k += 4) if (p[k] !== q[k] || p[k + 1] !== q[k + 1] || p[k + 2] !== q[k + 2] || p[k + 3] !== q[k + 3]) n++;
    return n;
  }, [a.toString('base64'), b.toString('base64')]);
}

// One state: drive the page with `steps` and screenshot it, the same on the other page, compare. A few of these drives are not
// perfectly repeatable on a busy machine even on one page (a pointer move that lands a frame apart moves a held card's tilt by a
// pixel: SELF=1 compares the page with itself and shows it), so a state is tried up to TRIES times on each page, and it passes when
// one screenshot of the other page equals one of this page. A real difference in the CSS would never give an equal pair.
const TRIES = 5;
const results = [];
function state(name, opts, steps, full = false) {
  scenario(G, name, { ...opts, golden: false, timeout: 300000 }, async (s) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const mine = [], theirs = [];
    let first = s, match = null, errs = null;
    for (let k = 0; k < TRIES && !match; k++) {
      for (const side of [mine, theirs]) {
        const u = first || await Session.open(G, name, { ...opts, other: side === theirs });
        first = null;
        try {
          await steps(u);
          const png = await shoot(u, full);
          if (errs == null) errs = [...u.errors]; else assert.deepEqual(u.errors, errs, 'the same page errors on every run');
          side.push(png);
        } finally {
          if (u !== s) await u.close();
        }
      }
      match = theirs.find((b) => mine.some((a) => a.equals(b))) || null;
    }
    const n = match ? 0 : await diffCount(s.page, mine[0], theirs[0]);
    const dir = OUT || (n ? fs.mkdtempSync(path.join(os.tmpdir(), 'styles-split-')) : null);
    if (dir) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${slug}.${ownKind}.png`), match ? mine.find((a) => a.equals(match)) : mine[0]);
      fs.writeFileSync(path.join(dir, `${slug}.${otherKind}.png`), match || theirs[0]);
    }
    results.push(`${name}: ${match ? 'identical' : n + ' pixels differ'} (${mine.length} run${mine.length > 1 ? 's' : ''} of each page)`);
    assert.ok(match, `${name}: ${n} pixels differ between the ${ownKind} and the ${otherKind} page after ${TRIES} runs of each${dir ? ` (screenshots in ${dir})` : ''}`);
  });
}
require('node:test').after(() => { for (const r of results) console.log('# ' + r); });

// ---- the drives (the same moves as the scenarios in tests/scenarios) ----
async function crazy(s) { await s.press('#toggle'); await s.press('#warn-yes'); await s.move(2, 2); await s.run(400); assert.ok(await s.eval(() => document.documentElement.classList.contains('crazy'))); }
async function openSlip(s) {
  await s.ensurePlanck();
  await s.page.mouse.move(5, 300);
  await s.press('#surprise');
  await s.runUntil(() => !document.getElementById('omikuji').hidden, null, { max: 3000, step: 50 });
  await s.finishCss();
}
async function handAsks(s) {
  await openSlip(s);
  await s.runUntil(() => window.__cards.state().claw && window.__cards.state().claw.st === 'show', null, { max: 2000 });
  await s.run(1000);
  assert.ok(await s.eval(() => !!document.querySelector('#phys .say.claw-say')), 'the hand is out and talking');
}
async function cardTalks(s) {
  await s.pull(0, 40, -110, { n: 12 });
  await s.runUntil(() => !!document.querySelector('#phys .say'), null, { max: 3000, step: 50 });
  await s.run(200);
  assert.equal((await s.state()).grab, 'card:rooted', 'a card is held');
}
async function katana(s) {
  await s.ensurePlanck();
  const r = await s.box('.katana');
  const cx = r.x + r.w / 2, y = r.y + r.h - 50;
  await s.move(cx - 90, y - 20);
  for (let k = 0; k < 4; k++) await s.line(k % 2 ? cx + 90 : cx - 90, y - 20 + k * 8, k % 2 ? cx - 90 : cx + 90, y - 12 + k * 8, 6);
  const b = await s.box('.katana-in'), gx = b.x + 20, gy = b.y + 40;
  await s.move(gx, gy); await s.down();
  await s.line(gx, gy, gx + 30, gy - 200, 15);
  await s.line(gx + 30, gy - 200, gx + 60, gy - 450, 25);
  await s.run(400);
  assert.ok(await s.eval(() => document.querySelector('.katana').classList.contains('away') && !!document.querySelector('#phys .katana-body')), 'drawn');
}
async function shelf(s) { await s.ensurePlanck(); await s.type('tana'); await s.run(300); assert.ok(await s.eval(() => !!document.querySelector('#phys .shelf'))); }
async function kiri(s) { await s.type('kiri'); await s.run(3000, 100); assert.ok(await s.eval(() => document.getElementById('kiri').classList.contains('on'))); }
async function phrasebook(s) {
  await s.press('#phrasebook');
  for (let i = 0; i < 50 && !(await s.eval(() => { const e = window.__phrasebook.el; return !!e && !e.hidden && !!e.querySelector('.pb-chip'); })); i++) await s.real(30);
  await s.run(100);
  assert.ok(await s.eval(() => window.__phrasebook.state().isOpen));
}
async function reader(s) { await s.eval(() => { location.hash = 'post-fog-notes'; }); await s.real(100); await s.run(50); assert.ok(await s.eval(() => !document.getElementById('reader').hidden)); }
const nothing = async () => {};

state('light at rest', {}, nothing, true);
state('dark at rest', { colorScheme: 'dark' }, nothing, true);
state('crazy mode', {}, crazy, true);
state('narrow phone width 390', { viewport: { width: 390, height: 844 } }, nothing, true);
state('Surprise me slip open', { idle: 2000 }, openSlip);
state('slip in dark', { idle: 2000, colorScheme: 'dark' }, openSlip);
state('hand out with a bubble', { idle: 2000 }, handAsks);
state('a card held with a bubble', {}, cardTalks);
state('katana drawn', {}, katana);
state('shelf open', {}, shelf);
state('kiri flood', {}, kiri);
state('phrasebook open', {}, phrasebook);
// and a few more: the reduced-motion rules, the post reader, dark by choice instead of by the system
state('reduced motion at rest', { reducedMotion: 'reduce' }, nothing, true);
state('crazy mode, reduced motion', { reducedMotion: 'reduce' }, crazy, true);
state('post reader, dark by choice', { local: { 'kiripad-theme': 'dark' } }, reader);
