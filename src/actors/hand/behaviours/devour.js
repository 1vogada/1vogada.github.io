// hand state "devour": it goes for an old (cut-off) hand that cannot get away (rules in ../old.js), takes it, drags it off the
// right edge like a card it eats, and is full for a while. Pick the old hand up on the way to save it.
// tick(c, m, dt) sets the motion target on the frame's ctx m.x. The old hand is c.o (claimed 'hand' / 'target').
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { line } from '../../../core/lines.js';
import { world, remove, isHeld } from '../../../world/world.js';
import { gore, shake } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { gripPt, wristFor } from '../tug.js';

const S = TUNE.physics.S, OLD = TUNE.hand.OLD, NONE = { groupIndex: 0, categoryBits: 1, maskBits: 0 }, ALL = { groupIndex: 0, categoryBits: 1, maskBits: 0xFFFF };

/** let go of it, whole (it falls where it is) */
function letGo(c, o) {
  if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
  if (world.bodies.has(o)) { o.body.getFixtureList().setFilterData(ALL); o.body.setGravityScale(isHeld(o) ? 1 : TUNE.physics.FALL); o.body.setAwake(true); }
  c.o = null;
  bus.emit('hand.dropped', { hand: o });
}

export default defineBehaviour('hand', 'devour', {
  pose: 'lunge',
  enter(c, m) { speak('devour', true); bus.emit('hand.devouring', { hand: c.o }); },
  tick(c, m, dt) {
    const x = m.x, o = c.o, vw = x.vw;
    if (!o) { set('lurk'); return; }
    if (isHeld(o)) { letGo(c, o); c.cool = x.t + OLD.COOL; set('sulk'); speak('robbed', true); return; }   // you took it off it
    if (!c.joint) {   // reaching for it: slower than for a card, it is savouring this
      const w = o.body.getWorldCenter(), Hc = [w.x * S - scrollX, w.y * S - scrollY], q = gripPt();
      x.pose = m.t < 0.5 ? POSES.eager : POSES.lunge; x.rate = 7; x.wig = 0.2;
      x.aim = Math.atan2(Hc[1] - c.y, Hc[0] - c.x); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI; x.T = wristFor(Hc, x.aim);
      if (Math.hypot(q[0] - Hc[0], q[1] - Hc[1]) < OLD.GRAB_PX) {   // got it
        o.body.getFixtureList().setFilterData(NONE); o.body.setGravityScale(0); o.body.setAngularDamping(TUNE.physics.HELD_SPIN);
        c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: TUNE.physics.MAX_FORCE * o.body.getMass(), frequencyHz: TUNE.hand.JOINT_HZ, dampingRatio: 1 }, world.ground, o.body, { x: w.x, y: w.y }));
        gore(w.x * S, w.y * S, 0, -1, 8, 0.5); c.gotAt = m.t; c.gotY = c.y;
      } else if (m.t > OLD.REACH_S) { letGo(c, o); c.cool = x.t + OLD.COOL; set('sulk'); speak('sulk'); }
      return;
    }
    if (m.t - c.gotAt < OLD.HOLD_S) {   // it lifts it up and shakes it, looking at it: your moment to grab it back
      x.pose = POSES.clamp; x.wig = 0.1; x.shake = 3; x.rate = 3; x.aim = Math.PI - 0.25; x.T = [c.x, Math.max(110, c.gotY - OLD.LIFT_PX)];
      return;
    }
    // then drags it off the edge, slowly, clamped shut
    x.pose = POSES.clamp; x.wig = 0.08; x.shake = 1.2;
    x.rate = c.x < vw - 380 ? 1.7 : OLD.DRAG_RATE; x.T = [c.x < vw - 380 ? c.x + 300 : vw + 420, c.y];
    if (c.x > vw + 190) {
      const w = o.body.getWorldCenter();
      bus.emit('hand.devoured', { hand: o });
      if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
      c.o = null; remove(o);
      gore(vw - 6 + scrollX, c.y + scrollY, -1, 0, 24, 1); gore(w.x * S, w.y * S, -1, 0, 10, 0.7); shake();
      speak('devoured', true);
      if (!c.ateOld) { c.ateOld = true; bus.emit('ui.toast', { msg: line('toast.devoured') }); }
      c.fullUntil = x.t + OLD.DIGEST_MS; c.cool = x.t + TUNE.hand.COOL.eat; set('lurk');
    }
  },
});
export function install(app) {}
