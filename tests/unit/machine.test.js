import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defineBehaviour, machine, behaviours } from '../../src/core/machine.js';
import { createBus } from '../../src/core/bus.js';

let n = 0;
const actor = () => 'test' + (++n);   // a fresh table per test

test('set(): leave of the old, then enter of the new; t restarts; data; state event after enter', () => {
  const A = actor(), log = [], bus = createBus();
  defineBehaviour(A, 'idle', { pose: 'rest', busy: false, enter: (s, m) => log.push('enter idle'), leave: (s, m) => log.push('leave idle'), tick: (s, m, dt) => log.push('tick idle ' + m.t) });
  defineBehaviour(A, 'walk', { pose: 'walk', up: true, enter: (s, m) => log.push('enter walk ' + m.t + ' ' + m.data), leave: () => log.push('leave walk') });
  bus.on('*', (e, type) => log.push(type + ' ' + e.from + '>' + e.to));
  const self = {};
  const m = machine(A, self, 'idle', { bus, switched: (s, m) => { s.up = !!m.def.up; log.push('switched ' + m.state); }, entered: () => log.push('entered') });
  assert.deepEqual(log, ['switched idle', 'enter idle', A + '.state null>idle'], 'initial: no leave, no entered()');
  assert.equal(m.busy, false); assert.equal(m.def.pose, 'rest');
  log.length = 0;
  m.tick(0.5); m.tick(0.25);
  assert.deepEqual(log, ['tick idle 0.5', 'tick idle 0.75']);
  log.length = 0;
  m.set('walk', 'fast');
  assert.deepEqual(log, ['leave idle', 'switched walk', 'enter walk 0 fast', 'entered', A + '.state idle>walk']);
  assert.equal(m.t, 0); assert.equal(self.up, true); assert.equal(m.busy, true, 'busy defaults to true');
  assert.ok(m.is('walk', 'idle')); assert.ok(!m.is('idle'));
  assert.equal(behaviours(A).size, 2);
});

test('age and step are separate (legacy sevTick: age, a held check, then tick)', () => {
  const A = actor(), seen = [];
  defineBehaviour(A, 'a', { tick: (s, m) => seen.push(['a', m.t]) });
  defineBehaviour(A, 'held', { tick: (s, m) => seen.push(['held', m.t]) });
  const m = machine(A, {}, 'a', { bus: createBus() });
  m.age(1); m.set('held'); m.step(1);
  assert.deepEqual(seen, [['held', 0]]);
});

test('a switch inside tick or enter: the inner state wins and only it emits', () => {
  const A = actor(), bus = createBus(), ev = [];
  defineBehaviour(A, 'a', { tick: (s, m) => m.set('b') });
  defineBehaviour(A, 'b', { enter: (s, m) => m.set('c') });
  defineBehaviour(A, 'c', {});
  bus.on(A + '.state', (e) => ev.push(e.from + '>' + e.to));
  const m = machine(A, {}, 'a', { bus });
  m.tick(0.1);
  assert.equal(m.state, 'c');
  assert.deepEqual(ev, ['null>a', 'b>c']);
});

test('`on` handlers run only while their state is current', () => {
  const A = actor(), bus = createBus(), log = [];
  defineBehaviour(A, 'rest', { on: { 'card.cut': (s, e, m) => log.push('rest saw ' + e.n) } });
  defineBehaviour(A, 'walk', { on: { 'card.cut': (s, e, m) => { log.push('walk saw ' + e.n); m.set('rest'); }, 'card.smashed': () => log.push('smash') } });
  const m = machine(A, {}, 'rest', { bus });
  bus.emit('card.cut', { n: 1 });
  m.set('walk');
  bus.emit('card.cut', { n: 2 });   // walk handles it and switches to rest: rest's new handler must not see the same event
  bus.emit('card.smashed', {});
  bus.emit('card.cut', { n: 3 });
  m.end();
  bus.emit('card.cut', { n: 4 });
  assert.deepEqual(log, ['rest saw 1', 'walk saw 2', 'rest saw 3']);
});

test('end() runs leave once; unknown and duplicate behaviours throw', () => {
  const A = actor(), log = [];
  defineBehaviour(A, 'x', { leave: () => log.push('leave') });
  const m = machine(A, {}, 'x', { bus: createBus() });
  m.end(); m.end();
  assert.deepEqual(log, ['leave']);
  assert.throws(() => m.set('nope'));
  assert.throws(() => defineBehaviour(A, 'x', {}), /twice/);
  assert.throws(() => machine(actor(), {}, 'x'));
});
