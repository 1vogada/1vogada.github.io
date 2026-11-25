// hand state "crush": squeeze, savour, beg, crunch (CRUSH_Q); then gloat.
// Legacy clawTick branch `c.st === 'crush'` (tick) and the post-chain block `c.st === 'crush' && c.o` (hold), moved verbatim.
// tick(c, m, dt) sets the motion target on the frame's ctx m.x; hold(c, m, x, H) runs after the easing with the grip H (page px).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { remove } from '../../../world/world.js';
import { gore, shake } from '../../../world/fx.js';
import { set, speak } from '../index.js';
import { wristFor, crushQ, crushPause } from '../tug.js';

const S = TUNE.physics.S;

export default defineBehaviour('hand', 'crush', {
  pose: 'clamp',
  tick(c, m, dt) {
    const x = m.x;
    const q = crushQ(m.t), rest = crushPause(m.t);   // the fingers close joint by joint with the squeeze; in the pauses it holds still, turns the card over and looks at it
    x.pose = { curl: 0.5 + 0.62 * q, th: 0.45 + 0.6 * q, spread: 0.7 - 0.45 * q, eye: rest ? 1.3 : 0.5, pupil: rest ? 1.2 : 0.5, happy: rest && m.t > 2.5 ? 1 : 0 };
    x.rate = 7; x.shake = rest ? 0.6 : 2 + 6 * q; x.aim = Math.PI + (rest ? Math.sin(m.t * 2.2) * 0.22 : Math.sin(m.t * 24) * 0.05); x.T = wristFor([x.vw - x.HOLD - 90, c.hy], x.aim);
    if (rest && !c.sav) { c.sav = true; speak('savour', true); } else if (!rest) c.sav = false;
  },
  // the card crumples in the fist, screaming, and then there is no card
  hold(c, m, x, H) {
    if (!c.o) return false;
    const t = x.t, ob = c.o, g = ob.tug, q = crushQ(m.t), rest = crushPause(m.t), a = g.a + g.spin * q + Math.sin(m.t * (rest ? 55 : 40)) * (rest ? 0.02 : 0.05 * q), sc = 1 - 0.6 * q;
    // a piece is held by its own middle, not by the middle of the card it came from (g.cen is [0, 0] for a whole card)
    const ca = Math.cos(a), sa = Math.sin(a), ox = (g.cen[0] * ca - g.cen[1] * sa) * sc, oy = (g.cen[0] * sa + g.cen[1] * ca) * sc, cx = ob.w / 2 + g.cen[0], cy = ob.h / 2 + g.cen[1];
    ob.body.setTransform({ x: (H[0] - ox) / S, y: (H[1] - oy) / S }, a); ob.body.setLinearVelocity({ x: 0, y: 0 }); ob.body.setAngularVelocity(0);
    ob.el.style.transform = `translate(${(H[0] - ox - ob.ex).toFixed(2)}px, ${(H[1] - oy - ob.ey).toFixed(2)}px) rotate(${a.toFixed(4)}rad) scale(${sc.toFixed(3)})`;
    ob.el.style.clipPath = `polygon(${g.pts.map(([px, py, r]) => `${(px + (cx - px) * q * r).toFixed(1)}px ${(py + (cy - py) * q * r).toFixed(1)}px`).join(',')})`;
    ob.el.style.filter = `saturate(${(1 + q).toFixed(2)}) sepia(${(0.4 * q).toFixed(2)}) hue-rotate(-${(30 * q).toFixed(0)}deg) brightness(${(1 - 0.25 * q).toFixed(2)})`;
    if (rest && m.t > 2.5 && m.t < 3.7) {   // in the long pause it begs
      if (!g.beg) { g.beg = true; bus.emit('card.begged', { card: ob }); }   // legacy talkOn(ob, pick(BEG))
    } else if (!rest) bus.emit('card.hurt', { card: ob, pain: 0.35 + 0.65 * q });   // legacy cardSay(ob, pain)
    if (t > (g.drip || 0)) { g.drip = t + (rest ? 260 : 70); gore(H[0], H[1], 0, 1, 2 + Math.round(4 * q), 0.3 + 0.4 * q); }
    if (q >= 1) {
      gore(H[0], H[1], -1, 0, 54, 1.1); gore(H[0], H[1], 0, -1, 22, 0.8);
      bus.emit('card.crushed', { card: ob, at: [H[0], H[1]] });   // legacy sayAt(H[0], H[1] - 70, pick(SAY.slice), 'scream')
      ob.tug = null; remove(ob); c.o = null;
      shake();
      set('gloat'); speak('crush', true);
      bus.emit('hand.crushed', { at: [H[0], H[1]] });
    }
    return true;
  },
});
export function install(app) {}
