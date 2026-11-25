// cut-off hand behaviour "rise": getting up: crawl while hurt, else onto two fingers; says "rise"; walk after 0.8 s.
// Legacy SEV.rise, moved verbatim. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { clock } from '../../../core/clock.js';
import { set, say } from '../index.js';

// getting up: on its belly first if it is hurt, otherwise straight onto its fingers
export default defineBehaviour('sev', 'rise', {
  pose: 'walk',
  up: true,
  enter(o, m) { const a = o.ai; a.vx = 0; a.hh = Math.min(a.hh, 0.42); a.gait = clock.now() < a.hurt ? 'crawl' : a.stroll; o.body.setAngularDamping(0.5); },
  tick(o, m, dt) { const a = o.ai; if (m.t > 0.5 && !a.said1 && a.gait !== 'crawl') { a.said1 = true; say(o, 'rise', true); } if (m.t > 0.8) set(o, 'walk'); },
});
export function install(app) {}
