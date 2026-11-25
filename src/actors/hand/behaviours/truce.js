// hand state "truce" (the uprising, src/page/uprising.js): an old hand has been sewn back on after the tower pulled the arm
// out. Back at its edge it comes out a little (TUNE.uprising.OUT_PX), looks at it all, sighs, and says "fine. truce." after
// TRUCE_SAY_S (emits 'hand.truce': the toast and the old hands' cheer); lurks after TRUCE_S. From truce() in ../index.js on,
// c.peace is set: for the rest of the visit it snatches nothing (no eager / snatch / lunge, no shelf reach, no tug of war,
// no "not paper", no eating old hands); it still catches what you throw it. tick(c, m, dt) sets the motion target on m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';

const U = TUNE.uprising;

export default defineBehaviour('hand', 'truce', {
  pose: 'sulk',
  uncut: true,   // not in the middle of making peace
  enter(c, m) { c.truce = false; c.truced = false; },
  tick(c, m, dt) {
    const x = m.x;
    x.T = [x.vw - U.OUT_PX, c.ly]; x.rate = 4; x.wig = 0.15;
    x.pose = m.t < U.TRUCE_SAY_S ? POSES.sulk : POSES.lurk; x.aim = Math.PI + (m.t < U.TRUCE_SAY_S ? 0.2 : -0.15);   // head down, then up: palm open
    if (m.t > U.TRUCE_SAY_S && !c.truced) { c.truced = true; speak('truce', true); bus.emit('hand.truce', {}); }
    if (m.t > U.TRUCE_S) set('lurk');
  },
});
export function install(app) {}
