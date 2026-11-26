// Small maths shared by the world and the actors (no state, no random draws).

/** v clamped to 0..1 */
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
/** angle a wrapped to -PI..PI */
export const wrapA = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
