// hand state "catch": plucks a thrown card out of the air; crush (30%) or has. A ball of paper (an old hand's gift) or the fallen
// toast (kind 'toast', page/bread.js) is eaten on the spot (eat), with its own line (hand.caught / hand.toast). The kept coin
// (kind 'coin', page/coinbody.js) is bitten like gold and flicked back (bite.js).
// Legacy clawTick branch `c.st === 'catch'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, NO_HIT, pinJoint } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak, big } from '../index.js';
import { gripPt, wristFor, crushStart, middle, aimAt } from '../tug.js';
import { take } from '../coin.js';

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
      x.aim = aimAt([c.x, c.y], Hc); x.T = wristFor(Hc, x.aim);
      if (dist < 70) {
        o.body.setLinearVelocity({ x: 0, y: 0 }); o.body.setAngularVelocity(o.body.getAngularVelocity() * 0.2); o.hot = 0; o.body.setBullet(false);
        if (o.ball || o.kind === 'toast') {   // a ball of paper an old hand brought you, or the toast (page/bread.js): always a treat, eaten on the spot
          bus.emit('hand.grabbed', { card: o, how: 'catch' }); speak(o.ball ? 'caught' : 'toast', true);   // toast. finally, real food
          o.body.setAngularDamping(TUNE.physics.HELD_SPIN); o.body.getFixtureList().setFilterData(NO_HIT); o.el.style.pointerEvents = 'none';
          c.joint = pinJoint(o.body, { x: w.x, y: w.y }, H_.JOINT_HZ);
          set('eat'); return;
        }
        if (o.kind === 'coin') { bus.emit('hand.grabbed', { card: o, how: 'catch' }); take(c, o, w, Hc[1]); return; }   // the kept coin: is it gold? (bite.js)
        if (!big(o)) {   // a scrap: batted straight back
          o.body.setLinearVelocity({ x: H_.SWAT[0], y: H_.SWAT[1] }); o.body.setAngularVelocity((Math.random() - 0.5) * 14);
          bus.emit('hand.rejected', { card: o }); c.o = null; c.cool = x.t + H_.COOL.small; set('sulk'); speak('small', true);
          return;
        }
        bus.emit('hand.grabbed', { card: o, how: 'catch' }); speak('caught', true);   // legacy say(o, 'pull', true): the card says it
        if (Math.random() < H_.CATCH_CHANCE_CRUSH) { crushStart(o); set('crush'); }   // sometimes it does not feel like sharing
        else {
          o.body.setAngularDamping(TUNE.physics.HELD_SPIN); c.gh = middle(o); c.pre = {}; c.snap = null; c.hy = Math.max(110, Math.min(x.vh - 110, Hc[1]));
          c.joint = pinJoint(o.body, { x: w.x, y: w.y }, H_.JOINT_HZ);
          set('has');
        }
      } else if (m.t > 0.6) { c.o = null; c.cool = x.t + H_.COOL.catch; set('sulk'); speak('sulk'); }
    }
  },
});
export function install(app) {}
