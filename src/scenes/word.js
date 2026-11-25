// Say "hand": highlight the word "hand" anywhere on the page (a card's text, a blog post in the reader, the footer) and the
// hand reaches in from the right edge, eyes the highlighted word, pinches it off the page and drags it out of sight; the
// selection is gone with it. Nothing hints at it. Only once a card has left its slot (hand.awake()), never in crazy mode,
// under reduced motion, during another scene, or while the hand is busy with something of its own. Never while the phrasebook is
// open (html.pb-lock): a line selected in there is said by its owner instead (phrasebook/say.js).
// A scene (scenes/scene.js): wall-time sleeps that reject with GONE when the scene is killed; done() in the finally.
// Random draws: the two lines it says (hand.word, hand.wordgot), only on this path.
import { TUNE } from '../core/tune.js';
import { real, frames } from '../core/clock.js';
import { isCrazy } from '../world/world.js';
import * as hand from '../actors/hand/index.js';
import { scene, current, GONE } from './scene.js';

const W = TUNE.word;
let app = { reduced: false, root: null }, ghost = null, down = false, wait = null;

/** the selection, when it is exactly the word "hand" (any case, spaces around it ignored) and can be seen. @returns {{ text, rect, from }} or null */
function picked() {
  const sel = typeof getSelection === 'function' ? getSelection() : null;
  if (!sel || sel.rangeCount !== 1 || sel.isCollapsed) return null;
  const text = sel.toString().trim();
  if (text.toLowerCase() !== 'hand') return null;
  const a = document.activeElement; if (a && a.matches && a.matches('input, textarea')) return null;   // the search box: not the page's words
  if (document.documentElement.classList.contains('pb-lock')) return null;   // the phrasebook is open: a pick there is phrase-say's (phrasebook/say.js)
  const range = sel.getRangeAt(0), rect = range.getBoundingClientRect();
  if (!rect.width || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > document.documentElement.clientWidth) return null;
  const from = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
  if (from && from.closest && from.closest('.pb')) return null;   // a word left selected in the phrasebook as it closes
  return { text, rect, from };
}

/** a copy of the highlighted word, lifted off the page: it rides in the hand's fingers */
function lift(p) {
  const cs = getComputedStyle(p.from), el = document.createElement('span');
  el.textContent = p.text; el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position: 'fixed', left: '0', top: '0', zIndex: '59', pointerEvents: 'none', whiteSpace: 'nowrap',
    font: cs.font, letterSpacing: cs.letterSpacing, color: cs.color, background: 'Highlight', padding: '0 1px', borderRadius: '2px',
    translate: `${p.rect.left.toFixed(1)}px ${p.rect.top.toFixed(1)}px`, transformOrigin: '50% 50%' });
  document.body.appendChild(el);
  return el;
}

/** run the scene for the highlighted word p (does nothing when the hand may not come out) */
export async function snatch(p) {
  const m = hand.brain();
  if (app.reduced || current() || isCrazy() || !hand.awake() || (m && !m.is('off', 'lurk', 'sulk'))) return;
  const my = scene('word');
  const root = app.root || document.documentElement, x = p.rect.left + p.rect.width / 2, y = p.rect.top + p.rect.height / 2;
  let follow = null;
  root.classList.add('hand-show');
  try {
    await hand.come(x + W.OVER_PX, y - W.OVER_PX / 3, 'eager');   // out from the right edge, hovering over the word
    await my.sleep(Math.max(W.HOVER_MS, hand.say('word')));
    hand.to({ x: x + p.rect.width / 2, y, pose: 'pinch', rate: 14, bob: false });   // fingers on the word
    await my.sleep(W.PINCH_MS);
    const sel = getSelection(); if (sel) sel.removeAllRanges();   // the highlight goes: it has the word
    ghost = lift(p);
    const off = [p.rect.left - x - p.rect.width / 2, p.rect.top - y];   // the word hangs from its fingertips where it was taken
    follow = frames(() => { const g = hand.grip(); if (!ghost || !g) return false; ghost.style.translate = `${(g[0] + off[0]).toFixed(1)}px ${(g[1] + off[1]).toFixed(1)}px`; });
    ghost.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '5deg' }, { rotate: '-3deg' }], { duration: 600, fill: 'forwards' });
    hand.to({ x: x + W.OVER_PX, y: y - W.OVER_PX / 2, pose: 'joy', rate: 8, bob: true });   // holds it up to look at it
    await my.sleep(Math.max(W.HOLD_MS, hand.say('wordgot')));
    hand.to({ x: document.documentElement.clientWidth + W.GONE_PX, y, pose: 'clamp', rate: 4, bob: false });   // and takes it away
    await my.sleep(W.DRAG_MS);
  } catch (e) {
    if (e !== GONE) throw e;
  } finally {
    if (follow) follow();
    if (ghost) { ghost.remove(); ghost = null; }
    hand.leave();
    real.after(W.DRAG_MS, () => { if (!current()) root.classList.remove('hand-show'); });
    my.done();
  }
}

// the selection has to sit still a moment, with no button held, before it counts (a drag across the word is not a pick)
function later() {
  if (wait) wait();
  wait = real.after(W.SETTLE_MS, () => { wait = null; if (down) return; const p = picked(); if (p) snatch(p); });
}

export function install(a) {
  app = a;
  if (app.reduced) return;
  document.addEventListener('selectionchange', () => { if (!current() && hand.awake() && !isCrazy()) later(); });
  document.addEventListener('pointerdown', () => { down = true; }, true);
  document.addEventListener('pointerup', () => { down = false; if (!current() && hand.awake() && !isCrazy()) later(); }, true);
}
