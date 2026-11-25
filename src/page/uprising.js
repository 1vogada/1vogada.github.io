// The uprising (chain): three features that each work alone (Revenge: severed behaviours/avenge.js; the hand tower:
// severed/tower.js + hand behaviours/peer, pulled; Sew it back on: hand behaviours/stump, sew, sewn) become one story when
// they happen in this order on one visit. This module only keeps count, from the bus, and says when a step is reached:
//   0 nothing yet
//   1 revenge      'sev.avenged' (an old hand threw the katana and took the new hand off)
//   2 tower        'sev.towerGrab' after that (the tower has the arm by the wrist). src/reactions.js -> hand.uproot(): it
//                  shakes them off so hard its own hand flies off, and the stump lies out on the page ('spent')
//   3 sewn         'hand.sewn' after that (an old hand back on the arm; on the page, or at the stump later). reactions ->
//                  hand.truce(): back at the edge it says "fine. truce." ('hand.truce') and snatches nothing for the rest of
//                  the visit
//   4 truce        'hand.truce': a toast to match ('toast.truce')
// Each step emits 'uprising.step' { step: 'revenge' | 'tower' | 'sewn' | 'truce', hand } (src/reactions.js: an old hand
// cheers, severed cheer()). Steps out of order do not count (a sew without the tower before it is just a sew). The count
// lives as long as the page (a visit); "Put the cards back" does not undo it. Draws no random numbers (the toast's list draws
// one, on step 4 only). Test hook: __uprising.stage().
import { bus } from '../core/bus.js';
import { line } from '../core/lines.js';
import { hook } from '../core/debug.js';

const STEPS = ['', 'revenge', 'tower', 'sewn', 'truce'];
let n = 0;

/** how far the story has got: '' | 'revenge' | 'tower' | 'sewn' | 'truce' */
export const stage = () => STEPS[n];

function reach(i, hand) {
  if (n !== i - 1) return false;
  n = i; bus.emit('uprising.step', { step: STEPS[i], hand: hand || null });
  return true;
}

export function install(app) {
  if (app && app.reduced) return;   // no bodies, no arm
  bus.on('sev.avenged', ({ hand }) => reach(1, hand));
  bus.on('sev.towerGrab', () => reach(2));
  bus.on('hand.sewn', () => reach(3));
  bus.on('hand.truce', () => { if (reach(4)) bus.emit('ui.toast', { msg: line('toast.truce') }); });
  hook('__uprising', { stage, set: (s) => { const i = STEPS.indexOf(s); if (i >= 0) n = i; } });
}
