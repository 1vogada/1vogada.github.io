// cut-off hand behaviour "dizzy": it came down from a ride (whee) and lies where it landed, its eye rolling, for HITCH.DIZZY_S;
// then it gets up (rise).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say, POSES } from '../index.js';

const HI = TUNE.severed.HITCH;

export default defineBehaviour('sev', 'dizzy', {
  pose: 'limp',
  enter(o, m) { o.ai.vx = 0; o.ai.dz = false; o.body.setAngularDamping(TUNE.severed.BODY.damping); },
  tick(o, m, dt) {
    const a = o.ai, hp = o.hand.pose, L = POSES.limp, kp = 1 - Math.exp(-dt * 10);
    for (const key in L) hp[key] = (hp[key] || 0) + (L[key] - (hp[key] || 0)) * kp;
    hp.eye = 0.75 + 0.2 * Math.sin(m.t * 3.1); hp.pupil = 0.55 + 0.4 * Math.sin(m.t * 11); a.poseSet = true;   // the eye rolls
    a.wig = 0.12 + 0.1 * Math.sin(m.t * 7);
    if (!a.dz && m.t > 0.4) a.dz = !!say(o, 'dizzy', true);   // once the "whee" has had its moment
    if (m.t > HI.DIZZY_S) set(o, 'rise');
  },
  leave(o, m) { o.ai.poseSet = false; o.ai.wig = 0; },
});
export function install(app) {}
