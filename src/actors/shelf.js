// 棚 the secret shelf (legacy shelfOn, shelfOff, onShelf, nearShelf, shelfSnack, window.__shelf). STUB.
// install(app): own listener world.resized -> rebuild at the same y (legacy buildWalls did shelfOff + shelfOn), hook('__shelf', toggle).

const todo = (name) => () => { throw new Error(`shelf.${name}: not implemented`); };

/** type tana: out if it is in, in if it is out (legacy window.__shelf); toasts; emits shelf.opened / shelf.closed */
export const toggle = todo('toggle');
/** a card or big piece lying still on the shelf, on screen, free (legacy shelfSnack). @returns body record | null */
export const snack = todo('snack');
/** the pointer (viewport px) is near the shelf: the hand stays back (legacy nearShelf). @returns boolean */
export const near = todo('near');
/** o lies on the shelf (legacy onShelf). @returns boolean */
export const holds = todo('holds');
/** the hand wants what is on it (legacy shelf.want; keeps the loop awake) */
export const want = todo('want');
/** @returns {{ y: number, x0: number, x1: number, w: number, want: boolean } | null} */
export const state = () => null;
export function install(app) {}
