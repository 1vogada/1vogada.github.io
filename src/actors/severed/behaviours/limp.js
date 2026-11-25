// cut-off hand behaviour "limp": just cut off or dropped: lies there twitching, drips for 1.6 s, says "cut", then rise.
// Legacy SEV.limp, moved verbatim. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { isHeld } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { set, say, tickNow } from '../index.js';

const S = TUNE.physics.S;

// just cut off, or just dropped: it lies where it fell and twitches, and then it gets up
export default defineBehaviour('sev', 'limp', {
  pose: 'limp',
  enter(o, m) { o.body.setAngularDamping(TUNE.severed.BODY.damping); o.body.setGravityScale(isHeld(o) ? 1 : TUNE.physics.FALL); },
  tick(o, m, dt) {
    const a = o.ai, t = tickNow();
    a.wig = m.t < 1.4 ? 0.5 * Math.exp(-m.t * 2) + (Math.sin(m.t * 31) > 0.93 ? 0.6 : 0) : 0.03;
    if (t - a.born < 1600 && t > (a.drip || 0)) { a.drip = t + 90; const w = o.body.getWorldPoint({ x: -0.5, y: 0 }); gore(w.x * S, w.y * S, 0, -1, 2, 0.3); }
    if (m.t > 0.9 && t - a.born < 2500) say(o, 'cut');
    if (m.t > (t - a.born < 4000 ? 2.6 : 0.9) && o.body.getLinearVelocity().length() < 1.2) set(o, 'rise');
  },
});
export function install(app) {}
