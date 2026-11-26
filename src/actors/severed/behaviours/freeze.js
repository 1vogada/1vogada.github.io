// cut-off hand behaviour "freeze": crazy mode went off while it danced (or jived in your hand). It stops dead mid-move
// (FREEZE.STILL_S), then looks left and right (FREEZE.LOOKS turns, LOOK_S each, eye wide), then pretends nothing happened
// ('pretend', at PRETEND_S, a casual stance), and walks on at END_S facing the way it did. Held, it does all that in your hand.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { isHeld } from '../../../world/world.js';
import { set, say, POSES } from '../index.js';
import { easePose } from '../../../world/math.js';

const F = TUNE.dance.FREEZE;

export default defineBehaviour('sev', 'freeze', {
  pose: 'walk',
  up: true,
  held: true,   // picked up now, it keeps up the act (then held, once it walks on)
  enter(o, m) { const a = o.ai; a.vx = 0; a.hop = 0; a.wig = 0; a.poseSet = true; a.wasDir = a.dir; a.danced = false; a.said4 = false; a.gait = 'tiptoe'; say(o, 'freeze', true); },
  tick(o, m, dt) {
    const a = o.ai, hp = o.hand.pose; a.vx = 0; a.wig = 0; a.up = !isHeld(o);   // (in your hand: no legs reaching for the floor)
    if (m.t < F.STILL_S) return;   // stock still, mid-move
    const look = Math.floor((m.t - F.STILL_S) / F.LOOK_S);
    if (look < F.LOOKS) a.dir = look % 2 ? a.wasDir : -a.wasDir;   // a look over each shoulder
    else a.dir = a.wasDir;
    const want = m.t < F.PRETEND_S ? POSES.sneak : POSES.walk, kp = 1 - Math.exp(-dt * 8);
    easePose(hp, want, kp);
    if (!a.said4 && m.t > F.PRETEND_S) { a.said4 = true; say(o, 'pretend', true); }
    if (m.t > F.END_S) set(o, 'walk');
  },
  leave(o, m) { const a = o.ai; a.poseSet = false; if (a.wasDir != null) { a.dir = a.wasDir; a.wasDir = null; } },
});
export function install(app) {}
