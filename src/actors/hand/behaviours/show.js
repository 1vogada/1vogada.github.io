// hand state "show": driven by a scene (Surprise me): goes where come()/to() say.
// STUB: legacy clawTick branch `c.st === 'show'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'show', {
  pose: 'eager',
  tick(c, m, dt) {},
});
export function install(app) {}
