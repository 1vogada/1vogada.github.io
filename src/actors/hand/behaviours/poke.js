// hand state "poke": the mouse has been still for TUNE.hand.IDLE.MS (Ivo: 10 s). The hand creeps out, puts one fingertip
// on the cursor, taps it and asks "…hello?". Move the mouse and it whips back out of sight (lurk). Only from lurk, so only
// after a card has left its slot, never in a scene or in crazy mode. Blind in the kiri flood (blind-fog): it gropes (grope.js).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak, blind } from '../index.js';
import { pointer, lastMove } from '../idle.js';

const I = TUNE.hand.IDLE;

export default defineBehaviour('hand', 'poke', {
  pose: 'point',
  calm: true,
  enter(c, m) { c.pokeFrom = lastMove(); c.pokeSaid = false; c.pokeBack = 0; },
  tick(c, m, dt) {
    const x = m.x, P = pointer();
    if (blind() && !c.pokeBack) { set('grope'); return; }   // blind-fog: the flood rolled in, it lost the cursor
    if (c.pokeBack) {   // caught: it whips back out of sight
      x.pose = POSES.lurk; x.rate = 22; x.T = [x.vw + 260, c.ly];
      if (m.t - c.pokeBack > 0.45) { c.cool = x.t + I.COOL_MS; set('lurk'); }
      return;
    }
    if (!P || lastMove() !== c.pokeFrom || x.held) { c.pokeBack = m.t; if (m.t > 0.6) speak('idleback', true); return; }
    // creep up to it, then tap: the fingertip goes to the cursor and back a few px
    const near = m.t > I.CREEP_S, tap = near ? Math.max(0, Math.sin((m.t - I.CREEP_S) * 9)) * 9 : 0;
    x.pose = POSES.point; x.rate = near ? 10 : 1.6; x.wig = 0.04; x.aim = Math.PI + Math.max(-0.5, Math.min(0.5, (P[1] - c.ly) / 600));
    const tip = c.tip || [c.x - 120, c.y];
    x.T = [c.x + (P[0] + tap * 0.7) - tip[0], c.y + (P[1] + tap * 0.4) - tip[1]];
    if (near && !c.pokeSaid) { c.pokeSaid = true; speak('idle', true); }
    if (m.t > I.GIVE_UP_S) { c.cool = x.t + I.COOL_MS; set('sulk'); }
  },
});
export function install(app) {}
