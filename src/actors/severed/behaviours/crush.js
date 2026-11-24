// cut-off hand behaviour "crush": climbs on a card and squeezes it (3.2 s, pause, beg) until it is gone; then gloat.
// STUB: legacy SEV.crush. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'crush', {
  pose: 'grip',
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
