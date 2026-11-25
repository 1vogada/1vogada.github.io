// cut-off hand behaviour "stare": the arm grew a new hand and leans out to look at this one (hand.met, src/reactions.js).
// It stops, gets up on its fingers, turns to face the right edge and stares; says "meet"; walk after STARE_S, facing as before (or, with the shelf out, it runs to hide there).
// ctx (m) gives t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say, refuge } from '../index.js';

const SV = TUNE.severed;

export default defineBehaviour('sev', 'stare', {
  pose: 'sneak',   // wide eye, small pupil
  up: true,
  enter(o, m) { const a = o.ai; a.vx = 0; a.gait = 'tiptoe'; a.wasDir = a.dir; a.dir = 1; a.said2 = false; a.met = true; o.body.setAngularDamping(0.5); },
  tick(o, m, dt) {
    const a = o.ai; a.vx = 0; a.wig = m.t < 0.4 ? 0.4 : 0.02;
    if (m.t > SV.STARE_SAY_S && !a.said2) { a.said2 = true; say(o, 'meet', true); }
    if (m.t > SV.STARE_S) set(o, refuge() ? 'hide' : 'walk');   // scared now: if the shelf is out, it runs for it
  },
  leave(o, m) { const a = o.ai; if (a.wasDir != null) { a.dir = a.wasDir; a.wasDir = null; } },
});
export function install(app) {}
