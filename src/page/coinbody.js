// Keep the coin (chain coin-keep): after the coin game (scenes/coin.js keep()) the coin does not vanish: it drops onto the page
// as a small body of kind 'coin' and stays there. Pick it up and throw it like a card (world/drag.js).
//   thrown at the arm's hand   it plucks it out of the air and bites it like gold (actors/hand/behaviours/bite.js: 'hand.bit',
//                              the coin keeps the tooth mark), says "fake." and flicks it back ('hand.flicked')
//   left on the shelf          the hand reaches for the coin before any card on it (actors/shelf.js snack(): coins beat cards),
//                              the cards on the shelf are relieved ('card.spared', src/reactions.js), and it gets bitten the same way
//   let go on an empty slot    (a grid card ripped out of it, '.card.held') it shrinks into the slot and pays for the card:
//                              'coin.paid' { key } (src/reactions.js: cards.putBack(key, 'card.paid') grows it back at once, the hand
//                              remarks). The coin is spent
// One coin at a time (a new game's coin replaces the old one); "Put the cards back" ('world.reset') clears it. Like the toast
// (page/bread.js) it lands on the screen you are looking at: a ledge at the bottom of the viewport (a static body only the coin
// collides with) holds it until you pick it up or scroll; flicked back by the hand, it lands on your screen again the same way. It never smashes anything (world/shatter.js breaks cards only), the
// blade, the old hands and the search box leave it alone, and the hand never lunges for it in your hand: only a throw or the shelf.
// The physics is lazy: fall() loads planck and builds the world first. Reduced motion or crazy mode: no coin is kept.
// It speaks as the 'coin' speaker (lines coin.*, src/lines/coin.js): landing, thrown, bitten, flicked back, reached for.
// Random draws: only on its own path (its lines, their tilt, its spin). Test hook: __coin { drop(x, y, side), current() }.
import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock, real } from '../core/clock.js';
import { defineSpeaker, say } from '../core/speech.js';
import { hook } from '../core/debug.js';
import { world, load, init, add, remove, isCrazy, showReset } from '../world/world.js';
import { drawOffset } from '../world/loop.js';
import { makeLedge } from './ledge.js';

const K = TUNE.coinKeep, S = TUNE.physics.S;
let coin = null;
const ledge = makeLedge({ bit: K.LEDGE_BIT, scrollPx: K.LEDGE_SCROLL_PX, body: () => coin });   // page/ledge.js

const css = (el, s) => { Object.assign(el.style, s); return el; };
/** dress el as the coin: a gold disc with a milled rim and its side on it ('H', 'T' or '?') */
function look(el, label, d = K.D) {
  css(el, { width: d + 'px', height: d + 'px', boxSizing: 'border-box', borderRadius: '50%', border: '3px solid #a8741c', overflow: 'hidden',
    background: 'radial-gradient(circle at 35% 30%, #fff3c4 0 8%, #f2c95a 30%, #ebbb45 55%, #c8901f 100%)',
    boxShadow: 'inset 0 0 0 2px #d9a334, inset 0 0 6px rgba(120,70,0,.55), 0 3px 6px rgba(0,0,0,.3)', color: '#8a5d0e',
    font: '800 15px/1 system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 1px 0 #fff0b8' });
  el.textContent = label;
  return el;
}

// the outline: a SIDES-gon round the centre (local m), so it settles instead of rolling across the page for ever
const outline = (d) => Array.from({ length: K.SIDES }, (_, i) => { const a = (i / K.SIDES) * Math.PI * 2; return { x: Math.cos(a) * d / 2 / S, y: Math.sin(a) * d / 2 / S }; });

/** make the coin body at page px x, y with label on it (planck loaded, world built) */
function spawn(x, y, label, dir) {
  if (coin && world.bodies.has(coin)) remove(coin);
  const d = K.D, el = look(document.createElement('div'), label, d);
  el.className = 'phys coin-kept'; world.layer.appendChild(el);
  const o = coin = add({ kind: 'coin', el, w: d, h: d, ex: d / 2, ey: d / 2, side: label }, x / S, Math.min(y, world.size.H - d) / S, 0,
    new world.pl.Polygon(outline(d)), { density: K.DENSITY, filterCategoryBits: 1 | K.LEDGE_BIT });
  ledge.on();
  el._o = o;
  o.body.setLinearDamping(K.DAMPING);
  o.body.setLinearVelocity({ x: dir * K.POP[0], y: K.POP[1] }); o.body.setAngularVelocity(dir * K.SPIN);
  showReset();   // "Put the cards back" clears it
  say(o, 'coin.land', { force: true });
  bus.emit('coin.kept', { coin: o });
  clock.wake();
  return o;
}

/**
 * the coin game is over and its coin (the .coin element of scenes/coin.js) drops onto the page. side: 'heads' | 'tails' | null.
 * The element goes at once; the body comes as soon as the physics is there. Nothing in crazy mode, under reduced motion, or
 * when the element is already gone
 */
export function keep(el, side) {
  if (!el || !el.isConnected) return;
  const face = el.querySelector('.face'), r = (face || el).getBoundingClientRect();
  el.remove();
  if (world.reduced || isCrazy()) return;
  const x = r.left + r.width / 2 + scrollX, y = r.top + r.height / 2 + scrollY, label = side === 'heads' ? 'H' : side === 'tails' ? 'T' : '?';
  load().then(() => { if (isCrazy()) return; init(); spawn(x, y, label, x > innerWidth / 2 + scrollX ? -1 : 1); }, () => {});
}

/** the coin on the page, or null */
export const current = () => (coin && world.bodies.has(coin) ? coin : null);

// ---- spending it: let go on an empty slot ----
const inside = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
/** body.dropped: let go slowly over a slot a card was ripped out of? Then it goes in */
function dropped({ body: o, speed, x, y }) {
  if (!o || o !== coin || !world.bodies.has(o) || isCrazy() || !(speed <= K.MAX_SPEED)) return;
  const p = o.body.getPosition(), cx = p.x * S - scrollX, cy = p.y * S - scrollY, px = x - scrollX, py = y - scrollY;
  const slot = [...document.querySelectorAll('#grid .card.held')].find((c) => { const r = c.getBoundingClientRect(); return r.width > 0 && (inside(r, px, py) || inside(r, cx, cy)); });
  if (!slot || !slot.dataset.key) return;
  o.body.setLinearVelocity({ x: 0, y: 0 }); o.body.setAngularVelocity(0); o.body.setGravityScale(0); o.el.style.pointerEvents = 'none';
  real.after(0, () => spend(o, slot));   // out of drag.js's drop()
}
/** a copy of the coin shrinks into the middle of the slot; the coin leaves the world; 'coin.paid' */
function spend(o, slot) {
  if (!world.bodies.has(o)) return;
  const key = slot.dataset.key, r = slot.getBoundingClientRect(), p = o.body.getPosition();
  const ghost = o.el.cloneNode(true), t0 = o.el.style.transform || 'none';
  ghost.style.pointerEvents = 'none'; world.layer.appendChild(ghost);
  remove(o);
  const dx = r.left + scrollX + r.width / 2 - p.x * S, dy = r.top + scrollY + r.height / 2 - p.y * S;
  if (typeof ghost.animate === 'function') {
    ghost.animate([{ transform: t0, opacity: 1 }, { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) ${t0} scale(0.2)`, opacity: 0 }],
      { duration: K.SPENT_MS, easing: 'cubic-bezier(.55,0,.9,.45)', fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove());
  } else ghost.remove();
  bus.emit('coin.paid', { key });
}

// the bite leaves a mark: a half-moon taken out of its rim, where the hand had it
function mark(o) {
  if (o.el.querySelector('i')) return;
  const m = document.createElement('i'), s = K.MARK_PX;
  css(m, { position: 'absolute', right: -s / 2 + 'px', top: '18%', width: s + 'px', height: s + 'px', borderRadius: '50%', background: 'var(--bg)', boxShadow: 'inset 2px 0 2px rgba(120,70,0,.5)' });
  o.el.appendChild(m);
}

export function install(app) {
  if (app && app.reduced) return;
  defineSpeaker('coin', { kinds: ['coin'], prefix: 'coin.', gate: 'card', layer: () => world.layer,
    anchor: (o) => {   // like a card's: above the rotated coin, upright, offset like the held body is drawn
      const p = o.body.getPosition(), [hx, hy] = drawOffset(o);
      return { x: p.x * S + hx, ax: p.x * S + hx, y: p.y * S + hy - o.h / 2 + TUNE.speech.RIDE_DY };
    } });
  bus.on('body.thrown', ({ body }) => { if (body.kind === 'coin') say(body, 'coin.thrown', { force: true }); });
  bus.on('body.dropped', dropped);
  bus.on('hand.bit', ({ coin: o }) => { if (o && world.bodies.has(o)) { mark(o); say(o, 'coin.bitten', { force: true }); } });
  bus.on('hand.flicked', ({ coin: o }) => { if (o && world.bodies.has(o)) { ledge.on(); say(o, 'coin.flicked', { force: true }); } });   // back to you: it lands on your screen again
  bus.on('hand.reaching', ({ card }) => { if (card && card.kind === 'coin') say(card, 'coin.reached'); });   // unforced: now and then while it creeps up
  bus.on('body.removed', ({ body }) => { if (body === coin) { coin = null; ledge.off(); } });
  bus.on('world.reset', () => { if (coin && world.bodies.has(coin)) remove(coin); coin = null; ledge.off(); });
  // picked up, or the page scrolled: the ledge goes
  clock.onTick(() => ledge.tick(), 'late');
  addEventListener('scroll', () => { if (ledge.scroll()) clock.wake(); }, { passive: true });
  hook('__coin', {
    /** drop a coin at page px x, y (side 'heads' | 'tails' | null); resolves to the body, or null without physics */
    drop: (x, y, side = 'heads') => (isCrazy() ? Promise.resolve(null) : load().then(() => { init(); return spawn(x, y, side === 'heads' ? 'H' : side === 'tails' ? 'T' : '?', 1); })),
    current,
  });
}
