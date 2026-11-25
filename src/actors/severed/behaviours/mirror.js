// cut-off hand behaviour "mirror": the mirror game. It has met the new hand, and the arm is out showing it (armOut(), wired in
// src/reactions.js): the old hand stops, sits up on the floor with its fingers to the sky and copies the arm's pose a beat late
// (MIRROR.DELAY_MS): point, fist, open, eager, happy. Its eye watches the arm, or the pointer while you move the mouse round in
// circles. Back on its feet (rise) once the arm has been gone MIRROR.LINGER_S, after MIRROR.MAX_S, or when it is knocked about;
// not again for MIRROR.COOL_MS. Only the drawing copies the arm: nothing pushes or pulls either of them.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say, tickNow, armOut } from '../index.js';
import { wrapA } from '../gait.js';

const SV = TUNE.severed, MI = SV.MIRROR, KEYS = ['curl', 'th', 'spread', 'eye', 'pupil', 'happy', 'point'];

export default defineBehaviour('sev', 'mirror', {
  pose: 'limp',
  enter(o, m) { const a = o.ai; a.vx = 0; a.mq = []; a.gone = 0; a.said3 = false; a.poseSet = true; o.body.setAngularDamping(SV.BODY.damping); },
  tick(o, m, dt) {
    const a = o.ai, h = o.hand, b = o.body, t = tickNow(), s = armOut();
    a.vx = 0; a.wig = 0.02;
    if (s) { a.gone = 0; const q = {}; for (const k of KEYS) q[k] = s.pose[k] || 0; a.mq.push([t, q]); } else a.gone += dt;
    while (a.mq.length > 1 && a.mq[1][0] <= t - MI.DELAY_MS) a.mq.shift();   // the oldest pose that is at least DELAY_MS old
    const want = a.mq.length && a.mq[0][0] <= t - MI.DELAY_MS ? a.mq[0][1] : SV.POSES.limp, kp = 1 - Math.exp(-dt * MI.POSE_RATE);
    for (const k of KEYS) h.pose[k] = (h.pose[k] || 0) + ((want[k] || 0) - (h.pose[k] || 0)) * kp;
    h.pose.legs = (h.pose.legs || 0) * (1 - kp);
    if (m.t > 0.3) b.setAngularVelocity(wrapA(-Math.PI / 2 - b.getAngle()) * MI.SIT_RATE);   // it sits up, fingers to the sky
    h.lookAt = s ? s.look || [s.x - 60, s.y] : null; h.lookPx = TUNE.hand.CIRCLE.EYE_PX;
    if (m.t > MI.SAY_S && !a.said3) { a.said3 = true; say(o, 'mirror', true); }
    if (a.gone > MI.LINGER_S || m.t > MI.MAX_S || (m.t > 1 && b.getLinearVelocity().length() > MI.KNOCK)) { a.mirrorCool = t + MI.COOL_MS; set(o, 'rise'); }
  },
  leave(o, m) { const a = o.ai; a.poseSet = false; a.mq = null; o.hand.lookAt = null; },
});
export function install(app) {}
