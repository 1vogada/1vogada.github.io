// Feed the search box: drop something on it and it searches for it.
//   a card     the box swallows it (the card shrinks into the box with a last scream, 'card.eaten'; the box gulps, 'search.gulp'),
//              the project's name types itself in letter by letter and the grid filters as it goes; then 'search.fed'
//              { what: 'card', key } (src/reactions.js: the cards actor grows the card back into its slot, 'card.home')
//   a scrap    a piece or a crumpled ball (or a card with no project behind it): swallowed the same way, the box types "…",
//              nothing is found, a toast ('toast.scrap'); 'search.fed' { what: 'scrap' }
//   an old hand  the box will not have it: it shakes and spits the hand back up ('search.spit'), types "hand", nothing is found;
//              'search.fed' { what: 'hand', body } (src/reactions.js: the old hand says 'sev.notthere')
// The way in is 'body.dropped' (src/reactions.js calls dropped()): let go within TUNE.feed.PAD_PX of the box (the pointer or
// the body's middle), slower than TUNE.feed.MAX_SPEED (a throw is a throw). One at a time: a drop while the box is still typing
// just falls. Nothing here in crazy mode or under reduced motion (no bodies). The swallowed body is stilled on the drop and leaves
// the world a frame later (out of drag.js's drop()); what shrinks into the box is a copy (a Web Animation, real time). Waits are
// wall time (real.sleep), like the greeting's typewriter. "…" and "hand" find nothing whatever the posts say (setQuery(v, true)).
// No random draw on any path but a drop on the box (the lines and the bubbles' tilt). Test hook: __feed.feeding().

import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { real } from '../core/clock.js';
import { line } from '../core/lines.js';
import { sayAt } from '../core/speech.js';
import { hook } from '../core/debug.js';
import { world, remove, isCrazy, worldPoly } from '../world/world.js';
import { items, render, setQuery } from './directory.js';

const F = TUNE.feed, S = TUNE.physics.S;
let app = { reduced: false }, q = null, box = null, busy = false;

/** the search box (the label around the input) in page px, or null when it is not on the page */
function boxRect() {
  if (!box || !box.isConnected) return null;
  const r = box.getBoundingClientRect();
  if (!r.width || !r.height) return null;   // hidden (crazy mode hides the calm toolbar)
  return { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY, cx: r.left + scrollX + r.width / 2, cy: r.top + scrollY + r.height / 2 };
}
const inside = (R, x, y, pad) => x >= R.l - pad && x <= R.r + pad && y >= R.t - pad && y <= R.b + pad;

/** what a body would be to the box: 'card' (a whole card with a project behind it), 'scrap', 'hand', or null (not for it) */
function what(o) {
  if (o.kind === 'hand') return 'hand';
  if (o.kind === 'piece') return 'scrap';
  if (o.kind === 'card') return o.key && items().some((p) => p.key === o.key) ? 'card' : 'scrap';
  return null;
}

/** body.dropped (src/reactions.js): was it let go on the search box? Then the box takes it */
export function dropped({ body: o, speed, x, y }) {
  if (busy || app.reduced || isCrazy() || !o || !world.bodies.has(o) || o.root || o.tug || o.sq) return;
  if (!(speed <= F.MAX_SPEED)) return;
  const kind = what(o); if (!kind) return;
  const R = boxRect(); if (!R) return;
  const p = o.body.getPosition();
  if (!(x != null && inside(R, x, y, F.PAD_PX)) && !inside(R, p.x * S, p.y * S, F.PAD_PX)) return;
  busy = true;
  if (kind === 'hand') { spit(o, R); return; }
  // still it where it is and keep the pointer off it; the swallow runs next frame, out of drag.js's drop()
  o.body.setLinearVelocity({ x: 0, y: 0 }); o.body.setAngularVelocity(0); o.body.setGravityScale(0); o.el.style.pointerEvents = 'none';
  real.after(0, () => swallow(o, kind, R).catch(() => { busy = false; }));
}

/** the copy of o shrinks into the box; o itself leaves the world now */
function gulp(o, R) {
  const ghost = o.el.cloneNode(true), t0 = o.el.style.transform || 'none', p = o.body.getPosition();
  ghost.classList.remove('grabbed', 'equipped'); ghost.style.pointerEvents = 'none'; ghost.removeAttribute('data-key');
  world.layer.appendChild(ghost);
  remove(o);
  const dx = R.cx - p.x * S, dy = R.cy - p.y * S;
  if (typeof ghost.animate !== 'function') { ghost.remove(); return; }
  const a = ghost.animate([{ transform: t0, opacity: 1 }, { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) ${t0} scale(0.04)`, opacity: 0.3 }],
    { duration: F.GULP_MS, easing: 'cubic-bezier(.55,0,.9,.45)', fill: 'forwards' });
  a.finished.then(() => ghost.remove(), () => ghost.remove());
  box.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14, .86)', offset: 0.35 }, { transform: 'scale(.94, 1.08)', offset: 0.7 }, { transform: 'scale(1)' }],
    { duration: F.GULP_MS, delay: F.GULP_MS * F.GULP_AT, easing: 'ease-out' });
}

async function swallow(o, kind, R) {
  if (!world.bodies.has(o)) { busy = false; return; }
  const name = kind === 'card' ? items().find((p) => p.key === o.key).name : '…', key = o.key;
  if (kind === 'card') { const top = Math.min(...worldPoly(o).map((v) => v[1])); sayAt(o.body.getPosition().x * S, top + TUNE.speech.RIDE_DY, 'card.eaten', { scream: true }); }
  gulp(o, R);
  await real.sleep(F.GULP_MS);
  sayAt(R.cx, R.t + F.SAY_DY, 'search.gulp');
  await type(name, kind === 'scrap');
  if (kind === 'scrap') bus.emit('ui.toast', { msg: line('toast.scrap') });
  busy = false;
  bus.emit('search.fed', { what: kind, body: null, key: kind === 'card' ? key : null, query: name });
}

/** an old hand: the box shakes, spits it back up, and looks for "hand" anyway */
function spit(o, R) {
  if (typeof box.animate === 'function') box.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: F.GULP_MS * 0.8 });
  real.after(0, async () => {
    try {
      if (world.bodies.has(o)) o.body.setLinearVelocity({ x: o.body.getLinearVelocity().x, y: -F.SPIT });
      sayAt(R.cx, R.t + F.SAY_DY, 'search.spit');
      await real.sleep(F.GULP_MS);
      await type('hand', true);   // the posts may well mention a hand: it is still not in there
    } finally { busy = false; }
    bus.emit('search.fed', { what: 'hand', body: o, key: null, query: 'hand' });
  });
}

/** the box types text in, one letter every TYPE_MS, the grid filtering as it goes, and holds it HOLD_MS. nothing: the whole word finds nothing */
async function type(text, nothing = false) {
  const ch = [...text];
  for (let j = 1; j <= ch.length; j++) {
    const v = ch.slice(0, j).join('');
    q.value = v; setQuery(v, nothing && j === ch.length); render();
    await real.sleep(F.TYPE_MS);
  }
  await real.sleep(F.HOLD_MS);
}

/** is the box busy with something it was fed (for the scenarios) */
export const feeding = () => busy;

export function install(a) {
  app = a || app;
  q = document.getElementById('q'); box = q && q.closest('.search');
  hook('__feed', { feeding });
}
