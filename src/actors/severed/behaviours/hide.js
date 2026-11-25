// cut-off hand behaviour "hide": a scared old hand (it has met the new hand, or just saw one eaten) runs for the secret shelf
// when it is out (refuge(), sensed through src/reactions.js): under it, it leaps up (leap). On the shelf the new hand cannot
// get it. Gives up after HIDE.S and walks on.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say, refuge, onRefuge } from '../index.js';
import { GAIT, head } from '../gait.js';

const S = TUNE.physics.S, HI = TUNE.severed.HIDE;

export default defineBehaviour('sev', 'hide', {
  pose: 'run',
  up: true,
  enter(o, m) { const a = o.ai; a.gait = 'run'; o.body.setAngularDamping(0.5); a.saidHide = !!a.tries; },
  tick(o, m, dt) {
    const a = o.ai, sh = refuge();
    if (!sh || m.t > HI.S) { a.tries = 0; set(o, 'walk'); return; }
    if (onRefuge(o)) { set(o, 'cower'); return; }
    const p = o.body.getPosition(), x = p.x * S, y = p.y * S, dx = sh.x1 + HI.LAUNCH_PX - x;   // it runs to a spot just right of the shelf's end
    if (y - sh.y > HI.MAX_DY) { a.tries = 0; set(o, 'walk'); return; }   // the shelf is far up the page: out of reach
    if (!a.saidHide) { a.saidHide = true; say(o, 'hide', true); }
    a.stuck = Math.abs(o.body.getLinearVelocity().x) < 0.25 ? (a.stuck || 0) + dt : 0;
    if ((Math.abs(dx) < HI.IN_PX || a.stuck > HI.STUCK_S) && y > sh.y) { a.stuck = 0; set(o, 'leap'); return; }   // there, or something is in the way: jump for it
    head(a, dx < 0 ? -1 : 1); a.vx = a.dir * GAIT.run.speed; a.wig = 0.05;
  },
});
export function install(app) {}
