// hand state "regrow": back with a new hand, showing it off; lurk after 2.4 s.
// Legacy clawTick branch `c.st === 'regrow'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';

const H_ = TUNE.hand;

// back, with a new one, and it wants you to see it
export default defineBehaviour('hand', 'regrow', {
  pose: 'eager',
  uncut: true,   // the new hand cannot be taken off while it shows it
  tick(c, m, dt) {
    const x = m.x;
    x.pose = m.t < 1.6 ? POSES.eager : POSES.joy; x.rate = 5; x.wig = 0.45; x.aim = Math.PI + Math.sin(m.t * 5) * 0.3; x.T = [x.vw - 40, c.ly];
    if (m.t > H_.REGROW_SAY_S && !c.shown) { c.shown = true; speak('regrow', true); }
    if (m.t > H_.REGROW_S) { c.shown = false; c.cool = x.t + H_.COOL.regrow; set('lurk'); }
  },
});
export function install(app) {}
