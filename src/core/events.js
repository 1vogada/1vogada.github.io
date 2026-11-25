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
  'hand.said': '{ kind, ms } a hand line went up (kind: the key without "hand.")',
  'hand.grabbed': '{ card, how } (how: tug | catch | reach | snatch) it closed its fingers on a card (tug, catch, reach)',
  'hand.slipped': '{ card } its claws slid off',
  'hand.ripped': '{ mine, its } a card torn in half between you and it',
  'hand.tossed': '{ card, hard } it got bored of the card in its fist and threw it (before its "toss" line)',
  'hand.crushed': '{ at } a card crushed in its fist',
  'hand.ate': '{ card } it dragged a card off screen and ate it',
  'hand.severed': '{ x, y, a, pose, v, at, crushed } the blade went through the arm: spawn the cut-off hand here (page px, rad, pose, tip px/s)',
  'hand.regrown': '{ } a new hand grew',
  'hand.reaching': '{ card, fear, dt, t, x } every frame of the creep towards a card on the shelf (x: wrist, viewport px)',
  // ---- cut-off hands ----
  'sev.spawned': '{ hand } a cut-off hand body exists',
  'sev.state': '{ self, from, to, data } a cut-off hand changed state (emitted by core/machine.js for actor "sev"; from: null for the first)',
  'sev.gone': '{ hand } it left the world',
  // ---- shelf ----
  'shelf.opened': '{ y }',
  'shelf.closed': '{ }',
  // ---- scenes ----
  'slip.opened': '{ project, fortune }',
  'slip.closed': '{ how } how: "x" (No or the × pressed, or welcome back, while there is no hand to play the coin game: no __hand (reduced motion) or crazy mode; with a hand they start the game instead) | "secret" (the secret × in the corner) | "escape" | "hand" (the hand closed it, scenes/coin.js) | "backdrop"',
  'coin.tossed': '{ side, call } side: "heads" | "tails" | null (it did not bother)',
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
