// hand state "chew" (chain away-thief): you left the tab, it helped itself to a grid card (index.js pilfer), and you come back
// to it at the right edge, mid-chew: the card sticks out of its fist, already bitten (world/bite.js), one more bite every
// TUNE.awayThief.BITE_S ('hand.chewing', the card squeals). Pull the card TUNE.awayThief.PULL_PX further than where you took hold and it lets
// go: 'hand.unchewed', the card is yours, bite marks and all. After CHEW_S it pulls back off the edge and swallows it whole:
// 'hand.ate' (the basement pins it up, page/basement.js). Random draws: only its lines (and the card's).
// tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, remove, toLocal, NO_HIT, pinJoint } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { bite } from '../../../world/bite.js';
import { POSES } from '../poses.js';
import { set, speak, letGo } from '../index.js';
import { gripPt } from '../tug.js';

const S = TUNE.physics.S, A = TUNE.awayThief;

/** the grip in page px */
const gripPage = () => { const g = gripPt(); return [g[0] + scrollX, g[1] + scrollY]; };
/** the next bite: top and bottom edge in turn, working along from its fingers (where the fist would hide it) towards you */
function chomp(c, o) {
  const H = gripPage(), q = toLocal(o, H), k = c.bites = (c.bites || 0) + 1;
  return bite(o, [q[0] + o.w / 2 - A.CLEAR_PX - Math.floor((k - 1) / 2) * A.BITE_PX * 2.2, k % 2 ? 0 : o.h], A.BITE_PX);
}

export default defineBehaviour('hand', 'chew', {
  pose: 'clamp',
  enter(c, m) {
    const o = c.o; if (!o) return;
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    // it is already there when you look: at the edge, the card in its fist
    c.x = vw - A.OUT_PX; c.y = c.ly = Math.max(110, Math.min(vh - 110, vh * A.Y)); c.sh = c.y + 70; c.a = Math.PI; c.pose = { ...POSES.clamp };
    const H = gripPage(), b = o.body;
    b.setTransform({ x: (H[0] - o.w / 2 + A.IN_PX) / S, y: H[1] / S }, 0);
    b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0); b.setGravityScale(0); b.setAngularDamping(TUNE.physics.HELD_SPIN);
    b.getFixtureList().setFilterData(NO_HIT);
    c.joint = pinJoint(b, { x: H[0] / S, y: H[1] / S }, TUNE.hand.JOINT_HZ);
    c.bites = 0; let n = 0; for (let i = 0; i < A.PRE; i++) n = chomp(c, o);
    c.bite = A.BITE_S; c.gulp = false; c.pull0 = null;
    speak('unattended', true);
    bus.emit('hand.chewing', { card: o, n, first: true });
  },
  tick(c, m, dt) {
    const x = m.x, o = c.o, vw = x.vw;
    if (!o) { set('lurk'); return; }
    const beat = Math.sin(m.t * A.CHOMP * 2 * Math.PI);
    x.pose = beat > 0 ? POSES.clamp : POSES.joy; x.rate = 10; x.wig = 0.08; x.shake = 0.8 + 0.8 * Math.max(0, beat);
    x.aim = Math.PI + beat * 0.06;
    const grab = world.grab;
    if (grab && grab.o === o) {   // you have hold of it: it hangs on, and lets go once you pull it far enough out of its fingers
      const g = gripPt(), r = Math.hypot(grab.cx - g[0], grab.cy - g[1]);
      if (c.pull0 == null) c.pull0 = r;   // how far from its fingers you took hold: only the pull beyond that counts
      const d = Math.max(0, r - c.pull0);
      x.pose = POSES.strain; x.strain = Math.min(1, d / A.PULL_PX); x.shake = 2 + 2 * x.strain; x.T = [vw - A.OUT_PX + Math.min(60, d * 0.3), c.ly];
      if (d > A.PULL_PX) {
        letGo(); c.cool = x.t + A.COOL_MS; set('sulk'); speak('unchewed', true);
        bus.emit('hand.unchewed', { card: o });
      }
      return;
    }
    c.pull0 = null;
    if (!c.gulp && m.t > A.CHEW_S) { c.gulp = true; speak('gulp', true); }
    if (c.gulp) {   // done chewing: back off the edge with it, and down it goes
      x.pose = POSES.joy; x.rate = 5; x.T = [vw + 420, c.y];
      if (c.x > vw + 190) {
        remove(o); c.o = null; c.joint = null; gore(vw - 6 + scrollX, c.y + scrollY, -1, 0, 16, 0.8);
        bus.emit('hand.ate', { card: o });
        c.cool = x.t + TUNE.hand.COOL.eat; set('lurk');
      }
      return;
    }
    x.T = [vw - A.OUT_PX, c.ly];
    if (m.t >= c.bite) { c.bite += A.BITE_S; bus.emit('hand.chewing', { card: o, n: chomp(c, o) }); }
  },
});
export function install(app) {}
