// hand state "eager": a card held in its zone: says eager, snatches when teased or out of patience, lunges when the card is brought close.
// STUB: legacy clawTick branch `c.st === 'eager'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'eager', {
  pose: 'eager',
  tick(c, m, dt) {},
});
export function install(app) {}
