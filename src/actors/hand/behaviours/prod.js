// hand state "prod": it went for an old hand that is awake (walking about; ./old.js look(), a TUNE.hand.OLD.AWAKE chance), and
// that one plays dead (reactions: hand.prodding -> severed 'dead'): it flops over with X eyes. The arm hovers over it, fingertip
// down, and pokes it twice (PROD.POKE_S). A poke makes it twitch with chance PROD.TWITCH (hand.poked): caught out, the arm
// grabs it (devour). It holds still through both: the arm gives up, puzzled (lurk), and leaves it alone for PROD.COOL_MS.
// Tap it before that and it springs up and runs: the arm sulks, tricked. Pick it up and the arm is robbed, as in devour.
// tick(c, m, dt) sets the motion target on the frame's ctx m.x. The old hand is c.o (claimed 'hand' / 'target').
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, isHeld } from '../../../world/world.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { at } from '../old.js';

const OLD = TUNE.hand.OLD, PR = OLD.PROD;

export default defineBehaviour('hand', 'prod', {
  pose: 'point',
  calm: true,
  enter(c, m) { c.pokes = 0; c.poked = false; c.caughtAt = null; speak('prod', true); bus.emit('hand.prodding', { hand: c.o }); },
  tick(c, m, dt) {
    const x = m.x, o = c.o;
    if (!o || !world.bodies.has(o)) { c.o = null; set('lurk'); return; }
    const st = o.ai.st;
    if (st === 'held') { c.o = null; c.cool = x.t + OLD.COOL; set('sulk'); speak('robbed', true); return; }   // you picked it up
    if (st !== 'dead' && !isHeld(o)) { c.o = null; c.cool = x.t + OLD.COOL; set('sulk'); speak('tricked', true); return; }   // it sprang up and ran
    if (c.caughtAt != null) {   // it twitched: a beat of triumph, then it takes it
      x.pose = POSES.joy; x.rate = 5; x.wig = 0.3; x.T = [c.x, c.y];
      if (m.t - c.caughtAt > PR.CAUGHT_S) { c.gotcha = true; set('devour'); }
      return;
    }
    // hover over it, fingertip down; a poke takes the fingertip down to it and back
    const q = at(o), P0 = [q[0], q[1] - 18];
    let aim = Math.atan2(P0[1] - c.y, P0[0] - c.x); if (Math.cos(aim) > -0.2) aim = Math.PI;
    const k = c.pokes < PR.POKE_S.length ? (m.t - PR.POKE_S[c.pokes]) / PR.POKE_LEN : -1, dip = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0, lift = PR.HOVER_PX * (1 - dip);
    const P = [P0[0] - Math.cos(aim) * lift, P0[1] - Math.sin(aim) * lift], tip = c.tip || [c.x - 120, c.y];
    x.pose = POSES.point; x.rate = dip ? 14 : PR.RATE; x.wig = 0.04; x.aim = aim; x.T = [c.x + P[0] - tip[0], c.y + P[1] - tip[1]];
    if (k >= 0.5 && !c.poked) {   // the bottom of a poke: does it twitch? (one draw a poke)
      c.poked = true; const twitch = Math.random() < PR.TWITCH;
      bus.emit('hand.poked', { hand: o, twitch });
      if (twitch) { c.caughtAt = m.t; speak('gotcha', true); return; }
    }
    if (k >= 1) { c.pokes++; c.poked = false; }
    if (m.t > PR.DONE_S) { c.o = null; c.cool = x.t + PR.COOL_MS; set('lurk'); speak('fooled', true); }   // it held still: dead, then
  },
  leave(c, m) { c.poked = false; },
});
export function install(app) {}
