// hand state "show": driven by a scene (Surprise me): goes where come()/to() say.
// Legacy clawTick branch `c.st === 'show'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { POSES } from '../poses.js';
import { wristFor } from '../tug.js';

// driven by the page (Surprise me): it goes where it is told, in the pose it is told
export default defineBehaviour('hand', 'show', {
  pose: 'eager',
  uncut: true,   // the blade does not take a scene's hand off
  tick(c, m, dt) {
    const x = m.x, s = c.show;
    x.pose = (typeof s.pose === 'object' ? s.pose : POSES[s.pose]) || POSES.eager;   // a pose by name, or a pose itself (rock, paper, scissors) x.rate = s.rate || 8; x.wig = s.wig ?? 0.15; x.aim = (s.aim ?? Math.PI) + (s.bob ? Math.sin(m.t * 9) * 0.08 : 0);
    x.T = s.tip && c.tip ? [c.x + s.x - c.tip[0], c.y + s.y - c.tip[1]] : wristFor([s.x, s.y + (s.bob ? Math.sin(m.t * 6) * 6 : 0)], x.aim);   // tip: put the pointing fingertip there
  },
});
export function install(app) {}
