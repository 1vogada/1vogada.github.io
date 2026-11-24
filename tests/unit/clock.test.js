import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, GONE } from '../../src/core/clock.js';
import { createBus } from '../../src/core/bus.js';
import { fakeEnv } from './fake-env.js';

const make = () => { const f = fakeEnv(); const c = createClock(f.env, { bus: createBus() }); return { f, c }; };

test('now() is performance time minus time hidden, frozen while hidden (legacy now/hiddenAt/away)', () => {
  const { f, c } = make();
  assert.equal(c.now(), 1000);
  f.advance(500); assert.equal(c.now(), 1500);
  c.visibility(true); f.advance(4000);
  assert.equal(c.now(), 1500, 'frozen while hidden');
  assert.equal(c.hidden(), true);
  c.visibility(false);
  assert.equal(c.now(), 1500, 'the time away does not count');
  f.advance(100); assert.equal(c.now(), 1600);
  c.visibility(false); assert.equal(c.now(), 1600, 'a second "shown" changes nothing');
});

test('game timers pause while the tab is hidden and resume with the rest of their wait', () => {
  const { f, c } = make();
  const log = [];
  c.after(1000, () => log.push('a'));
  c.after(1000, () => log.push('b'));
  f.advance(600);
  c.visibility(true); f.advance(10000);
  assert.deepEqual(log, [], 'nothing fires while hidden');
  c.visibility(false);
  f.advance(399); assert.deepEqual(log, []);
  f.advance(1); assert.deepEqual(log, ['a', 'b'], 'same deadline: registration order');
});

test('cancel, every and sleep', async () => {
  const { f, c } = make();
  const log = [];
  const cancel = c.after(100, () => log.push('x'));
  cancel(); f.advance(200); assert.deepEqual(log, []);
  const stop = c.every(100, () => log.push('tick'));
  f.advance(350); assert.deepEqual(log, ['tick', 'tick', 'tick']);
  stop(); f.advance(500); assert.equal(log.length, 3);
  let done = false; const p = c.sleep(50).then(() => { done = true; });
  f.advance(50); await p; assert.equal(done, true);
});

test('real timers keep running while hidden', () => {
  const { f, c } = make();
  const log = [];
  c.real.after(100, () => log.push('wall'));
  c.after(100, () => log.push('game'));
  c.visibility(true); f.advance(200);
  assert.deepEqual(log, ['wall']);
});

test('cooldown', () => {
  const { f, c } = make();
  const cd = c.cooldown(2000);
  assert.equal(cd.ready(), true);
  cd.hit(); assert.equal(cd.ready(), false); assert.equal(cd.left(), 2000);
  f.advance(1500); assert.equal(cd.left(), 500);
  c.visibility(true); f.advance(5000); c.visibility(false);
  assert.equal(cd.ready(), false, 'hidden time does not cool it down');
  f.advance(500); assert.equal(cd.ready(), true);
});

test('scope: end() cancels its timers, rejects pending sleeps with GONE in order, runs onEnd', async () => {
  const { f, c } = make();
  const sc = c.scope('coin');
  const log = [];
  sc.after(100, () => log.push('timer'));
  sc.every(50, () => log.push('every'));
  const s1 = sc.sleep(1000).then(() => log.push('s1 ok'), (e) => log.push(e === GONE ? 's1 gone' : 's1 ?'));
  sc.onEnd(() => log.push('end cb'));
  const s2 = sc.sleep(2000).then(() => log.push('s2 ok'), (e) => log.push(e === GONE ? 's2 gone' : 's2 ?'));
  f.advance(60);
  assert.deepEqual(log, ['every']);
  sc.end();
  assert.equal(sc.ended, true);
  assert.deepEqual(log, ['every', 'end cb'], 'onEnd runs synchronously');
  await Promise.all([s1, s2]);
  assert.deepEqual(log, ['every', 'end cb', 's1 gone', 's2 gone']);
  f.advance(5000);
  assert.equal(log.length, 4, 'no timer of the scope fires after end');
  await assert.rejects(sc.sleep(10), (e) => e === GONE, 'sleep on an ended scope rejects at once');
  let late = false; sc.onEnd(() => { late = true; }); assert.equal(late, true, 'onEnd after end runs at once');
});

test('scope: bus listeners die with it; wall scopes run while hidden', () => {
  const f = fakeEnv(), bus = createBus(), c = createClock(f.env, { bus });
  const sc = c.scope('x'); const got = [];
  sc.on('card.cut', (e) => got.push(e));
  bus.emit('card.cut', 1); sc.end(); bus.emit('card.cut', 2);
  assert.deepEqual(got, [1]);
  const w = c.scope('w', { wall: true }); let fired = false;
  w.after(100, () => { fired = true; });
  c.visibility(true); f.advance(200);
  assert.equal(fired, true);
});

test('frame loop: phases in legacy order, fixed steps, stop when idle, wake restarts', () => {
  const { f, c } = make();
  const log = [];
  let work = true, busy = true;
  c.hasWork(() => work); c.keepAwake(() => busy);
  c.onDraw(() => log.push('draw.bubbles'), 'bubbles');
  c.onDraw((k) => log.push('draw.bodies'), 'bodies');
  c.onTick(() => log.push('severed'), 'severed');
  c.onTick(() => log.push('hand'), 'hand');
  c.onTick(() => log.push('blade'), 'blade');
  c.onTick(() => log.push('fx'), 'fx');
  c.onTick(() => log.push('input'), 'input');
  c.onStep(() => log.push('s.world'), 'world');
  c.onStep(() => log.push('s.pose'), 'pose');
  c.onStep(() => log.push('s.bodies'), 'bodies');
  c.wake();
  assert.equal(c.running(), true);
  f.frame(0);   // first frame: ms = 0, no step
  assert.deepEqual(log, ['input', 'fx', 'blade', 'hand', 'severed', 'draw.bodies', 'draw.bubbles']);
  log.length = 0;
  f.frame(1000 / 240 + 0.0001);   // one DT
  assert.deepEqual(log, ['input', 's.pose', 's.world', 's.bodies', 'fx', 'blade', 'hand', 'severed', 'draw.bodies', 'draw.bubbles']);
  log.length = 0;
  f.frame(10);   // 2 steps (10 ms = 2.4 DT)
  assert.equal(log.filter((x) => x === 's.world').length, 2);
  busy = false; log.length = 0;
  f.frame(16);
  assert.equal(c.running(), false, 'stops when nothing keeps it awake');
  assert.equal(f.pendingFrames(), 0);
  work = false; c.wake(); assert.equal(c.running(), false, 'no work: wake does nothing');
  work = true; busy = true; c.wake(); assert.equal(c.running(), true);
  f.frame(0); log.length = 0; f.frame(500);
  const n = log.filter((x) => x === 's.world').length;
  assert.ok(n >= 59 && n <= 60, 'a frame never simulates more than 250 ms (' + n + ' steps)');
});

test('frame loop: hidden tab stops stepping; shown again resumes from that frame', () => {
  const { f, c } = make();
  let steps = 0; c.hasWork(() => true); c.keepAwake(() => true); c.onStep(() => steps++, 'world');
  c.wake(); f.frame(0); f.frame(100);
  const before = steps;
  c.visibility(true); f.frame(100); f.frame(100);
  assert.equal(steps, before, 'no steps while hidden');
  c.visibility(false); f.frame(5000);
  assert.equal(steps, before, 'the first frame back starts the clock over (ms = 0)');
  f.frame(1000 / 240 + 0.001);
  assert.equal(steps, before + 1);
});

test('unknown phase throws', () => {
  const { c } = make();
  assert.throws(() => c.onStep(() => {}, 'nope'));
});
