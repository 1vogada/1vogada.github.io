// The katana: planted in the banner behind the fog, revealed by wiping, pulled out like a card, equipped by double-click
// (legacy katanaSvg, hero, kat, katIn, sheatheBtn, actions, found, near, lastWipe, the reveal pointermove, KAT_REST, the katIn
// pointerdown, plant, freeKatana, EQUIP_ANGLE, equip, dblclick, putBack, the sheathe / kat clicks, the Escape keydown, katObj, k9).
// install(app): creates .katana and .phys-actions (with the sheathe button) in legacy DOM order, registers its listeners
// (hero pointermove BEFORE page/fog.js registers its own), defineSpeaker('katana', ...), own listeners: katana.dropped ->
// 'katana.drop' line, body.removed -> forget the body / setBlade(null), world.reset -> back in the banner.
// The cut itself (the tip, the wounds, slice) is world/cut.js, which reads world.blade (legacy katObj; set here with setBlade).
//
// Events emitted here:
//   'katana.found'    { }          the fog was wiped off it (after its toast)
//   'katana.drawn'    { katana }   torn out of the banner (legacy freeKatana: after "khello", legacy notice('katana'))
//   'katana.equipped' { katana }   double-clicked into the hand (after "khello", legacy notice('katana'), before the joint target)
//   'katana.sheathed' { katana }   put back (after it left the world; katana: the body it was, or null if it was never planted)
//   'ui.toast'        { msg }      toast.katanaFound, toast.katanaDrawn

import { TUNE, TIMING } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { defineSpeaker, say } from '../core/speech.js';
import { line } from '../core/lines.js';
import { world, load, init, add, remove, hold, drop, carry, onTear, setBlade, report, isCrazy } from '../world/world.js';
import { drawOffset } from '../world/loop.js';

const S = TUNE.physics.S, K = TUNE.katana;

// slim curved blade, small round black guard on a gold collar, black wrapped grip with white diamonds (hilt up, tip down)
/** the drawing (legacy katanaSvg(id)); the phrasebook prints it too. @returns {string} SVG markup */
export const katanaSvg = (id) => `<svg viewBox="0 0 40 300" width="40" height="300" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#fbfcfd"/><stop offset=".5" stop-color="#d5dade"/><stop offset="1" stop-color="#9aa3ab"/></linearGradient></defs>
      <path d="M16.5 97 L23.5 97 C24.5 165 28 240 36 298 C26 250 18.5 170 16.5 97Z" fill="url(#${id})" stroke="#7b858e" stroke-width=".6"/><path d="M18.3 100 C19.6 170 24 240 33 289" fill="none" stroke="#fff" stroke-width="1" opacity=".9"/>
      <rect x="16" y="89" width="8" height="9" rx="1" fill="#e3c32f"/><ellipse cx="20" cy="86.5" rx="13" ry="4.2" fill="#121214"/>
      <rect x="15" y="4" width="10" height="80" rx="2.5" fill="#17181c"/>${[9, 20, 31, 42, 53, 64, 75].map((y) => `<path d="M20 ${y} l2.6 3.4 l-2.6 3.4 l-2.6 -3.4z" fill="#f1f1ee"/>`).join('')}
      <rect x="14.5" y="2" width="11" height="5" rx="2" fill="#0d0d0f"/><path d="M20 4 L20 97 C22 165 26 240 35 296" fill="none" stroke="transparent" stroke-width="16" stroke-linecap="round"/></svg>`;

let kat = null, katIn = null, sheatheBtn = null;
let found = false, near = 0, lastWipe = null, katObj = null;
const setKat = (o) => { katObj = o; setBlade(o); };
const toast = (key) => bus.emit('ui.toast', { msg: line(key) });

/** the planted, rooted body (legacy plant) */
export function plant() {
  katIn.classList.add('pulling'); katIn.style.transform = `translateY(${K.REST}px)`;
  const pl = world.pl, r = katIn.getBoundingClientRect(), hx = r.left + r.width / 2 + scrollX, hy = r.top + r.height / 2 + scrollY;
  setKat(add({ kind: 'katana', el: katIn, w: 40, h: 300, ex: hx, ey: hy - K.REST, grip: 1, root: { x: hx / S, y: hy / S } },
    hx / S, hy / S, 0, new pl.Box(0.06, 0.48, { x: 0, y: -1.0 }, 0), { density: K.HILT.density, filterCategoryBits: K.CATEGORY, filterMaskBits: 0 }));   // the hilt carries most of the weight
  // the solid parts follow the drawing: grip, round guard, and a thin blade that leans out to the curved tip
  const part = { ...K.PART, filterCategoryBits: K.CATEGORY, filterMaskBits: 0 };
  katObj.body.createFixture({ shape: new pl.Box(0.13, 0.045, { x: 0, y: -0.635 }, 0), density: K.HILT.density, ...part });
  katObj.body.createFixture({ shape: new pl.Polygon([{ x: -0.035, y: -0.55 }, { x: 0.035, y: -0.55 }, { x: 0.17, y: 1.46 }, { x: 0.12, y: 1.48 }]), density: K.BLADE.density, ...part });
  return katObj;
}

/** torn out of the banner (legacy freeKatana): 'katana.hello', then emit 'katana.drawn' */
export function free(o) {   // the root tore: from the banner into the world
  const el = document.createElement('div'); el.className = 'phys katana-body'; el.innerHTML = katanaSvg('kat-b'); el._o = o; world.layer.appendChild(el);
  katIn.classList.remove('pulling'); katIn.style.transform = ''; kat.classList.add('away'); sheatheBtn.hidden = false;
  o.el = el; o.ex = 20; o.ey = 150; o.root = null; o.tips = null;
  o.body.setGravityScale(TUNE.physics.FALL);
  for (let f = o.body.getFixtureList(); f; f = f.getNext()) f.setFilterData({ groupIndex: 0, categoryBits: K.CATEGORY, maskBits: K.MASK_LOOSE });   // it lands on the floor and walls but passes through cards: it cuts them instead
  const grab = world.grab;
  if (grab && grab.o === o) { grab.joint.setFrequency(TUNE.drag.HAND_HZ); grab.joint.setDampingRatio(TUNE.drag.HAND_DAMPING); carry(o); }
  toast('toast.katanaDrawn'); say(o, 'katana.hello', { force: true });
  bus.emit('katana.drawn', { katana: o });   // legacy notice('katana')
}

// double-click: the katana jumps into the hand by its grip and stays there without holding the button. Double-click again or Esc lets go
/** double-click: into the hand at a steady angle (legacy equip): 'katana.hello', then emit 'katana.equipped' */
export function equip(e) {
  if (!world.pl || !found || isCrazy()) return;
  init(); if (world.grab) { if (world.grab.o !== katObj) return; drop(); }
  if (!katObj) plant();
  if (katObj.root) free(katObj);
  const o = katObj;
  // in the hand it is held at one steady angle, blade up and leaning forward, and does not swing
  o.body.setTransform(o.body.getPosition(), K.EQUIP_ANGLE); o.body.setFixedRotation(true); o.body.setAngularVelocity(0); o.pa = K.EQUIP_ANGLE; o.tips = null;
  const g = o.body.getWorldPoint({ x: K.GRIP_LOCAL[0], y: K.GRIP_LOCAL[1] });
  hold(o, g.x * S, g.y * S, { pointerId: -1, clientX: e.clientX, clientY: e.clientY });
  const grab = world.grab;
  grab.sticky = true; grab.moved = true; o.el.classList.add('equipped'); say(o, 'katana.hello');
  bus.emit('katana.equipped', { katana: o });   // legacy notice('katana')
  grab.joint.setTarget({ x: (e.clientX + scrollX) / S, y: (e.clientY + scrollY) / S });
}

/** back in the banner (legacy putBack): emits 'katana.sheathed' */
export function putBack() {
  const o = katObj;
  if (katObj) remove(katObj); setKat(null); kat.classList.remove('away'); sheatheBtn.hidden = true;
  bus.emit('katana.sheathed', { katana: o });
}

/** the katana body or null (legacy katObj) */ export const body = () => katObj;
/** out of the ground and in the world (legacy k9()) */ export const loose = () => !!katObj && !katObj.root;
/** legacy say(katObj, 'kbrag', true) when it took the hand off */ export const brag = () => say(katObj, 'katana.brag', { force: true });
/** the fog was wiped off it (legacy found) */ export const isFound = () => found;

export function install(app) {
  if (app && app.reduced) return;   // legacy cardPhysics() returned before any of this
  const hero = document.getElementById('hero');
  kat = document.createElement('div'); kat.className = 'katana';
  kat.innerHTML = `<span class="katana-in" role="img" aria-label="Katana">${katanaSvg('kat-a')}</span>`;
  hero.querySelector('.scene').after(kat);   // before the fog canvas, so the fog covers it
  katIn = kat.firstChild;
  sheatheBtn = document.createElement('button'); sheatheBtn.type = 'button'; sheatheBtn.className = 'btn ghost sheathe'; sheatheBtn.hidden = true; sheatheBtn.textContent = 'Put the katana back';
  const actions = document.createElement('div'); actions.className = 'phys-actions'; actions.appendChild(sheatheBtn); document.body.appendChild(actions);

  defineSpeaker('katana', { kinds: ['katana'], prefix: 'katana.', gate: 'card', quiet: TIMING.gap.katana, layer: () => world.layer,
    anchor: (o) => { const p = o.body.getPosition(), a = o.body.getAngle(), [hx, hy] = drawOffset(o), top = Math.abs(Math.sin(a)) * o.w / 2 + Math.abs(Math.cos(a)) * o.h / 2;
      return { x: p.x * S + hx, ax: p.x * S + hx, y: p.y * S + hy - top + TUNE.speech.RIDE_DY }; } });
  report('found', () => found);
  report('katana', () => katObj);
  onTear('katana', free);

  hero.addEventListener('pointermove', (e) => {   // the same strokes that wipe the fog uncover it
    if (found || isCrazy()) return;
    const r = kat.getBoundingClientRect();
    if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.bottom - K.REVEAL_DY)) > K.REVEAL_RADIUS) { lastWipe = null; return; }
    if (lastWipe) near += Math.hypot(e.clientX - lastWipe.x, e.clientY - lastWipe.y);
    lastWipe = { x: e.clientX, y: e.clientY };
    if (near > K.REVEAL_TRAVEL) { found = true; kat.classList.add('found'); toast('toast.katanaFound'); bus.emit('katana.found', {}); load().catch(() => {}); }
  });
  // planted, it is rooted like a card: grab the hilt and pull. Out of the ground it is a body you carry, swing and drop
  katIn.addEventListener('pointerdown', (e) => {
    if (!found || world.grab || world.press || e.button > 0 || isCrazy() || kat.classList.contains('away')) return;
    e.preventDefault();
    load().then(() => {
      if (world.grab || (katObj && !katObj.root)) return;
      init();
      if (!katObj) plant();
      hold(katObj, e.clientX + scrollX, e.clientY + scrollY, e);
    }).catch(() => {});
  });
  document.addEventListener('dblclick', (e) => {
    const onKat = e.target.closest?.('.katana-body, .katana-in'); if (!onKat) return;
    e.preventDefault();
    if (world.grab && world.grab.sticky) drop(); else equip(e);
  });
  sheatheBtn.addEventListener('click', putBack);
  kat.addEventListener('click', (e) => { if (e.target === kat && kat.classList.contains('away')) putBack(); });
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || !katObj || katObj.root) return; if (world.grab && world.grab.sticky) drop(); else putBack(); });

  bus.on('katana.dropped', ({ katana }) => { say(katana, 'katana.drop', { force: true }); });   // legacy drop(): say(o, 'kdrop', true)
  bus.on('body.removed', ({ body: o }) => { if (o === katObj) setKat(null); });             // legacy remove(): if (o === katObj) katObj = null
  bus.on('world.reset', () => { kat.classList.remove('away'); sheatheBtn.hidden = true; });  // legacy resetAll
}
