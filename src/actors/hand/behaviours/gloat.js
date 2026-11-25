// hand state "gloat": a dance after a crush; lurk after 1.3 s.
// Legacy clawTick branch `c.st === 'gloat'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set } from '../index.js';
import { wristFor } from '../tug.js';

export default defineBehaviour('hand', 'gloat', {
  pose: 'joy',
  catches: true,   // the catch scan runs
  tick(c, m, dt) {
    const x = m.x;
    x.pose = POSES.joy; x.rate = 12; x.wig = 0.2; x.aim = Math.PI + Math.sin(m.t * 14) * 0.16; x.T = wristFor([x.vw - x.HOLD - 20, c.hy - 30 + Math.sin(m.t * 14) * 16], x.aim);
    if (m.t > 1.3) { c.cool = x.t + TUNE.hand.COOL.gloat; set('lurk'); }
  },
});
export function install(app) {}
