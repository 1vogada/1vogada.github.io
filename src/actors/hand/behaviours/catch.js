// hand state "catch": plucks a thrown card out of the air; crush (30%) or has.
// Legacy clawTick branch `c.st === 'catch'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak, big } from '../index.js';
import { gripPt, wristFor, crushStart } from '../tug.js';

const S = TUNE.physics.S, H_ = TUNE.hand;

// the arm shoots out to where the card is and plucks it out of the air
export default defineBehaviour('hand', 'catch', {
  pose: 'lunge',
  tick(c, m, dt) {
    const x = m.x, o = c.o;
    x.pose = POSES.lunge; x.rate = 44;
    if (!o || (world.grab && world.grab.o === o)) { c.o = null; set('lurk'); }
    else {
      const w = o.body.getWorldCenter(), Hc = [w.x * S - scrollX, w.y * S - scrollY], q = gripPt(), dist = Math.hypot(q[0] - Hc[0], q[1] - Hc[1]);
      x.aim = Math.atan2(Hc[1] - c.y, Hc[0] - c.x); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI; x.T = wristFor(Hc, x.aim);
      if (dist < 70) {
        o.body.setLinearVelocity({ x: 0, y: 0 }); o.body.setAngularVelocity(o.body.getAngularVelocity() * 0.2); o.hot = 0; o.body.setBullet(false);
        if (o.kind !== 'card') {   // a piece of a card: a big one is eaten on the spot, a scrap is batted straight back
          if (big(o) || o.ball) {   // (a ball of paper an old hand brought you is always a treat)
            bus.emit('hand.grabbed', { card: o, how: 'catch' }); speak('caught', true);
            o.body.setAngularDamping(TUNE.physics.HELD_SPIN); o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0 }); o.el.style.pointerEvents = 'none';
            c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: TUNE.physics.MAX_FORCE * o.body.getMass(), frequencyHz: H_.JOINT_HZ, dampingRatio: 1 }, world.ground, o.body, { x: w.x, y: w.y }));
            set('eat');
          } else {
            o.body.setLinearVelocity({ x: H_.SWAT[0], y: H_.SWAT[1] }); o.body.setAngularVelocity((Math.random() - 0.5) * 14);
            bus.emit('hand.rejected', { card: o }); c.o = null; c.cool = x.t + H_.COOL.small; set('sulk'); speak('small', true);
          }
          return;
        }
        bus.emit('hand.grabbed', { card: o, how: 'catch' }); speak('caught', true);   // legacy say(o, 'pull', true): the card says it
        if (Math.random() < H_.CATCH_CHANCE_CRUSH) { crushStart(o); set('crush'); }   // sometimes it does not feel like sharing
        else {
          o.body.setAngularDamping(TUNE.physics.HELD_SPIN); c.gh = [0, 0]; c.pre = {}; c.snap = null; c.hy = Math.max(110, Math.min(x.vh - 110, Hc[1]));
          c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: TUNE.physics.MAX_FORCE * o.body.getMass(), frequencyHz: H_.JOINT_HZ, dampingRatio: 1 }, world.ground, o.body, { x: w.x, y: w.y }));
          set('has');
        }
      } else if (m.t > 0.6) { c.o = null; c.cool = x.t + H_.COOL.catch; set('sulk'); speak('sulk'); }
    }
  },
});
export function install(app) {}
