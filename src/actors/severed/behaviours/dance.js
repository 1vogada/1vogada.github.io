// cut-off hand behaviour "dance": crazy mode is on (../dance.js groove): it stops where it is and dances on the spot, up on its
// two finger-legs. On every beat (../dance.js beat(), the scrolling tab title's) one foot steps out to the side and back, the body
// dips, the free fingers snap into the next of TUNE.dance.MOVES (jazz hands, a point, a fist, a happy eye), and it sways two
// beats right, two left; every SPIN_EVERY beats it spins round on the spot (the gait's turning animation). Picked up it keeps
// dancing in your hand (heldAs: jive). groove(false) sends it to freeze. Says 'dance' when the music starts, then now and then.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { GAIT } from '../gait.js';
import { say, tickNow } from '../index.js';
import { beat } from '../dance.js';

const D = TUNE.dance;

export default defineBehaviour('sev', 'dance', {
  pose: 'joy',
  up: true,
  heldAs: 'jive',   // picked up: it does not stop (./jive.js)
  enter(o, m) {
    const a = o.ai; a.vx = 0; a.gait = 'tiptoe'; a.poseSet = true; a.beat = null; a.hunting = false; a.food = null;
    o.body.setAngularDamping(0.5);
    a.chat = tickNow();
  },
  tick(o, m, dt) {
    const a = o.ai, h = o.hand, t = tickNow(), { n, u } = beat(t);
    if (n !== a.beat) {   // the beat: a foot steps out (even beats) or back in (odd), and now and then a spin
      a.beat = n;
      const g = GAIT[a.gait], ks = a.feet ? Object.keys(a.feet) : [], k = ks[n % 2], f = k != null && a.feet[k];
      if (f && !f.sw) {
        const p = o.body.getPosition(), x1 = p.x * TUNE.physics.S + a.fd * g.home[k] + (n % 2 ? 0 : (k === ks[0] ? 1 : -1) * a.fd * D.STEP_PX);
        Object.assign(f, { sw: 1, u: 0, x0: f.x, y0: f.y, x1, y1: f.y });
      }
      if (n % D.SPIN_EVERY === 0 && m.t > 1) a.dir = -a.dir;
    }
    const want = D.MOVES[((n % D.MOVES.length) + D.MOVES.length) % D.MOVES.length], kp = 1 - Math.exp(-dt * D.POSE_RATE);
    for (const key in want) h.pose[key] = (h.pose[key] || 0) + (want[key] - (h.pose[key] || 0)) * kp;
    a.hop = D.DIP * (1 - u) * (1 - u);
    a.vx = (Math.floor(n / 2) % 2 ? -1 : 1) * D.SHUFFLE;
    a.wig = D.WIG;
    if (!a.danced) a.danced = !!say(o, 'dance', true);   // when the music starts (once its last line has had its moment)
    else if (t - a.chat > D.SAY_MS) { a.chat = t; say(o, 'dance'); }
  },
  leave(o, m) { const a = o.ai; a.poseSet = false; a.hop = 0; a.vx = 0; a.wig = 0; },
});
export function install(app) {}
