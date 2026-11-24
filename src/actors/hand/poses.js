// The hand's shape and poses (legacy FING, THUMB, BEND, ARCH, GRIP, PALM, POSES). The numbers live in core/tune.js.
import { TUNE } from '../../core/tune.js';
export const POSES = TUNE.hand.POSES;
export const { FING, THUMB, BEND, ARCH, GRIP, PALM, EYE } = TUNE.hand;
export function install(app) {}
