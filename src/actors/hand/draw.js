// One drawing for every hand (legacy handParts, handDraw, clawDraw): the arm's own and every cut-off one, mirrored with m,
// turned with sx/cx, standing on feet. STUB.
// handDraw draws two Math.random values per call (the shake offset) even when shake is 0: every call counts for parity.

const todo = (name) => () => { throw new Error(`hand/draw.${name}: not implemented`); };

/** the two SVG layers and their paths (legacy handParts(extra)). @returns { under, over, thumb, talonT, flesh, talon, crease, vein, eye, pupil } */
export const handParts = todo('handParts');
/** legacy handDraw(c, wig, shake, strain); sets c.tip, c.tip2, c.arm2 */
export const handDraw = todo('handDraw');
export function install(app) {}
