// hand state "pulled": the old hands' tower has it by the wrist (sev.towerGrab) and they all pull: it is dragged out onto the
// page in heaves, stretched far out of its corner, flailing and complaining (TUNE.hand.TOWER: PULL_S, TO, DROP_PX, JERK_*),
// the three hanging on along the line from its grip to the floor (src/actors/severed/tower.js follows its grip). Then it has
// had enough: it shakes them off (SHAKE_S), emits 'hand.shookOff' (they fly, and land in a heap) and snaps back out of sight
// to sulk for SULK_MS. Should the tower come down first (you picked one off), towerFell() in ../index.js lets it go: sulk.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { now } from '../../../core/clock.js';
import { shake } from '../../../world/fx.js';
import { POSES } from '../poses.js';
import { set, speak, clamp01 } from '../index.js';
import { gripPt, wristFor } from '../tug.js';

const TW = TUNE.hand.TOWER;

export default defineBehaviour('hand', 'pulled', {
  pose: 'strain',
  enter(c, m) { c.pull = { G0: gripPt(), shook: false, said: false }; },
  tick(c, m, dt) {
    const x = m.x, p = c.pull, vw = x.vw, vh = x.vh;
    if (!p) { set('lurk'); return; }
    if (!p.said && m.t > 0.15) p.said = !!speak('pulled', true);   // (right after the old hand's heave)
    else if (p.said && m.t * 1000 > TW.SAY_MS && m.t < TW.PULL_S) speak('pulled');
    // dragged out in heaves: a smooth pull with a surge every so often
    const u = clamp01(m.t / TW.PULL_S), e = u * u * (3 - 2 * u), surge = TW.JERK_PX * Math.max(0, Math.sin(m.t * TW.JERK_W)) * (1 - u);
    const G1 = [Math.max(TW.TO[1], vw * TW.TO[0]), Math.min(vh - TW.FLOOR_PX, p.G0[1] + TW.DROP_PX)];
    const G = [p.G0[0] + (G1[0] - p.G0[0]) * e - surge, p.G0[1] + (G1[1] - p.G0[1]) * e];
    x.aim = Math.PI + Math.sin(m.t * TW.FLAIL_W) * TW.FLAIL; x.rate = TW.RATE; x.wig = 0.5; x.shake = 2.5; x.strain = 0.7;
    x.pose = Math.sin(m.t * TW.FLAIL_W * 0.5) > 0 ? POSES.strain : POSES.eager;
    if (m.t > TW.PULL_S) {   // enough: it shakes them off
      const k = m.t - TW.PULL_S;
      if (!p.shook) { p.shook = true; speak('shakeOff', true); shake(); }
      G[0] += Math.sin(k * TW.SHAKE_W) * TW.SHAKE_PX; G[1] += Math.cos(k * TW.SHAKE_W * 0.77) * TW.SHAKE_PX;
      x.rate = 14; x.shake = 6; x.pose = POSES.clamp;
      if (k > TW.SHAKE_S) {
        c.pull = null; c.tower = null; bus.emit('hand.shookOff', {});
        c.sulkUntil = now() + TW.SULK_MS; set('sulk'); speak('towerSulk', true);
        return;
      }
    }
    x.T = wristFor(G, x.aim);
  },
  leave(c, m) { c.pull = null; },
});
export function install(app) {}
