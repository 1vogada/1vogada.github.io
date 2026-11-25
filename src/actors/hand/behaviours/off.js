// hand state "off": nothing torn yet: it waits past the edge; goes to lurk once world.ripped has a card.
// STUB: legacy clawTick branch `c.st === 'off'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'off', {
  pose: 'lurk',
  busy: false,
  tick(c, m, dt) {},
});
export function install(app) {}
