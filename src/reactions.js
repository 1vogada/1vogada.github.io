// Every rule that connects one feature to another, one line each. Features never call each other; they emit (src/core/events.js)
// and this file answers. Installed after every actor, so an actor's own listeners (its own line about what happened to it)
// always run first, and each reaction runs exactly where the legacy code made its cross-call.
//
// To add an interaction between existing features: add a line here. To change one: change its line here.

import { bus } from './core/bus.js';
import { TUNE } from './core/tune.js';
import { clock } from './core/clock.js';
import * as hand from './actors/hand/index.js';
import * as severed from './actors/severed/index.js';
import * as shelf from './actors/shelf.js';
import * as cards from './actors/cards.js';
import * as idle from './actors/hand/idle.js';
import * as katana from './actors/katana.js';
import * as welcome from './scenes/welcome-back.js';
import * as rps from './scenes/rps.js';
import * as toast from './page/toast.js';

const notMine = (o) => o.kind !== 'katana' && o.kind !== 'hand';

export const RULES = [
  // ---- the hand comments on what it sees (legacy notice(kind) calls) ----
  ['katana.dropped', () => hand.notice('kdrop')],                                  // drop(): after the katana's "kdrop"
  ['body.thrown', ({ body }) => notMine(body) && hand.notice('throw')],            // drop(): after the card's "throw"
  ['card.ripped', () => hand.notice('loose')],                                     // tear(): after "rip", before the first-rip toast
  ['card.snapped', () => hand.notice('loose')],                                    // snap(): after your half's scream (the hand sees a card leave the grid)
  ['card.smashed', () => hand.notice('smash')],                                    // shatter(): after the smash scream, before remove
  ['katana.drawn', () => hand.notice('katana')],                                   // freeKatana(): after "khello"
  ['katana.equipped', () => hand.notice('katana')],                                // equip(): after "khello"
  ['card.cut', () => hand.notice('cut')],                                          // endCut(): after "kcut" / the kbrag roll
  ['card.stabbed', () => hand.notice('stab')],                                     // endCut(): before the wound and the "stab" line
  // ---- the blade and the arm ----
  ['hand.severed', ({ x, y, a, pose, v }) => severed.spawn(x, y, a, pose, { v })],  // sever(): the cut-off hand drops where the hand was
  ['hand.said', ({ kind }) => kind === 'severed' && katana.loose() && katana.brag()], // sever(): after "MY HAND!!" the katana brags
  // ---- the new hand and the old (cut-off) one: rules in src/actors/hand/old.js ----
  ['hand.met', ({ hand: o }) => { const b = severed.brain(o); if (b && b.is('walk', 'rest', 'limp', 'rise', 'gloat')) severed.set(o, 'stare'); }],   // it stares back
  ['hand.met', ({ hand: o }) => rps.maybe(o)],                                     // ...and now and then they play rock, paper, scissors
  ['hand.devouring', ({ hand: o }) => severed.set(o, 'caught')],                                                // it flails and begs
  ['hand.dropped', ({ hand: o }) => { const b = severed.brain(o); if (b && b.is('caught')) severed.set(o, 'limp'); }],   // let go: it drops
  ['hand.prodding', ({ hand: o }) => { const b = severed.brain(o); if (b && b.is('walk')) severed.set(o, 'dead'); }],   // awake, it plays dead
  ['hand.poked', ({ hand: o, twitch }) => severed.poked(o, twitch)],                                             // ...and may twitch
  ['hand.mistook', ({ hand: o }) => severed.mistaken(o)],                                                        // taken for a card: it objects
  ['hand.returned', ({ hand: o }) => severed.returned(o)],                                                       // handed back: it drops
  ['hand.sewing', ({ hand: o }) => severed.set(o, 'home')],                                                      // dropped at the stump: it goes back on
  ['hand.devoured', () => severed.mourn(scrollX + document.documentElement.clientWidth - TUNE.severed.MOURN.EDGE_PX)],   // a small funeral
  ['shelf.opened', () => severed.scare()],                                                                       // met old hands hide on it
  ['sev.avenged', () => hand.cut()],                                                                              // revenge: the thrown katana takes the new hand off
  ['sev.state', ({ self, from, to }) => from === 'crush' && to === 'gloat' && hand.oldStole(self)],             // it ate a card: the arm saw that
  ['sev.state', ({ to }) => to === 'mirror' && hand.notice('mirror')],                                       // the mirror game: the arm notices it is being copied
  ['sev.state', ({ self, to }) => to === 'crush' && hand.wrest(self, self.ai.prey)],                        // tug of war: the arm may grab the other end
  ['hand.wrest', ({ hand: o, card }) => severed.wrest(o, card)],                                                // ...the old hand hangs on to its end
  ['hand.wrested', ({ hand: o, mine, its }) => severed.wrested(o, mine, !its)],                                // ...and crushes what it is left with
  ['sev.tower', ({ x, y }) => hand.peer(x, y)],                                    // the hand tower is up: the arm leans in to look
  ['sev.towerGrab', () => hand.pulled()],                                          // ...the top one has it by the wrist: they pull it out
  ['sev.towerFell', () => hand.towerFell()],                                       // ...it came down first: the arm laughs, or snaps back
  ['hand.shookOff', () => severed.shookOff()],                                     // ...it shook them off: they fly, and land in a heap
  // ---- the shelf ----
  ['hand.reaching', ({ card, fear, dt, t, x }) => cards.panic(card, fear, dt, t, x)], // reach: the card on the shelf panics, bystanders point
  ['hand.state', ({ from, to }) => { if (from === 'reach' && to === 'eat') { const c = hand.get(), g = hand.grip(); severed.pounce(c.o, g && [g[0] + scrollX, g[1] + scrollY]); } }],   // the cheese pull: an old hand may jump on the snack
  ['sev.cheese', ({ hand: o, card }) => hand.cheese(o, card)],                    // ...and the arm takes up the fight
  ['hand.cheesed', ({ hand: o, mine }) => severed.cheesed(o, mine)],              // half each, or the old hand is flicked off
  ['hand.ate', ({ card }) => card.ball && severed.regift(card)],                  // it ate the gift an old hand brought you
  // ---- the page ----
  ['data.loaded', () => clock.real.after(TUNE.surprise.WELCOME_MS, welcome.welcomeBack)],   // legacy setTimeout(welcomeBack, 900)
  ['ui.toast', ({ msg }) => toast.show(msg)],
  // ---- the old hand pokes you instead (idle-old: src/actors/severed/pester.js, src/actors/hand/behaviours/mine.js) ----
  ['sev.pestered', ({ hand: o, n }) => hand.pesterTurn(o, n)],                    // the old hand poked your still cursor: the arm's turn
  ['hand.pestered', ({ hand: o, n }) => o && severed.pesterTurn(o, n)],           // ...the arm poked it: the old hand's turn, a little sooner
];

export function install(app) {
  for (const [type, fn] of RULES) bus.on(type, fn);
  // what the hand can sense of the shelf (legacy: clawTick read shelfSnack / nearShelf / onShelf / shelf.want directly)
  hand.senses({ shelfSnack: () => shelf.snack(), nearShelf: (P) => shelf.near(P), onShelf: (o) => shelf.holds(o), want: (v) => shelf.want(v), shelf: () => shelf.state(), oldHands: () => severed.list,
    pester: () => severed.pestering() });   // an old hand poking your still cursor first (idle-old)
  severed.senses({ shelf: () => shelf.state(), onShelf: (o) => shelf.holds(o), arm: () => hand.shown(),   // a place to hide from the new hand; the new hand out to copy
    pointer: () => idle.pointer(), moved: () => idle.lastMove(),   // your pointer, for a gift
    armed: () => { const m = hand.brain(); return hand.awake() && !!m && !m.is('stump', 'regrow'); },   // a hand on the arm to take revenge on
    lurks: () => hand.lurks(), wrist: () => hand.wrist() });   // the arm out at the edge, and its wrist: for the hand tower   // a hand on the arm to take revenge on
}
