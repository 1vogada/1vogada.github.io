// The arm and its hand past the right edge (legacy claw*: clawInit, clawSet, notice, clawSay, clawTick, clawLetGo, sever,
// clawReset, snatch, window.__hand). STUB: API final.
//
// clawTick becomes: the pre-chain (init when the first card is torn, the "someone took what it held" check, grab tracking,
// the catch scan of thrown cards) -> machine('hand').step (one behaviour per state in ./behaviours, each returns its motion
// target { T, rate, aim, pose, wig, shake, strain }) -> the post-chain in legacy order: agitation decay, speech.flushLater,
// the react queue (notice), the flinch override, easing of x/y/a/pose, the held-card drawing (crush, tug, has), strands,
// the bubble's place, draw(), the sever check against world.blade.
// install(app): onTick 'hand', clock.hasWork/keepAwake(busy), defineSpeaker('arm', { gate: 'arm', extraCls: 'claw-say',
// layout: true, first: true, onSaid: emit 'hand.said' }), speech.addFirst(() => claw), own listener world.reset -> reset,
// hook('__hand', { get, draw, set, POSES, katanaSvg, come, to, say, grip, leave }).
// It never imports another actor: the shelf and the blade reach it through senses() (wired in src/reactions.js) and world.blade.

import { POSES } from './poses.js';

const todo = (name) => () => { throw new Error(`hand.${name}: not implemented`); };

export { POSES };
/** the claw record (legacy claw), made on first use */ export const get = todo('get');
/** legacy clawSet(st): restarts t, keeps it busy 1.5 s, emits 'hand.state' */ export const set = todo('set');
/** legacy clawDraw(wig, shake, strain) */ export const draw = todo('draw');
/** Surprise me: bring the grip to (x, y) viewport px in a pose; state 'show'. @returns {Promise<void>} */
export const come = todo('come');
/** move or re-pose while in 'show': { x, y, pose, rate, aim, bob, tip, wig } */ export const to = todo('to');
/** a forced line. @returns ms it stays up (0: held back a moment) */ export const say = todo('say');
/** the grip point, viewport px, or null */ export const grip = todo('grip');
/** done with the scene: back to 'sulk' */ export const leave = todo('leave');
/** it saw something (legacy notice(kind)): a remark after a random wait; draws Math.random (one draw, two when one is queued) */
export const notice = todo('notice');
/** the phrasebook borrows it: state 'book' (clawTick leaves it alone). @returns the claw record */ export const borrow = todo('borrow');
/** whatever it held is let go, whole (legacy clawLetGo) */ export const letGo = todo('letGo');
/** the blade went through the arm (legacy sever(q, v)): emits 'hand.severed' at the spawn point */ export const sever = todo('sever');
/** legacy clawReset */ export const reset = todo('reset');
/** the loop must keep running (legacy clawBusy minus sevBusy) */ export const busy = () => false;
/**
 * what it can sense of other actors, injected by src/reactions.js:
 * { shelfSnack() -> body|null, nearShelf(P) -> bool, onShelf(o) -> bool, want(v), shelf() -> state|null }
 */
let sensed = {};
export function senses(s) { sensed = s; }
/** what senses() was given (for the hand package) */ export const sense = () => sensed;
export function install(app) {}
