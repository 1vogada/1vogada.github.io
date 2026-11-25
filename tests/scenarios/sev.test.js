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

// the old hand pokes you instead (idle-old): an old hand on the page, the arm lurking, the mouse still. The old hand walks over
// and jumps up to poke the cursor first; the arm comes out, finds the job taken ("MY job"), and they take turns, faster and
// faster, until you move. Off while window.__test.idle === false (every other scenario), so this one turns it on once the arm
// has met the old hand (rock, paper, scissors is off until then).
scenario(G, 'the old hand pokes you first, then they take turns', { legacy: false, timeout: 240000 }, async (s) => {
  const size = await world(s);
  await s.eval(() => window.__hand.set('lurk'));
  await spawn(s, size.W / 2, size.H - 200);
  await s.eval(() => { const o = window.__sev.list.values().next().value; o.ai.hurt = 0; window.__hand.get().fullUntil = 1e12; });   // awake, and the arm is full (it eats none meanwhile)
  await s.runUntil(() => window.__cards.state().claw.st === 'meet', null, { max: 8000, step: 100 });
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk' && window.__sev.list.values().next().value.ai.st === 'walk', null, { max: 12000, step: 100 });
  await s.eval(() => { window.__test.idle = true; window.__pl = [];
    const log = (who) => ({ hand: o, n }) => { const sv = window.__sev.list.values().next().value; window.__pl.push({ who, n, t: performance.now(), tip: who === 'sev' ? [...sv.hand.tip] : [...window.__cards.state().claw.tip] }); };
    window.__kiri.bus.on('sev.pestered', log('sev')); window.__kiri.bus.on('hand.pestered', log('hand')); });
  const vw = await s.eval(() => document.documentElement.clientWidth), vh = await s.eval(() => innerHeight);
  const C = [Math.round(vw * 0.42), Math.round(vh * 0.5)];
  await s.move(...C);
  const t0 = await s.now();
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st === 'pester', null, { max: 9000, step: 100 });
  assert.ok((await s.now()) - t0 > 6900, 'only once the mouse has been still a while');
  assert.ok(await s.said('sev.pester'), 'it goes to check on you');
  await s.runUntil(() => window.__pl.length > 0, null, { max: 8000, step: 50 });
  assert.equal(await s.eval(() => window.__cards.state().claw.st), 'lurk', 'the old hand got there first');
  assert.ok(await s.said('sev.pesterPoke'), 'boop');
  await s.runUntil(() => window.__cards.state().claw.st === 'mine', null, { max: 5000, step: 100 });
  await s.run(2500, 50);
  assert.ok(await s.said('hand.pesterMine'), "hey. that's MY job");
  await s.run(9000, 50);
  const pl = await s.eval(() => window.__pl);
  const turns = pl.filter((p, i) => i > 0 && p.who !== pl[i - 1].who).length;
  assert.ok(pl.length >= 8 && turns >= pl.length - 3, `they take turns (${pl.map((p) => p.who[0]).join('')})`);
  const gaps = pl.slice(1).map((p, i) => p.t - pl[i].t), late = gaps.slice(-3), early = gaps.slice(2, 5);
  assert.ok(late.reduce((a, b) => a + b) < early.reduce((a, b) => a + b) * 0.8, `faster and faster (${gaps.map(Math.round)})`);
  for (const p of pl.slice(-4)) assert.ok(Math.hypot(p.tip[0] - C[0], p.tip[1] - C[1]) < 25, `${p.who}'s fingertip is on the cursor (${p.tip.map(Math.round)})`);
  assert.ok(await s.said('sev.pesterRetort'), 'the old hand talks back');
  await s.move(C[0] + 40, C[1] + 20);
  await s.run(900, 50);
  assert.ok(await s.said('hand.pesterBack'), 'the arm is caught');
  assert.ok(await s.said('sev.pesterBack'), 'so is the old hand');
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 2000 });
  await s.runUntil(() => window.__sev.list.values().next().value.ai.st !== 'pester', null, { max: 2500 });   // it walks off
});

// crazy mode with old hands on the page: they dance, the arm bobs at the edge; picked up, one keeps dancing; crazy mode off: they
// freeze, look round and pretend nothing happened (src/actors/severed/dance.js, behaviours dance / jive / freeze, hand/bob.js)
scenario(G, 'old hands dance in crazy mode', { legacy: false, rand: 0.5 }, async (s) => {
  const size = await world(s);
  await spawn(s, size.W / 2 - 200, size.H - 300);
  await spawn(s, size.W / 2 + 200, size.H - 300);
  await s.run(1500);
  const sts = () => [...window.__sev.list].map((o) => o.ai.st).join(' ');
  const seen = () => { const css = (el) => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
    const hs = [...window.__sev.list], c = window.__hand.get();
    return { phys: getComputedStyle(document.getElementById('phys')).display, hands: hs.every((o) => css(o.hand.over) && css(o.el)), arm: css(c.over), x: c.x, vw: document.documentElement.clientWidth }; };
  assert.equal(await s.eval(sts), 'limp limp');
  // crazy mode on
  await s.press('#toggle');
  await s.press('#warn-yes');
  await s.run(600);
  assert.equal(await s.eval(sts), 'dance dance', 'every old hand stops and dances');
  assert.ok(await s.said('sev.dance'), 'and says so');
  let v = await s.eval(seen);
  assert.ok(v.phys !== 'none' && v.hands && v.arm, `crazy mode does not hide them (${JSON.stringify(v)})`);
  await s.run(1600, 50);
  v = await s.eval(seen);
  assert.ok(v.x < v.vw && v.x > v.vw - 140, `the arm bobs just inside the right edge (${Math.round(v.x)} of ${v.vw})`);
  assert.ok(await s.said('hand.bob'), 'pretending it is not dancing');
  // on the beat: the feet step and the moves change
  const beats = new Set(), steps = new Set();
  for (let i = 0; i < 30; i++) {
    await s.run(60, 30);
    const [b, sw] = await s.eval(() => { const o = window.__sev.list.values().next().value; return [o.ai.beat, o.ai.feet ? Object.values(o.ai.feet).filter((f) => f.sw).length : 0]; });
    beats.add(b); if (sw) steps.add(b);
  }
  assert.ok(beats.size >= 3 && steps.size >= 2, `it steps to the beat (${beats.size} beats, a foot up on ${steps.size})`);
  // pick one up mid-dance
  const bottom = await s.eval(() => document.documentElement.scrollHeight - innerHeight);
  await s.scrollTo(bottom);
  const sy = await s.scrollY();
  const [x, y] = await s.eval(() => { const p = window.__sev.list.values().next().value.body.getPosition(); return [p.x * 100, p.y * 100]; });
  await s.move(x, y - sy); await s.down();
  assert.equal(await s.eval(sts), 'jive dance', 'in your hand it keeps dancing');
  assert.ok(await s.said('sev.jive'), '"don\'t stop the music"');
  await s.line(x, y - sy, x - 60, y - sy - 120, 10);
  await s.run(1500);
  assert.equal(await s.eval(sts), 'jive dance');
  await s.up();
  await s.runUntil(() => [...window.__sev.list].every((o) => o.ai.st === 'dance'), null, { max: 4000, step: 50 });
  // crazy mode off
  await s.press('#toggle');
  assert.equal(await s.eval(sts), 'freeze freeze', 'the music stops: they freeze');
  assert.ok(await s.said('sev.freeze'));
  v = await s.eval(seen);
  assert.equal(await s.eval(() => document.getElementById('phys').style.display), '', 'the inline overrides are gone');
  await s.runUntil(() => [...window.__sev.list].every((o) => o.ai.st === 'walk'), null, { max: 6000, step: 50 });
  assert.ok(await s.said('sev.pretend'), 'and pretend nothing happened');
});

// the uprising (src/page/uprising.js): revenge, the hand tower pulling the arm out, an old hand sewn back on, in that order,
// end in a truce. Driven with hooks: two old hands spawned, revenge as its event ('sev.avenged': the arm's hand comes off and
// is the third), the tower's grab as its event (the arm leaning in, 'sev.towerGrab'; the tower itself has its own scenarios).
// Pulled out, it shakes so hard its own hand flies off; the stump lies on the page; an old hand dropped on it goes back on;
// back at the edge: "fine. truce.", a toast, and from then on a card held out to it is left alone
const armSt = () => { const c = window.__cards.state().claw; return c && { st: c.st, x: c.x, y: c.y, a: c.a, stump: !!c.stump }; };
scenario(G, 'the uprising ends in a truce', { legacy: false, timeout: 240000 }, async (s) => {
  const size = await world(s);
  await s.eval(() => { window.__hand.set('lurk'); window.__hand.get().fullUntil = 1e12; });   // (full: it eats none of them meanwhile)
  for (const fx of [0.3, 0.45]) await spawn(s, size.W * fx, size.H - 200);
  await s.run(1500);
  assert.equal(await s.eval(() => window.__uprising.stage()), '');
  // revenge: the new hand comes off, a third old hand
  await s.eval(() => window.__kiri.bus.emit('sev.avenged', { hand: window.__sev.list.values().next().value }));
  assert.equal(await s.eval(() => window.__uprising.stage()), 'revenge');
  assert.equal((await s.eval(armSt)).st, 'stump');
  assert.equal(await s.eval(() => window.__sev.list.size), 3, 'three old hands');
  await s.run(1500);
  assert.ok(await s.said('sev.uprising'), 'an old hand cheers');
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 16000, step: 100 });   // a new hand grows
  // the tower is up: the arm leans in to look, and the top one has it by the wrist
  await s.eval(([x, y]) => { window.__hand.get().tower = { x, y }; window.__hand.set('peer'); }, [size.W - 120, size.H - 330]);
  await s.run(1500);
  await s.eval(() => window.__kiri.bus.emit('sev.towerGrab', { hand: null, hands: [] }));
  assert.equal((await s.eval(armSt)).st, 'pulled');
  assert.equal(await s.eval(() => window.__uprising.stage()), 'tower');
  await s.runUntil(() => window.__cards.state().claw.st === 'spent', null, { max: 8000, step: 100 });
  assert.ok(await s.said('hand.shakeOff'), 'it shakes them off');
  assert.ok(await s.said('hand.flewOff'), 'and its own hand flies off too');
  let c = await s.eval(armSt);
  const vw = await s.eval(() => document.documentElement.clientWidth);
  assert.ok(c.stump && c.x < vw * 0.75, `a stump, out on the page (wrist at ${Math.round(c.x)} of ${vw})`);
  await s.run(1800);
  assert.ok(await s.said('hand.spent'), 'it asks for a hand');
  // carry an old hand over and let go of it on the stump
  const sy = await s.scrollY();
  const o = await s.eval(() => { const ps = [...window.__sev.list].map((q) => q.body.getWorldCenter()); ps.sort((a, b) => a.x - b.x); return [ps[0].x * 100, ps[0].y * 100]; });
  await s.move(o[0], o[1] - sy); await s.down();
  c = await s.eval(armSt);
  await s.line(o[0], o[1] - sy, c.x - 60, c.y + 20, 25);
  for (let k = 0; k < 6; k++) {   // follow its stump as it lifts towards the hand
    c = await s.eval(armSt);
    await s.move(c.x + 35 * Math.cos(c.a), c.y + 35 * Math.sin(c.a)); await s.run(150);
  }
  await s.up();
  await s.runUntil(() => window.__cards.state().claw.st === 'sew', null, { max: 1000, step: 16 });
  assert.ok(await s.said('sev.home'), 'it goes back on');
  await s.runUntil(() => window.__cards.state().claw.st === 'sewn', null, { max: 4000, step: 100 });
  assert.equal(await s.eval(() => window.__uprising.stage()), 'sewn');
  assert.equal(await s.eval(() => window.__sev.list.size), 2);
  // back at the edge: truce
  await s.runUntil(() => window.__uprising.stage() === 'truce', null, { max: 8000, step: 100 });
  assert.ok(await s.said('hand.truce'), '"fine. truce."');
  const toast = await s.eval(() => document.getElementById('toast').textContent);
  assert.ok(await s.eval((t) => window.__kiri.lines.list('toast.truce').includes(t), toast), `the toast to match (${toast})`);
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 6000, step: 100 });
  // a card held out to it, close to the edge, for a long while: it does not take it
  await s.scrollTo(0);
  const sts0 = new Set();
  const [px, py] = await s.rip(0);
  await s.run(300);
  await s.line(px, py, vw - 120, 400, 30);
  for (let k = 0; k < 40; k++) { await s.run(200, 50); sts0.add((await s.eval(armSt)).st); }
  assert.ok(![...sts0].some((x) => ['eager', 'lunge', 'snatch', 'tug', 'has'].includes(x)), `no snatching (${[...sts0]})`);
  assert.ok(await s.said('hand.tempted'), 'it looks, and leaves it');
  assert.equal(await s.eval(() => window.__cards.state().claw.o), null);
  await s.up();
});

// ...and with the real tower: after a revenge, the tower's pull ends with the arm's own hand flying off, a stump on the page,
// the three in a heap (no golden: a long stretch of physics, like the tower's own scenarios)
scenario(G, 'the uprising: after a revenge, the tower pulls its hand off', { legacy: false, golden: false, timeout: 300000 }, async (s) => {
  await tower(s);
  await s.eval(() => window.__uprising.set('revenge'));   // (revenge happened earlier this visit)
  await s.runUntil(() => window.__cards.state().claw.st === 'pulled', null, { max: 25000, step: 100 });
  assert.equal(await s.eval(() => window.__uprising.stage()), 'tower');
  await s.runUntil(() => window.__cards.state().claw.st === 'spent', null, { max: 9000, step: 100 });
  assert.ok(await s.said('hand.flewOff'), 'its own hand flies off');
  assert.equal(await s.eval(tw), null, 'the tower is down');
  assert.ok(await s.eval(() => window.__cards.state().claw.stump), 'a stump');
  await s.runUntil(() => [...window.__sev.list].every((o) => o.ai.st === 'dizzy'), null, { max: 6000, step: 100 });
  assert.ok(!(await s.said('hand.towerSulk')), 'no sulking off: it lies there');
  // nobody brings it a hand: it slinks home a plain stump, and a new one grows
  await s.runUntil(() => window.__cards.state().claw.st === 'stump', null, { max: 13000, step: 100 });
  await s.runUntil(() => window.__cards.state().claw.st === 'regrow', null, { max: 10000, step: 100 });
});
