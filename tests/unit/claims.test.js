import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClaims } from '../../src/core/claims.js';

test('claim, holder, release; claims stack (pointer and hand during the tug)', () => {
  const c = createClaims(), card = {};
  assert.equal(c.isFree(card), true); assert.equal(c.holder(card), null);
  const rel1 = c.claim(card, 'pointer', 'drag');
  assert.equal(c.holder(card), 'pointer'); assert.equal(c.isFree(card), false);
  const rel2 = c.claim(card, 'hand', 'tug');
  assert.equal(c.holder(card), 'hand');
  assert.deepEqual(c.holders(card), [{ owner: 'pointer', why: 'drag' }, { owner: 'hand', why: 'tug' }]);
  assert.ok(c.heldBy(card, 'pointer')); assert.ok(c.heldBy(card, 'hand', 'tug')); assert.ok(!c.heldBy(card, 'hand', 'crush'));
  rel1(); assert.equal(c.holder(card), 'hand');
  rel1(); assert.equal(c.holders(card).length, 1, 'release is idempotent');
  rel2(); assert.equal(c.isFree(card), true);
});

test('bodies are independent; clear drops everything', () => {
  const c = createClaims(), a = {}, b = {};
  c.claim(a, 'sev', 'squeeze'); c.claim(a, 'hand', 'target');
  assert.equal(c.isFree(b), true);
  c.clear(a); assert.equal(c.isFree(a), true);
});
