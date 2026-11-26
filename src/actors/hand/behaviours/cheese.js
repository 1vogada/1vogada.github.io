// hand state "cheese": the cheese pull. It was dragging a card off the shelf (reach -> eat) when an old hand jumped on the other
// end (sev.cheese, src/reactions.js -> cheese() in ../index.js). Both pull; the card stretches between them like hot cheese
// (tugDraw, the card hurts) until it tears in two (TUNE.hand.CHEESE.TEAR_PX past its length): each keeps its half, the arm
// drags its own off to eat (eat), the old hand falls with the other (it crushes it where it lands). If the old hand lets go
// first (you pick it up, it is gone) the arm keeps the card whole and flicks the old hand away.
// The card is c.o (claimed 'hand' / 'target'); the old hand is c.old. The card's o.tug carries { cheese: the old hand, P: where
// the old hand holds it (page px), ...the tug of war's geometry }; the old hand puts itself at P (severed 'cheese').
// Emits 'hand.cheesed' { hand, mine, its } (mine: the old hand's half, or null when it lost) before the line.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, isHeld, toLocal, NO_HIT } from '../../../world/world.js';
import { set, speak } from '../index.js';
import { gripPt, untug } from '../tug.js';
import { page, grabAt as grab, pullGeom, surge, strained, tearOff } from '../pull.js';

const C = TUNE.hand.CHEESE;
/** the old hand let go first: the card is the arm's, whole */
function win(c, o, H) {
  const g = o.tug, old = c.old; untug(o, g.P, H); grab(c, o, H);
  c.old = null; set('eat'); bus.emit('hand.cheesed', { hand: old, mine: null, its: o }); speak('cheeseWon', true);
}

export default defineBehaviour('hand', 'cheese', {
  pose: 'strain',
  enter(c, m) {
    const o = c.o, old = c.old, H = page(gripPt()), P = old.ai && old.ai.tip ? old.ai.tip : H;
    if (c.joint) { world.b2.destroyJoint(c.joint); c.joint = null; }
    o.tug = { cheese: old, ...pullGeom(P, H, toLocal(o, P), toLocal(o, H), C.TEAR_PX) };
    o.body.getFixtureList().setFilterData(NO_HIT);
    c.hy = H[1] - scrollY; speak('cheese', true);
  },
  tick(c, m, dt) {
    const x = m.x, o = c.o, g = o && o.tug, old = c.old;
    if (!o || !g || !g.cheese) { c.old = null; set('lurk'); return; }
    if (!old || !world.bodies.has(old) || isHeld(old)) { win(c, o, page(gripPt())); return; }   // you took the old hand away
    // both pull, in surges: it a little more than the old one
    const pain = surge(x, g, C, m.t, 4 * Math.sin(m.t * 23));
    if (m.t > 1.2 && pain < 0.7) speak('cheese');
  },
  // after the easing: the card is drawn stretched between the old hand (P) and the grip (H); past TEAR_PX it gives
  hold(c, m, x, H) {
    const o = c.o, g = o && o.tug; if (!g || !g.cheese) return false;
    if (!strained(o, g, H) && m.t < C.MAX_S) return true;
    const old = c.old, halves = tearOff(c, o, g, H);
    if (!halves) { win(c, o, H); return true; }
    const { mine, its } = halves;
    c.old = null; set('eat');
    bus.emit('hand.cheesed', { hand: old, mine, its });
    speak('cheeseEnd', true);
    return true;
  },
  leave(c, m) { const o = c.o, g = o && o.tug; if (g && g.cheese && world.bodies.has(o)) { untug(o, g.P, page(gripPt())); o.body.getFixtureList().setFilterData(NO_HIT); } },
});
export function install(app) {}
