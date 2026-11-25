// 棚 the shelf: a secret (legacy shelfOn, shelfOff, onShelf, nearShelf, shelfSnack, window.__shelf).
// The code is written in the top right corner of the banner, under the fog. Type it (tana, рафт, たな), Enter it in the
// search box, or tap the uncovered writing (page/kiri.js and page/search.js call toggle()) and a shelf comes out of the
// left edge, where you are looking; do it again and it goes. It is part of the ground, like the floor. A card left lying on
// it is a card nobody is holding: the hand comes for it, slowly, with its whole arm out across the screen (the hand reads
// it through hand.senses(), wired in src/reactions.js).
// install(app): world.resized -> rebuilt at the same y (legacy buildWalls did shelfOff + shelfOn); it survives world.reset
// (legacy resetAll never touched it); hook('__shelf', toggle); report('shelf', ...) for __cards.state().shelf.

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { line } from '../core/lines.js';
import { hook } from '../core/debug.js';
import { world, load, init, report, isCrazy } from '../world/world.js';

const S = TUNE.physics.S, T = TUNE.shelf;

/** legacy `shelf`: { fx, el, x0, x1, y, w, want } or null */
let shelf = null;

function on(at) {
  const W = world.size.W, w = Math.min(T.MAX_W, W * T.W_FRAC), x0 = 0, x1 = w;   // on the very left: the hand has to come all the way across the screen for it
  const hero = document.getElementById('hero');
  const clear = hero.getBoundingClientRect().bottom + scrollY + T.CLEAR_PX;   // low enough that a card lying on it does not cover the katana in the banner
  const y = Math.round(Math.max(T.TOP, Math.min(world.size.H - T.BOTTOM, at ?? Math.min(Math.max(scrollY + innerHeight * T.VIEW, clear), scrollY + innerHeight - T.VIEW_BOTTOM))));
  const fx = world.ground.createFixture({ shape: new world.pl.Box(w / 2 / S, 0.07, { x: (x0 + w / 2) / S, y: (y + 7) / S }, 0), friction: T.FRICTION, filterCategoryBits: 3 });
  const el = document.createElement('div'); el.className = 'shelf'; el.style.left = x0 + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; world.layer.prepend(el);
  shelf = { fx, el, x0, x1, y, w, want: false };
  for (const o of world.bodies) o.body.setAwake(true);
  clock.wake();
}
function off() { world.ground.destroyFixture(shelf.fx); shelf.el.remove(); shelf = null; for (const o of world.bodies) o.body.setAwake(true); clock.wake(); }

/** o lies on the shelf (legacy onShelf). @returns boolean */
export function holds(o) {
  if (!shelf || !world.bodies.has(o)) return false;
  for (let ce = o.body.getContactList(); ce; ce = ce.next) { const k = ce.contact; if ((k.getFixtureA() === shelf.fx || k.getFixtureB() === shelf.fx) && k.isTouching()) return true; }
  return false;
}
/** the pointer (viewport px) is near the shelf: the hand stays back (legacy nearShelf). @returns boolean */
export const near = (P) => { const [l, r, u, d] = T.NEAR; return !!shelf && P[0] + scrollX > shelf.x0 - l && P[0] + scrollX < shelf.x1 + r && P[1] + scrollY > shelf.y - u && P[1] + scrollY < shelf.y + d; };
/** a card or a big piece lying still on the shelf, on screen, in nobody's hand (legacy shelfSnack). @returns body record | null */
export function snack() {
  if (!shelf) return null;
  const grab = world.grab;
  for (const o of world.bodies) {
    if ((o.kind !== 'card' && (o.kind !== 'piece' || o.die)) || o.root || o.tug || o.sq || (grab && grab.o === o) || !holds(o)) continue;
    const w = o.body.getWorldCenter(), sy = w.y * S - scrollY; if (sy < 60 || sy > innerHeight - 40 || o.body.getLinearVelocity().length() > 0.6) continue;
    return o;
  }
  return null;
}
/** the hand wants what is on it (legacy `if (shelf) shelf.want = !!q`; keeps the loop awake) */
export function want(v) { if (shelf) shelf.want = !!v; }
/** @returns {{ fx, el, y: number, x0: number, x1: number, w: number, want: boolean } | null} the shelf itself (legacy __cards.state().shelf) */
export const state = () => shelf;

/** type tana: out if it is in, in if it is out (legacy window.__shelf); toasts; emits shelf.opened / shelf.closed */
export function toggle() {
  if (isCrazy()) return;
  load().then(() => {
    init();
    if (shelf) { off(); bus.emit('ui.toast', { msg: line('toast.shelfGone') }); bus.emit('shelf.closed', {}); }
    else { on(); bus.emit('ui.toast', { msg: line(world.ripped.size ? 'toast.shelfIn' : 'toast.shelfFirst') }); bus.emit('shelf.opened', { y: shelf.y }); }
  }).catch(() => {});
}

const wanted = () => !!shelf && shelf.want;

export function install(app) {
  if (app && app.reduced) return;   // legacy: inside cardPhysics(), so no window.__shelf without physics
  bus.on('world.resized', () => { if (shelf) { const y = shelf.y; off(); on(y); } });
  clock.hasWork(wanted);
  clock.keepAwake(wanted);
  report('shelf', () => shelf);
  hook('__shelf', toggle);
}
