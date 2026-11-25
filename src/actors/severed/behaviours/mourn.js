// cut-off hand behaviour "mourn": the new hand has just eaten another old hand (hand.devoured, src/reactions.js). It walks, on
// tiptoe, to the spot (a.spot, page px) where that one was dragged off, then bows. Gives up walking after MOURN.WALK_S.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set } from '../index.js';
import { GAIT, head } from '../gait.js';

const S = TUNE.physics.S, MO = TUNE.severed.MOURN;

export default defineBehaviour('sev', 'mourn', {
  pose: 'sneak',
  up: true,
  enter(o, m) { const a = o.ai; a.gait = 'tiptoe'; o.body.setAngularDamping(0.5); },
  tick(o, m, dt) {
    const a = o.ai, dx = a.spot - o.body.getPosition().x * S;
    if (Math.abs(dx) < MO.NEAR_PX || m.t > MO.WALK_S) { set(o, 'bow'); return; }
    head(a, dx < 0 ? -1 : 1); a.vx = a.dir * GAIT.tiptoe.speed; a.wig = 0.02;
  },
});
export function install(app) {}
