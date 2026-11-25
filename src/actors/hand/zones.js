// Where the hand reacts (legacy zones(vw) and the ?debug=zones overlay). Ivo drew these; change them only here.
// In viewport x (any scroll, full height): a held card teases it from `tease` rightwards (the last card column of the content),
// a thrown card is caught from `grab` rightwards (the gutter right of the content; never narrower than a card can get into).
// Catch is one card wide from the right edge, tease two (Ivo, 2026-11-25). ?debug=zones draws both. The numbers are TUNE.hand.ZONES.

import { TUNE } from '../../core/tune.js';
import { flags } from '../../core/debug.js';

const Z = TUNE.hand.ZONES;

/** @returns {{ tease: number, edge: number, grab: number }} viewport x */
export const zones = (vw) => {
  const W = Math.min(Z.maxW, vw), cr = (vw + W) / 2 - Z.gutter, cw = W - 2 * Z.gutter, cols = Math.max(1, Math.floor((cw + Z.gutter) / Z.col));
  const card = Math.min(cols > 1 ? (cw - Z.gutter * (cols - 1)) / cols : cw, vw * Z.cardMaxFrac);   // one card's width, as the grid lays it out
  // Ivo 2026-11-25: both zones are exactly one card wide, measured from the right edge of the screen
  return { tease: vw - Math.min(card * Z.teaseCards, vw * Z.teaseMaxFrac), edge: cr, grab: vw - card };   // tease: two cards wide, so it does not sit exactly on the catch zone
};

/** the ?debug=zones overlay: two fixed boxes (each to the right edge: a card teases or is caught anywhere right of its line), laid out again on resize (legacy: made at the top of cardPhysics, so never under reduced motion) */
function overlay() {
  const mk = (col, name) => { const d = document.createElement('div'); d.textContent = name; d.style.cssText = 'position:fixed;top:0;bottom:0;z-index:9999;pointer-events:none;box-sizing:border-box;border:3px solid ' + col + ';color:' + col + ';font:700 12px/1.6 monospace;padding:2px 6px'; document.body.appendChild(d); return d; };
  const r = mk('#e11', 'tease'), b = mk('#000', 'catch'), lay = () => { b.style.paddingTop = '22px';   /* both are one card wide: keep the labels apart */ const vw = document.documentElement.clientWidth, z = zones(vw); r.style.left = z.tease + 'px'; r.style.width = vw - z.tease + 'px'; b.style.left = z.grab + 'px'; b.style.width = vw - z.grab + 'px'; };
  lay(); addEventListener('resize', lay);
}

export function install(app) {
  if (app && app.reduced) return;
  if (flags().zones) overlay();
}
