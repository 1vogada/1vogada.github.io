// hand state "mine" (chain idle-old): the mouse has been still for TUNE.hand.IDLE.MS, and an old (cut-off) hand got to your
// cursor first and is already poking it (src/actors/severed/pester.js; lurk asks old.js rival()). The arm creeps out to do
// its job, stops short and says "hey. that's MY job". Then they take turns: it pokes (the fingertip from RIVAL.STOP_PX to the
// right of the cursor onto it and back), emits 'hand.pestered' { hand, n }, and waits for the old hand's poke ('sev.pestered'
// -> pesterTurn() in ../index.js -> c.reply), each answer a little sooner (TUNE.severed.PESTER.RALLY, the same pace both
// ways) and each poke quicker, until you move the mouse: it whips back out of sight (lurk, cooling off as after a poke).
// If the old hand stops answering (picked up, eaten, gone), it carries on poking alone every RIVAL.SOLO_S.
// c.rival: the old hand; c.rv: { said, turnAt, tapAt, dur, hit, n, waitFrom } (m.t seconds); c.reply: the old hand's last poke n.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { pointer, lastMove } from '../idle.js';

const I = TUNE.hand.IDLE, RV = TUNE.hand.RIVAL, RALLY = TUNE.severed.PESTER.RALLY;
const gap = (n) => Math.max(RALLY.MIN_MS, RALLY.GAP_MS * Math.pow(RALLY.DECAY, n)) / 1000;

export default defineBehaviour('hand', 'mine', {
  pose: 'point',
  calm: true,
  enter(c, m) { c.pokeFrom = lastMove(); c.pokeBack = 0; c.reply = null; c.rv = { said: false, turnAt: null, tapAt: null, dur: RV.TAP_S, hit: false, n: 0, waitFrom: 0 }; },
  tick(c, m, dt) {
    const x = m.x, P = pointer(), rv = c.rv;
    if (c.pokeBack) {   // caught: back out of sight
      x.pose = POSES.lurk; x.rate = 22; x.T = [x.vw + 260, c.ly];
      if (m.t - c.pokeBack > 0.45) { c.cool = x.t + I.COOL_MS; c.rival = null; set('lurk'); }
      return;
    }
    if (!P || lastMove() !== c.pokeFrom || x.held) { c.pokeBack = m.t; speak('pesterBack', true); return; }
    if (m.t > RV.MAX_S) { c.cool = x.t + I.COOL_MS; c.rival = null; set('sulk'); return; }
    if (c.reply != null && rv.said && rv.tapAt == null) { rv.n = Math.max(rv.n, c.reply); rv.turnAt = m.t + gap(rv.n); c.reply = null; }   // the old hand poked: its turn
    const near = m.t > RV.CREEP_S;
    if (near && !rv.said) { rv.said = true; speak('pesterMine', true); rv.turnAt = m.t + RV.SAY_S; c.reply = null; }   // the job is taken
    if (rv.said && rv.tapAt == null && rv.turnAt == null && m.t - rv.waitFrom > RV.SOLO_S) rv.turnAt = m.t;   // nobody answers: alone, then
    if (rv.turnAt != null && m.t >= rv.turnAt) { rv.turnAt = null; rv.tapAt = m.t; rv.hit = false; rv.dur = Math.max(RV.TAP_MIN_S, RV.TAP_S * Math.pow(RALLY.DECAY, rv.n)); }
    let off = RV.STOP_PX;   // the fingertip waits this far to the right of the cursor
    if (rv.tapAt != null) {
      const u = Math.min(1, (m.t - rv.tapAt) / rv.dur); off = RV.STOP_PX * Math.max(0, 1 - Math.sin(Math.PI * u) * RV.FLAT);   // (on the cursor a moment)
      if (u >= 0.5 && !rv.hit) {   // poke
        rv.hit = true; rv.n += 1; if (rv.n > 2) speak('pesterTurn');
        bus.emit('hand.pestered', { hand: c.rival, n: rv.n });
      }
      if (u >= 1) { rv.tapAt = null; rv.waitFrom = m.t; }
    }
    x.pose = POSES.point; x.rate = rv.tapAt != null ? RV.RATE : near ? RV.RATE / 2 : 3; x.wig = rv.said ? 0.08 : 0.04;
    x.aim = Math.PI + Math.max(-0.5, Math.min(0.5, (P[1] - c.ly) / 600));
    const tip = c.tip || [c.x - 120, c.y];
    x.T = [c.x + (P[0] + off) - tip[0], c.y + P[1] - tip[1]];
  },
  leave(c, m) { c.rv = null; c.reply = null; },
});
export function install(app) {}
