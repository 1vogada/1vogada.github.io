// hand state "reach": creeps across the screen to a card on the shelf; emits hand.reaching every frame (cards panic); crushes (40%) or drags it off to eat.
// STUB: legacy clawTick branch `c.st === 'reach'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'reach', {
  pose: 'eager',
  tick(c, m, dt) {},
});
export function install(app) {}
