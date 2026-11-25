// cut-off hand behaviour "bow": at the spot where the new hand dragged another old hand off, it curls up and bows. One of the
// mourners (the first to bow, a.fun.said) says a few words. Then they all run: up onto the shelf if it is out (hide), else off
// to the left (walk, fleeing).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say, tickNow, refuge } from '../index.js';

const MO = TUNE.severed.MOURN;

export default defineBehaviour('sev', 'bow', {
  pose: 'rest',
  enter(o, m) { o.ai.vx = 0; },
  tick(o, m, dt) {
    const a = o.ai; a.vx = 0; a.wig = 0.02;
    if (m.t > MO.SAY_S && a.fun && !a.fun.said) { a.fun.said = true; say(o, 'mourn', true); }
    if (m.t > MO.BOW_S) {
      a.fun = null;
      if (refuge()) { set(o, 'hide'); return; }
      a.flee = tickNow() + MO.RUN_MS; a.dir = a.fd = -1; set(o, 'walk');
    }
  },
});
export function install(app) {}
