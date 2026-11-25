// cut-off hand behaviour "tumble": the hand tower (../tower.js) came down. Knocked, picked apart or given up, each one falls off
// sideways (TOWER.FALL); shaken off by the arm (o.ai.flung) they are flung across the page (TOWER.FLING, SPIN). Landed (slower
// than TOWER.LAND_V, or after LAND_S): dizzy, in a heap. One of them says something about it (o.ai.fell / o.ai.heap).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say } from '../index.js';

const TW = TUNE.severed.TOWER;

export default defineBehaviour('sev', 'tumble', {
  pose: 'held',   // fingers spread wide, eye wide
  enter(o, m) {
    const a = o.ai, b = o.body, [lo, hi] = TW.FLING, r = Math.random();
    a.vx = 0; b.setAngularDamping(0.3); b.setGravityScale(TUNE.physics.FALL); b.setAwake(true);
    if (a.flung) b.setLinearVelocity({ x: lo[0] + (hi[0] - lo[0]) * r, y: lo[1] + (hi[1] - lo[1]) * r });
    else b.setLinearVelocity({ x: (r - 0.5) * 2 * TW.FALL[0], y: -TW.FALL[1] * r });
    b.setAngularVelocity((Math.random() - 0.5) * 2 * TW.SPIN * (a.flung ? 1 : 0.4));
    if (a.fell) say(o, 'towerFell', true);
  },
  tick(o, m, dt) {
    const a = o.ai; a.wig = 0.6;
    if ((m.t > 0.4 && o.body.getLinearVelocity().length() < TW.LAND_V) || m.t > TW.LAND_S) set(o, 'dizzy');
  },
  leave(o, m) {
    const a = o.ai; a.wig = 0; o.body.setAngularDamping(TUNE.severed.BODY.damping);
    if (a.heap) say(o, 'towerHeap', true);
    a.flung = a.heap = a.fell = false;
  },
});
export function install(app) {}
