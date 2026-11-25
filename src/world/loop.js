// The per-step and per-frame work of the world, registered on core/clock.js phases (legacy step(), draw(), frame() body parts).
// install(app) registers:
//   clock.hasWork(() => world.bodies.size > 0)             (fx.js adds bits.length, the actors add their own busy checks)
//   clock.keepAwake(() => !!world.grab || any body root / die / say / awake)
//   onStep 'pose'    snapshot px, py, pa of every body
//   onStep 'forces'  root springs of rooted bodies (and the random shake torque of a slipping root, in body order)
//                    (the severed hand's leg spring registers in 'forces' too: legacy ran both in one loop over objs;
//                    no body is both, and forces add up, so the split keeps the random-draw order)
//   onStep 'joints'  grab.joint.setTarget(pointer + scroll)
//   onStep 'world'   b2.step(DT, 10, 6)
//   onStep 'bodies'  expire o.die, cool o.hot, the root's grip / strain line / tear / settle-and-remove
//   onTick 'input'   autoscroll while a carried card rests at the top or bottom edge
//   onDraw 'bodies'  transforms (held body drawn on the pointer, others interpolated), fade of dying bodies, then
//                    speech.ride(world.bodies, now) for the bubbles riding on them
//
// Events emitted here:
//   'card.strained' { card, first }  every step a held rooted body is pulled past STRAIN (legacy: first time
//                                    say(o, 'strain', true), then say(o, 'strain') every step; o.strained is set before the emit)
// The tear itself goes to the handler of the body's kind (drag.js onTear; legacy tear(o)).

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { ride } from '../core/speech.js';
import { world, remove } from './world.js';
import { tear, give, snap } from './drag.js';

const S = TUNE.physics.S, DT = TUNE.physics.DT, P = TUNE.physics, D = TUNE.drag;

// the held body is drawn with the grabbed spot exactly on the pointer: the correction of this frame's draw, page px
let hx = 0, hy = 0;
/** the draw correction of the held body this frame ([0, 0] for any other body): bubble anchors add it (legacy draw()) */
export const drawOffset = (o) => (world.grab && world.grab.o === o && !o.root ? [hx, hy] : [0, 0]);

function pose() {
  for (const o of world.bodies) { const b = o.body, p = b.getPosition(); o.px = p.x; o.py = p.y; o.pa = b.getAngle(); }
}
function forces() {
  for (const o of world.bodies) {
    if (!o.root) continue;   // the root: a damped spring back to the slot, and one that keeps the card level
    const b = o.body, p = b.getPosition();
    const v = b.getLinearVelocity(), m = b.getMass(), wn = 2 * Math.PI * D.ROOT_HZ, wa = 2 * Math.PI * D.ANGLE_HZ, k = (D.ROOT_GIVE[0] + D.ROOT_GIVE[1] * o.grip) * (1 - D.LOOSE_GIVE * (o.loose || 0));   // a root that is losing its grip gives way, and a loosened one is softer for good
    b.applyForceToCenter({ x: -m * (k * wn * wn * (p.x - o.root.x) + D.ROOT_DAMP * wn * v.x), y: -m * (k * wn * wn * (p.y - o.root.y) + D.ROOT_DAMP * wn * v.y) }, true);
    b.applyTorque(-b.getInertia() * (k * wa * wa * o.pa + D.ANGLE_DAMP * wa * b.getAngularVelocity() + (o.grip < 1 ? (Math.random() - 0.5) * D.SHAKE_TORQUE * (1 - o.grip) : 0)), true);
  }
}
function joints() {
  const grab = world.grab;
  if (grab) grab.joint.setTarget({ x: (grab.cx + scrollX) / S, y: (grab.cy + scrollY) / S });
}
function stepWorld() { world.b2.step(DT, P.VELOCITY_ITERS, P.POSITION_ITERS); }
function bodies() {
  const t = clock.now();
  for (const o of [...world.bodies]) {
    if (o.die && t > o.die) { remove(o); continue; }
    if (o.hot && t > o.hot) { o.hot = 0; if (!world.grab || world.grab.o !== o) o.body.setBullet(false); }
    if (!o.root) continue;
    const b = o.body, p = b.getPosition(), d = Math.hypot(p.x - o.root.x, p.y - o.root.y), grab = world.grab;
    if (grab && grab.o === o) {   // the pull is the stretch of the hand spring: how far the pointer is from the spot it holds
      const g = grab.joint.getTarget(), pull = Math.hypot(g.x - grab.hx, g.y - grab.hy);   // how far the hand is from where it took hold
      // A body with o.tugs comes out like a tooth: a tug is holding the strain until the grip runs out. On the o.tugs-th tug it comes
      // out; before that the root gives one notch (o.loose) and the pull has to ease off (o.spent) before the next tug counts.
      // Yanked past RIP while it still has grip, it snaps instead. Without o.tugs (the katana): the old rule, one pull
      const teeth = o.tugs > 0, last = (o.loose || 0) >= (o.tugs || 1) - 1;
      if (o.spent) { if (pull < D.EASE) o.spent = false; o.grip = Math.min(1, o.grip + DT * D.GRIP_RECOVER); }
      else if (pull > D.STRAIN) { o.grip -= DT * (D.GRIP_DRAIN[0] + D.GRIP_DRAIN[1] * (pull - D.STRAIN) / (D.RIP - D.STRAIN)); const first = !o.strained; o.strained = true; bus.emit('card.strained', { card: o, first }); }
      else o.grip = Math.min(1, o.grip + DT * D.GRIP_RECOVER);
      if (!teeth) { if (pull > D.RIP || o.grip <= 0 || Math.abs(b.getAngle()) > D.TWIST) tear(o); }
      else if (pull > D.RIP) snap(o);
      else if (!o.spent && (o.grip <= 0 || Math.abs(b.getAngle()) > D.TWIST)) { if (last) tear(o); else { o.loose = (o.loose || 0) + 1; o.spent = true; o.grip = D.LOOSE_GRIP; give(o); } }
    }
    else if ((o.grip = Math.min(1, o.grip + DT * D.GRIP_RECOVER_FREE)) && d < D.SETTLE.dist && Math.abs(b.getAngle()) < D.SETTLE.angle && b.getLinearVelocity().length() < D.SETTLE.v && Math.abs(b.getAngularVelocity()) < D.SETTLE.w) remove(o);
  }
}

// resting a carried card at the top or bottom edge of the screen scrolls the page
function autoscroll(dt, ms) {
  const grab = world.grab;
  if (!grab || grab.o.root) return;
  const edge = D.EDGE_PX, y = grab.cy, d = y < edge ? y - edge : y > innerHeight - edge ? y - (innerHeight - edge) : 0;
  grab.edge = d ? (grab.edge || 0) + ms : 0;
  if (grab.edge > D.EDGE_WAIT_MS) scrollBy({ top: d * D.EDGE_RATE * ms / 16, behavior: 'instant' });
}

function draw(k) {
  const t = clock.now(), grab = world.grab;
  // the held card is drawn with the grabbed spot exactly on the pointer: the joint's last few px of give never show.
  // The correction fades out when the card is far behind, which only happens when something blocks it
  hx = 0; hy = 0;
  if (grab && !grab.o.root) {
    const a = grab.joint.getAnchorB(), dx = grab.cx + scrollX - a.x * S, dy = grab.cy + scrollY - a.y * S, d = Math.hypot(dx, dy);
    const f = d < D.HELD_SNAP_PX ? 1 : Math.max(0, 1 - (d - D.HELD_SNAP_PX) / D.HELD_FADE_PX); hx = dx * f; hy = dy * f;
  }
  for (const o of world.bodies) {
    const p = o.body.getPosition(), a = o.body.getAngle(), held = grab && grab.o === o && !o.root;
    const x = held ? p.x * S + hx - o.ex : (o.px + (p.x - o.px) * k) * S - o.ex, y = held ? p.y * S + hy - o.ey : (o.py + (p.y - o.py) * k) * S - o.ey;
    if (!o.tug) o.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(held ? a : o.pa + (a - o.pa) * k).toFixed(4)}rad)`;
    if (o.die && o.die - t < 900) o.el.style.opacity = Math.max(0, (o.die - t) / 900);
  }
  ride(world.bodies, t);   // the bubbles ride above their bodies and stay upright (the speakers' anchors, legacy draw())
}

function awake() {
  if (world.grab) return true;
  for (const o of world.bodies) if (o.root || o.die || o.say || o.body.isAwake()) return true;
  return false;
}

export function install(app) {
  if (app && app.reduced) return;
  clock.hasWork(() => world.bodies.size > 0);
  clock.keepAwake(awake);
  clock.onTick(autoscroll, 'input');
  clock.onStep(pose, 'pose');
  clock.onStep(forces, 'forces');
  clock.onStep(joints, 'joints');
  clock.onStep(stepWorld, 'world');
  clock.onStep(bodies, 'bodies');
  clock.onDraw(draw, 'bodies');
}
