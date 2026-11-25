// hand state "peer": the old hands have built their tower at the right edge (src/actors/severed/tower.js) and the top one is
// reaching up. Curious, the arm leans down to look at it, its grip just above the top one's fingertips (c.tower, page px),
// pointing down at it. The top one takes it by the wrist (sev.towerGrab -> pulled), or the tower comes down (towerFell() in
// ../index.js: lurk). Gives up looking after TUNE.hand.TOWER.PEER_MAX_S whatever happens.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';
import { wristFor } from '../tug.js';

const TW = TUNE.hand.TOWER;

export default defineBehaviour('hand', 'peer', {
  pose: 'eager',
  enter(c, m) { speak('towerPeer', true); },
  tick(c, m, dt) {
    const x = m.x, tip = c.tower;
    if (!tip || m.t > TW.PEER_MAX_S) { c.tower = null; set('lurk'); return; }
    const H = [tip.x - scrollX + TW.PEER_DX, tip.y - scrollY - TW.PEER_DY];
    x.aim = TW.PEER_AIM + Math.sin(m.t * 2.3) * 0.08; x.T = wristFor(H, x.aim); x.rate = TW.PEER_RATE;
    x.pose = m.t < 1 ? POSES.eager : POSES.point; x.wig = 0.12;
  },
});
export function install(app) {}
