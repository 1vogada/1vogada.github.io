// hand state "lunge": shoots to the far end of the held card; tug if it got there, sulk if not.
// STUB: legacy clawTick branch `c.st === 'lunge'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'lunge', {
  pose: 'lunge',
  tick(c, m, dt) {},
});
export function install(app) {}
