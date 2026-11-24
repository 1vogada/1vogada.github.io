// cut-off hand behaviour "limp": just cut off or dropped: lies there twitching, drips for 1.6 s, says "cut", then rise.
// STUB: legacy SEV.limp. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'limp', {
  pose: 'limp',
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
