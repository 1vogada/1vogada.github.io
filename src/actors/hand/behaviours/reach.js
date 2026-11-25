// hand state "reach": creeps across the screen to a card on the shelf; emits hand.reaching every frame (cards panic); crushes (40%) or drags it off to eat.
// Legacy clawTick branch `c.st === 'reach'`, moved verbatim (legacy panic(o, fear, dt, t) is the event 'hand.reaching', answered by
// the cards in src/reactions.js). tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { say } from '../../../core/speech.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak, shelf, clamp01 } from '../index.js';
import { gripPt, wristFor, crushStart } from '../tug.js';

const S = TUNE.physics.S, H_ = TUNE.hand;

// it comes for what was left on the shelf: slowly, at a steady creep, the whole arm out across the screen, and the cards can see it coming
export default defineBehaviour('hand', 'reach', {
  pose: 'eager',
  tick(c, m, dt) {
    const x = m.x, t = x.t, o = c.o; x.pose = POSES.eager; x.wig = 0.22; x.rate = 0.9;
    if (o && world.bodies.has(o) && !shelf.holds(o)) c.off = (c.off || 0) + dt; else c.off = 0;   // it may hop about in its panic; only a card that has really left the shelf gets away
    if (!o || (world.grab && world.grab.o === o) || c.off > 0.7) { c.o = null; c.off = 0; c.cool = t + H_.COOL.reach; set('sulk'); speak('sulk'); }
    else {
      const w = o.body.getWorldCenter(), Hc = [w.x * S - scrollX, w.y * S - scrollY], q = gripPt(), dist = Math.hypot(q[0] - Hc[0], q[1] - Hc[1]); c.ly = Math.max(80, Math.min(x.vh - 80, Hc[1]));
      if (c.d0 == null || m.t < 0.1) c.d0 = Math.max(200, dist);
      const fear = clamp01(1 - (dist - 60) / c.d0), W0 = wristFor(Hc, x.aim), dx = W0[0] - c.x, dy = W0[1] - c.y, dl = Math.hypot(dx, dy) || 1, lead = Math.min(dl, 230);
      x.T = [c.x + dx / dl * lead, c.y + dy / dl * lead];   // never further ahead than this: a steady creep, easing in only at the very end
      bus.emit('hand.reaching', { card: o, fear, dt, t, x: c.x });   // legacy panic(o, fear, dt, t)
      if (dist < 36 && m.t > 2.4) {   // it hovers over it for a moment, then: got it. A whole card may get crushed on the spot; otherwise it is dragged off and eaten
        o.hot = 0; say(o, 'card.pull', { force: true }); c.cool = t + H_.COOL.grab; c.d0 = null;
        if (o.kind === 'card' && Math.random() < H_.REACH_CHANCE_CRUSH) { crushStart(o); set('crush'); speak('snatch', true); }
        else {
          o.body.setAngularDamping(TUNE.physics.HELD_SPIN); o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0 }); o.el.style.pointerEvents = 'none';
          c.joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: TUNE.physics.MAX_FORCE * o.body.getMass(), frequencyHz: H_.JOINT_HZ, dampingRatio: 1 }, world.ground, o.body, { x: w.x, y: w.y }));
          set('eat'); speak('grab', true);
        }
        bus.emit('hand.grabbed', { card: o });
      }
    }
  },
});
export function install(app) {}
