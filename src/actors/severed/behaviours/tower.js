// cut-off hand behaviour "tower": its part of the hand tower (../tower.js). It climbs to its place (place(): standing on its
// wrist, fingers up, on the fingertips of the one below) up and over in an arc for TOWER.CLIMB_S, then holds it, swaying with
// the others; the bottom one simply braces where it stands. Its body is put where it belongs every frame (no gravity; it does
// not bump into the others), so anything that moves it more than TOWER.KNOCK_PX from there in a frame knocked it: the tower comes down. Pulling the arm
// (the tower's phase 'pull') it hangs on along the line from the floor to the arm's grip, straining.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { clamp01, wrapA } from '../gait.js';
import { set, say, POSES } from '../index.js';
import { tower, tier, place } from '../tower.js';
import { HIT_ALL } from '../../../world/world.js';

const S = TUNE.physics.S, TW = TUNE.severed.TOWER;
const TEAM = { groupIndex: -7, categoryBits: 1, maskBits: 0xFFFF };   // the three never collide with each other

export default defineBehaviour('sev', 'tower', {
  pose: 'grip',
  enter(o, m) {
    const a = o.ai, b = o.body, p = b.getPosition();
    a.vx = 0; a.from = { x: p.x * S, y: p.y * S, a: b.getAngle() }; a.tw = { x: p.x * S, y: p.y * S, a: b.getAngle() };
    b.setGravityScale(0); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0); b.getFixtureList().setFilterData(TEAM); b.setAwake(true);
    if (tier(o) > 0) say(o, 'towerClimb', true); else say(o, 'towerBrace', true);
  },
  tick(o, m, dt) {
    const a = o.ai, b = o.body, T = tower(), P = T && place(o); if (!P) return;   // (the tower ends it)
    const q = b.getPosition();
    if (T.phase !== 'pull' && Math.hypot(q.x * S - a.tw.x, q.y * S - a.tw.y) > TW.KNOCK_PX) { set(o, 'tumble'); return; }   // something hit it: it is not where it put itself
    const i = tier(o), F = a.from, top = i === 2;
    if (m.t < TW.CLIMB_S) {   // climbing: up and over the ones below, in an arc
      const u = clamp01(m.t / TW.CLIMB_S), e = u * u * (3 - 2 * u), cx = (F.x + P.x) / 2, cy = Math.min(F.y, P.y) - (i ? TW.ARC_PX : 0);
      a.tw = { x: (1 - e) * (1 - e) * F.x + 2 * (1 - e) * e * cx + e * e * P.x, y: (1 - e) * (1 - e) * F.y + 2 * (1 - e) * e * cy + e * e * P.y, a: F.a + wrapA(P.a - F.a) * e };
      a.wig = 0.45;
    } else {
      const k = 1 - Math.exp(-dt * TW.FOLLOW);
      a.tw = { x: a.tw.x + (P.x - a.tw.x) * k, y: a.tw.y + (P.y - a.tw.y) * k, a: a.tw.a + wrapA(P.a - a.tw.a) * k };
      a.wig = T.phase === 'pull' ? 0.25 : top ? 0.2 : 0.05;
    }
    b.setTransform({ x: a.tw.x / S, y: a.tw.y / S }, a.tw.a); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
    // the bottom one braces with its fingers spread wide, the top one reaches; pulling, all of them clench and strain
    const want = T.phase === 'pull' ? POSES.fist : top && T.phase === 'reach' ? POSES.held : i === 0 ? POSES.held : POSES.grip, hp = o.hand.pose, kp = 1 - Math.exp(-dt * 8);
    for (const key in want) hp[key] = (hp[key] || 0) + (want[key] - (hp[key] || 0)) * kp;
    hp.legs = 0; hp.eye = T.phase === 'pull' ? 1.4 : want.eye; a.poseSet = true;
  },
  leave(o, m) {
    const a = o.ai, b = o.body; a.poseSet = false; a.wig = 0;
    b.setGravityScale(TUNE.physics.FALL); b.getFixtureList().setFilterData(HIT_ALL); b.setAwake(true);
  },
});
export function install(app) {}
