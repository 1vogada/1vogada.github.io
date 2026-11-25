// hand state "stump": the hand was cut off: the arm whips back, spurting; regrow after 8 s.
// STUB: legacy clawTick branch `c.st === 'stump'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'stump', {
  pose: 'lurk',
  tick(c, m, dt) {},
});
export function install(app) {}
