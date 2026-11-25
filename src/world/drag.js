// Pointer input on bodies (legacy: hold, carry, drop, the grid pointerdown, onMove, startPull trigger, touch, click capture,
// dragstart, the loose-body pointerdown).
// Listener registration order is part of the contract (install registers them in legacy order):
//   grid pointerdown (press), window pointermove (onMove), window pointerup + pointercancel (drop), window touchmove (passive: false),
//   document click (capture: swallow the click after a drag), document dragstart, document pointerdown (pick up a loose body).
// A press that travels TUNE.drag.MOVE_PX on an armed grid card calls the handler set with onPull (the cards actor's startPull).
// A rooted body whose root gives way (world/loop.js 'bodies' step) is handed to the handler its kind set with onTear
// (legacy tear(o): the cards actor's tear for cards, the katana's free for the planted katana).
//
// Events emitted here (legacy direct calls in drop()):
//   'katana.dropped' { katana }       a loose katana let go: legacy say(o, 'kdrop', true); notice('kdrop'), before the throw speed
//   'body.dropped'   { body, speed, x, y }  any free body let go, after its release velocity is set (x, y: the pointer, page px)
//   'body.thrown'    { body, speed }  released faster than HOT: a hand (legacy sevSay(o, 'thrown', true)); any other body after
//                                     o.hot is set (legacy say(o, 'throw', true); notice('throw') unless a katana)
//   'card.sprangBack' { card }        a rooted body let go after it moved (legacy say(o, 'back', true))

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { world, load, isCrazy } from './world.js';

const S = TUNE.physics.S, P = TUNE.physics, D = TUNE.drag;
const html = () => document.documentElement;

let pullFn = null;
const tearFns = new Map(), giveFns = new Map(), snapFns = new Map();
/** the cards actor registers startPull(press, e) here */
export function onPull(fn) { pullFn = fn; }
/** a body kind registers what happens when its root tears: fn(o) (legacy tear(o) / freeKatana(o)) */
export function onTear(kind, fn) { tearFns.set(kind, fn); }
/** a kind whose root comes out like a tooth (o.tugs > 1) registers what happens each time the root gives a notch: fn(o) */
export function onGive(kind, fn) { giveFns.set(kind, fn); }
/** ... and what happens when it is yanked past RIP before the root is loose: fn(o) (the cards tear in two) */
export function onSnap(kind, fn) { snapFns.set(kind, fn); }
export function give(o) { const f = giveFns.get(o.kind); if (f) f(o); }
export function snap(o) { const f = snapFns.get(o.kind); if (f) f(o); else tear(o); }
/** legacy tear(o): hand the torn body to its kind's handler */
export function tear(o) { const f = tearFns.get(o.kind); if (f) f(o); }

// ---- the hand: a soft joint at the exact point that was grabbed, so the card swings around it ----
/** take hold of o at page px with a mouse joint (legacy hold). e: { pointerId, clientX, clientY } */
export function hold(o, px, py, e) {
  const joint = world.b2.createJoint(new world.pl.MouseJoint({ maxForce: P.MAX_FORCE * o.body.getMass(), frequencyHz: o.root ? D.PULL_HZ : D.HAND_HZ, dampingRatio: o.root ? D.PULL_DAMPING : D.HAND_DAMPING }, world.ground, o.body, { x: px / S, y: py / S }));
  world.grab = { o, joint, id: e.pointerId, cx: e.clientX, cy: e.clientY, sx: e.clientX, sy: e.clientY, hx: px / S, hy: py / S, moved: !!o.root, h: [] };
  o.body.setAwake(true); o.hot = 0;
  if (!o.root) carry(o);
  html().classList.add('throwing'); clock.wake();
}
/** a held free body: full gravity, bullet, held damping, 'grabbed' class (legacy carry) */
export function carry(o) { o.body.setGravityScale(1); o.body.setBullet(true); o.body.setAngularDamping(P.HELD_SPIN); o.el.classList.add('grabbed'); }

/** let go (legacy drop). Without e: unconditional. Emits body.dropped / body.thrown / katana.dropped / card.sprangBack */
export function drop(e) {
  const grab = world.grab;
  if (grab && grab.sticky && e) return;   // an equipped katana stays in the hand when the button comes up
  if (grab && (!e || e.pointerId === grab.id)) {
    const g = grab, o = g.o, b = o.body; world.grab = null;
    world.b2.destroyJoint(g.joint); html().classList.remove('throwing');
    if (!o.root) {
      o.el.classList.remove('grabbed', 'equipped'); b.setAngularDamping(P.SPIN); b.setGravityScale(P.FALL); if (b.isFixedRotation()) b.setFixedRotation(false);
      if (o.kind === 'katana') bus.emit('katana.dropped', { katana: o });   // legacy say(o, 'kdrop', true); notice('kdrop')
      // a hand slows down in the last few ms before it lets go: throw with the speed it had over the last 80 ms if that was faster
      const t = clock.now(), h = g.h.filter((q) => t - q[2] < D.THROW_WINDOW_MS), a = h[0], z = h[h.length - 1];
      let v = b.getLinearVelocity(), sp = v.length();
      if (h.length > 1 && z[2] - a[2] > D.THROW_SPAN_MIN_MS && t - z[2] < D.THROW_FRESH_MS) {
        const hx = (z[0] - a[0]) / (z[2] - a[2]) * 1000 / S, hy = (z[1] - a[1]) / (z[2] - a[2]) * 1000 / S, hs = Math.hypot(hx, hy);
        if (hs > sp) { v = { x: hx, y: hy }; sp = hs; }
      }
      if (sp > D.THROW_MAX) { v = { x: v.x * D.THROW_MAX / sp, y: v.y * D.THROW_MAX / sp }; sp = D.THROW_MAX; }
      b.setLinearVelocity(v);
      if (world.dbg) console.log('release speed', sp.toFixed(1));   // eslint-disable-line no-console
      bus.emit('body.dropped', { body: o, speed: sp, x: g.cx + scrollX, y: g.cy + scrollY });
      if (o.kind === 'hand') { b.setBullet(false); if (sp > P.HOT) bus.emit('body.thrown', { body: o, speed: sp }); }   // legacy sevSay(o, 'thrown', true)
      else if (sp > P.HOT) { o.hot = clock.now() + P.HOT_MS; bus.emit('body.thrown', { body: o, speed: sp }); }   // legacy say(o, 'throw', true); notice('throw')
      else b.setBullet(false);
    } else if (g.moved) bus.emit('card.sprangBack', { card: o });   // legacy say(o, 'back', true)
    if (g.moved) { world.suppress = true; clock.real.after(0, () => { world.suppress = false; }); }
    return;
  }
  const press = world.press;
  if (!press || (e && e.pointerId !== press.id)) return;
  if (press.timer) press.timer(); press.card.classList.remove('grab-ready'); world.press = null;
}

function onMove(e) {
  const grab = world.grab;
  if (grab && (e.pointerId === grab.id || grab.sticky)) {
    grab.h.push([e.clientX + scrollX, e.clientY + scrollY, clock.now()]); if (grab.h.length > D.HISTORY) grab.h.shift();
    grab.cx = e.clientX; grab.cy = e.clientY;
    if (Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) > D.MOVE_PX) grab.moved = true;
    return;
  }
  const press = world.press;
  if (!press || e.pointerId !== press.id) return;
  const d = Math.hypot(e.clientX - press.x, e.clientY - press.y);
  if (!press.armed) { if (d > D.TOUCH_CANCEL_PX) { if (press.timer) press.timer(); world.press = null; } return; }
  if (d > D.MOVE_PX && world.pl) { const p = press; world.press = null; if (pullFn) pullFn(p, e); }   // legacy startPull(p, e)
}

export function install(app) {
  if (app && app.reduced) return;
  // ---- rooted cards ----
  document.getElementById('grid').addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.card');
    if (!card || isCrazy() || e.button > 0 || world.press || world.grab || card.classList.contains('held')) return;
    const press = world.press = { card, x: e.clientX, y: e.clientY, px: e.clientX + scrollX, py: e.clientY + scrollY, id: e.pointerId, armed: e.pointerType === 'mouse', timer: null };
    load().catch(() => {});
    if (e.pointerType === 'mouse') e.preventDefault();   // no text selection or link drag; the click still fires
    else press.timer = clock.real.after(D.TOUCH_ARM_MS, () => { if (world.press) { world.press.armed = true; card.classList.add('grab-ready'); navigator.vibrate?.(D.VIBRATE_MS); } });
  });
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', drop); addEventListener('pointercancel', drop);
  addEventListener('touchmove', (e) => { if (world.grab || world.press?.armed) e.preventDefault(); }, { passive: false });
  document.addEventListener('click', (e) => { if (world.suppress || e.target.closest?.('.shard, .piece')) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('dragstart', (e) => { if (e.target.closest?.('.card')) e.preventDefault(); });
  // loose cards can be picked up again anywhere on them
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest?.('#phys .phys'), o = el && el._o;
    if (!o || (o.kind !== 'card' && o.kind !== 'piece' && o.kind !== 'katana' && o.kind !== 'hand') || world.grab || e.button > 0) return;
    e.preventDefault(); hold(o, e.clientX + scrollX, e.clientY + scrollY, e);
  });
}
