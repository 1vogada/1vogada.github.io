'use strict';
// LEGACY COMPARISON: delete together with scripts/legacy.js, scripts/lang.js and scripts/phrasebook.js. It only compares the
// old script with the modules; nothing in npm test, tests/unit/*.test.js or CI depends on it.
// The phrasebook on legacy (scripts/phrasebook.js) and on ?next (src/phrasebook/) side by side, in one browser session: the same
// page is loaded twice (legacy, then ?next) with the same frozen clock and seeded Math.random, the same steps are taken in both,
// and what comes out must be identical:
//   - the menu's HTML, chapter by chapter (with every figure), its head count and its tabs, in mixed mode and in English-only mode
//   - Tab / Shift+Tab focus order inside the open menu, and the keys that must not reach the page under it
//   - the end of a raid: with every line already gone, the hand comes in bored, finds nothing and says "all gone."
// Run with LEGACY=1 (the first load is ?legacy, the second asks for ?next itself):
//   LEGACY=1 node --test tests/unit/phrasebook-menu.screens.js
const { scenario, assert } = require('../helpers/harness');

async function openBook(s) {
  await s.press('#phrasebook');
  for (let i = 0; i < 50 && !(await s.eval(() => { const e = window.__phrasebook.el; return !!e && !e.hidden && !!e.querySelector('.pb-chip'); })); i++) await s.real(30);
  await s.run(100);
}
const menuHTML = () => ({
  head: document.querySelector('.pb-count').textContent,
  tabs: document.querySelector('.pb-tabs').innerHTML,
  sections: [...document.querySelectorAll('.pb-scroll > .pb-sec')].map((sec) => [sec.id, sec.outerHTML]),
  end: document.querySelector('.pb-scroll').lastElementChild.outerHTML,
  rest: document.querySelector('.pb-scroll').children.length,
});

function sameMenu(a, b) {
  assert.equal(b.head, a.head, 'the count');
  assert.equal(b.tabs, a.tabs, 'the tabs');
  assert.deepEqual(b.sections.map((x) => x[0]), a.sections.map((x) => x[0]), 'the chapters');
  for (let i = 0; i < a.sections.length; i++) {
    const [id, x] = a.sections[i], y = b.sections[i][1];
    if (x !== y) { let k = 0; while (k < x.length && x[k] === y[k]) k++; assert.fail(`${id}: differs at ${k}\n  legacy: …${x.slice(Math.max(0, k - 120), k + 120)}\n  next:   …${y.slice(Math.max(0, k - 120), k + 120)}`); }
  }
  assert.equal(b.end, a.end); assert.equal(b.rest, a.rest);
}

for (const lang of ['all', 'en']) {
  scenario('phrasebook', `menu html, legacy = next (kiripad-lang=${lang})`, { golden: false, local: { 'kiripad-lang': lang } }, async (s) => {
    const grab = async () => { await openBook(s); return s.eval(menuHTML); };
    const a = await grab();
    await s.load('?next');
    const b = await grab();
    assert.ok(a.sections.length === 3 && a.head.match(/^\d+ lines, \d+ triggers\.$/), a.head);
    sameMenu(a, b);
    if (lang === 'en') assert.ok(!/lang="(ja|bg)"/.test(b.sections.map((x) => x[1]).join('')), 'English only: no Bulgarian or Japanese chip');
    else assert.ok(/lang="ja"/.test(b.sections[0][1]), 'mixed: Japanese chips');
  });
}

scenario('phrasebook', 'keys in the menu and the raid finding nothing, legacy = next', { golden: false, timeout: 120000 }, async (s) => {
  const focus = () => { const e = document.activeElement; return e ? (e.id || e.className || e.tagName) + (e.dataset && e.dataset.go ? ':' + e.dataset.go : '') : null; };
  const run = async () => {
    await s.ensurePlanck();
    await openBook(s);
    const out = { focus: [] };
    for (const k of ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) { await s.key(k); out.focus.push(await s.eval(focus)); }
    await s.type('tana');
    out.shelf = await s.eval(() => !!window.__cards.state().shelf);
    // every line taken already: the raid comes in, looks, and finds nothing
    await s.eval(() => document.querySelectorAll('.pb-entry, .pb-fig').forEach((e) => e.classList.add('pb-gone')));
    await s.runUntil(() => !!window.__phrasebook.state().raid, null, { max: 7000, step: 50 });
    await s.runUntil(() => window.__phrasebook.state().raid.st === 'done', null, { max: 6000, step: 50 });
    await s.run(2500);
    out.raid = await s.eval(() => { const r = window.__phrasebook.state().raid; return { st: r.st, acts: r.acts, gone: r.gone, objs: r.objs, hand: r.hand.map((v) => +v.toFixed(3)) }; });
    await s.key('Escape');
    await s.run(300);
    out.closed = await s.eval(() => ({ st: window.__phrasebook.state(), hidden: window.__phrasebook.el.hidden, claw: window.__cards.state().claw.st }));
    return out;
  };
  const a = await run();
  await s.load('?next');
  const b = await run();
  const bub = await s.bubbles();
  const by = (d) => bub.filter((q) => q.doc === d && q.who.startsWith('pb-')).map((q) => [q.t, q.ms, q.who, q.key, q.text]);
  assert.deepEqual(b, a);
  assert.deepEqual(by(2), by(1), 'the same bubbles at the same times');
  assert.deepEqual(by(1).map((q) => q[3]), ['PB.RAID_SAY', '?'], 'bored, then "all gone." (not a list the recorder knows)');
  assert.equal(a.raid.st, 'done');
});
