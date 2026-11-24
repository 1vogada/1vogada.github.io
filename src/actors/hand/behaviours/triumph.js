// hand state "triumph": waves its half after a rip; eat after 1.4 s; slip if you grab its half.
// STUB: legacy clawTick branch `c.st === 'triumph'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'triumph', {
  pose: 'joy',
  tick(c, m, dt) {},
});
export function install(app) {}
