// "Are you still there?": the pointer (a mouse, on the page) has not moved for TUNE.hand.IDLE.MS. Tracked here from the
// document's pointer events (game time); lurk asks still() and goes 'poke'. A timer wakes the sleeping frame loop at the
// deadline. Off while window.__test.idle === false (every scenario: most of them leave the mouse still for longer).
import { TUNE } from '../../core/tune.js';
import { clock, now } from '../../core/clock.js';
import { flags } from '../../core/debug.js';
import { world } from '../../world/world.js';

const I = TUNE.hand.IDLE;
let at = null, moved = 0, cancel = null;

/** the pointer, viewport px, or null (not on the page, or not a mouse) */
export const pointer = () => at;
/** when the pointer last moved (game ms) */
export const lastMove = () => moved;
/** the pointer has been still on the page long enough */
export const still = (t) => !!at && flags().idle && t - moved > I.MS;

export function install(app) {
  if (app && app.reduced) return;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') { at = null; return; }
    at = [e.clientX, e.clientY]; moved = now();
    if (cancel) cancel();
    if (!flags().idle || !world.ripped.size) { cancel = null; return; }   // nothing to wake for: off under tests, and no hand before a rip (the world may not even exist yet)
    cancel = clock.real.after(I.MS + 50, () => { cancel = null; if (world.b2) clock.wake(); });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { at = null; });
}
