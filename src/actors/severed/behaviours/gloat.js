// cut-off hand behaviour "gloat": a little dance on the spot (1.5 s), then walk.
// STUB: legacy SEV.gloat. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'gloat', {
  pose: 'joy',
  up: true,
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
