// Where the hand reacts (legacy zones(vw) and the ?debug=zones overlay). Ivo drew these; change them only here.
// In viewport x (any scroll, full height): a held card teases it from `tease` rightwards (the last card column of the content),
// a thrown card is caught from `grab` rightwards (the gutter right of the content; never narrower than a card can get into).
// Both are capped to TUNE.hand.ZONES teaseMax / grabMax from the right edge. ?debug=zones draws both. The numbers are TUNE.hand.ZONES.

import { TUNE } from '../../core/tune.js';
import { flags } from '../../core/debug.js';

const Z = TUNE.hand.ZONES;

/** @returns {{ tease: number, edge: number, grab: number }} viewport x */
export const zones = (vw) => {
  const W = Math.min(Z.maxW, vw), cr = (vw + W) / 2 - Z.gutter, cw = W - 2 * Z.gutter, cols = Math.max(1, Math.floor((cw + Z.gutter) / Z.col));
  const tease = cols > 1 ? cr - (cw - Z.gutter * (cols - 1)) / cols - Z.gutter : cr - cw * Z.narrow, grab = Math.min(cr, vw - Math.min(Z.grabMin, vw * Z.grabFrac));
  // capped so neither reaches far into the screen (Ivo: it used to react from about half the screen)
  return { tease: Math.max(tease, vw - Math.min(Z.teaseMax, vw * Z.teaseFrac)), edge: cr, grab: Math.max(grab, vw - Math.min(Z.grabMax, vw * Z.grabMaxFrac)) };
};

/** the ?debug=zones overlay: two fixed boxes (each to the right edge: a card teases or is caught anywhere right of its line), laid out again on resize (legacy: made at the top of cardPhysics, so never under reduced motion) */
function overlay() {
  const mk = (col, name) => { const d = document.createElement('div'); d.textContent = name; d.style.cssText = 'position:fixed;top:0;bottom:0;z-index:9999;pointer-events:none;box-sizing:border-box;border:3px solid ' + col + ';color:' + col + ';font:700 12px/1.6 monospace;padding:2px 6px'; document.body.appendChild(d); return d; };
  const r = mk('#e11', 'tease'), b = mk('#000', 'catch'), lay = () => { const vw = document.documentElement.clientWidth, z = zones(vw); r.style.left = z.tease + 'px'; r.style.width = vw - z.tease + 'px'; b.style.left = z.grab + 'px'; b.style.width = vw - z.grab + 'px'; };
  lay(); addEventListener('resize', lay);
}

export function install(app) {
  if (app && app.reduced) return;
  if (flags().zones) overlay();
}
