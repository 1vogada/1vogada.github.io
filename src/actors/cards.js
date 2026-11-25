// The cards: rooted in the grid, pulled, torn out, thrown; what they say (legacy startPull, tear, the strain/rip lines,
// panic, cards-rendered). STUB: API final.
// install(app): defineSpeaker('card', { kinds: ['card', 'piece', 'shard'], prefix: 'card.', gate: 'card', anchor })
//   (anchor = legacy draw(): above the rotated box, TUNE.speech.RIDE_DY, offset by the held-body correction),
//   drag.onPull(startPull), own listeners: body.thrown -> 'card.throw' (not for katana or hand bodies), card.sprangBack ->
//   'card.back', cards.rendered -> drop rooted bodies and re-hide torn cards, world.reset -> regrow the grid cards.

const todo = (name) => () => { throw new Error(`cards.${name}: not implemented`); };

/** a press became a pull: root body at the slot, hold it, say 'card.pull', emit 'card.pulled' (legacy startPull) */
export const startPull = todo('startPull');
/** the root tore: clone into the layer, full collisions, say 'card.rip', emit 'card.ripped', first-rip toast (legacy tear) */
export const tear = todo('tear');
/**
 * a card on the shelf while the hand creeps up (legacy panic(o, fear, dt, t)): shakes, hops, says 'card.panic' (agony mode),
 * bystanders shiver and one in three (after TIMING.gap.notme) says 'card.notme'. handX: the wrist's viewport x.
 * Keeps the crowd / notme cooldowns that legacy kept on the claw object.
 */
export const panic = todo('panic');
/** legacy cardSay(o, pain): say(o, 'card.agony', { mode: 'agony', pain }) */
export const agony = todo('agony');
export function install(app) {}
