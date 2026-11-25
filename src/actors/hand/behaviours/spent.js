// hand state "spent" (the uprising, src/page/uprising.js): the old hands' tower pulled the arm out onto the page, and it shook
// them off so hard that its own new hand flew off too (pulled.js). Now it lies there, a stump, far out of its corner, sinking a
// little and asking for a hand (TUNE.uprising: SPENT_S, DROOP_*, NAG_MS). Carry an old hand near it and the stump lifts towards
// it (REACH_PX); let go of it with its palm where the hand belongs (TUNE.hand.SEW.PX, as stump.js) and it is sewn back on
// (sew.js -> sewn.js: the arm slinks home). Nobody brings one within SPENT_S: it whips back out of sight as a plain stump
// (stump.js: a new hand grows, or you sew one on there). tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { gore } from '../../../world/fx.js';
import { world } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { at } from '../old.js';

const SEW = TUNE.hand.SEW, U = TUNE.uprising;

export default defineBehaviour('hand', 'spent', {
  pose: 'sulk',
  enter(c, m) { c.spent = { x: c.x, y: c.y, nag: U.SPENT_SAY_S * 1000 }; c.sewing = null; },
  tick(c, m, dt) {
    const x = m.x, t = x.t, p = c.spent || (c.spent = { x: c.x, y: c.y, nag: 0 });
    const y0 = Math.min(x.vh - 60, p.y + U.DROOP_PX * (1 - Math.exp(-m.t * U.DROOP_RATE)));
    x.rate = 3; x.aim = Math.PI + 0.25 + Math.sin(m.t * 1.3) * 0.06; x.pose = POSES.sulk; x.shake = m.t < 0.6 ? 4 : 0; x.T = [p.x, y0];
    if (m.t < 1.2 && t > (c.drip || 0)) { c.drip = t + 90; gore(c.x + scrollX, c.y + scrollY, -1, 0.3, 2, 0.4); }
    if (m.t * 1000 > p.nag) { const first = !p.said; p.said = true; p.nag = m.t * 1000 + U.NAG_MS; speak('spent', first); }   // the first one forced, then unforced
    const g = world.grab, carried = g && g.o.kind === 'hand' && g.moved ? g.o : null;
    if (carried) {   // you carry an old hand: the stump lifts towards it
      c.sewing = carried;
      const dx = g.cx - p.x, dy = g.cy - y0, d = Math.hypot(dx, dy) || 1, k = Math.min(U.REACH_PX, d * 0.25) / d;
      x.T = [p.x + dx * k, y0 + dy * k]; x.rate = SEW.RATE; x.shake = 0; x.aim = Math.PI;
    } else if (c.sewing) {   // you let go of it: close enough to where the hand belongs, and it goes back on
      const o = c.sewing; c.sewing = null;
      if (world.bodies.has(o)) {
        const q = at(o), d = Math.hypot(q[0] - (c.x + SEW.PALM_PX * Math.cos(c.a)), q[1] - (c.y + SEW.PALM_PX * Math.sin(c.a)));
        if (d < SEW.PX) { c.stumpT = 0; c.o = o; c.spent = null; set('sew'); return; }
      }
    }
    if (m.t > U.SPENT_S) { c.spent = null; c.sewing = null; set('stump'); }   // nobody came: home, a plain stump
  },
  leave(c, m) { c.spent = null; },
});
export function install(app) {}
