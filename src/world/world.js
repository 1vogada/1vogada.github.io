// The physics world and its shared state (legacy: the ~20 closure variables at the top of cardPhysics()).
//
// Legacy closure variable  ->  here
//   pl, loading, load()             world.pl, load()
//   world, ground, wallFx           world.b2, world.ground (walls are private to buildWalls)
//   layer (#phys), size             world.layer, world.size { W, H }
//   objs                            world.bodies (Set, insertion order = legacy objs order; the speech layout and every scan use it)
//   rootOf, ripped                  world.rootOf (grid card element -> its rooted body), world.ripped (keys of torn-out cards)
//   press, grab                     world.press, world.grab (read them; only drag.js writes them, through hold()/drop())
//   hits, blasts                    world.hits, world.blasts (queued by begin-contact, drained in the 'impacts'/'blasts' steps)
//   bits, wounds                    fx.js (world.bits is the same array, for __cards.bits)
//   tick (stroke tick), screamed    cut.js
//   katObj                          world.blade: the body whose tip cuts (the katana actor sets it with setBlade). The hand reads
//                                   world.blade for the sever check and the severed hand for fleeing: actors never import katana.js
//   smashed, resetBtn, suppress     world.smashed, showReset(), world.suppress
//   loopOn/last/acc, hiddenAt/away  core/clock.js
//   DBG                             world.dbg (core/debug.js flags().dbg, read at install; a test may switch it on later)
//   claw, sevs, shelf               the actors (hand, severed, shelf); the world never reads them. remove() emits 'body.removed'
//                                   (legacy sevGone and katObj = null), buildWalls() emits 'world.resized' (legacy shelfOff/shelfOn)
//                                   __cards.state() asks the actors through report(name, fn) for found / claw / shelf;
//                                   __cards.reported() any other name an actor reports (the test recorder records them)
//
// A body record (legacy `o`): { kind: 'card' | 'piece' | 'shard' | 'katana' | 'hand', body (planck Body), el, w, h, ex, ey,
//   px, py, pa (pose before the last step, for interpolation), key?, root? { x, y } (m), grip?, strained?, hot? (ms), die? (ms),
//   poly? (local outline px), born? (stroke tick), say?, said?, lvl?, tug?, sq?, tips?, tipWas?, tipDt?, open?, ... }
// Owners keep their own scratch on the record (o.tug: hand, o.sq: severed, o.ai/o.hand: severed); others ask core/claims.js.

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { hush, defineSpeaker, setLayoutSource } from '../core/speech.js';
import { hook, flags } from '../core/debug.js';
import { onContact } from './shatter.js';
import { hold, drop, carry, onPull, onTear, onGive, onSnap } from './drag.js';
import { clearBits } from './fx.js';

export { hold, drop, carry, onPull, onTear, onGive, onSnap };

export const S = TUNE.physics.S;
export const DT = TUNE.physics.DT;
const P = TUNE.physics;

/**
 * @typedef {object} Grab  legacy `grab`
 * @property {object} o        the body record held
 * @property {object} joint    planck MouseJoint
 * @property {number} id       pointerId (-1: equipped by double-click)
 * @property {number} cx       pointer clientX now   @property {number} cy
 * @property {number} sx       clientX at the grab   @property {number} sy
 * @property {number} hx       grab point, m (page)  @property {number} hy
 * @property {boolean} moved   moved more than TUNE.drag.MOVE_PX
 * @property {Array<[number, number, number]>} h   recent pointer samples [pageX, pageY, now()]
 * @property {boolean} [sticky] an equipped katana: pointer-up does not drop it
 * @property {number} [edge]   ms rested at a screen edge (autoscroll)
 */

/** the shared world state. Fields are live; reassigned only by the world package */
export const world = {
  S, DT,
  /** planck namespace once loaded, else null */ pl: null,
  /** planck World */ b2: null,
  /** static body holding walls and the shelf */ ground: null,
  /** the #phys layer element (bodies, bubbles, particles live in it) */ layer: null,
  /** page size the walls enclose */ size: { W: 0, H: 0 },
  /** every body record, in insertion order (legacy objs) */ bodies: new Set(),
  /** grid card element -> its rooted body while pulled or springing back */ rootOf: new Map(),
  /** data-keys of cards torn out of the grid */ ripped: new Set(),
  /** data-key -> how many notches a grid card's root has given (it comes out like a tooth) */ loose: new Map(),
  /** data-key -> how many tugs that card needs in all (1 or 2, rolled the first time it is pulled) */ tugs: new Map(),
  /** @type {Grab|null} */ grab: null,
  /** a pointer press on a grid card that has not started a pull yet */ press: null,
  /** the katana body whose tip cuts, or null */ blade: null,
  /** queued impacts and shoves, drained after world.step */ hits: [], blasts: [],
  /** particles (fx.js) */ bits: [],
  /** cards smashed this visit (toasts at 1 and 10) */ smashed: 0,
  /** the click after a drag is swallowed */ suppress: false,
  /** prefers-reduced-motion: no physics at all */ reduced: false,
  /** legacy DBG (?dbg): log release and impact speeds */ dbg: false,
};

let loading = null, wallFx = [], resetBtn = null;
const html = () => document.documentElement;

/** load planck (lazily, legacy load()). @returns {Promise<object>} the planck namespace */
export function load() {
  if (window.planck) return Promise.resolve(world.pl = window.planck);
  return loading || (loading = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = '/vendor/planck-1.4.2.min.js';
    s.onload = () => res(world.pl = window.planck); s.onerror = rej; document.head.appendChild(s);
  }));
}

/** create the world, ground, #phys layer, walls and contact listener once (legacy init()) */
export function init() {
  if (world.b2) return;
  const pl = world.pl;
  world.b2 = new pl.World({ gravity: { x: 0, y: P.GRAVITY } });
  world.ground = world.b2.createBody();
  const layer = world.layer = document.createElement('div'); layer.id = 'phys'; document.body.appendChild(layer);
  buildWalls();
  world.b2.on('begin-contact', onContact);
  addEventListener('resize', buildWalls);
  new ResizeObserver(buildWalls).observe(document.body);
}

// the world is the whole page: floor at the bottom of the page, walls at its sides, a lid at the very top
/** rebuild the walls around the page (legacy buildWalls); emits 'world.resized' */
export function buildWalls() {
  const pl = world.pl, ground = world.ground;
  const foot = document.querySelector('footer.bottom').getBoundingClientRect();
  const W = html().clientWidth, H = Math.max(innerHeight, Math.round(foot.bottom + scrollY));
  if (W === world.size.W && H === world.size.H) return;
  world.size = { W, H }; world.layer.style.width = W + 'px'; world.layer.style.height = H + 'px';
  for (const f of wallFx) ground.destroyFixture(f);
  const w = W / S, h = H / S, T = P.WALL.thickness;
  const box = (cx, cy, hw, hh) => ground.createFixture({ shape: new pl.Box(hw, hh, { x: cx, y: cy }, 0), friction: P.WALL.friction, filterCategoryBits: P.WALL.category });
  wallFx = [box(w / 2, h + T, w / 2 + 2 * T, T), box(w / 2, -T, w / 2 + 2 * T, T), box(-T, h / 2, T, h / 2 + 2 * T), box(w + T, h / 2, T, h / 2 + 2 * T)];
  for (const o of world.bodies) {
    if (o.root) continue;
    const p = o.body.getPosition();
    if (p.y > h || p.x < 0 || p.x > w) o.body.setTransform({ x: Math.max(0.5, Math.min(w - 0.5, p.x)), y: Math.min(p.y, h - 1) }, o.body.getAngle());
    o.body.setAwake(true);
  }
  bus.emit('world.resized', { W, H });   // legacy: if (shelf) { shelfOff(); shelfOn(y) }
  clock.wake();
}

const RIPPED = 'kiripad-ripped';
/** a card left its slot: note its key, and remember for the rest of the tab's session that one ever did (the hand shows itself only after that) */
export function markRipped(key) { world.ripped.add(key); if (!world.everRipped) { world.everRipped = true; try { sessionStorage.setItem(RIPPED, '1'); } catch (e) {} } }
/** has a card ever been taken out of its slot in this tab (kept in sessionStorage across reloads) */
export function everRipped() { if (!world.everRipped) { try { world.everRipped = sessionStorage.getItem(RIPPED) === '1'; } catch (e) {} } return !!world.everRipped; }

/** a copy of a grid card for the physics layer (legacy cloneCard) */
export function cloneCard(card) {
  const el = card.cloneNode(true);
  const uid = 'p' + Math.random().toString(36).slice(2, 8);
  el.querySelectorAll('pattern[id]').forEach((pt) => { const old = pt.id; pt.id = old + uid; el.querySelectorAll('rect[fill]').forEach((x) => { if (x.getAttribute('fill') === `url(#${old})`) x.setAttribute('fill', `url(#${old + uid})`); }); });
  const c1 = card.style.getPropertyValue('--c1');
  el.removeAttribute('style'); el.style.setProperty('--c1', c1);
  el.classList.remove('held', 'pulling', 'regrow', 'settled', 'grab-ready', 'grabbed'); el.classList.add('phys');
  return el;
}

/** make o a dynamic body and add it (legacy addBody). @returns o */
export function add(o, x, y, angle, shape, opt) {
  o.body = world.b2.createBody({ type: 'dynamic', position: { x, y }, angle, linearDamping: P.LINEAR_DAMPING, angularDamping: P.SPIN });
  o.body.createFixture({ shape, ...P.CARD, ...opt });
  o.body.setGravityScale(o.root ? 0 : P.FALL);
  o.body.setUserData(o); o.px = x; o.py = y; o.pa = angle;
  world.bodies.add(o);
  bus.emit('body.added', { body: o });
  return o;
}

/** take o out: drop it if held, hush its bubble, emit 'body.removed', destroy (legacy remove) */
export function remove(o) {
  if (world.grab && world.grab.o === o) drop();
  hush(o);
  bus.emit('body.removed', { body: o });   // legacy: if (o === katObj) katObj = null; if (o.kind === 'hand') sevGone(o)
  world.b2.destroyBody(o.body); world.bodies.delete(o);
  if (o.root) { world.rootOf.delete(o.el); o.el.classList.remove('pulling'); o.el.style.transform = ''; }
  else o.el.remove();
}

/** @returns {boolean} the pointer holds o */
export const isHeld = (o) => !!world.grab && world.grab.o === o;

/** page px of local point q (px from the body centre). @returns {[number, number]} */
export const toPage = (o, q) => { const p = o.body.getPosition(), a = o.body.getAngle(), c = Math.cos(a), s = Math.sin(a); return [p.x * S + q[0] * c - q[1] * s, p.y * S + q[0] * s + q[1] * c]; };
/** local px of page point q. @returns {[number, number]} */
export const toLocal = (o, q) => { const p = o.body.getPosition(), a = o.body.getAngle(), c = Math.cos(a), s = Math.sin(a), dx = q[0] - p.x * S, dy = q[1] - p.y * S; return [dx * c + dy * s, -dx * s + dy * c]; };
/** the card's rectangle as a local outline (legacy rectPoly) */
export const rectPoly = (o) => [[0, 0], [o.w, 0], [o.w, o.h], [0, o.h]];
/** o's outline in page px (legacy worldPoly) */
export function worldPoly(o) {
  const p = o.body.getPosition(), a = o.body.getAngle(), c = Math.cos(a), s = Math.sin(a);
  return (o.poly || rectPoly(o)).map(([x, y]) => { const lx = x - o.w / 2, ly = y - o.h / 2; return [p.x * S + lx * c - ly * s, p.y * S + lx * s + ly * c]; });
}

/** a grid card cut where it stands comes loose on the spot (legacy freeCard). @returns the body record */
export function freeCard(card) {
  card.classList.add('settled');
  const r = card.getBoundingClientRect(), el = cloneCard(card);
  el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; world.layer.appendChild(el);
  const o = add({ kind: 'card', el, w: r.width, h: r.height, ex: r.width / 2, ey: r.height / 2, key: card.dataset.key },
    (r.left + r.width / 2 + scrollX) / S, (r.top + r.height / 2 + scrollY) / S, 0, new world.pl.Box(r.width / 2 / S, r.height / 2 / S));
  el._o = o; card.classList.add('held'); markRipped(o.key); showReset();
  return o;
}

// a piece of a card: same origin and angle as the card it came from, its outline as the collision shape and as the clip-path
/** a piece of src with outline poly, same pose (legacy fragment). @returns the new body record */
export function fragment(src, poly, kind, opt, extra) {
  const b = src.body, pos = b.getPosition(), W = src.w, H = src.h, el = cloneCard(src.el);
  el.classList.add(kind); el.style.width = W + 'px'; el.style.height = H + 'px';
  el.style.clipPath = `polygon(${poly.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
  world.layer.appendChild(el);
  const s = add({ kind, el, w: W, h: H, ex: W / 2, ey: H / 2, poly, ...extra }, pos.x, pos.y, b.getAngle(), new world.pl.Polygon(poly.map(([x, y]) => ({ x: (x - W / 2) / S, y: (y - H / 2) / S }))), opt);
  el._o = s; return s;
}

// ---- put everything back ----
// legacy: the button sits in the .phys-actions bar the katana made (next to "Put the katana back")
const actionsBar = () => {
  let a = document.querySelector('.phys-actions');
  if (!a) { a = document.createElement('div'); a.className = 'phys-actions'; document.body.appendChild(a); }   // the katana is not installed
  return a;
};
/** show "Put the cards back" (legacy showReset) */
export function showReset() {
  if (resetBtn) { resetBtn.hidden = false; return; }
  resetBtn = document.createElement('button'); resetBtn.type = 'button'; resetBtn.className = 'btn ghost reset-cards'; resetBtn.textContent = 'Put the cards back';
  resetBtn.addEventListener('click', reset); actionsBar().appendChild(resetBtn);
}
/**
 * "Put the cards back" (legacy resetAll): emits 'world.reset' first (legacy clawReset; each actor resets itself on it: the
 * cut's wounds, the katana back in the banner, the grid cards regrow), then removes every body, the bits and the queues
 */
export function reset() {
  bus.emit('world.reset', {});
  for (const o of [...world.bodies]) remove(o);
  clearBits();
  world.hits.length = 0; world.blasts.length = 0; world.ripped.clear(); world.loose.clear(); world.tugs.clear(); if (resetBtn) resetBtn.hidden = true;
}

/** the body whose tip cuts (the katana actor calls it) */
export function setBlade(o) { world.blade = o; }
/** crazy mode is on (no physics, no hand) */
export const isCrazy = () => typeof document !== 'undefined' && document.documentElement.classList.contains('crazy');

// ---- __cards.state(): what the actors report about themselves (legacy read claw, shelf, found from the closure) ----
const reports = new Map();
/**
 * an actor reports a field of __cards.state(): 'found' (katana uncovered), 'katana' (legacy katObj, rooted or loose; default
 * world.blade), 'claw' (the claw record or null), 'shelf' (the shelf or null). Any other name is a field for the test recorder:
 * __cards.reported() gives { name: fn() } for those, and the scenario trace records each one while it is not null (keep it small
 * and plain: a state name, a number, a short object)
 */
export function report(name, fn) { reports.set(name, fn); }
const ask = (name, dflt) => { const f = reports.get(name); return f ? f() : dflt; };
const BUILT_IN = new Set(['found', 'katana', 'claw', 'shelf']);
const reported = () => { const out = {}; for (const [name, f] of reports) if (!BUILT_IN.has(name)) out[name] = f(); return out; };

export function install(app) {
  world.reduced = !!(app && app.reduced);
  if (world.reduced) return;   // legacy cardPhysics(): `if (reduced) return;` before anything
  world.dbg = flags().dbg;
  document.getElementById('grid').addEventListener('pointerover', () => load().catch(() => {}), { once: true });
  // sayAt bubbles (the smash scream, a stab or a cut in the grid) are left in the #phys layer, like legacy bubble()
  defineSpeaker('page', { layer: () => world.layer });
  setLayoutSource(() => world.bodies);
  hook('__cards', { objs: world.bodies, S, bits: world.bits, drag: TUNE.drag /* live: the harness turns TEETH off for a one-pull rip */,
    state: () => ({ grab: world.grab, press: world.press, loopOn: clock.running(), size: world.size, found: ask('found', false), katana: ask('katana', world.blade), claw: ask('claw', null), shelf: ask('shelf', null) }), reported });
}
