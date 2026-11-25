// A scene is a script the page runs with the hand (Surprise me). It is a core/clock.js scope on WALL time (legacy handScene
// used setTimeout, which keeps running while the tab is hidden), named, with legacy kill() semantics: every pending sleep
// rejects with GONE and the scene's finally block tidies up. STUB.

import { GONE } from '../core/clock.js';

const todo = (name) => () => { throw new Error(`scene.${name}: not implemented`); };

export { GONE };
/** start a scene. @returns {{ name, sleep(ms), after, every, on, listen, onEnd, kill(), dead }} emits scene.started / scene.ended */
export const scene = todo('scene');
/** the running scene or null (legacy `scene`) */ export const current = () => null;
export function install(app) {}
