// cut-off hand behaviour "gloat": a little dance on the spot (1.5 s), then walk.
// Legacy SEV.gloat, moved verbatim. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { set } from '../index.js';

// a little dance on the spot
export default defineBehaviour('sev', 'gloat', {
  pose: 'joy',
  up: true,
  enter(o, m) { const a = o.ai; a.vx = 0; a.gait = 'tiptoe'; },
  tick(o, m, dt) { const a = o.ai; a.hop = 0.16 * Math.abs(Math.sin(m.t * 9)); if (m.t > 1.5) { a.hop = 0; set(o, 'walk'); } },
});
export function install(app) {}
