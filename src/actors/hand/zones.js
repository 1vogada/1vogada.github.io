// Where the hand reacts (legacy zones(vw) and the ?debug=zones overlay). Ivo drew these; change them only here.

const todo = (name) => () => { throw new Error(`hand/zones.${name}: not implemented`); };

/** @returns {{ tease: number, edge: number, grab: number }} viewport x */ export const zones = todo('zones');
export function install(app) {}
