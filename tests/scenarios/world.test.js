'use strict';
// World: the cards as rigid bodies. Pull, rip, throw, smash, stack, autoscroll, reset, background tab, reduced motion.
const { scenario, assert } = require('../helpers/harness');
const G = 'world';

// page px of every loose card's centre, and whether it sleeps
const loose = () => [...window.__cards.objs].filter((o) => o.kind === 'card' && !o.root).map((o) => {
  const p = o.body.getPosition(); return { x: p.x * 100, y: p.y * 100, a: o.body.getAngle(), awake: o.body.isAwake(), h: o.h, w: o.w };
});
const kinds = () => { const k = {}; for (const o of window.__cards.objs) k[o.kind] = (k[o.kind] || 0) + 1; return k; };

scenario(G, 'pull and spring back', async (s) => {
  await s.pull(0, 40, -110, { n: 12 });
  const st = await s.state();
  assert.equal(st.grab, 'card:rooted', 'a short pull holds the card by its root');
  assert.equal(st.objs.card, 1);
  await s.run(700);   // a forced line never replaces one younger than TIMING.gap.show
  await s.up();
  assert.ok(await s.said('SAY.pull'), 'it complains when pulled');
  await s.run(100);
  assert.ok(await s.said('SAY.back'), 'it gloats when let go in time');
  await s.runUntil(() => window.__cards.objs.size === 0, null, { max: 4000 });
  const card = await s.eval(() => { const c = document.querySelector('#grid .card'); return { tf: c.style.transform, pulling: c.classList.contains('pulling'), held: c.classList.contains('held'), url: location.pathname }; });
  assert.deepEqual(card, { tf: '', pulling: false, held: false, url: '/' }, 'back in its slot, untouched, and the drag did not click the link');
});

scenario(G, 'a card comes out like a tooth', { legacy: false }, async (s) => {
  const loosed = () => { const g = window.__cards.state().grab; return g ? g.o.loose || 0 : -1; };
  await s.eval(() => { window.__cards.drag.ONE_TUG = 0; });   // every card is a stubborn one: two tugs
  // one long hold of the strain is one tug and no more: the root gives a notch and then waits for the pull to ease off
  const [x, y] = await s.pull(0, 0, -260, { n: 12 });
  await s.runUntil(() => window.__cards.state().grab.o.loose === 1, null, { max: 4000, step: 16 });
  assert.ok(await s.said('card.loosen'), 'the root gives a notch and the card says so');
  await s.run(2500);
  assert.equal(await s.eval(loosed), 1, 'holding on does not count twice');
  assert.equal((await s.state()).grab, 'card:rooted', 'and it is still rooted');
  await s.shot('tug-1');
  // let go: it springs home and sits crooked; the looseness stays for the next pull
  await s.up();
  await s.runUntil(() => window.__cards.objs.size === 0, null, { max: 6000 });
  const home = await s.eval(() => { const c = document.querySelector('#grid .card'); return { rot: c.style.rotate, held: c.classList.contains('held') }; });
  assert.deepEqual(home, { rot: '1.3deg', held: false }, 'back in its slot, a little crooked');
  await s.shot('crooked');
  await s.tugOut(0);
  assert.ok(await s.said('SAY.rip'), 'one more tug and it is out');
  assert.equal(await s.eval(() => document.querySelector('#grid .card').style.rotate), '', 'the empty slot is straight again');
  void x; void y;
});

scenario(G, 'most cards come out on one held tug', { legacy: false }, async (s) => {
  await s.eval(() => { window.__cards.drag.ONE_TUG = 1; });
  await s.pull(0, 0, -260, { n: 12 });   // out to the strain and hold: no yank
  await s.runUntil(() => !window.__cards.state().grab.o.root, null, { max: 4000, step: 16 });
  assert.ok(await s.said('SAY.rip'), 'it lets go');
  assert.ok(!(await s.said('card.loosen')), 'without a notch first');
  assert.deepEqual(await s.eval(kinds), { card: 1 }, 'whole');
});

scenario(G, 'a card yanked too far tears in two', { legacy: false }, async (s) => {
  await s.pull(0, 0, -420, { n: 10 });   // fast and far on the first pull
  // it does not tear at once: it stretches between its slot and your hand first, like in the tug of war with the hand
  assert.deepEqual(await s.eval(kinds), { card: 1 }, 'still one card, stretching');
  await s.run(200, 20); await s.shot('stretching');
  await s.run(260, 20);
  const k = await s.eval(kinds);
  assert.deepEqual(k, { piece: 2 }, 'two halves, no whole card');
  const st = await s.eval(() => ({ grab: window.__cards.state().grab.o.kind, held: document.querySelector('#grid .card').classList.contains('held'), toast: document.getElementById('toast').textContent }));
  assert.deepEqual(st, { grab: 'piece', held: true, toast: 'Too hard: it tore. Pull and hold instead, like pulling a tooth.' }, 'your half stays in your hand, the slot is empty');
  assert.ok(await s.said('SAY.slice'), 'your half screams');
  await s.run(120); await s.shot('snapped');
  await s.run(500);
  const far = await s.eval(() => { const g = window.__cards.state().grab, a = g.joint.getAnchorB(), t = g.joint.getTarget(); return Math.hypot(a.x - t.x, a.y - t.y) * 100; });
  assert.ok(far < 12, `your half has flown to the pointer (${far.toFixed(1)} px)`);
});

scenario(G, 'rip', async (s) => {
  const [px, py] = await s.rip(0);
  assert.ok(await s.said('SAY.rip'), 'a card torn out screams');
  const r = await s.eval(() => ({ held: document.querySelector('#grid .card').classList.contains('held'), clones: document.querySelectorAll('#phys .phys.card').length,
    toast: document.getElementById('toast').textContent, reset: !!document.querySelector('.reset-cards') && !document.querySelector('.reset-cards').hidden }));
  assert.deepEqual(r, { held: true, clones: 1, toast: 'Ripped it out! Stack them, or throw one hard to smash it.', reset: true });
  await s.run(600);
  const [c] = await s.eval(loose);
  assert.ok(Math.hypot(c.x - px, c.y - py) < 12, `held by its centre, it hangs under the pointer (${c.x.toFixed(0)},${c.y.toFixed(0)} vs ${px},${py})`);
  assert.equal((await s.state()).claw, 'lurk', 'the first card loose wakes the hand');
  // let go gently: it falls to the floor of the page and goes to sleep there
  await s.up();
  await s.runUntil(() => { const o = [...window.__cards.objs][0]; return !o.body.isAwake(); }, null, { max: 12000, step: 100 });
  const [d] = await s.eval(loose);
  const floor = await s.eval(() => window.__cards.state().size.H);
  assert.ok(Math.abs(d.y + d.h / 2 - floor) < 3, `it lies on the floor (${(d.y + d.h / 2).toFixed(1)} vs ${floor})`);
});

scenario(G, 'throw', { legacy: false }, async (s) => {
  const [px, py] = await s.rip(1);   // the middle column
  await s.run(800);
  // down near the floor first: a thrown card stays "hot" for 1.5 s, and one that falls the whole page in that time shatters on the floor
  await s.line(px, py, 900, 300, 10);
  await s.scrollHolding();
  await s.line(900, 300, 900, 600, 10);
  await s.run(800);
  // 11 m/s to the left: a throw (over 9 m/s) but not enough to shatter anything (13 m/s)
  await s.throwTo([900, 600], [900 - 18 * 5, 600], { n: 5 });
  assert.ok(await s.said('SAY.throw'), 'a thrown card says so');
  const hot = await s.eval(() => { const o = [...window.__cards.objs][0]; return { hot: o.hot > 0, v: o.body.getLinearVelocity().x }; });
  assert.ok(hot.hot && hot.v < -9 && hot.v > -13, `it flies left at a throw's speed (${hot.v.toFixed(1)} m/s)`);
  await s.run(6000, 100);
  assert.deepEqual(await s.eval(kinds), { card: 1 }, 'it hit the floor and the wall and is still whole');
  assert.equal(await s.eval(() => [...window.__cards.objs][0].hot), 0, 'and it is no longer a throw');
});

scenario(G, 'smash and debris', { legacy: false }, async (s) => {
  const [px, py] = await s.rip(0);
  await s.run(800);
  await s.throwTo([px, py], [px - 40 * 4, py], { n: 4 });   // 25 m/s into the left wall
  await s.run(200);
  const k = await s.eval(kinds);
  assert.ok(!k.card, 'the card is gone');
  assert.ok((k.shard || 0) + (k.piece || 0) >= 6, `it broke into pieces (${JSON.stringify(k)})`);
  assert.ok(await s.said('SAY.smash'), 'it screams as it shatters');
  assert.equal(await s.eval(() => document.getElementById('toast').textContent), 'Smashed!');
  await s.run(7000, 100);
  const k2 = await s.eval(kinds);
  assert.ok(!k2.shard, 'the small shards have faded away');
  assert.equal(k2.piece || 0, k.piece || 0, 'the big pieces stay as bodies');
  assert.equal(await s.eval(() => document.querySelectorAll('#phys .phys.shard').length), 0);
});

scenario(G, 'stacking at the page bottom', { legacy: false }, async (s) => {
  const H = await s.eval(() => Math.round(document.querySelector('footer.bottom').getBoundingClientRect().bottom + scrollY));
  const vh = 900, X = 640;
  for (let i = 0; i < 3; i++) {
    await s.scrollTo(0);
    const [px, py] = await s.rip(0);   // the first card still in the grid
    await s.run(400);
    // carry it over to X, then down to the bottom of the page by scrolling while holding it (the hand keeps it under the pointer)
    await s.rand(0.99);   // a card ripped from the last column is in the hand's zone: carried away, it sulks instead of snatching
    await s.line(px, py, X, 300, 8);
    await s.rand(null);
    let y = 0;
    while (y < H - vh) { y = Math.min(H - vh, y + 60); await s.scrollTo(y, 16); }
    // lower it to just above the stack and let go slowly
    const h = (await s.eval(loose)).find((c) => !c.awake === false && c.y < H).h;
    const top = vh - 6 - h * i - h / 2 - 30;
    await s.line(X, 300, X, top, 12, 24);
    await s.run(600);
    await s.up();
    await s.runUntil(() => [...window.__cards.objs].every((o) => !o.body.isAwake()), null, { max: 15000, step: 100 });
  }
  const cs = (await s.eval(loose)).sort((a, b) => b.y - a.y);
  assert.equal(cs.length, 3);
  for (const c of cs) assert.ok(!c.awake && Math.abs(c.a) < 0.02 && Math.abs(c.x - X) < 25, `level, asleep, in one tower: ${JSON.stringify(c)}`);
  assert.ok(Math.abs(cs[0].y + cs[0].h / 2 - H) < 3, 'the bottom one is on the floor');
  for (let i = 1; i < 3; i++) assert.ok(Math.abs(cs[i - 1].y - cs[i].y - (cs[i - 1].h + cs[i].h) / 2) < 3, `exact spacing between ${i - 1} and ${i}`);
});

scenario(G, 'edge autoscroll', async (s) => {
  const [px, py] = await s.rip(0);
  await s.run(400);
  await s.line(px, py, px, 880, 10);     // 20 px from the bottom of the screen
  const y0 = await s.scrollY();
  await s.run(300);
  assert.equal(await s.scrollY(), y0, 'no scroll before it has rested at the edge for 350 ms');
  await s.run(700);
  const y1 = await s.scrollY();
  assert.ok(y1 > y0 + 150, `resting at the edge scrolls the page (${y0} -> ${y1})`);
  const [c] = await s.eval(loose);
  assert.ok(Math.abs(c.y - (880 + y1)) < 30 && Math.abs(c.x - px) < 10, `the card stays under the pointer while the page scrolls (${c.x.toFixed(0)},${c.y.toFixed(0)} vs ${px},${880 + y1})`);
  await s.line(px, 880, px, 450, 6);     // away from the edge: the scrolling stops
  const y2 = await s.scrollY();
  await s.run(500);
  assert.equal(await s.scrollY(), y2);
  await s.up();
});

scenario(G, 'reset all', { legacy: false }, async (s) => {
  let [px, py] = await s.rip(0);
  await s.run(800);
  await s.throwTo([px, py], [px - 160, py], { n: 4 });   // smashed
  await s.run(400);
  [px, py] = await s.rip(0);
  await s.run(300);
  await s.up();
  await s.run(1500, 100);
  assert.ok((await s.eval(() => window.__cards.objs.size)) > 2);
  await s.press('.reset-cards');
  const r = await s.eval(() => ({ objs: window.__cards.objs.size, els: document.querySelectorAll('#phys .phys').length, held: document.querySelectorAll('#grid .card.held').length,
    regrow: document.querySelectorAll('#grid .card.regrow').length, resetHidden: document.querySelector('.reset-cards').hidden, claw: window.__cards.state().claw.st }));
  assert.deepEqual(r, { objs: 0, els: 0, held: 0, regrow: 2, resetHidden: true, claw: 'lurk' }, 'the cards are back; the hand is not reset');
  await s.run(800);
  assert.equal(await s.eval(() => document.querySelectorAll('#grid .card.regrow').length), 0, 'the regrow animation class is swapped for settled');
  await s.run(3000, 100);
  assert.equal((await s.state()).claw, 'lurk', 'the hand is as it was: still there, waiting');
});

scenario(G, 'tab hidden pauses everything', async (s) => {
  const [px, py] = await s.rip(0);
  await s.run(700);
  await s.line(px, py, px + 200, py - 100, 20);
  await s.run(300);
  await s.up();   // let go mid-air, at rest: it starts to fall
  await s.run(100);
  const a = (await s.eval(loose))[0];
  const bubbles = await s.eval(() => document.querySelectorAll('#phys .say').length);
  await s.eval(() => window.__setHidden(true));
  await s.run(3000, 100);
  const b = (await s.eval(loose))[0];
  assert.deepEqual([b.x, b.y], [a.x, a.y], 'nothing moves while the tab is in the background');
  assert.equal(await s.eval(() => document.querySelectorAll('#phys .say').length), bubbles, 'and no bubble runs out');
  assert.equal(await s.eval(() => window.__cards.state().loopOn), true);
  await s.eval(() => window.__setHidden(false));
  await s.run(300);
  const c = (await s.eval(loose))[0];
  assert.ok(c.y > b.y + 5, 'back on the tab it carries on falling from where it was');
  assert.ok(c.y - b.y < 200, 'without simulating the time away');
});

scenario(G, 'reduced motion starts no physics', { reducedMotion: 'reduce' }, async (s) => {
  const r = await s.eval(() => ({ cards: !!window.__cards, sev: !!window.__sev, hand: !!window.__hand, katana: !!document.querySelector('.katana'), hello: document.getElementById('hello').textContent }));
  assert.deepEqual(r, { cards: false, sev: false, hand: false, katana: false, hello: 'Hi there.' });
  const c = await s.cardBox(0);
  await s.move(c.x + c.w / 2, c.y + c.h / 2);
  await s.down();
  await s.line(c.x + c.w / 2, c.y + c.h / 2, c.x + c.w / 2, c.y - 300, 10);
  await s.up();
  await s.run(2000, 100);
  const after = await s.eval(() => ({ phys: !!document.getElementById('phys'), planck: !!window.planck, hello: document.getElementById('hello').textContent, held: document.querySelectorAll('.card.held, .card.pulling').length }));
  assert.deepEqual(after, { phys: false, planck: false, hello: 'Hi there.', held: 0 }, 'no bodies, no engine, no typewriter');
  assert.equal((await s.bubbles()).length, 0);
});
