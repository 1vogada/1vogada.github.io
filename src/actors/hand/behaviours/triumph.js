// hand state "triumph": waves its half after a rip; eat after 1.4 s; slip if you grab its half.
// Legacy clawTick branch `c.st === 'triumph'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { wristFor } from '../tug.js';

export default defineBehaviour('hand', 'triumph', {
  pose: 'joy',
  tick(c, m, dt) {
    const x = m.x, o = x.o;
    x.pose = POSES.joy; x.rate = 16; x.wig = 0.05; x.aim = Math.PI + Math.sin(m.t * 16) * 0.14; x.T = wristFor([x.vw - x.HOLD - 30, c.hy - 50 + Math.sin(m.t * 16) * 22], x.aim);
    if (world.grab && world.grab.o === o) { world.b2.destroyJoint(c.joint); c.joint = null; c.o = null; o.body.setAngularDamping(TUNE.physics.HELD_SPIN); c.cool = x.t + 1200; set('sulk'); speak('slip', true); bus.emit('hand.slipped', { card: o }); }
    else if (m.t > 1.4 && o) { o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0 }); o.el.style.pointerEvents = 'none'; set('eat'); }
    else if (!o) set('lurk');
  },
});
export function install(app) {}
