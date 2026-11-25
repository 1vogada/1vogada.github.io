// cut-off hand behaviour "home": you let go of it at the arm's stump, and the stump is pulling it back on (hand.sewing,
// src/reactions.js). It goes along happily and says so. When the arm lets go of it any other way (you took it back) it drops
// limp; when it is on, its body is removed (body.removed -> gone()). ctx (m) gives t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { isFree } from '../../../core/claims.js';
import { say } from '../../../core/speech.js';
import { set } from '../index.js';

export default defineBehaviour('sev', 'home', {
  pose: 'held',
  enter(o, m) { o.ai.vx = 0; say(o, 'sev.home', { force: true, mode: 'plain' }); },   // (plain: it has only a moment left to say it, whatever it said last)
  tick(o, m, dt) { o.ai.wig = 0.12; if (isFree(o)) set(o, 'limp'); },
});
export function install(app) {}
