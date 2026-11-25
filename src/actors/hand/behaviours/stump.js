// hand state "stump": the hand was cut off: the arm whips back, spurting; regrow after 8 s.
// Carry an old hand about meanwhile and the stump comes out for it; let go of it with its palm where the hand belongs
// (TUNE.hand.SEW.PX) and it is sewn back on (sew.js): no new hand grows.
// Legacy clawTick branch `c.st === 'stump'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { gore } from '../../../world/fx.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set } from '../index.js';
import { at } from '../old.js';

const SEW = TUNE.hand.SEW;

// no hand: the arm whips back out of sight, spurting, and stays away until a new one has grown
export default defineBehaviour('hand', 'stump', {
  pose: 'lurk',
  tick(c, m, dt) {
    const x = m.x, t = x.t;
    x.rate = 7; x.T = [x.vw + 300, c.ly]; x.shake = m.t < 1.2 ? 6 : 0;
    if (m.t < 1.6 && t > (c.drip || 0)) { c.drip = t + 60; gore(c.x + scrollX, c.y + scrollY, -Math.cos(c.a) * -1, -Math.sin(c.a) * -1, 3, 0.5); }
    const g = world.grab, carried = g && g.o.kind === 'hand' && g.moved ? g.o : null;
    if (carried) {   // you carry an old hand: the stump comes out for it
      c.sewing = carried;
      if (m.t > SEW.AFTER_S) { x.rate = SEW.RATE; x.shake = 0; x.T = [x.vw - SEW.OUT_PX, Math.max(90, Math.min(x.vh - 90, g.cy))]; }
    } else if (c.sewing) {   // you let go of it: close enough to where the hand belongs, and it goes back on
      const o = c.sewing; c.sewing = null;
      if (world.bodies.has(o) && m.t > SEW.AFTER_S) {
        const q = at(o), d = Math.hypot(q[0] - (c.x + SEW.PALM_PX * Math.cos(c.a)), q[1] - (c.y + SEW.PALM_PX * Math.sin(c.a)));
        if (d < SEW.PX) { c.stumpT = m.t; c.o = o; set('sew'); return; }
      }
    }
    if (m.t > TUNE.hand.STUMP_S) { c.stump = false; c.pose = { ...POSES.sulk }; set('regrow'); bus.emit('hand.regrown', {}); }
  },
});
export function install(app) {}
