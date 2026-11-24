// Particles and page effects (legacy bits, spray, gore, trail, moveBits, bleed drops, the #projects shake). STUB.
// moveBits runs on onTick 'fx' (first after the steps). Particles are not bodies; they keep the loop alive (hasWork, keepAwake).
// trail() removes its streak after TUNE.cut.TRAIL_MS on WALL time (legacy setTimeout).

const todo = (name) => () => { throw new Error(`fx.${name}: not implemented`); };

/** drops and scraps off a cut (legacy spray(x, y, nx, ny)) */ export const spray = todo('spray');
/** blood, ink and paper (legacy gore(x, y, nx, ny, n, pow)) */ export const gore = todo('gore');
/** the streak behind a fast tip (legacy trail(a, b)) */ export const trail = todo('trail');
/** one drip from a wound (legacy bleed() body) */ export const drip = todo('drip');
/** shake #projects (legacy: remove 'shake', reflow, add 'shake') */ export const shake = todo('shake');
export function install(app) {}
