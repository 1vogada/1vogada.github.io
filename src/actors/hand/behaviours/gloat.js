// hand state "gloat": a dance after a crush; lurk after 1.3 s.
// STUB: legacy clawTick branch `c.st === 'gloat'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'gloat', {
  pose: 'joy',
  tick(c, m, dt) {},
});
export function install(app) {}
