// The only file that touches window.__*. Test hooks and the debug switches.
//
// window.__kiri = { bus, clock, world, hand, severed, shelf, lines, phrasebook } (live getters into the app)
// Legacy hook names, same shapes, so one Playwright suite drives old and new:
//   __timing   TIMING (core/tune.js)                     set here
//   __pick     pick (core/lines.js, shared memory)       set here
//   __lines    lines.legacy(): { SAY, CLAW_SAY, AGONY, BEG, PANIC, NOTME, SEV_SAY } built from the registered arrays   set here
//   __cards    { objs, S, bits, state() }                world/world.js calls hook('__cards', ...)
//   __hand     { get, draw, set, POSES, katanaSvg, come, to, say, grip, leave }   actors/hand/index.js
//   __sev      { list, SEV, POSES, set, spawn, say, cut }                        actors/severed/index.js
//   __shelf    () => toggle                                                       actors/shelf.js
//   __phrasebook { open, close, raid, next, state, el }                           phrasebook/menu.js
// ?debug           strict bus (unknown event types throw)
// ?debug=events    strict bus, and every emit is logged to the console
// (?debug=zones and ?dbg are read by their own features through flags() below.)

import { bus } from './bus.js';
import { clock } from './clock.js';
import { lines } from './lines.js';
import { TIMING } from './tune.js';

const hooks = new Map();
let published = false;

const search = () => (typeof location === 'undefined' ? '' : location.search);
/** the debug switches in the URL: { debug: Set of values (?debug=events,zones), dbg: legacy ?dbg } */
export function flags() {
  const s = search(), set = new Set();
  for (const m of s.matchAll(/[?&]debug(?:=([^&]*))?/g)) { set.add(''); if (m[1]) for (const v of decodeURIComponent(m[1]).split(',')) set.add(v); }
  return { debug: set, on: set.size > 0, events: set.has('events'), zones: set.has('zones'), dbg: s === '?dbg' };
}

/** publish a legacy test hook (window.__name). Safe to call before or after install */
export function hook(name, value) {
  if (!/^__[a-z]+$/.test(name)) throw new Error('debug.hook: legacy hook names look like __cards');
  hooks.set(name, value);
  if (published && typeof window !== 'undefined') window[name] = value;
}

export function install(app = {}) {
  if (typeof window === 'undefined' || published) return;
  const f = flags();
  if (f.on) bus.strict = true;
  if (f.events) bus.tap((type, payload) => console.log('[bus]', type, payload));   // eslint-disable-line no-console
  published = true;
  const live = (name) => ({ get: () => app[name], enumerable: true });
  window.__kiri = Object.defineProperties({ bus, clock, lines }, { world: live('world'), hand: live('hand'), severed: live('severed'), shelf: live('shelf'), phrasebook: live('phrasebook') });
  window.__timing = TIMING;
  window.__pick = lines.pick;
  window.__lines = lines.legacy();
  for (const [name, v] of hooks) window[name] = v;
}
