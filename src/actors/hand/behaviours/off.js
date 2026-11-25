// hand state "off": nothing torn yet: it waits past the edge; goes to lurk once world.ripped has a card.
// Legacy clawTick branch `c.st === 'off'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { world } from '../../../world/world.js';
import { set } from '../index.js';

export default defineBehaviour('hand', 'off', {
  pose: 'lurk',
  busy: false,   // legacy clawBusy: claw.st !== 'off' && ...
  calm: true,    // the lost-card check does not sulk
  uncut: true,   // nothing to cut
  tick(c, m, dt) {
    const x = m.x;
    x.T[0] = x.vw + TUNE.hand.OFF_X; if (world.ripped.size) set('lurk');
  },
});
export function install(app) {}
