// cut-off hand behaviour "caught": the new hand is coming for it, or has it (hand.devouring, src/reactions.js). It flails and
// begs. You can save it by picking it up (that is 'held'); when the arm lets go of it any other way (the arm is cut off, it
// gives up) it drops limp. ctx (m) gives t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { isFree } from '../../../core/claims.js';
import { set, say } from '../index.js';

export default defineBehaviour('sev', 'caught', {
  pose: 'held',
  enter(o, m) { say(o, 'doomed', true); },
  tick(o, m, dt) {
    const a = o.ai; a.wig = 0.7;
    if (isFree(o)) { set(o, 'limp'); return; }   // the arm let go (cut off, gave up)
    if (m.t > 1.2) say(o, 'doomed');
  },
});
export function install(app) {}
