// hand state "sew": you let go of an old (cut-off) hand right at the stump (stump.js), so it goes back on. The stump holds it
// with a joint and pulls it into place, palm SEW.PALM_PX past the wrist, turned the way the arm points (hand.sewing: the old
// hand says it is home). After SEW.S the old hand's body is gone and the arm has its hand again: no new hand grows (no
// hand.regrown). Then it shows it off (hand.sewn) and lurks. Grab the old hand off it before that and it is a stump again.
// tick(c, m, dt) sets the motion target on the frame's ctx m.x; hold() moves the old hand (c.o, claimed 'hand' / 'target').
import { dropOld } from '../old.js';
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, remove, isHeld, HIT_ALL, NO_HIT, pinJoint } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set, wrapA } from '../index.js';

const S = TUNE.physics.S, SEW = TUNE.hand.SEW;

/** let go of it (you took it back): it falls where it is */
function letGo(c, o) { dropOld(c, o); bus.emit('hand.dropped', { hand: o }); }

export default defineBehaviour('hand', 'sew', {
  pose: 'lurk',
  uncut: true,
  enter(c, m) {
    const o = c.o, w = o.body.getWorldCenter();
    o.body.getFixtureList().setFilterData(NO_HIT); o.body.setGravityScale(0); o.body.setAngularDamping(TUNE.physics.HELD_SPIN);
    c.joint = pinJoint(o.body, { x: w.x, y: w.y }, SEW.HZ);
    bus.emit('hand.sewing', { hand: o });
  },
  tick(c, m, dt) {
    const x = m.x, o = c.o;
    x.rate = SEW.RATE; x.aim = Math.PI; x.T = [Math.min(c.x, x.vw - SEW.OUT_PX), c.y]; x.shake = 0;
    if (!o || !world.bodies.has(o) || isHeld(o)) {   // you took it back (or it is gone): a stump again, its time running on
      if (o && world.bodies.has(o)) letGo(c, o); else { c.o = null; c.joint = null; }
      const t0 = c.stumpT || 0; set('stump'); m.t = t0; return;
    }
    if (m.t > SEW.S) {   // on: the body goes, the hand on the arm is back
      const w = o.body.getWorldCenter();
      if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
      c.o = null; remove(o);
      gore(w.x * S, w.y * S, 0, -1, 6, 0.4);
      c.stump = false; c.pose = { ...POSES.sulk };
      set('sewn'); bus.emit('hand.sewn', {});
    }
  },
  // the old hand is pulled onto the end of the arm, turned to lie along it
  hold(c, m, x, H) {
    const o = c.o; if (!c.joint || !o || !world.bodies.has(o)) return true;
    c.joint.setTarget({ x: (c.x + SEW.PALM_PX * Math.cos(c.a) + scrollX) / S, y: (c.y + SEW.PALM_PX * Math.sin(c.a) + scrollY) / S });
    o.body.setAngularVelocity(wrapA(c.a - o.body.getAngle()) * SEW.HZ);
    return true;
  },
});
export function install(app) {}
