// hand state "has": holds the whole card; you take hold again -> tug; bored after 2 s -> toss it back (hard 30%).
// Legacy clawTick branch `c.st === 'has'` (tick) and the post-chain block `c.st === 'has' && c.o` (hold: the snap of the stretch,
// then the joint follows the grip), moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { say } from '../../../core/speech.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { wristFor, pre, tug, tugDraw, untug } from '../tug.js';

const S = TUNE.physics.S, P_ = TUNE.physics, H_ = TUNE.hand;

export default defineBehaviour('hand', 'has', {
  pose: 'joy',
  tick(c, m, dt) {
    const x = m.x, o = x.o, t = x.t;
    x.pose = POSES.joy; x.rate = 12; x.aim = Math.PI + Math.sin(m.t * 3) * 0.08; x.T = wristFor([x.vw - x.HOLD, c.hy], x.aim);
    if (world.grab && world.grab.o === o) {   // you took hold again
      if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
      if (!o.tug) o.tug = { ...c.pre };
      c.snap = null; c.pre = pre(o, c.gh); tug(o);
    } else if (!c.snap && m.t > 2) {   // bored of it: back it goes, sometimes hard
      const hard = Math.random() < H_.TOSS_HARD; world.b2.destroyJoint(c.joint); c.joint = null; c.o = null;
      o.body.setGravityScale(P_.FALL); o.body.setAngularDamping(P_.SPIN); o.body.setLinearVelocity(hard ? { x: -24, y: -8 } : { x: -9, y: -7 }); o.body.setAngularVelocity((Math.random() - 0.5) * 8);
      if (hard) { o.hot = t + P_.HOT_MS; o.body.setBullet(true); say(o, 'card.throw', { force: true }); }
      c.cool = t + H_.COOL.toss; set('lurk'); speak('toss', true);
    }
  },
  hold(c, m, x, H) {
    if (!c.o) return false;
    const sn = c.snap, ob = c.o;
    if (sn) {   // the stretch rings out, then it is an ordinary card hanging from the claw
      sn.t += x.dt;
      const s = 1 + (sn.s0 - 1) * Math.exp(-sn.t * 14) * Math.cos(sn.t * 38), d = ob.tug.d0 * s, Pv = [H[0] - Math.cos(sn.psi) * d, H[1] - Math.sin(sn.psi) * d];
      if (sn.t < 0.45) tugDraw(ob, Pv, H);
      else {
        untug(ob, Pv, H); c.snap = null; ob.body.setGravityScale(P_.FALL); ob.body.setAngularDamping(P_.HELD_SPIN);
        c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: P_.MAX_FORCE * ob.body.getMass(), frequencyHz: H_.JOINT_HZ, dampingRatio: 1 }, world.ground, ob.body, { x: H[0] / S, y: H[1] / S }));
      }
    } else if (c.joint) c.joint.setTarget({ x: H[0] / S, y: H[1] / S });
    return true;
  },
});
export function install(app) {}
