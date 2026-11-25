// Crazy mode with old hands on the page: they dance (src/reactions.js, mode.changed -> groove(crazy)).
// groove(true): every old hand that is up to it (TUNE.dance.FROM) stops and dances on the spot (behaviours/dance.js), and any
// that gets there later joins in (danceTick, once a frame from tick() in ./index.js). Picked up mid-dance it keeps going in your
// hand (behaviours/jive.js, the dance's heldAs). groove(false): the dancers freeze, look round and pretend nothing happened
// (behaviours/freeze.js), then walk on.
// Crazy mode's stylesheet hides the claw and #phys (styles/crazy.css, pinned by tests/unit/styles-split.test.js), so while they
// dance show() overrides it with inline styles only: #phys is displayed but invisible (visibility: hidden, so the loose cards
// stay out of sight and out of reach), and only the old hands' hit boxes, their drawings and the hands' bubbles (.claw-say) are
// made visible again. Everything is put back the moment crazy mode ends or the last old hand is gone.
// The beat: one every TUNE.dance.BEAT_TICKS steps of the scrolling tab title (TUNE.crazy.TITLE_MS), on game time, the same for
// every hand (and for the arm, src/actors/hand/bob.js), so they all keep time.
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { clock } from '../../core/clock.js';
import { world, isHeld, isCrazy } from '../../world/world.js';
import { list, brain } from './index.js';

const D = TUNE.dance, BEAT_MS = TUNE.crazy.TITLE_MS * D.BEAT_TICKS;
let on = false, shown = false;

/** the beat at game ms t: { n: which beat, u: 0..1 through it } */
export function beat(t) { const b = t / BEAT_MS, n = Math.floor(b); return { n, u: b - n }; }
/** the music is playing: crazy mode, and groove(true) */
export const grooving = () => on && isCrazy();

/** up for a dance: one of D.FROM, nobody holding it; a limp one only once it lies still */
function ready(o, m) {
  if (!world.bodies.has(o) || isHeld(o) || !m.is(...D.FROM)) return false;
  return !m.is('limp') || o.body.getLinearVelocity().length() < D.STILL_V;
}

/** the music starts (true) or stops (false). @returns how many old hands it set dancing, or froze */
export function groove(v) {
  on = !!v; let n = 0;
  for (const o of [...list]) {
    const m = brain(o); if (!m) continue;
    if (on && isCrazy() && ready(o, m)) { m.set('dance'); n++; }
    else if (!on && m.is('dance', 'jive')) { m.set('freeze'); n++; }
  }
  show();
  clock.wake();
  return n;
}

/** once a frame (./index.js tick): late arrivals join the dance, and the inline overrides follow */
export function danceTick() {
  if (grooving()) for (const o of [...list]) { const m = brain(o); if (m && ready(o, m)) m.set('dance'); }
  show();
}

/** crazy mode's hiding rules undone for the old hands, with inline styles (see the top of this file) */
function show() {
  const L = world.layer; if (!L) return;
  const want = grooving() && list.size > 0;
  if (want !== shown) { shown = want; L.style.display = want ? 'block' : ''; L.style.visibility = want ? 'hidden' : ''; }
  const d = want ? 'block' : '', vis = want ? 'visible' : '';
  for (const o of list) {
    if (o.hand.under.style.display !== d) { o.hand.under.style.display = d; o.hand.over.style.display = d; }
    if (o.el.style.visibility !== vis) o.el.style.visibility = vis;
  }
  if (want) for (const el of L.querySelectorAll('.say.claw-say')) if (el.style.visibility !== 'visible') el.style.visibility = 'visible';
}

export function install(app) {
  if (app && app.reduced) return;
  bus.on('sev.gone', () => show());   // the last one gone: everything back as crazy mode wants it
}
