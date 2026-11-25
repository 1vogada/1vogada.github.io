// hand state "sewn": the old hand is back on (sew.js). It shows it off, flexing it, says so after SEW.SAY_S; lurk after
// SEW.SHOW_S. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';

const H_ = TUNE.hand, SEW = H_.SEW;

export default defineBehaviour('hand', 'sewn', {
  pose: 'sulk',
  uncut: true,   // not again right away
  enter(c, m) { c.shown = false; },
  tick(c, m, dt) {
    const x = m.x;
    x.pose = m.t < 0.8 ? POSES.sulk : m.t < 1.6 ? POSES.eager : POSES.joy; x.rate = 5; x.wig = m.t < 0.8 ? 0.6 : 0.3;
    x.aim = Math.PI + Math.sin(m.t * 4) * 0.25; x.T = [x.vw - 60, c.ly];
    if (m.t > SEW.SAY_S && !c.shown) { c.shown = true; speak('sewn', true); }
    if (m.t > SEW.SHOW_S) { c.shown = false; c.cool = x.t + H_.COOL.regrow; set('lurk'); }
  },
});
export function install(app) {}
