// hand state "lurk": follows a held card up and down; eager when it is brought into the tease zone (not near the shelf); otherwise eyes the shelf for 700 ms and reaches.
// Legacy clawTick branch `c.st === 'lurk'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TIMING } from '../../../core/tune.js';
import { set, speak, shelf } from '../index.js';
import { look } from '../old.js';

export default defineBehaviour('hand', 'lurk', {
  pose: 'lurk',
  busy: false, busyUntil: true,   // legacy clawBusy: lurk keeps the loop awake only until c.until (1.5 s after set)
  calm: true,      // the lost-card check does not sulk
  catches: true,   // the catch scan runs
  idle: true,      // remarks are said, and the flinch leans in
  tick(c, m, dt) {
    const x = m.x, { held, P, t } = x;
    if (held) { c.ly += (Math.max(80, Math.min(x.vh - 80, P[1])) - c.ly) * (1 - Math.exp(-dt * 3)); if (t > c.cool && P[0] > x.Z.tease && !shelf.near(P)) { set('eager'); speak('eager'); c.patience = TIMING.span(TIMING.wait.tease) / 1000; } }
    else {   // nobody is holding anything: an old (cut-off) hand to meet or to eat? is there something lying on the shelf?
      if (look(c, x)) return;
      const q = shelf.snack(); if (shelf.state()) shelf.want(!!q);
      if (!q) c.eyed = null; else if (q !== c.eyed) { c.eyed = q; c.eyedAt = t; } else if (t > c.cool && t - c.eyedAt > 700) { c.o = q; c.eyed = null; set('reach'); speak('shelf', true); }
    }
  },
});
export function install(app) {}
