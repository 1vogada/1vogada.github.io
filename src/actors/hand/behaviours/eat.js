// hand state "eat": drags its catch off the right edge and eats it.
// Legacy clawTick branch `c.st === 'eat'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { remove } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';

// it drags its half off the screen
export default defineBehaviour('hand', 'eat', {
  pose: 'joy',
  tick(c, m, dt) {
    const x = m.x, o = x.o, vw = x.vw;
    x.pose = POSES.joy; x.rate = c.x < vw - 380 ? 1.7 : 5; x.T = [c.x < vw - 380 ? c.x + 300 : vw + 420, c.y];   // from far away it drags its catch back across the screen at a walk
    if (c.x > vw + 190 || !o) {
      if (o) { remove(o); c.o = null; c.joint = null; gore(vw - 6 + scrollX, c.y + scrollY, -1, 0, 16, 0.8); speak(o.ball ? 'burp' : 'eat', true); bus.emit('hand.ate', { card: o }); }   // a ball of paper goes down with a burp
      c.cool = x.t + TUNE.hand.COOL.eat; set('lurk');
    }
  },
});
export function install(app) {}
