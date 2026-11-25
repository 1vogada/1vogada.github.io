// cut-off hand behaviour "cower": safe on the shelf. It huddles in a fist and peeks. Gets up and walks on after HIDE.COWER_S,
// when the shelf goes, or when it is knocked about.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say, refuge, onRefuge } from '../index.js';

const HI = TUNE.severed.HIDE;

export default defineBehaviour('sev', 'cower', {
  pose: 'fist',
  enter(o, m) { o.ai.vx = 0; o.ai.off = 0; o.body.setAngularDamping(TUNE.severed.BODY.damping); say(o, 'safe', true); },
  tick(o, m, dt) {
    const a = o.ai; a.wig = Math.sin(m.t * 2.2) > 0.96 ? 0.4 : 0.02;   // a twitch now and then
    a.off = onRefuge(o) ? 0 : (a.off || 0) + dt;
    if (a.off > 0.6 && refuge()) { set(o, 'hide'); return; }   // it slid or fell off: try again
    if (!refuge() || m.t > HI.COWER_S || (m.t > 1 && o.body.getLinearVelocity().length() > 1.5)) set(o, 'rise');
  },
});
export function install(app) {}
