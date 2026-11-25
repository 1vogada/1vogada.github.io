// cut-off hand behaviour "crush": climbs on a card and squeezes it (3.2 s, pause, beg) until it is gone; then gloat.
// Legacy SEV.crush, moved verbatim: the card's lines go through the card speaker (say(q, 'pull', true) -> 'card.pull' forced,
// cardSay(q, pain) -> 'card.agony' in agony mode, sayAt(..., pick(SAY.slice), 'scream') -> sayAt(..., 'card.slice', { scream })).
// While it squeezes, the card is claimed ('sev', 'crush'; core/claims) next to the legacy o.sq flag.
// ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { claim } from '../../../core/claims.js';
import { say as speak, sayAt } from '../../../core/speech.js';
import { world, remove, rectPoly, isHeld } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { clamp01, wrapA } from '../gait.js';
import { set, say, unsquash, tickNow, POSES } from '../index.js';

const S = TUNE.physics.S, SV = TUNE.severed;

// it has got hold of a card: it climbs on, closes around it, slowly, and squeezes until there is no card
export default defineBehaviour('sev', 'crush', {
  pose: 'grip',
  enter(o, m) {
    const a = o.ai, q = a.prey, n = q.poly || rectPoly(q), cx = n.reduce((s, r) => s + r[0], 0) / n.length, cy = n.reduce((s, r) => s + r[1], 0) / n.length, pts = [];
    for (let i = 0; i < n.length; i++) for (let k = 0; k < 4; k++) { const r = n[(i + 1) % n.length]; pts.push([n[i][0] + (r[0] - n[i][0]) * k / 4, n[i][1] + (r[1] - n[i][1]) * k / 4, 0.4 + 0.25 * Math.sin((i * 4 + k) * 1.9) + 0.2 * Math.random()]); }
    q.sq = { clip: q.el.style.clipPath, pts, cx, cy, free: claim(q, 'sev', 'crush') }; q.hot = 0; q.body.setGravityScale(0); q.body.setLinearVelocity({ x: 0, y: 0 }); q.body.setAngularVelocity(0);
    q.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1, maskBits: 0 }); q.el.style.pointerEvents = 'none';
    o.body.setGravityScale(0); a.from = { x: o.body.getPosition().x, y: o.body.getPosition().y, a: o.body.getAngle() }; speak(q, 'card.pull', { force: true });
  },
  tick(o, m, dt) {
    const a = o.ai, t = tickNow();
    const q = a.prey; if (!q || !world.bodies.has(q) || !q.sq) { a.cool = t + SV.LOSE_COOL; return set(o, 'limp'); }
    if (isHeld(o)) return set(o, 'held');
    const T = SV.CRUSH_S, u = clamp01(m.t / T), sq = u < 0.35 ? u / 0.35 * 0.4 : u < 0.6 ? 0.4 + (u - 0.35) * 0.2 : 0.45 + (u - 0.6) / 0.4 * 0.55, pause = u >= 0.35 && u < 0.6;
    const w = q.body.getWorldPoint({ x: (q.sq.cx - q.w / 2) / S, y: (q.sq.cy - q.h / 2) / S }), k = clamp01(m.t / 0.55), e = k * k * (3 - 2 * k), b = o.body;
    b.setTransform({ x: a.from.x + (w.x - a.from.x) * e, y: a.from.y + (w.y - 0.42 - a.from.y) * e }, a.from.a + wrapA(Math.PI / 2 - a.from.a) * e + Math.sin(m.t * 30) * 0.03 * sq); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
    q.body.setLinearVelocity({ x: 0, y: 0 }); q.body.setAngularVelocity(0);
    const hp = o.hand.pose, g = POSES.grip, fz = POSES.fist; for (const key in g) hp[key] = g[key] + (fz[key] - g[key]) * sq; hp.eye = pause ? 1.3 : 0.5; hp.happy = pause ? 1 : 0; a.poseSet = true; a.wig = pause ? 0.02 : 0.05;
    q.el.style.clipPath = `polygon(${q.sq.pts.map(([x, y, r]) => `${(x + (q.sq.cx - x) * sq * (0.55 + r)).toFixed(1)}px ${(y + (q.sq.cy - y) * sq * (0.55 + r)).toFixed(1)}px`).join(',')})`;
    q.el.style.filter = `saturate(${(1 + sq).toFixed(2)}) sepia(${(0.4 * sq).toFixed(2)}) hue-rotate(-${(30 * sq).toFixed(0)}deg) brightness(${(1 - 0.25 * sq).toFixed(2)})`;
    if (pause) say(o, 'squeeze'); else speak(q, 'card.agony', { mode: 'agony', pain: 0.35 + 0.65 * sq });   // legacy cardSay(q, pain)
    if (t > (a.drip || 0)) { a.drip = t + (pause ? 240 : 80); gore(w.x * S, w.y * S, 0, 1, 2 + Math.round(3 * sq), 0.3 + 0.4 * sq); }
    if (u >= 1) {
      gore(w.x * S, w.y * S, -1, 0, 30, 1); gore(w.x * S, w.y * S, 1, 0, 30, 1); gore(w.x * S, w.y * S, 0, -1, 20, 0.8);
      sayAt(w.x * S, w.y * S - 110, 'card.slice', { scream: true });
      q.sq.free(); q.sq = null; remove(q); a.prey = null; a.cool = t + SV.CRUSH_COOL; say(o, 'crush', true); set(o, 'gloat');
    }
  },
  leave(o, m) { const a = o.ai; if (a.prey) unsquash(a.prey); a.prey = null; a.poseSet = false; if (world.bodies.has(o)) o.body.setGravityScale(isHeld(o) ? 1 : TUNE.physics.FALL); },
});
export function install(app) {}
