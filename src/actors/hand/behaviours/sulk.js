// hand state "sulk": pulls back for 1.6 s, then lurk.
// Legacy clawTick branch `c.st === 'sulk'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { POSES } from '../poses.js';
import { set } from '../index.js';

export default defineBehaviour('hand', 'sulk', {
  pose: 'sulk',
  catches: true,   // the catch scan runs
  idle: true,      // remarks are said, and the flinch leans in
  tick(c, m, dt) {
    const x = m.x;
    x.pose = POSES.sulk; x.rate = 4; x.aim = Math.PI - 0.5; x.T = [x.vw + 120, c.ly + 30]; x.wig = 0.02;
    if (m.t > 1.6) set('lurk');
  },
});
export function install(app) {}
