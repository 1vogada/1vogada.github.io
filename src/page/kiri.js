// 霧 kiri: the whole page floods with fog (legacy kSize, kMaskSize, kWipe, kFrame, floodPage, liftFlood, its pointermove /
// scroll / resize), and the page keys (legacy document keydown: "/" focuses search, kiri / мъгла floods, Escape lifts,
// tana / рафт / たな opens the shelf) and the tap on the uncovered secret (legacy hero click). 16 blobs, 4 Math.random each,
// at install (after page/fog.js). Emits 'kiri.flooded'. STUB.
const todo = (name) => () => { throw new Error(`kiri.${name}: not implemented`); };
export const flood = todo('flood');
export const lift = todo('lift');
export function install(app) {}
