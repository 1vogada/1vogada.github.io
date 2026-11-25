// cut-off hand behaviour "gloat": a little dance on the spot (1.5 s), then walk (or, with a ball of the card kept for you, gift).
// Legacy SEV.gloat, moved verbatim. ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { set } from '../index.js';
import { carry, putDown } from './gift.js';

// a little dance on the spot (then, if it kept a ball of the card for you, it brings it: gift)
export default defineBehaviour('sev', 'gloat', {
  pose: 'joy',
  up: true,
  enter(o, m) { const a = o.ai; a.vx = 0; a.gait = 'tiptoe'; },
  tick(o, m, dt) {
    const a = o.ai; a.hop = 0.16 * Math.abs(Math.sin(m.t * 9)); if (a.ball) carry(o);
    if (m.t > 1.5) { a.hop = 0; if (a.ball) { a.toGift = true; set(o, 'gift'); } else set(o, 'walk'); }   // with a ball of it kept for you: the gift
  },
  leave(o, m) { const a = o.ai; if (a.ball && !a.toGift) { putDown(o, false); a.ball = null; } a.toGift = false; },
});
export function install(app) {}
