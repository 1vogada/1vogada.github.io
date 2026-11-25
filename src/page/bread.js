// Toast for the hand: the toast you clicked five times (page/toast.js) is knocked off the bottom of the screen and lands on the
// page as a body of kind 'toast': a slice of slightly burnt bread with the message still on it. Pick it up and throw it like a
// card (world/drag.js). Thrown at the arm's hand, it is caught out of the air and eaten on the spot (actors/hand/behaviours/
// catch.js, eat.js: 'hand.ate'), and the trophy wall pins it up (page/basement.js draws it with look()).
// It lands on the screen you are looking at: a ledge at the bottom of the viewport (a static body only the slice collides with)
// holds it until you pick it up or scroll; after that it is a loose body like any other and falls to the page bottom.
// One slice at a time (a new one replaces the old); "Put the cards back" ('world.reset') clears it. It never smashes anything
// (world/shatter.js only breaks cards), the blade, the shelf and the old hands leave it alone, and the hand never lunges for it
// in your hand: only a throw feeds it.
// The physics is lazy: fall() loads planck and builds the world first, like actors/shelf.js toggle. Reduced motion or crazy
// mode: fall() says no and the toast tumbles off the screen as before.
// It speaks as the 'bread' speaker (lines bread.*, src/lines/page.js): popping out, thrown ('body.thrown'), caught ('hand.grabbed').
// Random draws: only on its own path (its lines and their tilt).
import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { defineSpeaker, say } from '../core/speech.js';
import { world, load, init, add, remove, isCrazy, showReset, isHeld } from '../world/world.js';
import { drawOffset } from '../world/loop.js';

const B = TUNE.bread, S = TUNE.physics.S;
let slice = null, ledge = null, ledgeY = 0;

// the ledge: collides only with the slice (its own category bit; cards, pieces and hands pass through it)
function ledgeOn() {
  ledgeOff();
  const pl = world.pl, T = TUNE.physics.WALL.thickness, w = innerWidth / S;
  ledgeY = scrollY;
  ledge = world.b2.createBody({ position: { x: scrollX / S + w / 2, y: (scrollY + innerHeight) / S + T } });
  ledge.createFixture({ shape: new pl.Box(w / 2, T), friction: TUNE.physics.WALL.friction, filterCategoryBits: B.LEDGE_BIT, filterMaskBits: B.LEDGE_BIT });
}
function ledgeOff() {
  if (!ledge) return;
  world.b2.destroyBody(ledge); ledge = null;
  if (slice && world.bodies.has(slice)) slice.body.setAwake(true);
}

const css = (el, s) => { Object.assign(el.style, s); return el; };
/** dress el as the slice: crust, crumb, a few burnt spots, the message printed on it. @returns el */
export function look(el, msg, w = B.W, h = B.H) {
  css(el, { width: w + 'px', height: h + 'px', boxSizing: 'border-box', borderRadius: '46% 46% 12% 12% / 40% 40% 12% 12%',
    border: '7px solid #7a4520', padding: '24px 11px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    background: 'radial-gradient(circle at 28% 70%, rgba(70,35,10,.55) 0 5px, transparent 7px), radial-gradient(circle at 74% 34%, rgba(70,35,10,.5) 0 4px, transparent 6px), radial-gradient(circle at 64% 80%, rgba(70,35,10,.4) 0 3px, transparent 5px), radial-gradient(ellipse at 50% 58%, #f4dca6 0 40%, #dcaa5e 72%, #a8692e 100%)',
    boxShadow: 'inset 0 0 14px rgba(70,35,10,.5), 0 6px 14px rgba(0,0,0,.25)', color: '#3a2412', font: '700 11px/1.25 system-ui, sans-serif',
    textAlign: 'center', wordBreak: 'break-word' });
  el.textContent = msg || '';
  return el;
}

// the outline: flat at the bottom and the sides, a rounded crown (local px from the centre, a convex octagon)
const outline = (w, h) => [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h * 0.12], [w * 0.4, -h * 0.4], [w * 0.16, -h / 2], [-w * 0.16, -h / 2], [-w * 0.4, -h * 0.4], [-w / 2, -h * 0.12]];

/**
 * knock the toast off the screen onto the page. msg: what it said; r: the toast's client rect; dir: 1 or -1, which way it spins.
 * @returns {Promise<boolean>} false when there is no physics (reduced motion, crazy mode, planck failed): the caller animates it
 */
export function fall(msg, r, dir) {
  if (world.reduced || isCrazy()) return Promise.resolve(false);
  return load().then(() => { if (isCrazy()) return false; init(); spawn(msg, r, dir); return true; }, () => false);
}

function spawn(msg, r, dir) {
  if (slice && world.bodies.has(slice)) remove(slice);
  const w = B.W, h = B.H, el = look(document.createElement('div'), msg, w, h);
  el.className = 'phys toast-bread'; world.layer.appendChild(el);
  const x = (r.left + r.width / 2 + scrollX) / S, y = Math.min((r.top + r.height / 2 + scrollY) / S, world.size.H / S - h / 2 / S);
  const o = slice = add({ kind: 'toast', el, w, h, ex: w / 2, ey: h / 2, msg }, x, y, 0,
    new world.pl.Polygon(outline(w, h).map(([px, py]) => ({ x: px / S, y: py / S }))), { density: B.DENSITY, filterCategoryBits: 1 | B.LEDGE_BIT });
  ledgeOn();
  el._o = o;
  o.body.setLinearDamping(B.DAMPING);
  o.body.setLinearVelocity({ x: dir * B.POP[0], y: B.POP[1] }); o.body.setAngularVelocity(dir * B.SPIN);
  showReset();   // "Put the cards back" clears it
  say(o, 'bread.pop', { force: true });
  clock.wake();
}

/** the slice on the page, or null */
export const current = () => (slice && world.bodies.has(slice) ? slice : null);

export function install(app) {
  if (app && app.reduced) return;
  defineSpeaker('bread', { kinds: ['toast'], prefix: 'bread.', gate: 'card', layer: () => world.layer,
    anchor: (o) => {   // like a card's: above the rotated slice, upright, offset like the held body is drawn
      const p = o.body.getPosition(), a = o.body.getAngle(), [hx, hy] = drawOffset(o), top = Math.abs(Math.sin(a)) * o.w / 2 + Math.abs(Math.cos(a)) * o.h / 2;
      return { x: p.x * S + hx, ax: p.x * S + hx, y: p.y * S + hy - top + TUNE.speech.RIDE_DY };
    } });
  bus.on('body.thrown', ({ body }) => { if (body.kind === 'toast') say(body, 'bread.thrown', { force: true }); });
  bus.on('hand.grabbed', ({ card }) => { if (card.kind === 'toast' && world.bodies.has(card)) say(card, 'bread.caught', { mode: 'plain' }); });
  bus.on('body.removed', ({ body }) => { if (body === slice) { slice = null; ledgeOff(); } });
  bus.on('world.reset', () => { if (slice && world.bodies.has(slice)) remove(slice); slice = null; ledgeOff(); });
  // picked up, or the page scrolled: the ledge goes
  clock.onTick(() => { if (ledge && (!slice || isHeld(slice) || Math.abs(scrollY - ledgeY) > B.LEDGE_SCROLL_PX)) ledgeOff(); }, 'late');
  addEventListener('scroll', () => { if (ledge && Math.abs(scrollY - ledgeY) > B.LEDGE_SCROLL_PX) { ledgeOff(); clock.wake(); } }, { passive: true });
}
