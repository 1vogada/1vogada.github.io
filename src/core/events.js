// The event catalogue: every type the bus may carry, with its payload. bus.emit() of a type that is not listed here
// throws while debugging (?debug or a strict bus in tests). Add a type here before emitting it; never rename one.
//
// Ordering rule (this is what keeps the refactor from changing behaviour): an actor says its OWN line first and emits the
// event after, at the exact point where the legacy code called notice() or the other actor. Listeners run synchronously in
// registration order: the actor's own listeners (registered in its install) run before src/reactions.js (installed after
// every actor). So a reaction that draws Math.random runs where the legacy cross-call ran.

export const EVENTS = {
  // ---- cards (body = a world body record, see src/world/world.js) ----
  'card.pulled': '{ card } a rooted card was taken hold of (legacy startPull, after its "pull" line)',
  'card.strained': '{ card, first } the pull passed STRAIN (first: the first time in this pull)',
  'card.sprangBack': '{ card } let go before the tear: the root pulls it home (after its "back" line)',
  'card.ripped': '{ card } torn out of the grid (legacy tear, after its "rip" line, before the toast)',
  'card.loosened': '{ card, left } a tug used up the root\'s grip and it gave one notch (after its "loosen" line); left: tugs still needed',
  'card.snapped': '{ mine, rest } yanked too far before the root was loose: torn in two (after your half\'s scream, before the toast)',
  'card.landed': '{ card, at, closing } a hard landing that did not break it',
  'card.smashed': '{ card, at, closing, pieces } shattered (after the smash scream, before the body is removed)',
  'card.cutting': '{ card, grid, at } the blade tip entered it (after the "cutting" scream). card: the body, or null for a card still in the grid; grid: that grid element, else null; at: the tip, page px',
  'card.cut': '{ card, at, pieces, held } cut in two by the blade (after the katana\'s own line)',
  'card.hurt': '{ card, pain } the arm is hurting it (tug past 24 px, or a squeeze): pain 0..1 picks the agony tier (legacy cardSay)',
  'card.begged': '{ card } the long pause of a crush, once per crush',
  'card.crushed': '{ card, at } crushed in the arm\'s fist (after the gore, before the body is removed and the arm\'s own line)',
  'card.stabbed': '{ card, grid, at, held } in and out by the same side (card: the body, or null for a card still in the grid; grid: that grid element, else null). Emitted BEFORE the wound is pushed and before the "stab" line',
  // ---- any body ----
  'body.added': '{ body } a body joined world.bodies',
  'body.removed': '{ body } about to leave: emitted after the grab is dropped and its bubble hushed, before destroyBody (legacy sevGone point)',
  'body.dropped': '{ body, speed } released by the pointer (any body, any speed)',
  'body.thrown': '{ body, speed } released faster than TUNE.physics.HOT (cards are hot from here on)',
  // ---- katana ----
  'katana.found': '{ } the fog was wiped off it',
  'katana.drawn': '{ katana } torn out of the banner (after "khello")',
  'katana.equipped': '{ katana } double-clicked into the hand (after "khello")',
  'katana.dropped': '{ katana } let go (after "kdrop", before the throw speed is applied)',
  'katana.sheathed': '{ katana } put back',
  'blade.moved': '{ from, to, speed, dt } the tip moved this frame (page px, px/s). Emitted once per frame by world/cut.js',
  // ---- the arm's hand ----
  'hand.state': '{ self, from, to, data } the arm changed state (legacy clawSet; emitted by core/machine.js for actor "hand"; from: null for the first)',
  'hand.said': '{ kind, ms, text } a hand line went up (kind: the key without "hand."; text: what the bubble says)',
  'hand.grabbed': '{ card, how } (how: tug | catch | reach | snatch) it closed its fingers on a card (tug, catch, reach)',
  'hand.slipped': '{ card } its claws slid off',
  'hand.rejected': '{ card } it batted a thrown scrap (a piece under TUNE.hand.PIECE_BIG of a card) straight back',
  'hand.ripped': '{ mine, its } a card torn in half between you and it',
  'hand.tossed': '{ card, hard } it got bored of the card in its fist and threw it (before its "toss" line)',
  'hand.crushed': '{ at } a card crushed in its fist',
  'hand.ate': '{ card } it dragged a card off screen and ate it',
  'hand.severed': '{ x, y, a, pose, v, at, crushed } the blade went through the arm: spawn the cut-off hand here (page px, rad, pose, tip px/s)',
  'hand.regrown': '{ } a new hand grew',
  'hand.met': '{ hand } the new hand leaned out to look at an old one (hand: the cut-off hand body), after its "meet" line',
  'hand.thief': '{ hand } it saw an old hand crush a card (that old hand may be eaten while awake for TUNE.hand.OLD.THIEF_MS)',
  'hand.devouring': '{ hand } it goes for an old hand (after its "devour" line)',
  'hand.prodding': '{ hand } it goes for an old hand that is awake, which plays dead (after its "prod" line)',
  'hand.poked': '{ hand, twitch } the bottom of a poke at an old hand playing dead; twitch: it gave itself away (one Math.random draw before)',
  'hand.mistook': '{ hand } it took an old hand you held out in the tease zone for a card, and has it out of your hand now',
  'hand.returned': '{ hand } it gave the old hand it took for a card back: let go of it, in from the edge',
  'hand.sewing': '{ hand } you let go of an old hand at its stump: the stump takes hold of it to put it back on',
  'hand.sewn': '{ } the old hand is back on the arm (its body removed just before): no new hand grows',
  'hand.dropped': '{ hand } it let go of an old hand before eating it (you took it, or it gave up)',
  'hand.devoured': '{ hand } it dragged an old hand off the screen and ate it (before the body is removed)',
  'hand.reaching': '{ card, fear, dt, t, x } every frame of the creep towards a card on the shelf (x: wrist, viewport px)',
  'hand.cheesed': '{ hand, mine, its } the cheese pull is over: the card tore in two (mine: the old hand\'s half, its: the arm\'s), or the old hand lost hold (mine: null, its: the whole card)',
  'hand.wrest': '{ hand, card } tug of war: it took the free end of a card an old hand was crushing (the old hand hangs on to the other end)',
  'hand.wrested': '{ hand, card, mine, its } the tug of war is over: torn in two (mine: the old hand\'s half, its: the arm\'s), or one slipped (the whole card in mine or its, null in the other)',
  // ---- cut-off hands ----
  'sev.spawned': '{ hand } a cut-off hand body exists',
  'sev.state': '{ self, from, to, data } a cut-off hand changed state (emitted by core/machine.js for actor "sev"; from: null for the first)',
  'sev.gone': '{ hand } it left the world',
  'sev.hitched': '{ hand, card } an old hand jumped on a card and hangs from it (the hitchhiker; after its "latch" line)',
  'sev.cheese': '{ hand, card } an old hand landed on the far end of a card the arm is dragging off the shelf (the cheese pull)',
  'sev.slipped': '{ hand, card } you clicked an old hand in a tug of war over a card: it slips and flies off (before its line)',
  'sev.gift': '{ hand, ball } an old hand put a crumpled ball of a card it crushed down below your cursor (a present)',
  'sev.flung': '{ hand, card } a hitchhiking old hand lost its grip and flies off (before it says "whee")',
  // ---- shelf ----
  'shelf.opened': '{ y }',
  'sev.avenged': '{ hand } an old hand threw the katana at the arm (severed avenge); reactions cut the new hand off',
  'shelf.closed': '{ }',
  // ---- scenes ----
  'slip.opened': '{ project, fortune }',
  'slip.closed': '{ how } how: "x" (No or the × pressed, or welcome back, while there is no hand to play the coin game: no __hand (reduced motion) or crazy mode; with a hand they start the game instead) | "secret" (the secret × in the corner) | "escape" | "hand" (the hand closed it, scenes/coin.js) | "backdrop"',
  'coin.tossed': '{ side, call } side: "heads" | "tails" | "edge" (it landed on its rim, 1 in 100) | null (it did not bother)',
  'rps.played': '{ hand, arm, old, you, winner } rock, paper, scissors: both showed (arm / old: rock | paper | scissors; you: you shouted the old hand\'s pick; winner: "arm" | "old" | null)',
  'scene.started': '{ name }',
  'scene.ended': '{ name, killed }',
  // ---- phrasebook ----
  'phrasebook.opened': '{ }',
  'phrasebook.closed': '{ }',
  // ---- page ----
  'mode.changed': '{ crazy }',
  'theme.changed': '{ dark }',
  'language.changed': '{ languages } null = all',
  'world.reset': '{ } "Put the cards back": emitted first, before any body is removed',
  'world.resized': '{ W, H } walls were rebuilt (emitted inside buildWalls after bodies were pulled back, before the loop wakes)',
  'kiri.flooded': '{ }',
  'data.loaded': '{ data } projects.json arrived and the grid rendered',
  'cards.rendered': '{ } the grid re-rendered (legacy "cards-rendered" DOM event)',
  'ui.toast': '{ msg } show a toast (actors cannot import page/toast.js)',
};

export const EVENT_TYPES = new Set(Object.keys(EVENTS));
export const isEvent = (type) => EVENT_TYPES.has(type);

export function install() {}
