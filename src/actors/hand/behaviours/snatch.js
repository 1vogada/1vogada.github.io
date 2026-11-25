// hand state "snatch": out of patience: takes the held card out of your hand into its fist (crush).
// STUB: legacy clawTick branch `c.st === 'snatch'`. tick(c, m, dt) sets the motion target on c.aim = { T, rate, aim, pose, wig, shake, strain }.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'snatch', {
  pose: 'lunge',
  tick(c, m, dt) {},
});
export function install(app) {}
