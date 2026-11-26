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
  // left alone it rolls in (2.4 s), holds for 14 s, then thins out over 4 s: gone 20.4 s after it was called
  await s.type('kiri');
  await s.run(15000, 200);
  assert.equal((await s.eval(k)).on, true, 'held');
  await s.run(2000, 200);
  assert.equal((await s.eval(k)).on, true, 'lifting by itself');
  await s.run(3600, 200);
  assert.equal((await s.eval(k)).on, false, 'lifted on its own');
});

// ---- feed the search box (src/page/feed.js): drop something on it and it searches for it ----
const feedState = () => ({
  q: document.getElementById('q').value,
  shown: document.getElementById('shown').textContent,
  empty: !!document.querySelector('#grid .empty'),
  held: [...document.querySelectorAll('#grid .card.held')].map((c) => c.dataset.key),
  feeding: !!window.__feed && window.__feed.feeding(),
});
const kindsOf = () => { const k = {}; for (const o of window.__cards.objs) k[o.kind] = (k[o.kind] || 0) + 1; return k; };
// carry what the pointer holds from `from` onto the middle of the search box, slowly, wait there, and let go
async function dropOnBox(s, from) {
  const b = await s.box('.toolbar .search');
  const to = [b.x + b.w / 2, b.y + b.h / 2];
  await s.line(from[0], from[1], to[0], to[1], 30, 16);
  await s.run(300);
  await s.up();
  return to;
}

scenario(G, 'a card dropped on the search box is eaten, searched for and grows back', { legacy: false }, async (s) => {
  const key = await s.eval(() => document.querySelector('#grid .card').dataset.key);
  const name = await s.eval(() => document.querySelector('#grid .card h3 a').textContent);
  const p = await s.rip(0);
  await s.run(300);
  assert.deepEqual((await s.eval(feedState)).held, [key], 'its slot is empty');
  await dropOnBox(s, p);
  await s.run(100);
  assert.ok(await s.said('card.eaten'), 'the card screams as it goes in');
  assert.ok(!(await s.eval(kindsOf)).card, 'it is gone from the world');
  await s.run(500);
  assert.ok(await s.said('search.gulp'), 'the box gulps');
  await s.run(75 * name.length + 400, 25);
  const st = await s.eval(feedState);
  assert.equal(st.q, name, 'its name typed itself in');
  assert.match(st.shown, /^\d+ of 13$/, `the grid is filtered (${st.shown})`);
  assert.deepEqual(st.held, [], 'the card grew back into its slot');
  assert.ok(await s.said('card.home'), 'and says so');
  assert.equal(st.feeding, false);
});

// wide, so the search box is well away from the right edge, where the arm would take the other end of your half
scenario(G, 'a scrap dropped on the search box finds nothing', { legacy: false, viewport: { width: 1900, height: 900 } }, async (s) => {
  await s.ensurePlanck();
  await s.eval(() => { window.__cards.drag.ONE_TUG = 0; });   // a stubborn card: yanked at once, it tears in two
  const p = await s.pull(2, 0, -420, { n: 8 });
  await s.runUntil(() => { const g = window.__cards.state().grab; return !!g && g.o.kind === 'piece'; }, null, { max: 3000, step: 16 });
  const before = (await s.eval(kindsOf)).piece;
  await s.run(400);
  await dropOnBox(s, p);
  await s.run(100);
  assert.equal((await s.eval(kindsOf)).piece, before - 1, 'the box ate your half');
  await s.run(1200, 25);
  const st = await s.eval(feedState);
  assert.equal(st.q, '…', 'it typed "…"');
  assert.equal(st.empty, true, 'and found nothing');
  assert.ok(await s.said('search.gulp'));
  const toast = await s.eval(() => document.getElementById('toast').textContent);
  assert.ok(await s.eval((t) => window.__kiri.lines.list('toast.scrap').includes(t), toast), `the toast says there was nothing left of it (${toast})`);
});

scenario(G, 'an old hand dropped on the search box is not in there', { legacy: false }, async (s) => {
  const p = await s.rip(0);
  await s.run(200);
  await s.up();
  await s.eval(() => { if (window.__hand && window.__hand.reset) window.__hand.reset(); });
  await s.press('.reset-cards');
  await s.run(800);
  const b = await s.box('.toolbar .search'), sy = await s.scrollY();
  await s.eval(([x, y]) => { window.__sev.spawn(x, y, 0.3, window.__sev.POSES.limp); }, [b.x - 160, b.y + sy + 140]);
  await s.run(16);
  const at = await s.eval((sy) => { const o = window.__sev.list.values().next().value, q = o.body.getPosition(); return [q.x * 100, q.y * 100 - sy]; }, sy);
  await s.move(at[0], at[1]); await s.down();
  assert.equal(await s.eval(() => window.__sev.list.values().next().value.ai.st), 'held');
  await dropOnBox(s, at);
  await s.run(100);
  assert.ok(await s.said('search.spit'), 'the box spits it out');
  assert.equal(await s.eval(() => window.__sev.list.size), 1, 'it is still here');
  await s.run(1200, 25);
  const st = await s.eval(feedState);
  assert.equal(st.q, 'hand', 'it typed "hand"');
  assert.equal(st.empty, true, 'and found nothing');
  assert.ok(await s.said('sev.notthere'), 'the old hand: I am not in there');
});

// ---- the stamp book (src/page/stamps.js): hold the header seal 3 s, a stamp card with one circle per secret slides out ----
const book = () => {
  const c = document.querySelector('.stamp-card');
  if (!c) return null;
  const cells = [...c.querySelectorAll('[data-stamp]')];
  return { n: cells.length, found: cells.filter((x) => x.dataset.found).map((x) => x.dataset.stamp), fresh: cells.filter((x) => x.dataset.new).map((x) => x.dataset.stamp),
    count: c.querySelector('.stp-count').textContent, hints: cells.filter((x) => !x.dataset.found).every((x) => x.title && !x.textContent.match(/[A-Z]{3}/)) };
};
// the logo is a link home: note whether the click that ends a press was swallowed, and keep the page here either way
const watchClicks = () => { window.__clicks = []; window.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.brand')) { window.__clicks.push(e.defaultPrevented); e.preventDefault(); } }); };
async function holdSeal(s, ms) {
  const b = await s.box('.brand .hanko');
  await s.move(b.x + b.w / 2, b.y + b.h / 2);
  await s.down();
  await s.run(ms, 50);
  await s.up();
}

scenario(G, 'hold the seal: the stamp book shows what you found, and a new find thumps down', { legacy: false }, async (s) => {
  await s.eval(watchClicks);
  // a short click is still the link home; a press of 2 s does nothing
  await holdSeal(s, 150);
  await holdSeal(s, 2000);
  assert.equal(await s.eval(book), null, 'no card for a short press');
  assert.deepEqual(await s.eval(() => window.__clicks), [false, false], 'both clicks follow the link');
  // 3 s: the card slides out, sixteen faint outlines with hints, nothing stamped
  await holdSeal(s, 3100);
  let k = await s.eval(book);
  assert.deepEqual([k.n, k.found, k.count, k.hints], [17, [], '0 / 17', true], 'an empty card');
  assert.deepEqual(await s.eval(() => window.__clicks), [false, false, true], 'the click that ends the hold is swallowed');
  await s.key('Escape'); await s.run(300);
  assert.equal(await s.eval(book), null, 'Esc puts it away');
  // find two secrets: the Konami code, and 1926 (linger on the year in the footer)
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await s.key(key);
  await s.scrollTo(99999);
  const y = await s.box('#yr');
  await s.move(y.x + y.w / 2, y.y + y.h / 2);
  await s.run(4200, 100);
  assert.equal(await s.eval(() => document.getElementById('yr').textContent), '1926');
  await s.move(y.x + y.w / 2, y.y - 200); await s.run(900, 100);
  await s.scrollTo(0);
  assert.deepEqual(await s.eval(() => window.__stamps.found()), ['1926', 'konami']);
  // hold again: both thump down
  await holdSeal(s, 3100);
  k = await s.eval(book);
  assert.deepEqual([k.found, k.fresh, k.count], [['1926', 'konami'], ['1926', 'konami'], '2 / 17'], 'the two new stamps thump down');
  await s.key('Escape'); await s.run(300);
  // the next visit: still there, nothing new
  await s.load();
  await s.eval(watchClicks);
  await holdSeal(s, 3100);
  k = await s.eval(book);
  assert.deepEqual([k.found, k.fresh], [['1926', 'konami'], []], 'kept across visits, already stamped');
  await s.key('Escape'); await s.run(300);
  // one more (the moon: seven light switches in a row), and only that one thumps
  for (let i = 0; i < 7; i++) await s.press('#theme');
  await holdSeal(s, 3100);
  k = await s.eval(book);
  assert.deepEqual([k.found, k.fresh, k.count], [['1926', 'moon', 'konami'], ['moon'], '3 / 17'], 'the moon thumps down');
  await s.finishWaapi();
  await s.shot('stamp book');
});

// ---- a ghost in the fog (chain fog-ghost: src/page/ghost.js) ----
const ghost = () => { const g = window.__ghost.get(); return g && { st: g.st, x: Math.round(g.x), y: Math.round(g.y), a: g.a, hits: g.hits }; };
// a quick wipe straight through the ghost (viewport px; the page is at the top)
async function through(s) {
  const g = await s.eval(ghost);
  const sy = await s.scrollY();
  await s.line(g.x - 160, g.y - sy - 10, g.x + 160, g.y - sy + 10, 10, 16);
  await s.page.mouse.move(5, 880);
}
// the ghost is in the banner again, risen and not slipping
const settled = () => { const g = window.__ghost.get(), h = document.getElementById('hero').getBoundingClientRect(); return !!g && g.st === 'fog' && g.y - scrollY > h.top + 60 && g.y - scrollY < h.bottom - 60 && g.x > h.left + 120 && g.x < h.right - 120; };

scenario(G, 'a ghost in the fog slips away, roams the kiri flood tapping cards, and is laid to rest', { legacy: false }, async (s) => {
  assert.equal(await s.eval(ghost), null, 'no ghost before the new hand has eaten an old one');
  await s.eval(() => window.__kiri.bus.emit('hand.devoured', { hand: null }));
  await s.run(3000, 100);
  let g = await s.eval(ghost);
  assert.equal(g.st, 'fog', 'it lingers in the banner fog');
  assert.equal(g.a, 1, 'risen');
  assert.ok(await s.said('ghost.drift'), 'a faint word');
  // wipe through it: it slips away and waves
  await through(s);
  await s.run(100);
  g = await s.eval(ghost);
  assert.equal(g.st, 'slip', 'it slips away');
  assert.equal(g.hits, 1);
  assert.ok(await s.said('ghost.wave'), 'and waves');
  await s.runUntil(settled, null, { max: 12000, step: 100 });
  // kiri: it roams the flooded page and taps the cards
  await s.type('kiri');
  await s.runUntil(() => window.__ghost.get().st === 'roam', null, { max: 4000, step: 100 });
  await s.run(200, 100);
  assert.ok(await s.said('ghost.roam'), 'out of the banner, all over the page');
  await s.runUntil(() => document.querySelectorAll('.ghost-layer .say').length > 0 && [...document.querySelectorAll('.ghost-layer .say')].some((e) => window.__kiri.lines.list('card.ghost').includes(e.textContent)), null, { max: 8000, step: 100 });
  assert.ok(await s.said('card.ghost'), 'a card shivers: did you feel that');
  // Esc lifts the flood: it drifts back into the banner
  await s.key('Escape');
  await s.runUntil(settled, null, { max: 16000, step: 200 });
  // wiped through again and again: it bows and fades, laid to rest
  for (let k = 2; k <= 4; k++) {
    await through(s);
    await s.run(100);
    assert.equal((await s.eval(ghost)).hits, k);
    if (k < 4) await s.runUntil(settled, null, { max: 12000, step: 100 });
  }
  assert.equal((await s.eval(ghost)).st, 'bow', 'a small bow');
  assert.ok(await s.said('ghost.rest'));
  await s.run(3000, 100);
  assert.equal(await s.eval(ghost), null, 'gone');
  assert.equal(await s.eval(() => window.__ghost.laid()), true, 'laid to rest');
  const toast = await s.eval(() => document.getElementById('toast').textContent);
  assert.ok(await s.eval((t) => window.__kiri.lines.list('toast.ghost').includes(t), toast), `the toast says so (${toast})`);
  // it never comes back on this visit
  await s.eval(() => window.__kiri.bus.emit('hand.devoured', { hand: null }));
  await s.run(500, 100);
  assert.equal(await s.eval(ghost), null, 'not even after another meal');
});

scenario(G, 'an old hand walks over and bows to the ghost in the kiri flood', { legacy: false }, async (s) => {
  // the world exists once a card has been pulled: rip one, put it back, the arm out of the way
  await s.rip(0); await s.run(200); await s.up();
  await s.eval(() => { if (window.__hand && window.__hand.reset) window.__hand.reset(); });
  await s.press('.reset-cards');
  await s.run(800);
  await s.eval(() => window.__ghost.rise());
  await s.run(1000, 100);
  const bottom = await s.eval(() => document.documentElement.scrollHeight - innerHeight);
  await s.scrollTo(bottom);
  const size = await s.eval(() => window.__cards.state().size);
  await s.eval(([x, y]) => { const o = window.__sev.spawn(x, y, 0.3, window.__sev.POSES.limp); o.ai.hurt = 0; }, [size.W * 0.35, size.H - 200]);
  await s.run(1500, 100);
  await s.type('kiri');
  await s.runUntil(() => [...window.__sev.list].some((o) => o.ai.st === 'mourn'), null, { max: 6000, step: 100 });
  assert.equal(await s.eval(() => window.__ghost.get().st), 'roam', 'the ghost roams the flood');
  await s.runUntil(() => [...window.__sev.list].some((o) => o.ai.st === 'bow'), null, { max: 10000, step: 100 });
  await s.run(1500, 100);
  assert.ok(await s.said('sev.ghost'), 'it bows and says a few words');
  assert.ok(await s.said('ghost.bowed'), 'the ghost bows back');
});
