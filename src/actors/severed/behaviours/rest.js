// cut-off hand behaviour "rest": sits down with its eye shut; up when touched, after 7-14 s, or at the latest TIMING.wait.sevRest (a timer on WALL time in legacy: clock.real.after).
// STUB: legacy SEV.rest. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'rest', {
  pose: 'rest',
  busy: false,
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
