// hand state "book": borrowed by the phrasebook: clawTick returns before anything else.
// STUB: legacy clawTick branch `c.st === 'book'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'book', {
  pose: 'lurk',
  tick(c, m, dt) {},
});
export function install(app) {}
