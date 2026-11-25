// hand state "stump": the hand was cut off: the arm whips back, spurting; regrow after 8 s.
// Legacy clawTick branch `c.st === 'stump'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { gore } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set } from '../index.js';

// no hand: the arm whips back out of sight, spurting, and stays away until a new one has grown
export default defineBehaviour('hand', 'stump', {
  pose: 'lurk',
  tick(c, m, dt) {
    const x = m.x, t = x.t;
    x.rate = 7; x.T = [x.vw + 300, c.ly]; x.shake = m.t < 1.2 ? 6 : 0;
    if (m.t < 1.6 && t > (c.drip || 0)) { c.drip = t + 60; gore(c.x + scrollX, c.y + scrollY, -Math.cos(c.a) * -1, -Math.sin(c.a) * -1, 3, 0.5); }
    if (m.t > TUNE.hand.STUMP_S) { c.stump = false; c.pose = { ...POSES.sulk }; set('regrow'); bus.emit('hand.regrown', {}); }
  },
});
export function install(app) {}
