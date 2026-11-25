// cut-off hand behaviour "gather": the hand tower (../tower.js) is on. It scuttles to its spot at the right edge: the bottom one
// to where it will brace (TOWER.EDGE_PX in from the edge of the window), the others to wait their turn, QUEUE_PX apart to its
// left, facing the tower. There (o.ai.there), the tower decides when it climbs (tower).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { GAIT, head } from '../gait.js';
import { tower, tier } from '../tower.js';

const S = TUNE.physics.S, TW = TUNE.severed.TOWER;

export default defineBehaviour('sev', 'gather', {
  pose: 'walk',
  up: true,
  enter(o, m) { const a = o.ai; a.gait = 'scuttle'; a.there = false; a.stuck = 0; o.body.setAngularDamping(0.5); },
  tick(o, m, dt) {
    const a = o.ai, T = tower(), i = tier(o); if (!T || i < 0) return;   // (the tower ends it)
    const x = o.body.getPosition().x * S, dx = T.B[0] - i * TW.QUEUE_PX - x;
    a.stuck = Math.abs(o.body.getLinearVelocity().x) < 0.25 ? a.stuck + dt : 0;
    if (Math.abs(dx) < TW.IN_PX || (a.stuck > TW.STUCK_S && Math.abs(dx) < TW.QUEUE_PX / 2)) a.there = true;
    if (a.there) { a.vx = 0; head(a, 1); a.wig = 0.08; return; }   // it waits, looking up at the tower
    head(a, dx < 0 ? -1 : 1); a.vx = a.dir * GAIT.scuttle.speed; a.wig = 0.04;
  },
});
export function install(app) {}
