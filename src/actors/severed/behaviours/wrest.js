// cut-off hand behaviour "wrest": tug of war over a card. It was crushing a card near the right edge when the arm grabbed the
// other end (hand.wrest -> wrest() in ../index.js): it lets go of the squeeze, shuffles to its end of the card, at q.tug.P, and
// pulls against the arm (the arm's 'wrest' owns the card's stretch). How it ends:
//   you click it (press and let go within WREST.TAP_S)  it slips and flies off (whee); the arm has the card
//   you press longer                                     you have picked it up (held); the arm has the card
//   the arm lets go (you clicked the arm, its hand was cut off), or the card tears (hand.wrested -> wrested() in ../index.js):
//                                                        it has the card, or its half, and crushes it after all
// tap: true: the held check of sevTick leaves the press to this state.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world, isHeld, HIT_ALL, NO_HIT } from '../../../world/world.js';
import { clamp01, wrapA } from '../gait.js';
import { set, say, regain, strained } from '../index.js';

const S = TUNE.physics.S, HI = TUNE.severed.HITCH, WR = TUNE.severed.WREST;

export default defineBehaviour('sev', 'wrest', {
  pose: 'grip',
  tap: true,
  enter(o, m) {
    const a = o.ai, b = o.body, p = b.getPosition();
    b.getFixtureList().setFilterData(NO_HIT); b.setGravityScale(0); a.vx = 0; a.press = 0;
    a.from = { x: p.x, y: p.y, a: b.getAngle() };
  },
  tick(o, m, dt) {
    const a = o.ai, q = a.ride, b = o.body;
    if (!q || !world.bodies.has(q)) { set(o, 'limp'); return; }
    const g = q.tug;
    if (!g || g.wrest !== o) { regain(o, q, 'wrestWon'); return; }   // the arm let go of its end (its hand was cut off): all ours
    if (isHeld(o)) { a.press += dt; if (a.press > WR.TAP_S) { set(o, 'held'); return; } }   // held long: you picked it up
    else if (a.press > 0) {   // a click: its fingers slip and off it flies
      bus.emit('sev.slipped', { hand: o, card: q });
      say(o, 'wrestSlip', true);
      set(o, 'whee'); b.setLinearVelocity({ x: WR.FLICK[0], y: WR.FLICK[1] }); b.setAngularVelocity(WR.FLICK_SPIN); return;
    }
    // it hangs on at P, fingers towards the arm (eased over from the middle of the card where it squeezed)
    const th = g.psi + Math.sin(m.t * 17) * 0.06, P = g.P, k = clamp01(m.t / WR.EASE_S), e = k * k * (3 - 2 * k);
    const tx = (P[0] - HI.TIP_PX * Math.cos(th)) / S, ty = (P[1] - HI.TIP_PX * Math.sin(th)) / S;
    b.setTransform({ x: a.from.x + (tx - a.from.x) * e, y: a.from.y + (ty - a.from.y) * e }, a.from.a + wrapA(th - a.from.a) * e); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
    strained(o, (g.d - g.d0) / g.rip);
    if (m.t > 0.9) say(o, 'wrest');
  },
  leave(o, m) {
    const a = o.ai; a.poseSet = false; a.wig = 0; a.press = 0; a.ride = null;
    if (world.bodies.has(o)) { o.body.getFixtureList().setFilterData(HIT_ALL); o.body.setGravityScale(TUNE.physics.FALL); o.body.setAwake(true); }
  },
});
export function install(app) {}
