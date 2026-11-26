// hand state "bite" (chain coin-keep): it has the kept coin (kind 'coin', page/coinbody.js), caught out of the air (catch.js) or
// taken off the shelf (reach.js). It pulls the coin over to itself, bites it like gold at TUNE.coinKeep.BITE_S ('hand.bit': the
// coin gets its tooth mark and complains), says "fake." (hand.fake; hand.fakeAgain from the second bite of the visit on) and flicks
// it back across the page ('hand.flicked'), then lurks and leaves coins alone for COOL_MS. Taken from it, or gone: it sulks.
// ../coin.js take(c, o, w, hy) is how catch.js and reach.js hand the coin over. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { wristFor } from '../tug.js';

const K = TUNE.coinKeep, P_ = TUNE.physics, H_ = TUNE.hand;

/** let go of it: the coin is an ordinary loose body again */
function letGo(c, o) {
  if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
  if (!o || !world.bodies.has(o)) return;
  o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1 | K.LEDGE_BIT, maskBits: 0xFFFF });
  o.body.setAngularDamping(P_.SPIN); o.body.setGravityScale(P_.FALL); o.el.style.pointerEvents = '';
}

export default defineBehaviour('hand', 'bite', {
  pose: 'pinch',
  enter(c) { c.bit = false; c.faked = false; },
  tick(c, m, dt) {
    const x = m.x, o = c.o;
    if (!o || !world.bodies.has(o) || (world.grab && world.grab.o === o)) { letGo(c, o); c.o = null; c.cool = x.t + H_.COOL.catch; set('sulk'); speak('sulk'); return; }
    const t = m.t, biting = t > K.BITE_S && t < K.BITE_S + K.BITE_LEN;
    x.pose = biting ? POSES.clamp : POSES.pinch; x.rate = K.RATE; x.wig = 0;
    x.aim = Math.PI + (biting ? Math.sin(t * 70) * 0.12 : Math.sin(t * 3) * 0.05); x.shake = biting ? 3 : 0;
    x.T = wristFor([x.vw - K.HOLD_PX, Math.max(110, Math.min(x.vh - 110, c.hy || x.vh / 2))], x.aim);
    if (!c.bit && t > K.BITE_S) { c.bit = true; bus.emit('hand.bit', { coin: o }); }   // chomp
    if (!c.faked && t > K.FAKE_S) { c.faked = true; c.bites = (c.bites || 0) + 1; speak(c.bites > 1 ? 'fakeAgain' : 'fake', true); }
    if (t > K.FLICK_S) {   // and back it goes
      letGo(c, o);
      o.body.setLinearVelocity({ x: K.FLICK[0], y: K.FLICK[1] }); o.body.setAngularVelocity(-K.FLICK_SPIN);
      c.o = null; bus.emit('hand.flicked', { coin: o });
      c.cool = x.t + K.COOL_MS; set('lurk');
    }
  },
});
export function install(app) {}
