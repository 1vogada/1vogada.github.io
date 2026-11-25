// Recorded results for the parity tests (cut geometry, hand drawing, gait): what the old script computed for each case,
// captured once from scripts/legacy.js while it still existed, kept in tests/unit/fixtures/<name>.json. A test computes the
// same cases with the modules and checks each against its recording, so the comparison stands without the old script.
//
//   const rec = recording('hand-draw.draw');      // tests/unit/fixtures/hand-draw.draw.json
//   rec.check('case 12', value, 'message');        // value: anything JSON can hold
//   rec.done();                                    // every recorded case was checked (and, when updating, write the file)
//
// A small value is kept as it is (readable in a diff); a large one as a sha256 of its canonical JSON (keys sorted), so a
// difference names the case but not the detail: run the case and look. An intended change of behaviour: run the test with
// UPDATE_SNAPSHOT=1 (rewrites the file from the modules) and commit it with a word on why.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UPDATE = process.env.UPDATE_SNAPSHOT === '1';
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x));

/** @param {string} name  fixture file name without .json; @param {{ full?: number }} opts  values up to `full` chars of JSON are kept whole */
export function recording(name, { full = 300 } = {}) {
  const file = new URL(`./fixtures/${name}.json`, import.meta.url);
  let want = null;
  if (!UPDATE) {
    try { want = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { assert.fail(`no recording tests/unit/fixtures/${name}.json (${e.message}); UPDATE_SNAPSHOT=1 writes it from the modules`); }
  }
  const got = {};
  return {
    check(id, value, msg = id) {
      const c = canon(value);
      const entry = c === undefined ? null : c.length <= full ? JSON.parse(c) : 'sha256:' + createHash('sha256').update(c).digest('hex').slice(0, 24);
      assert.ok(!(id in got), `${name}: case ${id} checked twice`);
      got[id] = entry;
      if (UPDATE) return;
      assert.ok(id in want, `${name}: no recorded result for ${id}`);
      if (typeof want[id] === 'string' && want[id].startsWith('sha256:')) assert.equal(entry, want[id], `${msg}: differs from the recorded result (${name}.json)`);
      else assert.deepEqual(entry, want[id], `${msg}: differs from the recorded result (${name}.json)`);
    },
    done() {
      if (UPDATE) { mkdirSync(new URL('./fixtures/', import.meta.url), { recursive: true }); writeFileSync(file, '{\n' + Object.entries(got).map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n') + '\n}\n'); return; }
      assert.deepEqual(Object.keys(got), Object.keys(want), `${name}: the same cases as recorded`);
    },
  };
}
