// hand state "crush": squeeze, savour, beg, crunch (CRUSH_Q); then gloat.
// STUB: legacy clawTick branch `c.st === 'crush'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'crush', {
  pose: 'clamp',
  tick(c, m, dt) {},
});
export function install(app) {}
