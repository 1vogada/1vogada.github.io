'use strict';
// Arm: the demonic hand past the right edge. Tease, tug of war and the rip; a thrown card caught; the crush and the eat;
// cut off with the katana's tip, the stump, and a new hand.
const { scenario, assert } = require('../helpers/harness');
const G = 'arm';
const O = { idle: 3000 };   // a few seconds after load, as a person would
// legacy: false = the hand's zones changed on 2026-11-25 (smaller), so the frozen /?legacy script no longer matches these goldens

const claw = () => { const c = window.__cards.state().claw; return c && { st: c.st, x: c.x, y: c.y, o: !!c.o, stump: !!c.stump, arm2: c.arm2 && c.arm2.map((p) => [p[0], p[1]]) }; };
const kinds = () => { const k = {}; for (const o of window.__cards.objs) k[o.kind] = (k[o.kind] || 0) + 1; return k; };
const vw = () => document.documentElement.clientWidth;

// rip card i and carry it to (x, y) at `speed` px a frame; the button stays down
async function carry(s, i, x, y, speed = 20) {
  const [px, py] = await s.rip(i);
  await s.run(300);
  const n = Math.max(1, Math.round(Math.hypot(x - px, y - py) / speed));
  await s.line(px, py, x, y, n);
  return [x, y];
}
// the tease: a held card brought into its zone makes it eager, and one brought close to the edge gets taken by the far end
async function tease(s, i = 0, y = 300) {
  await carry(s, i, 700, y);
  const W = await s.eval(vw);
  await s.line(700, y, W - 180, y, 20);
  await s.runUntil(() => window.__cards.state().claw.st === 'tug', null, { max: 2000, step: 16 });
  return W;
}

scenario(G, 'tease then tug then rip', { ...O, legacy: false }, async (s) => {
  await carry(s, 0, 700, 300);
  assert.equal((await s.eval(claw)).st, 'lurk', 'a loose card wakes it, but it waits');
  const W = await s.eval(vw);
  await s.line(700, 300, 1000, 300, 12);   // into the tease zone: the last 300 px of the screen at most
  assert.equal((await s.eval(claw)).st, 'eager');
  assert.ok(await s.said('CLAW_SAY.eager'), 'it wants it');
  await s.line(1000, 300, W - 180, 300, 8); // close to the edge: it lunges for the far end and takes hold
  await s.runUntil(() => window.__cards.state().claw.st === 'tug', null, { max: 2000, step: 16 });
  await s.run(700);
  assert.ok(await s.said('CLAW_SAY.grab'), 'it says so (a forced line waits until the last one has been up TIMING.gap.show)');
  // pull it back to the left, slowly (a sharp yank in the first 0.45 s makes its claws slip): the card stretches, then tears
  let x = W - 180;
  while ((await s.eval(claw)).st === 'tug' && x > 300) { x -= 8; await s.move(x, 300); }
  const c = await s.eval(claw);
  assert.equal(c.st, 'triumph', 'torn in two, it keeps its half');
  const b = await s.bubbles();
  const rip = b.find((q) => q.who === 'hand' && q.key.includes('CLAW_SAY.rip'));
  assert.ok(rip, 'it shouts about the rip');
  assert.equal(rip.text, 'CHEESE PULL!!!!', 'the first rip after a page load is always the cheese pull');
  assert.ok(b.some((q) => q.key.startsWith('AGONY.')), 'the card screams while stretched');
  assert.deepEqual(await s.eval(kinds), { piece: 2 }, 'two halves');
  assert.equal(await s.eval(() => window.__cards.state().grab.o.kind), 'piece', 'and you are holding yours');
  assert.equal(await s.eval(() => document.getElementById('toast').textContent), 'It keeps its half.');
  await s.up();
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 8000 });
  assert.ok(await s.said('CLAW_SAY.eat'), 'it drags its half off the screen and eats it');
  assert.equal((await s.eval(kinds)).piece, 1, 'only your half is left');
});

scenario(G, 'catch a thrown card', { ...O, legacy: false }, async (s) => {
  const [px, py] = await carry(s, 1, 560, 300);
  await s.run(600);
  await s.rand(0.99);   // it does not feel like crushing this one, and it tosses it back gently
  await s.throwTo([560, 300], [560 + 18 * 5, 300], { n: 5 });   // 11 m/s to the right
  assert.ok(await s.said('SAY.throw'));
  await s.runUntil(() => window.__cards.state().claw.st === 'has', null, { max: 1500, step: 16 });
  assert.ok(await s.said('CLAW_SAY.caught'), 'it plucks it out of the air');
  const held = await s.eval(() => { const c = window.__cards.state().claw; return !!c.joint && c.o.kind; });
  assert.equal(held, 'card', 'and holds it');
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 4000 });
  assert.ok(await s.said('CLAW_SAY.toss'), 'bored after two seconds, it tosses it back');
  const v = await s.eval(() => [...window.__cards.objs][0].body.getLinearVelocity().x);
  assert.ok(v < -3, 'back to the left');
  await s.run(3000, 100);
  assert.deepEqual(await s.eval(kinds), { card: 1 }, 'still whole');
});

scenario(G, 'crush and eat', { ...O, legacy: false }, async (s) => {
  // held in its zone for too long, out of reach: it loses patience and snatches it
  await carry(s, 0, 1000, 300);
  assert.equal((await s.eval(claw)).st, 'eager');
  await s.rand(0.1);    // snatch, not another "gimme"
  await s.runUntil(() => window.__cards.state().claw.st === 'crush', null, { max: 5000, step: 16 });
  const t0 = await s.now();
  await s.rand(null);
  await s.run(700);
  assert.ok(await s.said('CLAW_SAY.snatch'));
  assert.equal((await s.state()).grab, null, 'out of your hand');
  await s.up();
  await s.runUntil(() => window.__cards.state().claw.st === 'gloat', null, { max: 7000 });
  const took = (await s.now()) - t0;
  assert.ok(took > 4800 && took < 5600, `the crush takes its time (${took} ms)`);
  const b = await s.bubbles();
  for (const k of ['CLAW_SAY.savour', 'BEG', 'CLAW_SAY.crush']) assert.ok(b.some((q) => q.key.split('|').includes(k)), 'said ' + k);
  assert.ok(b.some((q) => q.key.startsWith('AGONY.') && q.lvl === '2'), 'the card screams louder as it is squeezed');
  assert.ok(b.some((q) => q.key.startsWith('SAY.slice') && q.lvl === '2'), 'and dies screaming');
  assert.deepEqual(await s.eval(kinds), {}, 'no card left');
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 3000 });
  // and the eat: a tug of war it wins half of
  await s.run(1500);
  const W = await tease(s, 0);
  await s.run(700);
  let x = W - 180;
  while ((await s.eval(claw)).st === 'tug' && x > 300) { x -= 8; await s.move(x, 300); }
  assert.equal((await s.eval(claw)).st, 'triumph');
  await s.up();
  await s.runUntil(() => window.__cards.state().claw.st === 'eat', null, { max: 3000 });
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 8000 });
  assert.ok(await s.said('CLAW_SAY.eat'));
  assert.equal((await s.eval(kinds)).piece, 1, 'its half is gone');
});

// the arm's polyline (viewport px): the point on it at x
const onArm = (arm, x) => { for (let i = 0; i + 1 < arm.length; i++) { const [a, b] = [arm[i], arm[i + 1]], f = (x - a[0]) / (b[0] - a[0]); if (f >= 0 && f <= 1) return [x, a[1] + (b[1] - a[1]) * f]; } return null; };

scenario(G, 'sever with the katana tip, stump, regrow', O, async (s) => {
  // the katana first (wiping the fog near it uncovers it), then the shelf (type tana), and a card left on the shelf:
  // the hand comes for it with its whole arm out across the screen
  await s.ensurePlanck();
  const r = await s.box('.katana'), cx = r.x + r.w / 2, ky = r.y + r.h - 70;
  for (let k = 0; k < 4; k++) await s.line(k % 2 ? cx + 90 : cx - 90, ky, k % 2 ? cx - 90 : cx + 90, ky + 8, 6);
  assert.equal(await s.eval(() => window.__cards.state().found), true);
  await s.type('tana');
  await s.run(300);
  assert.ok(await s.eval(() => !!window.__cards.state().shelf));
  await s.scrollTo(250);
  const shelfY = await s.eval(() => window.__cards.state().shelf.y - scrollY);
  const [px, py] = await s.rip(0);
  await s.run(300);
  await s.line(px, py, 200, shelfY - 140, 30);
  await s.run(800);
  await s.up();
  await s.runUntil(() => window.__cards.state().claw.st === 'reach', null, { max: 5000 });
  assert.ok(await s.said('CLAW_SAY.shelf'));
  await s.run(1500);
  // double-click the planted katana: it jumps into the hand
  const g = await s.box('.katana-in');
  await s.page.mouse.dblclick(g.x + 20, g.y + 40);
  await s.run(100);
  assert.equal((await s.state()).kat, 'equipped');
  // the tip (107 px right of and 227 px above the grip) goes up, over everything, and straight down across the arm at x 1220,
  // right of the last card column
  const arm = (await s.eval(claw)).arm2, [ax, ay] = onArm(arm, 1220);
  const P = (tx, ty) => [tx - 107, ty + 227];
  await s.line(g.x + 20, g.y + 40, ...P(145, 30), 10);
  await s.line(...P(145, 30), ...P(ax, 30), 30);
  assert.equal((await s.eval(claw)).st, 'reach', 'not touched yet');
  await s.line(...P(ax, 30), ...P(ax, ay + 60), Math.round((ay + 30) / 10));
  const c2 = await s.eval(claw);
  assert.deepEqual([c2.st, c2.stump], ['stump', true], 'the hand comes off');
  assert.ok(await s.said('CLAW_SAY.severed'));
  const st = await s.state();
  assert.equal(st.sev, 'limp', 'the cut-off hand lies where it fell');
  assert.equal(await s.eval(() => document.getElementById('toast').textContent), 'You cut its hand off. It will grow another. The old one has plans of its own.');
  assert.equal((await s.eval(kinds)).card, 1, 'the card it was after is still whole');
  // put the katana down so it cuts nothing else, and wait for the new hand
  await s.page.mouse.dblclick(...P(ax, ay + 60));
  await s.runUntil(() => window.__cards.state().claw.st === 'regrow', null, { max: 9000, step: 100 });
  const tStump = (await s.bubbles()).find((q) => q.key === 'CLAW_SAY.severed').t;
  assert.ok((await s.now()) - tStump > 7900, 'it stays away for about eight seconds');
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 4000 });
  assert.ok(await s.said('CLAW_SAY.regrow'), 'and comes back to show off a new one');
  assert.equal((await s.eval(claw)).stump, false);
});
