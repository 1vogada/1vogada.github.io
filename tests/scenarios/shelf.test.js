'use strict';
// Cards and shelf: the secret shelf (棚, "tana") opens three ways; a card left on it is something the hand comes for, slowly,
// while the card panics in three tiers and the cards nearby say "not me".
const { scenario, assert } = require('../helpers/harness');
const G = 'shelf';

const shelf = () => { const st = window.__cards && window.__cards.state(); return !!(st && st.shelf) && !!document.querySelector('#phys .shelf'); };
const toast = () => document.getElementById('toast').textContent;

scenario(G, 'shelf opens three ways', async (s) => {
  await s.ensurePlanck();
  // 1. typing tana anywhere on the page (and again to put it away)
  await s.type('tana');
  await s.run(100);
  assert.equal(await s.eval(shelf), true, 'typing tana brings the shelf out');
  assert.equal(await s.eval(toast), '棚 · A shelf. Pull a card out and leave it there.');
  const sh = await s.eval(() => { const x = window.__cards.state().shelf; return { x0: x.x0, w: x.w, y: x.y }; });
  assert.equal(sh.x0, 0, 'at the very left edge');
  await s.type('tana');
  await s.run(100);
  assert.equal(await s.eval(shelf), false, 'typed again, it goes');
  assert.equal(await s.eval(toast), 'The shelf is gone.');
  // the Bulgarian word works too (a Bulgarian keyboard layout's keydown events; Playwright's keyboard only knows the US layout)
  for (const ch of 'рафт') { await s.eval((key) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })), ch); await s.run(20, 20); }
  await s.run(100);
  assert.equal(await s.eval(shelf), true, 'рафт works as well');
  await s.type('tana');
  await s.run(100);
  assert.equal(await s.eval(shelf), false);
  // 2. the search box: tana + Enter (phones have no page to type on)
  await s.press('#q');
  await s.type('tana');
  assert.equal(await s.eval(() => document.getElementById('shown').textContent), '1 of 13', 'while typing it is just a search (the fixture post mentions the ka-tana)');
  await s.key('Enter');
  await s.run(100);
  const q = await s.eval(() => ({ v: document.getElementById('q').value, focus: document.activeElement === document.getElementById('q'), url: location.pathname }));
  assert.deepEqual(q, { v: '', focus: false, url: '/' }, 'the box is cleared and nothing is opened');
  assert.equal(await s.eval(shelf), true, 'Enter on tana in the search box opens the shelf');
  await s.press('#q'); await s.type('tana'); await s.key('Enter'); await s.run(100);
  assert.equal(await s.eval(shelf), false);
  await s.page.mouse.click(5, 5); await s.run(20, 20);
  // 3. tapping the writing in the corner of the banner, once the fog is wiped off it
  const sec = await s.box('#secret');
  const c = [sec.x + sec.w / 2, sec.y + sec.h / 2];
  // a click that comes without the pointer passing over the writing (the fog is still on it) does nothing. Any real pointer
  // that gets there wipes the fog as it moves, so this one is dispatched straight at the element
  await s.eval((c) => document.getElementById('secret').dispatchEvent(new MouseEvent('click', { clientX: c[0], clientY: c[1], bubbles: true })), c);
  await s.run(100);
  assert.equal(await s.eval(shelf), false, 'under the fog, a tap does nothing');
  for (let k = 0; k < 4; k++) await s.line(c[0] - 70, c[1] + (k % 3) * 4 - 4, c[0] + 70, c[1] - (k % 3) * 4 + 4, 8, 16);
  await s.page.mouse.click(c[0], c[1]); await s.run(100);
  assert.equal(await s.eval(shelf), true, 'wiped clean, a tap on it opens the shelf');
});

scenario(G, 'hand reach with card panic tiers and bystander lines', { idle: 3000, legacy: false }, async (s) => {
  await s.ensurePlanck();
  await s.type('tana');
  await s.run(300);
  await s.scrollTo(250);
  const shelfY = await s.eval(() => window.__cards.state().shelf.y - scrollY);
  // card A goes on the shelf
  let [px, py] = await s.rip(0);
  await s.run(300);
  await s.line(px, py, 200, shelfY - 140, 30);
  await s.run(800);
  await s.up();
  await s.run(300);
  // card B is laid on top of A: on it, not on the shelf, so it only watches
  const A = await s.eval(() => { const o = [...window.__cards.objs][0], p = o.body.getPosition(); return { y: p.y * 100 - scrollY, h: o.h }; });
  [px, py] = await s.rip(0);
  await s.run(300);
  await s.line(px, py, 210, A.y - A.h - 30, 30);
  await s.run(800);
  // the hand will not come while you hold a card near the shelf
  await s.run(1500);
  assert.equal((await s.state()).claw, 'lurk', 'it waits while you are at the shelf');
  await s.up();
  await s.rand(0.2);   // every hop and every "not me" chance the same; and it crushes the card on the spot
  await s.runUntil(() => window.__cards.state().claw.st === 'reach', null, { max: 5000 });
  assert.ok(await s.said('CLAW_SAY.shelf'), 'it spots the snack');
  await s.runUntil(() => window.__cards.state().claw.st !== 'reach', null, { max: 15000 });
  const st = (await s.state()).claw;
  assert.equal(st, 'crush', 'it got there and closed its fist on it');
  const b = await s.bubbles();
  const tiers = b.filter((q) => q.key.startsWith('PANIC.')).map((q) => +q.key.slice(6, 7));
  assert.ok(tiers.includes(0) && tiers.includes(1) && tiers.includes(2), `all three tiers of panic (${tiers})`);
  for (let i = 1; i < tiers.length; i++) assert.ok(tiers[i] >= tiers[i - 1], 'and only ever louder as it comes closer');
  assert.ok(b.some((q) => q.key === 'NOTME'), 'the card next to it says it was not it');
  await s.rand(null);
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 9000 });
  assert.equal(await s.eval(() => [...window.__cards.objs].filter((o) => o.kind === 'card').length), 1, 'one card left: the bystander');
});
