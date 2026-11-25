// Particles and page effects (legacy bits, spray, gore, trail, moveBits, bleed drops, the #projects shake).
// moveBits runs on onTick 'fx' (first after the steps). Particles are not bodies; they keep the loop alive (hasWork, keepAwake).
// trail() removes its streak after TUNE.cut.TRAIL_MS on WALL time (legacy setTimeout).

import { TUNE } from '../core/tune.js';
import { clock } from '../core/clock.js';
import { world } from './world.js';

const F = TUNE.fx;
// little drops and paper scraps (world.bits): plain points on the same clock as the physics, no bodies

/** drops and scraps off a cut (legacy spray(x, y, nx, ny)) */
export function spray(x, y, nx, ny) {
  for (let k = 0; k < F.SPRAY; k++) {
    const el = document.createElement('i'), sz = 3 + Math.random() * 6; el.className = Math.random() < 0.72 ? 'bit' : 'bit paper';
    el.style.width = el.style.height = sz.toFixed(1) + 'px'; el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; world.layer.appendChild(el);
    const sg = Math.random() < 0.5 ? -1 : 1, an = (Math.random() - 0.5) * 1.7, ca = Math.cos(an), sa = Math.sin(an), sp = 120 + Math.random() * 620;
    world.bits.push({ el, x, y, vx: sg * (nx * ca - ny * sa) * sp, vy: sg * (nx * sa + ny * ca) * sp - 160, t: 0, life: 0.45 + Math.random() * 0.65 });
  }
  clock.wake();
}
/** blood, ink and paper (legacy gore(x, y, nx, ny, n, pow)) */
export function gore(x, y, nx, ny, n, pow) {
  for (let k = 0; k < n; k++) {
    const el = document.createElement('i'), r = Math.random(), sz = 3 + Math.random() * 9; el.className = r < 0.55 ? 'bit' : r < 0.8 ? 'bit ink' : 'bit paper';
    el.style.width = el.style.height = sz.toFixed(1) + 'px'; el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; world.layer.appendChild(el);
    const an = (Math.random() - 0.5) * 2.4, ca = Math.cos(an), sa = Math.sin(an), sp = (120 + Math.random() * 720) * pow;
    world.bits.push({ el, x, y, vx: (nx * ca - ny * sa) * sp, vy: (nx * sa + ny * ca) * sp - 180 * pow, t: 0, life: 0.5 + Math.random() * 0.8 });
  }
  clock.wake();
}
/** the streak behind a fast tip (legacy trail(a, b)) */
export function trail(a, b) {
  const el = document.createElement('i'); el.className = 'slash'; el.style.width = Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(1) + 'px';
  el.style.transform = `translate(${a[0].toFixed(1)}px, ${a[1].toFixed(1)}px) rotate(${Math.atan2(b[1] - a[1], b[0] - a[0]).toFixed(3)}rad)`;
  world.layer.appendChild(el); clock.real.after(TUNE.cut.TRAIL_MS, () => el.remove());
}
/** one drip from a wound at page point q (legacy bleed() body, after its w.next draw) */
export function drip(q) {
  const el = document.createElement('i'), sz = 3 + Math.random() * 4; el.className = 'bit';
  el.style.width = el.style.height = sz.toFixed(1) + 'px'; el.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px)`; world.layer.appendChild(el);
  world.bits.push({ el, x: q[0], y: q[1], vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 110, t: 0, life: 0.5 + Math.random() * 0.5 });
}
/** shake #projects (legacy: remove 'shake', reflow, add 'shake') */
export function shake() { const m = document.getElementById('projects'); m.classList.remove(F.SHAKE_CLASS); void m.offsetWidth; m.classList.add(F.SHAKE_CLASS); }
/** take every particle off the page (legacy resetAll: for (const p of world.bits.splice(0)) p.el.remove()) */
export function clearBits() { for (const p of world.bits.splice(0)) p.el.remove(); }

/** legacy moveBits(dt) */
export function moveBits(dt) {
  for (let i = world.bits.length - 1; i >= 0; i--) {
    const p = world.bits[i]; p.t += dt;
    if (p.t > p.life) { p.el.remove(); world.bits.splice(i, 1); continue; }
    p.vy += F.GRAVITY * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${(1 - 0.7 * p.t / p.life).toFixed(2)})`;
  }
}

export function install(app) {
  if (app && app.reduced) return;
  clock.hasWork(() => world.bits.length > 0);
  clock.keepAwake(() => world.bits.length > 0);
  clock.onTick(moveBits, 'fx');
}
