'use strict';
// Scenes: "Surprise me" draws an omikuji fortune slip with a project. The hand asks, and a No turns into its coin-toss game:
// it slams Yes and No off the slip, snaps up Heads and Tails, swats your first call, and sends you away if you lose.
const { scenario, assert } = require('../helpers/harness');
const G = 'scenes';

const slip = () => { const o = document.getElementById('omikuji'); return { open: !o.hidden, buttons: [...document.querySelectorAll('#omi-actions .btn')].map((b) => b.textContent + (b.disabled ? ' (off)' : '')), href: (document.getElementById('omi-go') || {}).href || null }; };
const hand = () => { const c = window.__cards.state().claw; return c && c.st; };

// planck is loaded before anything: the hand's come() waits for it, and a network wait in the middle would move every later timer
async function openSlip(s) {
  await s.ensurePlanck();
  await s.page.mouse.move(5, 300);
  await s.press('#surprise');
  await s.runUntil(() => !document.getElementById('omikuji').hidden, null, { max: 3000, step: 50 });
  await s.finishCss();
  const r = await s.eval(slip);
  assert.ok(r.open);
  return r;
}
async function click(s, sel) { await s.finishCss(); await s.press(sel); }
const btn = (label) => `#omi-actions .btn:nth-child(${label === 'Heads' || label === 'Yes' ? 1 : 2})`;
// from No to the spinning coin: hello, the slam, the snap, its own buttons, "better", the toss
async function toCoin(s, back = false) {
  await s.runUntil(() => !!document.querySelector('.coin') && !document.querySelector('#omi-actions .btn').disabled, null, { max: 12000, step: 50 });
  assert.ok(await s.said(back ? 'CLAW_SAY.back' : 'CLAW_SAY.hello'));
  assert.ok(await s.said('CLAW_SAY.smashbtn'));
  assert.ok(await s.said('CLAW_SAY.better'));
  assert.ok(await s.said(back ? 'CLAW_SAY.rematch' : 'CLAW_SAY.flip'));
  assert.deepEqual((await s.eval(slip)).buttons, ['Heads', 'Tails']);
}

scenario(G, 'slip opens and own Yes / own No', { idle: 2000 }, async (s) => {
  let r = await openSlip(s);
  const f = await s.eval(() => ({ kanji: document.getElementById('omi-kanji').textContent, proj: document.getElementById('omi-proj').textContent, q: document.getElementById('omi-q').textContent }));
  assert.ok(f.kanji && f.proj, 'a fortune and a project');
  assert.equal(f.q, '', 'the slip itself asks nothing: the hand does');
  assert.deepEqual(r.buttons, ['Yes, take me →', 'No']);
  await s.runUntil(() => window.__cards.state().claw && window.__cards.state().claw.st === 'show', null, { max: 2000 });
  await s.run(1000);
  assert.ok(await s.said('CLAW_SAY.ask'), 'it leans in and asks');
  await s.run(7200, 100);
  assert.equal((await s.bubbles()).filter((b) => b.key === 'CLAW_SAY.ask').length, 2, 'and asks once more if you do nothing');
  // your own Yes: the link takes you to the project
  await click(s, btn('Yes'));
  assert.equal(await s.leftTo(), r.href, 'Yes goes to the project');
  // back, a new slip, your own No: the hand comes out to see about that
  await s.load();
  r = await openSlip(s);
  await s.run(1500);
  await click(s, btn('No'));
  assert.equal((await s.eval(slip)).buttons[1], 'No (off)');
  await s.run(1000);
  assert.ok(await s.said('CLAW_SAY.hello'));
  assert.equal(await s.eval(hand), 'show');
  await s.runUntil(() => !!document.querySelector('.coin'), null, { max: 10000 });
  // Esc does not close the slip in the middle of its game
  await s.key('Escape');
  assert.ok((await s.eval(slip)).open);
});

scenario(G, 'coin win', { rand: 0.3, idle: 2000 }, async (s) => {
  // with Math.random at 0.3: its swat is a slap, it lets you pick after the snap, and the coin comes up heads
  await openSlip(s);
  await s.run(1500);
  await click(s, btn('No'));
  await toCoin(s);
  await click(s, btn('Heads'));
  await s.runUntil(() => { const b = document.querySelector('#omi-actions .btn'); return b && !b.disabled && document.querySelectorAll('#omi-actions .btn-say').length === 0; }, null, { max: 8000 });
  assert.ok(await s.said('CLAW_SAY.slap'), 'the first call of the visit is swatted away');
  assert.ok(await s.said('CLAW_SAY.yourpick'), 'then it lets you call it after all');
  await click(s, btn('Heads'));
  await s.runUntil(() => document.getElementById('omikuji').hidden, null, { max: 12000 });
  const b = await s.bubbles();
  const order = b.filter((q) => q.who === 'hand').map((q) => q.key);
  const i = order.indexOf('CLAW_SAY.heads');
  assert.ok(i > 0, 'it reads the coin out');
  assert.deepEqual(order.slice(i, i + 3), ['CLAW_SAY.heads', 'CLAW_SAY.won', 'CLAW_SAY.stay'], 'beaten, it lets you stay');
  assert.equal(await s.leftTo(), null, 'and you are still here');
  await s.run(2500, 100);
  assert.equal(await s.eval(() => document.documentElement.classList.contains('hand-show')), false);
  assert.equal(await s.eval(hand), 'lurk', 'it went back where it came from');
});

scenario(G, 'coin lose with the 5 s wait before the hand presses Yes', { rand: 0.3, idle: 2000 }, async (s) => {
  const r = await openSlip(s);
  await s.run(1500);
  await click(s, btn('No'));
  await toCoin(s);
  await click(s, btn('Tails'));
  await s.runUntil(() => { const b = document.querySelector('#omi-actions .btn'); return b && !b.disabled && document.querySelectorAll('#omi-actions .btn-say').length === 0; }, null, { max: 8000 });
  await click(s, btn('Tails'));
  await s.runUntil(() => [...document.querySelectorAll('#omi-actions .btn')].map((b) => b.textContent).join() === 'Yes, take me →,No', null, { max: 8000 });
  const lost = (await s.bubbles()).find((q) => q.key === 'CLAW_SAY.lost');
  assert.ok(lost, 'heads: you called it wrong');
  const t0 = await s.now();
  assert.deepEqual((await s.eval(slip)).buttons, ['Yes, take me →', 'No'], 'Yes and No are yours again');
  await s.run(4800, 100);
  assert.ok(await s.said('CLAW_SAY.waiting'), 'it nags');
  assert.equal(await s.eval(() => document.getElementById('omi-go').classList.contains('pressed')), false, 'and keeps its finger off Yes for five seconds');
  await s.runUntil(() => document.getElementById('omi-go').classList.contains('pressed'), null, { max: 2000, step: 20 });
  const pressedAt = (await s.now()) - t0;
  assert.ok(pressedAt > 5000 && pressedAt < 6000, `then it presses Yes (${pressedAt} ms)`);
  await s.run(400);
  assert.ok(await s.said('CLAW_SAY.bye'));
  await s.collect();
  await s.run(1500, 100);   // 260 + 300 + 1100 ms after the press
  assert.equal(await s.leftTo(), r.href, 'and off you go to the project');
});

scenario(G, 'button slam and snap', { rand: 0.8, idle: 2000 }, async (s) => {
  // with Math.random at 0.8: its swat is the slam, and after the snap it picks for you (tails), and the coin comes up tails
  await openSlip(s);
  await s.run(1500);
  await click(s, btn('No'));
  await s.runUntil(() => document.getElementById('omi-actions').children.length === 0, null, { max: 6000, step: 20 });
  const smash = await s.eval(() => ({ flung: document.querySelectorAll('#omikuji .omi-flung').length, bits: document.querySelectorAll('#omikuji .omi-bit').length, q: document.getElementById('omi-q').textContent }));
  assert.deepEqual(smash, { flung: 2, bits: 18, q: '' }, 'it slams Yes and No off the slip, in pieces');
  assert.ok(await s.said('CLAW_SAY.smashbtn'));
  await s.runUntil(() => !!document.querySelector('.omi-snap'), null, { max: 3000, step: 20 });
  assert.equal(await s.eval(() => document.querySelectorAll('.omi-snap i').length), 7, 'a snap');
  await s.runUntil(() => document.querySelectorAll('#omi-actions .btn.poof').length === 2, null, { max: 1000, step: 20 });
  assert.deepEqual((await s.eval(slip)).buttons, ['Heads (off)', 'Tails (off)'], 'and its own two buttons poof in');
  await toCoin(s);
  await click(s, btn('Heads'));
  await s.run(700);
  assert.ok(await s.said('CLAW_SAY.slap'), 'your first call: it slams both buttons away');
  await s.run(1500);
  assert.ok(await s.said('CLAW_SAY.snap'), 'it snaps');
  await s.run(1500);
  const hi = (await s.bubbles()).filter((q) => q.who === 'btn');
  assert.equal(hi.length, 2, 'a fresh pair poofs in, each saying hello');
  assert.ok(hi.every((q) => q.key === 'SAY.btnhi') && hi[0].text !== hi[1].text, 'two different hellos');
  await s.runUntil(() => document.querySelector('#omi-actions .btn:nth-child(2)').classList.contains('pressed'), null, { max: 5000, step: 20 });
  assert.ok(await s.said('CLAW_SAY.mypick'), 'it picks for you this time');
  await s.runUntil(() => document.getElementById('omikuji').hidden, null, { max: 12000 });
  assert.ok(await s.said('CLAW_SAY.tails') && await s.said('CLAW_SAY.won'), 'tails, its own pick: you win');
});

scenario(G, 'secret ×', { idle: 2000 }, async (s) => {
  await openSlip(s);
  await s.run(2000);
  // the corner of the screen, bottom left: the secret × rises and the hand protests
  const o = await s.box('#omikuji');
  await s.move(o.x + 29, o.y + o.h - 29);
  assert.equal(await s.eval(() => document.getElementById('omi-secret').classList.contains('near')), true);
  await s.run(1500);
  assert.ok(await s.said('CLAW_SAY.secret'), 'NOOOO');
  await click(s, '#omi-secret');
  assert.equal((await s.eval(slip)).open, false, 'it closes the slip there and then');
  await s.run(800);
  assert.ok(await s.said('CLAW_SAY.escaped'));
  await s.run(2500, 100);
  assert.equal(await s.eval(hand), 'lurk');
  // in the middle of the coin game it works too, and the game is over
  await s.move(400, 400);
  await openSlip(s);
  await s.run(1500);
  await click(s, btn('No'));
  await s.run(2500);
  await s.move(o.x + 29, o.y + o.h - 29);
  await click(s, '#omi-secret');
  await s.run(2500, 100);
  const after = await s.eval(() => ({ slip: !document.getElementById('omikuji').hidden, coin: !!document.querySelector('.coin'), buttons: [...document.querySelectorAll('#omi-actions .btn')].map((b) => b.textContent + (b.disabled ? ' (off)' : '')) }));
  assert.deepEqual(after, { slip: false, coin: false, buttons: ['Yes, take me →', 'No'] }, 'the scene is killed and the slip is put back as it was');
  assert.equal(await s.eval(hand), 'lurk');
});

scenario(G, 'welcome back', { rand: 0.3, session: { 'kiripad-sent': 'https://hive.kiripad.dev/' } }, async (s) => {
  // it pressed Yes for you last time; you came back. planck first: the welcome comes 900 ms after the list loads
  await s.ensurePlanck();
  assert.equal(await s.eval(() => sessionStorage.getItem('kiripad-sent')), 'https://hive.kiripad.dev/');
  await s.runUntil(() => !document.getElementById('omikuji').hidden, null, { max: 3000 });
  await s.finishCss();
  assert.equal(await s.eval(() => sessionStorage.getItem('kiripad-sent')), null, 'the mark is used up');
  assert.notEqual((await s.eval(slip)).href, 'https://hive.kiripad.dev/', 'another project this time');
  await toCoin(s, true);
  assert.equal(await s.said('CLAW_SAY.hello'), false);
  assert.equal(await s.said('CLAW_SAY.flip'), false);
  // no swat this time: it already slapped you once today. Heads it is
  await click(s, btn('Heads'));
  await s.runUntil(() => document.getElementById('omikuji').hidden, null, { max: 12000 });
  assert.equal(await s.said('CLAW_SAY.slap'), false);
  assert.ok(await s.said('CLAW_SAY.won'));
});
