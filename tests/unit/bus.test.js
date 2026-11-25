import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../../src/core/bus.js';
import { EVENTS } from '../../src/core/events.js';

test('listeners run synchronously, in registration order, exact and wildcard interleaved', () => {
  const bus = createBus(), log = [];
  bus.on('card.cut', () => log.push(1));
  bus.on('card.*', (e, type) => log.push('w:' + type));
  bus.on('*', () => log.push('all'));
  bus.on('card.cut', (e) => log.push(e.n));
  bus.on('hand.state', () => log.push('nope'));
  bus.emit('card.cut', { n: 4 });
  log.push('after');
  assert.deepEqual(log, [1, 'w:card.cut', 'all', 4, 'after']);
});

test('off, once, and changes during an emit', () => {
  const bus = createBus(), log = [];
  const off = bus.on('card.cut', () => log.push('a'));
  bus.once('card.cut', () => log.push('once'));
  let offB = null;
  bus.on('card.cut', () => { log.push('b'); offB && offB(); bus.on('card.cut', () => log.push('late')); });
  offB = bus.on('card.cut', () => log.push('removed before it ran'));
  bus.emit('card.cut');
  assert.deepEqual(log, ['a', 'once', 'b']);
  log.length = 0; off(); off();
  bus.emit('card.cut');
  assert.deepEqual(log, ['b', 'late']);
});

test('nested emits are synchronous too', () => {
  const bus = createBus(), log = [];
  bus.on('card.ripped', () => { log.push('ripped'); bus.emit('card.smashed'); log.push('ripped end'); });
  bus.on('card.smashed', () => log.push('smashed'));
  bus.emit('card.ripped');
  assert.deepEqual(log, ['ripped', 'smashed', 'ripped end']);
});

test('strict: an unknown type throws, a catalogued one does not; wildcards are fine', () => {
  const bus = createBus({ strict: true });
  assert.throws(() => bus.emit('card.exploded'), /unknown event/);
  assert.throws(() => bus.on('nope.nope', () => {}), /unknown event/);
  assert.doesNotThrow(() => bus.on('card.*', () => {}));
  for (const type of Object.keys(EVENTS)) assert.doesNotThrow(() => bus.emit(type, {}));
  const loose = createBus();
  assert.doesNotThrow(() => loose.emit('anything.goes'));
});

test('tap sees every emit first', () => {
  const bus = createBus(), log = [];
  bus.on('card.cut', () => log.push('listener'));
  bus.tap((type) => log.push('tap ' + type));
  bus.emit('card.cut');
  assert.deepEqual(log, ['tap card.cut', 'listener']);
});
