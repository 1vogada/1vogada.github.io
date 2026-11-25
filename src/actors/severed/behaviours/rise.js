// cut-off hand behaviour "rise": getting up: crawl while hurt, else onto two fingers; says "rise"; walk after 0.8 s.
// STUB: legacy SEV.rise. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('sev', 'rise', {
  pose: 'walk',
  up: true,
  enter(o, m) {},
  tick(o, m, dt) {},
  leave(o, m) {},
});
export function install(app) {}
