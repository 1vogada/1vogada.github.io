// hand state "lunge": shoots to the far end of the held card; tug if it got there, sulk if not. Blind in the kiri flood (blind-fog): it gropes instead (grope.js).
// Legacy clawTick branch `c.st === 'lunge'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak, unseen } from '../index.js';
import { gripPt, wristFor, tug } from '../tug.js';

const S = TUNE.physics.S;

export default defineBehaviour('hand', 'lunge', {
  pose: 'lunge',
  poseRate: 30,   // legacy kp: the pose snaps (30) instead of following (12)
  tick(c, m, dt) {
    const x = m.x, o = x.o;
    x.pose = POSES.lunge; x.rate = 38;
    if (unseen()) { c.o = null; set('grope'); }   // blind-fog: lost in the flood mid-lunge
    else if (x.held !== o) { c.o = null; set('sulk'); speak('sulk'); }
    else {
      const hw = o.body.getWorldPoint(c.pre.ghm), pw = o.body.getWorldPoint(c.pre.gpm), Hc = [hw.x * S - scrollX, hw.y * S - scrollY];
      x.aim = Math.atan2(pw.y - hw.y, pw.x - hw.x); x.T = wristFor(Hc, x.aim);
      const q = gripPt(), dist = Math.hypot(q[0] - Hc[0], q[1] - Hc[1]);
      if (dist < 20 || m.t > 0.4) { if (dist < 90) tug(o); else { c.o = null; set('sulk'); speak('sulk'); } }
    }
  },
});
export function install(app) {}
