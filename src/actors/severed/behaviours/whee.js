// cut-off hand behaviour "whee": its grip on the card it was riding gave out (hitch) and it flies, fingers spread, shouting. Once
// it has landed (slower than HITCH.LAND_V, or after HITCH.WHEE_S) it lies there dizzy.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say } from '../index.js';

const HI = TUNE.severed.HITCH;

export default defineBehaviour('sev', 'whee', {
  pose: 'held',   // fingers spread wide, eye wide
  enter(o, m) { o.ai.vx = 0; o.body.setAngularDamping(0.3); o.body.setGravityScale(TUNE.physics.FALL); say(o, 'whee', true); },
  tick(o, m, dt) {
    const a = o.ai; a.wig = 0.6;
    if ((m.t > 0.35 && o.body.getLinearVelocity().length() < HI.LAND_V) || m.t > HI.WHEE_S) set(o, 'dizzy');
  },
  leave(o, m) { o.ai.wig = 0; o.body.setAngularDamping(TUNE.severed.BODY.damping); },
});
export function install(app) {}
