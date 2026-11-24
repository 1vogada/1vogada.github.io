// hand state "tug": tug of war with the pointer: strain, agony lines, drips; slip on a sharp yank, rip at the limit; keep if you let go.
// STUB: legacy clawTick branch `c.st === 'tug'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'tug', {
  pose: 'clamp',
  tick(c, m, dt) {},
});
export function install(app) {}
