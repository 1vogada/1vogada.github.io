// A hand that has been cut off is its own creature (legacy SEV table, sevSpawn, sevGone, sevSet, sevSay, sevTick, sevFood,
// sevUnsquash, window.__sev). STUB: API final.
// Its brain is core/machine.js: machine('sev', o, 'limp', { switched: (o, m) => { o.ai.up = !!m.def.up }, entered: (o) =>
// { o.body.setAwake(true); clock.wake() } }). One file per behaviour in ./behaviours.
// install(app): onTick 'severed', clock.hasWork/keepAwake(() => any hand not resting), defineSpeaker('severed',
// { kinds: ['hand'], gate: 'severed', extraCls: 'claw-say', anchor }), own listeners: hand.severed is wired in reactions.js;
// body.removed of a hand -> gone(o); body.thrown of a hand faster than HOT -> say(o, 'sev.thrown', { force: true }),
// hook('__sev', { list, SEV, POSES, set, spawn, say, cut }).

import { TUNE } from '../../core/tune.js';

const todo = (name) => () => { throw new Error(`severed.${name}: not implemented`); };

/** every cut-off hand body (legacy sevs) */ export const list = new Set();
/** its poses (legacy SEV_POSE) */ export const POSES = TUNE.severed.POSES;
/**
 * a new cut-off hand (legacy sevSpawn(px, py, a, pose)); a fourth makes the oldest burst.
 * opts.v: [vx, vy] px/s of the blade: sets the legacy fling velocity and the random spin right after the spawn.
 * @returns the body record
 */
export const spawn = todo('spawn');
/** it left the world (legacy sevGone): machine.end(), SVGs removed, emits 'sev.gone' */ export const gone = todo('gone');
/** legacy sevSet(o, st) */ export const set = todo('set');
/** legacy sevSay(o, kind, force) = speech.say(o, 'sev.' + kind, { force }) */ export const say = todo('say');
/** legacy __sev.cut(): cut the arm's hand off now (tests) */ export const cut = todo('cut');
/** legacy sevFood(q): a card or big piece it may hunt (free: core/claims) */ export const food = todo('food');
/** legacy sevUnsquash(q) */ export const unsquash = todo('unsquash');
/** any hand that is not resting (legacy sevBusy) */ export const busy = () => false;
export function install(app) {}
