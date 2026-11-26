// cut-off hand behaviour "rps": rock, paper, scissors with the new hand (scenes/rps.js drives it through play() in ../index.js).
// It stands up on its wrist, fingers to the sky, pumps its fist for the count and shows its pick: o.ai.rps = { pose (a key of
// TUNE.rps.OLD), pump }. Picked up, it is out of the game (held).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { clamp01, wrapA } from '../gait.js';
import { easePose } from '../../../world/math.js';

const S = TUNE.physics.S, R = TUNE.rps;

export default defineBehaviour('sev', 'rps', {
  pose: 'fist',
  enter(o, m) {
    const a = o.ai, b = o.body, p = b.getPosition();
    a.vx = 0; a.rps = a.rps || { pose: 'rock', pump: false }; a.from = { x: p.x, y: p.y, a: b.getAngle() }; a.base = { x: p.x, y: p.y - R.STAND_PX / S };
    b.setGravityScale(0); b.setAngularDamping(TUNE.severed.BODY.damping);
  },
  tick(o, m, dt) {
    const a = o.ai, b = o.body, k = clamp01(m.t / R.STAND_S), e = k * k * (3 - 2 * k);
    const pump = a.rps.pump ? Math.abs(Math.sin(m.t * Math.PI * 1000 / R.PUMP_MS)) * R.PUMP_PX / S : 0;
    b.setTransform({ x: a.from.x + (a.base.x - a.from.x) * e, y: a.from.y + (a.base.y - a.from.y) * e - pump }, a.from.a + wrapA(-Math.PI / 2 - a.from.a) * e);
    b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
    const want = R.OLD[a.rps.pose] || R.OLD.rock, hp = o.hand.pose, kp = 1 - Math.exp(-dt * (a.rps.pump ? 10 : 30));
    easePose(hp, want, kp);
    a.poseSet = true; a.wig = a.rps.pump ? 0.05 : 0.02;
  },
  leave(o, m) { const a = o.ai; a.poseSet = false; a.wig = 0; o.body.setGravityScale(TUNE.physics.FALL); o.body.setAwake(true); },
});
export function install(app) {}
