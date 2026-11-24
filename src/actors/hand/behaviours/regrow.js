// hand state "regrow": back with a new hand, showing it off; lurk after 2.4 s.
// STUB: legacy clawTick branch `c.st === 'regrow'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'regrow', {
  pose: 'eager',
  tick(c, m, dt) {},
});
export function install(app) {}
