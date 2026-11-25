// cut-off hand behaviour "held": in your hand: wriggles and complains; limp when let go.
// STUB: legacy SEV.held. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'held', {
  pose: 'held',
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
