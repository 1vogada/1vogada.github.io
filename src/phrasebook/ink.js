// The phrasebook's ink (heard lines): how a line you have not heard is blotted out, and how one heard since your last look is
// marked with a small red ink dot that fades. Only markup and Web Animations, with inline styles (styles/ is pinned by a unit
// test). ./menu.js decides which line gets which; ./heard.js is the record.
//  - blot(text, tag): a chip of ▒ (with the odd ▓ or ░ for texture), as long as the line it hides (TUNE.heard.BLOT_*), leaning a
//    little, its language tag (JP / BG) still on it but not what it means. It carries data-ink, a hash of the line (never the
//    line itself, so selecting or copying a blot gives nothing away), so it can ink itself in when the line is heard.
//  - dot(): the ink dot for a fresh chip, a tab, a diary page. fade(root): every new dot under root waits, then fades; every
//    fresh chip inks itself in (a blur clearing).
// Draws no Math.random: every wobble comes from the hash of the line.
import { TUNE } from '../core/tune.js';
import { esc } from './figures.js';

const H = TUNE.heard;
const RED = '#c8102e';

/** FNV-1a of the line, base 36: names a blot without giving the line away */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

/** a blotted chip for a line you have not heard. tag: 'JP' | 'BG' | '' */
export function blot(text, tag) {
  const h = parseInt(hash(text), 36), n = Math.max(H.BLOT_MIN, Math.min(H.BLOT_MAX, Math.round([...text].length / H.BLOT_CHARS)));
  let ink = '';
  for (let i = 0; i < n; i++) { const r = (h >>> ((i * 3) % 29)) & 15; ink += r === 0 ? '▓' : r === 1 ? '░' : '▒'; }
  const tilt = (((h & 255) / 255) * 2 - 1) * H.BLOT_TILT;
  return `<span class="pb-chip pb-blot" data-ink="${hash(text)}" title="Not heard yet" style="background: color-mix(in srgb, var(--text) 9%, transparent); color: var(--muted); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 14%, transparent); rotate: ${tilt.toFixed(2)}deg; cursor: help">`
    + `<b aria-label="a line not heard yet" style="font-weight: 400; letter-spacing: -.08em; opacity: .7; user-select: all">${ink}</b>`
    + (tag ? `<i lang="en">${esc(tag)}</i>` : '') + '</span>';
}

/** the red ink dot. corner: pinned to a chip's top right corner (else it sits inline, after a tab's or a heading's text) */
export function dot(corner) {
  const at = corner ? 'position: absolute; top: -3px; right: -3px;' : 'display: inline-block; vertical-align: middle; margin: 0 0 2px 6px;';
  return `<span class="pb-ink" aria-hidden="true" style="${at} width: 8px; height: 8px; border-radius: 50% 45% 55% 50%; background: ${RED}; box-shadow: 0 0 0 2px var(--bg), 0 0 4px ${RED}"></span>`;
}

/** the dots under root wait, then fade (and drop a little, like ink drying); the fresh chips ink themselves in */
export function fade(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  for (const d of root.querySelectorAll('.pb-ink:not([data-fading])')) {
    d.dataset.fading = '1';
    if (d.animate) d.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.2 }, { opacity: 0, transform: 'scale(.35)' }],
      { duration: H.DOT_MS, delay: H.DOT_WAIT_MS, easing: 'ease-in', fill: 'forwards' });
  }
  for (const c of root.querySelectorAll('.pb-inked:not([data-fading])')) {
    c.dataset.fading = '1';
    if (c.animate) c.animate([{ filter: 'blur(3px)', opacity: 0.35 }, { filter: 'none', opacity: 1 }], { duration: H.INK_MS, easing: 'ease-out' });
  }
}
