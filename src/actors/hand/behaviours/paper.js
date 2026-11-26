// hand state "paper": not paper. You held an old (cut-off) hand out in the tease zone like a card (./old.js mistake()), and it
// takes it for one: it reaches out, takes it out of your hand (hand.mistook) and lifts it to have a look. A pause, then
// "wait. this is not paper." Then it makes up its mind (one draw, PAPER.EAT): it eats it anyway (devour, from the shake on), or
// carries it back in from the edge, lets go of it (hand.returned) and goes back to lurking.
// tick(c, m, dt) sets the motion target on the frame's ctx m.x. The old hand is c.o (claimed 'hand' / 'target').
import { dropOld } from '../old.js';
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, drop, isHeld, HIT_ALL, NO_HIT, pinJoint } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { gripPt, wristFor } from '../tug.js';

const S = TUNE.physics.S, OLD = TUNE.hand.OLD, PA = OLD.PAPER;


export default defineBehaviour('hand', 'paper', {
  pose: 'lunge',
  enter(c, m) { c.gotAt = null; c.said2 = false; c.back = null; speak('paper', true); },
  tick(c, m, dt) {
    const x = m.x, o = c.o;
    if (!o || !world.bodies.has(o)) { c.o = null; c.joint = null; set('lurk'); return; }
    if (!c.joint) {   // reaching for it, in your hand
      if (!isHeld(o)) { c.o = null; c.cool = x.t + PA.COOL_MS; set('sulk'); speak('sulk'); return; }   // you took it away
      const w = o.body.getWorldCenter(), Hc = [w.x * S - scrollX, w.y * S - scrollY], q = gripPt();
      x.pose = POSES.eager; x.rate = PA.RATE; x.wig = 0.25;
      x.aim = Math.atan2(Hc[1] - c.y, Hc[0] - c.x); if (Math.cos(x.aim) > -0.2) x.aim = Math.PI; x.T = wristFor(Hc, x.aim);
      if (Math.hypot(q[0] - Hc[0], q[1] - Hc[1]) < PA.GRAB_PX) {   // got it: out of your hand and into its grip
        drop();
        o.body.getFixtureList().setFilterData(NO_HIT); o.body.setGravityScale(0); o.body.setAngularDamping(TUNE.physics.HELD_SPIN);
        c.joint = pinJoint(o.body, { x: w.x, y: w.y }, TUNE.hand.JOINT_HZ);
        c.gotAt = m.t; c.gotY = c.y;
        bus.emit('hand.mistook', { hand: o });
      } else if (m.t > PA.REACH_S) { c.o = null; c.cool = x.t + PA.COOL_MS; set('sulk'); speak('sulk'); }
      return;
    }
    if (isHeld(o)) { dropOld(c, o); c.cool = x.t + PA.COOL_MS; set('sulk'); speak('robbed', true); return; }   // you took it back
    const k = m.t - c.gotAt;
    if (c.back == null) {   // it holds it up and looks at it: then the penny drops
      x.pose = k < PA.PAUSE_S ? POSES.pinch : POSES.clamp; x.rate = 4; x.wig = 0.04; x.aim = Math.PI - 0.15; x.T = [Math.min(c.x, x.vw - 90), Math.max(110, c.gotY - 40)];
      if (k > PA.PAUSE_S && !c.said2) { c.said2 = true; speak('notpaper', true); }
      if (k > PA.THINK_S) {
        if (Math.random() < PA.EAT) { c.gotAt = 0; c.gotY = c.y; set('devour'); return; }   // it eats it anyway (devour says so)
        c.back = m.t; speak('giveback', true);
      }
      return;
    }
    // it hands it back: carried in from the edge and let go
    x.pose = POSES.clamp; x.rate = 3; x.wig = 0.04; x.aim = Math.PI; x.T = [x.vw - PA.BACK_PX, Math.min(x.vh - 120, c.gotY + 60)];
    if (m.t - c.back > PA.BACK_S) { dropOld(c, o); bus.emit('hand.returned', { hand: o }); c.cool = x.t + PA.COOL_MS; set('lurk'); }
  },
  leave(c, m) { c.back = null; },
});
export function install(app) {}
