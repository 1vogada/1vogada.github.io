// hand state "sulk": pulls back for 1.6 s, then lurk.
// STUB: legacy clawTick branch `c.st === 'sulk'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'sulk', {
  pose: 'sulk',
  tick(c, m, dt) {},
});
export function install(app) {}
