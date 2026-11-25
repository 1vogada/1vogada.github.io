// hand state "meet": the new hand leans out and looks at an old (cut-off) one in view, says so; lurk after MEET_S.
// The old hand stares back (reactions: hand.met -> severed 'stare'). tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { at, meet } from '../old.js';

const OLD = TUNE.hand.OLD;

export default defineBehaviour('hand', 'meet', {
  pose: 'eager',
  calm: true,
  enter(c, m) { const o = c.old; if (!o) return; meet(o); speak('meet', true); bus.emit('hand.met', { hand: o }); },
  tick(c, m, dt) {
    const x = m.x, o = c.old;
    if (!o || !world.bodies.has(o)) { c.old = null; set('lurk'); return; }
    const q = at(o), y = Math.max(90, Math.min(x.vh - 90, q[1] - 30));
    // it comes out a little, looks down at it, and its eye goes wide; then it points
    x.pose = m.t < 1.1 ? POSES.eager : POSES.point; x.rate = 4; x.wig = m.t < 1.1 ? 0.12 : 0.04;
    x.aim = Math.PI + Math.max(-0.7, Math.min(0.7, Math.atan2(q[1] - y, x.vw - q[0] + 1) * 0.6));
    x.T = [x.vw - 70, y]; c.ly = y;
    if (m.t > OLD.MEET_S) { c.old = null; c.cool = x.t + 600; set('lurk'); }
  },
});
export function install(app) {}
