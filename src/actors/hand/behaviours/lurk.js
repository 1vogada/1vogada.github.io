// hand state "lurk": follows a held card up and down; eager when it is brought into the tease zone (not near the shelf); otherwise eyes the shelf for 700 ms and reaches. Blind in the kiri flood (blind-fog): it gropes instead (grope.js).
// hand state "lurk": follows a held card up and down; eager when it is brought into the tease zone (not near the shelf); otherwise eyes the shelf for 700 ms and reaches (the kept coin before any card, actors/shelf.js snack(); hand.shelfCoin).
// The mouse still for TUNE.hand.IDLE.MS: poke, or 'mine' when an old hand is already poking the cursor (old.js rival()).
// After the truce (c.peace, the uprising): a held card only gets a remark now and then, never taken; no shelf reach, no "not paper".
// Legacy clawTick branch `c.st === 'lurk'`, moved verbatim. tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE, TIMING } from '../../../core/tune.js';
import { set, speak, shelf, big, blind } from '../index.js';
import { look, jealous, mistake, rival } from '../old.js';
import { still } from '../idle.js';

export default defineBehaviour('hand', 'lurk', {
  pose: 'lurk',
  busy: false, busyUntil: true,   // legacy clawBusy: lurk keeps the loop awake only until c.until (1.5 s after set)
  calm: true,      // the lost-card check does not sulk
  catches: true,   // the catch scan runs
  idle: true,      // remarks are said, and the flinch leans in
  tick(c, m, dt) {
    const x = m.x, { held, P, t } = x;
    if (blind()) { set('grope'); return; }   // blind-fog: the kiri flood round it, it cannot see a thing
    if (c.truce) { set('truce'); return; }   // the uprising: an old hand is back on, time to make peace (truce.js)
    if (c.peace && held) {   // truce: it eyes the card, and leaves it
      c.ly += (Math.max(80, Math.min(x.vh - 80, P[1])) - c.ly) * (1 - Math.exp(-dt * 3));
      if (P[0] > x.Z.tease && t > (c.tempted || 0)) { c.tempted = t + TUNE.uprising.TEMPT_MS; speak('tempted', true); }
      return;
    }
    if (held) { c.ly += (Math.max(80, Math.min(x.vh - 80, P[1])) - c.ly) * (1 - Math.exp(-dt * 3)); if (t > c.cool && P[0] > x.Z.tease && !shelf.near(P)) { if (!big(held)) { c.cool = t + TUNE.hand.COOL.small; set('sulk'); speak('small', true); return; }   // a scrap: it turns its nose up
      set('eager'); speak('eager'); c.patience = TIMING.span(TIMING.wait.tease) / 1000; } }
    else {   // nobody is holding anything: an old (cut-off) hand to meet or to eat? is there something lying on the shelf?
      if (!c.peace && mistake(c, x)) return;   // an old hand held out in the tease zone like a card: it takes it for one
      jealous(c, t);   // (unless you carry an old hand around: long enough, and the arm is jealous)
      if (look(c, x)) return;
      if (t > c.cool && still(t)) {   // the mouse has not moved for a while: is anybody there?
        const r = rival(); if (!r) { set('poke'); return; }
        if (r.poked) { c.rival = r.hand; set('mine'); return; }   // an old hand got there first: that's ITS job (mine.js); (not yet poked: it waits)
      }
      const q0 = shelf.snack(), q = q0 && big(q0) ? q0 : null; if (shelf.state()) shelf.want(!!q);
      if (!q) c.eyed = null; else if (q !== c.eyed) { c.eyed = q; c.eyedAt = t; } else if (t > c.cool && t - c.eyedAt > 700 && !c.peace) { c.o = q; c.eyed = null; set('reach'); speak(q.kind === 'coin' ? 'shelfCoin' : 'shelf', true); }
    }
  },
});
export function install(app) {}
