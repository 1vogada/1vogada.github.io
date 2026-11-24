// hand state "eat": drags its catch off the right edge and eats it.
// STUB: legacy clawTick branch `c.st === 'eat'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'eat', {
  pose: 'joy',
  tick(c, m, dt) {},
});
export function install(app) {}
