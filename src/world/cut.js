// The blade (legacy bladeCuts, endCut, slice, targets, edgeOf, crossings, inside, polyArea, validPoly, wounds/bleed). STUB.
// Registered on onTick 'blade' (after 'fx', before 'hand'). Follows world.blade's TIP each frame: entry -> exit through
// another side = cut (slice, then the katana's own line, then emit 'card.cut'), the same side = stab (emit 'card.stabbed'
// FIRST, then the wound with its random life, then say 'card.stab'). While the tip is inside a card it screams 'card.cutting'
// (one scream per TUNE.cut.SCREAM_GAP). Sets blade.tips / tipWas / tipDt and emits 'blade.moved' once per frame.

const todo = (name) => () => { throw new Error(`cut.${name}: not implemented`); };

/** legacy bladeCuts(dt) */ export const bladeCuts = todo('bladeCuts');
/** legacy slice(o, A, B, dir): cut o along page points A -> B. @returns [L, R] pieces or null */ export const slice = todo('slice');
/** legacy polyArea(ps) */ export const polyArea = todo('polyArea');
/** legacy validPoly(ps) */ export const validPoly = todo('validPoly');
/** legacy inside(poly, x, y) (convex) */ export const inside = todo('inside');
/** legacy crossings(poly, a, b): where a -> b crosses the outline, in order */ export const crossings = todo('crossings');
/** legacy edgeOf(poly, q): the outline edge nearest q */ export const edgeOf = todo('edgeOf');
export function install(app) {}
