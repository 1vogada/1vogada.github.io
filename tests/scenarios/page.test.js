'use strict';
// The page itself: the directory of projects and posts, search and the post reader, the theme and crazy mode, the fog over the
// banner that wipes off and grows back, and the kiri flood that buries the whole page.
const { scenario, assert } = require('../helpers/harness');
const G = 'page';

const dir = () => ({
  shown: document.getElementById('shown').textContent,
  sections: [...document.querySelectorAll('#grid h3.sec')].map((h) => h.textContent),
  cards: [...document.querySelectorAll('#grid .card')].map((c) => { const a = c.querySelector('h2 a, a'); return a ? a.textContent.trim() : c.textContent.trim().slice(0, 30); }),
  posts: [...document.querySelectorAll('#grid a[href^="#post-"]')].map((a) => a.getAttribute('href')),
});

scenario(G, 'directory render, search and post reader route', async (s) => {
  const d = await s.eval(dir);
  assert.equal(d.shown, '13', 'twelve projects and one post (the draft is not listed)');
  assert.equal(d.cards.length, 13);
  assert.deepEqual([...new Set(d.posts)], ['#post-fog-notes'], 'the post links to its reader; the draft is nowhere');
  assert.ok(d.sections.length >= 3, `in sections (${d.sections})`);
  assert.deepEqual(d, await s.eval(dir), 'stable');
  // "/" focuses the search box; typing filters the cards
  await s.key('/');
  assert.equal(await s.eval(() => document.activeElement.id), 'q');
  await s.type('fog');
  const f = await s.eval(dir);
  assert.match(f.shown, /^\d+ of 13$/);
  assert.ok(f.posts.includes('#post-fog-notes'), 'the post is found by its words');
  await s.type('zzzzqqq');
  assert.equal(await s.eval(() => document.querySelector('#grid .empty').textContent), 'Nothing here but fog. Try another word.');
  await s.eval(() => { const q = document.getElementById('q'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); q.blur(); });
  await s.run(50);
  assert.equal((await s.eval(dir)).shown, '13');
  // the post reader is a route: #post-<id>
  await s.eval(() => { location.hash = 'post-fog-notes'; });
  await s.real(100); await s.run(50);
  const r = await s.eval(() => { const rd = document.getElementById('reader'); return { hidden: rd.hidden, title: rd.querySelector('h1') && rd.querySelector('h1').textContent, md: !!rd.querySelector('.md p'), overflow: document.body.style.overflow }; });
  assert.deepEqual([r.hidden, r.title, r.md, r.overflow], [false, 'Notes from the fog', true, 'hidden'], 'the reader opens over the page');
  await s.key('Escape');
  await s.real(100); await s.run(50);
  assert.deepEqual(await s.eval(() => [document.getElementById('reader').hidden, location.hash]), [true, '#projects'], 'Esc closes it');
  // a draft has no reader, and neither has a post that does not exist
  for (const h of ['post-secret-draft', 'post-nope']) {
    await s.eval((h) => { location.hash = h; }, h);
    await s.real(100); await s.run(50);
    assert.equal(await s.eval(() => document.getElementById('reader').hidden), true, h);
  }
  // opened straight from a link
  await s.load('#post-fog-notes');
  await s.real(100);
  assert.equal(await s.eval(() => !document.getElementById('reader').hidden && document.querySelector('#reader h1').textContent), 'Notes from the fog', 'a link to #post-fog-notes opens it');
});

scenario(G, 'theme toggle and crazy mode warning', async (s) => {
  const th = () => ({ theme: document.documentElement.dataset.theme || null, btn: document.getElementById('theme').textContent, saved: localStorage.getItem('kiripad-theme') });
  assert.deepEqual(await s.eval(th), { theme: null, btn: '☾', saved: null }, 'light by the system setting');
  await s.press('#theme');
  assert.deepEqual(await s.eval(th), { theme: 'dark', btn: '☀', saved: 'dark' });
  await s.load();
  assert.deepEqual(await s.eval(th), { theme: 'dark', btn: '☀', saved: 'dark' }, 'remembered');
  await s.press('#theme');
  assert.deepEqual(await s.eval(th), { theme: 'light', btn: '☾', saved: 'light' });
  // crazy mode asks first
  const md = () => ({ crazy: document.documentElement.classList.contains('crazy'), warn: !document.getElementById('warn').hidden, toggle: document.getElementById('toggle').textContent, saved: localStorage.getItem('kiripad-mode'), title: document.title });
  assert.deepEqual(await s.eval(md), { crazy: false, warn: false, toggle: 'Crazy mode', saved: null, title: 'kiripad.dev · Projects' });
  await s.press('#toggle');
  assert.deepEqual(await s.eval(md), { crazy: false, warn: true, toggle: 'Crazy mode', saved: null, title: 'kiripad.dev · Projects' }, 'a warning first');
  await s.key('Escape');
  assert.deepEqual(await s.eval(md), { crazy: false, warn: false, toggle: 'Crazy mode', saved: 'normal', title: 'kiripad.dev · Projects' }, 'Esc says no');
  await s.press('#toggle');
  await s.press('#warn-yes');
  await s.run(400);
  let m = await s.eval(md);
  assert.deepEqual([m.crazy, m.warn, m.toggle, m.saved], [true, false, '😴 back to boring mode', 'crazy']);
  assert.ok(m.title.includes('KIRIPAD.DEV'), 'the tab title scrolls');
  assert.ok(await s.eval(() => document.querySelectorAll('#grid .card .badge').length === 13), 'every card gets a badge');
  // a reload remembers, but asks again
  await s.load();
  m = await s.eval(md);
  assert.deepEqual([m.crazy, m.warn], [false, true], 'after a reload it asks again before going crazy');
  await s.press('#warn-no');
  m = await s.eval(md);
  assert.deepEqual([m.crazy, m.warn, m.saved], [false, false, 'normal']);
  await s.press('#toggle');
  await s.press('#warn-yes');
  await s.run(200);
  await s.press('#toggle');
  m = await s.eval(md);
  assert.deepEqual([m.crazy, m.warn, m.saved, m.title], [false, false, 'normal', 'kiripad.dev · Projects'], 'and back to boring mode with no question');
});

// alpha of the drawn fog at (x, y) of the banner
const fogAt = ([x, y]) => { const c = document.getElementById('fog'), r = c.getBoundingClientRect(), k = c.width / r.width; return c.getContext('2d').getImageData(Math.round((x - r.left) * k), Math.round((y - r.top) * k), 1, 1).data[3]; };

scenario(G, 'fog wipe and regrow', async (s) => {
  const h = await s.box('#hero');
  const p = [h.x + h.w * 0.5, h.y + h.h * 0.45];
  await s.run(100);
  const a0 = await s.eval(fogAt, p);
  assert.ok(a0 > 150, `fogged to begin with (${a0})`);
  assert.equal(await s.eval(() => document.getElementById('hint').classList.contains('gone')), false, 'the hint is up');
  // back and forth over the same spot
  for (let k = 0; k < 3; k++) await s.line(p[0] - 120, p[1] + k * 6, p[0] + 120, p[1] + k * 6, 12);
  await s.run(50);
  const a1 = await s.eval(fogAt, p);
  assert.ok(a1 < a0 / 2, `wiped (${a0} -> ${a1})`);
  assert.equal(await s.eval(() => document.getElementById('hint').classList.contains('gone')), true, 'the hint goes after 400 px of wiping');
  // it grows back over twelve seconds
  await s.page.mouse.move(5, 880);
  await s.run(6000, 100);
  const a2 = await s.eval(fogAt, p);
  assert.ok(a2 > a1 + 20 && a2 < a0, `half grown back after 6 s (${a2})`);
  await s.run(7000, 100);
  const a3 = await s.eval(fogAt, p);
  assert.ok(a3 >= a0 - 3, `all of it after 13 s (${a3} of ${a0})`);
});

scenario(G, 'kiri flood and Esc lift', async (s) => {
  const k = () => ({ on: document.getElementById('kiri').classList.contains('on'), toast: document.getElementById('toast').textContent });
  assert.equal((await s.eval(k)).on, false);
  await s.type('kiri');
  await s.run(100);
  assert.deepEqual(await s.eval(k), { on: true, toast: '霧が出た · Мъгла падна · The fog rolls in' });
  // it rolls down over 2.4 s and then covers the screen
  await s.run(3000, 100);
  const mid = await s.eval(() => { const c = document.getElementById('kiri'), x = c.getContext('2d'); return x.getImageData(Math.round(c.width / 2), Math.round(c.height / 2), 1, 1).data[3]; });
  assert.ok(mid > 200, `the screen is under the fog (${mid})`);
  // Esc lifts it: it thins out over 4 s
  await s.key('Escape');
  await s.run(3000, 100);
  assert.equal((await s.eval(k)).on, true, 'still lifting');
  await s.run(1200, 100);
  assert.equal((await s.eval(k)).on, false, 'gone');
  // left alone it holds for 14 s before it lifts by itself
  await s.type('kiri');
  await s.run(15000, 200);
  assert.equal((await s.eval(k)).on, true, 'held');
  await s.run(2000, 200);
  assert.equal((await s.eval(k)).on, true);
  await s.run(2000, 200);
  assert.equal((await s.eval(k)).on, false, 'lifted on its own');
});
