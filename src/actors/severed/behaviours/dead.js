// cut-off hand behaviour "dead": the new hand came for it while it was up and about (reactions: hand.prodding), so it plays dead.
// It flops over and rolls onto its back, fingers in the air, X eyes (TUNE.severed.DEAD.POSE, draw.js). A poke may make it
// twitch (poked() in ../index.js, hand.poked). Tap it (press and let go within DEAD.TAP_S) and it springs up and runs; press
// longer and you have picked it up (held). Once the new hand has left it alone for DEAD.UP_S it gets up, pleased, and runs.
// tap: true: the held check of sevTick leaves the press to this state.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { isFree } from '../../../core/claims.js';
import { isHeld } from '../../../world/world.js';
import { set, say, tickNow } from '../index.js';
import { wrapA } from '../gait.js';
import { easePose } from '../../../world/math.js';

const SV = TUNE.severed, DE = SV.DEAD;

/** off it goes: away from the right edge (where the arm is), running */
function run(o, a) { a.flee = tickNow() + DE.RUN_MS; a.dir = a.fd = -1; set(o, 'rise'); }

export default defineBehaviour('sev', 'dead', {
  pose: 'limp',   // (eased to DEAD.POSE here: a.poseSet)
  tap: true,
  enter(o, m) {
    const a = o.ai, b = o.body; a.poseSet = true; a.vx = 0; a.press = 0; a.freeT = 0; a.twitched = false; a.pokedAt = null;
    b.setAngularDamping(SV.BODY.damping); b.setLinearVelocity({ x: 0, y: DE.FLOP_VY }); b.setAwake(true);
    say(o, 'dead', true);
  },
  tick(o, m, dt) {
    const a = o.ai, b = o.body, t = tickNow(), hp = o.hand.pose, kp = 1 - Math.exp(-dt * 10);
    easePose(hp, DE.POSE, kp);
    a.wig = a.twitched && t - a.pokedAt < DE.TWITCH_MS ? 0.9 : 0;   // stone still, but for the twitch
    if (m.t < DE.ROLL_S) b.setAngularVelocity(wrapA(DE.ANGLE - b.getAngle()) * DE.ROLL_RATE);   // over onto its back
    if (isHeld(o)) { a.press += dt; if (a.press > DE.TAP_S) set(o, 'held'); return; }
    if (a.press > 0) {   // a tap: it springs up and runs
      b.setLinearVelocity({ x: DE.HOP[0], y: DE.HOP[1] }); b.setAwake(true); say(o, 'spring', true); run(o, a); return;
    }
    if (!isFree(o)) { a.freeT = 0; return; }
    a.freeT += dt;
    if (a.freeT > DE.UP_S) { say(o, 'phew', true); run(o, a); }   // it worked
  },
  leave(o, m) { o.hand.pose.dead = 0; o.ai.press = 0; o.ai.poseSet = false; },
});
export function install(app) {}
