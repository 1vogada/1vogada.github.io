'use strict';
// LEGACY COMPARISON: delete together with scripts/legacy.js, scripts/lang.js and scripts/phrasebook.js. It only compares the
// old script with the modules; nothing in npm test, tests/unit/*.test.js or CI depends on it.
// The arm's 'show' (Surprise me drives it: come, to, say, leave) and 'book' (the phrasebook raid writes c.st = 'book', later
// c.st = 'off' and set('lurk')) states, which no arm scenario reaches while the scenes and the phrasebook are other packages.
// The same script runs on legacy and on ?next (frozen clock, seeded Math.random) and writes its trace: the states with their
// times, the hand's lines with their times and texts, and the claw's x, y, a and pose every 100 ms. Compare the two files:
//   OUT=/tmp/legacy.json LEGACY=1 node --test tests/unit/hand-show-book.screens.js
//   OUT=/tmp/next.json node --test tests/unit/hand-show-book.screens.js
//   diff /tmp/legacy.json /tmp/next.json       (no output: the same)
const fs = require('node:fs');
const { scenario } = require('../helpers/harness');

const claw = () => { const c = window.__cards.state().claw; return c && { st: c.st, x: +c.x.toFixed(3), y: +c.y.toFixed(3), a: +c.a.toFixed(4), curl: +c.pose.curl.toFixed(4), point: +(c.pose.point || 0).toFixed(4), stump: !!c.stump }; };

scenario('hand', 'show and book', { idle: 3000, golden: false }, async (s) => {
  const samples = [];
  const watch = async (ms) => { for (let t = 0; t < ms; t += 100) { await s.run(100); samples.push([await s.now(), await s.eval(claw)]); } };
  await s.ensurePlanck();
  await s.eval(() => window.__hand.come(800, 400, 'point'));
  await watch(1500);
  await s.eval(() => window.__hand.to({ x: 600, y: 300, pose: 'eager', rate: 9 }));
  samples.push(['say ask', await s.eval(() => window.__hand.say('ask'))]);
  await watch(1000);
  samples.push(['say flip', await s.eval(() => window.__hand.say('flip'))]);   // held back: the last line has not been up gap.show
  await s.eval(() => window.__hand.to({ tip: true, x: 500, y: 520, pose: 'point', bob: false }));
  await watch(800);
  samples.push(['grip', await s.eval(() => window.__hand.grip().map((v) => +v.toFixed(3)))]);
  await s.eval(() => window.__hand.leave());
  await watch(2500);                                                            // sulk, then lurk
  // the phrasebook borrows it the way the legacy raid did, holds it, and gives it back
  await s.eval(() => { const c = window.__hand.get(); c.st = 'book'; c.x = 900; c.pose = { ...window.__hand.POSES.joy }; window.__hand.draw(0, 0, 0); });
  await watch(1000);                                                            // its tick leaves it alone
  await s.eval(() => { const c = window.__hand.get(); c.x = document.documentElement.clientWidth + 340; c.pose = { ...window.__hand.POSES.lurk }; c.a = Math.PI; window.__hand.draw(0, 0, 0); c.st = 'off'; window.__hand.set('lurk'); });
  await watch(2000);
  const b = (await s.bubbles()).filter((q) => q.who === 'hand').map((q) => [q.t, q.ms, q.key, q.text]);
  await s.collect();
  const states = []; let last = null;
  for (const st of s.trace.states) if (st.claw !== last) { states.push([st.t, st.claw]); last = st.claw; }
  const out = { states, bubbles: b, samples, rng: await s.eval(() => window.__rng.calls) };
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1) + '\n');
});
