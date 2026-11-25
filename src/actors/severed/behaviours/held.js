// cut-off hand behaviour "held": in your hand: wriggles and complains; limp when let go.
// Legacy SEV.held, moved verbatim. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { isHeld } from '../../../world/world.js';
import { set, say, tickNow } from '../index.js';

// in your hand: it does not like it
export default defineBehaviour('sev', 'held', {
  pose: 'held',
  enter(o, m) { say(o, 'held', true); },
  tick(o, m, dt) { const a = o.ai, t = tickNow(); a.wig = 0.55; if (!isHeld(o)) { a.born = t - 4000; set(o, 'limp'); } else if (m.t > 2.5) say(o, 'held'); },
});
export function install(app) {}
