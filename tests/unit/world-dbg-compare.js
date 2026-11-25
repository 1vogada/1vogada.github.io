'use strict';
// Not a unit test (no .test.js suffix: `node --test tests/unit/*.test.js` skips it). Package W1's parity check of the world:
// the same scripted throw (seed 1, frozen clock, the harness's pointer) on legacy and on ?next, with the ?dbg logging on,
// and the logged release speed and impact (contact closing) speeds compared. They must match within 2 %.
//
//   node tests/unit/world-dbg-compare.js            (runs the legacy page, then the ?next page, and prints both)
//
// Legacy turns the logging on with exactly `?dbg` in the URL (location.search === '?dbg', so `?dbg&next` does not); the new code
// reads the same flag (core/debug.js flags().dbg) into world.dbg, which this script switches on through window.__kiri after load.
// The ?next run needs the cards actor (startPull / tear) and the card lines; until those packages land it needs a shim.
// Only the release and the first (hot) impact are compared: later contacts are of shards, whose break-up draws Math.random,
// and the hand (when present) draws in between.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

if (process.env.W1_CHILD) {
  const { scenario, NEXT } = require('../helpers/harness');
  scenario('world', 'dbg throw ' + (NEXT ? 'next' : 'legacy'), { query: '?dbg', golden: false }, async (s) => {
    const logs = [];
    s.page.on('console', (m) => { const t = m.text(); if (/^(release speed|contact closing)/.test(t)) logs.push(t); });
    if (NEXT) await s.eval(() => { window.__kiri.world.world.dbg = true; });
    const [px, py] = await s.rip(0);
    await s.run(800);
    await s.throwTo([px, py], [px - 40 * 4, py], { n: 4 });   // 25 m/s into the left wall (the smash scenario's throw)
    await s.run(400);
    console.log('W1RESULT ' + JSON.stringify(logs));
  });
} else {
  const run = (next) => {
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', __filename], { env: { ...process.env, W1_CHILD: '1', NEXT: next ? '1' : '0', ONLY: 'dbg throw' }, encoding: 'utf8', cwd: path.resolve(__dirname, '..', '..') });
    const m = /W1RESULT (.*)/.exec(r.stdout + r.stderr);
    if (!m) { console.error(r.stdout, r.stderr); throw new Error('no result from the ' + (next ? '?next' : 'legacy') + ' run'); }
    return JSON.parse(m[1]);
  };
  const num = (s) => parseFloat(s.split(' ')[2]);   // 'release speed 25.0' | 'contact closing 24.9 hot true false'
  const old = run(false), neu = run(true);
  const pick = (logs) => ({ release: logs.filter((l) => l.startsWith('release')).map(num), impacts: logs.filter((l) => l.startsWith('contact') && / hot true| true$/.test(l)).map(num), all: logs });
  const a = pick(old), b = pick(neu);
  console.log('legacy:', JSON.stringify({ release: a.release, hotImpacts: a.impacts }));
  console.log('?next: ', JSON.stringify({ release: b.release, hotImpacts: b.impacts }));
  const rel = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), 1e-9);
  let ok = a.release.length > 0 && a.release.length === b.release.length && a.impacts.length > 0;
  const n = Math.min(a.impacts.length, b.impacts.length);
  for (let i = 0; i < a.release.length && ok; i++) { const d = rel(a.release[i], b.release[i]); console.log(`release ${i}: ${a.release[i]} vs ${b.release[i]} (${(d * 100).toFixed(2)} %)`); if (d > 0.02) ok = false; }
  for (let i = 0; i < n; i++) { const d = rel(a.impacts[i], b.impacts[i]); console.log(`hot impact ${i}: ${a.impacts[i]} vs ${b.impacts[i]} (${(d * 100).toFixed(2)} %)`); if (i === 0 && d > 0.02) ok = false; }
  let same = 0; while (same < a.all.length && a.all[same] === b.all[same]) same++;
  console.log(`logged lines: legacy ${a.all.length}, next ${b.all.length}; the first ${same} are identical`);
  console.log('legacy log:', JSON.stringify(a.all)); console.log('next log:  ', JSON.stringify(b.all));
  console.log(ok ? 'OK: within 2 %' : 'FAIL');
  process.exit(ok ? 0 : 1);
}
