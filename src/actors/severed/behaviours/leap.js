// cut-off hand behaviour "leap": next to the shelf's end, it jumps straight up to HIDE.UP_PX over the shelf; once clear of it
// (CLEAR_PX), a push sideways lands it HIDE.LAND_PX in from the end. Landed on it: cower. Missed: run for it again (hide), HIDE.TRIES times, then it gives up (walk).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, refuge, onRefuge } from '../index.js';

const S = TUNE.physics.S, HI = TUNE.severed.HIDE;

export default defineBehaviour('sev', 'leap', {
  pose: 'held',
  enter(o, m) {
    const a = o.ai, sh = refuge(); if (!sh) return;
    const b = o.body, p = b.getPosition(), g = TUNE.physics.GRAVITY * b.getGravityScale(), h = Math.max(0.5, (p.y * S - sh.y + HI.UP_PX) / S);
    b.setLinearVelocity({ x: 0, y: -Math.sqrt(2 * g * h) }); b.setAngularVelocity(a.dir * -2); b.setAwake(true);   // straight up, past the shelf's end
    a.kick = false; a.tries = (a.tries || 0) + 1;
  },
  tick(o, m, dt) {
    const a = o.ai, sh = refuge(); a.wig = 0.5;
    if (sh && !a.kick) {   // clear of the shelf: a push sideways, onto it
      const b = o.body, p = b.getPosition(), v = b.getLinearVelocity();
      if (p.y * S + HI.CLEAR_PX < sh.y || v.y > 0) { a.kick = true; const g = TUNE.physics.GRAVITY * b.getGravityScale(), t = (-v.y + Math.sqrt(Math.max(0, v.y * v.y + 2 * g * Math.max(0.1, (sh.y - 30 - p.y * S) / S)))) / g;
        b.setLinearVelocity({ x: (Math.min(sh.x1 - HI.LAND_PX, (sh.x0 + sh.x1) / 2) - p.x * S) / S / Math.max(0.25, t), y: v.y }); }
    }
    if (m.t > 0.3 && onRefuge(o) && o.body.getLinearVelocity().length() < 2) { a.tries = 0; set(o, 'cower'); return; }   // landed on it
    if (m.t > HI.LEAP_S) { if (a.tries >= HI.TRIES) { a.tries = 0; set(o, 'walk'); } else set(o, 'hide'); }
  },
});
export function install(app) {}
