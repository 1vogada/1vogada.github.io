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
import * as katana from './actors/katana.js';
import * as welcome from './scenes/welcome-back.js';
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
  ['hand.devouring', ({ hand: o }) => severed.set(o, 'caught')],                                                // it flails and begs
  ['hand.dropped', ({ hand: o }) => { const b = severed.brain(o); if (b && b.is('caught')) severed.set(o, 'limp'); }],   // let go: it drops
  ['hand.devoured', () => severed.mourn(scrollX + document.documentElement.clientWidth - TUNE.severed.MOURN.EDGE_PX)],   // a small funeral
  ['shelf.opened', () => severed.scare()],
  ['sev.avenged', () => hand.cut()],                                                                              // revenge: the thrown katana takes the new hand off                                                                       // met old hands hide on it
  ['sev.state', ({ self, from, to }) => from === 'crush' && to === 'gloat' && hand.oldStole(self)],             // it ate a card: the arm saw that
  // ---- the shelf ----
  ['hand.reaching', ({ card, fear, dt, t, x }) => cards.panic(card, fear, dt, t, x)], // reach: the card on the shelf panics, bystanders point
  // ---- the page ----
  ['data.loaded', () => clock.real.after(TUNE.surprise.WELCOME_MS, welcome.welcomeBack)],   // legacy setTimeout(welcomeBack, 900)
  ['ui.toast', ({ msg }) => toast.show(msg)],
];

export function install(app) {
  for (const [type, fn] of RULES) bus.on(type, fn);
  // what the hand can sense of the shelf (legacy: clawTick read shelfSnack / nearShelf / onShelf / shelf.want directly)
  hand.senses({ shelfSnack: () => shelf.snack(), nearShelf: (P) => shelf.near(P), onShelf: (o) => shelf.holds(o), want: (v) => shelf.want(v), shelf: () => shelf.state(), oldHands: () => severed.list });
  severed.senses({ shelf: () => shelf.state(), onShelf: (o) => shelf.holds(o),   // a place to hide from the new hand
    armed: () => { const m = hand.brain(); return hand.awake() && !!m && !m.is('stump', 'regrow'); } });   // a hand on the arm to take revenge on
}
