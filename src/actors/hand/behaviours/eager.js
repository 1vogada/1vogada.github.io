// hand state "eager": a card held in its zone: says eager, snatches when teased or out of patience, lunges when the card is brought close.
// Legacy clawTick branch `c.st === 'eager'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE, TIMING } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak, snatch, shelf } from '../index.js';
import { pre } from '../tug.js';

const H_ = TUNE.hand;

export default defineBehaviour('hand', 'eager', {
  pose: 'eager',
  catches: true,   // the catch scan runs
  tick(c, m, dt) {
    const x = m.x, { held, P, vw } = x;
    x.pose = POSES.eager; x.wig = 0.34; x.rate = 9;
    if (!held) set('sulk');
    else if (shelf.near(P)) set('lurk');   // you are putting it on the shelf: it pulls back and waits for you to look away
    else if (P[0] < x.Z.tease - 60) { if (Math.random() < H_.SNATCH_CHANCE) snatch(held); else { set('sulk'); speak('sulk', true); } }   // teased: it sulks, or it loses its temper
    else if (m.t > c.patience && P[0] < vw - x.NEAR) { if (Math.random() < H_.SNATCH_AGAIN) snatch(held); else { c.patience = m.t + TIMING.span(TIMING.wait.teaseAgain) / 1000; speak('eager', true); } }
    else {
      c.ly = Math.max(80, Math.min(x.vh - 80, P[1])); x.T = [vw - 10, P[1]]; x.aim = Math.atan2(P[1] - c.y, P[0] - c.x); if (Math.cos(x.aim) > -0.4) x.aim = Math.PI;
      if (c.far && P[0] > vw - x.NEAR) { c.o = held; c.pre = pre(held); set('lunge'); } else if (m.t > 2.6) speak('eager');
    }
  },
});
export function install(app) {}
