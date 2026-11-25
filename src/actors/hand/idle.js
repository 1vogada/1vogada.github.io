// "Are you still there?": the pointer (a mouse, on the page) has not moved for TUNE.hand.IDLE.MS. Tracked here from the
// document's pointer events (game time); lurk asks still() and goes 'poke'. A timer wakes the sleeping frame loop at the
// deadline. Off while window.__test.idle === false (every scenario: most of them leave the mouse still for longer).
// Also: is the mouse going round in circles (TUNE.hand.CIRCLE)? Then the hands' eyes follow it (circling()).
import { TUNE } from '../../core/tune.js';
import { clock, now } from '../../core/clock.js';
import { flags } from '../../core/debug.js';
import { world } from '../../world/world.js';

const I = TUNE.hand.IDLE, C = TUNE.hand.CIRCLE;
let at = null, moved = 0, cancel = null, trail = [], roundUntil = 0;

// the last WINDOW_MS of the pointer's path: does it wind round its own middle, far enough out to be a circle?
function wind(x, y, t) {
  trail.push([x, y, t]); while (trail.length && t - trail[0][2] > C.WINDOW_MS) trail.shift();
  const n = trail.length; if (n < 8) return;
  let cx = 0, cy = 0; for (const q of trail) { cx += q[0]; cy += q[1]; } cx /= n; cy /= n;
  let r = 0, turn = 0, prev = null;
  for (const q of trail) {
    const a = Math.atan2(q[1] - cy, q[0] - cx); r += Math.hypot(q[0] - cx, q[1] - cy);
    if (prev != null) { const d = a - prev; turn += d - 2 * Math.PI * Math.round(d / (2 * Math.PI)); }
    prev = a;
  }
  r /= n;
  if (r > C.R_MIN && r < C.R_MAX && Math.abs(turn) > C.TURNS * 2 * Math.PI) roundUntil = t + C.HOLD_MS;
}

/** the pointer, viewport px, or null (not on the page, or not a mouse) */
export const pointer = () => at;
/** when the pointer last moved (game ms) */
export const lastMove = () => moved;
/** the pointer has been still on the page long enough */
export const still = (t) => !!at && flags().idle && t - moved > I.MS;
/** the pointer (viewport px) while you move the mouse round in circles, else null */
export const circling = () => (at && now() < roundUntil ? at : null);

export function install(app) {
  if (app && app.reduced) return;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') { at = null; return; }
    at = [e.clientX, e.clientY]; moved = now(); wind(e.clientX, e.clientY, moved);
    if (cancel) cancel();
    if (!flags().idle || !world.ripped.size) { cancel = null; return; }   // nothing to wake for: off under tests, and no hand before a rip (the world may not even exist yet)
    cancel = clock.real.after(I.MS + 50, () => { cancel = null; if (world.b2) clock.wake(); });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { at = null; trail = []; });
}
