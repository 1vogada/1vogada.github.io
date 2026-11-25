// hand state "catch": plucks a thrown card out of the air; crush (30%) or has.
// STUB: legacy clawTick branch `c.st === 'catch'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'catch', {
  pose: 'lunge',
  tick(c, m, dt) {},
});
export function install(app) {}
