// hand state "grope" (chain blind-fog): the kiri flood covers the page and it cannot see. "who turned the lights off": it
// pats its way slowly up and down the right edge, fingers spread, muttering now and then. It does not tease, catch, lunge or
// snatch what it cannot see, so a card carried past it is safe. A hole wiped round its hand (index.js sight(): c.blind off)
// and it sees you: "THERE you are", and it shoots out for whatever you hold (snatch, c.seen lets it finish in the fog);
// holding nothing it lurks. The flood lifting: it blinks and lurks.
// Entered from lurk, eager, poke, reach, lunge and snatch when blind() (index.js). tick(c, m, dt) sets the motion target on m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak, snatch, sense, big } from '../index.js';

const B = TUNE.blindFog;

export default defineBehaviour('hand', 'grope', {
  pose: 'eager',
  calm: true,   // nothing to lose: it holds nothing
  enter(c, m) {
    c.o = null;
    const mid = innerHeight / 2, A = Math.max(1, mid - B.MARGIN);
    c.gropePh = Math.asin(Math.max(-1, Math.min(1, (c.ly - mid) / A)));   // start from where it is
    c.gropeSaid = 0;
    speak('dark', !c.groped);   // the first time in this flood it always says so
    c.groped = (c.groped || 0) + 1;
  },
  tick(c, m, dt) {
    const x = m.x, { held, vw, vh } = x;
    const flood = sense().flooded;
    if (!flood || !flood()) { set('lurk'); speak('light', true); return; }   // the lights are back
    if (!c.blind) {   // a hole round its hand: it sees you
      speak('there', true); c.seen = x.t;
      if (held && big(held) && !c.peace) snatch(held); else set('lurk');   // (after the uprising's truce it only looks)
      return;
    }
    const mid = vh / 2, A = Math.max(1, mid - B.MARGIN), y = mid + A * Math.sin(c.gropePh + m.t * 2 * Math.PI / B.PERIOD_S);
    c.ly = y;
    x.pose = POSES.eager; x.rate = B.RATE; x.wig = B.WIG;
    x.aim = Math.PI + Math.sin(m.t * B.PAW_HZ * 2 * Math.PI) * B.PAW;   // pawing at the dark
    x.T = [vw - B.EDGE_PX, y];
    if (m.t - c.gropeSaid > B.MUTTER_S) { c.gropeSaid = m.t; speak('grope'); }   // unforced: the gate may drop it
  },
});
export function install(app) {}
