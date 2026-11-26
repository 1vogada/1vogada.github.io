// The rig of the stage: a ghost pointer that plays your part in an act (drags, tugs, throws, swings the katana, types), and the
// shortcuts acts use to set the scene. It sends the page the same pointer and key events a visitor's mouse and keyboard would,
// so every feature reacts exactly as it does to you: nothing in an act calls a behaviour the page would not reach by itself,
// unless the act says so (a shortcut, for things that take minutes for real).
//
// Every helper waits on wall time (clock.real) and throws STOP once the act is stopped, so an act is a plain async function:
//   async play(r) { await r.awake(); const p = await r.tugOut(0); await r.throwTo(p, [innerWidth - 40, p[1] - 80]); await r.wait(3000); }
// Coordinates are viewport px unless a name says page. One rig per act; the stage calls r.end() when it is over.
import { clock } from '../core/clock.js';
import { world, load, init, markRipped, isCrazy, freeCard, S } from '../world/world.js';

export const STOP = new Error('the act was stopped');
const ID = 77;   // the ghost's pointerId: never the visitor's (1), so their own mouse neither drops nor moves what the ghost holds

let ghostEl = null;
function ghost() {
  if (ghostEl) return ghostEl;
  ghostEl = document.createElement('div');
  ghostEl.className = 'sc-ghost';
  ghostEl.setAttribute('aria-hidden', 'true');
  ghostEl.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2.5l15 9.2-6.6 1.2 3.7 7.1-2.9 1.5-3.7-7.2L4.6 19z"/></svg>';
  document.body.appendChild(ghostEl);
  return ghostEl;
}

export function rig(app) {
  let dead = false, down = false, x = innerWidth / 2, y = innerHeight / 2;
  const undo = [];
  const g = ghost();
  const live = () => { if (dead) throw STOP; };
  const show = () => { g.style.transform = `translate(${x - 4}px, ${y - 2}px)`; g.classList.add('on'); g.classList.toggle('down', down); };
  const target = () => { g.style.visibility = 'hidden'; const t = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, x)), Math.max(0, Math.min(innerHeight - 1, y))) || document.body; g.style.visibility = ''; return t; };
  const pe = (type, el, extra) => (el || target()).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: ID, pointerType: 'mouse', isPrimary: false, clientX: x, clientY: y, button: 0, buttons: down ? 1 : 0, ...extra }));

  const r = {
    app,
    /** the act was stopped */
    get dead() { return dead; },
    /** wall-time pause; throws STOP if the act is stopped meanwhile */
    async wait(ms) { live(); await clock.real.sleep(ms); live(); },
    /** wait until fn() is truthy (checked every 50 ms), at most max ms. @returns fn's value, or null on time out */
    async until(fn, max = 10000, step = 50) {
      const t0 = clock.wall();
      for (;;) { live(); const v = fn(); if (v) return v; if (clock.wall() - t0 > max) return null; await clock.real.sleep(step); }
    },
    /** something to put back when the act ends or is stopped (runs last-in first-out) */
    after(fn) { undo.push(fn); },

    // ---- the ghost pointer ----
    get x() { return x; }, get y() { return y; },
    async move(nx, ny, dt = 16) { live(); x = nx; y = ny; show(); pe('pointermove'); if (dt) await r.wait(dt); },
    async down(dt = 16) { live(); down = true; show(); pe('pointerdown'); if (dt) await r.wait(dt); },
    async up(dt = 16) { live(); down = false; show(); pe('pointerup'); if (dt) await r.wait(dt); },
    /** along a straight line in n steps of dt ms */
    async line(x0, y0, x1, y1, n = 10, dt = 16) { for (let k = 1; k <= n; k++) await r.move(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, dt); },
    /** from where the ghost is to (x1, y1), at about px per 16 ms */
    async glide(x1, y1, speed = 22) { const n = Math.max(2, Math.ceil(Math.hypot(x1 - x, y1 - y) / speed)); await r.line(x, y, x1, y1, n); },
    async path(pts, dt = 16) { for (const [px, py] of pts) await r.move(px, py, dt); },
    /** a click on an element (scrolled into view when it is off screen) */
    async click(el) {
      if (typeof el === 'string') el = document.querySelector(el);
      if (!el) return false;
      let b = el.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) { el.scrollIntoView({ block: 'center', behavior: 'instant' }); await r.wait(60); b = el.getBoundingClientRect(); }
      await r.glide(b.left + b.width / 2, b.top + b.height / 2);
      pe('pointerdown', el); await r.wait(60); pe('pointerup', el); el.click(); await r.wait(30);
      return true;
    },
    /** a key press on the page (keydown + keyup) */
    async key(k, opts = {}) { live(); const ev = { key: k, bubbles: true, cancelable: true, ...opts }; (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', ev)); (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keyup', ev)); await r.wait(40); },
    /** type a word on the page, a key at a time */
    async type(text, dt = 110) { for (const ch of text) { await r.key(ch); await r.wait(dt); } },
    /** let go of whatever the ghost holds */
    release() { if (down) { down = false; pe('pointerup'); } },
    /** the ghost goes away; whatever it held is let go */
    hide() { r.release(); g.classList.remove('on', 'down'); },

    // ---- the page ----
    /** scroll to page y at once */
    async scrollTo(py, dt = 120) { live(); window.scrollTo({ top: Math.max(0, py), behavior: 'instant' }); await r.wait(dt); },
    /** the project grid in view (its top a little under the header) */
    async toGrid(off = 90) { const gr = document.getElementById('grid'); if (gr) await r.scrollTo(gr.getBoundingClientRect().top + scrollY - off); },
    /** the bottom of the page */
    async toBottom() { await r.scrollTo(document.documentElement.scrollHeight - innerHeight); },
    /** the i-th grid card still in its slot (and on screen, scrolled to if not). @returns its DOMRect or null */
    async card(i = 0) {
      const els = [...document.querySelectorAll('#grid .card:not(.held)')];
      const el = els[i]; if (!el) return null;
      let b = el.getBoundingClientRect();
      if (b.top < 70 || b.bottom > innerHeight - 10) { await r.scrollTo(b.top + scrollY - Math.max(90, (innerHeight - b.height) / 2)); b = el.getBoundingClientRect(); }
      return b;
    },
    /** the physics world is there (planck loaded, world made) */
    async world() { live(); if (isCrazy() || app.reduced) throw new Error('no physics here'); await load(); init(); live(); return world; },
    /** the hand at the right edge is awake (as after your first rip). The quick way: no card is ripped for it */
    async awake() { await r.world(); if (!app.hand.awake()) markRipped('stage'); else if (!world.ripped.size) world.ripped.add('stage'); app.hand.get(); clock.wake(); },

    // ---- your part, as in the test harness (tests/helpers/harness.js), done by the ghost ----
    /** press a grid card at (fx, fy) of it and pull by (dx, dy) in n steps; the button stays down. @returns where the ghost is */
    async pull(i, dx, dy, { fx = 0.5, fy = 0.5, n = 20, dt = 16 } = {}) {
      await r.world();
      const c = await r.card(i); if (!c) throw new Error('no card to pull');
      const px = c.left + c.width * fx, py = c.top + c.height * fy;
      await r.glide(px, py); await r.down();
      await r.line(px, py, px + dx, py + dy, n, dt);
      return [px + dx, py + dy];
    },
    /** tear a grid card out of its slot the way a visitor has to (tug, ease off, again: it comes out like a tooth). Button stays down */
    async tugOut(i = 0, { dx = 0, dy = -420, fx = 0.5, fy = 0.5, n = 60 } = {}) {
      await r.world();
      const c = await r.card(i); if (!c) throw new Error('no card to tug out');
      const px = c.left + c.width * fx, py = c.top + c.height * fy, at = (f) => [px + dx * f, py + dy * f];
      await r.glide(px, py); await r.down();
      await r.line(px, py, ...at(0.1), 4);
      const o = world.grab && world.grab.o; if (!o) throw new Error('the ghost did not get hold of the card');
      for (let k = o.loose || 0; k < (o.tugs || 1) - 1; k++) {
        await r.line(...at(0.1), ...at(0.62), 12);
        await r.until(() => (world.grab && world.grab.o.loose > k) || !world.grab, 4000, 16);
        await r.line(...at(0.62), ...at(0.1), 8); await r.wait(640);
      }
      await r.line(...at(0.1), ...at(0.62), 12);
      await r.until(() => !world.grab || !world.grab.o.root, 4000, 16);
      await r.line(...at(0.62), ...at(1), Math.max(8, Math.round(n / 2)));
      return at(1);
    },
    /** a grid card straight out into the world (no tugging: a shortcut). @returns its body */
    async loose(i = 0) {
      await r.world();
      const els = [...document.querySelectorAll('#grid .card:not(.held)')], el = els[i]; if (!el) throw new Error('no card');
      const o = freeCard(el); clock.wake(); return o;
    },
    /** what the ghost holds now (a body record) or null */
    held() { const gr = world.grab; return gr && gr.id === ID ? gr.o : null; },
    /** carry what is held to `to` at a steady speed and let go: fast enough and it is a throw */
    async throwTo(from, to, { n = 6, dt = 16, release = true } = {}) { await r.line(from[0], from[1], to[0], to[1], n, dt); if (release) await r.up(0); await r.wait(16); },
    /** a cut-off hand at page px (it falls limp there). @returns its body */
    async oldHand(px, py, opts = {}) { await r.world(); const o = app.severed.spawn(px, py, 0.3, app.severed.POSES.limp, opts); clock.wake(); return o; },
    /** page px of a body's centre */
    pos(o) { const p = o.body.getPosition(); return [p.x * S, p.y * S]; },
    /** viewport px of a body's centre */
    at(o) { const p = o.body.getPosition(); return [p.x * S - scrollX, p.y * S - scrollY]; },

    /** the act is over (or stopped): the ghost lets go and goes, the act's own clean-ups run */
    end() {
      if (dead) return; dead = true; r.hide();
      document.documentElement.dispatchEvent(new PointerEvent('pointerleave', { pointerId: ID, pointerType: 'mouse' }));   // the ghost is no pointer left resting on the page (gift, pester)
      for (const fn of undo.reverse()) { try { fn(); } catch (e) {} }
    },
  };
  return r;
}
