// cut-off hand behaviour "cheese": the cheese pull, its end. It jumped on a card the arm was dragging off the shelf (hitch with
// o.ai.cheese) and the arm took up the fight (the arm's 'cheese', which owns the card's stretch): it hangs on to its end of the
// card at q.tug.P, fingers towards the arm, and pulls. The arm decides how it ends (reactions: hand.cheesed -> cheesed() in
// ../index.js): it gets its half (hitch, o.ai.mine) or is flicked off (whee). Should the arm let go some other way (its hand cut
// off), it still has hold of the card and simply rides it down (hitch).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { world, HIT_ALL, NO_HIT } from '../../../world/world.js';
import { set, say, POSES } from '../index.js';

const S = TUNE.physics.S, HI = TUNE.severed.HITCH;

export default defineBehaviour('sev', 'cheese', {
  pose: 'grip',
  enter(o, m) { o.body.getFixtureList().setFilterData(NO_HIT); o.body.setGravityScale(0); o.ai.vx = 0; },
  tick(o, m, dt) {
    const a = o.ai, q = a.ride, b = o.body;
    if (!q || !world.bodies.has(q)) { set(o, 'limp'); return; }
    const g = q.tug;
    if (!g || g.cheese !== o) { a.hold = true; set(o, 'hitch'); return; }   // the arm let go of its end: it is all ours (and we are falling)
    const th = g.psi + Math.sin(m.t * 17) * 0.06, P = g.P;
    b.setTransform({ x: (P[0] - HI.TIP_PX * Math.cos(th)) / S, y: (P[1] - HI.TIP_PX * Math.sin(th)) / S }, th); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
    const pain = Math.max(0, Math.min(1, (g.d - g.d0) / g.rip)), hp = o.hand.pose, G = POSES.grip, F = POSES.fist;
    for (const key in G) hp[key] = G[key] + (F[key] - G[key]) * pain; hp.eye = 1 + 0.5 * pain; hp.pupil = 0.8 - 0.4 * pain; a.poseSet = true;
    a.wig = 0.15 + 0.3 * pain;
    if (m.t > 0.8) say(o, 'cheese');
  },
  leave(o, m) { const a = o.ai; a.poseSet = false; a.wig = 0; if (world.bodies.has(o)) { b0(o); } },
});
// back to an ordinary body: it bumps into things and falls again
function b0(o) { o.body.getFixtureList().setFilterData(HIT_ALL); o.body.setGravityScale(TUNE.physics.FALL); o.body.setAwake(true); }
export function install(app) {}
