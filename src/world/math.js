// Small maths shared by the world and the actors (no state, no random draws).

/** v clamped to 0..1 */
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
/** angle a wrapped to -PI..PI */
export const wrapA = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
/** how far point q is from the segment u-v (all [x, y], any one unit) */
export const segDist = (q, u, v) => { const ex = v[0] - u[0], ey = v[1] - u[1], f = clamp01(((q[0] - u[0]) * ex + (q[1] - u[1]) * ey) / (ex * ex + ey * ey || 1)); return Math.hypot(q[0] - u[0] - ex * f, q[1] - u[1] - ey * f); };
