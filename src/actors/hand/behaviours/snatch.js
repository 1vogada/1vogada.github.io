// hand state "snatch": out of patience: takes the held card out of your hand into its fist (crush).
// Legacy clawTick branch `c.st === 'snatch'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { drop } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { gripPt, wristFor, crushStart } from '../tug.js';

const S = TUNE.physics.S;

// out of patience: the arm shoots all the way out to the card, wherever it is
export default defineBehaviour('hand', 'snatch', {
  pose: 'lunge',
  tick(c, m, dt) {
    const x = m.x, o = x.o;
    x.pose = POSES.lunge; x.rate = 34;
    if (x.held !== o) { c.o = null; set('sulk'); speak('sulk'); }
    else {
      const w = o.body.getWorldCenter(), Hc = [w.x * S - scrollX, w.y * S - scrollY], q = gripPt();
      x.aim = Math.atan2(Hc[1] - c.y, Hc[0] - c.x); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI; x.T = wristFor(Hc, x.aim);
      if (Math.hypot(q[0] - Hc[0], q[1] - Hc[1]) < 34) {   // got it: out of your hand and into its fist
        drop(); crushStart(o);
        set('crush'); speak('snatch', true);
        bus.emit('hand.grabbed', { card: o });
      } else if (m.t > 0.9) { c.o = null; set('sulk'); speak('sulk'); }
    }
  },
});
export function install(app) {}
