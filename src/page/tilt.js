// Card tilt and spotlight under the pointer (legacy grid pointermove / pointerout, only with hover and without reduced
// motion), and the embroidery that rolls with a moving card (legacy bandRoll: an independent clock.frames loop that runs
// always, even with reduced motion, and skips its work while hidden or in crazy mode).

import { TUNE } from '../core/tune.js';
import { frames } from '../core/clock.js';
import { isCrazy } from '../world/world.js';

const { DEG, BAND_PX, ROLL } = TUNE.tilt;

export function install(app) {
  const root = document.documentElement;
  const grid = document.getElementById('grid');
  if (!app.reduced && matchMedia('(hover: hover)').matches) {
    grid.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.card'); if (!card || isCrazy() || root.classList.contains('throwing')) return;
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((x - 0.5) * DEG).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - y) * DEG).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      card.style.setProperty('--bx', ((x - 0.5) * BAND_PX).toFixed(1) + 'px'); // embroidery slides toward the tilt
    });
    grid.addEventListener('pointerout', (e) => {
      const card = e.target.closest('.card');
      if (card && !card.contains(e.relatedTarget)) { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); card.style.removeProperty('--bx'); }
    });
  }

  // ---- embroidery follows the rotation of cards that are pulled, held or falling (reads the transform the physics sets) ----
  const ROT = /rotate\((-?[\d.e-]+)rad\)/;
  frames(() => {
    if (document.hidden || isCrazy()) return;
    for (const el of document.querySelectorAll('#phys .phys, .grid .card.pulling')) {
      const m = ROT.exec(el.style.transform);
      const bx = m ? (parseFloat(m[1]) * ROLL).toFixed(1) + 'px' : '0px';
      if (el.style.getPropertyValue('--bx') !== bx) el.style.setProperty('--bx', bx);
    }
  });
}
