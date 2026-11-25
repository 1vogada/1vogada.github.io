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
    const x = m.x, { held, P, vw } = x, teased = m.t >= TIMING.wait.teaseMin / 1000;   // it lunges or snatches only after this much teasing
    x.pose = POSES.eager; x.wig = 0.34; x.rate = 9;
    if (!held) set('sulk');
    else if (shelf.near(P)) set('lurk');   // you are putting it on the shelf: it pulls back and waits for you to look away
    else if (P[0] < x.Z.tease - 60) { if (Math.random() < H_.SNATCH_CHANCE && teased && P[0] > vw - Math.min(H_.SNATCH_REACH[0], vw * H_.SNATCH_REACH[1])) snatch(held); else { set('sulk'); speak('sulk', true); } }   // teased: it sulks, or (after TIMING.wait.teaseMin of teasing) it loses its temper
    else if (m.t > c.patience && P[0] < vw - x.NEAR) { if (Math.random() < H_.SNATCH_AGAIN) snatch(held); else { c.patience = m.t + TIMING.span(TIMING.wait.teaseAgain) / 1000; speak('eager', true); } }
    else {
      // in the catch zone it grabs at once (Ivo 2026-11-25); in the tease zone it lunges only after the 2 s tease, close to the edge
      c.ly = Math.max(80, Math.min(x.vh - 80, P[1])); x.T = [vw - 10, P[1]]; x.aim = Math.atan2(P[1] - c.y, P[0] - c.x); if (Math.cos(x.aim) > -0.4) x.aim = Math.PI;
      // brought close: a tug of war for a whole card; a piece is not worth one, it just takes it
      if (P[0] > x.Z.grab || (c.far && teased && P[0] > vw - x.NEAR)) { if (held.kind !== 'card') snatch(held); else { c.o = held; c.pre = pre(held); set('lunge'); } } else if (m.t > 2.6) speak('eager');
    }
  },
});
export function install(app) {}
