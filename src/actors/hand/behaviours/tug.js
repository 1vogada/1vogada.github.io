// hand state "tug": tug of war with the pointer: strain, agony lines, drips; slip on a sharp yank, rip at the limit; keep if you let go.
// Legacy clawTick branch `c.st === 'tug'` (tick) and the post-chain block `c.st === 'tug' && c.o && c.o.tug && grab && grab.o === c.o`
// (hold), moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x; hold(c, m, x, H) runs after the easing.
import { defineBehaviour } from '../../../core/machine.js';
import { bus } from '../../../core/bus.js';
import { world } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set, speak, clamp01 } from '../index.js';
import { wristFor, tugDraw, slip, rip } from '../tug.js';

export default defineBehaviour('hand', 'tug', {
  pose: 'clamp',
  tick(c, m, dt) {
    const x = m.x, o = x.o, g = o.tug, { P, ripE, strainE } = x;
    if (!world.grab || world.grab.o !== o) {   // you let go: it has the whole card, which snaps back to its shape
      c.snap = { t: 0, s0: g.s, psi: g.psi }; o.hot = 0; o.body.setBullet(false); o.body.setGravityScale(0);
      set('has'); speak('keep', true);
    } else {
      x.strain = clamp01((g.e - strainE) / (ripE - strainE)); const pose = {}; for (const k in POSES.clamp) pose[k] = POSES.clamp[k] + (POSES.strain[k] - POSES.clamp[k]) * x.strain; x.pose = pose;
      x.rate = 30; x.shake = x.strain * 4; x.wig = 0.02 + x.strain * 0.06;
      const hh = [x.vw - x.HOLD, c.hy], give = Math.min(170, Math.max(0, g.e) * 0.35);   // the arm is dragged out a little as you pull
      let dx = P[0] - hh[0], dy = P[1] - hh[1], dl = Math.hypot(dx, dy) || 1, Hd = [hh[0] + dx / dl * give, hh[1] + dy / dl * give];
      dx = Hd[0] - P[0]; dy = Hd[1] - P[1]; dl = Math.hypot(dx, dy);
      if (dl < g.d0) { if (dl < 1) { dx = 1; dy = 0; dl = 1; } Hd = [P[0] + dx / dl * g.d0, P[1] + dy / dl * g.d0]; }   // push the card at it and the hand backs off
      x.aim = Math.atan2(P[1] - Hd[1], P[0] - Hd[0]); x.T = wristFor(Hd, x.aim);
    }
  },
  hold(c, m, x, H) {
    const grab = world.grab;
    if (!(c.o && c.o.tug && grab && grab.o === c.o)) return false;
    const t = x.t, dt = x.dt, { ripE, strainE } = x;
    const g = c.o.tug, Pp = [grab.cx + scrollX, grab.cy + scrollY];
    g.rip = ripE; tugDraw(c.o, Pp, H);
    if (g.e > 24) bus.emit('card.hurt', { card: c.o, pain: clamp01(g.e / ripE) });   // legacy cardSay(c.o, pain)
    const st = clamp01((g.e - strainE) / (ripE - strainE));
    if (g.e > strainE) {
      g.grip -= dt * (0.1 + 1.6 * st * st); speak('tug');
      if (st > 0.4 && t > (g.drip || 0)) { g.drip = t + 120; gore((Pp[0] + H[0]) / 2, (Pp[1] + H[1]) / 2, 0, 1, 2, 0.35); }   // it starts to drip before it goes
    } else g.grip = Math.min(1, g.grip + dt * 0.6);
    const h = grab.h, n = h.length;
    if (m.t < 0.45 && n > 1 && g.e > 30 && t - h[n - 1][2] < 60 && Math.hypot(h[n - 1][0] - h[n - 2][0], h[n - 1][1] - h[n - 2][1]) / Math.max(1, h[n - 1][2] - h[n - 2][2]) > 2) slip(Pp, H);
    else if (g.e > ripE || g.grip <= 0) rip(Pp, H);
    return true;
  },
});
export function install(app) {}
