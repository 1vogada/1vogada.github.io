'use strict';
// Severed hand: the hand that was cut off lives on as a creature with a table of behaviours (SEV). Limp, rise, walk and turn;
// picked up and dropped; it hunts a card and crushes it; never more than three of them.
const { scenario, assert } = require('../helpers/harness');
const G = 'sev';

const hands = () => [...window.__sev.list].map((o) => { const p = o.body.getPosition(), a = o.ai;
  return { st: a.st, gait: a.gait, fd: a.fd, face: a.face, x: p.x * 100, y: p.y * 100, feet: a.feet ? Object.fromEntries(Object.entries(a.feet).map(([k, f]) => [k, { x: f.x, sw: f.sw }])) : null }; });
const kinds = () => { const k = {}; for (const o of window.__cards.objs) k[o.kind] = (k[o.kind] || 0) + 1; return k; };

// the world exists once something has been pulled: rip a card, then put everything back. Then scroll to the floor of the page
async function world(s) {
  const [px, py] = await s.rip(0);
  await s.run(200);
  await s.up();
  await s.eval(() => { if (window.__hand && window.__hand.reset) window.__hand.reset(); });   // Put the cards back leaves the hand alone: these scenarios want it gone
  await s.press('.reset-cards');
  await s.run(800);
  const bottom = await s.eval(() => document.documentElement.scrollHeight - innerHeight);
  await s.scrollTo(bottom);
  return s.eval(() => window.__cards.state().size);
}
const spawn = (s, x, y) => s.eval(([x, y]) => { window.__sev.spawn(x, y, 0.3, window.__sev.POSES.limp); }, [x, y]);

scenario(G, 'limp, rise, walk and turn', { rand: 0.5 }, async (s) => {
  const size = await world(s);
  await spawn(s, size.W / 2, size.H - 300);
  let h = (await s.eval(hands))[0];
  assert.equal(h.st, 'limp', 'it starts limp where it fell');
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'walk', null, { max: 6000 });
  h = (await s.eval(hands))[0];
  assert.equal(h.gait, 'crawl', 'freshly cut off, it drags itself along on two fingers');
  assert.ok(await s.said('SEV_SAY.cut'), 'it twitches and mutters');
  await s.run(1500);
  assert.ok(await s.said('SEV_SAY.drag'));
  // the hurt passes after 7.5 s: up on its fingers. Watch the feet and the facing for a while
  // (it turns by flipping a.fd in the walk behaviour; the edge-on turning animation only runs when a.dir changes, which walk never does)
  const seen = { fd: new Set(), slid: 0, planted: 0, gaits: new Set() };
  let prev = null;
  for (let i = 0; i < 260; i++) {
    await s.run(50, 50);
    const [q] = await s.eval(hands);
    seen.fd.add(q.fd); seen.gaits.add(q.gait);
    if (prev && prev.feet && q.feet && q.gait === prev.gait && q.fd === prev.fd) for (const k in q.feet) {
      if (prev.feet[k] && !prev.feet[k].sw && !q.feet[k].sw) { seen.planted++; if (Math.abs(prev.feet[k].x - q.feet[k].x) > 0.01) seen.slid++; }
    }
    prev = q;
  }
  assert.ok(seen.gaits.has('tiptoe') || seen.gaits.has('scuttle'), `it strolls once it is not hurt any more (${[...seen.gaits]})`);
  assert.equal(seen.fd.size, 2, 'it turned round');
  assert.ok(seen.planted > 50 && seen.slid === 0, `a planted foot never slides (${seen.slid} of ${seen.planted})`);
  assert.equal((await s.eval(hands))[0].st, 'walk');
});

scenario(G, 'held and crush', { legacy: false }, async (s) => {
  const size = await world(s);
  await spawn(s, size.W / 2, size.H - 300);
  await s.runUntil(() => { const o = window.__sev.list.values().next().value; return o.ai.st === 'walk' && performance.now() > o.ai.hurt; }, null, { max: 12000, step: 100 });
  // pick it up by its palm
  const sy = await s.scrollY();
  const [h] = await s.eval(hands);
  const at = [h.x, h.y - sy];
  await s.move(at[0], at[1]); await s.down();
  assert.equal((await s.eval(hands))[0].st, 'held', 'in your hand it wriggles');
  assert.ok(await s.said('SEV_SAY.held'));
  await s.line(at[0], at[1], at[0] - 150, at[1] - 200, 15);
  await s.run(2800);
  await s.up();
  assert.equal((await s.eval(hands))[0].st, 'limp', 'let go, it drops limp');
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'walk', null, { max: 5000 });
  // now a card for it: torn out at the top of the page and carried down next to it
  await s.scrollTo(0);
  const [px, py] = await s.rip(1);
  await s.run(300);
  const bottom = await s.scrollHolding();
  const [q] = await s.eval(hands);
  const tx = Math.max(200, Math.min(size.W - 200, q.x + (q.x < size.W / 2 ? 260 : -260)));
  await s.line(px, py, tx, 900 - 260, 20);
  await s.run(800);
  await s.up();
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'crush', null, { max: 15000, step: 100 });
  assert.ok(await s.said('SEV_SAY.hunt'), 'it has seen the card');
  assert.ok(await s.said('SAY.pull'), 'the card notices it has been caught');
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'gloat', null, { max: 5000 });
  assert.ok(!(await s.eval(kinds)).card, 'no card left');
  assert.ok(await s.said('SEV_SAY.crush'));
  assert.ok((await s.bubbles()).some((b) => b.key.startsWith('SAY.slice') && b.lvl === '2'), 'the card died screaming');
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'walk', null, { max: 3000 });
});

scenario(G, 'three-hand cap', { legacy: false }, async (s) => {
  const size = await world(s);
  for (let i = 0; i < 3; i++) await spawn(s, 300 + i * 300, size.H - 300);
  await s.run(500);
  const first = await s.eval(() => { window.__first = window.__sev.list.values().next().value; return window.__sev.list.size; });
  assert.equal(first, 3);
  await spawn(s, 1100, size.H - 300);
  const r = await s.eval(() => ({ n: window.__sev.list.size, gone: !window.__sev.list.has(window.__first) && !window.__cards.objs.has(window.__first), svgs: document.querySelectorAll('svg.claw.sev').length }));
  assert.deepEqual(r, { n: 3, gone: true, svgs: 6 }, 'three is a crowd: the oldest goes');
  await s.run(2000, 100);
  // spawned through the hook, they do not bring the reset button out: a card torn loose does
  await s.scrollTo(0);
  await s.rip(0);
  await s.up();
  await s.press('.reset-cards');
  assert.deepEqual(await s.eval(() => ({ n: window.__sev.list.size, svgs: document.querySelectorAll('svg.claw.sev').length })), { n: 3, svgs: 6 }, 'Put the cards back leaves them alone');
});

// ---- the new hand and the old one (src/actors/hand/old.js) ----
const claw = () => window.__cards.state().claw.st;
const sevSt = () => { const o = window.__sev.list.values().next().value; return o ? o.ai.st : null; };
// an old hand lying near the right edge, the arm lurking with a new hand of its own
async function oldHand(s) {
  const size = await world(s);
  await s.eval(() => window.__hand.set('lurk'));
  await spawn(s, size.W - 190, size.H - 200);
  return size;
}
// what the arm and the old hand look like, for a failure message
const why = (s) => s.eval(() => { const o = window.__sev.list.values().next().value, c = window.__cards.state().claw, p = o && o.body.getWorldCenter();
  return JSON.stringify({ claw: c && c.st, cool: c && Math.round(c.cool - performance.now()), grab: !!window.__cards.state().grab, vw: document.documentElement.clientWidth, vh: innerHeight, sy: scrollY,
    size: window.__cards.state().size, old: o && { st: o.ai.st, gait: o.ai.gait, hunting: o.ai.hunting, x: Math.round(p.x * 100 - scrollX), y: Math.round(p.y * 100 - scrollY) } }); });

scenario(G, 'the new hand meets the old one and eats it', { legacy: false }, async (s) => {
  await oldHand(s);
  await s.runUntil(() => window.__cards.state().claw.st === 'meet', null, { max: 6000, step: 100 }).catch(async (e) => { throw new Error(e.message + ' ' + await why(s)); });
  assert.ok(await s.said('hand.meet'), 'it leans out and looks');
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'stare', null, { max: 1000 });
  await s.run(1200);
  assert.ok(await s.said('sev.meet'), 'the old one stares back');
  // still hurt from the cut, it can only crawl: the new hand goes for it
  await s.runUntil(() => window.__cards.state().claw.st === 'devour', null, { max: 6000, step: 100 });
  assert.ok(await s.said('hand.devour'));
  assert.equal(await s.eval(sevSt), 'caught', 'it flails');
  assert.ok(await s.said('sev.doomed'));
  await s.runUntil(() => window.__sev.list.size === 0, null, { max: 8000, step: 100 });
  await s.run(800);
  assert.ok(await s.said('hand.devoured'), 'and eats it');
  assert.equal(await s.eval(() => document.getElementById('toast').textContent), 'It ate its old hand. Nothing goes to waste here.');
  assert.equal(await s.eval(claw), 'lurk');
  // full: a second old hand is met but left alone for a while
  const size = await s.eval(() => window.__cards.state().size);
  await spawn(s, size.W - 190, size.H - 200);
  await s.runUntil(() => window.__cards.state().claw.st === 'meet', null, { max: 5000, step: 100 });
  await s.run(5000, 100);
  assert.notEqual(await s.eval(claw), 'devour', 'still digesting');
});

scenario(G, 'you save the old hand from the new one', { legacy: false }, async (s) => {
  await oldHand(s);
  await s.runUntil(() => window.__cards.state().claw.st === 'devour' && !!window.__cards.state().claw.joint, null, { max: 12000, step: 100 }).catch(async (e) => { throw new Error(e.message + ' ' + await why(s)); });
  const sy = await s.scrollY();
  const [h] = await s.eval(hands);
  await s.move(h.x, h.y - sy); await s.down();
  await s.run(700);
  assert.equal(await s.eval(claw), 'sulk', 'it lets go');
  assert.ok(await s.said('hand.robbed'));
  assert.equal(await s.eval(sevSt), 'held');
  await s.line(h.x, h.y - sy, h.x - 500, h.y - sy - 100, 20);
  await s.up();
  await s.run(3000, 100);
  assert.equal(await s.eval(() => window.__sev.list.size), 1, 'saved');
});

// the hand tower: three old hands that met the new one, the arm lurking: they climb on each other at the right edge, the top
// one takes the arm by the wrist and they pull it out onto the page; it shakes them off and sulks, they land dizzy. Off while
// window.__test.idle === false (every other scenario), so this one turns it on. No golden: it is a long stretch of physics
const tw = () => { const T = window.__sev.tower(); return T && T.phase; };
const sts = () => [...window.__sev.list].map((o) => o.ai.st).join(' ');
async function tower(s) {
  const size = await world(s);
  await s.eval(() => { window.__test.idle = true; window.__hand.set('lurk'); });
  for (const fx of [0.3, 0.45, 0.6]) await spawn(s, size.W * fx, size.H - 200);
  await s.eval(() => { for (const o of window.__sev.list) { o.ai.met = true; o.ai.hurt = 0; } window.__hand.get().fullUntil = 1e12; });   // (and the arm is full: it eats none of them meanwhile)
  await s.eval(() => { window.__towerLog = []; window.__kiri.bus.on('sev.towerFell', ({ why }) => window.__towerLog.push(why)); window.__kiri.bus.on('sev.state', ({ from, to }) => (from === 'tower' || from === 'gather') && window.__towerLog.push(from + '>' + to)); });
  const fail = async (e) => { throw new Error(e.message + ' ' + await s.eval(sts) + ' ' + await s.eval(() => JSON.stringify([window.__towerLog, window.__sev.tower() && window.__sev.tower().hands.map((o) => [Math.round(o.body.getPosition().x * 100), o.ai.there, +(o.ai.stuck || 0).toFixed(2)])]))); };
  await s.runUntil(tw, null, { max: 80000, step: 100 }).catch(fail);
  assert.ok(await s.said('sev.towerCall'), 'they call each other over');
  await s.runUntil(() => window.__sev.tower() && window.__sev.tower().phase === 'reach', null, { max: 40000, step: 100 }).catch(fail);
  const ys = await s.eval(() => window.__sev.tower().hands.map((o) => o.body.getPosition().y * 100));
  assert.ok(ys[0] > ys[1] && ys[1] > ys[2], `stacked, the bottom one lowest (${ys.map(Math.round)})`);
  assert.equal(await s.eval(sts), 'tower tower tower');
  return size;
}

scenario(G, 'the hand tower pulls the arm out', { legacy: false, golden: false, timeout: 300000 }, async (s) => {
  await tower(s);
  await s.runUntil(() => window.__cards.state().claw.st === 'peer', null, { max: 20000, step: 100 });
  assert.ok(await s.said('hand.towerPeer'), 'the arm leans in to look');
  await s.runUntil(() => window.__cards.state().claw.st === 'pulled', null, { max: 8000, step: 100 });
  assert.ok(await s.said('sev.towerPull'), 'the top one has it: they pull');
  await s.run(2500, 100);
  const x = await s.eval(() => window.__cards.state().claw.x);
  const vw = await s.eval(() => document.documentElement.clientWidth);
  assert.ok(x < vw * 0.75, `dragged out onto the page (wrist at ${Math.round(x)} of ${vw})`);
  await s.runUntil(() => window.__cards.state().claw.st === 'sulk', null, { max: 8000, step: 100 });
  assert.ok(await s.said('hand.shakeOff'), 'it shakes them off');
  assert.equal(await s.eval(tw), null);
  await s.runUntil(() => [...window.__sev.list].every((o) => o.ai.st === 'dizzy'), null, { max: 6000, step: 100 });
  assert.ok(await s.said('hand.towerSulk'), 'and sulks');
});

scenario(G, 'picked off the hand tower, it comes down', { legacy: false, golden: false, timeout: 300000 }, async (s) => {
  await tower(s);
  const sy = await s.scrollY();
  const [x, y] = await s.eval(() => { const p = window.__sev.tower().hands[1].body.getPosition(); return [p.x * 100, p.y * 100]; });
  await s.move(x, y - sy); await s.down();
  await s.run(400);
  assert.equal(await s.eval(tw), null, 'the tower is down');
  assert.ok((await s.eval(sts)).includes('held'));
  assert.ok(!(await s.eval(sts)).includes('tower'));
  await s.up();
});
