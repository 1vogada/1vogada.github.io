// The physics world and its shared state (legacy: the ~20 closure variables at the top of cardPhysics()).
// STUB: the API is final; the bodies are filled in by the world package. Functions throw 'not implemented' only when called.
//
// Legacy closure variable  ->  here
//   pl, loading, load()             world.pl, load()
//   world, ground, wallFx           world.b2, world.ground (walls are private to buildWalls)
//   layer (#phys), size             world.layer, world.size { W, H }
//   objs                            world.bodies (Set, insertion order = legacy objs order; the speech layout and every scan use it)
//   rootOf, ripped                  world.rootOf (grid card element -> its rooted body), world.ripped (keys of torn-out cards)
//   press, grab                     world.press, world.grab (read them; only drag.js writes them, through hold()/drop())
//   hits, blasts                    world.hits, world.blasts (queued by begin-contact, drained in the 'impacts'/'blasts' steps)
//   bits, wounds                    fx.js (world.bits is the same array, for __cards.bits)
//   tick (stroke tick), screamed    cut.js
//   katObj                          world.blade: the body whose tip cuts (the katana actor sets it with setBlade). The hand reads
//                                   world.blade for the sever check and the severed hand for fleeing: actors never import katana.js
//   smashed, resetBtn, suppress     world.smashed, showReset(), world.suppress
//   loopOn/last/acc, hiddenAt/away  core/clock.js
//   claw, sevs, shelf               the actors (hand, severed, shelf); the world never reads them. remove() emits 'body.removed'
//                                   (legacy sevGone and katObj = null), buildWalls() emits 'world.resized' (legacy shelfOff/shelfOn)
//
// A body record (legacy `o`): { kind: 'card' | 'piece' | 'shard' | 'katana' | 'hand', body (planck Body), el, w, h, ex, ey,
//   px, py, pa (pose before the last step, for interpolation), key?, root? { x, y } (m), grip?, strained?, hot? (ms), die? (ms),
//   poly? (local outline px), born? (stroke tick), say?, said?, lvl?, tug?, sq?, tips?, tipWas?, tipDt?, open?, ... }
// Owners keep their own scratch on the record (o.tug: hand, o.sq: severed, o.ai/o.hand: severed); others ask core/claims.js.

import { TUNE } from '../core/tune.js';

const todo = (name) => () => { throw new Error(`world.${name}: not implemented`); };

export const S = TUNE.physics.S;
export const DT = TUNE.physics.DT;

/**
 * @typedef {object} Grab  legacy `grab`
 * @property {object} o        the body record held
 * @property {object} joint    planck MouseJoint
 * @property {number} id       pointerId (-1: equipped by double-click)
 * @property {number} cx       pointer clientX now   @property {number} cy
 * @property {number} sx       clientX at the grab   @property {number} sy
 * @property {number} hx       grab point, m (page)  @property {number} hy
 * @property {boolean} moved   moved more than TUNE.drag.MOVE_PX
 * @property {Array<[number, number, number]>} h   recent pointer samples [pageX, pageY, now()]
 * @property {boolean} [sticky] an equipped katana: pointer-up does not drop it
 * @property {number} [edge]   ms rested at a screen edge (autoscroll)
 */

/** the shared world state. Fields are live; reassigned only by the world package */
export const world = {
  S, DT,
  /** planck namespace once loaded, else null */ pl: null,
  /** planck World */ b2: null,
  /** static body holding walls and the shelf */ ground: null,
  /** the #phys layer element (bodies, bubbles, particles live in it) */ layer: null,
  /** page size the walls enclose */ size: { W: 0, H: 0 },
  /** every body record, in insertion order (legacy objs) */ bodies: new Set(),
  /** grid card element -> its rooted body while pulled or springing back */ rootOf: new Map(),
  /** data-keys of cards torn out of the grid */ ripped: new Set(),
  /** @type {Grab|null} */ grab: null,
  /** a pointer press on a grid card that has not started a pull yet */ press: null,
  /** the katana body whose tip cuts, or null */ blade: null,
  /** queued impacts and shoves, drained after world.step */ hits: [], blasts: [],
  /** particles (fx.js) */ bits: [],
  /** cards smashed this visit (toasts at 1 and 10) */ smashed: 0,
  /** the click after a drag is swallowed */ suppress: false,
  /** prefers-reduced-motion: no physics at all */ reduced: false,
};

/** load planck (lazily, legacy load()). @returns {Promise<object>} the planck namespace */
export const load = todo('load');
/** create the world, ground, #phys layer, walls and contact listener once (legacy init()) */
export const init = todo('init');
/** rebuild the walls around the page (legacy buildWalls); emits 'world.resized' */
export const buildWalls = todo('buildWalls');
/** make o a dynamic body and add it (legacy addBody). @returns o */
export const add = todo('add');
/** take o out: drop it if held, hush its bubble, emit 'body.removed', destroy (legacy remove) */
export const remove = todo('remove');
/** take hold of o at page px with a mouse joint (legacy hold). e: { pointerId, clientX, clientY } */
export const hold = todo('hold');
/** let go (legacy drop). Without e: unconditional. Emits body.dropped / body.thrown / katana.dropped / card.sprangBack */
export const drop = todo('drop');
/** a held free body: full gravity, bullet, held damping, 'grabbed' class (legacy carry) */
export const carry = todo('carry');
/** @returns {boolean} the pointer holds o */
export const isHeld = (o) => !!world.grab && world.grab.o === o;
/** page px of local point q (px from the body centre). @returns {[number, number]} */
export const toPage = todo('toPage');
/** local px of page point q. @returns {[number, number]} */
export const toLocal = todo('toLocal');
/** o's outline in page px (legacy worldPoly) */
export const worldPoly = todo('worldPoly');
/** the card's rectangle as a local outline (legacy rectPoly) */
export const rectPoly = todo('rectPoly');
/** a copy of a grid card for the physics layer (legacy cloneCard) */
export const cloneCard = todo('cloneCard');
/** a piece of src with outline poly, same pose (legacy fragment). @returns the new body record */
export const fragment = todo('fragment');
/** a grid card cut where it stands comes loose on the spot (legacy freeCard). @returns the body record */
export const freeCard = todo('freeCard');
/** show "Put the cards back" (legacy showReset) */
export const showReset = todo('showReset');
/** "Put the cards back" (legacy resetAll): emits 'world.reset' first, then removes every body */
export const reset = todo('reset');
/** the body whose tip cuts (the katana actor calls it) */
export function setBlade(o) { world.blade = o; }
/** crazy mode is on (no physics, no hand) */
export const isCrazy = () => typeof document !== 'undefined' && document.documentElement.classList.contains('crazy');

export function install(app) {}
