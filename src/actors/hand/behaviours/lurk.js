// hand state "lurk": follows a held card up and down; eager when it is brought into the tease zone (not near the shelf); otherwise eyes the shelf for 700 ms and reaches.
// STUB: legacy clawTick branch `c.st === 'lurk'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'lurk', {
  pose: 'lurk',
  busy: false,   // legacy clawBusy: lurk keeps the loop awake only until c.until (1.5 s after clawSet), the hand's busy() adds that
  tick(c, m, dt) {},
});
export function install(app) {}
