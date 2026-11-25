// The wipeable fog over the hero (legacy regrowMask, fogRGB, resize, wipe, frame, setRunning, refog). An independent
// clock.frames loop. Its 14 blobs draw 4 Math.random each at install: install order matters (before page/kiri.js). STUB.
// install(app): hero pointermove AFTER actors/katana.js registered its own.
const todo = (name) => () => { throw new Error(`fog.${name}: not implemented`); };
/** legacy regrowMask(c, el, t, st) (kiri.js uses it too) */ export const regrowMask = todo('regrowMask');
/** legacy refog(msg) */ export const refog = todo('refog');
/** the fog's alpha (0-255) at a viewport point (legacy: getImageData on the mask, for the shelf secret tap) */ export const alphaAt = todo('alphaAt');
/** the fog colour "r, g, b" (legacy rgb) */ export const rgb = todo('rgb');
export function install(app) {}
