// hand state "has": holds the whole card; you take hold again -> tug; bored after 2 s -> toss it back (hard 30%).
// STUB: legacy clawTick branch `c.st === 'has'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'has', {
  pose: 'joy',
  tick(c, m, dt) {},
});
export function install(app) {}
