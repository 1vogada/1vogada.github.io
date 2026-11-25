// cut-off hand behaviour "five": two old hands (the one that took its revenge, and the one it just cut off) walk up to each
// other, stand up tall and high-five: a slap, a spray, a line. Then they walk on. a.mate is the other hand.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { world } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { set, say } from '../index.js';
import { GAIT, head } from '../gait.js';

const S = TUNE.physics.S, AV = TUNE.severed.AVENGE;

export default defineBehaviour('sev', 'five', {
  pose: 'joy',
  up: true,
  enter(o, m) { const a = o.ai; a.gait = 'tiptoe'; a.slapped = false; o.body.setAngularDamping(0.5); },
  tick(o, m, dt) {
    const a = o.ai, q = a.mate;
    if (!q || !world.bodies.has(q) || m.t > AV.FIVE_GIVE_UP_S) { set(o, 'walk'); return; }
    const p = o.body.getPosition(), dx = (q.body.getPosition().x - p.x) * S;
    if (!a.slapped && Math.abs(dx) > AV.FIVE_PX) { head(a, dx < 0 ? -1 : 1); a.vx = a.dir * GAIT.tiptoe.speed; a.wig = 0.05; return; }
    a.vx = 0; head(a, dx < 0 ? -1 : 1);
    if (!a.slapped) {
      a.slapped = true; a.at = m.t;
      if (q.ai.mate === o && !q.ai.slapped) { say(o, 'five', true); o.body.applyLinearImpulse({ x: 0, y: -AV.HOP * o.body.getMass() }, p, true); gore(p.x * S + dx / 2, p.y * S - 60, 0, -1, 10, 0.5); }
    }
    a.wig = 0.3;
    if (m.t - a.at > AV.FIVE_S) { a.mate = null; set(o, 'walk'); }
  },
});
export function install(app) {}
