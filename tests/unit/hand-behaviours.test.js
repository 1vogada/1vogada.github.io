'use strict';
// The arm's behaviour table (src/actors/hand/behaviours): every legacy clawTick branch is one behaviour, they load in plain node,
// carry the flags the hand's tick reads in place of the legacy state-name tests, and no behaviour file asks for another
// behaviour's name (it may switch to one with set(name)). clawTick and clawBusy exist no more.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', '..', 'src', 'actors', 'hand');
const NAMES = ['off', 'lurk', 'reach', 'eager', 'lunge', 'snatch', 'catch', 'crush', 'gloat', 'tug', 'has', 'triumph', 'eat', 'show', 'stump', 'regrow', 'sulk', 'book'];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('every legacy branch is a behaviour, with the flags of the legacy state tests', async () => {
  for (const n of NAMES) await import(path.join(DIR, 'behaviours', n + '.js'));
  const { behaviours } = await import(path.join(DIR, '..', '..', 'core', 'machine.js'));
  const t = behaviours('hand');
  assert.deepEqual([...t.keys()].sort(), [...NAMES].sort());
  const having = (flag) => NAMES.filter((n) => t.get(n)[flag]).sort();
  assert.deepEqual(NAMES.filter((n) => t.get(n).busy).sort(), NAMES.filter((n) => n !== 'off' && n !== 'lurk').sort(), 'clawBusy: every state but off and lurk');
  assert.deepEqual(having('busyUntil'), ['lurk']);
  assert.deepEqual(having('calm'), ['lurk', 'off'], 'the lost-card check sulks unless off or lurk');
  assert.deepEqual(having('catches'), ['eager', 'gloat', 'lurk', 'sulk'], 'the catch scan');
  assert.deepEqual(having('idle'), ['lurk', 'sulk'], 'remarks and the flinch');
  assert.deepEqual(having('uncut'), ['book', 'off', 'regrow', 'show'], 'the sever check');
  assert.deepEqual(having('borrowed'), ['book']);
  assert.deepEqual(having('hold'), ['crush', 'has', 'tug'], 'the per-state post-chain');
  assert.equal(t.get('lunge').poseRate, 30);
  for (const n of NAMES) assert.equal(typeof t.get(n).tick, 'function', n);
});

test('no behaviour asks for a state by name; clawTick and clawBusy are gone', () => {
  for (const n of NAMES) {
    const src = strip(fs.readFileSync(path.join(DIR, 'behaviours', n + '.js'), 'utf8'));
    assert.doesNotMatch(src, /\.st\s*[!=]==|\.state\s*[!=]==|\bm\.is\(|\.is\(/, n + '.js tests a state name');
  }
  for (const f of ['index.js', 'tug.js']) assert.doesNotMatch(strip(fs.readFileSync(path.join(DIR, f), 'utf8')), /\bclawTick\b|\bclawBusy\b/);
});
