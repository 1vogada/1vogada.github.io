// How a cut-off hand walks (legacy GAIT, TURN, NEXT, sevGround, sevFeet, sevStep, the turning code in sevTick). STUB.
// step(o) runs in the 'forces' step phase (legacy: inside step()'s loop over objs, before the root springs).

import { TUNE } from '../../core/tune.js';

const todo = (name) => () => { throw new Error(`severed/gait.${name}: not implemented`); };

export const GAIT = TUNE.severed.GAIT, TURN = TUNE.severed.TURN, NEXT = TUNE.severed.NEXT;
/** the ground under a page point (legacy sevGround(x, y)). @returns page y or null */ export const ground = todo('ground');
/** plant and swing the feet (legacy sevFeet(o, a, dt)) */ export const feet = todo('feet');
/** leg spring, upright torque, walking force (legacy sevStep(o)) */ export const step = todo('step');
/** turning on the spot and the feet (legacy sevTick's `if (a.up)` block) */ export const turn = todo('turn');
export function install(app) {}
