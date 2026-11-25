// cut-off hand behaviour "rest": sits down with its eye shut; up when touched, after 7-14 s, or at the latest TIMING.wait.sevRest
// (a timer on WALL time in legacy: clock.real.after).
// Legacy SEV.rest, moved verbatim. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE, TIMING } from '../../../core/tune.js';
import { clock } from '../../../core/clock.js';
import { world } from '../../../world/world.js';
import { set, say, tickNow } from '../index.js';

const SV = TUNE.severed;

// sitting down with its eye shut. Anything that touches it, or a while of real time, and it is up again
export default defineBehaviour('sev', 'rest', {
  pose: 'rest',
  busy: false,
  enter(o, m) {
    const a = o.ai; say(o, 'rest', true); o.body.setAngularDamping(SV.BODY.damping); a.wake = clock.now() + SV.REST_WAKE_MS[0] + Math.random() * SV.REST_WAKE_MS[1];
    clock.real.after(TIMING.wait.sevRest, () => { if (world.bodies.has(o) && m.state === 'rest') set(o, 'rise'); });   // legacy setTimeout (wall time)
  },
  tick(o, m, dt) { const a = o.ai, t = tickNow(); a.wig = 0; if (t > a.wake || o.body.getLinearVelocity().length() > 1.5) set(o, 'rise'); },
});
export function install(app) {}
