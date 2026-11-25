// cut-off hand behaviour "jive": you picked it up while it danced (the dance's heldAs). It does not stop: the fingers keep
// snapping to the beat in your grip, wriggling hard, and it begs you not to stop the music. Let go: back to the dance while
// crazy mode lasts (it lands first: limp, then ../dance.js picks it up again), else limp. groove(false) sends it to freeze.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { isHeld } from '../../../world/world.js';
import { set, say, tickNow } from '../index.js';
import { beat } from '../dance.js';

const D = TUNE.dance;

export default defineBehaviour('sev', 'jive',  {
  pose: 'held',
  held: true,   // a state you hold it in: the held check leaves it alone
  enter(o, m) { const a = o.ai; a.poseSet = true; a.chat = tickNow(); say(o, 'jive', true); },
  tick(o, m, dt) {
    const a = o.ai, h = o.hand, t = tickNow(), { n, u } = beat(t);
    if (!isHeld(o)) { a.born = t - 4000; set(o, 'limp'); return; }
    const want = D.MOVES[((n % D.MOVES.length) + D.MOVES.length) % D.MOVES.length], kp = 1 - Math.exp(-dt * D.POSE_RATE);
    for (const key in want) if (key !== 'legs') h.pose[key] = (h.pose[key] || 0) + (want[key] - (h.pose[key] || 0)) * kp;
    h.pose.legs = (h.pose.legs || 0) * (1 - kp);
    a.wig = D.HELD_WIG * (0.6 + 0.4 * (1 - u));
    if (t - a.chat > D.HELD_SAY_MS) { a.chat = t; say(o, 'jive'); }
  },
  leave(o, m) { o.ai.poseSet = false; o.ai.wig = 0; },
});
export function install(app) {}
