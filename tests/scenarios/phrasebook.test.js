'use strict';
// Phrasebook (src/phrasebook/): the menu that lists every line the page can say, and the raid: stay in it for five seconds
// and the hand reaches in, pulls the lines out and throws them, eats them, asks you to help rip one, or yanks the page about.
const { scenario, assert } = require('../helpers/harness');
const G = 'phrasebook';

const pb = () => window.__phrasebook.state();
// the menu's stylesheet is fetched on first open (real time), and its entrance is a CSS transition
async function openBook(s) {
  await s.press('#phrasebook');
  for (let i = 0; i < 50 && !(await s.eval(() => { const e = window.__phrasebook.el; return !!e && !e.hidden && !!e.querySelector('.pb-chip'); })); i++) await s.real(30);
  await s.run(100);
}

scenario(G, 'open, every line list shown, close', async (s) => {
  await openBook(s);
  const r = await s.eval(() => {
    const chips = new Set([...document.querySelectorAll('.pb .pb-chip > b')].map((b) => b.textContent));
    const all = [], walk = (v, path) => { if (typeof v === 'string') all.push([path, v]); else if (Array.isArray(v)) v.forEach((x, i) => walk(x, path)); else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], path ? path + '.' + k : k); };
    walk(window.__lines, '');
    return { open: window.__phrasebook.state().isOpen, lock: document.documentElement.classList.contains('pb-lock'), total: all.length, missing: all.filter(([, t]) => !chips.has(t)).slice(0, 10), head: document.querySelector('.pb-count').textContent, tabs: [...document.querySelectorAll('.pb-tab')].map((t) => t.textContent) };
  });
  assert.ok(r.open && r.lock, 'open, and the page under it does not scroll');
  assert.ok(r.total > 300, `the page has a lot to say (${r.total})`);
  assert.deepEqual(r.missing, [], 'every line of every list the page has is in the book');
  assert.match(r.head, /^\d+ lines, \d+ triggers\.$/);
  assert.deepEqual(r.tabs, ['The Cards', 'The Katana', 'The Hand'], 'with a tab per section');
  // nothing typed in the menu reaches the page under it: tana does not bring the shelf out
  await s.type('tana');
  assert.equal(await s.eval(() => !!window.__cards.state().shelf), false);
  // the ✕ closes it
  await s.press('.pb-x');
  await s.run(300);
  assert.deepEqual(await s.eval(() => ({ open: window.__phrasebook.state().isOpen, hidden: window.__phrasebook.el.hidden, lock: document.documentElement.classList.contains('pb-lock') })), { open: false, hidden: true, lock: false });
  // and Esc does too; closed before five seconds are up, the hand never comes
  await openBook(s);
  await s.run(3000, 100);
  await s.key('Escape');
  await s.run(300);
  const st = await s.eval(pb);
  assert.equal(st.isOpen, false, 'Esc closes it');
  assert.equal(st.raid, null, 'under five seconds: no raid');
  await s.run(5000, 100);
  assert.equal((await s.eval(pb)).raid, null, 'and none once it is closed');
});

scenario(G, 'raid with all four picks (throw, eat, help, scroll) and the swat', { rand: 0.3, timeout: 240000, legacy: false, session: { 'kiripad-ripped': '1' } }, async (s) => {
  await s.ensurePlanck();
  await openBook(s);
  await s.run(4800, 100);
  assert.equal((await s.eval(pb)).raid, null, 'not yet');
  await s.runUntil(() => !!window.__phrasebook.state().raid, null, { max: 600, step: 50 });
  await s.run(1000);
  assert.ok(await s.said('PB.RAID_SAY'), 'it comes in bored');
  // each pick is forced with the hook, so the four come in a known order
  const act = async (a, done, max = 20000) => { await s.eval((a) => window.__phrasebook.next(a), a); await s.runUntil(done, null, { max, step: 50 }); };
  await act('throw', () => window.__phrasebook.state().raid.thrown >= 1);
  await s.runUntil(() => window.__phrasebook.state().raid.broken >= 1, null, { max: 3000 });
  assert.ok((await s.bubbles()).some((b) => b.key.split('|').includes('SAY.throw')), 'the thrown line screams');
  await act('eat', () => window.__phrasebook.state().raid.eaten >= 1);
  assert.ok(await s.said('CLAW_SAY.eat'), 'nom');
  // help: it holds one out by its right end; take the left end and pull to the left
  await act('help', () => window.__phrasebook.state().raid.st === 'offer');
  await s.run(400);
  assert.ok(await s.said('PB.HELP_SAY'), 'it asks for help');
  const o = await s.box('.pb-offer');
  const need = Math.min(150, o.w * 0.45);
  const x0 = o.x + 24, y0 = o.y + o.h / 2;
  await s.move(x0, y0); await s.down();
  await s.line(x0, y0, x0 - need - 40, y0, 20);
  await s.runUntil(() => window.__phrasebook.state().raid.ripped >= 1, null, { max: 2000, step: 16 });
  await s.up();
  assert.ok(await s.said('CLAW_SAY.rip'), 'torn between you');
  await s.runUntil(() => window.__phrasebook.state().raid.eaten >= 2, null, { max: 8000 });
  await act('scroll', () => { const r = window.__phrasebook.state().raid; return !!(r.scrolled && r.scrolled.length); });
  assert.ok(await s.said('PB.SCROLL_SAY'), 'it yanks the page about');
  const r1 = await s.eval(pb);
  assert.deepEqual(r1.raid.acts.slice(0, 4), ['throw', 'eat', 'help', 'scroll'], 'all four picks');
  // the swat: once it reaches in for the next one, click the hand
  await s.eval(() => window.__phrasebook.next('throw'));
  await s.runUntil(() => { const r = window.__phrasebook.state().raid, w = document.querySelector('.pb-swat'); return r.st === 'reach' && w && w.style.display !== 'none' && r.hand[0] < document.documentElement.clientWidth - 150; }, null, { max: 20000 });
  const sw = await s.box('.pb-swat');
  // dispatched at the patch itself: a real click there sometimes lands on a speech bubble that is still popping in (a CSS
  // animation, on real time) over the hand
  await s.move(sw.x + sw.w / 2, sw.y + sw.h / 2);
  await s.eval((p) => document.querySelector('.pb-swat').dispatchEvent(new PointerEvent('pointerdown', { clientX: p[0], clientY: p[1], bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })), [sw.x + sw.w / 2, sw.y + sw.h / 2]);
  const r2 = await s.eval(pb);
  assert.equal(r2.raid.swats, 1, 'swatted');
  assert.equal(r2.raid.st, 'swat');
  assert.ok(await s.said('PB.SWAT_SAY'), 'and it says so');
  await s.runUntil(() => window.__phrasebook.state().raid.st !== 'swat', null, { max: 12000 });
  assert.ok(await s.said('PB.GRUDGE_SAY') || await s.said('PB.ANGRY_SAY'), 'it comes back with a grudge, or in a temper');
  await s.key('Escape');
  await s.run(500);
  assert.equal((await s.eval(pb)).raid, null, 'closing the book ends the raid');
});

// phrase-say (src/phrasebook/say.js): in the open book, select a line and its owner says it beside the menu; a line you have not
// heard on this visit, it refuses. The book is closed and opened again between picks, so the raid (five seconds in) never starts.
const pickChip = (s, sel) => s.eval(({ text, key }) => {
  const chips = [...document.querySelectorAll('.pb .pb-scroll .pb-chip')];
  const c = text ? chips.find((x) => x.querySelector('b').textContent === text) : chips.find((x) => x.closest('[data-key]').dataset.key === key);
  if (!c) return null;
  const b = c.querySelector('b'); b.scrollIntoView({ block: 'center' });
  const r = document.createRange(); r.selectNodeContents(b); const g = getSelection(); g.removeAllRanges(); g.addRange(r);
  return b.textContent;
}, sel);
const sayer = () => window.__phrasesay.busy();
const lastPb = async (s) => (await s.bubbles()).filter((b) => b.who.startsWith('pb-')).pop();

scenario(G, 'select a line: its owner says it beside the book, or refuses', { session: { 'kiripad-ripped': '1' }, legacy: false, timeout: 120000 }, async (s) => {
  await s.ensurePlanck();
  // hear a card line (it is torn out) and a hand line
  await s.rip(0); await s.run(300); await s.up(); await s.run(300);
  const card = (await s.bubbles()).find((b) => b.who === 'card');
  assert.ok(card, 'the torn card said something');
  await s.eval(() => { window.__hand.get(); window.__hand.say('eager'); });
  await s.run(100);
  const arm = (await s.bubbles()).find((b) => b.who === 'hand');
  assert.ok(arm, 'the hand said something');
  assert.ok(await s.eval((t) => window.__phrasesay.heard().includes(t[0]) && window.__phrasesay.heard().includes(t[1]), [card.text, arm.text]), 'both are heard');

  // 1. a card line: a card peeks out beside the book and shouts it
  await openBook(s);
  assert.equal(await pickChip(s, { text: card.text }), card.text);
  await s.run(300);
  assert.equal(await s.eval(sayer), null, 'the selection has to sit still a moment first');
  await s.run(600);
  assert.equal(await s.eval(sayer), 'card', 'a card comes out');
  let b = await lastPb(s);
  assert.deepEqual([b.who, b.text], ['pb-scream', card.text], 'and shouts the very line');
  await s.runUntil(() => !window.__phrasesay.busy(), null, { max: 6000 });
  await s.key('Escape'); await s.run(400);

  // 2. a hand line: the hand pokes in over the book's edge and says it
  await openBook(s);
  await pickChip(s, { text: arm.text });
  await s.run(900);
  assert.equal(await s.eval(sayer), 'hand');
  assert.ok(await s.eval(() => document.querySelectorAll('.claw.over.pb-raid').length === 1), 'a hand drawn over the book');
  b = await lastPb(s);
  assert.deepEqual([b.who, b.text], ['pb-hand', arm.text], 'it says its line');
  await s.runUntil(() => !window.__phrasesay.busy(), null, { max: 6000 });
  assert.equal(await s.eval(() => document.querySelectorAll('.claw.over.pb-raid').length), 0, 'and is gone again');

  // 3. a line it has never said to you: it refuses
  await s.key('Escape'); await s.run(400);
  await openBook(s);
  const never = await pickChip(s, { key: 'card.smash' });
  assert.ok(never && !(await s.eval((t) => window.__phrasesay.heard().includes(t), never)), 'never heard');
  await s.run(900);
  b = await lastPb(s);
  assert.equal(b.who, 'pb-scream');
  assert.ok(b.key.split('|').includes('card.notyet'), `the card refuses (${b.text})`);
  await s.runUntil(() => !window.__phrasesay.busy(), null, { max: 6000 });

  // 4. an old hand's line with no old hand about: a toast says nobody is there to say it
  await s.key('Escape'); await s.run(400);
  await openBook(s);
  await pickChip(s, { key: 'sev.cut' });
  await s.run(500);
  const toast = await s.eval(() => { const t = document.getElementById('toast'); return t.classList.contains('show') ? t.textContent : null; });
  assert.ok(toast && (await s.eval((t) => window.__kiri.lines.allLines().find((d) => d.key === 'toast.sayNobody').lines.some((l) => l.text === t), toast)), `nobody to say it (${toast})`);
  assert.equal(await s.eval(sayer), null);

  // 5. the say-"hand" egg stays out of it: the word "Hand" selected in the book is not snatched
  await s.eval(() => { const h = document.querySelector('#pb-hand h3'); h.scrollIntoView({ block: 'center' }); const t = h.firstChild, i = t.textContent.indexOf('Hand'); const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 4); const g = getSelection(); g.removeAllRanges(); g.addRange(r); });
  await s.run(1500);
  assert.notEqual((await s.state()).claw, 'show', 'the hand does not come for the word');
  assert.equal(await s.said('hand.word'), false);
  await s.key('Escape'); await s.run(400);
  assert.equal(await s.eval(sayer), null);
});
